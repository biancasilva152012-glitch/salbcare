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
    // SECURITY: require authentication. Previously this endpoint returned
    // patient PII and Google Meet URLs to ANY caller with a UUID, which is a
    // direct LGPD violation. Only the professional who owns the appointment
    // or the matching patient (by user_id / email) may read it.
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await adminSupabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;
    const userEmail = user.email?.toLowerCase() || "";

    const { teleconsultation_id, appointment_id } = await req.json();
    const lookupId = teleconsultation_id || appointment_id;

    if (!lookupId) {
      return new Response(JSON.stringify({ error: "Missing teleconsultation_id or appointment_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try teleconsultations table first
    if (teleconsultation_id) {
      const { data: tc } = await adminSupabase
        .from("teleconsultations")
        .select("room_url, date, duration, patient_name, status, user_id, patient_id")
        .eq("id", teleconsultation_id)
        .maybeSingle();

      if (tc) {
        // Authorization: caller must be the professional or the linked patient
        let allowed = tc.user_id === user.id;
        if (!allowed && tc.patient_id) {
          const { data: pat } = await adminSupabase
            .from("patients")
            .select("user_id, email")
            .eq("id", tc.patient_id)
            .maybeSingle();
          allowed = !!pat && (pat.user_id === user.id || pat.email?.toLowerCase() === userEmail);
        }
        if (!allowed) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

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
        .select("date, time, patient_name, status, user_id, appointment_type, patient_id")
        .eq("id", id)
        .maybeSingle();

      if (apt) {
        let allowed = apt.user_id === user.id;
        if (!allowed && apt.patient_id) {
          const { data: pat } = await adminSupabase
            .from("patients")
            .select("user_id, email")
            .eq("id", apt.patient_id)
            .maybeSingle();
          allowed = !!pat && (pat.user_id === user.id || pat.email?.toLowerCase() === userEmail);
        }
        if (!allowed) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

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
