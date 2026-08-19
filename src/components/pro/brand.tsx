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
    id: "price_1TyX6lBUEEEAHx2hGeIMZ9W1",
    label: "Mensal",
    amount: "R$ 99",
    period: "/mês",
    note: "Cancele quando quiser.",
  },
  annual: {
    id: "price_1TyCJeBUEEEAHx2hvxyCs0Dz",
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
  .pro-h1 { font-family: ${DISPLAY}; font-size: 44px; line-height: 1.08; margin: 12px 0 0; font-weight: 400; }
  .pro-h2 { font-family: ${DISPLAY}; font-size: 26px; line-height: 1.2; margin: 0; font-weight: 400; }
  .pro-card { border-radius: 14px; padding: 26px; background: rgba(244,238,226,0.04); border: 1px solid rgba(244,238,226,0.14); }
  .pro-card--gold { border-color: ${GOLD}; background: rgba(207,168,86,0.08); }
  .pro-cta { display: block; width: 100%; text-align: center; border-radius: 999px; padding: 15px 22px; font-weight: 600; font-size: 14px; text-decoration: none; letter-spacing: 0.02em; border: none; cursor: pointer; font-family: ${MONO}; }
  .pro-cta:disabled { opacity: 0.6; cursor: progress; }
  .pro-body { font-family: ${SANS}; }
  .pro-cta:hover:not(:disabled) { filter: brightness(1.08); }
  .pro-input { width: 100%; border-radius: 10px; padding: 12px 14px; background: rgba(244,238,226,0.06); border: 1px solid rgba(244,238,226,0.18); color: ${CREAM}; font-family: ${MONO}; font-size: 14px; }
  .pro-input:focus { outline: 2px solid ${TEAL}; outline-offset: 1px; }
  .pro-grid2 { display: grid; gap: 18px; grid-template-columns: 1fr 1fr; }
  @media (max-width: 640px) { .pro-h1 { font-size: 32px; } .pro-card { padding: 20px; } .pro-grid2 { grid-template-columns: 1fr; } }
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
