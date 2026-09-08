// academy-checkout
// Compra avulsa (one-off) de um material da SalbCare Academy.
// Login opcional: convidados informam o e-mail no proprio Stripe Checkout.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fallback de precos da Academy (nunca aceitar price vindo do cliente).
// O preco ativo e buscado no Stripe; este mapa serve como rede de seguranca.
const ACADEMY_PRICES: Record<string, string> = {
  "ingles-para-atendimento-em-saude": "price_1UDSqwBUEEEAHx2hlH8vQon7",
  "espanhol-para-atendimento-em-saude": "price_1UDVX0BUEEEAHx2htRTwbhZF",
  "international-healthcare-kit": "price_1UDVZrBUEEEAHx2hNV5nV2Ar",
};

/** Palavras-chave por material, iguais as usadas em academy-prices. */
const MATCHERS: Record<string, string[][]> = {
  "ingles-para-atendimento-em-saude": [["apostila", "ingl"], ["ingl"]],
  "espanhol-para-atendimento-em-saude": [["apostila", "espanhol"], ["espanhol"]],
  "international-healthcare-kit": [["bundle"], ["kit"], ["ingl", "espanhol"]],
  "pacote-completo": [["pacote", "completo"]],
};

/** Busca no Stripe o price_id ativo mais recente do material. */
async function resolvePrice(stripe: Stripe, slug: string): Promise<string | undefined> {
  const groups = MATCHERS[slug];
  if (!groups) return undefined;
  try {
    const products = await stripe.products.list({ active: true, limit: 100 });
    for (const group of groups) {
      const product = products.data.find((p) => {
        const name = (p.name || "").toLowerCase();
        if (name.includes("mensal") || name.includes("anual") || name.includes("essencial")) return false;
        return group.every((k) => name.includes(k));
      });
      if (!product) continue;
      const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
      const oneOff = prices.data
        .filter((p) => !p.recurring && typeof p.unit_amount === "number")
        .sort((a, b) => b.created - a.created)[0];
      if (oneOff) return oneOff.id;
    }
  } catch (e) {
    console.error("[ACADEMY-CHECKOUT] resolvePrice", e instanceof Error ? e.message : e);
  }
  return undefined;
}



const ALLOWED_ORIGIN_SUFFIX = [".lovable.app", ".lovableproject.com", ".sandbox.lovable.dev"];
const ALLOWED_ORIGINS = [
  "https://salbcare.com",
  "https://www.salbcare.com",
  "https://salbcare.com.br",
  "https://www.salbcare.com.br",
];

function safeOrigin(origin: string | null): string {
  if (!origin) return "https://salbcare.com";
  try {
    const u = new URL(origin);
    if (ALLOWED_ORIGINS.includes(origin)) return origin;
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return origin;
    if (ALLOWED_ORIGIN_SUFFIX.some((s) => u.hostname.endsWith(s))) return origin;
  } catch {
    /* ignora */
  }
  return "https://salbcare.com";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });

  try {
    const body = await req.json().catch(() => ({}));
    const slug = typeof body?.slug === "string" ? body.slug : "";
    const price = ACADEMY_PRICES[slug];
    if (!price) return json({ error: "Material indisponivel para compra." }, 400);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Login opcional: se houver sessao, reaproveita o cliente Stripe do e-mail.
    let email: string | undefined;
    let userId: string | undefined;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      );
      const { data } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      email = data.user?.email ?? undefined;
      userId = data.user?.id ?? undefined;
    }

    let customerId: string | undefined;
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }

    const origin = safeOrigin(req.headers.get("origin"));
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [{ price, quantity: 1 }],
      mode: "payment",
      allow_promotion_codes: true,
      metadata: { academy_slug: slug, user_id: userId ?? "" },
      success_url: `${origin}/academy/obrigado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/academy/${slug}`,
    });

    return json({ url: session.url });
  } catch (error) {
    console.error("[ACADEMY-CHECKOUT]", error instanceof Error ? error.message : error);
    return json({ error: "Nao foi possivel abrir o pagamento. Tente novamente." }, 500);
  }
});
