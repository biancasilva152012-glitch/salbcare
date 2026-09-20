import { registerSW } from "virtual:pwa-register";

const isPreviewHost = (hostname: string) =>
  hostname.startsWith("id-preview--") ||
  hostname.startsWith("preview--") ||
  hostname === "lovableproject.com" ||
  hostname.endsWith(".lovableproject.com") ||
  hostname === "lovableproject-dev.com" ||
  hostname.endsWith(".lovableproject-dev.com") ||
  hostname === "beta.lovable.dev" ||
  hostname.endsWith(".beta.lovable.dev");

const unregisterAppWorker = async () => {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter((registration) => {
        const url = registration.active?.scriptURL || registration.installing?.scriptURL || registration.waiting?.scriptURL || "";
        return url.endsWith("/sw.js") || url.endsWith("/push-sw.js");
      })
      .map((registration) => registration.unregister()),
  );
};

export const registerAppServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return;

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();
  const disabled = new URLSearchParams(window.location.search).get("sw") === "off";
  const mustNotRegister = !import.meta.env.PROD || isInIframe || isPreviewHost(window.location.hostname) || disabled;

  if (mustNotRegister) {
    await unregisterAppWorker().catch(() => undefined);
    return;
  }

  registerSW({ immediate: true });
};