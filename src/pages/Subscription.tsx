import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Zap, Building2, Loader2, ExternalLink, ShieldCheck, TrendingDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, PlanKey } from "@/config/plans";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";

const planIcons: Record<PlanKey, typeof Zap> = {
  basic: Zap,
  professional: Crown,
  clinic: Building2,
};

const Subscription = () => {
  const { subscription, refreshSubscription } = useAuth();
  const navigate = useNavigate();
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
    <PageContainer>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Planos SALBCARE</h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Gestão completa para profissionais de saúde. A SALBCARE conecta você a contadores especializados em saúde.
          </p>
        </div>

        {/* Value proposition banner */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm font-semibold">Contadores especializados em saúde</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nos planos Profissional e Clínica, conectamos você a contadores parceiros com experiência no setor de saúde.{" "}
            <span className="text-foreground font-medium">Sem precisar procurar por conta própria</span> — a gente facilita tudo para você.
          </p>
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
              <ExternalLink className="h-3.5 w-3.5" /> Gerenciar meu plano
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
                      <div className="mt-0.5">
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

                {/* Disclaimer for plans with accounting */}
                {(key === "professional" || key === "clinic") && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/50 border border-border">
                    <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                     <p className="text-[11px] text-muted-foreground leading-relaxed">
                       Assessoria contábil realizada por contadores parceiros independentes com CRC ativo. A SALBCARE conecta você ao profissional certo para facilitar sua vida.
                     </p>
                  </div>
                )}

                {isCurrentPlan ? (
                  <Button disabled className="w-full" variant="outline">
                    Plano Atual
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/checkout?plan=${key}`)}
                      className="flex-1 gradient-primary font-semibold"
                    >
                      Pagar com PIX
                    </Button>
                    <Button
                      onClick={() => handleCheckout(key)}
                      variant="outline"
                      className="flex-1 font-semibold"
                      disabled={loadingPlan === key}
                    >
                      {loadingPlan === key ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Cartão de Crédito"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>

        <p className="text-center text-[11px] text-muted-foreground pb-4">
          Todos os planos incluem 7 dias grátis. Cancele quando quiser, sem multa.
        </p>
      </div>
    </PageContainer>
  );
};

export default Subscription;
