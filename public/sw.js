// SalbCare Service Worker
// Strategy: network-first for HTML/navigations so every visitor gets the latest deploy
// as soon as the network responds. Same-origin static assets fall back to cache-first.
// Cache version is stamped at deploy time so old caches are dropped when a new SW activates.
//
// NOTE: in production builds this file is replaced by the Workbox-generated SW from
// vite-plugin-pwa (registerType: "autoUpdate", skipWaiting, clientsClaim). This standalone
// SW keeps the same behavior guarantees for dev/preview and for any environment where the
// Workbox build is not applied.

const CACHE_VERSION = "salbcare-v2026-07-12-1";
const HTML_CACHE = `${CACHE_VERSION}-html`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("salbcare-") && !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isNavigation(req) {
  return req.mode === "navigate" || (req.method === "GET" && req.headers.get("accept")?.includes("text/html"));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // HTML / navigations: network-first, fall back to cache when offline.
  if (isNavigation(req)) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req, { cache: "no-store" });
          const cache = await caches.open(HTML_CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(req);
          return cached || caches.match("/");
        }
      })(),
    );
    return;
  }

  // Static hashed assets: cache-first with background refresh.
  if (/\/assets\/.*\.(js|css|woff2|png|jpg|jpeg|svg|webp|avif)$/.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return cached || Response.error();
        }
      })(),
    );
  }
});
