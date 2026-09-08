import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/pro/SiteChrome";
import { CREAM, MONO, NAVY, ProLabel, SANS, TEAL, proStyles } from "@/components/pro/brand";
import { academyWhatsAppLink, getAcademyProduct } from "@/config/academy";

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
  const product = getAcademyProduct(slug);

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

  const buyLink = academyWhatsAppLink(product.title);
  const available = product.status === "available";

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
          <a href={buyLink} target="_blank" rel="noreferrer" className="pro-cta" style={{ textDecoration: "none" }}>
            {available ? "Quero este material" : "Avise-me no lançamento"}
          </a>
        </div>
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
        <a
          href={buyLink}
          target="_blank"
          rel="noreferrer"
          className="pro-cta"
          style={{ textDecoration: "none", fontFamily: MONO }}
        >
          {available ? "Quero este material" : "Avise-me no lançamento"}
        </a>
      </div>
    </div>
  );
};

export default AcademyProduct;
