import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ACTIVE_PAYMENT_STATUSES = ["active", "paid"];

const planMonthlyValue = (plan: string | null | undefined) => {
  const normalized = (plan || "").toLowerCase();
  if (normalized.includes("anual") || normalized.includes("annual")) return 69;
  return 89;
};

const isStripePermissionError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("required permissions") || message.includes("rak_subscription_read") || message.includes("rak_billing_cadence_read");
};

async function getDatabaseFinancialFallback(supabase: ReturnType<typeof createClient>, reason?: string) {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("plan, payment_status, created_at, user_type, name, email")
    .in("payment_status", ACTIVE_PAYMENT_STATUSES);

  if (error) throw error;

  const activeProfiles = (profiles || []).filter((p) => {
    const name = (p.name || "").toLowerCase();
    const email = (p.email || "").toLowerCase();
    return p.user_type === "professional" && !name.includes("teste") && !email.includes("test");
  });
  const mrr = activeProfiles.reduce((sum, p) => sum + planMonthlyValue(p.plan), 0);

  const now = new Date();
  const monthlyRevenue: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    monthlyRevenue.push({ month: label, revenue: i === 0 ? mrr : 0 });
  }

  return {
    mrr,
    active_subs: activeProfiles.length,
    churn_rate: 0,
    total_canceled: 0,
    recent_charges: [],
    monthly_revenue: monthlyRevenue,
    source: "database_fallback",
    warning: reason,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    const { data: isAdmin } = await supabase.rpc("is_admin_or_contador", {
      _user_id: userData.user.id,
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { action, ...params } = await req.json();
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripe = stripeKey
      ? new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" })
      : null;

    switch (action) {
      case "list_users": {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        // Enrich with Stripe data if available
        const enriched = [];
        for (const p of profiles || []) {
          let stripeData = null;
          if (stripe && p.email) {
            try {
              const customers = await stripe.customers.list({
                email: p.email,
                limit: 1,
              });
              if (customers.data.length > 0) {
                const cust = customers.data[0];
                const subs = await stripe.subscriptions.list({
                  customer: cust.id,
                  limit: 1,
                });
                stripeData = {
                  customer_id: cust.id,
                  subscription: subs.data[0]
                    ? {
                        id: subs.data[0].id,
                        status: subs.data[0].status,
                        current_period_end: subs.data[0].current_period_end,
                        cancel_at_period_end: subs.data[0].cancel_at_period_end,
                        plan_amount: subs.data[0].items.data[0]?.price?.unit_amount,
                        plan_currency: subs.data[0].items.data[0]?.price?.currency,
                      }
                    : null,
                };
              }
            } catch (error) {
              if (isStripePermissionError(error)) {
                console.warn("Stripe restricted key lacks subscription read permissions; skipping Stripe enrichment.");
              }
              // Stripe lookup failed, continue with database profile data only.
            }
          }
          enriched.push({ ...p, stripe: stripeData });
        }
        return new Response(JSON.stringify({ users: enriched }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "suspend_user": {
        const { user_id } = params;
        await supabase
          .from("profiles")
          .update({ payment_status: "suspended" })
          .eq("user_id", user_id);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "activate_user": {
        const { user_id } = params;
        await supabase
          .from("profiles")
          .update({ payment_status: "active" })
          .eq("user_id", user_id);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "change_plan": {
        const { user_id, plan } = params;
        await supabase
          .from("profiles")
          .update({ plan })
          .eq("user_id", user_id);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_mrr": {
        if (!stripe) {
          const fallback = await getDatabaseFinancialFallback(supabase, "Stripe não configurado; métricas estimadas pelo banco.");
          return new Response(JSON.stringify(fallback), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        try {
          const subs = await stripe.subscriptions.list({ status: "active", limit: 100 });
          let mrr = 0;
          for (const s of subs.data) {
            const amount = s.items.data[0]?.price?.unit_amount || 0;
            mrr += amount / 100;
          }

          const canceled = await stripe.subscriptions.list({ status: "canceled", limit: 100 });
          const total = subs.data.length + canceled.data.length;
          const churnRate = total > 0 ? (canceled.data.length / total) * 100 : 0;

          const charges = await stripe.charges.list({ limit: 30 });
          const recentCharges = charges.data.map((c) => ({
            id: c.id,
            amount: c.amount / 100,
            currency: c.currency,
            status: c.status,
            created: c.created,
            customer_email: c.billing_details?.email,
            description: c.description,
            refunded: c.refunded,
            paid: c.paid,
          }));

          // Monthly revenue (last 6 months)
          const now = new Date();
          const monthlyRevenue: { month: string; revenue: number }[] = [];
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
            const start = Math.floor(d.getTime() / 1000);
            const end = Math.floor(new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() / 1000);
            const monthCharges = charges.data.filter(
              (c) => c.created >= start && c.created < end && c.paid && !c.refunded
            );
            const rev = monthCharges.reduce((sum, c) => sum + c.amount / 100, 0);
            monthlyRevenue.push({ month: label, revenue: rev });
          }

          return new Response(
            JSON.stringify({
              mrr,
              active_subs: subs.data.length,
              churn_rate: Math.round(churnRate * 10) / 10,
              recent_charges: recentCharges,
              monthly_revenue: monthlyRevenue,
              total_canceled: canceled.data.length,
              source: "stripe",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (error) {
          if (!isStripePermissionError(error)) throw error;
          const fallback = await getDatabaseFinancialFallback(
            supabase,
            "A chave Stripe atual não tem permissão de leitura de assinaturas; métricas estimadas pelo banco."
          );
          return new Response(JSON.stringify(fallback), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      case "refund_charge": {
        if (!stripe) throw new Error("Stripe not configured");
        const { charge_id } = params;
        if (!charge_id) throw new Error("charge_id required");
        const refund = await stripe.refunds.create({ charge: charge_id as string });
        // Log it
        await supabase.from("admin_logs").insert({
          admin_user_id: userData.user.id,
          action: "refund",
          target_id: charge_id as string,
          target_table: "stripe_charges",
          details: { refund_id: refund.id, amount: refund.amount },
        });
        return new Response(JSON.stringify({ ok: true, refund_id: refund.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
