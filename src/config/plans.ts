export const PLANS = {
  basic: {
    name: "Básico",
    price: 49,
    price_id: "price_1TAIKjBUEEEAHx2hMtUIiKI9",
    product_id: "prod_U8ZTOS9bhmXXsd",
    features: [
      "Agenda de consultas",
      "Cadastro de pacientes",
      "Teleconsulta",
      "Controle financeiro básico",
    ],
  },
  professional: {
    name: "Profissional",
    subtitle: "Com Contador",
    price: 99,
    price_id: "price_1TAILDBUEEEAHx2hUax01AKh",
    product_id: "prod_U8ZUsScx3u9Uyk",
    popular: true,
    features: [
      "Todos os recursos do Básico",
      "Relatórios financeiros em PDF",
      "Gestão de CNPJ e NF pelo contador",
      "Marketplace jurídico",
    ],
  },
  clinic: {
    name: "Premium",
    price: 189,
    price_id: "price_1TAILaBUEEEAHx2hpX5ekogA",
    product_id: "prod_U8ZU7fGeFAqwdu",
    features: [
      "Todos os recursos do Profissional",
      "Múltiplos profissionais",
      "Dashboard financeiro avançado",
      "Suporte prioritário",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanByProductId(productId: string | null): PlanKey {
  if (!productId) return "basic";
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.product_id === productId) return key as PlanKey;
  }
  return "basic";
}

export function getTrialDaysRemaining(trialStartDate: string | null): number {
  if (!trialStartDate) return 0;
  const start = new Date(trialStartDate);
  const now = new Date();
  const diff = 7 - Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function isTrialActive(trialStartDate: string | null): boolean {
  return getTrialDaysRemaining(trialStartDate) > 0;
}
