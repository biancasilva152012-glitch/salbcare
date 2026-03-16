import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Called after Stripe Checkout completes (from booking-success page).
 * Verifies the session and records the payment in consultation_payments table.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();
    if (!session_id) throw new Error("Missing session_id");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session with payment intent expanded
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent"],
    });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ recorded: false, reason: "not_paid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meta = session.metadata || {};
    const piMeta = (session.payment_intent as any)?.metadata || {};
    const doctor_id = meta.doctor_id || piMeta.doctor_id;
    const patient_name = meta.patient_name || piMeta.patient_name || "Paciente";
    const date = meta.date || piMeta.date;
    const time = meta.time || piMeta.time;
    const patient_email = piMeta.patient_email || session.customer_email || "";
    const patient_phone = piMeta.patient_phone || "";
    const notes = piMeta.notes || "";

    if (!doctor_id || !date || !time) {
      throw new Error("Missing metadata on session");
    }

    const amountTotal = (session.amount_total || 0) / 100;
    const paymentIntent = session.payment_intent as any;
    const applicationFee = paymentIntent?.application_fee_amount
      ? paymentIntent.application_fee_amount / 100
      : Math.round(amountTotal * 0.10 * 100) / 100;
    const netAmount = amountTotal - applicationFee;

    const paymentMethodType = session.payment_method_types?.[0] || "card";

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check for duplicate
    const { data: existing } = await serviceClient
      .from("consultation_payments")
      .select("id")
      .eq("stripe_checkout_session_id", session_id)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ recorded: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert payment record
    await serviceClient.from("consultation_payments").insert({
      doctor_id,
      patient_name,
      patient_email,
      patient_phone,
      appointment_date: date,
      appointment_time: time,
      gross_amount: amountTotal,
      platform_fee: applicationFee,
      net_amount: netAmount,
      payment_method: paymentMethodType,
      stripe_payment_intent_id: typeof paymentIntent === "object" ? paymentIntent.id : paymentIntent,
      stripe_checkout_session_id: session_id,
      status: "paid",
      notes,
    });

    // Also create the appointment
    await serviceClient.from("appointments").insert({
      user_id: doctor_id,
      patient_name,
      date,
      time,
      appointment_type: "telehealth",
      notes: `[Pago via SALBCARE] Email: ${patient_email} | Tel: ${patient_phone} | ${notes}`,
      status: "scheduled",
    });

    return new Response(JSON.stringify({ recorded: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Record payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
