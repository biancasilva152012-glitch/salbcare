import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import InstallStepsContent from "./InstallStepsContent";
import { DISMISSED_KEY } from "@/contexts/PWAInstallContext";
import logoSalb from "/pwa-icon-512.png";

const NAVY = "#0D1B2A";
const TEAL = "#00B4A0";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const InstallPWAModal = ({ open, onOpenChange }: Props) => {
  const dontShowAgain = () => {
    try { localStorage.setItem(DISMISSED_KEY, Date.now().toString()); } catch { /* ignore */ }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[600px] sm:rounded-2xl p-0 overflow-hidden max-h-[92vh] sm:max-h-[85vh]"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <div className="overflow-y-auto px-5 pb-5 pt-6 sm:px-7 sm:pb-7">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <img src={logoSalb} alt="SalbCare" width={44} height={44} className="rounded-xl" />
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold" style={{ color: NAVY }}>
                  Instale o SalbCare no seu dispositivo
                </DialogTitle>
                <DialogDescription className="text-sm" style={{ color: "#64748B" }}>
                  Tenha seu consultório de bolso sempre à mão — acesso rápido, sem abrir o navegador.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-5">
            <InstallStepsContent />
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="ghost"
              onClick={dontShowAgain}
              className="rounded-xl"
              style={{ color: "#64748B" }}
              aria-label="Não mostrar novamente"
            >
              Não mostrar novamente
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-semibold transition-transform hover:scale-[1.02]"
              style={{ background: TEAL, color: "#fff" }}
              aria-label="Entendi, vou instalar"
            >
              Entendi, vou instalar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallPWAModal;
