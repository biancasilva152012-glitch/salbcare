import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fontsource/gloock";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import { attachSwDiagnostics } from "./lib/swDiagnostics";
import { attachGlobalErrorHandlers, initErrorReporting } from "./lib/errorReporting";
import { registerAppServiceWorker } from "./lib/registerAppServiceWorker";

initErrorReporting();
attachGlobalErrorHandlers();

if (import.meta.env.PROD) {
  attachSwDiagnostics();
}
void registerAppServiceWorker();

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(<App />);
}

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
  if (path !== "/pro") import("./pages/Pro").catch(() => {});
});
