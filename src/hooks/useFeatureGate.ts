import { useAuth } from "@/contexts/AuthContext";
import { PlanKey } from "@/config/plans";

// Single plan: basic (essencial)
const PLAN_LEVEL: Record<PlanKey, number> = {
  basic: 0,
};

export type Feature =
  | "pdf_export"
  | "accounting_marketplace"
  | "legal_marketplace"
  | "advanced_financial_dashboard"
  | "multi_professionals";

// All features available on the single plan
const FEATURE_MIN_PLAN: Record<Feature, PlanKey> = {
  pdf_export: "basic",
  accounting_marketplace: "basic",
  legal_marketplace: "basic",
  advanced_financial_dashboard: "basic",
  multi_professionals: "basic",
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
