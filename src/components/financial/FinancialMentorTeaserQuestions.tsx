import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Lock, ArrowRight, TrendingDown, TrendingUp, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackCtaClick } from "@/hooks/useTracking";

interface Props {
  monthlyIncome: number;
  monthlyExpense: number;
  /** Sempre verdadeiro neste bloco — o componente só deve ser montado para free. */
  isFree: boolean;
  onUpgrade: () => void;
}

interface Question {
  id: string;
  emoji: string;
  question: string;
  /**
   * Calcula o impacto financeiro estimado a partir da receita/despesa do mês.
   * Retorna `{ value, label, hint }`. Se não houver dados suficientes, devolve
   * um exemplo educativo para manter a curiosidade.
   */
  estimate: (income: number, expense: number) => { value: string; label: string; hint: string };
}

const QUESTIONS: Question[] = [
  {
    id: "tax_leak",
    emoji: "💸",
    question: "Quanto você está pagando de imposto a mais?",
    estimate: (income) => {
      const monthly = income > 0 ? income * 0.08 : 480;
      return {
        value: `R$ ${Math.round(monthly).toLocaleString("pt-BR")}/mês`,
        label: "Estimativa de imposto evitável",
        hint: income > 0
          ? "Categorizando despesas dedutíveis você pode reduzir até 8% do faturamento."
          : "Cenário típico de quem fatura entre R$ 5–8k/mês sem categorizar gastos.",
      };
    },
  },
  {
    id: "real_profit",
    emoji: "📊",
    question: "Quanto sobra de verdade no fim do mês?",
    estimate: (income, expense) => {
      const profit = Math.max(income - expense, 0);
      const target = Math.max(income * 0.4, 0);
      const gap = Math.max(target - profit, 0);
      return {
        value: gap > 0
          ? `R$ ${Math.round(gap).toLocaleString("pt-BR")} de lucro a recuperar`
          : `R$ ${Math.round(profit).toLocaleString("pt-BR")} de lucro este mês`,
        label: "Lucro real x meta saudável (40%)",
        hint: "A IA mapeia gasto a gasto e mostra onde o dinheiro está vazando.",
      };
    },
  },
  {
    id: "growth",
    emoji: "🚀",
    question: "Onde investir o que sobrou para crescer?",
    estimate: (income) => {
      const surplus = income > 0 ? income * 0.2 : 800;
      return {
        value: `R$ ${Math.round(surplus).toLocaleString("pt-BR")} disponíveis`,
        label: "Margem que pode virar marketing/equipamento",
        hint: "A Mentora indica 3 destinos com maior retorno em 90 dias.",
      };
    },
  },
];

/**
 * Bloco de perguntas estratégicas exibido na aba Financeiro para usuários
 * gratuitos. Cada pergunta revela um *resumo* de impacto financeiro estimado
 * (lock parcial) e uma CTA explícita para destravar a Mentora IA via Plano
 * Essencial — ou seja, o usuário "prova" o valor antes de pagar.
 */
const FinancialMentorTeaserQuestions = ({
  monthlyIncome,
  monthlyExpense,
  isFree,
  onUpgrade,
}: Props) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const computed = useMemo(
    () =>
      QUESTIONS.map((q) => ({
        ...q,
        impact: q.estimate(monthlyIncome, monthlyExpense),
      })),
    [monthlyIncome, monthlyExpense],
  );

  if (!isFree) return null;

  const handleReveal = (id: string) => {
    trackCtaClick(`financial_teaser_reveal_${id}`, "financial");
    setOpenId((curr) => (curr === id ? null : id));
  };

  const handleUnlock = (id: string) => {
    trackCtaClick(`financial_teaser_unlock_${id}`, "financial");
    onUpgrade();
  };

  return (
    <section
      className="glass-card p-4 space-y-3 border-primary/30"
      data-testid="financial-mentor-teaser"
      aria-label="Perguntas estratégicas da Mentora IA"
    >
      <header className="flex items-center gap-2">
        <Calculator className="h-4 w-4 text-primary" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Mentora IA · Perguntas que pagam o plano
          </p>
          <h3 className="text-sm font-bold leading-snug">
            Toque em uma pergunta para ver seu impacto estimado
          </h3>
        </div>
      </header>

      <ul className="space-y-2">
        {computed.map((q) => {
          const isOpen = openId === q.id;
          return (
            <li key={q.id} className="rounded-lg border border-border bg-background/40">
              <button
                type="button"
                onClick={() => handleReveal(q.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent/40 rounded-lg transition-colors"
              >
                <span className="text-base shrink-0">{q.emoji}</span>
                <span className="flex-1 text-xs font-medium leading-snug">
                  {q.question}
                </span>
                <ArrowRight
                  className={"h-3.5 w-3.5 text-muted-foreground transition-transform " + (isOpen ? "rotate-90" : "")}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-1 space-y-2">
                      <div className="rounded-md bg-primary/5 px-3 py-2 border border-primary/20">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {q.impact.label}
                        </p>
                        <p className="text-base font-bold text-primary inline-flex items-center gap-1">
                          {q.id === "tax_leak" || q.id === "real_profit" ? (
                            <TrendingDown className="h-3.5 w-3.5" />
                          ) : (
                            <TrendingUp className="h-3.5 w-3.5" />
                          )}
                          {q.impact.value}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                          {q.impact.hint}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleUnlock(q.id)}
                        className="w-full gradient-primary font-semibold text-xs gap-1.5"
                      >
                        <Lock className="h-3 w-3" />
                        Destravar análise completa com a Mentora IA
                        <Sparkles className="h-3 w-3" />
                      </Button>
                      <p className="text-[10px] text-center text-muted-foreground">
                        Disponível no <span className="font-semibold text-primary">Plano Essencial</span>
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default FinancialMentorTeaserQuestions;
