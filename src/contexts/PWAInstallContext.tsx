import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallContextValue {
  canInstallNatively: boolean;
  isInstalled: boolean;
  triggerInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

const PWAInstallContext = createContext<PWAInstallContextValue>({
  canInstallNatively: false,
  isInstalled: false,
  triggerInstall: async () => "unavailable",
});

export const INSTALLED_KEY = "salbcare_pwa_installed";
export const DISMISSED_KEY = "salbcare_pwa_dismissed";
export const BANNER_DISMISSED_KEY = "salbcare_pwa_banner_dismissed";

export const PWAInstallProvider = ({ children }: { children: ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (localStorage.getItem(INSTALLED_KEY) === "true") return true;
    return (
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      try {
        localStorage.setItem(INSTALLED_KEY, "true");
      } catch {
        /* ignore */
      }
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        window.dispatchEvent(new CustomEvent("salbcare:pwa_installed"));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return "unavailable" as const;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        try {
          localStorage.setItem(INSTALLED_KEY, "true");
        } catch {
          /* ignore */
        }
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      return choice.outcome;
    } catch {
      return "dismissed" as const;
    }
  }, [deferredPrompt]);

  const value = useMemo<PWAInstallContextValue>(
    () => ({
      canInstallNatively: !!deferredPrompt,
      isInstalled,
      triggerInstall,
    }),
    [deferredPrompt, isInstalled, triggerInstall]
  );

  return <PWAInstallContext.Provider value={value}>{children}</PWAInstallContext.Provider>;
};

export const usePWAInstall = () => useContext(PWAInstallContext);
