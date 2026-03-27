import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    logStep("Missing signature or webhook secret");
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  let event: Stripe.Event;
  const body = await req.text();

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("Webhook signature verification failed", { error: msg });
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  logStep("Event received", { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email || session.customer_email;
        const billingPeriod = session.metadata?.billing_period || "monthly";
        const userId = session.metadata?.user_id;

        logStep("Checkout completed", { customerEmail, billingPeriod, userId });

        if (userId) {
          // Determine the plan from the line items
          let productId: string | null = null;
          if (session.mode === "subscription" && typeof session.subscription === "string") {
            const sub = await stripe.subscriptions.retrieve(session.subscription);
            productId = sub.items.data[0]?.price?.product as string;
          } else {
            // One-time payment - get from line items
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
            if (lineItems.data.length > 0) {
              productId = lineItems.data[0].price?.product as string;
            }
          }

          logStep("Product identified", { productId });

          // Map product IDs to plan keys
          const productToPlan: Record<string, string> = {
            // Monthly
            "prod_U9w63fgoL24Mi4": "basic",
            "prod_U9wZ94gRJJq1HU": "professional",
            "prod_U9wZAYvh6Gb6ct": "clinic",
            // Annual
            "prod_UE7rcjFtRARJyZ": "basic",
            "prod_UE7rM9elNBWYOU": "professional",
            "prod_UE7sxFE8sPony6": "clinic",
          };

          const plan = productId ? productToPlan[productId] || "basic" : "basic";

          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              plan,
              payment_status: "active",
            })
            .eq("user_id", userId);

          if (updateError) {
            logStep("Error updating profile", { error: updateError.message });
          } else {
            logStep("Profile updated successfully", { plan, userId });
          }
        } else if (customerEmail) {
          // Fallback: find user by email
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("email", customerEmail)
            .single();

          if (profile) {
            await supabase
              .from("profiles")
              .update({ payment_status: "active" })
              .eq("user_id", profile.user_id);
            logStep("Profile updated via email fallback", { email: customerEmail });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerEmail = typeof invoice.customer === "string"
          ? (await stripe.customers.retrieve(invoice.customer) as Stripe.Customer).email
          : null;

        logStep("Payment failed", { customerEmail });

        if (customerEmail) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("email", customerEmail)
            .single();

          if (profile) {
            await supabase
              .from("profiles")
              .update({ payment_status: "expired" })
              .eq("user_id", profile.user_id);
            logStep("Profile set to expired", { email: customerEmail });
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("Error processing event", { error: msg });
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
