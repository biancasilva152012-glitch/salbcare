import { Lock, Check, TrendingUp, TrendingDown, BarChart3, LineChart, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { trackCtaClick } from "@/hooks/useTracking";
import type {
  FinancialHealthStep,
  MentorUnlocks,
} from "@/hooks/useFinancialHealth";

interface Props {
  steps: FinancialHealthStep[];
  progressPercent: number;
  /** Disparado quando o usuário clica numa etapa premium bloqueada. */
  onPremiumStepClick: (stepId: string) => void;
  /** Estado atual de desbloqueio das análises da Mentora IA. */
  mentorUnlocks?: MentorUnlocks;
}

/**
 * Barra de progresso "Saúde Financeira do seu consultório".
 * Renderiza 4 marcos sequenciais: cada concluído fica verde com check;
 * a etapa premium fica com cadeado e badge "Plano Essencial" e dispara
 * o modal de upgrade quando clicada.
 *
 * Embaixo dos steps mostramos:
 *  - CTAs contextuais "+ Adicionar receita" / "+ Adicionar gasto fixo"
 *    enquanto a etapa correspondente estiver pendente. Cada CTA leva
 *    para o módulo financeiro com o formulário pré-preenchido e aberto
 *    automaticamente (?type=...&autoOpen=1).
 *  - Pílulas de desbloqueio progressivo da Mentora IA: visão mensal,
 *    projeção e recomendações. As destravadas viram clicáveis e levam
 *    para a Mentora com `?focus=...`. As locked mostram cadeado e a
 *    pré-condição como tooltip/aria-label.
 */
const FinancialHealthProgress = ({
  steps,
  progressPercent,
  onPremiumStepClick,
  mentorUnlocks,
}: Props) => {
  const navigate = useNavigate();

  const stepDone = (id: string) =>
    !!steps.find((s) => s.id === id)?.done;
  const hasFirstIncome = stepDone("first_income");
  const hasFirstFixedExpense = stepDone("first_fixed_expense");

  const handleAddIncome = () => {
    trackCtaClick("financial_health_add_income", "dashboard");
    navigate("/dashboard/financial?type=income&autoOpen=1");
  };

  const handleAddExpense = () => {
    trackCtaClick("financial_health_add_expense", "dashboard");
    navigate(
      "/dashboard/financial?type=expense&category=aluguel&autoOpen=1",
    );
  };

  const goToMentor = (focus: "monthly" | "projection" | "recommendations") => {
    trackCtaClick(`mentor_unlock_${focus}`, "dashboard");
    navigate(`/dashboard/mentoria?focus=${focus}`);
  };

  return (
    <section
      className="glass-card p-4 space-y-3"
      data-testid="financial-health-progress"
      aria-label="Saúde financeira do seu consultório"
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Saúde Financeira do seu consultório
        </p>
        <span className="text-[11px] font-semibold text-primary tabular-nums">
          {progressPercent}%
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
          aria-hidden="true"
        />
      </div>

      <ol className="space-y-2 mt-1" aria-label="Etapas de saúde financeira">
        {steps.map((step) => {
          const locked = !!step.premium && !step.done;
          const Item = locked ? "button" : "div";
          return (
            <Item
              key={step.id}
              type={locked ? "button" : undefined}
              onClick={locked ? () => onPremiumStepClick(step.id) : undefined}
              data-testid={`financial-health-step-${step.id}`}
              data-step-done={step.done ? "true" : "false"}
              data-step-locked={locked ? "true" : "false"}
              className={
                "flex w-full items-center gap-2.5 text-left rounded-lg px-2 py-1.5 transition-colors " +
                (locked ? "hover:bg-accent/60 cursor-pointer" : "")
              }
            >
              <span
                className={
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold " +
                  (step.done
                    ? "bg-success/15 text-success"
                    : locked
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground")
                }
                aria-hidden="true"
              >
                {step.done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : locked ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  ""
                )}
              </span>
              <span
                className={
                  "text-xs flex-1 " +
                  (step.done ? "text-success font-medium" : "text-foreground")
                }
              >
                {step.label}
              </span>
              {step.premium && !step.done && (
                <span className="shrink-0 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                  Plano Essencial
                </span>
              )}
            </Item>
          );
        })}
      </ol>

      {/* CTAs contextuais por etapa */}
      {(!hasFirstIncome || !hasFirstFixedExpense) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {!hasFirstIncome && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddIncome}
              className="text-[11px] h-8 gap-1 border-primary/30 text-primary hover:bg-primary/10"
              data-testid="financial-health-cta-income"
            >
              <TrendingUp className="h-3 w-3" />
              Adicionar receita
            </Button>
          )}
          {hasFirstIncome && !hasFirstFixedExpense && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddExpense}
              className="text-[11px] h-8 gap-1 border-primary/30 text-primary hover:bg-primary/10"
              data-testid="financial-health-cta-expense"
            >
              <TrendingDown className="h-3 w-3" />
              Adicionar gasto fixo
            </Button>
          )}
        </div>
      )}

      {/* Pílulas de desbloqueio progressivo da Mentora IA */}
      {mentorUnlocks && (
        <div
          className="pt-2 border-t border-border/40"
          aria-label="Análises destravadas da Mentora IA"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Mentora IA — análises
          </p>
          <div className="flex flex-wrap gap-1.5">
            <UnlockPill
              icon={BarChart3}
              label="Visão mensal"
              unlocked={mentorUnlocks.monthlyView}
              hint="Registre uma receita para destravar"
              onClick={() => goToMentor("monthly")}
            />
            <UnlockPill
              icon={LineChart}
              label="Projeção 3 meses"
              unlocked={mentorUnlocks.projection}
              hint="Receita + gasto fixo destravam"
              onClick={() => goToMentor("projection")}
            />
            <UnlockPill
              icon={Lightbulb}
              label="Recomendações"
              unlocked={mentorUnlocks.recommendations}
              hint="Continue lançando (≥5 transações)"
              onClick={() => goToMentor("recommendations")}
            />
          </div>
        </div>
      )}
    </section>
  );
};

interface PillProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  unlocked: boolean;
  hint: string;
  onClick: () => void;
}

const UnlockPill = ({ icon: Icon, label, unlocked, hint, onClick }: PillProps) => (
  <button
    type="button"
    onClick={unlocked ? onClick : undefined}
    aria-disabled={!unlocked}
    title={unlocked ? `Abrir ${label} na Mentora IA` : hint}
    className={
      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors " +
      (unlocked
        ? "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
        : "bg-muted text-muted-foreground cursor-not-allowed")
    }
    data-testid={`mentor-unlock-${label.toLowerCase().replace(/\s+/g, "-")}`}
    data-unlocked={unlocked ? "true" : "false"}
  >
    {unlocked ? (
      <Icon className="h-3 w-3" />
    ) : (
      <Lock className="h-3 w-3" />
    )}
    {label}
  </button>
);

export default FinancialHealthProgress;
