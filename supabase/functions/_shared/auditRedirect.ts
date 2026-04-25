/**
 * Shared audit logger for safe-redirect events across edge functions.
 *
 * Writes to public.redirect_audit_events using the service role client.
 * Never logs query VALUES — only the NAMES of preserved keys (utm_*, ref).
 *
 * Failures are swallowed with a console.warn — auditing must never break
 * the user-facing flow.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export type AuditFlow = "visitor" | "authed";
export type AuditOutcome =
  | "ok"
  | "fallback-empty"
  | "fallback-disallowed"
  | "fallback-traversal"
  | "fallback-external-origin"
  | "fallback-ambiguous";

export type AuditRedirectInput = {
  userId: string | null;
  flow: AuditFlow;
  source: string; // 'experimente' | 'create-checkout' | 'customer-portal' | 'stripe-portal'
  preservedKeys: ReadonlyArray<string>;
  resolvedPath: string | null;
  outcome: AuditOutcome;
};

const KEY_RE = /^[A-Za-z0-9_\-]+$/;

function sanitizeKeys(keys: ReadonlyArray<string>): string[] {
  const seen = new Set<string>();
  for (const raw of keys) {
    if (typeof raw !== "string") continue;
    if (raw.length === 0 || raw.length > 64) continue;
    if (!KEY_RE.test(raw)) continue;
    seen.add(raw);
  }
  return [...seen].sort();
}

export async function logRedirectAudit(input: AuditRedirectInput): Promise<void> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return;

    const client = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    const { error } = await client.from("redirect_audit_events").insert({
      user_id: input.userId,
      flow: input.flow,
      source: input.source.slice(0, 64),
      preserved_keys: sanitizeKeys(input.preservedKeys),
      resolved_path: input.resolvedPath?.slice(0, 256) ?? null,
      outcome: input.outcome,
    });
    if (error) {
      console.warn("[auditRedirect] insert failed", error.message);
    }
  } catch (err) {
    console.warn(
      "[auditRedirect] unexpected failure",
      err instanceof Error ? err.message : String(err),
    );
  }
}
