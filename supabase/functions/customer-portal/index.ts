import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const IMPORT_URLS = {
  stripe: "https://esm.sh/stripe@18.5.0",
  supabase: "https://esm.sh/@supabase/supabase-js@2.57.2",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logInitError = (where: string, err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(
    `[customer-portal] ❌ Init failed at ${where}`,
    JSON.stringify({ error: msg, stack, imports: IMPORT_URLS })
  );
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let stripe: Stripe;
  let supabaseClient: ReturnType<typeof createClient>;
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  } catch (err) {
    logInitError("client_initialization", err);
    return new Response(
      JSON.stringify({
        error: "Initialization failed",
        message: err instanceof Error ? err.message : String(err),
        imports: IMPORT_URLS,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) throw new Error("No Stripe customer found");


    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${req.headers.get("origin")}/subscription`,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
