import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[Checkout] ${step}${detailsStr}`);
};

// Allowed price IDs — enforced server-side
const ALLOWED_PRICES: Record<string, string> = {
  "price_1TLmdUBUEEEAHx2hR8nCDaMo": "Essencial Mensal", // R$89/mês
  "price_1TMBzjBUEEEAHx2h0517AGyu": "Essencial Anual",  // R$69/mês (R$828/ano)
};

const DEFAULT_PRICE_ID = "price_1TLmdUBUEEEAHx2hR8nCDaMo";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    logStep("Iniciando checkout", { userId: user.id, email: user.email });

    let body: any = {};
    try { body = await req.json(); } catch { /* empty body is ok */ }

    // SECURITY: Only allow whitelisted price IDs
    const requestedPriceId = body?.priceId;
    const priceId = (requestedPriceId && ALLOWED_PRICES[requestedPriceId])
      ? requestedPriceId
      : DEFAULT_PRICE_ID;

    // Force-disable trial when user came via partner referral
    const skipTrial = body?.skipTrial === true;

    logStep("Price validated", { priceId, planName: ALLOWED_PRICES[priceId], skipTrial });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://salbcare.lovable.app";

    // Check if user already had a trial
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: prof } = await supabaseService
      .from("professionals")
      .select("had_trial")
      .eq("user_id", user.id)
      .maybeSingle();

    const hadTrial = (prof as any)?.had_trial ?? false;
    const isTrialEligible = !skipTrial && priceId === DEFAULT_PRICE_ID && !hadTrial;

    logStep("Trial check", { priceId, hadTrial, skipTrial, isTrialEligible });

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      payment_method_types: ["card", "boleto"],
      payment_method_collection: "always",
      success_url: `${origin}/dashboard?from_checkout=true`,
      cancel_url: `${origin}/subscription`,
      metadata: {
        user_id: user.id,
      },
    };

    if (isTrialEligible) {
      sessionParams.subscription_data = {
        trial_period_days: 7,
      };
      logStep("Trial de 7 dias adicionado ao checkout");
    } else {
      logStep("Sem trial — cobrança imediata", { reason: skipTrial ? "partner referral" : (hadTrial ? "had_trial" : "non-default price") });
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Session criada", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERRO", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
