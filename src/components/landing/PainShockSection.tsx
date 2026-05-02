// Seção 2 — Choque com a dor. Background navy, headline gigante, sem CTA.
const NAVY = "#0D1B2A";
const NAVY_LIGHT = "#1B2A3F";
const TEAL = "#00B4A0";
const TEXT_LIGHT = "#CBD5E0";
const TEXT_MUTED_LIGHT = "#94A3B8";

const PainShockSection = () => {
  return (
    <section
      aria-labelledby="pain-shock-title"
      style={{
        background: NAVY,
        padding: "96px 0",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div className="mx-auto max-w-3xl px-5 sm:px-6 text-center">
        <p
          style={{
            color: TEAL,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          Pergunta desconfortável
        </p>

        <h2
          id="pain-shock-title"
          style={{
            color: "#FFFFFF",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            fontSize: "clamp(36px, 6.5vw, 64px)",
            margin: 0,
          }}
        >
          Você sabe <span style={{ color: TEAL }}>exatamente</span> quanto você lucra por mês?
        </h2>

        <p
          style={{
            marginTop: 24,
            color: TEXT_LIGHT,
            fontSize: "clamp(17px, 2.4vw, 22px)",
            lineHeight: 1.55,
            fontWeight: 400,
          }}
        >
          Não o faturamento. O <strong style={{ color: "#FFFFFF" }}>lucro real</strong>. Depois de descontar aluguel, materiais, taxas, impostos e o seu próprio tempo.
        </p>

        <blockquote
          style={{
            marginTop: 48,
            background: NAVY_LIGHT,
            borderLeft: `4px solid ${TEAL}`,
            borderRadius: 12,
            padding: "28px 28px 28px 32px",
            color: TEXT_LIGHT,
            fontSize: 17,
            lineHeight: 1.6,
            textAlign: "left",
          }}
        >
          <strong style={{ color: "#FFFFFF" }}>7 em cada 10</strong> profissionais de saúde autônomos no Brasil não conseguem responder essa pergunta com precisão. Eles acham que estão lucrando — até olharem os números de verdade.
        </blockquote>

        <p
          style={{
            marginTop: 16,
            color: TEXT_MUTED_LIGHT,
            fontSize: 12,
            fontStyle: "italic",
            textAlign: "left",
          }}
        >
          Pesquisa setorial 2025 — fontes disponíveis sob solicitação
        </p>
      </div>
    </section>
  );
};

export default PainShockSection;
