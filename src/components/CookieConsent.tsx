import { useState, useEffect } from "react";
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
    visible && (
      <div className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-[100] p-4 md:bottom-0 md:pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-lg glass-card p-4 space-y-3 border border-border shadow-xl">
          <div className="flex items-start gap-2">
            <Cookie className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Usamos cookies para melhorar sua experiência e garantir o funcionamento da plataforma. Seus dados são tratados conforme nossa Política de Privacidade.
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
      </div>
    )
  );
};

export default CookieConsent;
