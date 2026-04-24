/**
 * Per-user cache of the last successful `check-subscription` response.
 * Used as a graceful fallback when the edge function is transiently
 * unavailable (e.g. cold-start 503).
 *
 * Also exposes a small retry-with-exponential-backoff helper and a
 * structured logger that can optionally fan out to a monitoring sink.
 */

import { supabase } from "@/integrations/supabase/client";

const KEY_PREFIX = "salbcare_sub_cache_v1:";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h — used only as a fallback

export type CachedSubscription = {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
};

type CacheEnvelope = {
  cachedAt: number;
  data: CachedSubscription;
};

function key(userId: string) {
  return `${KEY_PREFIX}${userId}`;
}

export function readSubscriptionCache(userId: string): CachedSubscription | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope;
    if (!parsed?.data) return null;
    if (Date.now() - parsed.cachedAt > MAX_AGE_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeSubscriptionCache(userId: string, data: CachedSubscription) {
  if (typeof window === "undefined") return;
  try {
    const envelope: CacheEnvelope = { cachedAt: Date.now(), data };
    window.localStorage.setItem(key(userId), JSON.stringify(envelope));
  } catch {
    /* quota or disabled storage — ignore */
  }
}

export function clearSubscriptionCache(userId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(userId));
  } catch {
    /* ignore */
  }
}

/* ---------- structured logging ---------- */

type EdgeIncident = {
  fn: string;
  status?: number;
  code?: string;
  message?: string;
  attempt: number;
  finalAttempt: boolean;
  ts: string;
};

const RECENT_INCIDENTS_KEY = "salbcare_edge_incidents_v1";
const MAX_INCIDENTS = 20;

export function logEdgeIncident(incident: Omit<EdgeIncident, "ts">) {
  const entry: EdgeIncident = { ...incident, ts: new Date().toISOString() };
  // Console — structured, easy to grep
  console.warn("[edge-incident]", entry);

  // Optional alerting: keep a rolling buffer in localStorage so admins can
  // surface a "recurring runtime issues" badge in the UI later.
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(RECENT_INCIDENTS_KEY);
    const list: EdgeIncident[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    window.localStorage.setItem(
      RECENT_INCIDENTS_KEY,
      JSON.stringify(list.slice(0, MAX_INCIDENTS)),
    );
  } catch {
    /* ignore */
  }
}

export function readRecentEdgeIncidents(): EdgeIncident[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_INCIDENTS_KEY);
    return raw ? (JSON.parse(raw) as EdgeIncident[]) : [];
  } catch {
    return [];
  }
}

/* ---------- retry with exponential backoff ---------- */

export type InvokeWithRetryResult = {
  data: CachedSubscription | null;
  error: { status?: number; message: string; code?: string } | null;
  attempts: number;
  fellBack: boolean;
};

const RETRYABLE_STATUSES = new Set([502, 503, 504]);

function normalizeInvokeError(err: unknown): { status?: number; message: string; code?: string; name?: string } {
  const fallback = {
    status: undefined,
    message: err instanceof Error ? err.message : String(err),
    code: undefined,
    name: err instanceof Error ? err.name : undefined,
  };

  if (!err || typeof err !== "object") return fallback;

  const anyErr = err as any;
  const status = anyErr.status ?? anyErr.context?.status;
  const message = typeof anyErr.message === "string" ? anyErr.message : fallback.message;
  const code = typeof anyErr.code === "string" ? anyErr.code : undefined;
  const name = typeof anyErr.name === "string" ? anyErr.name : undefined;

  const rawJsonMatch = message.match(/\{.*\}$/);
  if (rawJsonMatch) {
    try {
      const parsed = JSON.parse(rawJsonMatch[0]);
      return {
        status,
        message: parsed.message || message,
        code: parsed.code || code,
        name,
      };
    } catch {
      return { status, message, code, name };
    }
  }

  return { status, message, code, name };
}

function isRetryable(err: any): boolean {
  if (!err) return false;
  const status = err.status ?? err.context?.status;
  if (status && RETRYABLE_STATUSES.has(status)) return true;
  // FunctionsFetchError: network/runtime failure (no status)
  if (err.name === "FunctionsFetchError") return true;
  // The edge function may also return a structured fallback envelope
  return false;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Calls `check-subscription` with up to `maxAttempts` retries on 5xx/network
 * failures using exponential backoff (500ms, 1s, 2s …).
 */
export async function invokeCheckSubscriptionWithRetry(
  maxAttempts = 3,
): Promise<InvokeWithRetryResult> {
  let attempt = 0;
  let lastErr: ReturnType<typeof normalizeInvokeError> | null = null;

  while (attempt < maxAttempts) {
    attempt += 1;
    let data: unknown = null;
    let error: unknown = null;

    try {
      const result = await supabase.functions.invoke("check-subscription");
      data = result.data;
      error = result.error;
    } catch (err) {
      error = normalizeInvokeError(err);
    }

    // The edge function may return 200 with a structured fallback payload
    // (see supabase/functions/check-subscription/index.ts).
    if (data && (data as any).fallback === true) {
      logEdgeIncident({
        fn: "check-subscription",
        code: (data as any).code,
        message: (data as any).error ?? "fallback envelope",
        attempt,
        finalAttempt: attempt === maxAttempts,
      });
      return {
        data: null,
        error: {
          message: (data as any).error ?? "service unavailable",
          code: (data as any).code,
        },
        attempts: attempt,
        fellBack: true,
      };
    }

    if (!error) {
      return { data: data as CachedSubscription, error: null, attempts: attempt, fellBack: false };
    }

    lastErr = normalizeInvokeError(error);
    const retryable = isRetryable(lastErr);
    logEdgeIncident({
      fn: "check-subscription",
      status: lastErr.status,
      code: lastErr.code,
      message: lastErr.message,
      attempt,
      finalAttempt: !retryable || attempt === maxAttempts,
    });

    if (!retryable) break;
    if (attempt < maxAttempts) {
      const backoff = 500 * 2 ** (attempt - 1); // 500, 1000, 2000…
      await sleep(backoff);
    }
  }

  return {
    data: null,
    error: {
      status: lastErr?.status,
      message: lastErr?.message ?? "unknown error",
      code: lastErr?.code,
    },
    attempts: attempt,
    fellBack: false,
  };
}
