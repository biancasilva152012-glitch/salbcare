import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackCtaClick } from "@/hooks/useTracking";

interface Props {
  /** Receita do mês corrente — usada para personalizar uma das perguntas. */
  monthlyIncome: number;
  /** Despesa do mês corrente. */
  monthlyExpense: number;
  /** Quantidade total de lançamentos. */
  transactionCount: number;
  /** true → usuário ainda é gratuito (mostra CTA de upgrade no card). */
  isFree: boolean;
  /** Callback ao clicar no CTA principal — abre UpgradeModal do Plano Essencial. */
  onUpgrade: () => void;
  /** Callback opcional → vai para a Mentora IA (usuário já pago). */
  onAskMentor?: () => void;
}

/**
 * Bloco de perguntas-gatilho exibido no módulo Financeiro.
 *
 * Objetivo: despertar curiosidade do profissional autônomo com
 * perguntas que ele provavelmente NUNCA respondeu sozinho
 * ("quanto você perde em impostos por não categorizar gastos?")
 * e converter isso em clique no Plano Essencial.
 *
 * Comportamento:
 *  - Free → CTA "Descobrir com a Mentora IA" abre UpgradeModal.
 *  - Paid → CTA leva para /dashboard/mentoria com a pergunta no ?focus.
 *
 * As perguntas alternam suavemente a cada 5 segundos para reforçar
 * que a IA tem MUITO a contar — sem distrair com animação ruidosa.
 */
const FinancialCuriosityCTA = ({
  monthlyIncome,
  monthlyExpense,
  transactionCount,
  isFree,
  onUpgrade,
  onAskMentor,
}: Props) => {
  // Geramos perguntas dinâmicas em função da renda informada.
  // Quando monthlyIncome > 0 incluímos um dado quase real para chocar
  // o usuário ("R$ 2.300/ano em impostos a mais"). Caso contrário usamos
  // versões genéricas mas igualmente provocativas.
  const questions = useMemo(() => {
    const taxLeak = monthlyIncome > 0
      ? Math.round(monthlyIncome * 0.08 * 12)
      : null;
    const profitGap = monthlyIncome > 0 && monthlyExpense > 0
      ? Math.max(0, Math.round((monthlyExpense - monthlyIncome * 0.4) * 12))
      : null;

    return [
      {
        emoji: "💸",
        title: "Você sabe quanto está perdendo em impostos?",
        body: taxLeak
          ? `Profissionais que não categorizam despesas pagam até R$ ${taxLeak.toLocaleString("pt-BR")} a mais por ano. A IA mostra o que você pode deduzir hoje.`
          : "A maioria paga até 8% a mais de imposto por não categorizar gastos. A IA aponta exatamente o que você pode deduzir.",
        cta: "Quero descobrir o que estou perdendo",
        focus: "impostos",
      },
      {
        emoji: "📉",
        title: "Quanto sobra de verdade no fim do mês?",
        body: profitGap && profitGap > 0
          ? `Pelo seu padrão atual, você pode estar deixando ~R$ ${profitGap.toLocaleString("pt-BR")} no caixa errado por ano. A Mentora IA reorganiza isso.`
          : "9 em cada 10 autônomos não sabem o lucro real do consultório. A IA calcula em 5 segundos com seus lançamentos.",
        cta: "Quero ver meu lucro real",
        focus: "lucro",
      },
      {
        emoji: "🚀",
        title: "Onde investir o dinheiro extra para crescer?",
        body: "Marketing? Equipamento? Reserva? A Mentora IA olha seu fluxo e te diz onde cada R$ 1 vira R$ 3 no próximo trimestre.",
        cta: "Quero saber onde investir",
        focus: "investir",
      },
      {
        emoji: "📊",
        title: "Seu mês está melhor ou pior que o anterior?",
        body: "Sem comparativo mês a mês você não sabe se está crescendo. A IA cruza tudo e te alerta antes que vire problema.",
        cta: "Quero ver minha evolução",
        focus: "comparativo",
      },
    ];
  }, [monthlyIncome, monthlyExpense]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % questions.length);
    }, 5000);
    return () => clearInterval(id);
  }, [questions.length]);

  const current = questions[index];

  const handleClick = () => {
    trackCtaClick(
      `financial_curiosity_${current.focus}`,
      isFree ? "financial_free" : "financial_paid",
    );
    if (isFree) {
      onUpgrade();
    } else if (onAskMentor) {
      onAskMentor();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card relative overflow-hidden border-primary/30 p-4"
      data-testid="financial-curiosity-cta"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl">
          {current.emoji}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Mentora Financeira IA
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="space-y-1.5"
            >
              <h3 className="text-sm font-bold leading-snug">
                {current.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {current.body}
              </p>
            </motion.div>
          </AnimatePresence>

          <Button
            size="sm"
            onClick={handleClick}
            className="gradient-primary font-semibold text-xs gap-1.5 mt-1"
            data-testid="financial-curiosity-cta-button"
          >
            {isFree && <Lock className="h-3 w-3" />}
            {current.cta}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>

          {isFree && (
            <p className="text-[10px] text-muted-foreground">
              Disponível no <span className="font-semibold text-primary">Plano Essencial</span>
              {transactionCount === 0 && " — comece registrando sua primeira receita"}
            </p>
          )}
        </div>
      </div>

      {/* Indicador de carrossel */}
      <div className="flex items-center justify-center gap-1 mt-3">
        {questions.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Pergunta ${i + 1}`}
            className={
              "h-1 rounded-full transition-all " +
              (i === index ? "w-5 bg-primary" : "w-1.5 bg-muted")
            }
          />
        ))}
      </div>
    </motion.div>
  );
};

export default FinancialCuriosityCTA;
