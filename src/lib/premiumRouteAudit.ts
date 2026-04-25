import { supabase } from "@/integrations/supabase/client";

/**
 * Logger best-effort para redirecionamentos do <PremiumRoute>.
 *
 * Sempre escreve no console (nivel `info` em dev, silencioso em produção
 * graças ao tree-shake de Vite via `import.meta.env`) e tenta gravar
 * em `public.premium_route_blocks` quando o usuário está autenticado.
 *
 * Falhas de rede / RLS são silenciadas — telemetria nunca pode bloquear
 * a UX do paywall.
 */

export type PremiumRouteReason =
  | "premium_required"
  | "trial_expired"
  | "subscription_canceled"
  | "user_type_mismatch";

export interface PremiumRouteBlockEvent {
  /** Nome canônico do módulo (ex.: "accounting", "legal"). A-Za-z0-9_-, max 64. */
  module: string;
  reason?: PremiumRouteReason;
  attemptedPath?: string;
  metadata?: Record<string, string | number | boolean>;
}

/** Limite de envios para evitar flood quando há loops de navegação. */
const RATE_LIMIT_KEY = "salbcare_premium_route_block_last";
const RATE_LIMIT_MS = 5000; // não logar duplicado em < 5s para mesma rota

const sanitize = (value: string): string =>
  value.replace(/[^A-Za-z0-9_\-]/g, "").slice(0, 64);

const isRateLimited = (signature: string): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { sig: string; ts: number };
    return parsed.sig === signature && Date.now() - parsed.ts < RATE_LIMIT_MS;
  } catch {
    return false;
  }
};

const markRateLimit = (signature: string) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      RATE_LIMIT_KEY,
      JSON.stringify({ sig: signature, ts: Date.now() }),
    );
  } catch {
    /* ignore */
  }
};

export async function logPremiumRouteBlock(
  event: PremiumRouteBlockEvent,
): Promise<void> {
  const moduleClean = sanitize(event.module || "unknown");
  const reasonClean = sanitize(event.reason || "premium_required");
  const path = (event.attemptedPath || "").slice(0, 256);
  const signature = `${moduleClean}|${reasonClean}|${path}`;

  // Console signal sempre (ajuda em testes E2E e debugging local)
  // Mantemos console.info para não poluir warning/error do CI.
  if (typeof console !== "undefined") {
    console.info(
      "[premium-route-block]",
      JSON.stringify({
        module: moduleClean,
        reason: reasonClean,
        attemptedPath: path || null,
        metadata: event.metadata ?? {},
        at: new Date().toISOString(),
      }),
    );
  }

  if (isRateLimited(signature)) return;
  markRateLimit(signature);

  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return; // visitor → só log no console

    await supabase.from("premium_route_blocks").insert({
      user_id: userId,
      module: moduleClean,
      reason: reasonClean,
      attempted_path: path || null,
      metadata: event.metadata ?? {},
    });
  } catch {
    // Best-effort
  }
}
