// Seção 4 — A solução central: CFO de bolso. Background navy, 2 colunas com mockup financeiro real.
import { Link } from "react-router-dom";
import { Check, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";
import { trackCtaClick, trackUnified } from "@/hooks/useTracking";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const NAVY = "#0D1B2A";
const NAVY_LIGHT = "#1B2A3F";
const NAVY_BORDER = "#243447";
const TEAL = "#00B4A0";
const TEAL_DARK = "#009986";
const TEXT_LIGHT = "#CBD5E0";
const WHITE = "#FFFFFF";

const WA_URL = buildWhatsAppUrl();

const BULLETS = [
  {
    title: "Quanto você está cobrando a menos",
    body: "em cada procedimento e qual o preço sugerido baseado nos seus custos reais.",
  },
  {
    title: "Quais procedimentos dão prejuízo",
    body: "mesmo quando o consultório está cheio.",
  },
  {
    title: "Previsão de faturamento",
    body: "dos próximos 30, 60 e 90 dias com base no seu histórico e agenda.",
  },
  {
    title: "Onde está vazando dinheiro",
    body: "taxas, no-shows, descontos não monitorados, materiais.",
  },
];

const FinancialIntelligenceSection = () => {
  return (
    <section
      aria-labelledby="financial-intelligence-title"
      style={{
        background: NAVY,
        padding: "96px 0",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        borderTop: `1px solid ${NAVY_BORDER}`,
      }}
    >
      <style>{`
        .fi-cta-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          background: ${TEAL}; color: ${WHITE};
          font-weight: 700; font-size: 16px;
          padding: 16px 28px; border-radius: 12px;
          box-shadow: 0 6px 20px rgba(0,180,160,0.28);
          transition: background 180ms ease, transform 180ms ease;
          min-height: 52px; text-decoration: none;
        }
        .fi-cta-primary:hover { background: ${TEAL_DARK}; transform: translateY(-1px); }
        .fi-cta-secondary {
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          background: transparent; color: ${WHITE};
          font-weight: 600; font-size: 16px;
          padding: 16px 28px; border-radius: 12px;
          border: 1.5px solid rgba(255,255,255,0.25);
          transition: border-color 180ms ease, background 180ms ease;
          min-height: 52px; text-decoration: none;
        }
        .fi-cta-secondary:hover { border-color: ${TEAL}; background: rgba(0,180,160,0.08); }
        .fi-bullet-icon {
          flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 999px;
          background: rgba(0,180,160,0.18); color: ${TEAL};
        }
        .fi-mock-card {
          background: ${NAVY_LIGHT};
          border: 1px solid ${NAVY_BORDER};
          border-radius: 14px;
          padding: 18px 20px;
        }
      `}</style>

      <div
        className="mx-auto max-w-6xl px-5 sm:px-6"
        style={{
          display: "grid",
          gap: 56,
          gridTemplateColumns: "minmax(0, 1fr)",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 56,
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            alignItems: "center",
          }}
        >
          {/* Coluna esquerda: copy */}
          <div>
            <p
              style={{
                color: TEAL,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              Inteligência financeira
            </p>

            <h2
              id="financial-intelligence-title"
              style={{
                color: WHITE,
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
                fontSize: "clamp(30px, 4.5vw, 48px)",
                margin: 0,
              }}
            >
              Como ter um <span style={{ color: TEAL }}>CFO de bolso</span> analisando seu consultório 24h por dia
            </h2>

            <p
              style={{
                marginTop: 20,
                color: TEXT_LIGHT,
                fontSize: 17.5,
                lineHeight: 1.6,
              }}
            >
              A SalbCare conecta agenda, prontuário e financeiro em uma camada de inteligência que te diz, em tempo real:
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: "28px 0 0", display: "grid", gap: 18 }}>
              {BULLETS.map((b) => (
                <li key={b.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span className="fi-bullet-icon" aria-hidden>
                    <Check size={18} strokeWidth={2.6} />
                  </span>
                  <div>
                    <p style={{ color: WHITE, fontWeight: 700, fontSize: 15.5, margin: 0 }}>{b.title}</p>
                    <p style={{ color: TEXT_LIGHT, fontSize: 14.5, lineHeight: 1.55, margin: "4px 0 0" }}>{b.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 36 }}>
              <Link
                to="/register?source=landing-financial-intel"
                onClick={() => {
                  trackCtaClick("ver_na_pratica", "landing_financial_intel");
                  trackUnified("landing_cta_click", { cta_name: "ver_na_pratica", cta_location: "landing_financial_intel" });
                }}
                className="fi-cta-primary"
              >
                Quero ver isso na prática
              </Link>

              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="fi-cta-secondary"
                onClick={() => trackCtaClick("whatsapp", "landing_financial_intel")}
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>

          {/* Coluna direita: mockup financeiro */}
          <div aria-hidden style={{ display: "grid", gap: 14 }}>
            <div className="fi-mock-card">
              <p style={{ color: TEXT_LIGHT, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
                Ticket médio real
              </p>
              <p style={{ color: WHITE, fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", margin: "6px 0 0" }}>
                R$ 247,30
              </p>
              <p style={{ color: TEAL, fontSize: 13, fontWeight: 600, margin: "4px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
                <TrendingUp size={14} strokeWidth={2.6} /> +R$ 18,40 vs. mês anterior
              </p>
            </div>

            <div className="fi-mock-card">
              <p style={{ color: TEXT_LIGHT, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
                Procedimentos no vermelho
              </p>
              <p style={{ color: WHITE, fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", margin: "6px 0 0" }}>
                3 <span style={{ color: TEXT_LIGHT, fontSize: 16, fontWeight: 500 }}>de 12</span>
              </p>
              <p style={{ color: "#F87171", fontSize: 13, fontWeight: 600, margin: "4px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={14} strokeWidth={2.6} /> Margem negativa identificada
              </p>
            </div>

            {/* Mini gráfico de previsão (SVG inline) */}
            <div className="fi-mock-card">
              <p style={{ color: TEXT_LIGHT, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0, marginBottom: 8 }}>
                Previsão de faturamento — 90 dias
              </p>
              <svg viewBox="0 0 240 70" width="100%" height="70" preserveAspectRatio="none" role="img" aria-label="Gráfico de previsão de faturamento crescente">
                <defs>
                  <linearGradient id="fiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={TEAL} stopOpacity="0.45" />
                    <stop offset="100%" stopColor={TEAL} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,55 C30,52 50,45 80,40 C115,34 145,30 175,22 C200,16 220,12 240,8 L240,70 L0,70 Z" fill="url(#fiGrad)" />
                <path d="M0,55 C30,52 50,45 80,40 C115,34 145,30 175,22 C200,16 220,12 240,8" fill="none" stroke={TEAL} strokeWidth="2.2" />
              </svg>
              <p style={{ color: WHITE, fontSize: 14, fontWeight: 600, margin: "6px 0 0" }}>
                Projeção: <span style={{ color: TEAL }}>R$ 28.400</span> nos próximos 30 dias
              </p>
            </div>

            <div
              className="fi-mock-card"
              style={{ borderLeft: `4px solid ${TEAL}`, paddingLeft: 18 }}
            >
              <p style={{ color: TEAL, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={14} strokeWidth={2.6} /> Sugestão da IA
              </p>
              <p style={{ color: WHITE, fontSize: 14.5, lineHeight: 1.5, margin: "6px 0 0" }}>
                Você pode aumentar <strong style={{ color: TEAL }}>R$ 3.800/mês</strong> ajustando 3 preços.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinancialIntelligenceSection;
