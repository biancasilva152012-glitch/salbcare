import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SERVICE_MAP: Record<string, { type: string; procedure: string }> = {
  dental: { type: "presencial", procedure: "dental-checkup" },
  physio: { type: "presencial", procedure: "physio-recovery" },
  telehealth: { type: "online", procedure: "telehealth-general" },
};

function s(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // === Retry path: re-attempt against an existing booking that errored ===
    const retryId = s(body.retry_booking_id, 64);
    if (retryId) {
      const { data: existing, error: fetchErr } = await supabase
        .from("kite_bookings")
        .select("id,status")
        .eq("id", retryId)
        .maybeSingle();
      if (fetchErr || !existing) return json(404, { error: "Booking not found" });

      const attempt = Math.max(1, Math.min(10, Number(body.attempt) || 1));
      await supabase.from("kite_booking_events").insert({
        booking_id: existing.id,
        event_type: "retry_attempt",
        note: `Retry attempt #${attempt}`,
      });

      // Flip from erro -> pending_whatsapp so the lifecycle resumes.
      if (existing.status === "erro") {
        await supabase.from("kite_bookings").update({ status: "pending_whatsapp" }).eq("id", existing.id);
      }
      return json(200, { id: existing.id, retried: true, attempt });
    }

    // === Standard create path ===
    const service = s(body.service, 32).toLowerCase();
    const date = s(body.date, 32);
    const time = s(body.time, 16);
    const name = s(body.name, 120);
    const email = s(body.email, 200);

    const mapped = SERVICE_MAP[service];
    if (!mapped) return json(400, { error: "Invalid service", field: "service" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(400, { error: "Invalid date", field: "date" });
    if (!/^\d{2}:\d{2}$/.test(time)) return json(400, { error: "Invalid time", field: "time" });

    const picked = new Date(`${date}T${time}:00`);
    if (isNaN(picked.getTime()) || picked.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
      return json(400, { error: "Date in the past", field: "date" });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(400, { error: "Invalid email", field: "email" });
    }

    const patient_name = name || "WhatsApp lead";
    const { data, error } = await supabase
      .from("kite_bookings")
      .insert({
        type: mapped.type,
        procedure: mapped.procedure,
        patient_name,
        email: email || "whatsapp-lead@salbcare.com.br",
        preferred_date: date,
        time_preference: time,
        status: "pending_whatsapp",
        amount_paid: 0,
        remaining_balance: 0,
        notes: `WhatsApp booking — service=${service}`,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[kite-whatsapp-booking] insert error", error);
      return json(500, { error: "Failed to save booking" });
    }
    return json(200, { id: data.id });
  } catch (err) {
    console.error("[kite-whatsapp-booking] error", err);
    return json(500, { error: "Unexpected error" });
  }
});
