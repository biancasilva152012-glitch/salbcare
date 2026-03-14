import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_KEY = "salbcare_cookie_consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      setVisible(true);
    }
  }, []);

  const handleAccept = (type: "all" | "essential") => {
    localStorage.setItem(COOKIE_KEY, type);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          <div className="mx-auto max-w-lg glass-card p-4 space-y-3 border border-border shadow-xl">
            <div className="flex items-start gap-2">
              <Cookie className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Usamos cookies para melhorar sua experiência e garantir o funcionamento da plataforma. Nenhum dado é vendido a terceiros.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleAccept("all")} size="sm" className="flex-1 gradient-primary text-xs">
                Aceitar todos
              </Button>
              <Button onClick={() => handleAccept("essential")} size="sm" variant="outline" className="flex-1 text-xs">
                Só essenciais
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
