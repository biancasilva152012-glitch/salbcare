/**
 * Shared safe-redirect helper for Supabase Edge Functions.
 *
 * Mirrors the rules used in the front (src/lib/experimenteRedirect.ts):
 *   - Only paths in ALLOWED_REDIRECTS are accepted.
 *   - Path traversal (`..`, encoded `%2F`/`%5C`) is blocked.
 *   - External schemes (`http(s):`, `javascript:`, `//host`, etc.) are blocked.
 *   - Multiple sources (success_url, redirect, next) that resolve to the same
 *     allowed path are OK; divergent allowed values are treated as ambiguous
 *     and fall back to FALLBACK_PATH.
 *
 * The helper supports BOTH paths (e.g. "/dashboard/agenda") and absolute URLs
 * (e.g. "https://app.example.com/dashboard/agenda"). Absolute URLs are only
 * accepted when their origin matches one of the explicit `allowedOrigins`
 * passed by the caller (typically the app's own deploy origin(s)).
 */

export const ALLOWED_REDIRECTS: readonly string[] = [
  "/dashboard",
  "/dashboard/financeiro",
  "/dashboard/financial",
  "/dashboard/contabilidade",
  "/dashboard/agenda",
  "/dashboard/pacientes",
  "/dashboard/juridico",
  "/dashboard/teleconsulta",
  "/dashboard/telehealth",
  "/dashboard/mentoria",
  "/profile",
  "/subscription",
  "/sucesso",
  "/cancelado",
  "/payment-success",
];

export const FALLBACK_PATH = "/dashboard";

export type SafeRedirectResult = {
  /** Final path (always allowed). Never an external URL. */
  path: string;
  /** Whether the input differed from the chosen path (something was rejected). */
  changed: boolean;
  /** Diagnostic reason — useful for logs. Never includes user-supplied values. */
  reason:
    | "ok"
    | "fallback-empty"
    | "fallback-disallowed"
    | "fallback-traversal"
    | "fallback-external-origin"
    | "fallback-ambiguous";
};

const TRAVERSAL_TOKENS = ["..", "%2f", "%5c", "\\"];

function looksTraversal(p: string): boolean {
  const lo = p.toLowerCase();
  return TRAVERSAL_TOKENS.some((t) => lo.includes(t));
}

function isAllowedPath(p: string): boolean {
  if (!p.startsWith("/")) return false;
  if (p.startsWith("//")) return false;
  if (looksTraversal(p)) return false;
  return ALLOWED_REDIRECTS.some(
    (allowed) => p === allowed || p.startsWith(`${allowed}/`),
  );
}

/**
 * Reduces an arbitrary candidate (path or absolute URL) to a path string,
 * enforcing origin allowlist for absolute URLs. Returns null when the
 * candidate must be rejected.
 */
function toAllowedPath(
  candidate: string,
  allowedOrigins: ReadonlySet<string>,
): string | null {
  const trimmed = candidate.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return isAllowedPath(trimmed) ? trimmed : null;
  }

  // Absolute URL? Only accept if origin matches the allowlist.
  if (/^https?:\/\//i.test(trimmed)) {
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return null;
    }
    if (!allowedOrigins.has(parsed.origin)) return null;
    const path = parsed.pathname + parsed.search;
    return isAllowedPath(parsed.pathname) ? path : null;
  }

  // Anything else (javascript:, data:, //host, mailto:, etc.) → reject.
  return null;
}

export type SafeRedirectInput = {
  /** Candidate values from the client (success_url, redirect, next, etc.). */
  candidates: ReadonlyArray<string | null | undefined>;
  /** Origins that may appear inside absolute URL candidates. */
  allowedOrigins?: ReadonlyArray<string>;
};

/**
 * Pure resolver. Given a list of candidates, returns the safe path to use.
 * Use {@link safeRedirectUrl} when you need an absolute URL.
 */
export function resolveSafePath(input: SafeRedirectInput): SafeRedirectResult {
  const allowed = new Set(input.allowedOrigins ?? []);
  const seenAllowed = new Set<string>();
  let sawAnyCandidate = false;
  let sawTraversal = false;
  let sawExternal = false;
  let sawDisallowed = false;

  for (const raw of input.candidates) {
    if (!raw) continue;
    sawAnyCandidate = true;
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Classify the rejection reason for telemetry.
    if (looksTraversal(trimmed)) sawTraversal = true;
    else if (/^https?:\/\//i.test(trimmed)) sawExternal = true;

    const path = toAllowedPath(trimmed, allowed);
    if (path === null) {
      sawDisallowed = true;
      continue;
    }
    seenAllowed.add(path);
  }

  if (seenAllowed.size === 1) {
    const only = [...seenAllowed][0];
    return { path: only, changed: false, reason: "ok" };
  }
  if (seenAllowed.size > 1) {
    return { path: FALLBACK_PATH, changed: true, reason: "fallback-ambiguous" };
  }
  if (!sawAnyCandidate) {
    return { path: FALLBACK_PATH, changed: false, reason: "fallback-empty" };
  }
  if (sawTraversal) {
    return { path: FALLBACK_PATH, changed: true, reason: "fallback-traversal" };
  }
  if (sawExternal) {
    return {
      path: FALLBACK_PATH,
      changed: true,
      reason: "fallback-external-origin",
    };
  }
  return {
    path: FALLBACK_PATH,
    changed: sawDisallowed,
    reason: "fallback-disallowed",
  };
}

/**
 * Convenience: returns an absolute URL ready to hand off to Stripe / OAuth
 * providers. `baseOrigin` is required (we don't guess).
 */
export function safeRedirectUrl(
  input: SafeRedirectInput & { baseOrigin: string },
): { url: string; result: SafeRedirectResult } {
  const result = resolveSafePath(input);
  const url = new URL(result.path, input.baseOrigin).toString();
  return { url, result };
}
