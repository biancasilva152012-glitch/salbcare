import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/pro/SiteChrome";
import { CREAM, MONO, NAVY, ProLabel, SANS, TEAL, proStyles } from "@/components/pro/brand";
import { academyWhatsAppLink } from "@/config/academy";
import { useAcademyProduct } from "@/hooks/useAcademyCatalog";

const PRODUCT_STYLES = `
  .academy-sticky {
    position: sticky; bottom: 0; z-index: 5;
    background: rgba(247,243,238,0.96);
    border-top: 1px solid rgba(31,31,31,0.12);
    padding: 12px 22px calc(12px + env(safe-area-inset-bottom));
    display: flex; justify-content: center;
  }
  @media (min-width: 768px) { .academy-sticky { display: none; } }
`;

const AcademyProduct = () => {
  const { slug } = useParams();
  const { product } = useAcademyProduct(slug);

  if (!product) {
    return (
      <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: SANS }}>
        <style>{proStyles}</style>
        <SiteHeader />
        <section className="pro-wrap pro-section">
          <h1 className="pro-h2">Material não encontrado.</h1>
          <div style={{ marginTop: 24 }}>
            <Link to="/academy" className="pro-cta" style={{ textDecoration: "none" }}>
              Ver todos os materiais
            </Link>
          </div>
        </section>
        <SiteFooter />
      </div>
    );
  }

  const remote = prices[product.slug];
  const available = remote ? remote.available : product.status === "available";
  const price = remote?.price ?? product.price ?? null;
  const buyLink = academyWhatsAppLink(product.title);
  const [loading, setLoading] = useState(false);

  const startCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("academy-checkout", {
        body: { slug: product.slug },
      });
      if (error || !data?.url) throw new Error(data?.error || "checkout");
      window.location.href = data.url as string;
    } catch {
      toast.error("Não foi possível abrir o pagamento. Tente novamente.");
      setLoading(false);
    }
  };

  const buyLabel = loading ? "Abrindo pagamento" : `Comprar por ${product.price ?? ""}`.trim();

  const BuyButton = ({ mono = false }: { mono?: boolean }) =>
    available ? (
      <button type="button" className="pro-cta" onClick={startCheckout} disabled={loading} style={mono ? { fontFamily: MONO } : undefined}>
        {buyLabel}
      </button>
    ) : (
      <a href={buyLink} target="_blank" rel="noreferrer" className="pro-cta" style={{ textDecoration: "none", ...(mono ? { fontFamily: MONO } : {}) }}>
        Avise-me no lançamento
      </a>
    );

  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: SANS }}>
      <Helmet>
        <title>{`${product.title} | SalbCare Academy`}</title>
        <meta name="description" content={product.summary} />
        <link rel="canonical" href={`https://salbcare.com/academy/${product.slug}`} />
        <meta property="og:title" content={`${product.title} | SalbCare Academy`} />
        <meta property="og:description" content={product.summary} />
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <style>{proStyles + PRODUCT_STYLES}</style>

      <SiteHeader />

      <section className="pro-wrap pro-section">
        <ProLabel>SalbCare Academy</ProLabel>
        <h1 className="pro-h1" style={{ maxWidth: 660 }}>
          {product.title}
        </h1>
        <p className="pro-lead" style={{ marginTop: 20, maxWidth: 560 }}>
          {product.summary}
        </p>
        <p className="pro-mono" style={{ marginTop: 16 }}>
          {product.statusLabel} · {product.formatLabel}
          {product.price ? ` · ${product.price}` : ""}
        </p>
        <div style={{ marginTop: 28 }}>
          <BuyButton />
        </div>
        {available && (
          <p className="pro-note" style={{ marginTop: 12 }}>
            Pagamento seguro pelo Stripe. Cartão, Apple Pay e Google Pay. Envio do PDF por e-mail.
          </p>
        )}
      </section>

      <hr className="pro-rule" />

      <section className="pro-wrap pro-section">
        <h2 className="pro-h2" style={{ maxWidth: 600 }}>
          Um material de trabalho, não um curso.
        </h2>
        {product.description.map((p) => (
          <p key={p} className="pro-body" style={{ marginTop: 16, maxWidth: 600 }}>
            {p}
          </p>
        ))}
      </section>

      <hr className="pro-rule" />

      <section className="pro-wrap pro-section">
        <ProLabel>O que está dentro</ProLabel>
        <ul style={{ listStyle: "none", padding: 0, margin: "24px 0 0", maxWidth: 620 }}>
          {product.contents.map((item) => (
            <li
              key={item}
              className="pro-block"
              style={{ display: "flex", gap: 12, alignItems: "flex-start", margin: 0 }}
            >
              <Check size={17} strokeWidth={1.6} color={TEAL} style={{ marginTop: 3, flexShrink: 0 }} aria-hidden />
              <span className="pro-body">{item}</span>
            </li>
          ))}
        </ul>
        <p className="pro-mono" style={{ marginTop: 22, maxWidth: 600, lineHeight: 1.6 }}>
          Para quem é: {product.audience}
        </p>
      </section>

      <hr className="pro-rule" />

      <section className="pro-wrap pro-section">
        <ProLabel>Depois do material</ProLabel>
        <h2 className="pro-h2" style={{ marginTop: 14, maxWidth: 600 }}>
          Seu consultório organizado para o mundo.
        </h2>
        <p className="pro-body" style={{ marginTop: 16, maxWidth: 560 }}>
          O SalbCare PRO reúne agenda, pacientes, prontuário, financeiro e sua página de agendamento, com recursos em
          português, inglês e espanhol.
        </p>
        <div style={{ marginTop: 28 }}>
          <Link to="/pro" className="pro-cta" style={{ textDecoration: "none" }}>
            Conhecer o PRO
          </Link>
        </div>
      </section>

      <SiteFooter />

      <div className="academy-sticky">
        <BuyButton mono />
      </div>
    </div>
  );
};

export default AcademyProduct;
