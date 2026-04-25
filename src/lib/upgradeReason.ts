/**
 * Resolução do parâmetro `?reason=` na rota /upgrade.
 *
 * Aceita tanto chaves canônicas vindas do PremiumFeatureModal
 * (prescriptions, certificates, telehealth, public_directory, patients,
 * financial, mentorship) quanto variações livres em PT-BR (ex: "Receitas
 * e atestados digitais", "Aparecer no diretório") fazendo match
 * case-insensitive por palavras-chave.
 *
 * Sempre que houver um motivo válido, o checkout é pré-selecionado no
 * plano Essencial (`plan=basic`).
 */

export type UpgradeReasonKey =
  | "patients"
  | "financial"
  | "mentorship"
  | "telehealth"
  | "prescriptions"
  | "certificates"
  | "public_directory";

const CANONICAL_KEYS: UpgradeReasonKey[] = [
  "patients",
  "financial",
  "mentorship",
  "telehealth",
  "prescriptions",
  "certificates",
  "public_directory",
];

export function resolveUpgradeReason(
  raw: string | null | undefined,
): UpgradeReasonKey | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if ((CANONICAL_KEYS as string[]).includes(trimmed)) {
    return trimmed as UpgradeReasonKey;
  }

  if (/receita|atestado|prescric|certificad/i.test(trimmed)) {
    return "prescriptions";
  }
  if (/tele|meet|video/i.test(trimmed)) {
    return "telehealth";
  }
  if (/diret|profissionai|marketplace/i.test(trimmed)) {
    return "public_directory";
  }
  return null;
}

/**
 * Monta a query string para /checkout pré-selecionando o plano Essencial
 * (`basic`) e propagando o motivo resolvido. Mantida pura para
 * facilitar testes unitários.
 */
export function buildCheckoutQuery(
  reasonKey: UpgradeReasonKey | null,
  rawReason: string | null,
): string {
  const params = new URLSearchParams({ plan: "basic" });
  const value = reasonKey || rawReason || "";
  if (value) params.set("reason", value);
  return params.toString();
}
