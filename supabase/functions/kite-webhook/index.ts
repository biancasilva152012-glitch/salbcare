import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });
  const sig = req.headers.get("stripe-signature");
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET_KITE") || Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    if (!sig || !secret) throw new Error("Missing signature or secret");
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, secret);
  } catch (err) {
    console.error("[kite-webhook] signature verification failed", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true, skipped: event.type }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const md = session.metadata || {};
  if (md.kite_booking !== "true") {
    return new Response(JSON.stringify({ received: true, skipped: "not_kite" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    { auth: { persistSession: false } },
  );

  const amount_paid = (session.amount_total ?? 0) / 100;
  const remaining = parseFloat(md.remaining_balance || "0");

  const { error: insErr } = await admin.from("kite_bookings").insert({
    procedure: md.procedure_label || md.procedure || "Unknown",
    type: md.type === "online" ? "online" : "presencial",
    patient_name: md.patient_name || session.customer_details?.name || "",
    email: md.email || session.customer_details?.email || "",
    preferred_date: md.preferred_date || null,
    time_preference: md.time_preference || null,
    notes: md.notes || null,
    pousada_ref: md.pousada_ref || null,
    stripe_session_id: session.id,
    amount_paid,
    remaining_balance: remaining,
    status: "pending",
  });
  if (insErr) console.error("[kite-webhook] insert error", insErr);

  // Try to send email to admin via Resend (gracefully no-op if not configured)
  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const html = `
        <h2>New Kite Booking — ${md.procedure_label || md.procedure}</h2>
        <p><strong>Type:</strong> ${md.type}</p>
        <p><strong>Patient:</strong> ${md.patient_name} (${md.email})</p>
        <p><strong>Preferred date:</strong> ${md.preferred_date || "—"} / ${md.time_preference || "any"}</p>
        <p><strong>Notes:</strong> ${md.notes || "—"}</p>
        <p><strong>Pousada ref:</strong> ${md.pousada_ref || "—"}</p>
        <p><strong>Paid:</strong> R$ ${amount_paid.toFixed(2)} · <strong>Remaining (clinic):</strong> R$ ${remaining.toFixed(2)}</p>
        <p>Stripe session: ${session.id}</p>
        <p>—<br/>SalbDental · salbcare.com</p>
      `;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: "SalbDental <onboarding@resend.dev>",
          to: ["biancadealbuquerquep@gmail.com"],
          subject: `[Kite] New booking — ${md.procedure_label || md.procedure}`,
          html,
        }),
      });
    } else {
      console.log("[kite-webhook] RESEND_API_KEY not set — skipping email notification");
    }
  } catch (e) {
    console.error("[kite-webhook] email error", e);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
