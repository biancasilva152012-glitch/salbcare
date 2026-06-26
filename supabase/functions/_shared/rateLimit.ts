// Shared rate-limit + origin-validation middleware for Supabase Edge Functions.
//
// IMPORTANT: This module is an ad-hoc, DB-backed rate limit. Lovable Cloud
// does not provide a native rate-limiting primitive (no Redis/WAF), so each
// call adds one DB round-trip. A distributed attacker may also bypass IP
// limits — only the per-email/per-identifier limits resist large botnets.
//
// All callers must use the service-role client to invoke these helpers.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type RateLimitKeyType = "email" | "ip" | "composite";
export type RateLimitAction = "login" | "reset" | "sensitive";

export interface RateLimitResult {
  allowed: boolean;
  attempts: number;
  locked_until: string | null;
  reason: string;
}

/** Best-effort client IP extraction from common proxy headers. */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim().slice(0, 64);
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  ).slice(0, 64);
}

/** Allowlisted origins for the SalbCare web surface. */
export const ALLOWED_ORIGINS = [
  "https://salbcare.com",
  "https://www.salbcare.com",
  "https://salbcare.com.br",
  "https://www.salbcare.com.br",
  "https://salbcare.lovable.app",
];

/**
 * Returns true when the request Origin (if present) is on the allowlist.
 * Requests without an Origin header (server-to-server, curl) are allowed —
 * Origin enforcement is defense-in-depth against browser-driven abuse, not
 * a substitute for auth/auth checks.
 */
export function originAllowed(req: Request, extra: string[] = []): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  return [...ALLOWED_ORIGINS, ...extra].includes(origin);
}

/** Generic 403 response for origin rejections — does not leak the allowlist. */
export function originForbidden(corsHeaders: HeadersInit): Response {
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

let cachedAdmin: SupabaseClient | null = null;
function admin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;
  cachedAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  return cachedAdmin;
}

/**
 * Records an attempt and returns whether it is allowed. Use BEFORE doing
 * the sensitive work (so abusers don't get to call the real endpoint).
 */
export async function checkRateLimit(
  keyType: RateLimitKeyType,
  keyValue: string,
  action: RateLimitAction,
  windowSeconds = 900,
): Promise<RateLimitResult> {
  const { data, error } = await admin().rpc("check_and_record_rate_limit", {
    _key_type: keyType,
    _key_value: keyValue.toLowerCase().slice(0, 320),
    _action: action,
    _window_seconds: windowSeconds,
  });
  if (error || !data || !data[0]) {
    // Fail-open on infra error — rejecting all auth would be a worse DoS.
    return { allowed: true, attempts: 0, locked_until: null, reason: "infra_error" };
  }
  const row = data[0] as RateLimitResult;
  return row;
}

/** Clear counters after a SUCCESSFUL action so legit users aren't penalized. */
export async function clearRateLimit(
  keyType: RateLimitKeyType,
  keyValue: string,
  action: RateLimitAction,
): Promise<void> {
  await admin().rpc("clear_rate_limit", {
    _key_type: keyType,
    _key_value: keyValue.toLowerCase().slice(0, 320),
    _action: action,
  });
}

/**
 * Convenience: enforces BOTH per-IP and per-identifier (email/user) limits
 * for a sensitive action. Returns the response to send if blocked, or null
 * if the request may proceed.
 */
export async function enforceLimits(opts: {
  ip: string;
  identifier?: string | null;
  action: RateLimitAction;
  corsHeaders: HeadersInit;
  ipWindowSeconds?: number;
  idWindowSeconds?: number;
}): Promise<Response | null> {
  const ip = opts.ip || "unknown";
  const ipResult = await checkRateLimit("ip", ip, opts.action, opts.ipWindowSeconds ?? 900);
  if (!ipResult.allowed) {
    return tooManyRequests(opts.corsHeaders, ipResult);
  }
  if (opts.identifier) {
    const idResult = await checkRateLimit(
      "email",
      opts.identifier,
      opts.action,
      opts.idWindowSeconds ?? 900,
    );
    if (!idResult.allowed) {
      return tooManyRequests(opts.corsHeaders, idResult);
    }
  }
  return null;
}

function tooManyRequests(corsHeaders: HeadersInit, r: RateLimitResult): Response {
  // Intentionally generic — does not reveal which identifier was blocked or
  // remaining attempt count beyond the lock window. Same shape for all
  // sensitive endpoints to prevent enumeration.
  const retryAfter = r.locked_until
    ? Math.max(1, Math.ceil((new Date(r.locked_until).getTime() - Date.now()) / 1000))
    : 60;
  return new Response(
    JSON.stringify({
      error: "Muitas tentativas. Tente novamente em alguns minutos.",
      code: "rate_limited",
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    },
  );
}
