import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/pro/SiteChrome";
import { CREAM, NAVY, ProLabel, SANS, TEAL, proStyles } from "@/components/pro/brand";

const AcademyObrigado = () => (
  <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: SANS }}>
    <Helmet>
      <title>Compra confirmada | SalbCare Academy</title>
      <meta name="robots" content="noindex" />
    </Helmet>
    <style>{proStyles}</style>
    <SiteHeader />

    <section className="pro-wrap pro-section">
      <Check size={26} strokeWidth={1.6} color={TEAL} aria-hidden />
      <ProLabel>SalbCare Academy</ProLabel>
      <h1 className="pro-h1" style={{ maxWidth: 620 }}>
        Compra confirmada.
      </h1>
      <p className="pro-lead" style={{ marginTop: 20, maxWidth: 560 }}>
        Você recebe o material em PDF no e-mail usado no pagamento, em alguns minutos. Entre com o mesmo e-mail para
        liberar todas as categorias do Quick Card.
      </p>
      <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 12 }}>
        <Link to="/quick-card" className="pro-cta" style={{ textDecoration: "none" }}>
          Abrir o Quick Card
        </Link>
        <Link to="/academy" className="pro-link">
          Ver outros materiais
        </Link>
      </div>
    </section>

    <SiteFooter />
  </div>
);

export default AcademyObrigado;
