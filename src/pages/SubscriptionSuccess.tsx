import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Loader2, Clock, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { trackPurchase, trackCtaClick, trackUnified } from "@/hooks/useTracking";
import { PLANS, PlanKey } from "@/config/plans";

const MAX_ATTEMPTS = 6;
const SOURCE_KEY = "salbcare_checkout_source";
const PLAN_KEY = "salbcare_checkout_plan";

type Status = "confirming" | "active" | "pending";

/**
 * Resolve `plan` e `source` na seguinte ordem de prioridade:
 *   1) query string (ex: ?plan=basic&source=salbscore-hero)
 *   2) sessionStorage (sobrevive a F5 / volta do navegador depois do Stripe)
 *   3) defaults seguros ('basic' / 'direct')
 * Sempre que resolver via query, persiste em sessionStorage para
 * sobreviver a um refresh subsequente.
 */
function resolveCheckoutContext(qsPlan: string | null, qsSource: string | null) {
  let plan: PlanKey = "basic";
  if (qsPlan && qsPlan in PLANS) {
    plan = qsPlan as PlanKey;
  } else {
    const stored = sessionStorage.getItem(PLAN_KEY);
    if (stored && stored in PLANS) plan = stored as PlanKey;
  }

  let source = "direct";
  if (qsSource && qsSource.length > 0) {
    source = qsSource;
  } else {
    const stored = sessionStorage.getItem(SOURCE_KEY);
    if (stored && stored.length > 0) source = stored;
  }

  // Re-persiste para garantir reaproveitamento em refresh / navegação de volta.
  sessionStorage.setItem(PLAN_KEY, plan);
  sessionStorage.setItem(SOURCE_KEY, source);

  return { plan, source };
}

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSubscription, subscription, user } = useAuth();
  const [attempts, setAttempts] = useState(0);
  const [purchaseTracked, setPurchaseTracked] = useState(false);

  const { plan: planKey, source } = useMemo(
    () => resolveCheckoutContext(searchParams.get("plan"), searchParams.get("source")),
    [searchParams],
  );
  const plan = PLANS[planKey];
  const planValue = plan.price;

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

  // Dispara conversão uma única vez quando subscription confirmar.
  // Mesmo nome de evento (`subscription_confirmed`) em GA4 e Meta Pixel
  // via trackUnified para paridade 1:1.
  useEffect(() => {
    if (status === "active" && !purchaseTracked) {
      const purchasePayload = {
        plan: planKey,
        plan_name: plan.name,
        value: planValue,
        currency: "BRL",
        source,
      };
      // Conversão padrão GA Ads + fbq Purchase (com value correto do plano)
      trackPurchase(planValue);
      // Evento custom de funil unificado
      trackUnified("subscription_confirmed", purchasePayload);
      setPurchaseTracked(true);
      // Limpa storage só depois de disparar — assim sobrevive a refreshes
      // antes da confirmação.
      sessionStorage.removeItem("salbcare_from_checkout");
    }
  }, [status, purchaseTracked, planKey, planValue, plan.name, source]);

  // Estado de erro/pendente também é trackado — útil pra correlacionar
  // checkouts iniciados que não confirmam.
  useEffect(() => {
    if (status === "pending") {
      trackUnified("subscription_pending", {
        plan: planKey,
        plan_name: plan.name,
        value: planValue,
        currency: "BRL",
        source,
      });
    }
  }, [status, planKey, plan.name, planValue, source]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 max-w-lg w-full space-y-6"
        data-testid="subscription-success-card"
        data-status={status}
        data-plan={planKey}
        data-source={source}
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
              ? `Assinatura ${plan.name} confirmada!`
              : status === "pending"
              ? "Pagamento em processamento"
              : "Confirmando seu pagamento…"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {status === "active" ? (
              <>
                Bem-vindo ao plano <strong>{plan.name}</strong> — R$ {planValue}/mês.
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
                  trackCtaClick("go_dashboard", "subscription_success", { source, plan: planKey });
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
                  trackCtaClick("go_salbscore", "subscription_success", { source, plan: planKey });
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
