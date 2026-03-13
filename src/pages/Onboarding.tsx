import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, PlanKey } from "@/config/plans";
import { motion } from "framer-motion";
import { Check, Crown, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const planIcons: Record<PlanKey, typeof Star> = {
  basic: Star,
  professional: Crown,
  clinic: Sparkles,
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selecting, setSelecting] = useState<PlanKey | null>(null);

  const handleSelectPlan = async (planKey: PlanKey) => {
    if (!user) return;
    setSelecting(planKey);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          plan: planKey,
          trial_start_date: new Date().toISOString(),
          payment_status: "trial",
        })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Plano ativado com 7 dias grátis!");
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSelecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 px-4 py-8 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold mb-2">Escolha seu Plano</h1>
          <p className="text-muted-foreground text-sm">
            Todos os planos incluem <span className="text-primary font-semibold">7 dias de teste grátis</span>
          </p>
        </motion.div>

        <div className="space-y-4">
          {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, plan], i) => {
            const Icon = planIcons[key];
            const isPopular = "popular" in plan && plan.popular;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card p-5 relative overflow-hidden ${
                  isPopular ? "ring-2 ring-primary" : ""
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                    MAIS POPULAR
                  </div>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isPopular ? "bg-primary/20" : "bg-accent"
                  }`}>
                    <Icon className={`h-5 w-5 ${isPopular ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {plan.name}
                      {"subtitle" in plan && (
                        <span className="text-xs text-primary ml-1.5 font-normal">({(plan as any).subtitle})</span>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground">7 dias grátis</p>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-xl font-bold">R$ {plan.price}</span>
                    <span className="text-xs text-muted-foreground">/mês</span>
                  </div>
                </div>

                <ul className="space-y-1.5 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(key)}
                  disabled={selecting !== null}
                  className={`w-full font-semibold ${isPopular ? "gradient-primary" : ""}`}
                  variant={isPopular ? "default" : "outline"}
                >
                  {selecting === key ? "Ativando..." : "Começar teste grátis"}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
