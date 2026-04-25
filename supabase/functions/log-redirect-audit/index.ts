import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { logRedirectAudit, type AuditFlow, type AuditOutcome } from "../_shared/auditRedirect.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_OUTCOMES: ReadonlySet<AuditOutcome> = new Set([
  "ok",
  "fallback-empty",
  "fallback-disallowed",
  "fallback-traversal",
  "fallback-external-origin",
  "fallback-ambiguous",
]);

const ALLOWED_SOURCES = new Set([
  "experimente",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const flow: AuditFlow = body?.flow === "authed" ? "authed" : "visitor";
    const source: string = typeof body?.source === "string" && ALLOWED_SOURCES.has(body.source)
      ? body.source
      : "experimente";
    const outcomeRaw = typeof body?.outcome === "string" ? body.outcome : "ok";
    const outcome: AuditOutcome = ALLOWED_OUTCOMES.has(outcomeRaw as AuditOutcome)
      ? (outcomeRaw as AuditOutcome)
      : "ok";
    const preservedKeys = Array.isArray(body?.preservedKeys)
      ? body.preservedKeys.filter((k: unknown): k is string => typeof k === "string").slice(0, 32)
      : [];
    const resolvedPath = typeof body?.resolvedPath === "string" ? body.resolvedPath : null;

    // Try to attach user_id when an Authorization header is present.
    // Visitors send no Authorization header — that's fine (user_id stays null).
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader && flow === "authed") {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      );
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      userId = data.user?.id ?? null;
    }

    await logRedirectAudit({
      userId,
      flow,
      source,
      preservedKeys,
      resolvedPath,
      outcome,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
