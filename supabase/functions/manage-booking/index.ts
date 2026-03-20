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

    const { action, appointment_id, receipt_url } = await req.json();

    if (!action || !appointment_id) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "upload_receipt") {
      // Patient uploaded receipt — update status
      if (!appointment_id || !receipt_url) {
        return new Response(JSON.stringify({ error: "Dados incompletos" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("appointments")
        .update({
          receipt_url,
          status: "aguardando_confirmacao",
        })
        .eq("id", appointment_id)
        .eq("status", "aguardando_comprovante");

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "approve" || action === "reject") {
      // Professional approving or rejecting — verify they own it
      const authHeader = req.headers.get("authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Não autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Não autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify the appointment belongs to this professional
      const { data: appt, error: apptError } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", appointment_id)
        .eq("user_id", user.id)
        .single();

      if (apptError) {
        console.error("Appointment lookup error:", apptError);
      }

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
