import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um assistente de triagem de saúde da SALBCARE. Com base nos sintomas descritos pelo paciente, indique qual especialidade médica ou de saúde ele deve consultar entre as disponíveis:
- medico (Médico Clínico Geral)
- psicologo (Psicólogo)
- nutricionista (Nutricionista)
- fisioterapeuta (Fisioterapeuta)
- dentista (Cirurgião-Dentista)

Seja empático, claro e sempre oriente a buscar atendimento profissional. Nunca faça diagnósticos.
Responda sempre em português brasileiro.

IMPORTANTE: Você DEVE responder usando a ferramenta recommend_specialty. Analise os sintomas, duração e condições prévias do paciente para determinar a especialidade mais adequada. Se os sintomas indicarem urgência (dor no peito, dificuldade respiratória grave, sangramento intenso, perda de consciência, etc.), defina urgencia como "alta".`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms, duration, conditions } = await req.json();

    if (!symptoms || typeof symptoms !== "string" || symptoms.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Sintomas são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userMessage = `Sintomas do paciente: ${symptoms.trim()}
Duração: ${duration || "Não informado"}
Condições prévias: ${conditions || "Nenhuma informada"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_specialty",
              description: "Recomenda a especialidade médica mais adequada para os sintomas descritos.",
              parameters: {
                type: "object",
                properties: {
                  especialidade: {
                    type: "string",
                    enum: ["medico", "psicologo", "nutricionista", "fisioterapeuta", "dentista"],
                    description: "Chave da especialidade recomendada",
                  },
                  motivo: {
                    type: "string",
                    description: "Explicação empática e clara do motivo da recomendação, em português brasileiro",
                  },
                  urgencia: {
                    type: "string",
                    enum: ["normal", "alta"],
                    description: "Nível de urgência. Use 'alta' apenas para sintomas que podem indicar emergência médica",
                  },
                },
                required: ["especialidade", "motivo", "urgencia"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "recommend_specialty" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Serviço temporariamente indisponível. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Serviço temporariamente indisponível." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call in response");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-triage error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
