import { motion } from "framer-motion";
import { TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onAddIncome: () => void;
  onLearnAboutAI: () => void;
}

/**
 * Empty state motivacional do módulo financeiro. Substitui o
 * EmptyState genérico para criar tração emocional usando dado
 * setorial ("40% mais no segundo ano") + dois CTAs:
 *  1. primário: cadastrar a primeira receita
 *  2. secundário: abrir modal explicativo da Mentora IA
 */
const FinancialEmptyState = ({ onAddIncome, onLearnAboutAI }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-5"
      data-testid="financial-empty-state"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <TrendingUp className="h-8 w-8 text-primary" />
      </div>

      <div className="space-y-2 max-w-xs">
        <h3 className="text-base font-semibold">
          Seu consultório merece gestão de verdade
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Profissionais que controlam as finanças ganham em média{" "}
          <span className="font-semibold text-foreground">40% mais</span>{" "}
          no segundo ano. Comece registrando sua primeira receita agora.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 w-full max-w-xs">
        <Button
          onClick={onAddIncome}
          className="w-full gradient-primary font-semibold"
          data-testid="financial-empty-add-income"
        >
          Registrar minha primeira receita
        </Button>
        <button
          type="button"
          onClick={onLearnAboutAI}
          className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
          data-testid="financial-empty-learn-ai"
        >
          <Sparkles className="h-3 w-3" />
          Ver como a IA me ajuda
        </button>
      </div>
    </motion.div>
  );
};

export default FinancialEmptyState;
