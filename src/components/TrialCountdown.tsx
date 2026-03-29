import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Sparkles, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { isAdminEmail } from "@/config/admin";

const TrialCountdown = () => {
  const { subscription, user } = useAuth();
  const navigate = useNavigate();
  const [showOffer, setShowOffer] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const days = subscription.trialDaysRemaining;
  const hours = days * 24; // approximate

  // Show offer modal when <= 48h remaining
  useEffect(() => {
    if (days > 0 && days <= 2 && !dismissed) {
      const key = "salbcare_offer_shown";
      const shown = sessionStorage.getItem(key);
      if (!shown) {
        const timer = setTimeout(() => {
          setShowOffer(true);
          sessionStorage.setItem(key, "1");
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [days, dismissed]);

  if (!days || days <= 0 || subscription.subscribed || isAdminEmail(user?.email)) return null;

  const urgency = days <= 1 ? "text-destructive" : days <= 2 ? "text-orange-400" : "text-primary";
  const bgUrgency = days <= 1 ? "ring-destructive/30" : days <= 2 ? "ring-orange-400/30" : "ring-primary/20";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card p-3 flex items-center gap-3 ${bgUrgency} ring-1`}
      >
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${days <= 2 ? "bg-orange-400/10" : "bg-primary/10"}`}>
          <Clock className={`h-4 w-4 ${urgency}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold">
            Teste gratuito:{" "}
            <span className={urgency}>
              {days} {days === 1 ? "dia" : "dias"} restantes
            </span>
          </p>
          <div className="w-full bg-accent rounded-full h-1 mt-1 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(5, (days / 7) * 100)}%` }}
              transition={{ duration: 0.8 }}
              className={`h-full rounded-full ${days <= 2 ? "bg-orange-400" : "bg-primary"}`}
            />
          </div>
        </div>
        <Button
          size="sm"
          className="shrink-0 text-xs gradient-primary font-semibold"
          onClick={() => navigate("/subscription")}
        >
          Assinar
        </Button>
      </motion.div>

      {/* Launch Offer Modal - 48h */}
      <Dialog open={showOffer} onOpenChange={setShowOffer}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Oferta de Lançamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Seu teste termina em <span className="font-bold text-foreground">{days} {days === 1 ? "dia" : "dias"}</span>.
              Assine agora o <span className="font-bold text-primary">Plano Profissional</span> e garanta:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Contador especialista em saúde
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Emissão de NF-e 100% legal
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Economia de até 60% em impostos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Você fica com 100% das consultas
              </li>
            </ul>
            <div className="glass-card p-3 text-center space-y-1">
              <p className="text-xs text-muted-foreground line-through">R$ 99/mês</p>
              <p className="text-2xl font-bold text-primary">R$ 79/mês</p>
              <p className="text-[10px] text-muted-foreground">na assinatura anual • economia de R$ 240/ano</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowOffer(false);
                  navigate("/checkout?plan=professional");
                }}
                className="flex-1 gradient-primary font-semibold"
              >
                Pagar com PIX
              </Button>
              <Button
                onClick={() => {
                  setShowOffer(false);
                  navigate("/subscription");
                }}
                variant="outline"
                className="flex-1"
              >
                Ver planos
              </Button>
            </div>
            <button
              onClick={() => { setShowOffer(false); setDismissed(true); }}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Agora não, obrigado
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TrialCountdown;
