// auth-gate
// =========
// Public, unauthenticated edge function that intercepts the two most-abused
// auth surfaces — password login and password reset — and applies progressive
// per-email + per-IP rate limiting BEFORE calling the underlying auth API.
//
// Why a gate instead of a client-side limit:
//  - Client-side checks (in React) only slow the UI; a curl/script attacker
//    bypasses them entirely. The gate keeps the count in Postgres so the
//    limit cannot be skipped from outside.
//
// Generic responses
//  - Login: success returns the full Supabase session; failure ALWAYS returns
//    the same "invalid_credentials" payload, regardless of whether the email
//    exists, the password is wrong, or the user is locked. This blocks user
//    enumeration via timing/error-shape inspection.
//  - Reset: always returns `{ ok: true }` even if the email does not exist,
//    matching Supabase's own anti-enumeration behavior, but adds a rate
//    limit so attackers cannot probe addresses at scale.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  checkRateLimit,
  clearRateLimit,
  getClientIp,
  originAllowed,
} from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const EMAIL_RE = /^[^\s@]{1,254}@[^\s@]{1,254}\.[^\s@]{1,254}$/;
const MAX_PASSWORD = 200;
const MAX_REDIRECT = 500;

const ALLOWED_REDIRECT_HOSTS = new Set([
  "salbcare.com",
  "www.salbcare.com",
  "salbcare.com.br",
  "www.salbcare.com.br",
  "salbcare.lovable.app",
  "localhost",
]);

function safeRedirect(input: unknown): string | null {
  if (typeof input !== "string" || input.length === 0 || input.length > MAX_REDIRECT) {
    return null;
  }
  try {
    const u = new URL(input);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (!ALLOWED_REDIRECT_HOSTS.has(u.hostname)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

function json(status: number, body: unknown, extraHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, ...extraHeaders, "Content-Type": "application/json" },
  });
}

const GENERIC_INVALID = { error: "invalid_credentials", message: "E-mail ou senha incorretos." };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  // Origin check (defense-in-depth — browser-originated abuse only).
  if (!originAllowed(req)) {
    return json(403, { error: "forbidden" });
  }

  const ip = getClientIp(req);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const action = String(body?.action || "");
  const emailRaw = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (action === "login") {
    const password = typeof body?.password === "string" ? body.password : "";
    if (!EMAIL_RE.test(emailRaw) || !password || password.length > MAX_PASSWORD) {
      // Still record the attempt so brute-force with garbage input is limited.
      await checkRateLimit("ip", ip, "login");
      return json(400, GENERIC_INVALID);
    }

    // 1) IP limit (catches credential-stuffing across many emails).
    const ipRes = await checkRateLimit("ip", ip, "login", 900);
    if (!ipRes.allowed) {
      return json(
        429,
        { error: "rate_limited", message: "Muitas tentativas deste dispositivo. Tente em alguns minutos." },
        { "Retry-After": retryAfter(ipRes.locked_until) },
      );
    }
    // 2) Per-email limit (catches targeted brute force).
    const emailRes = await checkRateLimit("email", emailRaw, "login", 900);
    if (!emailRes.allowed) {
      // Generic message — does not confirm the email exists.
      return json(
        429,
        { error: "rate_limited", message: "Muitas tentativas. Tente em alguns minutos." },
        { "Retry-After": retryAfter(emailRes.locked_until) },
      );
    }

    // Use anon-key client so the resulting session is a normal user session
    // (NOT minted via service-role admin). This means RLS still applies.
    const anonClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { data, error } = await anonClient.auth.signInWithPassword({ email: emailRaw, password });
    if (error || !data?.session) {
      return json(401, GENERIC_INVALID);
    }

    // Successful login — clear counters for both keys.
    await clearRateLimit("email", emailRaw, "login");
    await clearRateLimit("ip", ip, "login");

    return json(200, {
      ok: true,
      session: data.session,
      user: { id: data.user?.id, email: data.user?.email },
    });
  }

  if (action === "reset") {
    const redirectTo = safeRedirect(body?.redirectTo) ?? `${ALLOWED_REDIRECT_HOSTS.has("salbcare.com") ? "https://salbcare.com" : ""}/reset-password`;

    if (!EMAIL_RE.test(emailRaw)) {
      // Generic ok — never confirm whether an address is registered.
      await checkRateLimit("ip", ip, "reset");
      return json(200, { ok: true });
    }

    const ipRes = await checkRateLimit("ip", ip, "reset", 3600);
    if (!ipRes.allowed) {
      return json(
        429,
        { error: "rate_limited", message: "Muitas solicitações. Tente em alguns minutos." },
        { "Retry-After": retryAfter(ipRes.locked_until) },
      );
    }
    const emailRes = await checkRateLimit("email", emailRaw, "reset", 3600);
    if (!emailRes.allowed) {
      // Still return ok so we don't leak that this address is being throttled.
      return json(200, { ok: true });
    }

    // Use service-role to trigger the email; the response shape never reveals
    // whether the address resolved to a real user.
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    await admin.auth.resetPasswordForEmail(emailRaw, { redirectTo });
    return json(200, { ok: true });
  }

  return json(400, { error: "unknown_action" });
});

function retryAfter(lockedUntil: string | null): string {
  if (!lockedUntil) return "60";
  const secs = Math.max(1, Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 1000));
  return String(secs);
}
