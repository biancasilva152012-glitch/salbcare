export const PLANS = {
  basic: {
    name: "Essencial",
    subtitle: "Gestão completa da sua prática",
    price: 89,
    price_id: "price_1TLmdUBUEEEAHx2hR8nCDaMo",
    product_id: "prod_UKRW6Ltcfi3BEE",
    features: [
      "Agenda inteligente de consultas",
      "Cadastro ilimitado de pacientes",
      "Teleconsulta integrada",
      "Controle financeiro completo",
      "Receita e Atestado Digital (PDF)",
      "Instruções para assinatura ICP-Brasil gratuita",
      "Mentoria financeira com IA",
      "Perfil público e link de indicação",
      "Você fica com 100% do valor das consultas",
    ],
    hasTrial: true,
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
