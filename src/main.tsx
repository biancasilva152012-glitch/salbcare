import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
const hostname = window.location.hostname;
const isPreview = hostname.includes("id-preview--") || hostname.includes("lovableproject.com");
const canRegisterServiceWorker = "serviceWorker" in navigator && !isInIframe && !isPreview;

if (canRegisterServiceWorker) {
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
