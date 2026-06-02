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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const service = s(body.service, 32).toLowerCase();
    const date = s(body.date, 32);
    const time = s(body.time, 16);
    const name = s(body.name, 120);
    const email = s(body.email, 200);

    const mapped = SERVICE_MAP[service];
    if (!mapped) {
      return new Response(JSON.stringify({ error: "Invalid service" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response(JSON.stringify({ error: "Invalid date" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return new Response(JSON.stringify({ error: "Invalid time" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Date must not be in the past
    const picked = new Date(`${date}T${time}:00`);
    if (isNaN(picked.getTime()) || picked.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
      return new Response(JSON.stringify({ error: "Date in the past" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

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
      return new Response(JSON.stringify({ error: "Failed to save booking" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ id: data.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[kite-whatsapp-booking] error", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
