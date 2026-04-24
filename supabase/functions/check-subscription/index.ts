import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Structured logger — single JSON line per event so it greps cleanly
 * in the edge-function log viewer and feeds external alerting later.
 */
function logEvent(level: "info" | "warn" | "error", event: string, fields: Record<string, unknown> = {}) {
  const payload = {
    fn: "check-subscription",
    level,
    event,
    ts: new Date().toISOString(),
    ...fields,
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

/**
 * Returns a 200 response carrying a `fallback: true` envelope so the
 * client never sees a raw 5xx (which can blank-screen). The client reads
 * the envelope and falls back to its cached subscription state.
 */
function fallbackResponse(code: string, message: string, status = 200) {
  logEvent("error", "fallback_response", { code, message, http_status: status });
  return new Response(
    JSON.stringify({
      subscribed: false,
      product_id: null,
      subscription_end: null,
      fallback: true,
      code,
      error: message,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    },
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const reqId = crypto.randomUUID();

  try {
    logEvent("info", "function_started", { req_id: reqId });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return fallbackResponse("STRIPE_KEY_MISSING", "Stripe is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return fallbackResponse("NO_AUTH_HEADER", "Missing authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      return fallbackResponse("AUTH_ERROR", `Authentication error: ${userError.message}`);
    }
    const user = userData.user;
    if (!user?.email) {
      return fallbackResponse("NO_USER", "User not authenticated or email not available");
    }
    logEvent("info", "user_authenticated", { req_id: reqId, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let customers;
    try {
      customers = await stripe.customers.list({ email: user.email, limit: 1 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return fallbackResponse("STRIPE_LIST_FAILED", msg);
    }

    if (customers.data.length === 0) {
      logEvent("info", "no_customer", { req_id: reqId });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logEvent("info", "found_customer", { req_id: reqId, customerId });

    let subscriptions;
    try {
      subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return fallbackResponse("STRIPE_SUBS_FAILED", msg);
    }

    const hasActiveSub = subscriptions.data.length > 0;
    let productId: unknown = null;
    let subscriptionEnd: string | null = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product;
      logEvent("info", "active_subscription", {
        req_id: reqId,
        productId,
        subscriptionEnd,
      });
    }

    return new Response(
      JSON.stringify({
        subscribed: hasActiveSub,
        product_id: productId,
        subscription_end: subscriptionEnd,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fallbackResponse("UNEXPECTED_ERROR", msg);
  }
});
