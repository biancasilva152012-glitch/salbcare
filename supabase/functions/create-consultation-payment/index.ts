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

  try {
    const {
      doctor_id,
      patient_name,
      patient_email,
      patient_phone,
      date,
      time,
      payment_method, // "pix" or "card"
      amount, // in BRL (e.g. 180.00)
      notes,
    } = await req.json();

    if (!doctor_id || !amount || !date || !time || !patient_name) {
      throw new Error("Missing required fields");
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get doctor's Stripe account
    const { data: doctorProfile } = await supabaseService
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_complete, name")
      .eq("user_id", doctor_id)
      .single();

    if (!doctorProfile?.stripe_account_id || !doctorProfile.stripe_onboarding_complete) {
      throw new Error("Professional has not completed payment setup");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const amountInCents = Math.round(amount * 100);

    const origin = req.headers.get("origin") || "https://salbcare.lovable.app";

    // Build payment method types based on selection
    const paymentMethodTypes: string[] = payment_method === "pix" ? ["pix"] : ["card"];

    const sessionParams: any = {
      payment_method_types: paymentMethodTypes,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Consulta com ${doctorProfile.name}`,
              description: `${date} às ${time}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: doctorProfile.stripe_account_id,
        },
        metadata: {
          doctor_id,
          patient_name,
          patient_email: patient_email || "",
          patient_phone: patient_phone || "",
          date,
          time,
          notes: notes || "",
        },
      },
      success_url: `${origin}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/booking?doctor=${doctor_id}&name=${encodeURIComponent(doctorProfile.name)}`,
      customer_email: patient_email || undefined,
      metadata: {
        doctor_id,
        patient_name,
        date,
        time,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Create consultation payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
