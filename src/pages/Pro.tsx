import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProSubscription } from "@/hooks/useProSubscription";
import ProScreensCarousel, { PhoneMockup, proScreensStyles } from "@/components/pro/ProScreensCarousel";
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

const LANDING_STYLES = `
  .pro-header {
    position: sticky; top: 0; z-index: 50;
    border-bottom: 1px solid rgba(10,22,40,0.10);
    background: rgba(247,243,234,0.92); backdrop-filter: blur(16px);
  }
  .pro-header-inner {
    min-height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 14px;
  }
  .pro-header-actions { display: flex; align-items: center; gap: 8px; }
  .pro-mini-cta {
    display: inline-flex; align-items: center; justify-content: center;
    min-height: 40px; border-radius: 999px; padding: 10px 14px;
    background: ${CREAM}; color: #FFFFFF; border: 1px solid ${CREAM};
    font-family: ${SANS}; font-size: 13px; font-weight: 500; text-decoration: none;
  }
  .pro-hero { display: grid; grid-template-columns: 1.02fr 0.98fr; gap: 42px; align-items: center; padding-top: 44px; }
  .pro-hero-copy { min-width: 0; }
  .pro-hero-phone { display: flex; justify-content: center; min-width: 0; }
  .pro-hero-phone .screens-phone { width: min(100%, 282px); }
  .pro-store-strip { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
  .pro-store-badge {
    display: inline-flex; min-height: 36px; align-items: center; gap: 7px;
    border: 1px solid rgba(10,22,40,0.14); border-radius: 10px;
    background: #FFFFFF; padding: 5px 10px 5px 8px; color: ${CREAM};
  }
  .pro-store-icon { display: flex; height: 18px; width: 18px; flex: none; align-items: center; justify-content: center; color: ${CREAM}; }
  .pro-store-kicker { display: block; font-family: ${MONO}; font-size: 8px; letter-spacing: 0.08em; text-transform: uppercase; color: #64748B; }
  .pro-store-name { display: block; font-family: ${SANS}; font-size: 11.5px; font-weight: 600; line-height: 1.15; color: ${CREAM}; }
  .pro-mobile-cta { display: none; }
  .pro-plan-note {
    margin-top: 16px; border: 1px solid rgba(10,22,40,0.12); border-radius: 12px;
    background: #FFFFFF; padding: 14px 16px; color: ${CREAM};
  }
  .pro-final-footer { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; }
  @media (max-width: 899px) {
    .pro-wrap { padding-left: 20px; padding-right: 20px; }
    .pro-section { padding-block: 56px; }
    .pro-hero { grid-template-columns: 1fr; gap: 28px; padding-top: 34px; }
    .pro-hero-phone { justify-content: center; }
    .pro-hero-phone .screens-phone { width: min(100%, 258px); }
    .pro-store-strip { margin-top: 16px; }
    .pro-mobile-cta.is-visible {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 60;
      display: block; padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
      background: rgba(248,247,244,0.96); backdrop-filter: blur(8px);
      border-top: 1px solid rgba(10,22,40,0.12);
    }
    .pro-mobile-cta .pro-cta { width: 100%; min-height: 52px; max-width: none; }
    .pro-mobile-spacer { height: 84px; }
  }
`;

const FAQ = [
  {
    q: "Como funciona o teste de 7 dias?",
    a: "Você cria sua conta e usa o sistema por 7 dias, sem cartão de crédito. Depois escolhe se quer continuar em um plano pago.",
  },
  {
    q: "Quanto custa e existe taxa por consulta?",
    a: "O plano Essencial custa R$ 49 por mês e o Completo custa R$ 89 por mês. A SalbCare não cobra comissão por consulta.",
  },
  {
    q: "Meus dados ficam seguros?",
    a: "Sim. Cada profissional acessa somente os próprios registros, com login protegido e estrutura pensada para LGPD.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. O cancelamento é feito pelo painel, sem ligação e sem burocracia. Você mantém acesso até o fim do período já pago.",
  },
];

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

const track = (event: string, params: Record<string, unknown>) => {
  const g = (window as GtagWindow).gtag;
  if (typeof g === "function") g("event", event, params);
};

const StoreBadges = () => (
  <div className="pro-store-strip" aria-label="Disponibilidade do aplicativo">
    <div className="pro-store-badge">
      <span className="pro-store-icon" aria-hidden>
        <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
          <path d="M16.36 12.9c.02-2.2 1.79-3.25 1.87-3.3-1.02-1.5-2.6-1.7-3.16-1.73-1.34-.1-2.62.78-3.3.78-.7 0-1.75-.76-2.87-.74-1.48.02-2.84.86-3.6 2.18-1.54 2.67-.4 6.62 1.1 8.8.73 1.06 1.6 2.25 2.74 2.2 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.94-1.08 2.66-2.15.84-1.23 1.18-2.42 1.2-2.48-.03-.01-2.3-.88-2.32-3.5zM14.3 5.9c.6-.73 1-1.74.89-2.75-.87.04-1.92.58-2.54 1.3-.55.64-1.03 1.67-.9 2.65.97.08 1.95-.49 2.55-1.2z" />
        </svg>
      </span>
      <span>
        <span className="pro-store-kicker">Em breve na</span>
        <span className="pro-store-name">App Store</span>
      </span>
    </div>
    <div className="pro-store-badge">
      <span className="pro-store-icon" aria-hidden>
        <svg viewBox="0 0 24 24" width="17" height="17">
          <path d="M3.9 2.3c-.25.26-.4.66-.4 1.18v17.04c0 .52.15.92.4 1.18l9.06-9.7L3.9 2.3z" fill="#34A853" />
          <path d="M16.4 15.16l-3.44-3.16-9.06 9.7c.36.38.94.43 1.6.06l10.9-6.6z" fill="#EA4335" />
          <path d="M16.4 8.84L5.5 2.24c-.66-.37-1.24-.32-1.6.06l9.06 9.7 3.44-3.16z" fill="#4285F4" />
          <path d="M16.4 8.84l-3.44 3.16 3.44 3.16 3.66-2.22c.7-.43.7-1.45 0-1.88L16.4 8.84z" fill="#FBBC04" />
        </svg>
      </span>
      <span>
        <span className="pro-store-kicker">Em breve no</span>
        <span className="pro-store-name">Google Play</span>
      </span>
    </div>
  </div>
);

const Pro = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isActive } = useProSubscription();
  const [plan, setPlan] = useState<ProPlanKey>("completo");
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [showMobileCta, setShowMobileCta] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowMobileCta(window.scrollY > Math.min(window.innerHeight * 0.72, 620));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const startTrial = () => {
    if (isActive) {
      navigate("/pro/painel");
      return;
    }
    navigate(user ? "/primeiros-passos" : "/cadastro?next=%2Fprimeiros-passos");
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
      navigate("/cadastro?next=%2Fprimeiros-passos");
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

  const planSummary = `Plano ${PRO_PLANS[plan].label} selecionado. ${brl(PRO_PLANS[plan].amount)} por mês, cobrado todo mês.`;
  const visiblePlans: ProPlanKey[] = ["essencial", "completo"];

  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: SANS }}>
      <Helmet>
        <title>SalbCare Pro. Gestão de consultório para profissionais da saúde</title>
        <meta
          name="description"
          content="Agenda, pacientes, financeiro e sua própria página de agendamento em um só lugar. Teste o SalbCare Pro por 7 dias, sem cartão de crédito."
        />
      </Helmet>
      <style>{proStyles + proScreensStyles + LANDING_STYLES}</style>

      <header className="pro-header">
        <div className="pro-wrap pro-header-inner">
          <ProWordmark size={30} />
          <div className="pro-header-actions">
            <Link to={isActive ? "/dashboard" : "/login"} className="pro-link">
              Entrar
            </Link>
            <Link to="/cadastro?next=%2Fprimeiros-passos" className="pro-mini-cta">
              Testar grátis
            </Link>
          </div>
        </div>
      </header>

      <section className="pro-wrap pro-section pro-hero">
        <div className="pro-hero-copy">
          <h1 className="pro-h1" style={{ maxWidth: 700 }}>
            Seu consultório organizado, do agendamento ao financeiro.
          </h1>
          <p className="pro-lead" style={{ marginTop: 20, maxWidth: 560 }}>
            Agenda, pacientes, financeiro e sua própria página de agendamento. E quando chegar um paciente que só fala inglês, você está pronto.
          </p>
          <div style={{ marginTop: 28 }}>
            <button className="pro-cta" onClick={startTrial}>
              {isActive ? "Ir para o painel" : "Testar 7 dias grátis"}
            </button>
          </div>
          <p className="pro-note" style={{ marginTop: 12 }}>
            Sem cartão de crédito. Configuração em cerca de 10 minutos.
          </p>
          <StoreBadges />
        </div>
        <div className="pro-hero-phone">
          <PhoneMockup src="/screens/inicio.webp" alt="Tela Início do SalbCare no celular" eager />
        </div>
      </section>

      <hr className="pro-rule" />

      <section id="produto" className="pro-wrap pro-section" style={{ scrollMarginTop: 88 }}>
        <ProLabel>Por dentro do app</ProLabel>
        <h2 className="pro-h2" style={{ marginTop: 14 }}>
          É simples assim por dentro.
        </h2>
        <div style={{ marginTop: 24 }}>
          <ProScreensCarousel />
        </div>
      </section>

      <hr className="pro-rule" />

      <section id="planos" className="pro-wrap pro-section" style={{ scrollMarginTop: 88 }}>
        <ProLabel>Planos</ProLabel>
        <h2 className="pro-h2" style={{ marginTop: 14 }}>
          Escolha o seu plano.
        </h2>
        <p className="pro-body" style={{ marginTop: 14, maxWidth: 560 }}>
          Toque no plano para selecionar. Você confirma o pagamento na tela seguinte.
        </p>

        <div className="pro-plans" role="radiogroup" aria-label="Planos SalbCare" style={{ marginTop: 28 }}>
          {visiblePlans.map((key) => {
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
                    /mês
                  </span>
                </div>
                <p className="pro-body" style={{ margin: "12px 0 0", fontSize: 14.5 }}>
                  {p.tagline}
                </p>
                <ul className="pro-body" style={{ margin: "12px 0 0", paddingLeft: 18, fontSize: 14.5, display: "grid", gap: 4 }}>
                  {p.includes.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="pro-mono" style={{ marginTop: 20, fontSize: 12.5 }}>
          {planSummary} No anual fundador, o Completo sai por {brl(annualEquivalentMonthly)} por mês e economiza {brl(annualSaving)} por ano.
        </p>
        <p className="pro-plan-note pro-body">
          Apostilas avulsas da Academy a partir de R$ 29,90. <Link to="/academy" className="pro-link" style={{ color: TEAL }}>Ver Academy</Link>
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

      <section className="pro-wrap pro-section">
        <ProLabel>Perguntas frequentes</ProLabel>
        <div style={{ marginTop: 20 }}>
          {FAQ.map((item) => {
            const open = openFaq === item.q;
            return (
              <div key={item.q} style={{ borderTop: "1px solid rgba(10,22,40,0.12)" }}>
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

      <footer style={{ borderTop: "1px solid rgba(10,22,40,0.12)" }}>
        <div className="pro-wrap" style={{ paddingTop: 28, paddingBottom: 44, textAlign: "center" }}>
          <div className="pro-final-footer" style={{ fontFamily: MONO, fontSize: 12 }}>
            <Link to="/terms" className="pro-link">Termos de uso</Link>
            <Link to="/privacy" className="pro-link">Política de privacidade</Link>
            <Link to="/contact" className="pro-link">Contato</Link>
          </div>
          <p className="pro-mono" style={{ marginTop: 18 }}>
            © {new Date().getFullYear()} SalbCare.
          </p>
        </div>
      </footer>

      <div className="pro-mobile-spacer" aria-hidden />
      <div className={`pro-mobile-cta ${showMobileCta ? "is-visible" : ""}`}>
        <button className="pro-cta" onClick={startTrial}>
          {isActive ? "Ir para o painel" : "Testar 7 dias grátis"}
        </button>
      </div>
    </div>
  );
};

export default Pro;
