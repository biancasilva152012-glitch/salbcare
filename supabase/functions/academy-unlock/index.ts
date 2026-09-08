// academy-unlock
// Libera o material comprado na Academy SEM exigir conta no SalbCare.
// Dois modos:
//  1) { session_id } vindo da pagina /academy/obrigado apos o pagamento
//  2) { token } colado por quem ja comprou e quer reabrir em outro aparelho
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUCKET = "academy-materials";
// Cada produto pode liberar um ou mais PDFs (o pacote libera os dois).
const FILES: Record<string, { file: string; title: string }[]> = {
  "ingles-para-atendimento-em-saude": [
    { file: "ingles-para-atendimento-em-saude.pdf", title: "Inglês para Atendimento em Saúde" },
  ],
  "espanhol-para-atendimento-em-saude": [
    { file: "espanhol-para-atendimento-em-saude.pdf", title: "Espanhol para Atendimento em Saúde" },
  ],
  "international-healthcare-kit": [
    { file: "ingles-para-atendimento-em-saude.pdf", title: "Inglês para Atendimento em Saúde" },
    { file: "espanhol-para-atendimento-em-saude.pdf", title: "Espanhol para Atendimento em Saúde" },
  ],
};
const LANGS: Record<string, string[]> = {
  "ingles-para-atendimento-em-saude": ["pt", "en"],
  "espanhol-para-atendimento-em-saude": ["pt", "es"],
  "international-healthcare-kit": ["pt", "en", "es"],
};


const newToken = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  const signedList = async (slug: string) => {
    const files = FILES[slug] ?? [];
    const out: { title: string; url: string }[] = [];
    for (const f of files) {
      const { data } = await admin.storage.from(BUCKET).createSignedUrl(f.file, 60 * 60 * 24 * 7);
      if (data?.signedUrl) out.push({ title: f.title, url: data.signedUrl });
    }
    return out;
  };


  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body?.session_id === "string" ? body.session_id.trim() : "";
    const rawToken = typeof body?.token === "string" ? body.token.trim() : "";

    // Aceita token puro ou link completo com ?token=...
    let token = rawToken;
    if (token.includes("token=")) {
      try {
        token = new URL(token).searchParams.get("token") ?? token;
      } catch {
        token = token.split("token=")[1]?.split("&")[0] ?? token;
      }
    }

    if (token) {
      const { data: purchase } = await admin
        .from("academy_purchases")
        .select("*")
        .eq("token", token)
        .maybeSingle();
      if (!purchase) return json({ access: false, reason: "invalid" }, 404);
      if (new Date(purchase.expires_at).getTime() < Date.now()) {
        return json({ access: false, reason: "expired" }, 410);
      }
      if (purchase.downloads >= purchase.max_downloads) {
        return json({ access: false, reason: "limit" }, 429);
      }
      await admin
        .from("academy_purchases")
        .update({ downloads: purchase.downloads + 1 })
        .eq("id", purchase.id);
      const downloads = await signedList(purchase.slug);
      return json({
        access: true,
        slug: purchase.slug,
        token: purchase.token,
        langs: LANGS[purchase.slug] ?? ["pt"],
        downloads,
        download_url: downloads[0]?.url ?? null,
        expires_at: purchase.expires_at,
      });
    }


    if (!sessionId) return json({ access: false, reason: "missing" }, 400);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") return json({ access: false, reason: "unpaid" }, 402);

    const slug = String(session.metadata?.academy_slug ?? "");
    if (!slug) return json({ access: false, reason: "unknown_product" }, 400);

    const email = session.customer_details?.email ?? session.customer_email ?? null;

    const { data: existing } = await admin
      .from("academy_purchases")
      .select("*")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    let purchase = existing;
    if (!purchase) {
      const { data: inserted, error } = await admin
        .from("academy_purchases")
        .insert({ token: newToken(), email, slug, stripe_session_id: session.id })
        .select("*")
        .single();
      if (error) throw error;
      purchase = inserted;
    }

    return json({
      access: true,
      slug: purchase.slug,
      token: purchase.token,
      email: purchase.email,
      download_url: await signed(purchase.slug),
      expires_at: purchase.expires_at,
    });
  } catch (error) {
    console.error("[ACADEMY-UNLOCK]", error instanceof Error ? error.message : error);
    return json({ access: false, reason: "error" }, 500);
  }
});
