import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeatureGate, Feature } from "@/hooks/useFeatureGate";
import { PLANS, PlanKey } from "@/config/plans";
import { useNavigate } from "react-router-dom";

interface FeatureGateProps {
  feature: Feature;
  children: React.ReactNode;
}

const FeatureGate = ({ feature, children }: FeatureGateProps) => {
  const { hasAccess, requiredPlan } = useFeatureGate();
  const navigate = useNavigate();

  if (hasAccess(feature)) return <>{children}</>;

  const plan = PLANS[requiredPlan(feature)];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-bold">Recurso Premium</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        Este recurso está disponível a partir do plano{" "}
        <span className="font-semibold text-primary">{plan.name}</span>.
        Faça upgrade para desbloquear.
      </p>
      <Button onClick={() => navigate("/subscription")} className="gradient-primary">
        Ver Planos
      </Button>
    </div>
  );
};

export default FeatureGate;
