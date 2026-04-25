/**
 * Pure helper that decides where /experimente should redirect to.
 *
 * Extracted from the Experimente page so the logic can be unit-tested
 * exhaustively (visitor vs authed, base path, query sanitization,
 * open-redirect protection, deep-route preservation).
 *
 * IMPORTANT: this function does NOT touch localStorage, console or any
 * side effect. It just returns a string suitable for <Navigate to=...>.
 */

export const ALLOWED_REDIRECTS = [
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
] as const;

// Apenas estes parâmetros sobrevivem. Tudo o mais é descartado.
// `next`/`nextRedirect` são tratados como sinônimos da rota interna desejada;
// só viram redirect quando passam pela allowlist.
export const PRESERVED_QUERY_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "next",
  "nextRedirect",
]);

export type BuildRedirectInput = {
  authenticated: boolean;
  search?: string;
  /**
   * Prefixo do app quando ele é servido em sub-path (ex.: "/app").
   * Pode vir de import.meta.env.BASE_URL no chamador.
   * Default = "" (raiz).
   */
  basePath?: string;
};

function normalizeBasePath(raw?: string): string {
  if (!raw) return "";
  let p = raw.trim();
  if (p === "" || p === "/") return "";
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

function isAllowedRedirect(path: string | null | undefined): path is string {
  if (!path) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false; // protocol-relative
  // Bloqueia path traversal e variantes percent-encoded.
  const lowered = path.toLowerCase();
  if (lowered.includes("..")) return false;
  if (lowered.includes("%2f") || lowered.includes("%5c")) return false; // / e \ encodados
  if (lowered.includes("\\")) return false;
  return (ALLOWED_REDIRECTS as readonly string[]).some(
    (allowed) => path === allowed || path.startsWith(`${allowed}/`),
  );
}

function buildPreservedSearch(rawSearch: string): string {
  // URLSearchParams é tolerante a percent-encoding malformado (não lança):
  // pares inválidos viram a string crua. Mantemos esse comportamento "best
  // effort" — nunca quebramos o redirect por causa de um param podre.
  let incoming: URLSearchParams;
  try {
    incoming = new URLSearchParams(rawSearch);
  } catch {
    return "";
  }
  const out = new URLSearchParams();
  for (const [k, v] of incoming.entries()) {
    // `next`/`nextRedirect` não devem aparecer no querystring final —
    // eles são consumidos para escolher o destino, não propagados.
    if (k === "next" || k === "nextRedirect") continue;
    if (!PRESERVED_QUERY_PARAMS.has(k)) continue;
    // `append` (não `set`) preserva múltiplos valores da mesma chave.
    out.append(k, v);
  }
  return out.toString();
}

/**
 * Resolve the deep target from `next` / `nextRedirect`, accepting the FIRST
 * value that passes the allowlist (deterministic when repeated).
 *
 * - Multiple `next=` values: each one is checked in order; the first that
 *   matches the allowlist wins. If none matches, falls back to /dashboard.
 * - This guarantees `?next=/admin&next=/dashboard/agenda` deterministically
 *   resolves to `/dashboard/agenda` instead of silently using `/dashboard`.
 */
function resolveDeepTarget(params: URLSearchParams): string {
  const candidates = [
    ...params.getAll("next"),
    ...params.getAll("nextRedirect"),
  ];
  for (const c of candidates) {
    if (isAllowedRedirect(c)) return c;
  }
  return "/dashboard";
}

/**
 * Lightweight telemetry helper: returns the SORTED list of preserved keys
 * (utm_*, ref) actually present in the query string. No values are returned —
 * just the key names — so the caller can log it without leaking PII.
 */
export function getPreservedKeysFromSearch(search: string): string[] {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return [];
  }
  const seen = new Set<string>();
  for (const k of params.keys()) {
    if (k === "next" || k === "nextRedirect") continue;
    if (PRESERVED_QUERY_PARAMS.has(k)) seen.add(k);
  }
  return [...seen].sort();
}

export function buildExperimenteRedirect({
  authenticated,
  search = "",
  basePath,
}: BuildRedirectInput): string {
  const prefix = normalizeBasePath(basePath);
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    params = new URLSearchParams();
  }

  const deepTarget = resolveDeepTarget(params);
  const preserved = buildPreservedSearch(search);

  if (authenticated) {
    const suffix = preserved ? `?${preserved}` : "";
    return `${prefix}${deepTarget}${suffix}`;
  }

  // Visitante → /register, com o destino final em ?redirect= (já com prefixo
  // se houver — assim o /register pode dar push direto após o cadastro).
  const registerParams = new URLSearchParams(preserved);
  registerParams.set("redirect", `${prefix}${deepTarget}`);
  return `${prefix}/register?${registerParams.toString()}`;
}

