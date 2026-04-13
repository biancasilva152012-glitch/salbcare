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
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const [profileRes, transactionsRes] = await Promise.all([
      supabase.from("profiles").select("professional_type, name").eq("user_id", user.id).single(),
      supabase
        .from("financial_transactions")
        .select("amount, type, category, date")
        .eq("user_id", user.id)
        .gte("date", monthStart)
        .lte("date", monthEnd),
    ]);

    const profile = profileRes.data;
    const transactions = transactionsRes.data || [];

    const income = transactions.filter((t: any) => t.type === "income");
    const totalIncome = income.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const categories = [...new Set(transactions.map((t: any) => t.category))].filter(Boolean);

    const specialtyMap: Record<string, string> = {
      psicologo: "Psicologia",
      medico: "Medicina",
      nutricionista: "Nutrição",
      fisioterapeuta: "Fisioterapia",
      fonoaudiologo: "Fonoaudiologia",
      terapeuta_ocupacional: "Terapia Ocupacional",
      educador_fisico: "Educação Física",
      outro: "Outro",
    };

    const specialtyLabel = specialtyMap[(profile as any)?.professional_type] || (profile as any)?.professional_type || "não informada";

    const systemPrompt = `Você é uma mentora financeira especializada em profissionais de saúde autônomos no Brasil.
Responda sempre em português brasileiro informal.
Seja direta, prática e acolhedora.
Nunca dê conselhos jurídicos ou médicos.
Use os dados financeiros reais do profissional para personalizar suas respostas.

Dados financeiros do profissional este mês:
- Nome: ${(profile as any)?.name || "Profissional"}
- Especialidade: ${specialtyLabel}
- Total recebido no mês: R$ ${totalIncome.toFixed(2)}
- Número de recebimentos registrados: ${income.length}
- Categorias registradas: ${categories.length > 0 ? categories.join(", ") : "nenhuma"}

Com base nesses dados reais, responda a pergunta do profissional de forma personalizada.
Mantenha respostas curtas e práticas (máximo 3 parágrafos).`;

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
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao consultar IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
