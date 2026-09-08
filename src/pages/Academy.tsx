import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/pro/SiteChrome";
import { CREAM, MONO, NAVY, ProLabel, SANS, TEAL, proStyles } from "@/components/pro/brand";
import { useAcademyCatalog } from "@/hooks/useAcademyCatalog";
import { AcademyCardGrid } from "@/components/academy/AcademyCards";

const ACADEMY_STYLES = `
  .academy-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
  .academy-card { display: block; text-decoration: none; color: inherit; transition: border-color 160ms ease; }
  .academy-card:hover { border-color: rgba(31,31,31,0.4); }
  @media (max-width: 720px) { .academy-grid { grid-template-columns: 1fr; } }
  @media (prefers-reduced-motion: reduce) { .academy-card { transition: none; } }
`;

const Academy = () => {
  const { products } = useAcademyCatalog();
  return (
  <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: SANS }}>
    <Helmet>
      <title>SalbCare Academy | Materiais práticos para profissionais de saúde</title>
      <meta
        name="description"
        content="Apostilas, ebooks, templates e checklists para profissionais de saúde que querem atender melhor, inclusive pacientes internacionais. Primeiro material: Inglês para Atendimento em Saúde."
      />
      <link rel="canonical" href="https://salbcare.com/academy" />
      <meta property="og:title" content="SalbCare Academy | Materiais práticos para profissionais de saúde" />
      <meta
        property="og:description"
        content="Conhecimento e ferramentas para profissionais de saúde que querem atender melhor, inclusive pacientes internacionais."
      />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
    <style>{proStyles + ACADEMY_STYLES}</style>

    <SiteHeader />

    <section className="pro-wrap pro-section">
      <ProLabel>SalbCare Academy</ProLabel>
      <h1 className="pro-h1" style={{ maxWidth: 640 }}>
        Aprenda o que sua faculdade não ensinou.
      </h1>
      <p className="pro-lead" style={{ marginTop: 20, maxWidth: 560 }}>
        Conhecimento e ferramentas para profissionais de saúde que querem atender melhor, inclusive pacientes
        internacionais.
      </p>
      <div style={{ marginTop: 30, display: "grid", gap: 10, maxWidth: 320 }}>
        <Link to="/academy/jogo" className="pro-cta" style={{ textDecoration: "none" }}>
          Praticar atendimento grátis
        </Link>
        <Link to={`/academy/${products[0].slug}`} className="pro-cta pro-cta-ghost" style={{ textDecoration: "none" }}>
          Ver material
        </Link>
      </div>
    </section>

    <hr className="pro-rule" />

    <section className="pro-wrap pro-section">
      <ProLabel>Materiais</ProLabel>
      <h2 className="pro-h2" style={{ marginTop: 14 }}>
        Materiais práticos, prontos para usar.
      </h2>
      <div style={{ marginTop: 28 }}>
        <AcademyCardGrid />
      </div>
    </section>

    <hr className="pro-rule" />

    <section className="pro-wrap pro-section">
      <ProLabel>E depois do material</ProLabel>
      <h2 className="pro-h2" style={{ marginTop: 14, maxWidth: 600 }}>
        Organize o consultório com o SalbCare PRO.
      </h2>
      <p className="pro-body" style={{ marginTop: 16, maxWidth: 560 }}>
        Agenda, pacientes, prontuário, financeiro e sua própria página de agendamento, com recursos em português,
        inglês e espanhol.
      </p>
      <div style={{ marginTop: 28 }}>
        <Link to="/pro" className="pro-cta" style={{ textDecoration: "none" }}>
          Conhecer o PRO
        </Link>
      </div>
    </section>

    <SiteFooter />
    </div>
  );
};

export default Academy;
