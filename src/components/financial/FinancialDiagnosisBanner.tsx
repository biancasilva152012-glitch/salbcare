import { motion } from "framer-motion";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import FinancialDiagnosisModal from "./FinancialDiagnosisModal";
import { trackCtaClick } from "@/hooks/useTracking";

const DISMISS_KEY = "salbcare_financial_diagnosis_banner_dismissed";

interface Props {
  /** Quando true, esconde o banner (ex.: usuário já tem lançamentos). */
  hidden: boolean;
}

/**
 * Banner de topo do dashboard que convida o profissional autônomo a
 * iniciar o diagnóstico financeiro. Some assim que ele cadastra a
 * primeira transação (controle externo via prop `hidden`).
 *
 * O CTA agora abre o `FinancialDiagnosisModal` (mini-questionário com
 * objetivo + faixa) em vez de navegar direto. Só depois do diagnóstico
 * preliminar é que o usuário cai em /dashboard/financial.
 *
 * Persistimos um flag de dismiss em localStorage para respeitar a
 * decisão do usuário entre sessões — o banner só volta se ele zerar
 * o storage ou se reativarmos a campanha.
 */
const FinancialDiagnosisBanner = ({ hidden }: Props) => {
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  if (hidden || dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const handleStart = () => {
    trackCtaClick("financial_diagnosis_open", "dashboard_banner");
    setModalOpen(true);
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-4"
        data-testid="financial-diagnosis-banner"
        aria-label="Diagnóstico financeiro"
      >
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dispensar banner de diagnóstico"
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-start gap-3 pr-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold leading-snug">
                Você sabe quanto está ganhando de verdade?
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Profissionais autônomos perdem em média{" "}
                <span className="font-semibold text-foreground">R$ 480/mês</span>{" "}
                por falta de controle financeiro.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleStart}
              className="gradient-primary font-semibold text-xs gap-1.5"
              data-testid="financial-diagnosis-cta"
            >
              Fazer meu diagnóstico gratuito
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </motion.section>
      <FinancialDiagnosisModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default FinancialDiagnosisBanner;
