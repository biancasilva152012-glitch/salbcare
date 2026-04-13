import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch financial context
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];

    const [profileRes, thisMonthRes, lastMonthRes] = await Promise.all([
      supabase.from("profiles").select("professional_type, name, created_at").eq("user_id", user.id).single(),
      supabase
        .from("financial_transactions")
        .select("amount, type, category, date")
        .eq("user_id", user.id)
        .gte("date", thisMonthStart)
        .lte("date", thisMonthEnd),
      supabase
        .from("financial_transactions")
        .select("amount, type, category")
        .eq("user_id", user.id)
        .gte("date", lastMonthStart)
        .lte("date", lastMonthEnd),
    ]);

    const profile = profileRes.data as any;
    const thisMonthTx = thisMonthRes.data || [];
    const lastMonthTx = lastMonthRes.data || [];

    const thisIncome = thisMonthTx.filter((t: any) => t.type === "income");
    const totalThisMonth = thisIncome.reduce((s: number, t: any) => s + Number(t.amount), 0);
    const lastIncome = lastMonthTx.filter((t: any) => t.type === "income");
    const totalLastMonth = lastIncome.reduce((s: number, t: any) => s + Number(t.amount), 0);

    const expenses = thisMonthTx.filter((t: any) => t.type === "expense");
    const catCounts: Record<string, number> = {};
    expenses.forEach((t: any) => { catCounts[t.category] = (catCounts[t.category] || 0) + Number(t.amount); });
    const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "nenhuma";

    const specialtyMap: Record<string, string> = {
      psicologo: "Psicologia", medico: "Medicina", nutricionista: "Nutrição",
      fisioterapeuta: "Fisioterapia", fonoaudiologo: "Fonoaudiologia",
      terapeuta_ocupacional: "Terapia Ocupacional", educador_fisico: "Educação Física", outro: "Outro",
    };
    const specialtyLabel = specialtyMap[profile?.professional_type] || profile?.professional_type || "não informada";

    const firstName = (profile?.name || "Profissional").split(" ")[0];
    const createdAt = profile?.created_at ? new Date(profile.created_at) : now;
    const monthsUsing = Math.max(1, Math.round((now.getTime() - createdAt.getTime()) / (30.44 * 24 * 60 * 60 * 1000)));

    const systemPrompt = `Você é um mentor financeiro direto, prático e levemente provocador.
Responda sempre em português brasileiro informal.
Nunca dê conselhos jurídicos ou médicos.

Seu objetivo:
- Transformar qualquer dado do usuário em um insight acionável
- Falar de forma simples e humana (sem termos técnicos)
- Sempre conectar com dinheiro, segurança e futuro
- SEMPRE terminar com uma pergunta que leve à ação

Regras:
- Use números concretos SEMPRE (nunca seja vago)
- Faça projeções simples (mensal, reserva, ritmo)
- Dê sugestões pequenas e práticas (ex: "guardar R$40 hoje")
- NUNCA seja genérico — use os dados reais abaixo
- Máximo 5 linhas. Seja direto.
- Estrutura: Dado → Insight → Micro-ação → Pergunta

Tom: conversa de mentor (não robô). Direto, útil, levemente provocador quando fizer sentido.

Dados reais de ${firstName}:
- Especialidade: ${specialtyLabel}
- Total recebido este mês: R$ ${totalThisMonth.toFixed(2)}
- Total recebido mês passado: R$ ${totalLastMonth.toFixed(2)}
- Consultas registradas este mês: ${thisIncome.length}
- Maior categoria de gasto: ${topCategory}
- Meses usando a plataforma: ${monthsUsing}

Exemplo de resposta ideal:
"Você já fez R$1.200 esse mês. Se quiser segurança, o ideal seria guardar pelo menos R$240. Se continuar nesse ritmo, dá pra fechar o mês com ~R$4.000. 👉 Você já separou alguma parte ou ainda está usando tudo?"

Se o total recebido for R$0, diga algo como: "${firstName}, ainda não vi nenhum recebimento registrado. Registra o primeiro lá no Financeiro e volta aqui — aí sim a conversa fica boa."`;


    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao consultar IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("mentoria-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
