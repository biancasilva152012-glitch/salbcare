import { Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeatureGate, Feature } from "@/hooks/useFeatureGate";
import { PLANS, PlanKey } from "@/config/plans";
import { useNavigate } from "react-router-dom";

interface FeatureGateProps {
  feature: Feature;
  children: React.ReactNode;
}

const PRO_BENEFITS = [
  "Contador especialista em saúde incluso",
  "Emissão de NF-e 100% legal",
  "Declaração de Imposto de Renda",
];

const CLINIC_BENEFITS = [
  "Gestão de múltiplos profissionais",
  "Dashboard financeiro avançado",
  "Suporte prioritário e dedicado",
];

const FeatureGate = ({ feature, children }: FeatureGateProps) => {
  const { hasAccess, requiredPlan } = useFeatureGate();
  const navigate = useNavigate();

  if (hasAccess(feature)) return <>{children}</>;

  const planKey = requiredPlan(feature);
  const plan = PLANS[planKey];
  const benefits = planKey === "clinic" ? CLINIC_BENEFITS : PRO_BENEFITS;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-5">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2 max-w-xs">
        <h2 className="text-lg font-bold">
          Disponível no plano {plan.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          O que você ganha ao fazer upgrade:
        </p>
      </div>
      <ul className="space-y-2 text-left max-w-xs w-full">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <Button onClick={() => navigate("/subscription")} className="w-full gradient-primary font-semibold">
          Ver plano {plan.name} — R$ {plan.price}/mês
        </Button>
        <Button onClick={() => window.history.back()} variant="ghost" className="w-full text-muted-foreground">
          Agora não
        </Button>
      </div>
    </div>
  );
};

export default FeatureGate;
