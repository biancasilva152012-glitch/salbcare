// Seção 3 — 5 sinais silenciosos. Background branco, grid 3+2, hover elegante.
import { Link } from "react-router-dom";
import { trackCtaClick, trackUnified, trackLeadIntent } from "@/hooks/useTracking";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const NAVY = "#0D1B2A";
const TEAL = "#00B4A0";
const TEAL_DARK = "#009986";
const TEXT_MUTED = "#64748B";
const BORDER = "#E2E8F0";

const WA_URL = buildWhatsAppUrl();

const SIGNALS = [
  {
    n: "01",
    title: "Você não sabe seu ticket médio real",
    body:
      "Se você não consegue dizer em 5 segundos quanto cobra em média por consulta depois de descontos, planos e cancelamentos, você não sabe o que está vendendo.",
  },
  {
    n: "02",
    title: "Você precifica por intuição, não por dados",
    body:
      "Cobrar “o que o mercado cobra” é a forma mais rápida de virar refém da concorrência. O preço certo é o que cobre seus custos, paga seu tempo e ainda gera margem pra crescer.",
  },
  {
    n: "03",
    title: "Você não sabe quais procedimentos dão prejuízo",
    body:
      "Tem procedimento que você adora fazer e acha que dá lucro — mas quando você soma tempo, material e custo fixo, está pagando pra trabalhar.",
  },
  {
    n: "04",
    title: "Você não tem previsibilidade de faturamento",
    body:
      "Se cada mês é uma surpresa (pra cima ou pra baixo), você não tem um negócio. Tem uma roleta com jaleco branco.",
  },
  {
    n: "05",
    title: "Você terceiriza pro contador o que deveria ser seu painel diário",
    body:
      "Seu contador olha pro passado. Quem precisa olhar pro futuro do seu consultório é você — todo dia, em tempo real.",
  },
];

const PainSignalsSection = () => {
  return (
    <section
      aria-labelledby="pain-signals-title"
      style={{
        background: "#FFFFFF",
        padding: "96px 0",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <style>{`
        .signal-card {
          background: #FFFFFF;
          border: 1px solid ${BORDER};
          border-bottom: 3px solid transparent;
          border-radius: 16px;
          padding: 28px 24px;
          transition: transform 200ms ease, box-shadow 200ms ease, border-bottom-color 200ms ease;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .signal-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 32px rgba(13, 27, 42, 0.08);
          border-bottom-color: ${TEAL};
        }
        .signal-num {
          color: ${TEAL};
          font-weight: 800;
          font-size: 48px;
          line-height: 1;
          letter-spacing: -0.04em;
          margin-bottom: 16px;
          font-variant-numeric: tabular-nums;
        }
        .signal-cta {
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          background: ${TEAL}; color: #FFFFFF;
          font-weight: 700; font-size: 16px;
          padding: 16px 28px; border-radius: 12px;
          box-shadow: 0 6px 20px rgba(0,180,160,0.28);
          transition: background 180ms ease, transform 180ms ease;
          min-height: 52px;
          text-decoration: none;
        }
        .signal-cta:hover { background: ${TEAL_DARK}; transform: translateY(-1px); }
        .signal-wa-link { color: ${TEAL}; font-weight: 600; font-size: 14.5px; }
        .signal-wa-link:hover { text-decoration: underline; text-underline-offset: 4px; }
      `}</style>

      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        <h2
          id="pain-signals-title"
          style={{
            textAlign: "center",
            color: NAVY,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            fontSize: "clamp(28px, 4.5vw, 44px)",
            margin: 0,
          }}
        >
          5 sinais silenciosos de que seu consultório está vazando dinheiro
        </h2>

        <p
          style={{
            textAlign: "center",
            color: TEXT_MUTED,
            fontSize: 17,
            lineHeight: 1.55,
            marginTop: 16,
            maxWidth: 640,
            marginInline: "auto",
          }}
        >
          Se você reconhece pelo menos 2 desses sinais, está perdendo entre R$ 2.000 e R$ 8.000 por mês sem perceber.
        </p>

        <div
          style={{
            marginTop: 56,
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          {SIGNALS.map((s) => (
            <article key={s.n} className="signal-card">
              <span className="signal-num" aria-hidden>
                {s.n}
              </span>
              <h3
                style={{
                  color: NAVY,
                  fontWeight: 700,
                  fontSize: 18,
                  lineHeight: 1.3,
                  marginBottom: 10,
                }}
              >
                {s.title}
              </h3>
              <p style={{ color: TEXT_MUTED, fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
                {s.body}
              </p>
            </article>
          ))}
        </div>

        {/* Divisor + transição */}
        <div style={{ marginTop: 64, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <span style={{ width: 60, height: 2, background: TEAL, borderRadius: 2 }} aria-hidden />
          <p
            style={{
              color: NAVY,
              fontSize: 20,
              fontStyle: "italic",
              fontWeight: 500,
              textAlign: "center",
              maxWidth: 560,
              lineHeight: 1.4,
            }}
          >
            E se houvesse um jeito de fazer tudo isso parar de te custar caro?
          </p>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: 8 }}>
            <Link
              to="/register?source=landing-pain-signals"
              onClick={() => {
                trackCtaClick("testar_plataforma", "landing_pain_signals");
                trackUnified("landing_cta_click", { cta_name: "testar_plataforma", cta_location: "landing_pain_signals" });
              }}
              className="signal-cta"
            >
              Testar a plataforma grátis
            </Link>

            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="signal-wa-link"
              onClick={() => trackCtaClick("whatsapp", "landing_pain_signals")}
            >
              Prefere conversar primeiro? Chama no WhatsApp →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PainSignalsSection;
