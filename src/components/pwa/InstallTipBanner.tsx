import { useState } from "react";
import { X, Smartphone } from "lucide-react";
import InstallPWAModal from "./InstallPWAModal";
import { usePWAInstall, BANNER_DISMISSED_KEY, INSTALLED_KEY } from "@/contexts/PWAInstallContext";
import { usePlatformDetection } from "@/hooks/usePlatformDetection";

const TEAL = "#00B4A0";
const NAVY = "#0D1B2A";

/**
 * Sutil banner para profissionais logados, no topo do dashboard.
 * Aparece apenas uma vez (dispensável). Salva em localStorage quando fechado.
 */
const InstallTipBanner = () => {
  const { isInstalled } = usePWAInstall();
  const { isStandalone } = usePlatformDetection();
  const [open, setOpen] = useState(false);
  const initialDismissed = (() => {
    try {
      return (
        !!localStorage.getItem(BANNER_DISMISSED_KEY) ||
        localStorage.getItem(INSTALLED_KEY) === "true"
      );
    } catch {
      return false;
    }
  })();
  const [dismissed, setDismissed] = useState(initialDismissed);

  if (dismissed || isInstalled || isStandalone) return null;

  const close = () => {
    try { localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString()); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <>
      <div
        role="region"
        aria-label="Dica: instalar SalbCare como app"
        className="mx-auto max-w-6xl px-4 sm:px-6 mt-3"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <div
          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 sm:px-4"
          style={{ background: "#F0FAFA", border: `1px solid #CFE9E5` }}
        >
          <Smartphone aria-hidden className="h-4 w-4 shrink-0" style={{ color: TEAL }} />
          <p className="text-sm flex-1" style={{ color: NAVY }}>
            <span className="hidden sm:inline">💡 Dica: </span>
            instale o SalbCare como app no celular para acesso rápido.{" "}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="font-semibold underline underline-offset-2"
              style={{ color: TEAL }}
            >
              Saber como
            </button>
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar dica"
            className="p-1 rounded-lg hover:bg-white/60 transition-colors"
          >
            <X className="h-4 w-4" style={{ color: "#64748B" }} />
          </button>
        </div>
      </div>
      <InstallPWAModal open={open} onOpenChange={setOpen} />
    </>
  );
};

export default InstallTipBanner;
