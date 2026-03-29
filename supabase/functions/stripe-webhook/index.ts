import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  console.log(`[Webhook] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

const PLAN_MAP: Record<string, { plan: string; billing: string }> = {
  // Essencial
  "price_1TBcE4BUEEEAHx2hfOYZN30W": { plan: "essencial", billing: "monthly" },
  "price_1TFfbUBUEEEAHx2hSVD43KlA": { plan: "essencial", billing: "annual" },
  // Pro
  "price_1TBcg4BUEEEAHx2hiJNr2qhu": { plan: "pro", billing: "monthly" },
  "price_1TFfc2BUEEEAHx2hge1NjbOm": { plan: "pro", billing: "annual" },
  // Clínica
  "price_1TBcgQBUEEEAHx2hwimX7ktu": { plan: "clinica", billing: "monthly" },
  "price_1TFfcWBUEEEAHx2hTMq5L9dc": { plan: "clinica", billing: "annual" },
};

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2025-08-27.basil",
  });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    logStep("Missing signature or webhook secret");
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("Assinatura inválida", { error: msg });
    return new Response("Webhook signature invalid", { status: 400 });
  }

  logStep("Evento recebido", { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(stripe, supabase, event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(supabase, event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.payment_failed": {
        await handlePaymentFailed(stripe, supabase, event.data.object as Stripe.Invoice);
        break;
      }
      default:
        logStep("Evento ignorado", { type: event.type });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("Erro ao processar evento", { type: event.type, error: msg });
    return new Response("Internal error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

async function handleCheckoutCompleted(
  stripe: Stripe,
  supabase: any,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.user_id;
  const customerId = typeof session.customer === "string" ? session.customer : null;

  if (!userId) {
    logStep("checkout.session.completed sem user_id nos metadata");
    return;
  }

  // Get price_id from the subscription or line items
  let priceId: string | null = null;
  let subscriptionId: string | null = null;
  let subStatus: string = "active";
  let trialEnd: string | null = null;

  if (session.mode === "subscription" && typeof session.subscription === "string") {
    subscriptionId = session.subscription;
    const sub = await stripe.subscriptions.retrieve(session.subscription);
    priceId = sub.items.data[0]?.price?.id ?? null;
    subStatus = sub.status; // 'trialing' | 'active'
    if (sub.trial_end) {
      trialEnd = new Date(sub.trial_end * 1000).toISOString();
    }
  } else {
    // One-time payment (annual) — get from line items
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
    if (lineItems.data.length > 0) {
      priceId = lineItems.data[0].price?.id ?? null;
    }
    subStatus = "active";
  }

  const resolved = priceId ? PLAN_MAP[priceId] : null;
  const plan = resolved?.plan ?? "essencial";
  const billing = resolved?.billing ?? "monthly";

  const updateObj: Record<string, any> = {
    plan,
    billing,
    subscription_id: subscriptionId,
    subscription_status: subStatus,
    stripe_customer_id: customerId,
    plan_updated_at: new Date().toISOString(),
  };

  if (trialEnd) {
    updateObj.trial_ends_at = trialEnd;
  }

  if (plan === "essencial") {
    updateObj.had_trial = true;
    logStep("Trial registrado para user_id", { userId });
  }

  // Also update profiles table for backward compatibility
  const { error: profError } = await supabase
    .from("professionals")
    .update(updateObj)
    .eq("user_id", userId);

  if (profError) {
    logStep("Erro ao atualizar professionals", { error: profError.message });
  }

  // Update profiles payment_status for backward compat
  await supabase
    .from("profiles")
    .update({ payment_status: "active", plan: plan === "essencial" ? "basic" : plan === "pro" ? "professional" : "clinic" })
    .eq("user_id", userId);

  logStep(`checkout.session.completed → user: ${userId} | plano: ${plan} | billing: ${billing} | status: ${subStatus}`);
}

async function handleSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const status = subscription.status;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : null;

  const resolved = priceId ? PLAN_MAP[priceId] : null;

  // Find professional by subscription_id or stripe_customer_id
  let professional: any = null;

  const { data: bySub } = await supabase
    .from("professionals")
    .select("user_id")
    .eq("subscription_id", subscription.id)
    .maybeSingle();

  if (bySub) {
    professional = bySub;
  } else if (customerId) {
    const { data: byCust } = await supabase
      .from("professionals")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    professional = byCust;
  }

  if (!professional) {
    logStep("subscription.updated → profissional não encontrado", { subscriptionId: subscription.id });
    return;
  }

  const updateObj: Record<string, any> = {
    subscription_status: status,
    plan_updated_at: new Date().toISOString(),
  };

  if (resolved) {
    updateObj.plan = resolved.plan;
    updateObj.billing = resolved.billing;
  }

  if (subscription.trial_end) {
    updateObj.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString();
  }

  await supabase
    .from("professionals")
    .update(updateObj)
    .eq("user_id", professional.user_id);

  // Sync profiles
  const profilePlan = resolved ? (resolved.plan === "essencial" ? "basic" : resolved.plan === "pro" ? "professional" : "clinic") : undefined;
  const profileUpdate: Record<string, any> = {
    payment_status: status === "active" || status === "trialing" ? "active" : status === "past_due" ? "past_due" : "expired",
  };
  if (profilePlan) profileUpdate.plan = profilePlan;

  await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("user_id", professional.user_id);

  logStep(`subscription.updated → user: ${professional.user_id} | novo plano: ${resolved?.plan ?? "unknown"} | status: ${status}`);
}

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  const { data: professional } = await supabase
    .from("professionals")
    .select("user_id")
    .eq("subscription_id", subscription.id)
    .maybeSingle();

  if (!professional) {
    logStep("subscription.deleted → profissional não encontrado", { subscriptionId: subscription.id });
    return;
  }

  await supabase
    .from("professionals")
    .update({
      plan: null,
      billing: null,
      subscription_status: "canceled",
      subscription_id: null,
      plan_updated_at: new Date().toISOString(),
      // Do NOT reset had_trial
    })
    .eq("user_id", professional.user_id);

  await supabase
    .from("profiles")
    .update({ payment_status: "expired", plan: "basic" })
    .eq("user_id", professional.user_id);

  logStep(`subscription.deleted → acesso removido para user: ${professional.user_id}`);
}

async function handlePaymentFailed(stripe: Stripe, supabase: any, invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : null;

  if (!customerId) {
    logStep("invoice.payment_failed → sem customer_id");
    return;
  }

  const { data: professional } = await supabase
    .from("professionals")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!professional) {
    logStep("invoice.payment_failed → profissional não encontrado", { customerId });
    return;
  }

  await supabase
    .from("professionals")
    .update({
      subscription_status: "past_due",
      plan_updated_at: new Date().toISOString(),
    })
    .eq("user_id", professional.user_id);

  await supabase
    .from("profiles")
    .update({ payment_status: "past_due" })
    .eq("user_id", professional.user_id);

  logStep(`invoice.payment_failed → user: ${professional.user_id} | subscription: ${subscriptionId}`);
}
