import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Crown, Check } from "lucide-react";
import { openVersionedSubscriptionRoute } from "@/utils/subscriptionNavigation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const benefits = [
  "Assinatura ICP-Brasil integrada à plataforma",
  "QR Code de verificação de autenticidade",
  "Envio automático do PDF por e-mail ao paciente",
  "Histórico completo de documentos emitidos",
  "Página pública de verificação",
];

const DigitalSignatureUpsellModal = ({ open, onOpenChange }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Crown className="h-5 w-5 text-amber-500" />
            Assinatura Digital ICP-Brasil
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            A assinatura integrada ICP-Brasil está disponível a partir do{" "}
            <strong className="text-foreground">Plano Profissional</strong> por{" "}
            <strong className="text-primary">R$ 100/mês</strong>. Faça upgrade e
            assine seus documentos com validade legal direto pela plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 my-2">
          {benefits.map((b) => (
            <div key={b} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="text-xs text-muted-foreground">{b}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <Button
            onClick={() => {
              onOpenChange(false);
              openVersionedSubscriptionRoute();
            }}
            className="w-full gradient-primary font-semibold gap-2"
          >
            <ShieldCheck className="h-4 w-4" />
            Fazer upgrade agora
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-xs text-muted-foreground">
            Continuar sem assinatura digital
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DigitalSignatureUpsellModal;
