import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, X, Lock } from "lucide-react";
import { PLANS } from "@/config/plans";
import { useNavigate } from "react-router-dom";

interface PremiumFeatureModalProps {
  open: boolean;
  onClose: () => void;
  /** Nome curto do recurso bloqueado (ex: "prescrições digitais") */
  featureName: string;
  /** Descrição opcional para contextualizar o porquê do bloqueio */
  description?: string;
}

const DEFAULT_BENEFITS = [
  "Receitas: comum, controle especial, notificação azul e amarela",
  "Atestados e certificados digitais com assinatura ICP",
  "Teleconsulta integrada com Google Meet",
  "Perfil destacado no diretório público de profissionais",
  "Pacientes ilimitados e mentoria de IA ilimitada",
];

/**
 * Modal exibido sempre que um usuário no plano gratuito tenta acessar uma
 * feature exclusiva do plano Essencial (prescrições, atestados, teleconsulta,
 * diretório público).
 */
const PremiumFeatureModal = ({ open, onClose, featureName, description }: PremiumFeatureModalProps) => {
  const navigate = useNavigate();
  const plan = PLANS.basic;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden border-primary/20">
        <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 px-6 pt-8 pb-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold">Recurso exclusivo do plano {plan.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {description ?? (
              <>
                <span className="font-semibold text-foreground">{featureName}</span>{" "}
                está disponível apenas para assinantes do plano {plan.name}.
              </>
            )}
          </p>
        </div>

        <div className="px-6 py-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Ao assinar você desbloqueia:
          </p>
          <ul className="space-y-2">
            {DEFAULT_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 pb-6 space-y-2">
          <Button
            onClick={() => {
              onClose();
              navigate(`/upgrade?reason=${encodeURIComponent(featureName)}`);
            }}
            className="w-full gradient-primary font-semibold py-5"
          >
            <Crown className="h-4 w-4 mr-2" />
            Assinar plano {plan.name} por R$ {plan.price}/mês
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            Cancele quando quiser
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumFeatureModal;
