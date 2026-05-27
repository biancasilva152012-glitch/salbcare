import { useState } from "react";
import { subscribeNewsletter } from "@/lib/blog/queries";
import type { BlogLang, PublicationSlug } from "@/lib/blog/types";

interface Props {
  publication: PublicationSlug;
  lang: BlogLang;
  source: string;
}

const COPY: Record<PublicationSlug, Record<BlogLang, { eyebrow: string; headline: string; sub: string; placeholder: string; cta: string; ok: string; dup: string; err: string }>> = {
  pro: {
    pt: {
      eyebrow: "RECEBA ATUALIZAÇÕES",
      headline: "Conteúdo prático, uma vez por mês",
      sub: "Sem spam. Cancele quando quiser.",
      placeholder: "Seu email",
      cta: "Inscrever",
      ok: "✓ Inscrição confirmada.",
      dup: "Você já está inscrito.",
      err: "Erro. Tente novamente.",
    },
    en: {
      eyebrow: "GET UPDATES",
      headline: "Practical content, once a month",
      sub: "No spam. Unsubscribe anytime.",
      placeholder: "Your email",
      cta: "Subscribe",
      ok: "✓ Subscribed.",
      dup: "You're already subscribed.",
      err: "Something went wrong.",
    },
    es: {
      eyebrow: "RECIBE NOVEDADES",
      headline: "Contenido práctico, una vez al mes",
      sub: "Sin spam. Cancela cuando quieras.",
      placeholder: "Tu correo",
      cta: "Suscribirme",
      ok: "✓ Suscripción confirmada.",
      dup: "Ya estás suscrito.",
      err: "Error. Intenta de nuevo.",
    },
  },
  journal: {
    en: {
      eyebrow: "JOIN THE READERS",
      headline: "Substantial essays. Once a month.",
      sub: "No promotions. No fluff. Just writing you'd actually pay for.",
      placeholder: "Your email",
      cta: "Subscribe",
      ok: "✓ You're in.",
      dup: "You're already subscribed.",
      err: "Something went wrong.",
    },
    pt: {
      eyebrow: "JUNTE-SE AOS LEITORES",
      headline: "Ensaios substanciais. Uma vez por mês.",
      sub: "Sem promoções. Sem ruído. Apenas escrita que você pagaria para ler.",
      placeholder: "Seu email",
      cta: "Assinar",
      ok: "✓ Confirmado.",
      dup: "Você já assina.",
      err: "Erro. Tente novamente.",
    },
    es: {
      eyebrow: "ÚNETE A LOS LECTORES",
      headline: "Ensayos sustanciales. Una vez al mes.",
      sub: "Sin promociones. Sin ruido. Solo escritura que pagarías por leer.",
      placeholder: "Tu correo",
      cta: "Suscribirme",
      ok: "✓ Confirmado.",
      dup: "Ya estás suscrito.",
      err: "Error. Intenta de nuevo.",
    },
  },
};

export default function NewsletterInline({ publication, lang, source }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "dup" | "err">("idle");
  const copy = COPY[publication][lang];
  const accentVar = publication === "pro" ? "--blog-pro" : "--blog-journal";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    const res = await subscribeNewsletter(email, lang, source, publication);
    if (res.ok) {
      setStatus("ok");
      setEmail("");
    } else if (res.error === "already_subscribed") setStatus("dup");
    else setStatus("err");
  }

  return (
    <aside
      className="rounded-2xl p-8 my-12"
      style={{ background: "hsl(var(--brand-darker))", border: `1px solid hsl(var(${accentVar}) / 0.25)` }}
    >
      <p className="text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: `hsl(var(${accentVar}))` }}>
        {copy.eyebrow}
      </p>
      <h3 className={`text-2xl mb-2 ${publication === "journal" ? "font-journal italic" : "font-semibold"}`}>
        {copy.headline}
      </h3>
      <p className="text-sm opacity-70 mb-5">{copy.sub}</p>
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={copy.placeholder}
          className="flex-1 bg-transparent border rounded-md px-4 py-3 text-sm focus:outline-none"
          style={{ borderColor: `hsl(var(${accentVar}) / 0.35)` }}
        />
        <button
          type="submit"
          className="px-6 py-3 text-sm rounded-md font-medium"
          style={{ background: `hsl(var(${accentVar}))`, color: "hsl(var(--brand-darker))" }}
        >
          {copy.cta}
        </button>
      </form>
      {status === "ok" && <p className="text-xs mt-3 opacity-70">{copy.ok}</p>}
      {status === "dup" && <p className="text-xs mt-3 opacity-70">{copy.dup}</p>}
      {status === "err" && <p className="text-xs mt-3 opacity-70">{copy.err}</p>}
    </aside>
  );
}
