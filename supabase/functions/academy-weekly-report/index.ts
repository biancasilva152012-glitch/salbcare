// academy-weekly-report
// Envia por e-mail o resumo semanal: compras da Academy, valor total,
// assinaturas ativas e proximos vencimentos.
// Roda por agendamento semanal e tambem pode ser disparada pela administracao.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const ADMIN_EMAIL = "biancadealbuquerquep@gmail.com";

// Preco de tabela de cada material, em reais, para somar o valor da semana.
const PRODUCT_INFO: Record<string, { title: string; price: number }> = {
  "ingles-para-atendimento-em-saude": { title: "Apostila de Ingles", price: 29.9 },
  "espanhol-para-atendimento-em-saude": { title: "Apostila de Espanhol", price: 29.9 },
  "international-healthcare-kit": { title: "International Healthcare Kit", price: 47.0 },
};

const brl = (n: number) =>
  `R$ ${n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

const dateBR = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Fortaleza" }) : "sem data";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const since = new Date(Date.now() - 7 * 86400000);
    const periodLabel = `${dateBR(since.toISOString())} a ${dateBR(new Date().toISOString())}`;

    const { data: purchases } = await admin
      .from("academy_purchases")
      .select("slug, created_at")
      .gte("created_at", since.toISOString());

    const rows = purchases ?? [];
    const byProduct = new Map<string, number>();
    let revenue = 0;
    for (const p of rows) {
      const info = PRODUCT_INFO[String(p.slug)];
      const title = info?.title ?? String(p.slug);
      byProduct.set(title, (byProduct.get(title) ?? 0) + 1);
      revenue += info?.price ?? 0;
    }

    const { data: subs } = await admin
      .from("pro_subscriptions")
      .select("plan, status, current_period_end")
      .order("current_period_end", { ascending: true });

    const subsList = (subs ?? []).map((s) => ({
      plan: String(s.plan ?? "plano"),
      status: String(s.status ?? "sem status"),
      renewsOn: dateBR(s.current_period_end as string | null),
    }));
    const activeSubscriptions = (subs ?? []).filter((s) =>
      ["active", "trialing", "past_due"].includes(String(s.status)),
    ).length;

    const week = new Date().toISOString().slice(0, 10);
    const result = await sendTemplateEmail("academy-weekly-report", ADMIN_EMAIL, {
      idempotencyKey: `academy-weekly-report-${week}`,
      templateData: {
        periodLabel,
        purchases: rows.length,
        revenue: brl(revenue),
        activeSubscriptions,
        purchasesByProduct: [...byProduct].map(([title, count]) => ({ title, count })),
        subscriptions: subsList,
      },
    });

    return json({ ok: true, sent: result.sent, purchases: rows.length, revenue: brl(revenue) });
  } catch (error) {
    console.error("[ACADEMY-WEEKLY-REPORT]", error instanceof Error ? error.message : error);
    return json({ ok: false, error: "Falha ao enviar o relatorio." }, 500);
  }
});
