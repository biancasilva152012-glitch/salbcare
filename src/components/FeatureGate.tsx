import { Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeatureGate, Feature } from "@/hooks/useFeatureGate";
import { PLANS } from "@/config/plans";
import { openVersionedSubscriptionRoute } from "@/utils/subscriptionNavigation";

interface FeatureGateProps {
  feature: Feature;
  children: React.ReactNode;
}

const PRO_BENEFITS = [
  "Acesso a contador especialista em saúde",
  "Emissão de NF-e 100% legal",
  "Declaração de Imposto de Renda",
];

const CLINIC_BENEFITS = [
  "Gestão de múltiplos profissionais",
  "Painel financeiro avançado",
  "Suporte prioritário e dedicado",
];

const FeatureGate = ({ feature, children }: FeatureGateProps) => {
  const { hasAccess, requiredPlan } = useFeatureGate();

  if (hasAccess(feature)) return <>{children}</>;

  const planKey = requiredPlan(feature);
  const plan = PLANS[planKey];
  const benefits = planKey === "clinic" ? CLINIC_BENEFITS : PRO_BENEFITS;

  return (
    <div className="flex flex-col items-center justify-center space-y-5 px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="max-w-xs space-y-2">
        <h2 className="text-lg font-bold">Disponível no plano {plan.name}</h2>
        <p className="text-sm text-muted-foreground">O que você ganha ao fazer upgrade:</p>
      </div>
      <ul className="w-full max-w-xs space-y-2 text-left">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2 text-sm">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button onClick={openVersionedSubscriptionRoute} className="w-full gradient-primary font-semibold">
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
