import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Zap, Building2, Loader2, ExternalLink, ShieldCheck, Info, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, PlanKey } from "@/config/plans";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

const planIcons: Record<PlanKey, typeof Zap> = {
  basic: Zap,
  professional: Crown,
  clinic: Building2,
};

const annualPrices: Record<string, { monthly: number; originalMonthly: number; savings: number }> = {
  basic: { monthly: 39, originalMonthly: 49, savings: 118 },
  professional: { monthly: 79, originalMonthly: 99, savings: 238 },
  clinic: { monthly: 151, originalMonthly: 189, savings: 454 },
};

const Subscription = () => {
  const { subscription, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Assinatura realizada com sucesso!");
      refreshSubscription();
      navigate("/sucesso", { replace: true });
    } else if (searchParams.get("canceled") === "true") {
      toast.info("Assinatura cancelada.");
      navigate("/cancelado", { replace: true });
    }
  }, [searchParams, refreshSubscription, navigate]);

  const handleCheckout = async (planKey: PlanKey) => {
    setLoadingPlan(planKey);
    try {
      const plan = PLANS[planKey];
      const priceId = isAnnual ? plan.annual_price_id : plan.price_id;
      const billingPeriod = isAnnual ? "annual" : "monthly";

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, billingPeriod },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Ocorreu um erro. Tente novamente ou fale com o suporte.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Ocorreu um erro. Tente novamente ou fale com o suporte.");
    }
  };

  return (
    <PageContainer backTo="/profile">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Planos SalbCare</h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Gestão completa para profissionais de saúde.
          </p>
        </div>

        {/* Toggle Mensal / Anual */}
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-4 py-2 rounded-l-xl text-sm font-semibold transition-colors ${!isAnnual ? "gradient-primary text-primary-foreground" : "bg-accent text-muted-foreground"}`}
          >
            Mensal
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-4 py-2 rounded-r-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${isAnnual ? "gradient-primary text-primary-foreground" : "bg-accent text-muted-foreground"}`}
          >
            Anual
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isAnnual ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"}`}>
              -20%
            </span>
          </button>
        </div>

        {/* Value proposition banner */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm font-semibold">Contadores especializados em saúde</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nos planos Profissional e Clínica, conectamos você a contadores parceiros com experiência no setor de saúde.
          </p>
        </div>

        {/* Trial banner */}
        {!subscription.subscribed && subscription.trialDaysRemaining > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card ring-1 ring-primary/30 p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Período de teste gratuito</p>
                <p className="text-xs text-muted-foreground">
                  Você ainda tem{" "}
                  <span className="font-bold text-primary">
                    {subscription.trialDaysRemaining} {subscription.trialDaysRemaining === 1 ? "dia" : "dias"}
                  </span>{" "}
                  restantes
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Active subscription management */}
        {subscription.subscribed && subscription.paymentStatus === "active" && (
          <div className="glass-card p-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Seu plano atual</p>
            <p className="text-lg font-bold text-primary">{PLANS[subscription.plan].name}</p>
            {subscription.subscriptionEnd && (
              <p className="text-xs text-muted-foreground">
                Renova em {new Date(subscription.subscriptionEnd).toLocaleDateString("pt-BR")}
              </p>
            )}
            <Button onClick={handleManage} variant="outline" size="sm" className="gap-1">
              <ExternalLink className="h-3.5 w-3.5" /> Gerenciar assinatura
            </Button>
          </div>
        )}

        {/* Plan cards */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, plan]) => {
            const Icon = planIcons[key];
            const isCurrentPlan = subscription.subscribed && subscription.plan === key;
            const isPopular = "popular" in plan && plan.popular;
            const annual = annualPrices[key];

            return (
              <div
                key={key}
                className={`glass-card p-5 space-y-4 relative ${isCurrentPlan ? "ring-2 ring-primary" : ""} ${isPopular && !isCurrentPlan ? "ring-2 ring-secondary" : ""}`}
              >
                {isCurrentPlan && (
                  <span className="absolute -top-2.5 left-4 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Seu Plano
                  </span>
                )}
                {isPopular && !isCurrentPlan && (
                  <span className="absolute -top-2.5 left-4 text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                    Mais Escolhido
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold">{plan.name}</h3>
                      {"subtitle" in plan && (
                        <p className="text-[11px] text-muted-foreground max-w-[200px]">{plan.subtitle as string}</p>
                      )}
                      <AnimatePresence mode="wait">
                        {isAnnual ? (
                          <motion.div
                            key="annual"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25 }}
                            className="mt-0.5"
                          >
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-primary">R$ {annual.monthly}</span>
                              <span className="text-xs text-muted-foreground">/mês</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground line-through">R$ {annual.originalMonthly}</span>
                              <span className="text-[10px] font-semibold text-primary">Economize R$ {annual.savings}/ano</span>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="monthly"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25 }}
                            className="mt-0.5 flex items-baseline gap-1"
                          >
                            <span className="text-2xl font-bold text-primary">R$ {plan.price}</span>
                            <span className="text-xs text-muted-foreground">/mês</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="shrink-0 mt-0.5">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {(key === "professional" || key === "clinic") && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/50 border border-border">
                    <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Assessoria contábil realizada por contadores parceiros independentes com CRC ativo.
                    </p>
                  </div>
                )}

                {isCurrentPlan ? (
                  <Button disabled className="w-full" variant="outline">
                    Plano Atual
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleCheckout(key)}
                    className="w-full gradient-primary font-semibold"
                    disabled={loadingPlan === key}
                  >
                    {loadingPlan === key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      (plan as any).hasTrial ? "Começar 7 dias grátis" : "Assinar agora"
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </motion.div>

        <p className="text-center text-[11px] text-muted-foreground pb-4">
          Cancele quando quiser, sem multa. Pagamento seguro via Stripe.
        </p>
      </div>
    </PageContainer>
  );
};

export default Subscription;
