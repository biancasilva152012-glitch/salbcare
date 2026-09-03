/**
 * Sistema de marca compartilhado das páginas SalbCare Pro (/pro, /pro/onboarding, /pro/painel).
 * Identidade editorial: areia, café, oliva e tinta. Mantido isolado do design system global.
 *
 * Fontes self-hosted (arquivos estáticos, não variáveis, via @fontsource).
 * Bug conhecido: os arquivos do Cormorant Garamond posicionam mal o acento
 * circunflexo (â ê î ô û), deixando "você" com o acento deslocado. Por isso os
 * cinco codepoints circunflexos são servidos pelo EB Garamond (mesmo espírito
 * Garamond, acentos corretos), com unicode-range restrito. Ver CIRCUMFLEX_FIX.
 */
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/karla/400.css";
import "@fontsource/karla/500.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import ebRegular from "@fontsource/eb-garamond/files/eb-garamond-latin-400-normal.woff2?url";
import ebSemibold from "@fontsource/eb-garamond/files/eb-garamond-latin-600-normal.woff2?url";

const CIRCUMFLEX_RANGE = "U+00C2,U+00CA,U+00CE,U+00D4,U+00DB,U+00E2,U+00EA,U+00EE,U+00F4,U+00FB";

/** Precisa vir depois dos @font-face do Cormorant Garamond para vencer nesses codepoints. */
const CIRCUMFLEX_FIX = `
  @font-face {
    font-family: 'Cormorant Garamond';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(${ebRegular}) format('woff2');
    unicode-range: ${CIRCUMFLEX_RANGE};
  }
  @font-face {
    font-family: 'Cormorant Garamond';
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: url(${ebSemibold}) format('woff2');
    unicode-range: ${CIRCUMFLEX_RANGE};
  }
`;


/** Paleta editorial */
export const SAND = "#F7F3EE";
export const COFFEE = "#5E4736";
export const OLIVE = "#70755C";
export const INK = "#1F1F1F";

/**
 * Aliases retrocompatíveis usados pelas páginas Pro.
 * NAVY = fundo (areia), CREAM = texto (tinta), TEAL = detalhe (oliva), GOLD = ação (café).
 */
export const NAVY = SAND;
export const CREAM = INK;
export const TEAL = OLIVE;
export const GOLD = COFFEE;

export const MONO = "'JetBrains Mono', ui-monospace, monospace";
export const DISPLAY = "'Cormorant Garamond', Georgia, serif";
/** Sans legível para parágrafos longos. Mono fica só em labels e textos curtos. */
export const SANS = "'Karla', system-ui, -apple-system, 'Segoe UI', sans-serif";

/** Fontes agora são self-hosted; mantido vazio para compatibilidade de imports. */
export const PRO_FONTS_HREF = "";

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

/** Linhas e tons derivados da tinta sobre areia. */
const RULE = "rgba(31,31,31,0.12)";
const RULE_STRONG = "rgba(31,31,31,0.2)";
const TEXT_SOFT = "rgba(31,31,31,0.74)";
const TEXT_MUTED = "rgba(31,31,31,0.56)";

export const proStyles = `
${CIRCUMFLEX_FIX}
  .pro-wrap { max-width: 920px; margin: 0 auto; padding: 0 22px; }
  .pro-section { padding-block: 80px; }
  @media (min-width: 768px) { .pro-section { padding-block: 112px; } }
  .pro-rule { border: 0; border-top: 1px solid ${RULE}; margin: 0; }
  .pro-h1 { font-family: ${DISPLAY}; font-size: clamp(40px, 10vw, 68px); line-height: 1.04; margin: 20px 0 0; font-weight: 400; letter-spacing: -0.015em; color: ${INK}; text-wrap: balance; }
  .pro-h2 { font-family: ${DISPLAY}; font-size: clamp(28px, 6vw, 42px); line-height: 1.14; margin: 0; font-weight: 400; letter-spacing: -0.01em; color: ${INK}; text-wrap: balance; }
  .pro-lead { font-family: ${SANS}; font-size: clamp(16px, 4vw, 19px); line-height: 1.6; color: ${TEXT_SOFT}; }
  .pro-body { font-family: ${SANS}; font-size: 15.5px; line-height: 1.7; color: ${TEXT_SOFT}; }
  .pro-mono { font-family: ${MONO}; font-size: 11.5px; letter-spacing: 0.06em; color: ${TEXT_MUTED}; }
  .pro-block { border-top: 1px solid ${RULE}; padding: 22px 0; }
  .pro-card { border: 1px solid ${RULE}; border-radius: 10px; padding: 22px; background: rgba(255,255,255,0.5); }
  .pro-input { width: 100%; box-sizing: border-box; font-family: ${SANS}; font-size: 14px; line-height: 1.5; color: ${INK}; background: rgba(255,255,255,0.7); border: 1px solid ${RULE_STRONG}; border-radius: 8px; padding: 11px 13px; transition: border-color 160ms ease; }
  .pro-input::placeholder { color: ${TEXT_MUTED}; }
  .pro-input:focus { outline: none; border-color: ${COFFEE}; }
  .pro-input:disabled { opacity: 0.6; cursor: not-allowed; }
  select.pro-input { appearance: none; background-image: linear-gradient(45deg, transparent 50%, ${COFFEE} 50%), linear-gradient(135deg, ${COFFEE} 50%, transparent 50%); background-position: calc(100% - 18px) 50%, calc(100% - 13px) 50%; background-size: 5px 5px, 5px 5px; background-repeat: no-repeat; padding-right: 34px; }
  textarea.pro-input { resize: vertical; }
  @media (prefers-reduced-motion: reduce) { .pro-input { transition: none; } }
  .pro-cta { display: inline-flex; align-items: center; justify-content: center; width: 100%; max-width: 320px; border-radius: 999px; padding: 16px 28px; background: ${COFFEE}; color: ${SAND}; font-family: ${MONO}; font-weight: 500; font-size: 13px; letter-spacing: 0.06em; text-decoration: none; border: 1px solid ${COFFEE}; cursor: pointer; min-height: 52px; transition: background 160ms ease, color 160ms ease; }
  .pro-cta:hover:not(:disabled) { background: ${OLIVE}; border-color: ${OLIVE}; }
  .pro-cta:disabled { opacity: 0.6; cursor: progress; }
  .pro-cta:focus-visible { outline: 2px solid ${INK}; outline-offset: 3px; }
  .pro-link { font-family: ${MONO}; font-size: 12px; color: ${TEXT_MUTED}; text-decoration: none; }
  .pro-link:hover { color: ${COFFEE}; }
  .pro-grid2 { display: grid; gap: 0; grid-template-columns: 1fr 1fr; column-gap: 40px; }
  @media (max-width: 640px) { .pro-grid2 { grid-template-columns: 1fr; } .pro-cta { max-width: none; } }
  .pro-shot { width: 100%; display: block; border: 1px solid ${RULE}; border-radius: 10px; background: rgba(255,255,255,0.6); }
  .pro-plan { display: block; width: 100%; text-align: left; background: rgba(255,255,255,0.5); color: ${INK}; border: 1px solid ${RULE_STRONG}; border-radius: 12px; padding: 26px; cursor: pointer; font-family: ${SANS}; transition: border-color 160ms ease, background 160ms ease; }
  .pro-plan[aria-pressed="true"] { border-color: ${COFFEE}; background: rgba(94,71,54,0.06); }
  .pro-plan:focus-visible { outline: 2px solid ${OLIVE}; outline-offset: 2px; }
  .pro-nav-desktop { display: none; }
  .pro-burger { display: inline-flex; align-items: center; background: none; border: 1px solid ${RULE_STRONG}; border-radius: 999px; padding: 8px 16px; color: ${INK}; font-family: ${MONO}; font-size: 12px; letter-spacing: 0.06em; cursor: pointer; }
  @media (min-width: 768px) {
    .pro-nav-desktop { display: flex; }
    .pro-burger { display: none; }
    .pro-nav-mobile { display: none; }
  }
  @media (prefers-reduced-motion: reduce) { .pro-cta, .pro-plan { transition: none; } }
`;

export const ProLabel = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: 11,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: OLIVE,
    }}
  >
    {children}
  </div>
);
