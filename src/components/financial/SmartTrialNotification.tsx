import { Bell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  monthlyIncome: number;
  onUpgrade: () => void;
}

/**
 * Notificação persistente exibida 7 dias após o trial vencer (sem
 * conversão) para usuários com pelo menos 5 lançamentos. Personaliza
 * a mensagem com a receita real do mês para criar conexão imediata.
 *
 * A condição "trial vencido + ≥5 lançamentos" é controlada pelo
 * componente pai — aqui só renderizamos o card.
 */
const SmartTrialNotification = ({ monthlyIncome, onUpgrade }: Props) => {
  const formatted = monthlyIncome.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <section
      className="glass-card border-primary/30 bg-primary/5 p-4 space-y-3"
      data-testid="smart-trial-notification"
      aria-label="Análise pós-trial da Mentora IA"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
          <Bell className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Análise da IA disponível
          </p>
          <p className="text-sm font-medium leading-snug mt-0.5">
            Você registrou{" "}
            <span
              className="text-primary font-bold"
              data-testid="smart-trial-monthly-income"
            >
              R$ {formatted}
            </span>{" "}
            em receitas este mês.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Quer saber onde está perdendo dinheiro e como pagar menos imposto?
          </p>
        </div>
      </div>

      <Button
        size="sm"
        onClick={onUpgrade}
        className="w-full gradient-primary font-semibold text-xs gap-1.5"
        data-testid="smart-trial-cta"
      >
        Ver análise da IA
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </section>
  );
};

export default SmartTrialNotification;
