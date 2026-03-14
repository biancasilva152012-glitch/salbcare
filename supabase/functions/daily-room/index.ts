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
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    const { action, teleconsultation_id } = await req.json();
    const DAILY_API_KEY = Deno.env.get("DAILY_API_KEY");
    if (!DAILY_API_KEY) {
      return new Response(JSON.stringify({ error: "Daily API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create-room") {
      // Auth check
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get teleconsultation to calculate expiry
      const { data: tc } = await supabase
        .from("teleconsultations")
        .select("date, duration")
        .eq("id", teleconsultation_id)
        .single();

      if (!tc) {
        return new Response(JSON.stringify({ error: "Teleconsultation not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const roomName = `salb-${teleconsultation_id.replace(/-/g, "").slice(0, 16)}`;
      const durationMin = tc.duration || 30;
      const endTime = new Date(new Date(tc.date).getTime() + (durationMin + 30) * 60 * 1000);
      const expSeconds = Math.floor(endTime.getTime() / 1000);

      // Create room on Daily.co
      const dailyRes = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roomName,
          properties: {
            exp: expSeconds,
            enable_recording: false,
            enable_chat: true,
            start_video_off: true,
            start_audio_off: false,
            max_participants: 4,
            lang: "pt",
          },
        }),
      });

      if (!dailyRes.ok) {
        const err = await dailyRes.text();
        // Room may already exist, try to get it
        if (dailyRes.status === 400 && err.includes("already exists")) {
          const getRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
            headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
          });
          if (getRes.ok) {
            const existingRoom = await getRes.json();
            // Update teleconsultation with room info
            await supabase
              .from("teleconsultations")
              .update({ room_name: roomName, room_url: existingRoom.url })
              .eq("id", teleconsultation_id);

            return new Response(
              JSON.stringify({ room_name: roomName, room_url: existingRoom.url }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
        return new Response(JSON.stringify({ error: "Failed to create room", details: err }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const room = await dailyRes.json();

      // Update teleconsultation with room info
      await supabase
        .from("teleconsultations")
        .update({ room_name: roomName, room_url: room.url })
        .eq("id", teleconsultation_id);

      return new Response(
        JSON.stringify({ room_name: roomName, room_url: room.url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get-room") {
      // Public access for patients - no auth required
      const adminSupabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: tc } = await adminSupabase
        .from("teleconsultations")
        .select("room_url, room_name, date, duration, patient_name, status, user_id")
        .eq("id", teleconsultation_id)
        .single();

      if (!tc) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get doctor name
      const { data: profile } = await adminSupabase
        .from("profiles")
        .select("name, professional_type")
        .eq("user_id", tc.user_id)
        .single();

      return new Response(
        JSON.stringify({
          room_url: tc.room_url,
          room_name: tc.room_name,
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

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
