// academy-access
// Diz se o usuario logado tem acesso ao conteudo completo da Academy
// (Quick Card completo e apostila). Duas fontes:
//  1) assinatura SalbCare Pro ativa (tabela pro_subscriptions)
//  2) compra avulsa paga no Stripe do preco da apostila
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APOSTILA_PRICE = "price_1UDSqwBUEEEAHx2hlH8vQon7";
const ACTIVE = ["active", "trialing", "past_due"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ access: false, source: null });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const { data: userData } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData?.user;
    if (!user?.email) return json({ access: false, source: null });

    // 1) Assinatura Pro
    const { data: sub } = await admin
      .from("pro_subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (sub && ACTIVE.includes(String(sub.status))) {
      return json({ access: true, source: "pro" });
    }

    // 2) Compra avulsa
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) return json({ access: false, source: null });

    const sessions = await stripe.checkout.sessions.list({
      customer: customers.data[0].id,
      limit: 20,
    });
    for (const s of sessions.data) {
      if (s.payment_status !== "paid") continue;
      const items = await stripe.checkout.sessions.listLineItems(s.id, { limit: 10 });
      if (items.data.some((li) => li.price?.id === APOSTILA_PRICE)) {
        return json({ access: true, source: "apostila" });
      }
    }

    return json({ access: false, source: null });
  } catch (error) {
    console.error("[ACADEMY-ACCESS]", error instanceof Error ? error.message : error);
    return json({ access: false, source: null });
  }
});
