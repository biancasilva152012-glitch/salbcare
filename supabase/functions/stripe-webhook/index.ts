import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const IMPORT_URLS = {
  stripe: "https://esm.sh/stripe@18.5.0",
  supabase: "https://esm.sh/@supabase/supabase-js@2.57.2",
};

const logStep = (step: string, details?: any) => {
  console.log(`[Webhook] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

const logInitError = (where: string, err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(
    `[Webhook] ❌ Init failed at ${where}`,
    JSON.stringify({ error: msg, stack, imports: IMPORT_URLS })
  );
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
  let stripe: Stripe;
  let supabase: ReturnType<typeof createClient>;
  try {
    stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });
    supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );
  } catch (err) {
    logInitError("client_initialization", err);
    return new Response(
      JSON.stringify({
        error: "Initialization failed",
        message: err instanceof Error ? err.message : String(err),
        imports: IMPORT_URLS,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }


  // ── 1) Verificar header e segredo ────────────────────────────────────
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!webhookSecret) {
    // Erro de configuração — devolve 500 (não 400) para que o Stripe re-tente
    // e fique evidente nos logs que falta provisionar o segredo.
    logStep("❌ STRIPE_WEBHOOK_SECRET não configurado — recusando webhook");
    return new Response(
      JSON.stringify({ error: "Webhook secret not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!signature) {
    // Requisição sem header `stripe-signature` → não veio do Stripe.
    // 401 deixa claro que é tentativa não autenticada (úteis para alertas).
    logStep("⚠️ Requisição sem stripe-signature — possível chamada não autorizada");
    return new Response(
      JSON.stringify({ error: "Missing stripe-signature header" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── 2) Validar assinatura ────────────────────────────────────────────
  // Lê o body cru (string) — exigência do verificador do Stripe.
  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // 400 sinaliza ao Stripe "assinatura inválida, não re-tente" — exatamente
    // o que queremos para tentativas falsas. Loga com detalhes para auditoria.
    logStep("⚠️ Assinatura do webhook inválida — rejeitando", {
      error: msg,
      sigPrefix: signature.slice(0, 20),
    });
    return new Response(
      JSON.stringify({ error: "Invalid webhook signature" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!event?.id || !event?.type) {
    logStep("⚠️ Evento sem id/type após validação — descartando");
    return new Response(
      JSON.stringify({ error: "Malformed event" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  logStep("Evento recebido", { type: event.type, id: event.id });

  // ── Idempotência: evita reprocessar reentregas do Stripe ──────────────
  // Inserimos o event.id em processed_stripe_events com PRIMARY KEY.
  // Se já existir, ignoramos o evento e retornamos 200 (Stripe não reentrega).
  try {
    const { error: dupeErr } = await supabase
      .from("processed_stripe_events")
      .insert({ event_id: event.id, event_type: event.type });

    if (dupeErr) {
      // 23505 = unique_violation → já processado
      if ((dupeErr as any).code === "23505") {
        logStep("Evento duplicado ignorado (idempotência)", { id: event.id, type: event.type });
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      // Outros erros: loga mas continua processando para não perder eventos
      logStep("Aviso ao gravar idempotência (continuando)", { error: (dupeErr as any).message });
    }
  } catch (err) {
    logStep("Falha não-crítica em idempotência", { error: err instanceof Error ? err.message : String(err) });
  }

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
      case "payment_intent.succeeded": {
        await handlePaymentIntentSucceeded(stripe, supabase, event.data.object as Stripe.PaymentIntent);
        break;
      }
      default:
        logStep("Evento ignorado", { type: event.type });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("Erro ao processar evento", { type: event.type, error: msg });
    // Remove o registro para permitir reprocessamento na próxima reentrega
    await supabase.from("processed_stripe_events").delete().eq("event_id", event.id);
    return new Response("Internal error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// ── payment_intent.succeeded (Pix auto-activation) ───────────────────
async function handlePaymentIntentSucceeded(
  stripe: Stripe,
  supabase: any,
  paymentIntent: Stripe.PaymentIntent
) {
  const paymentMethod = paymentIntent.payment_method_types?.[0];
  logStep("payment_intent.succeeded", { id: paymentIntent.id, method: paymentMethod, amount: paymentIntent.amount });

  // Find user by customer email
  const customerId = typeof paymentIntent.customer === "string" ? paymentIntent.customer : null;
  if (!customerId) {
    logStep("payment_intent.succeeded → sem customer_id, tentando metadata");
    // Try metadata fallback
    const userId = paymentIntent.metadata?.user_id;
    if (userId) {
      await activateUserAccess(supabase, userId, paymentMethod || "pix");
    }
    return;
  }

  // Look up professional by stripe_customer_id
  const { data: professional } = await supabase
    .from("professionals")
    .select("user_id, plan")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (professional) {
    await activateUserAccess(supabase, professional.user_id, paymentMethod || "pix");
    return;
  }

  // Fallback: look up by customer email
  const customer = await stripe.customers.retrieve(customerId);
  if (customer && !customer.deleted && customer.email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", customer.email)
      .maybeSingle();

    if (profile) {
      await activateUserAccess(supabase, profile.user_id, paymentMethod || "pix");
    } else {
      logStep("payment_intent.succeeded → perfil não encontrado", { email: customer.email });
    }
  }
}

async function activateUserAccess(supabase: any, userId: string, paymentMethod: string) {
  // Update professionals table
  await supabase
    .from("professionals")
    .update({
      subscription_status: "active",
      plan_updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  // Update profiles table
  await supabase
    .from("profiles")
    .update({ payment_status: "active" })
    .eq("user_id", userId);

  logStep(`✅ Acesso liberado automaticamente via ${paymentMethod} → user: ${userId}`);
}

// ── checkout.session.completed ────────────────────────────────────────
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

  let priceId: string | null = null;
  let subscriptionId: string | null = null;
  let subStatus: string = "active";
  let trialEnd: string | null = null;

  if (session.mode === "subscription" && typeof session.subscription === "string") {
    subscriptionId = session.subscription;
    const sub = await stripe.subscriptions.retrieve(session.subscription);
    priceId = sub.items.data[0]?.price?.id ?? null;
    subStatus = sub.status;
    if (sub.trial_end) {
      trialEnd = new Date(sub.trial_end * 1000).toISOString();
    }
  } else {
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

  // Trial removido — não marcamos mais had_trial automaticamente

  const { error: profError } = await supabase
    .from("professionals")
    .update(updateObj)
    .eq("user_id", userId);

  if (profError) {
    logStep("Erro ao atualizar professionals", { error: profError.message });
  }

  await supabase
    .from("profiles")
    .update({ payment_status: "active", plan: plan === "essencial" ? "basic" : plan === "pro" ? "professional" : "clinic" })
    .eq("user_id", userId);

  logStep(`checkout.session.completed → user: ${userId} | plano: ${plan} | billing: ${billing} | status: ${subStatus}`);
}

// ── customer.subscription.updated ─────────────────────────────────────
async function handleSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const status = subscription.status;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : null;

  const resolved = priceId ? PLAN_MAP[priceId] : null;

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

// ── customer.subscription.deleted ─────────────────────────────────────
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
    })
    .eq("user_id", professional.user_id);

  await supabase
    .from("profiles")
    .update({ payment_status: "expired", plan: "basic" })
    .eq("user_id", professional.user_id);

  logStep(`subscription.deleted → acesso removido para user: ${professional.user_id}`);
}

// ── invoice.payment_failed ────────────────────────────────────────────
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
