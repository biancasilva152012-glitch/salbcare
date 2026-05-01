import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Link2, Copy, ExternalLink, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface JoinMeetConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  date: string; // ISO
  duration?: number | null;
  meetUrl: string;
  patientPhone?: string | null;
  mode: "open" | "send";
}

const JoinMeetConfirmModal = ({
  open,
  onOpenChange,
  patientName,
  date,
  duration,
  meetUrl,
  patientPhone,
  mode,
}: JoinMeetConfirmModalProps) => {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString("pt-BR");
  const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(meetUrl);
    toast.success("Link copiado!");
  };

  const handleConfirm = () => {
    if (mode === "open") {
      window.open(meetUrl, "_blank");
    } else {
      if (!patientPhone) {
        toast.error("Paciente sem telefone cadastrado.");
        return;
      }
      const phone = patientPhone.replace(/\D/g, "");
      const msg = encodeURIComponent(
        `Olá ${patientName}! Sua consulta está confirmada para ${dateStr} às ${timeStr}.\n\n🔗 Acesse aqui:\n${meetUrl}\n\nSalve este link.`
      );
      window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {mode === "open" ? "Abrir sala da consulta" : "Enviar link ao paciente"}
          </DialogTitle>
          <DialogDescription>Confirme os dados antes de prosseguir.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-xl bg-accent/40 p-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span className="font-medium">{patientName}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {dateStr}
            <Clock className="h-4 w-4 ml-2" />
            {timeStr}
            {duration ? ` • ${duration} min` : ""}
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground break-all">
            <Link2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{meetUrl}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleConfirm} className="w-full gradient-primary gap-2">
            {mode === "open" ? (
              <><ExternalLink className="h-4 w-4" /> Abrir Google Meet</>
            ) : (
              <><MessageCircle className="h-4 w-4" /> Enviar pelo WhatsApp</>
            )}
          </Button>
          <Button onClick={handleCopy} variant="outline" className="w-full gap-2">
            <Copy className="h-4 w-4" /> Copiar link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinMeetConfirmModal;
