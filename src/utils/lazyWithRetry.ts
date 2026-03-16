import { lazy, ComponentType } from "react";

/**
 * Wraps React.lazy() to catch ChunkLoadError (stale deploys)
 * and force a single page reload to fetch new assets.
 *
 * Uses sessionStorage to avoid infinite reload loops.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  chunkName?: string
) {
  return lazy(async () => {
    const storageKey = `chunk-retry-${chunkName ?? "global"}`;
    const hasRetried = sessionStorage.getItem(storageKey);

    try {
      const module = await factory();
      // Successful load — clear any previous retry flag
      sessionStorage.removeItem(storageKey);
      return module;
    } catch (error) {
      if (!hasRetried) {
        sessionStorage.setItem(storageKey, "1");
        window.location.reload();
        // Return a never-resolving promise so React doesn't render stale UI
        return new Promise<never>(() => {});
      }
      // Already retried once — let the error propagate
      throw error;
    }
  });
}
