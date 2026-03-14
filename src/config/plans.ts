export const PLANS = {
  basic: {
    name: "Essencial",
    subtitle: "Comece a organizar sua prática",
    price: 49,
    price_id: "price_1TAIKjBUEEEAHx2hMtUIiKI9",
    product_id: "prod_U8ZTOS9bhmXXsd",
    features: [
      "Agenda inteligente de consultas",
      "Cadastro ilimitado de pacientes",
      "Teleconsulta integrada",
      "Controle financeiro básico",
      "7 dias grátis para testar",
    ],
  },
  professional: {
    name: "Profissional",
    subtitle: "Assessoria contábil inclusa — o plano que ninguém mais oferece",
    price: 99,
    price_id: "price_1TAILDBUEEEAHx2hUax01AKh",
    product_id: "prod_U8ZUsScx3u9Uyk",
    popular: true,
    features: [
      "Tudo do Essencial +",
      "Contador especialista em saúde incluso",
      "Emissão de NF-e 100% legal pelo contador",
      "Abertura e gestão de CNPJ",
      "Declaração de Imposto de Renda",
      "Enquadramento tributário otimizado",
      "Relatórios financeiros em PDF",
      "Marketplace jurídico",
      "7 dias grátis para testar",
    ],
  },
  clinic: {
    name: "Clínica",
    subtitle: "Para quem gerencia equipe e quer o máximo",
    price: 189,
    price_id: "price_1TAILaBUEEEAHx2hpX5ekogA",
    product_id: "prod_U8ZU7fGeFAqwdu",
    features: [
      "Tudo do Profissional +",
      "Gestão de múltiplos profissionais",
      "Dashboard financeiro avançado",
      "Suporte prioritário e dedicado",
      "7 dias grátis para testar",
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
