export type SalbScoreCheckStatus = "pending" | "ok" | "warn" | "fail";

export const SALBSCORE_STATUS_LABELS: Record<SalbScoreCheckStatus, string> = {
  pending: "verificando",
  ok: "ok",
  warn: "atenção",
  fail: "falha",
};

export const SALBSCORE_STATUS_CLASSES: Record<SalbScoreCheckStatus, string> = {
  pending: "border-border bg-muted text-muted-foreground",
  ok: "border-primary/20 bg-primary/10 text-primary",
  warn: "border-accent/30 bg-accent/10 text-accent-foreground",
  fail: "border-destructive/20 bg-destructive/10 text-destructive",
};

export const SALBSCORE_ACTION_MESSAGES = {
  upgradeRequired: {
    title: "atenção: plano Essencial necessário",
    description: "Faça upgrade para liberar essa ação com segurança.",
    cta: "Fazer upgrade para Essencial",
  },
  insufficientData: {
    title: "atenção: dados insuficientes",
    description: "Registre pelo menos 1 mês de atividade e recebimentos no financeiro.",
    cta: "Abrir financeiro",
  },
  diagnostic: {
    title: "falha: não foi possível concluir a ação",
    description: "Abra o diagnóstico para ver a causa e o próximo passo.",
    cta: "Abrir diagnóstico",
  },
  readOnly: {
    title: "falha: página somente leitura",
    description: "O Selo Verificado Público apenas exibe dados validados; nenhuma alteração é permitida por essa URL.",
  },
} as const;

export const normalizeSalbScoreStatus = (status: string | null | undefined): SalbScoreCheckStatus => {
  if (status === "ok" || status === "warn" || status === "fail" || status === "pending") return status;
  if (status === "warning" || status === "atenção") return "warn";
  if (status === "falha" || status === "error") return "fail";
  return "warn";
};