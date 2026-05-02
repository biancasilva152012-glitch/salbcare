import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trackCtaClick } from "@/hooks/useTracking";

const GOAL_KEY = "salbcare_financial_goal";

type Goal =
  | "reduce_expenses"
  | "increase_profit"
  | "tax_optimization"
  | "evaluate_cnpj";

type Range = "under_3k" | "3k_8k" | "8k_20k" | "over_20k";

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: "reduce_expenses", label: "Reduzir despesas" },
  { value: "increase_profit", label: "Aumentar lucro" },
  { value: "tax_optimization", label: "Organizar imposto" },
  { value: "evaluate_cnpj", label: "Saber se vale CNPJ" },
];

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "under_3k", label: "Até R$ 3.000/mês" },
  { value: "3k_8k", label: "R$ 3.000 — R$ 8.000" },
  { value: "8k_20k", label: "R$ 8.000 — R$ 20.000" },
  { value: "over_20k", label: "Acima de R$ 20.000" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Mini-questionário de diagnóstico financeiro disparado pelo banner do
 * dashboard. Coleta o objetivo e a faixa de faturamento do profissional,
 * gera 2-3 insights pré-escritos baseados na combinação dessas duas
 * variáveis e só então leva o usuário para `/dashboard/financial` com
 * o formulário pré-preenchido para a primeira receita.
 *
 * Persiste o objetivo escolhido em localStorage (`salbcare_financial_goal`)
 * para que a Mentora IA possa usar como contexto no futuro.
 *
 * Tracking: `diagnosis_started` ao abrir, `diagnosis_completed` ao
 * concluir — o `cta_location` carrega o objetivo escolhido para podermos
 * segmentar campanhas no GA4/Meta.
 */
const FinancialDiagnosisModal = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [range, setRange] = useState<Range | null>(null);

  const reset = () => {
    setStep(1);
    setGoal(null);
    setRange(null);
  };

  const handleClose = () => {
    onClose();
    // Damos um respiro para a animação fechar antes de resetar.
    setTimeout(reset, 200);
  };

  const insights = generateInsights(goal, range);

  const handleFinish = () => {
    if (goal) {
      try {
        localStorage.setItem(GOAL_KEY, goal);
      } catch {
        /* ignore */
      }
    }
    trackCtaClick("diagnosis_completed", goal || "unknown");
    handleClose();
    navigate(
      "/dashboard/financial?onboarding=diagnosis&type=income&autoOpen=1",
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
        else trackCtaClick("diagnosis_started", "dashboard");
      }}
    >
      <DialogContent
        className="max-w-sm p-0 overflow-hidden border-primary/20"
        data-testid="financial-diagnosis-modal"
      >
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 px-6 pt-6 pb-4 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-base">
              {step === 3
                ? "Seu diagnóstico preliminar"
                : "Diagnóstico financeiro gratuito"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-[11px] text-muted-foreground mt-1">
            {step === 3
              ? "Veja o que a Mentora IA já consegue te dizer"
              : `Etapa ${step} de 2 — leva menos de 30 segundos`}
          </p>
        </div>

        <div className="px-6 py-4 space-y-3 min-h-[220px]">
          {step === 1 && (
            <div role="radiogroup" aria-label="Objetivo financeiro" className="space-y-2">
              <p className="text-xs font-semibold mb-2">
                Qual seu maior objetivo financeiro agora?
              </p>
              {GOAL_OPTIONS.map((opt) => {
                const selected = goal === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setGoal(opt.value)}
                    data-testid={`diagnosis-goal-${opt.value}`}
                    className={
                      "w-full flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-left " +
                      (selected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40")
                    }
                  >
                    <span
                      className={
                        "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 " +
                        (selected ? "border-primary" : "border-muted-foreground/40")
                      }
                    >
                      {selected && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div role="radiogroup" aria-label="Faixa de faturamento" className="space-y-2">
              <p className="text-xs font-semibold mb-2">
                Quanto você fatura por mês hoje?
              </p>
              {RANGE_OPTIONS.map((opt) => {
                const selected = range === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setRange(opt.value)}
                    data-testid={`diagnosis-range-${opt.value}`}
                    className={
                      "w-full flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-left " +
                      (selected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40")
                    }
                  >
                    <span
                      className={
                        "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 " +
                        (selected ? "border-primary" : "border-muted-foreground/40")
                      }
                    >
                      {selected && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <ul className="space-y-2.5" data-testid="diagnosis-insights">
              {insights.map((insight, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/15 p-3"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-2">
          {step > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              className="gap-1"
              data-testid="diagnosis-back"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar
            </Button>
          )}
          {step === 1 && (
            <Button
              onClick={() => setStep(2)}
              disabled={!goal}
              className="ml-auto gradient-primary font-semibold gap-1"
              data-testid="diagnosis-next"
            >
              Continuar
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {step === 2 && (
            <Button
              onClick={() => setStep(3)}
              disabled={!range}
              className="ml-auto gradient-primary font-semibold gap-1"
              data-testid="diagnosis-next"
            >
              Ver diagnóstico
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {step === 3 && (
            <Button
              onClick={handleFinish}
              className="ml-auto gradient-primary font-semibold gap-1"
              data-testid="diagnosis-finish"
            >
              Continuar para meus lançamentos
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Gera 2-3 frases curtas de diagnóstico baseadas na combinação
 * objetivo × faixa. As mensagens são pré-escritas (sem chamada à IA)
 * para responder instantaneamente — a Mentora IA real entra no passo
 * seguinte, depois que o usuário registra o primeiro lançamento.
 */
function generateInsights(goal: Goal | null, range: Range | null): string[] {
  if (!goal || !range) {
    return [
      "Selecione suas respostas para ver um diagnóstico preliminar.",
    ];
  }

  const base: string[] = [];

  if (goal === "reduce_expenses") {
    base.push(
      "Profissionais que registram cada despesa cortam em média 22% dos custos no primeiro trimestre.",
    );
  } else if (goal === "increase_profit") {
    base.push(
      "Conhecer seu ticket médio é o primeiro passo: vamos começar registrando suas receitas.",
    );
  } else if (goal === "tax_optimization") {
    base.push(
      "Sem registro de receita não dá para calcular imposto certinho. Vamos por aqui primeiro.",
    );
  } else if (goal === "evaluate_cnpj") {
    base.push(
      "A análise CNPJ vs PF precisa do seu faturamento real registrado por 30 dias para fazer sentido.",
    );
  }

  if (range === "under_3k") {
    base.push(
      "Na sua faixa, o foco deve ser virar a chave de pessoa física para mais previsibilidade — começa registrando.",
    );
  } else if (range === "3k_8k") {
    base.push(
      "Quem fatura nessa faixa e controla as finanças cresce em média 35% no primeiro semestre.",
    );
  } else if (range === "8k_20k") {
    base.push(
      "Nessa faixa, vale comparar regimes (Simples vs PF). A Mentora IA faz a conta pra você.",
    );
  } else if (range === "over_20k") {
    base.push(
      "Faturamento alto sem CNPJ pode estar pagando 2-3x mais imposto do que precisa.",
    );
  }

  base.push(
    "Vamos começar pelo seu primeiro lançamento de receita — em 30 segundos a IA já tem o que analisar.",
  );

  return base;
}

export default FinancialDiagnosisModal;
