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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const authHeader = req.headers.get("authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { file_path, plan_key, expected_amount } = await req.json();
    if (!file_path || !expected_amount) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the receipt image from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("payment-receipts")
      .download(file_path);
    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: "Erro ao acessar comprovante" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    const mimeType = fileData.type || "image/png";

    // Use Lovable AI (Gemini) to analyze the receipt
    const today = new Date();
    const todayStr = today.toLocaleDateString("pt-BR");
    const amountStr = Number(expected_amount).toFixed(2).replace(".", ",");

    const aiResponse = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analise esta imagem de comprovante de pagamento. Extraia o texto visível e verifique se contém TODOS estes critérios:
1. Palavras-chave: "Pix" ou "PIX" ou "pix" ou "Comprovante" ou "comprovante" ou "Transferência"
2. Valor: R$ ${amountStr} (ou ${expected_amount} ou ${amountStr.replace(",", ".")})
3. Data: ${todayStr} (ou data de hoje em qualquer formato)

Responda APENAS com um JSON válido neste formato exato:
{"validated": true/false, "keywords_found": ["lista de palavras encontradas"], "amount_found": "valor encontrado ou null", "date_found": "data encontrada ou null", "reason": "explicação curta"}`,
              },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Image}` },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI response error:", await aiResponse.text());
      // If AI fails, set to manual review
      await supabase
        .from("profiles")
        .update({ payment_status: "pending_approval", plan: plan_key || "basic", trial_start_date: new Date().toISOString() })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ validated: false, manual_review: true, reason: "Não foi possível validar automaticamente, aguarde a revisão manual." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiText = aiData.choices?.[0]?.message?.content || "";

    // Parse AI response - extract JSON from possible markdown
    let result: { validated: boolean; reason: string };
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { validated: false, reason: "Resposta inválida da IA" };
    } catch {
      result = { validated: false, reason: "Erro ao interpretar resposta" };
    }

    if (result.validated) {
      // Auto-confirm payment
      await supabase
        .from("profiles")
        .update({
          payment_status: "active",
          plan: plan_key || "basic",
          trial_start_date: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ validated: true, reason: "Pagamento confirmado automaticamente!" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Manual review
      await supabase
        .from("profiles")
        .update({
          payment_status: "pending_approval",
          plan: plan_key || "basic",
          trial_start_date: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({
          validated: false,
          manual_review: true,
          reason: "Não foi possível validar automaticamente, aguarde a revisão manual.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
