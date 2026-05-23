import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Procedure catalog — server-authoritative
// type: 'presencial' charges R$50 booking fee; full_amount = total clinic price
// type: 'online' charges full amount
const BOOKING_FEE_PRICE = "price_1TZAulBUEEEAHx2hykS14Xnf"; // R$50 generic booking fee

type Procedure = {
  id: string;
  label: string;
  type: "presencial" | "online";
  priceId: string;
  amountCharged: number; // BRL value charged at checkout
  totalPrice: number;    // total procedure price (BRL); for online == amountCharged
};

const PROCEDURES: Record<string, Procedure> = {
  // ---- Dental (presencial) ----
  "dental-cleaning":   { id: "dental-cleaning",   label: "Dental Cleaning & Check-up", type: "presencial", priceId: "price_1TZAulBUEEEAHx2hykS14Xnf", amountCharged: 50, totalPrice: 200 },
  "dental-whitening":  { id: "dental-whitening",  label: "Teeth Whitening",             type: "presencial", priceId: "price_1TZAwTBUEEEAHx2hRJQYW9ge", amountCharged: 50, totalPrice: 480 },
  "dental-exam":       { id: "dental-exam",       label: "Complete Oral Exam",          type: "presencial", priceId: "price_1TZB0BBUEEEAHx2h9MhxHAJ9", amountCharged: 50, totalPrice: 200 },
  // ---- Physio (presencial) — reuse generic R$50 booking fee price ----
  "physio-kite-recovery": { id: "physio-kite-recovery", label: "Kite Recovery Session",     type: "presencial", priceId: BOOKING_FEE_PRICE, amountCharged: 50, totalPrice: 200 },
  "physio-massage":       { id: "physio-massage",       label: "Sports Massage (60 min)",   type: "presencial", priceId: BOOKING_FEE_PRICE, amountCharged: 50, totalPrice: 180 },
  "physio-postural":      { id: "physio-postural",      label: "Postural Assessment",        type: "presencial", priceId: BOOKING_FEE_PRICE, amountCharged: 50, totalPrice: 160 },
  "physio-package":       { id: "physio-package",       label: "Full Recovery Package (3 sessions)", type: "presencial", priceId: BOOKING_FEE_PRICE, amountCharged: 50, totalPrice: 480 },
  // ---- Telehealth (online — full payment) ----
  "telehealth-psychology":    { id: "telehealth-psychology",    label: "Online Psychology",     type: "online", priceId: "price_1TZB14BUEEEAHx2hrLOep6yM", amountCharged: 280, totalPrice: 280 },
  "telehealth-nutrition":     { id: "telehealth-nutrition",     label: "Online Nutrition",      type: "online", priceId: "price_1TZB30BUEEEAHx2hI7kKuMsK", amountCharged: 220, totalPrice: 220 },
  "telehealth-physio-online": { id: "telehealth-physio-online", label: "Online Physiotherapy",  type: "online", priceId: "price_1TZB3UBUEEEAHx2h29venNKE", amountCharged: 240, totalPrice: 240 },
  "telehealth-medicine":      { id: "telehealth-medicine",      label: "Online General Medicine", type: "online", priceId: "price_1TZB41BUEEEAHx2hE6suqwFh", amountCharged: 200, totalPrice: 200 },
};

const ALLOWED_ORIGINS = [
  "https://salbcare.com",
  "https://www.salbcare.com",
  "https://salbcare.com.br",
  "https://www.salbcare.com.br",
  "https://salbcare.lovable.app",
];

function pickOrigin(req: Request): string {
  const origin = req.headers.get("origin") || "";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (origin.endsWith(".lovable.app")) return origin;
  return "https://salbcare.com";
}

function sanitize(s: unknown, max = 500): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const procedureId = sanitize(body.procedureId, 64);
    const procedure = PROCEDURES[procedureId];
    if (!procedure) {
      return new Response(JSON.stringify({ error: "Invalid procedure" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const patient_name = sanitize(body.patient_name, 120);
    const email = sanitize(body.email, 200);
    if (!patient_name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid name or email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const preferred_date = sanitize(body.preferred_date, 20);
    const time_preference = sanitize(body.time_preference, 20) || "any";
    const notes = sanitize(body.notes, 800);
    const pousada_ref = sanitize(body.pousada_ref, 80);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const origin = pickOrigin(req);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [{ price: procedure.priceId, quantity: 1 }],
      payment_method_types: ["card"],
      success_url: `${origin}/kite/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/kite`,
      locale: "en",
      metadata: {
        kite_booking: "true",
        procedure: procedure.id,
        procedure_label: procedure.label,
        type: procedure.type,
        patient_name,
        email,
        preferred_date,
        time_preference,
        notes,
        pousada_ref,
        amount_charged: String(procedure.amountCharged),
        total_price: String(procedure.totalPrice),
        remaining_balance: String(Math.max(0, procedure.totalPrice - procedure.amountCharged)),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[create-kite-checkout]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
