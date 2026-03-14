import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, MessageCircle, Link2 } from "lucide-react";

interface ShareBookingLinkProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  doctorName: string;
}

const ShareBookingLink = ({ open, onOpenChange, userId, doctorName }: ShareBookingLinkProps) => {
  const bookingUrl = `${window.location.origin}/booking?doctor=${userId}&name=${encodeURIComponent(doctorName)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl);
    toast.success("Link copiado!");
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Agende sua consulta comigo pelo link:\n${bookingUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Link de Agendamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Compartilhe este link para que seus pacientes possam solicitar consultas diretamente.
          </p>

          <div className="flex gap-2">
            <Input value={bookingUrl} readOnly className="bg-accent border-border text-xs" />
            <Button variant="outline" size="icon" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={handleWhatsApp} className="w-full gap-2 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-semibold">
            <MessageCircle className="h-4 w-4" />
            Enviar via WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareBookingLink;
