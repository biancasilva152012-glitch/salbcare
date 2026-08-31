/**
 * Sistema de marca compartilhado das páginas SalbCare Pro (/pro, /pro/onboarding, /pro/painel).
 * Mantido isolado do design system global para não afetar o restante do site.
 */
export const NAVY = "#0F1F3A";
export const CREAM = "#F4EEE2";
export const TEAL = "#34BFB4";
export const GOLD = "#CFA856";

export const MONO = "'IBM Plex Mono', ui-monospace, monospace";
export const DISPLAY = "'Gloock', Georgia, serif";
/** Sans legível para parágrafos longos. Mono fica só em labels e textos curtos. */
export const SANS = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";

export const PRO_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Gloock&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap";

export const PRO_PRICES = {
  monthly: {
    id: "price_1U6GvUBUEEEAHx2hAkDxAQbF",
    label: "Mensal",
    amount: "R$ 99",
    period: "/mês",
    note: "Cancele quando quiser.",
  },
  annual: {
    id: "price_1U6GvoBUEEEAHx2hmyZMqKCo",
    label: "Anual Fundador",
    amount: "R$ 897",
    period: "/ano",
    note: "Equivale a R$ 74,75 por mês. Dois meses grátis.",
  },
} as const;

export type ProPlanKey = keyof typeof PRO_PRICES;

export const proStyles = `
  .pro-wrap { max-width: 880px; margin: 0 auto; padding: 0 22px; }
  .pro-section { padding-block: 72px; }
  @media (min-width: 768px) { .pro-section { padding-block: 96px; } }
  .pro-rule { border: 0; border-top: 1px solid rgba(244,238,226,0.14); margin: 0; }
  .pro-h1 { font-family: ${DISPLAY}; font-size: clamp(32px, 8vw, 52px); line-height: 1.06; margin: 18px 0 0; font-weight: 400; letter-spacing: -0.01em; text-wrap: balance; }
  .pro-h2 { font-family: ${DISPLAY}; font-size: clamp(24px, 5vw, 32px); line-height: 1.18; margin: 0; font-weight: 400; text-wrap: balance; }
  .pro-lead { font-family: ${SANS}; font-size: clamp(16px, 4vw, 18px); line-height: 1.6; color: rgba(244,238,226,0.78); }
  .pro-body { font-family: ${SANS}; font-size: 15px; line-height: 1.65; color: rgba(244,238,226,0.72); }
  .pro-mono { font-family: ${MONO}; font-size: 12px; letter-spacing: 0.06em; color: rgba(244,238,226,0.6); }
  .pro-block { border-top: 1px solid rgba(244,238,226,0.14); padding: 20px 0; }
  .pro-cta { display: inline-flex; align-items: center; justify-content: center; width: 100%; max-width: 320px; border-radius: 4px; padding: 16px 24px; background: ${GOLD}; color: ${NAVY}; font-family: ${MONO}; font-weight: 600; font-size: 14px; letter-spacing: 0.04em; text-decoration: none; border: none; cursor: pointer; min-height: 52px; transition: opacity 160ms ease; }
  .pro-cta:hover:not(:disabled) { opacity: 0.88; }
  .pro-cta:disabled { opacity: 0.6; cursor: progress; }
  .pro-cta:focus-visible { outline: 2px solid ${CREAM}; outline-offset: 3px; }
  .pro-link { font-family: ${MONO}; font-size: 12px; color: rgba(244,238,226,0.6); text-decoration: none; }
  .pro-link:hover { color: ${CREAM}; }
  .pro-grid2 { display: grid; gap: 0; grid-template-columns: 1fr 1fr; column-gap: 32px; }
  @media (max-width: 640px) { .pro-grid2 { grid-template-columns: 1fr; } .pro-cta { max-width: none; } }
  .pro-shot { width: 100%; display: block; border: 1px solid rgba(244,238,226,0.14); border-radius: 4px; background: rgba(244,238,226,0.03); }
  .pro-plan { display: block; width: 100%; text-align: left; background: none; color: ${CREAM}; border: 1px solid rgba(244,238,226,0.16); border-radius: 4px; padding: 22px; cursor: pointer; font-family: ${SANS}; transition: border-color 160ms ease; }
  .pro-plan[aria-pressed="true"] { border-color: ${GOLD}; }
  .pro-plan:focus-visible { outline: 2px solid ${TEAL}; outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { .pro-cta, .pro-plan { transition: none; } }
`;



export const ProLabel = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: 11,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: TEAL,
    }}
  >
    {children}
  </div>
);
