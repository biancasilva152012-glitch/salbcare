import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import { attachSwDiagnostics } from "./lib/swDiagnostics";

const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
const hostname = window.location.hostname;
const isPreview = hostname.includes("id-preview--") || hostname.includes("lovableproject.com");
const canRegisterServiceWorker = "serviceWorker" in navigator && !isInIframe && !isPreview;

if (canRegisterServiceWorker) {
  // Liga diagnósticos ANTES de registrar — capta o primeiro controllerchange.
  attachSwDiagnostics();

  // Registra APENAS o SW gerado pelo Workbox (em /sw.js).
  // O handler de push é injetado via workbox.importScripts (vite.config.ts → /push-handlers.js).
  // NUNCA registrar um segundo SW no mesmo escopo "/" — isso causa swap contínuo entre SWs
  // com clientsClaim → controllerchange → reload em loop na home pública.
  registerSW({ immediate: true });

  // Limpa registros legados de "/push-sw.js" (versões antigas registravam dois SWs).
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => {
      regs.forEach((reg) => {
        const url = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || "";
        if (url.endsWith("/push-sw.js")) {
          reg.unregister().catch(() => {});
        }
      });
    })
    .catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);

// Prefetch high-traffic public routes when the browser is idle so the first
// navigation feels instant. Skip on the /bio route itself (already loaded) and
// avoid competing with the initial render.
const idle = (cb: () => void) => {
  const w = window as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
  };
  if (w.requestIdleCallback) w.requestIdleCallback(cb, { timeout: 2500 });
  else window.setTimeout(cb, 1500);
};

idle(() => {
  const path = window.location.pathname;
  if (path !== "/bio") import("./pages/Bio").catch(() => {});
  if (path !== "/kite") import("./pages/Kite").catch(() => {});
});
