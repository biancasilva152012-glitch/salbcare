import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register push notification service worker (separate from PWA SW)
if ("serviceWorker" in navigator) {
  const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
  const isPreview = window.location.hostname.includes("id-preview--") || window.location.hostname.includes("lovableproject.com");
  if (!isInIframe && !isPreview) {
    navigator.serviceWorker.register("/push-sw.js").catch(() => {});
  }
}

createRoot(document.getElementById("root")!).render(<App />);
