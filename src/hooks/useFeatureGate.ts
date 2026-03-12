import { useAuth } from "@/contexts/AuthContext";
import { PlanKey } from "@/config/plans";

// Plan hierarchy: basic < professional < clinic
const PLAN_LEVEL: Record<PlanKey, number> = {
  basic: 0,
  professional: 1,
  clinic: 2,
};

export type Feature =
  | "pdf_export"
  | "accounting_marketplace"
  | "legal_marketplace"
  | "advanced_financial_dashboard"
  | "multi_professionals";

const FEATURE_MIN_PLAN: Record<Feature, PlanKey> = {
  pdf_export: "professional",
  accounting_marketplace: "professional",
  legal_marketplace: "professional",
  advanced_financial_dashboard: "clinic",
  multi_professionals: "clinic",
};

export function useFeatureGate() {
  const { subscription } = useAuth();
  const currentPlan = subscription.plan;

  const hasAccess = (feature: Feature): boolean => {
    return PLAN_LEVEL[currentPlan] >= PLAN_LEVEL[FEATURE_MIN_PLAN[feature]];
  };

  const requiredPlan = (feature: Feature): PlanKey => FEATURE_MIN_PLAN[feature];

  return { hasAccess, requiredPlan, currentPlan };
}
