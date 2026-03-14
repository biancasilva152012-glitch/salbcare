import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Mic, Wifi, CheckCircle2, XCircle, Loader2, SkipForward } from "lucide-react";

interface PreCheckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReady: () => void;
}

type CheckStatus = "pending" | "checking" | "ok" | "error";

const PreCheckModal = ({ open, onOpenChange, onReady }: PreCheckModalProps) => {
  const [camera, setCamera] = useState<CheckStatus>("pending");
  const [mic, setMic] = useState<CheckStatus>("pending");
  const [connection, setConnection] = useState<CheckStatus>("pending");
  const [stream, setStream] = useState<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (!open) {
      cleanup();
      setCamera("pending");
      setMic("pending");
      setConnection("pending");
    }
  }, [open, cleanup]);

  const testCamera = async () => {
    setCamera("checking");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      s.getVideoTracks().forEach((t) => t.stop());
      setCamera("ok");
    } catch {
      setCamera("error");
    }
  };

  const testMic = async () => {
    setMic("checking");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getAudioTracks().forEach((t) => t.stop());
      setMic("ok");
    } catch {
      setMic("error");
    }
  };

  const testConnection = async () => {
    setConnection("checking");
    try {
      const start = Date.now();
      await fetch("https://www.google.com/favicon.ico", { mode: "no-cors", cache: "no-store" });
      const elapsed = Date.now() - start;
      setConnection(elapsed < 5000 ? "ok" : "error");
    } catch {
      // Even if CORS blocks, if fetch doesn't throw network error, connection exists
      setConnection("ok");
    }
  };

  useEffect(() => {
    if (open) {
      testConnection();
    }
  }, [open]);

  const allOk = camera === "ok" && mic === "ok" && connection === "ok";

  const StatusIcon = ({ status }: { status: CheckStatus }) => {
    if (status === "pending") return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />;
    if (status === "checking") return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    if (status === "ok") return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-destructive" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Verificação pré-consulta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon status={camera} />
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Câmera funcionando</span>
              </div>
            </div>
            {camera !== "ok" && camera !== "checking" && (
              <Button size="sm" variant="outline" onClick={testCamera} className="text-xs h-7">
                Testar
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon status={mic} />
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Microfone funcionando</span>
              </div>
            </div>
            {mic !== "ok" && mic !== "checking" && (
              <Button size="sm" variant="outline" onClick={testMic} className="text-xs h-7">
                Testar
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon status={connection} />
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Conexão estável</span>
              </div>
            </div>
            {connection === "error" && (
              <Button size="sm" variant="outline" onClick={testConnection} className="text-xs h-7">
                Tentar
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => {
                cleanup();
                onReady();
              }}
              disabled={!allOk}
              className="w-full gradient-primary font-semibold"
            >
              Tudo certo — entrar
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                cleanup();
                onReady();
              }}
              className="w-full text-xs text-muted-foreground gap-1"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Pular verificação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreCheckModal;
