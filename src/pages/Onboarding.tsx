import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, PlanKey } from "@/config/plans";
import { motion } from "framer-motion";
import { Check, Crown, Star, Sparkles, Calculator, FileText, ShieldCheck } from "lucide-react";
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
    } catch {
      toast.error("Ocorreu um erro. Tente novamente ou fale com o suporte.");
    } finally {
      setSelecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 px-4 py-8 max-w-lg mx-auto w-full">
        {/* Value proposition header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl font-bold mb-2">Foque nos pacientes. A gente resolve o resto.</h1>
          <p className="text-muted-foreground text-sm">
            Gestão + assessoria contábil pelo <span className="text-primary font-semibold">menor preço do mercado</span>
          </p>
        </motion.div>

        {/* Key differentials */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2 mb-6"
        >
          <div className="glass-card p-3 text-center space-y-1.5">
            <Calculator className="h-5 w-5 text-primary mx-auto" />
            <p className="text-[10px] font-medium leading-tight">Acesso a contador parceiro</p>
          </div>
          <div className="glass-card p-3 text-center space-y-1.5">
            <FileText className="h-5 w-5 text-primary mx-auto" />
            <p className="text-[10px] font-medium leading-tight">NF e CNPJ sem burocracia</p>
          </div>
          <div className="glass-card p-3 text-center space-y-1.5">
            <ShieldCheck className="h-5 w-5 text-primary mx-auto" />
            <p className="text-[10px] font-medium leading-tight">IR e tributos resolvidos</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-5"
        >
          <p className="text-xs text-muted-foreground">
            Plano Essencial com <span className="text-primary font-semibold">7 dias grátis</span> • Cancele quando quiser
          </p>
        </motion.div>

        {/* Plans */}
        <div className="space-y-4">
          {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, plan], i) => {
            const Icon = planIcons[key];
            const isPopular = "popular" in plan && plan.popular;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={`glass-card p-5 relative overflow-hidden ${
                  isPopular ? "ring-2 ring-primary" : ""
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                    RECOMENDADO
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
                    <p className="text-xs text-muted-foreground">{key === "basic" ? "7 dias grátis para testar" : "Acesso imediato"}</p>
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
                  {selecting === key ? "Ativando..." : key === "basic" ? "Começar grátis agora" : "Assinar agora"}
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
