// academy-certificate
// Emite e consulta o certificado da Academy.
// Só emite para quem tem uma compra confirmada (token gerado apos pagamento
// aprovado no Stripe) e concluiu o idioma com aproveitamento minimo de 70.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_SCORE = 70;

const LANGS: Record<string, string[]> = {
  "ingles-para-atendimento-em-saude": ["en"],
  "espanhol-para-atendimento-em-saude": ["es"],
  "international-healthcare-kit": ["en", "es"],
  "pacote-completo": ["en", "es"],
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return "SC-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
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

  try {
    const body = await req.json().catch(() => ({}));

    // Consulta publica por codigo
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    if (code) {
      const { data } = await admin.rpc("verify_academy_certificate", { _code: code });
      const found = Array.isArray(data) ? data[0] : data;
      if (!found) return json({ valid: false, reason: "invalid" }, 404);
      return json({ valid: true, certificate: found });
    }

    // Emissao
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 120) : "";
    const language = typeof body?.language === "string" ? body.language.trim().toLowerCase() : "";
    const score = Math.round(Number(body?.score));

    if (!token || !name || !language || !Number.isFinite(score)) {
      return json({ issued: false, reason: "missing" }, 400);
    }
    if (score < MIN_SCORE) return json({ issued: false, reason: "score" }, 400);

    const { data: purchase } = await admin
      .from("academy_purchases")
      .select("id, slug")
      .eq("token", token)
      .maybeSingle();
    if (!purchase) return json({ issued: false, reason: "no_purchase" }, 403);

    const allowed = LANGS[purchase.slug] ?? [];
    if (!allowed.includes(language)) return json({ issued: false, reason: "language" }, 403);

    const { data: existing } = await admin
      .from("academy_certificates")
      .select("code, holder_name, language, score, slug, issued_at")
      .eq("purchase_id", purchase.id)
      .eq("language", language)
      .maybeSingle();

    if (existing) {
      if (score > existing.score) {
        await admin
          .from("academy_certificates")
          .update({ score, holder_name: name })
          .eq("code", existing.code);
        return json({ issued: true, certificate: { ...existing, score, holder_name: name } });
      }
      return json({ issued: true, certificate: existing });
    }

    const { data: created, error } = await admin
      .from("academy_certificates")
      .insert({
        code: newCode(),
        purchase_id: purchase.id,
        holder_name: name,
        language,
        score,
        slug: purchase.slug,
      })
      .select("code, holder_name, language, score, slug, issued_at")
      .single();
    if (error) throw error;

    return json({ issued: true, certificate: created });
  } catch (error) {
    console.error("[ACADEMY-CERTIFICATE]", error instanceof Error ? error.message : error);
    return json({ issued: false, reason: "error" }, 500);
  }
});
