// academy-prices
// Busca preco e price_id ativos dos materiais da Academy direto no Stripe.
// Publico e somente leitura. A secret key nunca sai do backend.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Palavras-chave por material. O primeiro produto ativo que casa vence. */
const MATCHERS: { slug: string; keywords: string[][] }[] = [
  {
    slug: "ingles-para-atendimento-em-saude",
    keywords: [["apostila", "ingl"], ["ingl"]],
  },
  {
    slug: "espanhol-para-atendimento-em-saude",
    keywords: [["apostila", "espanhol"], ["espanhol"]],
  },
  {
    slug: "international-healthcare-kit",
    keywords: [["bundle"], ["kit"], ["ingl", "espanhol"]],
  },
  {
    slug: "pacote-completo",
    keywords: [["pacote", "completo"]],
  },
];

type Item = {
  slug: string;
  priceId: string | null;
  amountCents: number | null;
  currency: string | null;
  price: string | null;
  available: boolean;
};

const brl = (cents: number, currency: string) =>
  currency === "brl"
    ? `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`
    : `${currency.toUpperCase()} ${(cents / 100).toFixed(2)}`;

// Cache em memoria por 5 minutos (por instancia da funcao).
let cache: { at: number; items: Item[] } | null = null;
const TTL_MS = 5 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
      status,
    });

  try {
    if (cache && Date.now() - cache.at < TTL_MS) return json({ items: cache.items, cached: true });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const products = await stripe.products.list({ active: true, limit: 100 });
    const items: Item[] = [];

    for (const m of MATCHERS) {
      let product: Stripe.Product | undefined;
      for (const group of m.keywords) {
        product = products.data.find((p) => {
          const name = (p.name || "").toLowerCase();
          const isSubscription = name.includes("mensal") || name.includes("anual") || name.includes("essencial") || name.includes("completo anual");
          if (isSubscription) return false;
          return group.every((k) => name.includes(k));
        });
        if (product) break;
      }

      if (!product) {
        items.push({ slug: m.slug, priceId: null, amountCents: null, currency: null, price: null, available: false });
        continue;
      }

      const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
      const oneOff = prices.data
        .filter((p) => !p.recurring && typeof p.unit_amount === "number")
        .sort((a, b) => b.created - a.created)[0];

      if (!oneOff) {
        items.push({ slug: m.slug, priceId: null, amountCents: null, currency: null, price: null, available: false });
        continue;
      }

      items.push({
        slug: m.slug,
        priceId: oneOff.id,
        amountCents: oneOff.unit_amount ?? null,
        currency: oneOff.currency,
        price: brl(oneOff.unit_amount ?? 0, oneOff.currency),
        available: true,
      });
    }

    cache = { at: Date.now(), items };
    return json({ items, cached: false });
  } catch (error) {
    console.error("[ACADEMY-PRICES]", error instanceof Error ? error.message : error);
    // Falha nao quebra a secao: o front mostra "Consulte o preco".
    return json({ items: [], error: "unavailable" }, 200);
  }
});
