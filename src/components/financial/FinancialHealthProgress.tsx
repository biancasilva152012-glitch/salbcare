import { Lock, Check } from "lucide-react";
import type { FinancialHealthStep } from "@/hooks/useFinancialHealth";

interface Props {
  steps: FinancialHealthStep[];
  progressPercent: number;
  /** Disparado quando o usuário clica numa etapa premium bloqueada. */
  onPremiumStepClick: (stepId: string) => void;
}

/**
 * Barra de progresso "Saúde Financeira do seu consultório".
 * Renderiza 4 marcos sequenciais: cada concluído fica verde com check;
 * a etapa premium fica com cadeado e badge "Plano Essencial" e dispara
 * o modal de upgrade quando clicada.
 */
const FinancialHealthProgress = ({ steps, progressPercent, onPremiumStepClick }: Props) => {
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
                (locked
                  ? "hover:bg-accent/60 cursor-pointer"
                  : "")
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
    </section>
  );
};

export default FinancialHealthProgress;
