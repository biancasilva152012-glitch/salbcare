/**
 * Centraliza a derivação visual do status da assinatura Plus,
 * para que Profile, UpgradeModal e Upgrade compartilhem a mesma fonte.
 */

export type SubscriptionStatusKind =
  | "active"        // assinatura paga em dia
  | "trial"         // dentro do período de teste (legado — trial removido para novos)
  | "pending"       // pagamento aguardando confirmação (boleto, pix, análise)
  | "past_due"      // cobrança recorrente falhou
  | "canceled"      // assinatura cancelada manualmente / pelo Stripe
  | "expired"       // expirou sem renovação
  | "free";         // nunca assinou — plano gratuito

export interface SubscriptionStatusInfo {
  kind: SubscriptionStatusKind;
  label: string;
  description: string;
  /** Tailwind classes already mapped to design tokens. */
  badgeClass: string;
  ctaLabel: string;
  /** True quando o usuário tem acesso pleno ao Plus agora. */
  isActive: boolean;
}

interface DeriveInput {
  paymentStatus?: string | null;
  trialDaysRemaining?: number;
  subscribed?: boolean;
}

export function deriveSubscriptionStatus({
  paymentStatus,
  trialDaysRemaining = 0,
  subscribed = false,
}: DeriveInput): SubscriptionStatusInfo {
  const status = (paymentStatus || "").toLowerCase();

  if (status === "active" || subscribed) {
    return {
      kind: "active",
      label: "Plus ativo",
      description: "Sua assinatura está em dia. Aproveite todos os recursos.",
      badgeClass: "bg-success/10 text-success",
      ctaLabel: "Gerenciar assinatura",
      isActive: true,
    };
  }

  if (trialDaysRemaining > 0) {
    return {
      kind: "trial",
      label: `Teste grátis — ${trialDaysRemaining} ${trialDaysRemaining === 1 ? "dia restante" : "dias restantes"}`,
      description: "Você está no período de teste. Ative o Plus para não perder acesso.",
      badgeClass: "bg-primary/10 text-primary",
      ctaLabel: "Virar Plus agora",
      isActive: true,
    };
  }

  if (
    status === "pending" ||
    status === "pending_approval" ||
    status === "processing" ||
    status === "incomplete"
  ) {
    return {
      kind: "pending",
      label: "Pagamento pendente",
      description: "Seu pagamento está em análise. Pode levar até 1 dia útil para confirmar.",
      badgeClass: "bg-yellow-400/10 text-yellow-500 dark:text-yellow-400",
      ctaLabel: "Acompanhar pagamento",
      isActive: false,
    };
  }

  if (status === "past_due") {
    return {
      kind: "past_due",
      label: "Pagamento em atraso",
      description: "Não conseguimos cobrar sua última fatura. Atualize a forma de pagamento.",
      badgeClass: "bg-orange-500/10 text-orange-500 dark:text-orange-400",
      ctaLabel: "Atualizar pagamento",
      isActive: false,
    };
  }

  if (status === "canceled" || status === "cancelled") {
    return {
      kind: "canceled",
      label: "Assinatura cancelada",
      description: "Sua assinatura Plus foi cancelada. Reative quando quiser.",
      badgeClass: "bg-destructive/10 text-destructive",
      ctaLabel: "Reativar Plus",
      isActive: false,
    };
  }

  if (status === "expired") {
    return {
      kind: "expired",
      label: "Assinatura expirada",
      description: "Seu acesso Plus expirou. Renove para voltar a usar tudo.",
      badgeClass: "bg-destructive/10 text-destructive",
      ctaLabel: "Renovar Plus",
      isActive: false,
    };
  }

  return {
    kind: "free",
    label: "Plano gratuito",
    description: "Você está no plano gratuito com limites mensais.",
    badgeClass: "bg-muted text-muted-foreground",
    ctaLabel: "Virar Plus por R$ 89/mês",
    isActive: false,
  };
}
