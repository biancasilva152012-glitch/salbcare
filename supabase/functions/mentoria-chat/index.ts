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

    // ── Fetch rich financial context ──────────────────────────────
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
    const twoMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split("T")[0];
    const twoMonthsAgoEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0).toISOString().split("T")[0];

    const [profileRes, thisMonthRes, lastMonthRes, twoMonthsRes, expenseRes, lastMsgRes] = await Promise.all([
      supabase.from("profiles").select("professional_type, name, plan, created_at").eq("user_id", user.id).single(),
      supabase.from("financial_transactions").select("amount, type, category, date").eq("user_id", user.id).gte("date", thisMonthStart).lte("date", thisMonthEnd),
      supabase.from("financial_transactions").select("amount, type, category").eq("user_id", user.id).gte("date", lastMonthStart).lte("date", lastMonthEnd),
      supabase.from("financial_transactions").select("amount, type").eq("user_id", user.id).eq("type", "income").gte("date", twoMonthsAgoStart).lte("date", twoMonthsAgoEnd),
      supabase.from("financial_transactions").select("amount, category").eq("user_id", user.id).eq("type", "expense").gte("date", thisMonthStart).lte("date", thisMonthEnd),
      // Get last assistant message for continuity
      supabase.from("mentorship_messages").select("content").eq("professional_id", user.id).eq("role", "assistant").order("created_at", { ascending: false }).limit(1),
    ]);

    const profile = profileRes.data as any;
    const thisMonthTx = thisMonthRes.data || [];
    const lastMonthTx = lastMonthRes.data || [];
    const twoMonthsTx = twoMonthsRes.data || [];

    const thisIncome = thisMonthTx.filter((t: any) => t.type === "income");
    const totalThisMonth = thisIncome.reduce((s: number, t: any) => s + Number(t.amount), 0);
    const consultasThisMonth = thisIncome.length;
    const ticketMedio = consultasThisMonth > 0 ? totalThisMonth / consultasThisMonth : 0;
    
    const lastIncome = lastMonthTx.filter((t: any) => t.type === "income");
    const totalLastMonth = lastIncome.reduce((s: number, t: any) => s + Number(t.amount), 0);
    const consultasLastMonth = lastIncome.length;
    
    const totalTwoMonthsAgo = twoMonthsTx.reduce((s: number, t: any) => s + Number(t.amount), 0);

    const thisExpenses = thisMonthTx.filter((t: any) => t.type === "expense");
    const totalExpenses = thisExpenses.reduce((s: number, t: any) => s + Number(t.amount), 0);
    const lastExpenses = lastMonthTx.filter((t: any) => t.type === "expense");
    const totalLastExpenses = lastExpenses.reduce((s: number, t: any) => s + Number(t.amount), 0);

    const catCounts: Record<string, number> = {};
    thisExpenses.forEach((t: any) => { catCounts[t.category] = (catCounts[t.category] || 0) + Number(t.amount); });
    const topExpenseCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];

    const specialtyMap: Record<string, string> = {
      psicologo: "Psicologia", medico: "Medicina", nutricionista: "Nutrição",
      fisioterapeuta: "Fisioterapia", fonoaudiologo: "Fonoaudiologia",
      terapeuta_ocupacional: "Terapia Ocupacional", educador_fisico: "Educação Física", outro: "Outro",
    };
    const specialtyLabel = specialtyMap[profile?.professional_type] || profile?.professional_type || "não informada";
    const firstName = (profile?.name || "Profissional").split(" ")[0];
    const plan = profile?.plan || "free";
    const createdAt = profile?.created_at ? new Date(profile.created_at) : now;
    const monthsUsing = Math.max(1, Math.round((now.getTime() - createdAt.getTime()) / (30.44 * 24 * 60 * 60 * 1000)));

    // Trend analysis
    const faturamentoDelta = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth * 100).toFixed(1) : "N/A";
    const lucroMes = totalThisMonth - totalExpenses;
    const lucroPct = totalThisMonth > 0 ? ((lucroMes / totalThisMonth) * 100).toFixed(0) : "0";

    const lastAssistantMsg = (lastMsgRes.data?.[0] as any)?.content || "";
    const lastConversationHint = lastAssistantMsg
      ? `\nÚltima coisa que você disse na sessão anterior (use para dar continuidade): "${lastAssistantMsg.substring(0, 200)}..."`
      : "";

    const fmt = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const systemPrompt = `Você é a Mentora Financeira pessoal de ${firstName}, profissional de ${specialtyLabel} que usa o SalbCare. Você JÁ TEM ACESSO aos dados reais dele no sistema.

DADOS REAIS DE ${firstName.toUpperCase()} (USE SEMPRE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Faturamento este mês: R$ ${fmt(totalThisMonth)} (${consultasThisMonth} consultas)
• Faturamento mês passado: R$ ${fmt(totalLastMonth)} (${consultasLastMonth} consultas)
• Faturamento 2 meses atrás: R$ ${fmt(totalTwoMonthsAgo)}
• Ticket médio atual: R$ ${fmt(ticketMedio)}
• Variação faturamento vs mês anterior: ${faturamentoDelta}%
• Despesas registradas este mês: R$ ${fmt(totalExpenses)}
• Despesas mês passado: R$ ${fmt(totalLastExpenses)}
• Maior gasto: ${topExpenseCategory ? `${topExpenseCategory[0]} (R$ ${fmt(topExpenseCategory[1])})` : "nenhum registrado"}
• Lucro líquido do mês: R$ ${fmt(lucroMes)} (margem ${lucroPct}%)
• Plano: ${plan}
• Especialidade: ${specialtyLabel}
• Meses usando SalbCare: ${monthsUsing}
${lastConversationHint}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REGRAS DE OURO (SIGA RIGOROSAMENTE):

1. NUNCA comece com "Olá", "Oi" ou saudações genéricas. Vá DIRETO ao ponto com o nome do usuário e um insight específico dos dados dele.

2. SEMPRE cite números reais do perfil dele na primeira frase. Ex: "${firstName}, seus R$ ${fmt(totalThisMonth)} esse mês vieram de ${consultasThisMonth} consultas..."

3. Use comparações que CHOCAM: "Você ganhou R$ X esse mês — equivale a Y consultas. Mas perdeu Z% disso sem perceber com [gasto]."

4. DETECTE padrões automaticamente:
   - Se faturamento caiu vs mês anterior: DIGA com o percentual exato
   - Se ticket médio subiu: CELEBRE com o número
   - Se não tem gastos registrados: ALERTE sobre o impacto real disso na declaração
   - Se lucro é baixo comparado ao faturamento: MOSTRE onde está indo o dinheiro

5. Cada resposta DEVE ter:
   → 1 diagnóstico com número REAL
   → 1 causa provável baseada nos dados
   → 1 micro-ação que pode ser feita em 5 minutos

6. Termine SEMPRE com uma pergunta direta e PESSOAL (não genérica). Ex: "${firstName}, você já separou os R$ ${fmt(totalThisMonth * 0.15)} de imposto desse mês ou usou tudo?"

7. Tom: mentora que fala a verdade com carinho. Direta, útil, levemente provocadora. Como uma amiga CFO que quer te ver prosperar.

8. Máximo 4 parágrafos curtos. ZERO jargão financeiro complexo. Use "guardar" em vez de "provisionar", "lucro" em vez de "margem operacional".

9. Nunca dê conselhos jurídicos ou médicos.

10. Se o total recebido for R$ 0, diga: "${firstName}, ainda não vi nenhum recebimento registrado esse mês. Registra o primeiro lá no Financeiro e volta aqui — aí sim a conversa fica boa."

EXEMPLO DE RESPOSTA IDEAL:
"${firstName}, seus R$ ${fmt(totalThisMonth)} esse mês vieram de ${consultasThisMonth} consultas a um ticket médio de R$ ${fmt(ticketMedio)}. ${totalLastMonth > totalThisMonth ? `Isso é ${faturamentoDelta}% menos que mês passado. Olha, não é pra assustar, mas se continuar nesse ritmo você fecha o ano com R$ ${fmt(totalThisMonth * 12)} — e dá pra mais.` : `Isso é ${faturamentoDelta}% mais que mês passado. Parabéns — mas não gasta tudo.`}

${totalExpenses > 0 ? `Seus gastos de R$ ${fmt(totalExpenses)} comem ${lucroPct === "0" ? "quase tudo" : `${100 - parseInt(lucroPct)}%`} do que entra. Sua maior despesa é ${topExpenseCategory?.[0] || "geral"}.` : `Você não registrou nenhuma despesa esse mês. Isso não significa que não gastou — significa que você não sabe quanto sobrou. Registra pelo menos 3 gastos fixos agora.`}

👉 ${firstName}, se você pudesse cortar R$ ${fmt(totalExpenses * 0.1)} de despesas esse mês, onde seria?"`;

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
