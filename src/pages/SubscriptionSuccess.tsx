import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Loader2, Clock, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { trackPurchase, trackCtaClick } from "@/hooks/useTracking";
import { PLANS } from "@/config/plans";

const MAX_ATTEMPTS = 6;

type Status = "confirming" | "active" | "pending";

/**
 * Página dedicada pós-checkout do plano Essencial.
 * - Confirma a assinatura
 * - Dispara `purchase` (GA4 + Meta) com plan + value uma única vez
 * - Mostra próximos passos para começar a alimentar o SalbScore
 */
const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { refreshSubscription, subscription, user } = useAuth();
  const [attempts, setAttempts] = useState(0);
  const [purchaseTracked, setPurchaseTracked] = useState(false);

  // Refresh inicial
  useEffect(() => {
    void refreshSubscription();
  }, [refreshSubscription]);

  // Polling até confirmar
  useEffect(() => {
    if (subscription.subscribed) return;
    if (attempts >= MAX_ATTEMPTS) return;
    const t = setTimeout(async () => {
      await refreshSubscription();
      setAttempts((a) => a + 1);
    }, 5000);
    return () => clearTimeout(t);
  }, [attempts, subscription.subscribed, refreshSubscription]);

  const status: Status = useMemo(() => {
    if (subscription.subscribed) return "active";
    if (attempts >= MAX_ATTEMPTS) return "pending";
    return "confirming";
  }, [subscription.subscribed, attempts]);

  // Dispara purchase event uma vez quando confirmar
  useEffect(() => {
    if (status === "active" && !purchaseTracked) {
      trackPurchase(PLANS.basic.price);
      // GA4 conversion granular
      if (window.gtag) {
        window.gtag("event", "subscription_confirmed", {
          plan: "basic",
          plan_name: PLANS.basic.name,
          value: PLANS.basic.price,
          currency: "BRL",
          source: sessionStorage.getItem("salbcare_checkout_source") || "checkout",
        });
      }
      if (window.fbq) {
        window.fbq("trackCustom", "SubscriptionConfirmed", {
          plan: "basic",
          value: PLANS.basic.price,
          currency: "BRL",
        });
      }
      setPurchaseTracked(true);
    }
  }, [status, purchaseTracked]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 max-w-lg w-full space-y-6"
        data-testid="subscription-success-card"
        data-status={status}
      >
        <div className="text-center space-y-3">
          {status === "active" ? (
            <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
          ) : status === "pending" ? (
            <Clock className="h-16 w-16 text-yellow-500 mx-auto" />
          ) : (
            <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
          )}
          <h1 className="text-2xl font-bold">
            {status === "active"
              ? "Assinatura Essencial confirmada!"
              : status === "pending"
              ? "Pagamento em processamento"
              : "Confirmando seu pagamento…"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {status === "active" ? (
              <>
                Bem-vindo ao plano <strong>Essencial</strong> — R$ {PLANS.basic.price}/mês.
                Você já tem acesso a todos os recursos: pacientes ilimitados, teleconsulta,
                receita digital, controle financeiro completo e IA Mentora.
              </>
            ) : status === "pending" ? (
              <>O Stripe ainda está liberando sua assinatura. Pode levar até 1 minuto.</>
            ) : (
              <>Validando seu pagamento com o Stripe… ({attempts + 1}/{MAX_ATTEMPTS})</>
            )}
          </p>
        </div>

        {status === "active" && (
          <>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Próximo passo: comece a subir seu SalbScore
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cada atendimento, recebimento e despesa registrada já alimenta seu histórico.
                Quanto antes você começar, mais maduro seu score quando o Comprovante de Renda
                Oficial entrar no ar (roadmap 2026).
              </p>
              <ul className="space-y-2 pt-1">
                {[
                  { icon: Calendar, label: "Cadastre seu primeiro paciente e marque uma consulta" },
                  { icon: DollarSign, label: "Lance seu primeiro recebimento no módulo financeiro" },
                  { icon: TrendingUp, label: "Confirme atendimentos realizados para validar histórico" },
                ].map((step) => (
                  <li key={step.label} className="flex items-start gap-2 text-xs text-foreground">
                    <step.icon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                    <span>{step.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => {
                  trackCtaClick("go_dashboard", "subscription_success");
                  navigate("/dashboard");
                }}
                className="w-full gradient-primary font-semibold gap-2"
                data-testid="sub-success-go-dashboard"
              >
                Ir para o Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => {
                  trackCtaClick("go_salbscore", "subscription_success");
                  navigate("/perfil/salbscore");
                }}
                variant="outline"
                className="w-full gap-2"
                data-testid="sub-success-go-salbscore"
              >
                Ver meu SalbScore
              </Button>
            </div>
          </>
        )}

        {status === "pending" && (
          <div className="space-y-2">
            <Button
              onClick={() => {
                setAttempts(0);
                void refreshSubscription();
              }}
              variant="outline"
              className="w-full gap-2"
            >
              <Loader2 className="h-4 w-4" />
              Verificar novamente
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              className="w-full gradient-primary"
            >
              Continuar para o Dashboard
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              Se persistir, fale com o suporte: WhatsApp (88) 99692-4700.
            </p>
          </div>
        )}

        {status === "confirming" && user && (
          <p className="text-[11px] text-center text-muted-foreground">
            Conta: {user.email}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default SubscriptionSuccess;
