import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, PiggyBank, Calculator } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Disparado quando o usuário clica em "Quero a Mentora IA". */
  onUpgrade: () => void;
}

/**
 * Modal explicativo da Mentora IA — usado como CTA secundário do
 * empty state financeiro. Mostra uma "análise fictícia" com 3
 * insights típicos para que o profissional entenda exatamente o que
 * a IA entrega antes de assinar.
 */
const MentorIAExplainerModal = ({ open, onClose, onUpgrade }: Props) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm p-0 overflow-hidden border-primary/20"
        data-testid="mentor-ia-explainer-modal"
      >
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 px-6 pt-6 pb-4 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-base">
              Como a Mentora IA te ajuda
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mt-1">
            Exemplo de análise sobre seus próprios lançamentos
          </p>
        </div>

        <div className="px-6 py-4 space-y-3">
          <div className="flex items-start gap-3 rounded-lg bg-success/5 border border-success/15 p-3">
            <TrendingUp className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold">Receita potencial</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                "Seus 3 horários ociosos da quarta podem virar R$ 1.200/mês."
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/15 p-3">
            <PiggyBank className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold">Onde economizar</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                "Sua categoria 'marketing' subiu 38% — vale renegociar
                ou cortar 1 canal."
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-secondary/5 border border-secondary/20 p-3">
            <Calculator className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold">Imposto otimizado</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                "Como CNPJ (Simples), você pagaria R$ 380/mês a menos
                de imposto que como pessoa física."
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-2">
          <Button
            onClick={onUpgrade}
            className="w-full gradient-primary font-semibold"
            data-testid="mentor-ia-explainer-upgrade"
          >
            Quero a Mentora IA agora
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            Mentoria financeira ilimitada com IA treinada nos seus
            próprios dados.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MentorIAExplainerModal;
