// Kill-switch para service worker legado.
// Versões antigas da SalbCare registraram "/sw.js"; agora usamos apenas "/push-sw.js"
// (registrado em src/main.tsx). Este arquivo existe só para se autodestruir
// em navegadores que ainda têm o SW antigo instalado, evitando o erro
// "script resource is behind a redirect" que quebrava refresh em rotas profundas.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {}
      try {
        await self.registration.unregister();
      } catch {}
      try {
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach((c) => c.navigate(c.url));
      } catch {}
    })(),
  );
});
