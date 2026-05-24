import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id") || "";
    if (!sessionId.startsWith("cs_")) {
      return new Response(JSON.stringify({ error: "Invalid session_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const md = session.metadata || {};

    // SECURITY: do NOT return PII (patient_name, email) on a public endpoint
    // that is reachable with only the Stripe session_id (which appears in
    // browser history, server logs, and Referer headers). Only return the
    // non-personal booking facts needed to render the confirmation page.
    return new Response(JSON.stringify({
      paid: session.payment_status === "paid",
      amount_paid: (session.amount_total ?? 0) / 100,
      currency: session.currency,
      procedure: md.procedure_label || md.procedure || null,
      type: md.type || null,
      preferred_date: md.preferred_date || null,
      time_preference: md.time_preference || null,
      remaining_balance: parseFloat(md.remaining_balance || "0"),
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
