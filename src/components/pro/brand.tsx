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
  .pro-wrap { max-width: 760px; margin: 0 auto; padding: 0 20px; }
  .pro-wrap--wide { max-width: 1080px; }
  .pro-h1 { font-family: ${DISPLAY}; font-size: clamp(30px, 8.4vw, 46px); line-height: 1.08; margin: 12px 0 0; font-weight: 400; letter-spacing: -0.01em; text-wrap: balance; }
  .pro-h2 { font-family: ${DISPLAY}; font-size: clamp(22px, 5.4vw, 28px); line-height: 1.2; margin: 0; font-weight: 400; text-wrap: balance; }
  .pro-lead { font-size: clamp(15px, 4.1vw, 17px); line-height: 1.65; }
  .pro-card { border-radius: 14px; padding: 26px; background: rgba(244,238,226,0.04); border: 1px solid rgba(244,238,226,0.14); transition: transform 220ms ease, border-color 220ms ease, background 220ms ease, box-shadow 220ms ease; }
  .pro-card--gold { border-color: ${GOLD}; background: rgba(207,168,86,0.08); }
  .pro-card--interactive:hover { transform: translateY(-3px); border-color: ${TEAL}; background: rgba(244,238,226,0.07); box-shadow: 0 12px 30px -18px rgba(0,0,0,0.65); }
  .pro-card--interactive.pro-card--gold:hover { border-color: ${GOLD}; background: rgba(207,168,86,0.13); }
  .pro-card--interactive:focus-visible { outline: 2px solid ${TEAL}; outline-offset: 3px; }
  .pro-card__icon { transition: transform 220ms ease; }
  .pro-card--interactive:hover .pro-card__icon { transform: translateY(-2px) scale(1.06); }
  .pro-cta { display: block; width: 100%; text-align: center; border-radius: 999px; padding: 16px 22px; font-weight: 600; font-size: clamp(14px, 3.9vw, 15px); text-decoration: none; letter-spacing: 0.02em; border: none; cursor: pointer; font-family: ${MONO}; min-height: 52px; box-shadow: 0 10px 26px -14px rgba(207,168,86,0.85); transition: transform 180ms ease, filter 180ms ease, box-shadow 180ms ease; }
  .pro-cta:disabled { opacity: 0.6; cursor: progress; }
  .pro-body { font-family: ${SANS}; }
  .pro-cta:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-2px); box-shadow: 0 16px 32px -14px rgba(207,168,86,0.95); }
  .pro-cta:active:not(:disabled) { transform: translateY(0); }
  .pro-cta:focus-visible { outline: 2px solid ${CREAM}; outline-offset: 3px; }
  .pro-input { width: 100%; border-radius: 10px; padding: 12px 14px; background: rgba(244,238,226,0.06); border: 1px solid rgba(244,238,226,0.18); color: ${CREAM}; font-family: ${MONO}; font-size: 14px; }
  .pro-input:focus { outline: 2px solid ${TEAL}; outline-offset: 1px; }
  .pro-grid2 { display: grid; gap: 18px; grid-template-columns: 1fr 1fr; }
  .pro-proof { display: grid; gap: 10px; margin-top: 26px; padding: 0; list-style: none; }
  .pro-proof li { display: flex; align-items: flex-start; gap: 10px; font-family: ${MONO}; font-size: 12.5px; line-height: 1.5; color: rgba(244,238,226,0.78); }
  .pro-proof li span[aria-hidden] { color: ${TEAL}; }
  @media (min-width: 641px) { .pro-proof { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 640px) {
    .pro-card { padding: 20px; }
    .pro-grid2 { grid-template-columns: 1fr; }
    .pro-cta { max-width: none !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pro-card, .pro-cta, .pro-card__icon { transition: none; }
    .pro-card--interactive:hover, .pro-cta:hover:not(:disabled) { transform: none; }
  }
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
