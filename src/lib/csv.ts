/**
 * Safe CSV cell encoding for admin exports.
 *
 * - Neutralizes spreadsheet formulas: any value starting with =, +, -, @,
 *   tab or carriage return gets a leading apostrophe so Excel/Sheets/LibreOffice
 *   show it as text instead of executing it.
 * - Always quotes the cell and escapes embedded double quotes.
 */
const FORMULA_TRIGGERS = /^[=+\-@\t\r]/;

export function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (FORMULA_TRIGGERS.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(",");
}

export function toCsv(rows: unknown[][]): string {
  return rows.map(csvRow).join("\n");
}
