import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const webhookSecret = Deno.env.get("STRIPE_CONNECT_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("STRIPE_CONNECT_WEBHOOK_SECRET not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  console.log(`[STRIPE-CONNECT-WEBHOOK] Event: ${event.type}, Account: ${event.account || "platform"}`);

  try {
    switch (event.type) {
      // ─── Connected account verified / updated ───
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const isComplete = account.charges_enabled && account.payouts_enabled;

        if (isComplete && account.id) {
          const { error } = await supabaseService
            .from("profiles")
            .update({ stripe_onboarding_complete: true })
            .eq("stripe_account_id", account.id);

          if (error) {
            console.error("Failed to update profile for account:", account.id, error);
          } else {
            console.log(`[STRIPE-CONNECT-WEBHOOK] Account ${account.id} onboarding complete`);
          }
        }
        break;
      }

      // ─── Payment succeeded (consultation paid) ───
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const meta = pi.metadata || {};
        const doctorId = meta.doctor_id;

        if (!doctorId) {
          console.log("[STRIPE-CONNECT-WEBHOOK] payment_intent.succeeded without doctor_id metadata, skipping");
          break;
        }

        // Check for duplicate
        const { data: existing } = await supabaseService
          .from("consultation_payments")
          .select("id")
          .eq("stripe_payment_intent_id", pi.id)
          .limit(1);

        if (existing && existing.length > 0) {
          console.log(`[STRIPE-CONNECT-WEBHOOK] Payment ${pi.id} already recorded, skipping`);
          break;
        }

        const amountTotal = (pi.amount || 0) / 100;

        await supabaseService.from("consultation_payments").insert({
          doctor_id: doctorId,
          patient_name: meta.patient_name || "Paciente",
          patient_email: meta.patient_email || "",
          patient_phone: meta.patient_phone || "",
          appointment_date: meta.date,
          appointment_time: meta.time,
          gross_amount: amountTotal,
          platform_fee: 0,
          net_amount: amountTotal,
          payment_method: pi.payment_method_types?.[0] || "card",
          stripe_payment_intent_id: pi.id,
          status: "paid",
          notes: meta.notes || "",
        });

        // Create appointment if not exists
        const { data: existingAppt } = await supabaseService
          .from("appointments")
          .select("id")
          .eq("user_id", doctorId)
          .eq("date", meta.date)
          .eq("time", meta.time)
          .eq("patient_name", meta.patient_name || "Paciente")
          .limit(1);

        if (!existingAppt || existingAppt.length === 0) {
          await supabaseService.from("appointments").insert({
            user_id: doctorId,
            patient_name: meta.patient_name || "Paciente",
            date: meta.date,
            time: meta.time,
            appointment_type: "telehealth",
            notes: `[Pago via SALBCARE] Email: ${meta.patient_email || ""} | Tel: ${meta.patient_phone || ""} | ${meta.notes || ""}`,
            status: "scheduled",
          });
        }

        console.log(`[STRIPE-CONNECT-WEBHOOK] Payment recorded for doctor ${doctorId}: R$ ${amountTotal}`);
        break;
      }

      // ─── Charge refunded ───
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        if (paymentIntentId) {
          const { error } = await supabaseService
            .from("consultation_payments")
            .update({ status: "refunded" })
            .eq("stripe_payment_intent_id", paymentIntentId);

          if (error) {
            console.error("Failed to update payment status to refunded:", error);
          } else {
            console.log(`[STRIPE-CONNECT-WEBHOOK] Payment ${paymentIntentId} marked as refunded`);
          }
        }
        break;
      }

      // ─── Checkout session completed (fallback) ───
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata || {};

        if (meta.doctor_id && session.payment_intent) {
          // Update checkout session ID on existing record
          await supabaseService
            .from("consultation_payments")
            .update({ stripe_checkout_session_id: session.id })
            .eq("stripe_payment_intent_id", session.payment_intent as string);

          console.log(`[STRIPE-CONNECT-WEBHOOK] Checkout session ${session.id} linked to PI ${session.payment_intent}`);
        }
        break;
      }

      default:
        console.log(`[STRIPE-CONNECT-WEBHOOK] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[STRIPE-CONNECT-WEBHOOK] Error processing ${event.type}:`, err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
