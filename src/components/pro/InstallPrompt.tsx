import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CREAM_BG, MONO, NAVY_INK, SANS } from "./brand";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

const DISMISS_KEY = "salbcare_install_dismissed_at";
const DISMISS_DAYS = 30;

export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as unknown as { standalone?: boolean }).standalone === true;

export const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

const recentlyDismissed = () => {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const at = Number(raw);
  if (!at) return false;
  return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
};

/** Captura o evento de instalação do Chrome/Edge e expõe o disparo. */
export function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const install = async () => {
    if (!event) return false;
    await event.prompt();
    await event.userChoice;
    setEvent(null);
    return true;
  };

  return { canInstall: !!event, install };
}

/** Banner discreto de instalação. Não aparece no app já instalado. */
const InstallPrompt = () => {
  const { canInstall, install } = useInstallPrompt();
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;
    setIos(isIos());
    const t = window.setTimeout(() => setVisible(true), 2500);
    return () => window.clearTimeout(t);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;
  if (!canInstall && !ios) return null;

  return (
    <div
      role="region"
      aria-label="Instalar o app SalbCare"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(12px + env(safe-area-inset-bottom))",
        zIndex: 60,
        background: NAVY_INK,
        color: CREAM_BG,
        borderRadius: 14,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: SANS,
        boxShadow: "0 14px 34px rgba(10,22,40,0.28)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em" }}>SALBCARE</div>
        <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: 1.45 }}>
          {ios && !canInstall
            ? "Toque em Compartilhar e escolha Adicionar à Tela de Início."
            : "Instale o app para abrir sem navegador e usar offline."}
        </p>
      </div>
      {canInstall ? (
        <button
          type="button"
          onClick={() => void install()}
          style={{
            background: CREAM_BG,
            color: NAVY_INK,
            border: "none",
            borderRadius: 999,
            padding: "10px 16px",
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 14,
            cursor: "pointer",
            flex: "none",
          }}
        >
          Instalar
        </button>
      ) : (
        <Link
          to="/instalar"
          style={{
            color: CREAM_BG,
            fontSize: 13,
            textDecoration: "underline",
            flex: "none",
          }}
        >
          Como fazer
        </Link>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dispensar aviso de instalação"
        style={{
          background: "none",
          border: "none",
          color: CREAM_BG,
          fontSize: 20,
          lineHeight: 1,
          cursor: "pointer",
          flex: "none",
        }}
      >
        ×
      </button>
    </div>
  );
};

export default InstallPrompt;
