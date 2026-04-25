import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * Categorias consideradas "gasto fixo" para fins de progresso da
 * jornada de saúde financeira. Mantemos a lista pequena e óbvia para
 * que o profissional reconheça a etapa quando registrar despesas
 * recorrentes do consultório.
 */
const FIXED_EXPENSE_CATEGORIES = new Set([
  "aluguel",
  "salario",
  "equipamento",
  "marketing",
]);

export type FinancialHealthStepId =
  | "first_income"
  | "first_fixed_expense"
  | "one_month_history"
  | "ai_analysis";

export interface FinancialHealthStep {
  id: FinancialHealthStepId;
  label: string;
  done: boolean;
  /** true = só desbloqueia no Plano Essencial. */
  premium?: boolean;
}

export interface MentorUnlocks {
  /** Visão consolidada do mês — desbloqueia com a primeira receita. */
  monthlyView: boolean;
  /** Projeção 3 meses — desbloqueia com receita + 1 gasto fixo. */
  projection: boolean;
  /** Recomendações personalizadas — ≥5 lançamentos. */
  recommendations: boolean;
}

export interface FinancialHealthState {
  isLoading: boolean;
  /** Total de lançamentos (qualquer tipo). */
  transactionCount: number;
  /** Total de receitas no mês corrente (R$). */
  monthlyIncome: number;
  /** Total de despesas no mês corrente (R$). */
  monthlyExpense: number;
  /** Lucro líquido do mês corrente (income - expense, R$). */
  monthlyProfit: number;
  /** true se o usuário não tem nenhum lançamento ainda. */
  isEmpty: boolean;
  /** true após cadastrar pelo menos 3 lançamentos. */
  hasMinimumForPreview: boolean;
  /** true se atingiu pelo menos 5 lançamentos. */
  hasMinimumForSmartNotification: boolean;
  /** Progresso 0..100 das 4 etapas. */
  progressPercent: number;
  steps: FinancialHealthStep[];
  /** true quando o trial acabou e o usuário ainda não converteu. */
  trialExpiredNotConverted: boolean;
  /** Análises da Mentora IA destravadas progressivamente. */
  mentorUnlocks: MentorUnlocks;
  /** Etapa atual do wizard (1, 2, 3 ou null se já concluiu). */
  onboardingStep: 1 | 2 | 3 | null;
}

export function useFinancialHealth(): FinancialHealthState {
  const { user } = useAuth();
  const subscription = useSubscription();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["financial-health", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("financial_transactions")
        .select("id, amount, type, date, category")
        .eq("user_id", user!.id)
        .order("date", { ascending: true })
        .limit(500);
      return data || [];
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  return useMemo(() => {
    const transactionCount = rows.length;
    const isEmpty = transactionCount === 0;

    const incomeRows = rows.filter((t) => t.type === "income");
    const expenseRows = rows.filter((t) => t.type === "expense");

    const hasFirstIncome = incomeRows.length > 0;
    const hasFirstFixedExpense = expenseRows.some((t) =>
      FIXED_EXPENSE_CATEGORIES.has(String(t.category || "").toLowerCase()),
    );

    // 1 mês de histórico = primeiro lançamento foi há ≥ 30 dias.
    const earliest = rows[0]?.date ? new Date(rows[0].date) : null;
    const hasOneMonthHistory =
      !!earliest &&
      Date.now() - earliest.getTime() >= 30 * 24 * 60 * 60 * 1000;

    // Etapa 4 só "fica verde" se o usuário é pago (acesso à mentoria
    // ilimitada). Para free/trial, fica como locked premium.
    const aiUnlocked = subscription.isActive && !subscription.isTrialing;

    const steps: FinancialHealthStep[] = [
      { id: "first_income", label: "Registre sua primeira receita", done: hasFirstIncome },
      { id: "first_fixed_expense", label: "Registre seu primeiro gasto fixo", done: hasFirstFixedExpense },
      { id: "one_month_history", label: "Complete 1 mês de lançamentos", done: hasOneMonthHistory },
      { id: "ai_analysis", label: "Deixe a IA analisar seu perfil", done: aiUnlocked, premium: true },
    ];

    const completed = steps.filter((s) => s.done).length;
    const progressPercent = Math.round((completed / steps.length) * 100);

    // Receita / despesa do mês corrente (alimenta cards e Mentora IA).
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthlyIncome = incomeRows
      .filter((t) => String(t.date).startsWith(monthKey))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const monthlyExpense = expenseRows
      .filter((t) => String(t.date).startsWith(monthKey))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const monthlyProfit = monthlyIncome - monthlyExpense;

    const trialExpiredNotConverted =
      !subscription.isLoading &&
      subscription.trialExpired &&
      !subscription.isActive;

    // Desbloqueio progressivo da Mentora IA. Cada nível de análise
    // libera quando o usuário cumpre as pré-condições mínimas para
    // que a resposta seja útil (não vamos liberar projeção sem ter
    // pelo menos uma despesa para projetar custo).
    const mentorUnlocks: MentorUnlocks = {
      monthlyView: hasFirstIncome,
      projection: hasFirstIncome && hasFirstFixedExpense,
      recommendations: transactionCount >= 5,
    };

    // Próxima etapa do wizard (1 = receita, 2 = gasto fixo, 3 = resumo).
    let onboardingStep: 1 | 2 | 3 | null;
    if (!hasFirstIncome) onboardingStep = 1;
    else if (!hasFirstFixedExpense) onboardingStep = 2;
    else onboardingStep = 3;

    return {
      isLoading: isLoading || subscription.isLoading,
      transactionCount,
      monthlyIncome,
      monthlyExpense,
      monthlyProfit,
      isEmpty,
      hasMinimumForPreview: transactionCount >= 3,
      hasMinimumForSmartNotification: transactionCount >= 5,
      progressPercent,
      steps,
      trialExpiredNotConverted,
      mentorUnlocks,
      onboardingStep,
    };
  }, [rows, isLoading, subscription]);
}
