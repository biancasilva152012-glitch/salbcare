import { motion } from "framer-motion";
import { LogOut, User, CreditCard, ChevronRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const plans = [
  { name: "Básico", price: "R$ 39", features: ["Agenda", "Pacientes", "Telehealth", "Financeiro básico"], id: "basic" },
  { name: "Profissional", price: "R$ 79", features: ["Tudo do Básico", "Relatórios financeiros", "Contabilidade", "Suporte jurídico"], id: "professional" },
  { name: "Clínica", price: "R$ 149", features: ["Múltiplos profissionais", "Dashboard avançado", "Suporte prioritário"], id: "clinic" },
];

const professionalTypeLabels: Record<string, string> = {
  medico: "Médico(a)",
  dentista: "Dentista",
  psicologo: "Psicólogo(a)",
  fisioterapeuta: "Fisioterapeuta",
  nutricionista: "Nutricionista",
  outro: "Outro",
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showPlans, setShowPlans] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full gradient-primary">
            <User className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">{profile?.name || "Profissional"}</h1>
          <p className="text-sm text-muted-foreground">
            {professionalTypeLabels[profile?.professional_type || ""] || profile?.professional_type} • Plano {plans.find(p => p.id === profile?.plan)?.name || "Básico"}
          </p>
        </div>

        <div className="space-y-2">
          <div className="glass-card p-3 text-sm">
            <span className="text-muted-foreground">Email:</span> {profile?.email || user?.email}
          </div>
          <div className="glass-card p-3 text-sm">
            <span className="text-muted-foreground">Telefone:</span> {profile?.phone || "Não informado"}
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
            {plans.map((plan) => {
              const isCurrent = profile?.plan === plan.id;
              return (
                <div key={plan.name} className={`glass-card p-4 space-y-2 ${isCurrent ? "border-primary/50" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{plan.name}</h3>
                      <span className="text-lg font-bold text-primary">{plan.price}<span className="text-xs text-muted-foreground font-normal">/mês</span></span>
                    </div>
                    {isCurrent && <span className="rounded-full gradient-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">Atual</span>}
                  </div>
                  <ul className="space-y-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-primary" /> {f}
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && (
                    <Button size="sm" variant="outline" className="w-full mt-1 border-border text-foreground">
                      Mudar para {plan.name}
                    </Button>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        <Button onClick={handleLogout} variant="outline" className="w-full border-border text-destructive gap-2">
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </div>
    </PageContainer>
  );
};

export default Profile;
