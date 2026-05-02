// Edge Function: notify-new-lead
// Recebe { lead_id } após o INSERT no front, busca o lead em leads_demo e
// envia notificação WhatsApp via CallMeBot para o número da Bianca.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_PHONE = "+5588996924700"; // CallMeBot exige + e DDI

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lead_id } = await req.json().catch(() => ({}));
    if (!lead_id || typeof lead_id !== "string") {
      return json({ error: "lead_id obrigatório" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: lead, error } = await supabase
      .from("leads_demo")
      .select("nome, email, whatsapp, dor_principal, created_at")
      .eq("id", lead_id)
      .single();

    if (error || !lead) {
      console.error("lead não encontrado", error);
      return json({ error: "lead não encontrado" }, 404);
    }

    const apiKey = Deno.env.get("CALLMEBOT_API_KEY");
    if (!apiKey) {
      console.error("CALLMEBOT_API_KEY ausente");
      return json({ error: "config ausente" }, 500);
    }

    const dataHora = new Date(lead.created_at).toLocaleString("pt-BR", {
      timeZone: "America/Fortaleza",
    });

    const message =
      `🚀 NOVO LEAD SALBCARE\n\n` +
      `👤 Nome: ${lead.nome}\n` +
      `📧 E-mail: ${lead.email}\n` +
      `📱 WhatsApp: ${lead.whatsapp}\n` +
      `😣 Maior dor: ${lead.dor_principal}\n` +
      `🕐 Recebido em: ${dataHora}`;

    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
      ADMIN_PHONE
    )}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;

    const resp = await fetch(url);
    const body = await resp.text();

    if (!resp.ok) {
      console.error("CallMeBot falhou", resp.status, body);
      return json({ error: "envio falhou", details: body }, 502);
    }

    return json({ ok: true });
  } catch (err) {
    console.error("notify-new-lead erro", err);
    return json({ error: String(err?.message ?? err) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
