import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const warningThreshold = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago (2 days before expiry)
    const expiryThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    // 1. Find expired trial users (trial started > 7 days ago, not paid)
    const { data: expiredUsers, error: expiredError } = await supabase
      .from("profiles")
      .select("user_id, name, email, trial_start_date")
      .eq("payment_status", "none")
      .eq("user_type", "professional")
      .not("trial_start_date", "is", null)
      .lt("trial_start_date", expiryThreshold.toISOString());

    if (expiredError) throw expiredError;

    // Block expired accounts by setting payment_status to 'expired'
    if (expiredUsers && expiredUsers.length > 0) {
      const expiredIds = expiredUsers.map(u => u.user_id);
      await supabase
        .from("profiles")
        .update({ payment_status: "expired" })
        .in("user_id", expiredIds);

      // Send warning messages via chat
      for (const user of expiredUsers) {
        await supabase.from("chat_messages").insert({
          user_id: user.user_id,
          content: `⚠️ Seu período de teste gratuito expirou. Para continuar usando a SALBCARE, escolha um plano em "Meu Perfil > Meu Plano". Caso tenha dúvidas, estamos aqui para ajudar!`,
          sender: "contador",
        });
      }
    }

    // 2. Find users about to expire (trial started 5+ days ago but < 7, not paid)
    const { data: warningUsers, error: warningError } = await supabase
      .from("profiles")
      .select("user_id, name, email, trial_start_date")
      .eq("payment_status", "none")
      .eq("user_type", "professional")
      .not("trial_start_date", "is", null)
      .lt("trial_start_date", warningThreshold.toISOString())
      .gte("trial_start_date", expiryThreshold.toISOString());

    if (warningError) throw warningError;

    // Send warning messages
    if (warningUsers && warningUsers.length > 0) {
      for (const user of warningUsers) {
        const trialEnd = new Date(new Date(user.trial_start_date).getTime() + 7 * 24 * 60 * 60 * 1000);
        const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
        
        // Check if we already sent a warning recently
        const { data: recentMsgs } = await supabase
          .from("chat_messages")
          .select("id")
          .eq("user_id", user.user_id)
          .eq("sender", "contador")
          .ilike("content", "%período de teste%")
          .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (!recentMsgs || recentMsgs.length === 0) {
          await supabase.from("chat_messages").insert({
            user_id: user.user_id,
            content: `⏰ Atenção: seu teste gratuito expira em ${daysLeft} dia(s)! Escolha um plano agora e não perca acesso à plataforma. Acesse "Meu Perfil > Meu Plano" para fazer o upgrade.`,
            sender: "contador",
          });
        }
      }
    }

    return new Response(JSON.stringify({
      blocked: expiredUsers?.length || 0,
      warned: warningUsers?.length || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});