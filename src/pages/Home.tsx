import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  FileText,
  Globe2,
  LineChart,
  Link2,
  Users,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/pro/SiteChrome";
import { ProAgendaMini, panelMockStyles } from "@/components/pro/ProPanelMock";
import { CREAM, MONO, NAVY, ProLabel, SANS, TEAL, proStyles } from "@/components/pro/brand";
import { ACADEMY_PRODUCTS } from "@/config/academy";
import { AcademyCardGrid } from "@/components/academy/AcademyCards";


const PRO_ITEMS = [
  { title: "Agenda", line: "Os atendimentos do dia em uma única tela.", Icon: CalendarDays },
  { title: "Pacientes", line: "Contato, histórico e observações organizados.", Icon: Users },
  { title: "Prontuário", line: "Registro clínico de cada atendimento, sempre à mão.", Icon: FileText },
  { title: "Financeiro", line: "Entradas, saídas e o resultado do mês pronto.", Icon: LineChart },
  { title: "Página profissional", line: "Um link próprio para receber solicitações de horário.", Icon: Link2 },
  { title: "Atendimento internacional", line: "Recursos em português, inglês e espanhol.", Icon: Globe2 },
];



const HOME_STYLES = `
  .home-hero { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 48px; align-items: center; }
  .home-hero-mock { min-width: 0; }
  .home-ctas { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
  .home-cta-secondary {
    display: inline-flex; align-items: center; justify-content: center;
    min-height: 52px; padding: 16px 26px; border-radius: 999px;
    border: 1px solid rgba(31,31,31,0.2); background: transparent;
    font-family: ${MONO}; font-size: 13px; letter-spacing: 0.06em; color: ${CREAM};
    text-decoration: none;
  }
  .home-cta-secondary:hover { border-color: rgba(31,31,31,0.45); }
  .home-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  @media (max-width: 900px) {
    .home-hero { grid-template-columns: 1fr; gap: 32px; }
    .home-grid3 { grid-template-columns: 1fr; }
    .home-ctas > * { width: 100%; max-width: none; }
  }
`;

const Home = () => (
  <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: SANS }}>
    <Helmet>
      <title>SalbCare | Sua carreira na saúde, no mapa do mundo</title>
      <meta
        name="description"
        content="Gestão de consultório, conhecimento e ferramentas para profissionais de saúde que querem trabalhar melhor e atender pacientes de qualquer lugar do mundo."
      />
      <link rel="canonical" href="https://salbcare.com/" />
      <meta property="og:title" content="SalbCare | Sua carreira na saúde, no mapa do mundo" />
      <meta
        property="og:description"
        content="SalbCare PRO para a gestão do consultório e SalbCare Academy para o desenvolvimento profissional."
      />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
    <style>{proStyles + panelMockStyles + HOME_STYLES}</style>

    <SiteHeader />

    {/* HERO */}
    <section className="pro-wrap pro-section home-hero" style={{ paddingTop: 56 }}>
      <div>
        <h1 className="pro-h1" style={{ maxWidth: 660, marginTop: 0 }}>
          Sua carreira na saúde, no mapa do mundo.
        </h1>

        <p className="pro-lead" style={{ marginTop: 20, maxWidth: 540 }}>
          Gestão, conhecimento e ferramentas para profissionais de saúde que querem cuidar melhor, trabalhar melhor e
          estar preparados para atender pacientes de qualquer lugar do mundo.
        </p>
        <div className="home-ctas" style={{ marginTop: 32 }}>
          <Link to="/pro" className="pro-cta" style={{ textDecoration: "none" }}>
            Conhecer o SalbCare PRO
          </Link>
          <Link to="/academy" className="home-cta-secondary">
            Conhecer a Academy
          </Link>
        </div>
        <p className="pro-mono" style={{ marginTop: 14 }}>
          Software de gestão e materiais educacionais. Sem comissão por consulta.
        </p>
      </div>
      <div className="home-hero-mock">
        <ProAgendaMini />
      </div>
    </section>

    <hr className="pro-rule" />

    {/* PRO */}
    <section className="pro-wrap pro-section">
      <ProLabel>SalbCare PRO</ProLabel>
      <h2 className="pro-h2" style={{ marginTop: 14, maxWidth: 620 }}>
        Seu consultório. Sua gestão. Seu mundo.
      </h2>
      <p className="pro-body" style={{ marginTop: 16, maxWidth: 580 }}>
        O sistema de gestão da SalbCare reúne o dia a dia do consultório em um só lugar, com recursos multilíngues para
        quem também atende paciente estrangeiro.
      </p>
      <div className="pro-grid2" style={{ marginTop: 28, rowGap: 40 }}>
        {PRO_ITEMS.map(({ title, line, Icon }) => (
          <div key={title} className="pro-block">
            <Icon size={20} strokeWidth={1.5} color={TEAL} aria-hidden />
            <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: "0.04em", marginTop: 12 }}>{title}</div>
            <p className="pro-body" style={{ margin: "8px 0 0" }}>
              {line}
            </p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 32 }}>
        <Link to="/pro" className="pro-cta" style={{ textDecoration: "none" }}>
          Conhecer o PRO
        </Link>
      </div>
    </section>

    <hr className="pro-rule" />

    {/* ACADEMY */}
    <section className="pro-wrap pro-section">
      <ProLabel>SalbCare Academy</ProLabel>
      <h2 className="pro-h2" style={{ marginTop: 14, maxWidth: 620 }}>
        Comece por {ACADEMY_PRODUCTS[0].price}
      </h2>
      <p className="pro-body" style={{ marginTop: 16, maxWidth: 580 }}>
        Apostilas de Inglês e Espanhol para Atendimento em Saúde, sem precisar assinar nada.
      </p>
      <div style={{ marginTop: 28 }}>
        <AcademyCardGrid className="home-grid3" />
      </div>
      <div className="home-ctas" style={{ marginTop: 32 }}>
        <Link to="/academy/jogo" className="pro-cta" style={{ textDecoration: "none" }}>
          Praticar atendimento grátis
        </Link>
        <Link to="/academy" className="home-cta-secondary">
          Ver na Academy
        </Link>
      </div>
    </section>

    <hr className="pro-rule" />

    {/* QUICK CARD */}
    <section className="pro-wrap pro-section">
      <ProLabel>Quick Card</ProLabel>
      <h2 className="pro-h2" style={{ marginTop: 14, maxWidth: 620 }}>
        Treine igual um app de idiomas, feito para o consultório.
      </h2>
      <p className="pro-body" style={{ marginTop: 16, maxWidth: 580 }}>
        Frases de emergência grátis, direto no navegador. Sem cadastro.
      </p>
      <div style={{ marginTop: 28 }}>
        <Link to="/quick-card" className="pro-cta" style={{ textDecoration: "none" }}>
          Começar agora
        </Link>
      </div>
    </section>


    <hr className="pro-rule" />

    {/* KITE */}
    <section className="pro-wrap pro-section">
      <ProLabel>SalbCare Kite</ProLabel>
      <h2 className="pro-h2" style={{ marginTop: 14, maxWidth: 620 }}>
        Saúde, viagem e kitesurf no mesmo universo.
      </h2>
      <p className="pro-body" style={{ marginTop: 16, maxWidth: 580 }}>
        Kite é a vertical de conteúdo e comunidade da SalbCare sobre cuidado durante viagens, esportes de vento e a
        internacionalização da carreira em saúde. Não é uma vitrine de profissionais nem um serviço de agendamento
        para pacientes.
      </p>
      <div style={{ marginTop: 28 }}>
        <Link to="/journal" className="home-cta-secondary">
          Ler no Journal
        </Link>
      </div>
    </section>

    <hr className="pro-rule" />

    {/* CTA FINAL */}
    <section className="pro-wrap pro-section" style={{ textAlign: "center" }}>
      <h2 className="pro-h2">Comece pelo que você precisa hoje.</h2>
      <p className="pro-body" style={{ margin: "18px auto 0", maxWidth: 470 }}>
        Teste o sistema completo por 7 dias, sem cartão de crédito, ou comece pelos materiais da Academy.

      </p>
      <div className="home-ctas" style={{ marginTop: 28, justifyContent: "center" }}>
        <Link to="/pro" className="pro-cta" style={{ textDecoration: "none" }}>
          Conhecer o SalbCare PRO
        </Link>
        <Link to="/academy" className="home-cta-secondary">
          Conhecer a Academy
        </Link>
      </div>
    </section>

    <SiteFooter />
  </div>
);

export default Home;
