import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const MAX_ATTEMPTS = 6; // ~30s polling

/**
 * Single source of truth for what the page renders. Everything (icon, copy,
 * buttons, auto-redirect) is derived from `status` so we never hit the
 * "two booleans disagree" class of bug we had before.
 */
type SucessoStatus = "confirming" | "active" | "pending";

const COPY: Record<
  SucessoStatus,
  {
    title: string;
    description: string;
    icon: typeof CheckCircle2;
    iconClass: string;
  }
> = {
  confirming: {
    title: "Confirmando seu pagamento…",
    description: "Estamos validando seu pagamento com o Stripe. Isso leva alguns segundos.",
    icon: Loader2,
    iconClass: "h-16 w-16 text-primary mx-auto animate-spin",
  },
  active: {
    title: "Pagamento confirmado!",
    description:
      "Sua assinatura foi ativada. Você já pode aproveitar todos os recursos do plano Essencial.",
    icon: CheckCircle2,
    iconClass: "h-16 w-16 text-success mx-auto",
  },
  pending: {
    title: "Pagamento em processamento",
    description:
      "O Stripe ainda está liberando sua assinatura. Pode levar até 1 minuto. Atualize abaixo para verificar.",
    icon: Clock,
    iconClass: "h-16 w-16 text-yellow-500 mx-auto",
  },
};

/**
 * Post-Stripe success page. Stripe webhooks can take a few seconds to flip
 * the subscription on. We poll `refreshSubscription` until `subscribed`
 * flips true (or we hit the max attempts) so the user sees a real status
 * instead of a generic "success" that lies.
 */
const Sucesso = () => {
  const navigate = useNavigate();
  const { refreshSubscription, subscription } = useAuth();
  const [attempts, setAttempts] = useState(0);

  // Kick off an immediate refresh on mount.
  useEffect(() => {
    void refreshSubscription();
  }, [refreshSubscription]);

  // Poll until confirmed or we exhaust the budget.
  useEffect(() => {
    if (subscription.subscribed) return;
    if (attempts >= MAX_ATTEMPTS) return;
    const t = setTimeout(() => {
      void refreshSubscription();
      setAttempts((a) => a + 1);
    }, 5000);
    return () => clearTimeout(t);
  }, [attempts, subscription.subscribed, refreshSubscription]);

  // Single source of truth — everything below derives from this.
  const status: SucessoStatus = useMemo(() => {
    if (subscription.subscribed) return "active";
    if (attempts >= MAX_ATTEMPTS) return "pending";
    return "confirming";
  }, [subscription.subscribed, attempts]);

  // Auto-redirect to dashboard once subscription flips active. Small delay
  // so the user actually sees the green check before being moved.
  useEffect(() => {
    if (status !== "active") return;
    const t = setTimeout(() => navigate("/dashboard", { replace: true }), 2500);
    return () => clearTimeout(t);
  }, [status, navigate]);

  const copy = COPY[status];
  const Icon = copy.icon;

  const handleRetry = () => {
    setAttempts(0);
    void refreshSubscription();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 max-w-md w-full text-center space-y-6"
        data-testid="sucesso-card"
        data-status={status}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Icon className={copy.iconClass} aria-hidden />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{copy.title}</h1>
          <p className="text-muted-foreground text-sm">{copy.description}</p>
        </div>

        {status === "confirming" && (
          <p
            className="text-xs text-muted-foreground"
            data-testid="sucesso-attempts"
          >
            Tentativa {attempts + 1}/{MAX_ATTEMPTS}…
          </p>
        )}

        <div className="space-y-2">
          {status === "pending" && (
            <Button
              onClick={handleRetry}
              variant="outline"
              className="w-full gap-2"
              data-testid="sucesso-retry"
            >
              <Loader2 className="h-4 w-4" />
              Verificar novamente
            </Button>
          )}
          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full gradient-primary font-semibold gap-2"
            disabled={status === "confirming"}
            data-testid="sucesso-go-dashboard"
          >
            {status === "confirming" ? "Aguarde…" : "Ir para o Dashboard"}
            {status !== "confirming" && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Sucesso;
