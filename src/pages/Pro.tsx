import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  CalendarDays,
  CalendarX2,
  LineChart,
  Link2,
  NotebookPen,
  Users,
  Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProSubscription } from "@/hooks/useProSubscription";
import ProPanelMock, { ProAgendaMini, panelMockStyles } from "@/components/pro/ProPanelMock";
import { AcademyCardGrid } from "@/components/academy/AcademyCards";

import {
  CREAM,
  MONO,
  NAVY,
  PRO_PLANS,
  annualEquivalentMonthly,
  annualSaving,
  brl,
  ProLabel,
  ProPlanKey,
  ProWordmark,
  SANS,
  TEAL,
  proStyles,
} from "@/components/pro/brand";

const PAINS = [
  { text: "Agenda espalhada entre papel, caderno e WhatsApp.", Icon: NotebookPen },
  { text: "Faltas e remarcações que você descobre tarde demais.", Icon: CalendarX2 },
  { text: "Financeiro do consultório sem controle no fim do mês.", Icon: Wallet },
];

const FEATURES = [
  {
    title: "Agenda",
    line: "Todos os atendimentos do dia em uma única tela, sem papel.",
    Icon: CalendarDays,
  },
  {
    title: "Pacientes",
    line: "Histórico, contato e observações de cada paciente organizados.",
    Icon: Users,
  },
  {
    title: "Financeiro",
    line: "Entradas e saídas do consultório com o resultado do mês pronto.",
    Icon: LineChart,
  },
  {
    title: "Página de agendamento",
    line: "Um link próprio para você divulgar e receber solicitações.",
    Icon: Link2,
  },
];

const LANDING_STYLES = `
  .pro-hero { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 48px; align-items: center; }
  .pro-hero-mock { min-width: 0; }
  .pro-pain-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .pro-pain-card {
    background: rgba(94,71,54,0.05);
    border: 1px solid rgba(31,31,31,0.12);
    border-radius: 12px;
    padding: 20px;
  }
  @media (max-width: 900px) {
    .pro-hero { grid-template-columns: 1fr; gap: 32px; }
    .pro-pain-grid { grid-template-columns: 1fr; }
  }
`;


const FAQ = [
  {
    q: "Como funciona o teste de 7 dias e o que acontece depois?",
    a: "Você cria sua conta e usa o sistema completo por 7 dias, sem cartão de crédito. Ao final, escolhe o plano mensal ou anual. Se não escolher nenhum, a conta apenas fica bloqueada e seus dados continuam salvos.",
  },
  {
    q: "Quanto custa e existe alguma taxa por consulta?",
    a: "O plano Essencial custa R$ 49 por mês, o Completo R$ 89 por mês e o Anual Fundador R$ 797 por ano, sem taxa de adesão. A SalbCare não cobra comissão por consulta: o valor do atendimento é definido por você e recebido diretamente por você.",
  },
  {
    q: "Quanto tempo leva para começar a usar de verdade?",
    a: "Cerca de dez minutos. Você preenche seus dados, define seus horários e já recebe o link da sua página de agendamento. Pacientes e lançamentos podem ser cadastrados no seu ritmo.",
  },
  {
    q: "Meus dados e os dados dos meus pacientes ficam seguros?",
    a: "Sim. Cada profissional acessa somente os próprios registros, o acesso é protegido por login e a estrutura segue as exigências da LGPD. Você pode exportar ou apagar seus dados quando quiser.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. O cancelamento é feito pelo próprio painel, em Assinatura, sem ligação e sem burocracia. Você continua com acesso até o fim do período já pago.",
  },
];

const NAV = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "O produto", href: "#produto" },
  { label: "Planos", href: "#planos" },
];

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

const track = (event: string, params: Record<string, unknown>) => {
  const g = (window as GtagWindow).gtag;
  if (typeof g === "function") g("event", event, params);
};

const Pro = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isActive } = useProSubscription();
  const [plan, setPlan] = useState<ProPlanKey>("completo");
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const soft = "#243447";

  const startTrial = () => {
    if (isActive) {
      navigate("/pro/painel");
      return;
    }
    navigate(user ? "/dashboard" : "/register?next=%2Fdashboard");
  };

  const selectPlan = (key: ProPlanKey) => {
    setPlan(key);
    track("select_item", {
      item_list_name: "planos_salbcare",
      items: [{ item_id: PRO_PLANS[key].id, item_name: PRO_PLANS[key].label, price: PRO_PLANS[key].amount }],
      currency: "BRL",
    });
  };

  const handleSubscribe = async () => {
    if (isActive) {
      navigate("/pro/painel");
      return;
    }
    const selected = PRO_PLANS[plan];
    track("begin_checkout", {
      currency: "BRL",
      value: selected.amount,
      items: [{ item_id: selected.id, item_name: selected.label, price: selected.amount }],
    });
    if (!user) {
      navigate("/login", { state: { from: { pathname: "/pro" } } });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("pro-checkout", {
        body: { priceId: selected.id },
      });
      if (error || !data?.url) throw error ?? new Error("sem url");
      window.location.href = data.url;
    } catch {
      toast.error("Não foi possível abrir o pagamento. Tente novamente.");
      setLoading(false);
    }
  };

  const planSummary =
    plan === "anual"
      ? `Plano ${PRO_PLANS.anual.label} selecionado. ${brl(PRO_PLANS.anual.amount)} por ano, equivalente a ${brl(annualEquivalentMonthly)} por mês. Economize ${brl(annualSaving)} por ano em relação a doze meses do plano Completo.`
      : `Plano ${PRO_PLANS[plan].label} selecionado. ${brl(PRO_PLANS[plan].amount)} por mês, cobrado todo mês.`;

  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: SANS }}>
      <Helmet>
        <title>SalbCare Pro. Gestão de consultório para dentistas e fisioterapeutas</title>
        <meta
          name="description"
          content="Agenda, pacientes, financeiro e sua própria página de agendamento em um só lugar. Teste o SalbCare Pro por 7 dias, sem cartão de crédito."
        />        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </Helmet>
      <style>{proStyles + panelMockStyles + LANDING_STYLES}</style>

      {/* NAVEGAÇÃO */}
      <header style={{ borderBottom: "1px solid rgba(31,31,31,0.12)" }}>
        <div
          className="pro-wrap"
          style={{
            paddingTop: 18,
            paddingBottom: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <ProWordmark size={30} />

          <nav className="pro-nav-desktop" style={{ alignItems: "center", gap: 24 }}>
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="pro-link">
                {item.label}
              </a>
            ))}
            <Link to={isActive ? "/pro/painel" : "/login"} className="pro-link">
              {isActive ? "Meu painel" : "Entrar"}
            </Link>
          </nav>

          <button
            type="button"
            className="pro-burger"
            aria-expanded={menuOpen}
            aria-controls="pro-menu"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "Fechar" : "Menu"}
          </button>
        </div>

        {menuOpen && (
          <nav
            id="pro-menu"
            className="pro-wrap pro-nav-mobile"
            style={{ paddingBottom: 18, display: "grid", gap: 0 }}
          >
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="pro-link pro-block"
                onClick={() => setMenuOpen(false)}
                style={{ display: "block" }}
              >
                {item.label}
              </a>
            ))}
            <Link
              to={isActive ? "/pro/painel" : "/login"}
              className="pro-link pro-block"
              onClick={() => setMenuOpen(false)}
              style={{ display: "block" }}
            >
              {isActive ? "Meu painel" : "Entrar"}
            </Link>
          </nav>
        )}
      </header>

      {/* HERO */}
      <section className="pro-wrap pro-section pro-hero">
        <div>
          <h1 className="pro-h1" style={{ maxWidth: 700 }}>
            Seu consultório organizado, do agendamento ao financeiro.
          </h1>
          <p className="pro-lead" style={{ marginTop: 20, maxWidth: 540 }}>
            Agenda, pacientes, financeiro e sua própria página de agendamento. E quando chegar um paciente que só fala
            inglês, você está pronto.
          </p>
          <div style={{ marginTop: 32 }}>
            <button className="pro-cta" onClick={startTrial}>
              {isActive ? "Ir para o painel" : "Testar 7 dias grátis"}
            </button>
          </div>
          <p className="pro-note" style={{ marginTop: 14 }}>
            Sem cartão de crédito. Configuração em cerca de 10 minutos.
          </p>
        </div>
        <div className="pro-hero-mock">
          <ProAgendaMini />
        </div>
      </section>


      <hr className="pro-rule" />

      {/* PROBLEMA */}
      <section className="pro-wrap pro-section">
        <h2 className="pro-h2" style={{ maxWidth: 620 }}>
          Você estudou para cuidar de pessoas. Não para administrar planilhas.
        </h2>
        <div className="pro-pain-grid" style={{ marginTop: 28 }}>
          {PAINS.map(({ text, Icon }) => (
            <div key={text} className="pro-pain-card">
              <Icon size={22} strokeWidth={1.5} color={TEAL} aria-hidden />
              <p className="pro-body" style={{ margin: "14px 0 0" }}>
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="pro-rule" />

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="pro-wrap pro-section" style={{ scrollMarginTop: 24 }}>
        <ProLabel>Funcionalidades</ProLabel>
        <h2 className="pro-h2" style={{ marginTop: 14 }}>
          Quatro ferramentas, um único lugar.
        </h2>
        <div className="pro-grid2" style={{ marginTop: 28, rowGap: 44 }}>
          {FEATURES.map(({ title, line, Icon }) => (
            <div key={title} className="pro-block">
              <Icon size={20} strokeWidth={1.5} color={TEAL} aria-hidden />
              <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: "0.04em", marginTop: 12 }}>{title}</div>
              <p className="pro-body" style={{ margin: "8px 0 0" }}>
                {line}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="pro-rule" />

      {/* PRODUTO */}
      <section id="produto" className="pro-wrap pro-section" style={{ scrollMarginTop: 24 }}>
        <ProLabel>O produto</ProLabel>
        <h2 className="pro-h2" style={{ marginTop: 14 }}>
          É simples assim por dentro.
        </h2>
        <div style={{ marginTop: 28 }}>
          <ProPanelMock />
          <p className="pro-mono" style={{ marginTop: 12 }}>
            Agenda do dia, cadastro do atendimento e o resultado do mês na mesma tela.
          </p>
        </div>
      </section>

      <hr className="pro-rule" />

      {/* DEMONSTRAÇÃO INTERATIVA */}
      <section id="demonstracao" className="pro-wrap pro-section" style={{ scrollMarginTop: 24 }}>
        <ProLabel>Experimente agora</ProLabel>
        <h2 className="pro-h2" style={{ marginTop: 14, maxWidth: 620 }}>
          Use o painel aqui mesmo, sem criar conta.
        </h2>
        <p className="pro-body" style={{ marginTop: 16, maxWidth: 560 }}>
          Os dados desta demonstração são fictícios e não são salvos. Marque um atendimento, cadastre um paciente e
          lance um valor recebido para sentir como é o dia a dia.
        </p>
        <div style={{ marginTop: 26, maxWidth: 680 }}>
          <ProSandbox onTrial={startTrial} />
        </div>
      </section>

      <hr className="pro-rule" />


      {/* MÓDULO INTERNACIONAL */}
      <section className="pro-wrap pro-section">
        <ProLabel>Módulo internacional</ProLabel>
        <h2 className="pro-h2" style={{ marginTop: 14, maxWidth: 620 }}>
          Atende paciente estrangeiro? Ative em um clique.
        </h2>
        <p className="pro-body" style={{ marginTop: 18, maxWidth: 600, color: soft }}>
          Sua página de agendamento passa a funcionar em português, inglês e espanhol, com preços em real, euro e dólar.
          Você também recebe mensagens prontas nos três idiomas para confirmar horários e orientar o paciente antes da
          consulta.
        </p>
        <p className="pro-mono" style={{ marginTop: 14, color: TEAL }}>
          Opcional, ligado nas configurações
        </p>
      </section>

      <hr className="pro-rule" />

      {/* ACADEMY */}
      <section className="pro-wrap pro-section">
        <ProLabel>SalbCare Academy</ProLabel>
        <h2 className="pro-h2" style={{ marginTop: 14, maxWidth: 620 }}>
          Comece pelos materiais da Academy.
        </h2>
        <p className="pro-body" style={{ marginTop: 16, maxWidth: 580 }}>
          Apostilas de Inglês e Espanhol para Atendimento em Saúde, sem precisar assinar nada.
        </p>
        <div style={{ marginTop: 28 }}>
          <AcademyCardGrid className="pro-pain-grid" />
        </div>
        <div style={{ marginTop: 28 }}>
          <Link to="/academy" className="pro-cta" style={{ textDecoration: "none" }}>
            Ver na Academy
          </Link>
        </div>
      </section>

      <hr className="pro-rule" />

      {/* QUICK CARD */}
      <section className="pro-wrap pro-section">
        <ProLabel>Quick Card</ProLabel>
        <h2 className="pro-h2" style={{ marginTop: 14, maxWidth: 640 }}>
          Treine igual um app de idiomas, feito para o consultório.
        </h2>
        <p className="pro-body" style={{ marginTop: 16, maxWidth: 560 }}>
          Frases de emergência grátis, direto no navegador. Sem cadastro.
        </p>
        <div style={{ marginTop: 28 }}>
          <Link to="/quick-card" className="pro-cta" style={{ textDecoration: "none" }}>
            Começar agora
          </Link>
        </div>
      </section>

      <hr className="pro-rule" />



      {/* PLANOS */}
      <section id="planos" className="pro-wrap pro-section" style={{ scrollMarginTop: 24 }}>
        <ProLabel>Planos</ProLabel>
        <h2 className="pro-h2" style={{ marginTop: 14 }}>
          Escolha o seu plano.
        </h2>
        <p className="pro-body" style={{ marginTop: 14, maxWidth: 560 }}>
          Toque no plano para selecionar. Você confirma o pagamento na tela seguinte.
        </p>

        <div className="pro-plans" role="radiogroup" aria-label="Planos SalbCare" style={{ marginTop: 28 }}>
          {(Object.keys(PRO_PLANS) as ProPlanKey[]).map((key) => {
            const p = PRO_PLANS[key];
            const selected = plan === key;
            return (
              <div
                key={key}
                role="radio"
                tabIndex={0}
                aria-checked={selected}
                className="pro-plan"
                onClick={() => selectPlan(key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectPlan(key);
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <span className="pro-radio" aria-hidden>
                    {selected && <span className="pro-radio-dot" />}
                  </span>
                  {p.badge && <span className="pro-badge">{p.badge}</span>}
                </div>

                <div className="pro-mono" style={{ marginTop: 16, fontSize: 12.5, letterSpacing: "0.1em" }}>
                  {p.label.toUpperCase()}
                </div>
                <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span className="pro-price">{brl(p.amount)}</span>
                  <span className="pro-mono" style={{ fontSize: 12.5 }}>
                    {p.interval === "year" ? "/ano" : "/mês"}
                  </span>
                </div>
                {p.interval === "year" && (
                  <div className="pro-mono" style={{ marginTop: 8, fontSize: 12.5 }}>
                    Equivale a {brl(annualEquivalentMonthly)} por mês.
                  </div>
                )}
                <p className="pro-body" style={{ margin: "12px 0 0", fontSize: 14.5 }}>
                  {p.tagline}
                </p>
                <ul
                  className="pro-body"
                  style={{ margin: "12px 0 0", paddingLeft: 18, fontSize: 14.5, display: "grid", gap: 4 }}
                >
                  {p.includes.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="pro-mono" style={{ marginTop: 20, fontSize: 12.5 }}>
          {planSummary}
        </p>

        <div className="pro-sticky" style={{ marginTop: 20 }}>
          <button className="pro-cta" onClick={handleSubscribe} disabled={loading}>
            {loading ? "Abrindo pagamento" : isActive ? "Ir para o painel" : "Continuar para o pagamento"}
          </button>
          <p className="pro-note" style={{ marginTop: 10 }}>
            {PRO_PLANS[plan].safety} Pagamento seguro pelo Stripe.
          </p>
        </div>
      </section>

      <hr className="pro-rule" />

      {/* FAQ */}
      <section className="pro-wrap pro-section">
        <ProLabel>Perguntas frequentes</ProLabel>
        <div style={{ marginTop: 20 }}>
          {FAQ.map((item) => {
            const open = openFaq === item.q;
            return (
              <div key={item.q} style={{ borderTop: "1px solid rgba(31,31,31,0.12)" }}>
                <button
                  onClick={() => setOpenFaq(open ? null : item.q)}
                  aria-expanded={open}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    background: "none",
                    border: "none",
                    color: CREAM,
                    fontFamily: MONO,
                    fontSize: 13,
                    textAlign: "left",
                    padding: "18px 0",
                    cursor: "pointer",
                  }}
                >
                  <span>{item.q}</span>
                  <span style={{ color: TEAL }}>{open ? "-" : "+"}</span>
                </button>
                {open && (
                  <p className="pro-body" style={{ margin: "0 0 18px", maxWidth: 640 }}>
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <hr className="pro-rule" />

      {/* CTA FINAL */}
      <section className="pro-wrap pro-section" style={{ textAlign: "center" }}>
        <h2 className="pro-h2">Comece hoje a organizar seu consultório.</h2>
        <p className="pro-body" style={{ margin: "18px auto 0", maxWidth: 460 }}>
          Teste o sistema completo por 7 dias, sem cartão de crédito.
        </p>
        <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
          <button className="pro-cta" onClick={startTrial}>
            {isActive ? "Ir para o painel" : "Testar 7 dias grátis"}
          </button>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(31,31,31,0.12)" }}>
        <div className="pro-wrap" style={{ paddingTop: 32, paddingBottom: 48 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 20,
              fontFamily: MONO,
              fontSize: 12,
            }}
          >
            <Link to="/terms" className="pro-link">
              Termos de uso
            </Link>
            <Link to="/privacy" className="pro-link">
              Política de privacidade
            </Link>
            <Link to="/legal" className="pro-link">
              Informações legais
            </Link>
            <Link to="/about" className="pro-link">
              Sobre
            </Link>
            <Link to="/contact" className="pro-link">
              Contato
            </Link>
            <a href="https://www.gov.br/anpd/pt-br" target="_blank" rel="noreferrer" className="pro-link">
              LGPD
            </a>
          </div>
          <p className="pro-mono" style={{ marginTop: 20, maxWidth: 620, lineHeight: 1.6 }}>
            O valor de cada atendimento é definido pelo próprio profissional. A SalbCare fornece o software de gestão e
            não cobra comissão por consulta.
          </p>
          <p className="pro-mono" style={{ marginTop: 12 }}>
            © {new Date().getFullYear()} SalbCare.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Pro;
