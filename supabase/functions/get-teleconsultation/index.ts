import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teleconsultation_id, appointment_id } = await req.json();
    const lookupId = teleconsultation_id || appointment_id;

    if (!lookupId) {
      return new Response(JSON.stringify({ error: "Missing teleconsultation_id or appointment_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try teleconsultations table first
    if (teleconsultation_id) {
      const { data: tc } = await adminSupabase
        .from("teleconsultations")
        .select("room_url, date, duration, patient_name, status, user_id")
        .eq("id", teleconsultation_id)
        .single();

      if (tc) {
        const { data: profile } = await adminSupabase
          .from("profiles")
          .select("name, professional_type, meet_link")
          .eq("user_id", tc.user_id)
          .single();

        return new Response(
          JSON.stringify({
            room_url: tc.room_url || profile?.meet_link || null,
            date: tc.date,
            duration: tc.duration,
            patient_name: tc.patient_name,
            status: tc.status,
            doctor_name: profile?.name || "",
            professional_type: profile?.professional_type || "medico",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Try appointments table (for patient-booked appointments)
    if (appointment_id || teleconsultation_id) {
      const id = appointment_id || teleconsultation_id;
      const { data: apt } = await adminSupabase
        .from("appointments")
        .select("date, time, patient_name, status, user_id, appointment_type")
        .eq("id", id)
        .single();

      if (apt) {
        const { data: profile } = await adminSupabase
          .from("profiles")
          .select("name, professional_type, meet_link")
          .eq("user_id", apt.user_id)
          .single();

        return new Response(
          JSON.stringify({
            room_url: profile?.meet_link || null,
            date: `${apt.date}T${apt.time}`,
            duration: null,
            patient_name: apt.patient_name,
            status: apt.status,
            doctor_name: profile?.name || "",
            professional_type: profile?.professional_type || "medico",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
