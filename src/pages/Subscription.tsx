import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Zap, Building2, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, PlanKey } from "@/config/plans";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

const planIcons: Record<PlanKey, typeof Zap> = {
  basic: Zap,
  professional: Crown,
  clinic: Building2,
};

const Subscription = () => {
  const { subscription, refreshSubscription } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Assinatura realizada com sucesso!");
      refreshSubscription();
    } else if (searchParams.get("canceled") === "true") {
      toast.info("Assinatura cancelada.");
    }
  }, [searchParams, refreshSubscription]);

  const handleCheckout = async (planKey: PlanKey) => {
    setLoadingPlan(planKey);
    try {
      const plan = PLANS[planKey];
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: plan.price_id },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Erro ao iniciar checkout");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Erro ao abrir portal");
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Planos SalbCare</h1>
          <p className="text-sm text-muted-foreground mt-1">Escolha o plano ideal para sua prática</p>
        </div>

        {subscription.subscribed && (
          <div className="glass-card p-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Seu plano atual</p>
            <p className="text-lg font-bold text-primary">{PLANS[subscription.plan].name}</p>
            {subscription.subscriptionEnd && (
              <p className="text-xs text-muted-foreground">
                Renova em {new Date(subscription.subscriptionEnd).toLocaleDateString("pt-BR")}
              </p>
            )}
            <Button onClick={handleManage} variant="outline" size="sm" className="gap-1">
              <ExternalLink className="h-3.5 w-3.5" /> Gerenciar Assinatura
            </Button>
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, plan]) => {
            const Icon = planIcons[key];
            const isCurrentPlan = subscription.subscribed && subscription.plan === key;
            const isPopular = "popular" in plan && plan.popular;

            return (
              <div
                key={key}
                className={`glass-card p-5 space-y-4 relative ${isCurrentPlan ? "ring-2 ring-primary" : ""} ${isPopular ? "ring-2 ring-secondary" : ""}`}
              >
                {isCurrentPlan && (
                  <span className="absolute -top-2.5 left-4 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Seu Plano
                  </span>
                )}
                {isPopular && !isCurrentPlan && (
                  <span className="absolute -top-2.5 left-4 text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold">{plan.name}</h3>
                      <div>
                        <span className="text-2xl font-bold text-primary">R$ {plan.price}</span>
                        <span className="text-xs text-muted-foreground">/mês</span>
                      </div>
                    </div>
                  </div>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <Button disabled className="w-full" variant="outline">
                    Plano Atual
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleCheckout(key)}
                    className="w-full gradient-primary font-semibold"
                    disabled={!!loadingPlan}
                  >
                    {loadingPlan === key ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
                    ) : (
                      "Assinar"
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>
    </PageContainer>
  );
};

export default Subscription;
