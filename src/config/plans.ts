export const PLANS = {
  basic: {
    name: "Básico",
    price: 39,
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
    price: 79,
    price_id: "price_1TAILDBUEEEAHx2hUax01AKh",
    product_id: "prod_U8ZUsScx3u9Uyk",
    popular: true,
    features: [
      "Todos os recursos do Básico",
      "Relatórios financeiros em PDF",
      "Marketplace de contabilidade",
      "Marketplace jurídico",
    ],
  },
  clinic: {
    name: "Clínica",
    price: 149,
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
