// Refund a consultation payment via Stripe.
// - Auth required (JWT)
// - Caller must be the doctor_id owner of the payment row (or admin)
// - Uses service role to read/update the row, bypassing RLS safely after the check
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  const extra = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[REFUND-CONSULTATION] ${step}${extra}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");

    // User-scoped client to verify caller identity
    const supaUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsErr } = await supaUser.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;
    log("authed", { userId });

    const body = await req.json().catch(() => ({}));
    const paymentId = body?.payment_id as string | undefined;
    const reason = (body?.reason as string | undefined)?.slice(0, 200) || "Cancelamento pelo profissional";
    if (!paymentId) {
      return new Response(JSON.stringify({ error: "payment_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service-role client for trusted read/write after ownership check
    const supaService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: payment, error: pErr } = await supaService
      .from("consultation_payments")
      .select("id, doctor_id, status, stripe_payment_intent_id, gross_amount")
      .eq("id", paymentId)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!payment) {
      return new Response(JSON.stringify({ error: "payment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ownership: doctor_id must match or caller is admin/contador
    let allowed = payment.doctor_id === userId;
    if (!allowed) {
      const { data: isAdmin } = await supaService.rpc("is_admin_or_contador", { _user_id: userId });
      allowed = !!isAdmin;
    }
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payment.status === "refunded") {
      return new Response(JSON.stringify({ ok: true, already: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!payment.stripe_payment_intent_id) {
      return new Response(JSON.stringify({ error: "no stripe_payment_intent_id on payment" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
      reason: "requested_by_customer",
      metadata: { payment_id: payment.id, requested_by: userId, note: reason },
    });
    log("refund created", { id: refund.id, status: refund.status });

    const { error: uErr } = await supaService
      .from("consultation_payments")
      .update({
        status: "refunded",
        notes: reason,
      })
      .eq("id", payment.id);
    if (uErr) throw uErr;

    return new Response(
      JSON.stringify({ ok: true, refund_id: refund.id, status: refund.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
