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
// `next`/`nextRedirect`/`redirect` são tratados como sinônimos da rota
// interna desejada; só viram destino quando passam pela allowlist E quando
// não conflitam entre si (duplicatas inconsistentes → fallback /dashboard).
export const PRESERVED_QUERY_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "next",
  "nextRedirect",
  "redirect",
]);

const TARGET_PARAM_KEYS = ["next", "nextRedirect", "redirect"] as const;

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

/**
 * Strip a known basePath prefix from `path` so the allowlist check works
 * even when the value already includes the prefix (ex.: ?next=/app/dashboard
 * num app servido em /app).
 */
function stripBasePath(path: string, basePath: string): string {
  if (!basePath) return path;
  if (path === basePath) return "/";
  if (path.startsWith(`${basePath}/`)) return path.slice(basePath.length);
  return path;
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
    // Os params de destino (next/nextRedirect/redirect) NUNCA sobrevivem
    // ao redirect — são consumidos por resolveDeepTarget.
    if ((TARGET_PARAM_KEYS as readonly string[]).includes(k)) continue;
    if (!PRESERVED_QUERY_PARAMS.has(k)) continue;
    // `append` (não `set`) preserva múltiplos valores da mesma chave.
    out.append(k, v);
  }
  return out.toString();
}

/**
 * Resolve the deep target from `next` / `nextRedirect` / `redirect`,
 * accepting the FIRST value that passes the allowlist (deterministic when
 * repeated).
 *
 * Inconsistency rule: if the query specifies BOTH `next` and `redirect`
 * (or any combination of the three target keys) and they resolve to
 * DIFFERENT allowed paths, we conservatively fall back to `/dashboard`
 * instead of silently picking one. This avoids attacker-controlled
 * disagreements being treated as "valid".
 */
function resolveDeepTarget(params: URLSearchParams, basePath: string): string {
  const allowedSeen = new Set<string>();
  for (const key of TARGET_PARAM_KEYS) {
    for (const raw of params.getAll(key)) {
      const stripped = stripBasePath(raw, basePath);
      if (isAllowedRedirect(stripped)) {
        allowedSeen.add(stripped);
      }
    }
  }
  if (allowedSeen.size === 0) return "/dashboard";
  if (allowedSeen.size === 1) return [...allowedSeen][0];
  // Múltiplos destinos válidos divergentes → não escolhemos por conta própria.
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
    if ((TARGET_PARAM_KEYS as readonly string[]).includes(k)) continue;
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

  const deepTarget = resolveDeepTarget(params, prefix);
  const preserved = buildPreservedSearch(search);

  // Tanto o usuário autenticado quanto o visitante seguem direto para o
  // destino solicitado. As rotas do dashboard são `allowGuest`, portanto
  // visitantes recebem o modo demo público sem login/cadastro.
  const suffix = preserved ? `?${preserved}` : "";
  return `${prefix}${deepTarget}${suffix}`;
}
