import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save, Clock } from "lucide-react";

interface EndCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "video" | "audio" | "chat";
  onSaveNow: () => void;
  onLater: () => void;
}

const EndCallModal = ({ open, onOpenChange, mode, onSaveNow, onLater }: EndCallModalProps) => {
  const modeLabel = mode === "chat" ? "chat de texto" : mode === "audio" ? "áudio" : "vídeo";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Consulta encerrada</DialogTitle>
          <DialogDescription className="text-sm">
            {mode !== "video" && (
              <span className="block text-xs text-muted-foreground mb-2">
                Esta consulta foi realizada por {modeLabel}. Isso foi registrado automaticamente no histórico.
              </span>
            )}
            Deseja registrar as anotações no prontuário agora?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button onClick={onSaveNow} className="w-full gradient-primary gap-2">
            <Save className="h-4 w-4" /> Salvar no prontuário
          </Button>
          <Button onClick={onLater} variant="outline" className="w-full gap-2">
            <Clock className="h-4 w-4" /> Fazer depois
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EndCallModal;
