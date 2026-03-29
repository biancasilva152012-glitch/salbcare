import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[Checkout] ${step}${detailsStr}`);
};

// Price IDs that are eligible for 7-day free trial (Essencial plan)
const TRIAL_ELIGIBLE_PRICES = [
  "price_1TBcE4BUEEEAHx2hfOYZN30W", // Essencial mensal
  "price_1TGKlBBUEEEAHx2hKvXbHuOz", // Essencial anual
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    logStep("Iniciando checkout", { userId: user.id, email: user.email });

    const { priceId, billingPeriod } = await req.json();
    if (!priceId) throw new Error("priceId is required");

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
    const isTrialEligible = TRIAL_ELIGIBLE_PRICES.includes(priceId) && !hadTrial;

    logStep("Trial check", { priceId, hadTrial, isTrialEligible });

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/dashboard?from_checkout=true`,
      cancel_url: `${origin}/subscription`,
      metadata: {
        user_id: user.id,
        billing_period: billingPeriod || "monthly",
      },
    };

    // Add 7-day trial if eligible
    if (isTrialEligible) {
      sessionParams.subscription_data = {
        trial_period_days: 7,
      };
      logStep("Trial de 7 dias adicionado ao checkout");
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
