export const PLANS = {
  basic: {
    name: "Essencial",
    subtitle: "Comece a organizar sua prática",
    price: 49,
    price_id: "price_1TBcE4BUEEEAHx2hfOYZN30W",
    product_id: "prod_U9w63fgoL24Mi4",
    annual_price: 490,
    annual_price_id: "price_1TGKlBBUEEEAHx2hKvXbHuOz",
    annual_product_id: "prod_UEoNmf2THoTBES",
    features: [
      "Agenda inteligente de consultas",
      "Cadastro ilimitado de pacientes",
      "Teleconsulta integrada",
      "Controle financeiro básico",
      "Receita e Atestado Digital (PDF)",
      "Instruções para assinatura ICP-Brasil gratuita",
      "Você fica com 100% do valor das consultas",
    ],
    hasTrial: true,
  },
  professional: {
    name: "Profissional",
    subtitle: "Com acesso a contadores especializados em saúde",
    price: 99,
    price_id: "price_1TBcg4BUEEEAHx2hiJNr2qhu",
    product_id: "prod_U9wZ94gRJJq1HU",
    annual_price: 990,
    annual_price_id: "price_1TGKlcBUEEEAHx2hO8MT6Xu4",
    annual_product_id: "prod_UEoOm2A6OmaeQN",
    popular: true,
    features: [
      "Tudo do Essencial +",
      "Acesso a contador especialista em saúde",
      "Emissão de NF-e 100% legal pelo contador",
      "Abertura e gestão de CNPJ",
      "Declaração de Imposto de Renda",
      "Marketplace jurídico",
      "Você fica com 100% do valor das consultas",
    ],
  },
  clinic: {
    name: "Clínica",
    subtitle: "Para quem gerencia equipe e quer o máximo",
    price: 189,
    price_id: "price_1TBcgQBUEEEAHx2hwimX7ktu",
    product_id: "prod_U9wZAYvh6Gb6ct",
    annual_price: 1890,
    annual_price_id: "price_1TGKmJBUEEEAHx2hS9x2Jn7m",
    annual_product_id: "prod_UEoPdJuOeBi1gG",
    features: [
      "Tudo do Profissional +",
      "Gestão de múltiplos profissionais",
      "Painel financeiro avançado",
      "Suporte prioritário e dedicado",
      "Você fica com 100% do valor das consultas",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanByProductId(productId: string | null): PlanKey {
  if (!productId) return "basic";
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.product_id === productId || plan.annual_product_id === productId) return key as PlanKey;
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
