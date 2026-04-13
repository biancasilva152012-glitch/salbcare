import { Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeatureGate, Feature } from "@/hooks/useFeatureGate";
import { PLANS } from "@/config/plans";
import { openVersionedSubscriptionRoute } from "@/utils/subscriptionNavigation";
import { isAdminEmail } from "@/config/admin";
import { useAuth } from "@/contexts/AuthContext";

interface FeatureGateProps {
  feature: Feature;
  children: React.ReactNode;
}

const PLAN_BENEFITS = [
  "Agenda inteligente de consultas",
  "Teleconsulta integrada",
  "Controle financeiro completo",
  "Mentoria financeira com IA",
];

const FeatureGate = ({ feature, children }: FeatureGateProps) => {
  const { hasAccess, requiredPlan } = useFeatureGate();
  const { user } = useAuth();

  if (isAdminEmail(user?.email)) return <>{children}</>;
  if (hasAccess(feature)) return <>{children}</>;

  const plan = PLANS.basic;

  return (
    <div className="flex flex-col items-center justify-center space-y-5 px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="max-w-xs space-y-2">
        <h2 className="text-lg font-bold">Disponível no plano {plan.name}</h2>
        <p className="text-sm text-muted-foreground">O que você ganha ao assinar:</p>
      </div>
      <ul className="w-full max-w-xs space-y-2 text-left">
        {PLAN_BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2 text-sm">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button onClick={openVersionedSubscriptionRoute} className="w-full gradient-primary font-semibold">
          Assinar {plan.name} — R$ {plan.price}/mês
        </Button>
        <Button onClick={() => window.history.back()} variant="ghost" className="w-full text-muted-foreground">
          Agora não
        </Button>
      </div>
    </div>
  );
};

export default FeatureGate;
