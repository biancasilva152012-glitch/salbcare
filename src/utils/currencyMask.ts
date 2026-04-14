/**
 * Brazilian currency mask utility
 * Formats input as: 1.000,00 / 10.000 / 150
 */

/** Parse a Brazilian-formatted string to a number */
export function parseBRL(value: string): number {
  if (!value) return 0;
  // Remove thousand separators (dots), replace comma with dot
  return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
}

/** Format a raw input string with Brazilian thousand separators (no decimals for integers) */
export function maskCurrency(raw: string): string {
  // Strip everything except digits
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  if (isNaN(num)) return "";
  return num.toLocaleString("pt-BR");
}

/** Format a number to BRL display string */
export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
