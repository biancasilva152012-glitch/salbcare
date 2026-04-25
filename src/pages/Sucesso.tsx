import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Post-Stripe success page. Stripe webhooks can take a few seconds to flip
 * the subscription on. We poll `refreshSubscription` until `subscribed`
 * flips true (or we hit the max attempts) so the user sees a real status
 * instead of a generic "success" that lies.
 *
 * States rendered:
 *  - confirming  → spinner + "Confirmando seu pagamento…"
 *  - active      → green check + "Pagamento confirmado"
 *  - pending     → clock + "Pagamento em processamento" with retry CTA
 */
const Sucesso = () => {
  const navigate = useNavigate();
  const { refreshSubscription, subscription } = useAuth();
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 6; // ~30s

  useEffect(() => {
    void refreshSubscription();
  }, [refreshSubscription]);

  // Poll for subscription confirmation
  useEffect(() => {
    if (subscription.subscribed) return;
    if (attempts >= MAX_ATTEMPTS) return;
    const t = setTimeout(() => {
      void refreshSubscription();
      setAttempts((a) => a + 1);
    }, 5000);
    return () => clearTimeout(t);
  }, [attempts, subscription.subscribed, refreshSubscription]);

  const isConfirmed = subscription.subscribed;
  const isPending = !isConfirmed && attempts >= MAX_ATTEMPTS;
  const isConfirming = !isConfirmed && !isPending;

  // Auto-redirect to dashboard once subscription flips to active so the user
  // doesn't have to click. Small delay so they see the green check first.
  useEffect(() => {
    if (!isConfirmed) return;
    const t = setTimeout(() => navigate("/dashboard", { replace: true }), 2500);
    return () => clearTimeout(t);
  }, [isConfirmed, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 max-w-md w-full text-center space-y-6"
        data-testid="sucesso-card"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          {isConfirmed ? (
            <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
          ) : isPending ? (
            <Clock className="h-16 w-16 text-yellow-500 mx-auto" />
          ) : (
            <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
          )}
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {isConfirmed
              ? "Pagamento confirmado!"
              : isPending
                ? "Pagamento em processamento"
                : "Confirmando seu pagamento…"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isConfirmed
              ? "Sua assinatura foi ativada. Você já pode aproveitar todos os recursos do plano Essencial."
              : isPending
                ? "O Stripe ainda está liberando sua assinatura. Pode levar até 1 minuto. Atualize abaixo para verificar."
                : "Estamos validando seu pagamento com o Stripe. Isso leva alguns segundos."}
          </p>
        </div>

        {isConfirming && (
          <p
            className="text-xs text-muted-foreground"
            data-testid="sucesso-attempts"
          >
            Tentativa {attempts + 1}/{MAX_ATTEMPTS}…
          </p>
        )}

        <div className="space-y-2">
          {isPending && (
            <Button
              onClick={() => {
                setAttempts(0);
                void refreshSubscription();
              }}
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
            disabled={isConfirming}
            data-testid="sucesso-go-dashboard"
          >
            {isConfirming ? "Aguarde…" : "Ir para o Dashboard"}{" "}
            {!isConfirming && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Sucesso;
