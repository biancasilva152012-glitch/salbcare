/**
 * Sistema de marca compartilhado das páginas SalbCare (/pro, /pro/painel, /quick-card, /instalar).
 * Paleta oficial: navy #0A1628, teal #2DD4BF, creme #F7F3EA, dourado #C9A227.
 * Tipografia: Gloock para títulos e valores de preço, IBM Plex Mono para labels curtos,
 * Karla (sans) para corpo de texto e botões.
 *
 * Fontes self-hosted via @fontsource (arquivos estáticos, não variáveis) para preservar
 * a acentuação do português.
 */
import "@fontsource/gloock/400.css";
import "@fontsource/karla/400.css";
import "@fontsource/karla/500.css";
import "@fontsource/karla/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";

/** Paleta oficial */
export const NAVY_INK = "#0A1628";
export const CREAM_BG = "#F7F3EA";
export const TEAL = "#2DD4BF";
export const GOLD = "#C9A227";
/** Teal escurecido, usado quando o teal precisa virar texto sobre creme (contraste AA). */
export const TEAL_DEEP = "#0F766E";

/**
 * Aliases retrocompatíveis usados pelas páginas Pro.
 * NAVY = fundo da página (creme), CREAM = cor de texto (navy).
 */
export const NAVY = CREAM_BG;
export const CREAM = NAVY_INK;
export const SAND = CREAM_BG;
export const INK = NAVY_INK;
export const COFFEE = NAVY_INK;
export const OLIVE = TEAL_DEEP;

export const MONO = "'IBM Plex Mono', ui-monospace, monospace";
export const DISPLAY = "'Gloock', Georgia, serif";
export const SANS = "'Karla', system-ui, -apple-system, 'Segoe UI', sans-serif";

/** Fontes são self-hosted; mantido vazio para compatibilidade de imports. */
export const PRO_FONTS_HREF = "";

/**
 * Estrutura de preços. Os textos de economia e equivalência mensal são derivados
 * destes valores, nunca escritos à mão.
 */
export const PRO_PLANS = {
  essencial: {
    id: "price_1UDSWjBUEEEAHx2hFUrls8HR",
    productId: "prod_VDuLmrv5T5gUwr",
    label: "Essencial",
    badge: null as string | null,
    amount: 49,
    interval: "month" as const,
    tagline: "Para quem está começando a organizar o consultório.",
    includes: ["Agenda", "Cadastro de pacientes", "Página própria de agendamento"],
    safety: "Cancele quando quiser.",
  },
  completo: {
    id: "price_1UDSXKBUEEEAHx2hNK74eScH",
    productId: "prod_VDuMFLpVQyYqIU",
    label: "Completo",
    badge: "RECOMENDADO",
    amount: 89,
    interval: "month" as const,
    tagline: "O consultório inteiro, e você pronto para atender qualquer paciente.",
    includes: [
      "Tudo do Essencial",
      "Prontuário",
      "Financeiro",
      "Módulo internacional (PT, EN, ES e Salb Tutor IA)",
      "Todos os materiais da SalbCare Academy",
    ],
    safety: "Cancele quando quiser.",
  },
  anual: {
    id: "price_1UDSZYBUEEEAHx2h6gq87E00",
    productId: "prod_VDuOC8znD8dnPS",
    label: "Anual Fundador",
    badge: null as string | null,
    amount: 797,
    interval: "year" as const,
    tagline: "O plano Completo com um ano pago de uma vez.",
    includes: ["Tudo do plano Completo", "Cobrança única anual"],
    safety: "Cancele quando quiser. Reembolso integral em até 7 dias.",
  },
} as const;

export type ProPlanKey = keyof typeof PRO_PLANS;

/** Preços legados mantidos para assinantes atuais (grandfathering). Não exibidos. */
export const LEGACY_PRO_PRICES = {
  monthly: "price_1U6GvUBUEEEAHx2hAkDxAQbF",
  annual: "price_1U6GvoBUEEEAHx2hmyZMqKCo",
} as const;

/** Compat: código antigo que importava PRO_PRICES. */
export const PRO_PRICES = PRO_PLANS;

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

/** Cálculos derivados dos valores reais dos planos. */
export const annualEquivalentMonthly = PRO_PLANS.anual.amount / 12;
export const annualSaving = PRO_PLANS.completo.amount * 12 - PRO_PLANS.anual.amount;
export const annualReference = PRO_PLANS.completo.amount * 12;

/** Linhas e tons derivados do navy sobre creme, todos com contraste AA. */
const RULE = "rgba(10,22,40,0.12)";
const RULE_STRONG = "rgba(10,22,40,0.22)";
const TEXT_SOFT = "#243447";
const TEXT_MUTED = "#3D4B5C";

export const proStyles = `
  .pro-wrap { max-width: 920px; margin: 0 auto; padding: 0 22px; }
  .pro-section { padding-block: 72px; }
  @media (min-width: 768px) { .pro-section { padding-block: 104px; } }
  .pro-rule { border: 0; border-top: 1px solid ${RULE}; margin: 0; }
  .pro-h1 { font-family: ${DISPLAY}; font-size: clamp(36px, 9vw, 62px); line-height: 1.06; margin: 20px 0 0; font-weight: 400; letter-spacing: -0.015em; color: ${NAVY_INK}; text-wrap: balance; }
  .pro-h2 { font-family: ${DISPLAY}; font-size: clamp(27px, 6vw, 40px); line-height: 1.16; margin: 0; font-weight: 400; letter-spacing: -0.01em; color: ${NAVY_INK}; text-wrap: balance; }
  .pro-lead { font-family: ${SANS}; font-size: clamp(16px, 4vw, 19px); line-height: 1.6; color: ${TEXT_SOFT}; }
  .pro-body { font-family: ${SANS}; font-size: 15.5px; line-height: 1.7; color: ${TEXT_SOFT}; }
  .pro-note { font-family: ${SANS}; font-size: 13.5px; line-height: 1.6; color: ${TEXT_MUTED}; }
  .pro-mono { font-family: ${MONO}; font-size: 11.5px; letter-spacing: 0.06em; color: ${TEXT_MUTED}; }
  .pro-price { font-family: ${DISPLAY}; font-size: 38px; line-height: 1; color: ${NAVY_INK}; }
  .pro-block { border-top: 1px solid ${RULE}; padding: 22px 0; }
  .pro-card { border: 1px solid ${RULE}; border-radius: 10px; padding: 22px; background: #FFFFFF; }
  .pro-input { width: 100%; box-sizing: border-box; font-family: ${SANS}; font-size: 14px; line-height: 1.5; color: ${NAVY_INK}; background: #FFFFFF; border: 1px solid ${RULE_STRONG}; border-radius: 8px; padding: 11px 13px; transition: border-color 160ms ease; color-scheme: light; accent-color: ${NAVY_INK}; }
  .pro-input::placeholder { color: ${TEXT_MUTED}; }
  .pro-input:focus { outline: none; border-color: ${TEAL_DEEP}; }
  .pro-input:disabled { opacity: 0.6; cursor: not-allowed; }
  select.pro-input { appearance: none; background-image: linear-gradient(45deg, transparent 50%, ${NAVY_INK} 50%), linear-gradient(135deg, ${NAVY_INK} 50%, transparent 50%); background-position: calc(100% - 18px) 50%, calc(100% - 13px) 50%; background-size: 5px 5px, 5px 5px; background-repeat: no-repeat; padding-right: 34px; }
  textarea.pro-input { resize: vertical; }
  .pro-cta { display: inline-flex; align-items: center; justify-content: center; width: 100%; max-width: 320px; border-radius: 999px; padding: 16px 28px; background: ${NAVY_INK}; color: #FFFFFF; font-family: ${SANS}; font-weight: 500; font-size: 16px; letter-spacing: 0; text-decoration: none; border: 1px solid ${NAVY_INK}; cursor: pointer; min-height: 52px; transition: background 160ms ease, border-color 160ms ease; }
  .pro-cta:hover:not(:disabled) { background: #16304F; border-color: #16304F; }
  .pro-cta:disabled { opacity: 0.6; cursor: progress; }
  .pro-cta:focus-visible { outline: 2px solid ${TEAL_DEEP}; outline-offset: 3px; }
  .pro-cta-ghost { background: transparent; color: ${NAVY_INK}; border-color: ${RULE_STRONG}; }
  .pro-cta-ghost:hover:not(:disabled) { background: rgba(10,22,40,0.06); border-color: ${NAVY_INK}; color: ${NAVY_INK}; }
  .pro-link { font-family: ${SANS}; font-size: 14px; color: ${TEXT_MUTED}; text-decoration: none; }
  .pro-link:hover { color: ${NAVY_INK}; }
  .pro-grid2 { display: grid; gap: 0; grid-template-columns: 1fr 1fr; column-gap: 40px; }
  @media (max-width: 640px) { .pro-grid2 { grid-template-columns: 1fr; } .pro-cta { max-width: none; } }
  .pro-shot { width: 100%; display: block; border: 1px solid ${RULE}; border-radius: 10px; background: #FFFFFF; }
  .pro-nav-desktop { display: none; }
  .pro-burger { display: inline-flex; align-items: center; background: none; border: 1px solid ${RULE_STRONG}; border-radius: 999px; padding: 8px 16px; color: ${NAVY_INK}; font-family: ${SANS}; font-size: 14px; cursor: pointer; }
  @media (min-width: 768px) {
    .pro-nav-desktop { display: flex; }
    .pro-burger { display: none; }
    .pro-nav-mobile { display: none; }
  }

  /* ----- Seleção de plano ----- */
  .pro-plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; align-items: stretch; }
  @media (max-width: 860px) { .pro-plans { grid-template-columns: 1fr; } }
  .pro-plan { position: relative; display: block; width: 100%; text-align: left; background: #FFFFFF; color: ${NAVY_INK}; border: 1px solid rgba(10,22,40,0.16); border-radius: 14px; padding: 22px 22px 20px; cursor: pointer; font-family: ${SANS}; transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease; }
  .pro-plan[aria-checked="true"] { border: 2px solid ${TEAL}; padding: 21px 21px 19px; box-shadow: 0 10px 26px rgba(10,22,40,0.10); }
  .pro-plan:focus-visible { outline: 2px solid ${TEAL_DEEP}; outline-offset: 3px; }
  .pro-radio { width: 20px; height: 20px; border-radius: 999px; border: 1.5px solid rgba(10,22,40,0.35); display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .pro-plan[aria-checked="true"] .pro-radio { border-color: ${TEAL_DEEP}; }
  .pro-radio-dot { width: 10px; height: 10px; border-radius: 999px; background: ${TEAL_DEEP}; }
  .pro-badge { display: inline-block; font-family: ${MONO}; font-size: 10.5px; letter-spacing: 0.14em; color: ${NAVY_INK}; background: ${GOLD}; border-radius: 999px; padding: 4px 10px; }
  .pro-sticky { position: sticky; bottom: 0; z-index: 20; background: ${CREAM_BG}; border-top: 1px solid ${RULE}; padding: 14px 0 calc(14px + env(safe-area-inset-bottom)); }
  @media (min-width: 861px) { .pro-sticky { position: static; background: transparent; border-top: 0; padding: 0; } }

  @media (prefers-reduced-motion: reduce) { .pro-cta, .pro-plan, .pro-input { transition: none; } }
`;

/** Logo oficial da SalbCare usada no lugar do texto "SalbCare Pro". */
export const ProWordmark = ({ size = 30 }: { size?: number }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
    <img
      src="/salbcare-logo.png"
      alt="SalbCare"
      width={size}
      height={size}
      style={{ width: size, height: size, display: "block", borderRadius: 6 }}
      loading="eager"
    />
    <span
      style={{
        fontFamily: DISPLAY,
        fontSize: Math.round(size * 0.66),
        lineHeight: 1,
        color: NAVY_INK,
        letterSpacing: "-0.01em",
      }}
    >
      SalbCare
    </span>
  </span>
);

export const ProLabel = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: 11,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: TEAL_DEEP,
    }}
  >
    {children}
  </div>
);
