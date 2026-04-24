import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, X } from "lucide-react";
import { PLANS } from "@/config/plans";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature: string;
  currentUsage: number;
  limit: number;
}

const UpgradeModal = ({ open, onClose, feature, currentUsage, limit }: UpgradeModalProps) => {
  const navigate = useNavigate();
  const plan = PLANS.basic;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden border-primary/20">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 px-6 pt-8 pb-6 text-center">
          <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Crown className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold">Limite atingido</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Você usou <span className="text-primary font-semibold">{currentUsage}/{limit}</span> {feature} do plano gratuito este mês.
          </p>
        </div>

        {/* Benefits */}
        <div className="px-6 py-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Com o plano {plan.name} você tem:
          </p>
          <ul className="space-y-2">
            {[
              "Lançamentos financeiros ilimitados",
              "Pacientes ilimitados",
              "Mentoria financeira ilimitada",
              "Teleconsulta integrada",
              "100% do valor das consultas",
            ].map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 space-y-2">
          <Button
            onClick={() => {
              onClose();
              navigate(`/upgrade?reason=${encodeURIComponent(feature)}`);
            }}
            className="w-full gradient-primary font-semibold py-5"
          >
            <Crown className="h-4 w-4 mr-2" />
            Assinar por R$ {plan.price}/mês
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            7 dias grátis • Cancele quando quiser
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
