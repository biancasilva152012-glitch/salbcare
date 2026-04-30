import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Smartphone } from "lucide-react";
import { useLocation } from "react-router-dom";
import InstallPWAModal from "./InstallPWAModal";
import { usePWAInstall, DISMISSED_KEY, INSTALLED_KEY } from "@/contexts/PWAInstallContext";
import { usePlatformDetection } from "@/hooks/usePlatformDetection";

const TEAL = "#00B4A0";
const NAVY = "#0D1B2A";

const HIDDEN_PREFIXES = [
  "/instalar-app",
  "/instalar",
  "/install",
  "/checkout",
  "/sucesso",
  "/cancelado",
  "/payment-success",
  "/subscription-success",
  "/login",
  "/register",
  "/cadastro",
  "/forgot-password",
  "/reset-password",
];

const InstallPWAButton = () => {
  const { isInstalled } = usePWAInstall();
  const { isStandalone, isMobile } = usePlatformDetection();
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  const dismissed = (() => {
    try {
      return !!localStorage.getItem(DISMISSED_KEY) || localStorage.getItem(INSTALLED_KEY) === "true";
    } catch {
      return false;
    }
  })();

  const hidden = HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    if (isInstalled || isStandalone || dismissed || hidden) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, [isInstalled, isStandalone, dismissed, hidden, location.pathname]);

  if (isInstalled || isStandalone || dismissed || hidden) return null;

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            aria-label="Instalar SalbCare como app"
            className={
              isMobile
                ? "fixed bottom-20 right-4 z-40 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2 hover:scale-[1.02] transition-transform"
                : "fixed top-4 right-4 z-40 rounded-xl px-3.5 py-2 shadow-md flex items-center gap-2 hover:scale-[1.02] transition-transform"
            }
            style={{
              background: `linear-gradient(135deg, ${TEAL}, ${NAVY})`,
              color: "#fff",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              fontSize: isMobile ? 14 : 13,
            }}
          >
            <Smartphone aria-hidden className="h-4 w-4" />
            Instalar App
          </motion.button>
        )}
      </AnimatePresence>
      <InstallPWAModal open={open} onOpenChange={setOpen} />
    </>
  );
};

export default InstallPWAButton;
