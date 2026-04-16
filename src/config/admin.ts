/**
 * Admin emails that bypass all subscription and payment checks.
 * These users always have full access to all features.
 */
export const ADMIN_EMAILS: readonly string[] = [];

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
