import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackCtaClick } from "@/hooks/useTracking";
import type { FinancialHealthState } from "@/hooks/useFinancialHealth";
import { useFinancialSuggestions } from "@/hooks/useFinancialSuggestions";

const DISMISS_KEY = "salbcare_financial_onboarding_dismissed";

interface Props {
  health: FinancialHealthState;
  /** Disparado quando o usuário clica em "Ver minha Mentora IA" no resumo. */
  onOpenMentor: () => void;
}

/**
 * Wizard guiado de 3 passos no Dashboard. Substitui o
 * FinancialDiagnosisBanner durante o período em que o profissional
 * ainda está completando a jornada inicial (sem receita / sem despesa).
 *
 *  Passo 1 — Receita  : `transactionCount === 0`
 *  Passo 2 — Despesa  : tem receita, ainda não tem gasto fixo
 *  Passo 3 — Resumo   : tem receita + gasto fixo (ainda não dispensou)
 *
 * Cada CTA navega para `/dashboard/financial` com query params que
 * pré-preenchem o formulário e abrem o Dialog automaticamente.
 *
 * Tracking: `financial_onboarding_step_X` por etapa visualizada,
 * `financial_onboarding_completed` ao finalizar (clique em "Mentora IA"
 * ou "Concluir").
 */
const FinancialOnboardingWizard = ({ health, onOpenMentor }: Props) => {
  const navigate = useNavigate();
  const suggestions = useFinancialSuggestions();
  const [dismissed, setDismissed] = useState(false);
  const step = health.onboardingStep ?? 3;

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  // Telemetria: cada vez que o usuário visualiza um novo passo
  // dispara um evento dedicado para podermos medir funil de ativação.
  useEffect(() => {
    if (dismissed) return;
    trackCtaClick(`financial_onboarding_step_${step}`, "dashboard");
  }, [step, dismissed]);

  if (dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const handleAddIncome = () => {
    trackCtaClick("financial_onboarding_add_income", "dashboard");
    // Passamos type, category sugerida e uma descrição padrão para que o
    // formulário abra praticamente pronto — basta digitar o valor.
    const params = new URLSearchParams({
      onboarding: "1",
      type: "income",
      category: "consulta",
      description: "Consulta particular",
      autoOpen: "1",
    });
    navigate(`/dashboard/financial?${params.toString()}`);
  };

  const handleAddExpense = () => {
    trackCtaClick("financial_onboarding_add_expense", "dashboard");
    const params = new URLSearchParams({
      onboarding: "2",
      type: "expense",
      category: "aluguel",
      description: "Aluguel do consultório",
      autoOpen: "1",
    });
    navigate(`/dashboard/financial?${params.toString()}`);
  };

  const handleFinish = () => {
    trackCtaClick("financial_onboarding_completed", "dashboard");
    handleDismiss();
    onOpenMentor();
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card relative overflow-hidden border-primary/30 p-4 space-y-3"
      data-testid="financial-onboarding-wizard"
      aria-label={`Onboarding financeiro - passo ${step} de 3`}
    >
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Pular onboarding"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1"
        data-testid="financial-onboarding-skip"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Passos numerados */}
      <ol className="flex items-center gap-1.5" aria-label="Progresso">
        {[1, 2, 3].map((n) => {
          const isDone = n < step;
          const isCurrent = n === step;
          return (
            <li
              key={n}
              className="flex-1 flex items-center gap-1.5"
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold " +
                  (isDone
                    ? "bg-success/20 text-success"
                    : isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground")
                }
              >
                {isDone ? <CheckCircle2 className="h-3 w-3" /> : n}
              </span>
              <div
                className={
                  "h-1 flex-1 rounded-full " +
                  (isDone ? "bg-success/40" : "bg-muted")
                }
                aria-hidden="true"
              />
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <div className="space-y-2 pr-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Passo 1 de 3
          </p>
          <h2 className="text-sm font-bold leading-snug">
            Vamos começar pelo que você ganha
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Registre uma consulta ou recebimento. A Mentora IA já começa
            a entender seu potencial.
          </p>
          <Button
            size="sm"
            onClick={handleAddIncome}
            className="gradient-primary font-semibold text-xs gap-1.5 mt-1"
            data-testid="financial-onboarding-cta-income"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Adicionar receita
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2 pr-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Passo 2 de 3
          </p>
          <h2 className="text-sm font-bold leading-snug">
            Agora seus custos fixos
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Aluguel, marketing, equipamento... Com isso a IA calcula seu{" "}
            <span className="font-semibold text-foreground">
              lucro real
            </span>
            .
          </p>
          <Button
            size="sm"
            onClick={handleAddExpense}
            className="gradient-primary font-semibold text-xs gap-1.5 mt-1"
            data-testid="financial-onboarding-cta-expense"
          >
            <TrendingDown className="h-3.5 w-3.5" />
            Adicionar gasto fixo
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2 pr-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Passo 3 de 3 — Saúde Financeira
          </p>
          <h2 className="text-sm font-bold leading-snug">
            Pronto! Esse é seu mês até agora
          </h2>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-success/10 px-2 py-1.5 text-center">
              <p className="text-[9px] text-muted-foreground uppercase">
                Receitas
              </p>
              <p className="text-xs font-bold text-success">
                R$ {health.monthlyIncome.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="rounded-lg bg-destructive/10 px-2 py-1.5 text-center">
              <p className="text-[9px] text-muted-foreground uppercase">
                Despesas
              </p>
              <p className="text-xs font-bold text-destructive">
                R$ {health.monthlyExpense.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="rounded-lg bg-primary/10 px-2 py-1.5 text-center">
              <p className="text-[9px] text-muted-foreground uppercase">
                Lucro
              </p>
              <p className="text-xs font-bold text-primary">
                R$ {health.monthlyProfit.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            <Sparkles className="inline h-3 w-3 text-primary mr-1" />
            A Mentora IA já consegue te dizer onde melhorar. Quer ouvir?
          </p>

          <Button
            size="sm"
            onClick={handleFinish}
            className="gradient-primary font-semibold text-xs gap-1.5 mt-1"
            data-testid="financial-onboarding-cta-mentor"
          >
            Ver minha Mentora IA
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </motion.section>
  );
};

export default FinancialOnboardingWizard;
