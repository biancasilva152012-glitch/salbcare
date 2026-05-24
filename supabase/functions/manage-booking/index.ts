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
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Método não permitido" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // SECURITY: require authentication for ALL actions (including upload_receipt)
    // to prevent unauthenticated mutation of appointments and injection of
    // arbitrary receipt URLs.
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const { action, appointment_id, receipt_url } = await req.json();

    if (!action || !appointment_id) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "upload_receipt") {
      if (!receipt_url || typeof receipt_url !== "string") {
        return new Response(JSON.stringify({ error: "Dados incompletos" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // SECURITY: receipt_url must be an https URL inside our Supabase storage
      // host to prevent attackers attaching phishing/malicious links.
      const allowedOrigin = new URL(supabaseUrl).origin;
      let parsed: URL;
      try {
        parsed = new URL(receipt_url);
      } catch {
        return new Response(JSON.stringify({ error: "URL inválida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (parsed.protocol !== "https:" || parsed.origin !== allowedOrigin) {
        return new Response(JSON.stringify({ error: "URL de comprovante não permitida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // SECURITY: only the appointment's patient (matched by email) or its
      // professional may upload a receipt — and only while the appointment is
      // awaiting one.
      const { data: appt, error: apptErr } = await supabase
        .from("appointments")
        .select("id, user_id, status, patient_id")
        .eq("id", appointment_id)
        .maybeSingle();

      if (apptErr || !appt) {
        return new Response(JSON.stringify({ error: "Agendamento não encontrado" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (appt.status !== "aguardando_comprovante") {
        return new Response(JSON.stringify({ error: "Agendamento não aceita comprovante" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isProfessional = appt.user_id === user.id;
      // Optional patient ownership check via patients.user_id
      let isPatient = false;
      if (!isProfessional && appt.patient_id) {
        const { data: pat } = await supabase
          .from("patients")
          .select("user_id, email")
          .eq("id", appt.patient_id)
          .maybeSingle();
        if (pat && (pat.user_id === user.id || pat.email?.toLowerCase() === user.email?.toLowerCase())) {
          isPatient = true;
        }
      }
      if (!isProfessional && !isPatient) {
        return new Response(JSON.stringify({ error: "Acesso negado" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("appointments")
        .update({ receipt_url, status: "aguardando_confirmacao" })
        .eq("id", appointment_id)
        .eq("status", "aguardando_comprovante");

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "approve" || action === "reject") {
      // Verify the appointment belongs to this professional
      const { data: appt, error: apptError } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", appointment_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (apptError) console.error("Appointment lookup error:", apptError);
      if (!appt) {
        return new Response(JSON.stringify({ error: "Agendamento não encontrado" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!["aguardando_confirmacao", "aguardando_comprovante"].includes(appt.status)) {
        return new Response(JSON.stringify({ error: "Agendamento já foi processado" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newStatus = action === "approve" ? "scheduled" : "cancelled";
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointment_id)
        .in("status", ["aguardando_confirmacao", "aguardando_comprovante"]);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, status: newStatus }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
