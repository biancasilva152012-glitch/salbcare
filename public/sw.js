// SalbCare Service Worker
// Strategy: network-first for HTML/navigations so every visitor gets the latest deploy
// as soon as the network responds. Same-origin static assets fall back to cache-first.
// Academy PDFs (signed URLs from storage) are cached so the material opens offline.
// Cache version is stamped at deploy time so old caches are dropped when a new SW activates.
//
// NOTE: in production builds this file is replaced by the Workbox-generated SW from
// vite-plugin-pwa (registerType: "autoUpdate", skipWaiting, clientsClaim). This standalone
// SW keeps the same behavior guarantees for dev/preview and for any environment where the
// Workbox build is not applied.

const CACHE_VERSION = "salbcare-v2026-09-08-2";
// Rotas que precisam abrir offline (Quick Card, materiais e tela de instalação).
const OFFLINE_ROUTES = ["/", "/quick-card", "/instalar", "/academy"];
const HTML_CACHE = `${CACHE_VERSION}-html`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
// Cache dos PDFs comprados. Nome fixo (sem versão) para sobreviver a novos deploys.
const PDF_CACHE = "salbcare-academy-pdf";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(HTML_CACHE);
        await cache.addAll(OFFLINE_ROUTES);
      } catch {
        /* rede indisponivel no install */
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("salbcare-") && k !== PDF_CACHE && !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isNavigation(req) {
  return req.mode === "navigate" || (req.method === "GET" && req.headers.get("accept")?.includes("text/html"));
}

function isAcademyPdf(url) {
  return url.pathname.includes("academy-materials") || url.pathname.endsWith(".pdf");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // PDFs da Academy: cache-first, inclusive de outra origem (URL assinada do storage).
  // A chave ignora a assinatura para o arquivo continuar abrindo depois que o link expira.
  if (isAcademyPdf(url)) {
    const key = new Request(url.origin + url.pathname, { method: "GET" });
    event.respondWith(
      (async () => {
        const cache = await caches.open(PDF_CACHE);
        const cached = await cache.match(key);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(key, res.clone());
          return res;
        } catch {
          return cached || Response.error();
        }
      })(),
    );
    return;
  }

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
          if (cached) return cached;
          const cache = await caches.open(HTML_CACHE);
          const route = OFFLINE_ROUTES.find((r) => url.pathname === r || url.pathname.startsWith(r + "/"));
          return (route && (await cache.match(route))) || (await cache.match("/")) || Response.error();
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
