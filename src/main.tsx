import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
const hostname = window.location.hostname;
const isPreview = hostname.includes("id-preview--") || hostname.includes("lovableproject.com");
const canRegisterServiceWorker = "serviceWorker" in navigator && !isInIframe && !isPreview;

if (canRegisterServiceWorker) {
  registerSW({ immediate: true });
  navigator.serviceWorker.register("/push-sw.js").catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
