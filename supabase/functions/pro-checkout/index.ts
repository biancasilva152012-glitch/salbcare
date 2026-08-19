import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[ProCheckout] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

/** Preços SalbCare Pro (conta live "Salb Care"). Whitelist server-side. */
const PRO_PRICES: Record<string, string> = {
  // Atuais: R$ 99/mês e R$ 897/ano
  "price_1U6GvUBUEEEAHx2hAkDxAQbF": "monthly",
  "price_1U6GvoBUEEEAHx2hmyZMqKCo": "annual",
  // Legado (mantidos para assinaturas antigas)
  "price_1TyX6lBUEEEAHx2hGeIMZ9W1": "monthly",
  "price_1TyCJdBUEEEAHx2hYIvZ6EOH": "monthly",
  "price_1TyCJeBUEEEAHx2hvxyCs0Dz": "annual",
};
const DEFAULT_PRICE = "price_1U6GvUBUEEEAHx2hAkDxAQbF";

const ALLOWED_ORIGINS = [
  "https://salbcare.com",
  "https://www.salbcare.com",
  "https://salbcare.com.br",
  "https://www.salbcare.com.br",
  "https://salbcare.lovable.app",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("unauthenticated");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData.user;
    if (!user?.email) throw new Error("unauthenticated");

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // corpo vazio é aceitável
    }

    const requested = typeof body.priceId === "string" ? body.priceId : "";
    const priceId = PRO_PRICES[requested] ? requested : DEFAULT_PRICE;

    const reqOrigin = req.headers.get("origin") ?? "";
    const origin = ALLOWED_ORIGINS.includes(reqOrigin)
      ? reqOrigin
      : reqOrigin.startsWith("http://localhost")
        ? reqOrigin
        : ALLOWED_ORIGINS[0];

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const existing = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = existing.data[0]?.id;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: { user_id: user.id, product: "salbcare_pro" },
      subscription_data: { metadata: { user_id: user.id, product: "salbcare_pro" } },
      success_url: `${origin}/pro/bem-vindo?status=success`,
      cancel_url: `${origin}/pro?status=cancelled`,
    });

    logStep("Sessão criada", { userId: user.id, priceId });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    logStep("Erro", { message: err instanceof Error ? err.message : String(err) });
    return new Response(JSON.stringify({ error: "checkout_failed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
