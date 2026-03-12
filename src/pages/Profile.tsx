import { motion } from "framer-motion";
import { LogOut, User, CreditCard, ChevronRight, HeartPulse, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";
import { useState } from "react";

const plans = [
  { name: "Básico", price: "R$ 39", features: ["Agenda", "Pacientes", "Telehealth", "Financeiro básico"], current: false },
  { name: "Profissional", price: "R$ 79", features: ["Tudo do Básico", "Relatórios financeiros", "Contabilidade", "Suporte jurídico"], current: true },
  { name: "Clínica", price: "R$ 149", features: ["Múltiplos profissionais", "Dashboard avançado", "Suporte prioritário"], current: false },
];

const Profile = () => {
  const navigate = useNavigate();
  const [showPlans, setShowPlans] = useState(false);

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full gradient-primary">
            <User className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Dr. João Silva</h1>
          <p className="text-sm text-muted-foreground">Médico • Plano Profissional</p>
        </div>

        <div className="space-y-2">
          <div className="glass-card p-3 text-sm">
            <span className="text-muted-foreground">Email:</span> joao.silva@email.com
          </div>
          <div className="glass-card p-3 text-sm">
            <span className="text-muted-foreground">Telefone:</span> (11) 99999-9999
          </div>
        </div>

        <button onClick={() => setShowPlans(!showPlans)} className="glass-card flex w-full items-center justify-between p-3 text-left">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Planos e Assinatura</span>
          </div>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showPlans ? "rotate-90" : ""}`} />
        </button>

        {showPlans && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
            {plans.map((plan) => (
              <div key={plan.name} className={`glass-card p-4 space-y-2 ${plan.current ? "border-primary/50" : ""}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{plan.name}</h3>
                    <span className="text-lg font-bold text-primary">{plan.price}<span className="text-xs text-muted-foreground font-normal">/mês</span></span>
                  </div>
                  {plan.current && <span className="rounded-full gradient-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">Atual</span>}
                </div>
                <ul className="space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                {!plan.current && (
                  <Button size="sm" variant="outline" className="w-full mt-1 border-border text-foreground">
                    Mudar para {plan.name}
                  </Button>
                )}
              </div>
            ))}
          </motion.div>
        )}

        <Button onClick={() => navigate("/login")} variant="outline" className="w-full border-border text-destructive gap-2">
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </div>
    </PageContainer>
  );
};

export default Profile;
