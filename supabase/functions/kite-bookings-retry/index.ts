// Background retry worker for Kite WhatsApp bookings.
// Designed to be invoked by pg_cron (every few minutes) OR manually by an
// admin. It scans bookings stuck in `erro` (or `pending_whatsapp` for too
// long) and re-queues them by flipping the status and logging a retry event
// in `kite_booking_events`. Hard-capped at MAX_ATTEMPTS to avoid loops.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ATTEMPTS = 3;
const ERRO_RETRY_AFTER_MIN = 5;          // retry erro bookings after 5 min
const PENDING_ABANDON_AFTER_HOURS = 24;  // mark pending_whatsapp as erro after 24h

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth: accept either CRON_SECRET or the service-role key as bearer.
  const cronSecret = Deno.env.get("CRON_SECRET");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const provided = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
  const authorized =
    (cronSecret && provided === cronSecret) ||
    (provided && provided === serviceKey);
  if (!authorized) {
    return json(403, { error: "Forbidden" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey,
  );

  const now = Date.now();
  const erroCutoff = new Date(now - ERRO_RETRY_AFTER_MIN * 60 * 1000).toISOString();
  const pendingCutoff = new Date(now - PENDING_ABANDON_AFTER_HOURS * 3600 * 1000).toISOString();

  let retried = 0;
  let abandoned = 0;
  const ids: string[] = [];

  try {
    // 1) Retry bookings that errored.
    const { data: errored } = await supabase
      .from("kite_bookings")
      .select("id,status,created_at")
      .eq("status", "erro")
      .lt("created_at", erroCutoff)
      .limit(50);

    for (const b of errored || []) {
      // Count prior retry attempts.
      const { count } = await supabase
        .from("kite_booking_events")
        .select("id", { count: "exact", head: true })
        .eq("booking_id", b.id)
        .eq("event_type", "retry_attempt");

      if ((count ?? 0) >= MAX_ATTEMPTS) {
        await supabase.from("kite_booking_events").insert({
          booking_id: b.id,
          event_type: "retry_exhausted",
          note: `Retry cap reached (${MAX_ATTEMPTS}); manual intervention required`,
        });
        continue;
      }

      await supabase.from("kite_booking_events").insert({
        booking_id: b.id,
        event_type: "retry_attempt",
        note: `Auto-retry by background worker (attempt #${(count ?? 0) + 1})`,
      });
      await supabase.from("kite_bookings").update({ status: "pending_whatsapp" }).eq("id", b.id);
      retried += 1;
      ids.push(b.id);
    }

    // 2) Abandon ancient pending_whatsapp bookings.
    const { data: stale } = await supabase
      .from("kite_bookings")
      .select("id")
      .eq("status", "pending_whatsapp")
      .lt("created_at", pendingCutoff)
      .limit(50);

    for (const b of stale || []) {
      await supabase.from("kite_bookings").update({ status: "erro" }).eq("id", b.id);
      await supabase.from("kite_booking_events").insert({
        booking_id: b.id,
        event_type: "auto_abandoned",
        note: `No confirmation after ${PENDING_ABANDON_AFTER_HOURS}h`,
      });
      abandoned += 1;
    }

    return json(200, { ok: true, retried, abandoned, ids });
  } catch (err) {
    console.error("[kite-bookings-retry] error", err);
    return json(500, { ok: false, error: String(err) });
  }
});
