import { useState, useEffect } from "react";
import { Download, Smartphone, Share, MoreVertical, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    // Detect if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Back button */}
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary shadow-lg">
          <Smartphone className="h-10 w-10 text-primary-foreground" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">Instalar SALBCARE</h1>
          <p className="text-muted-foreground mt-2">
            Tenha acesso rápido direto da tela inicial do seu celular, como um app nativo.
          </p>
        </div>

        {isInstalled ? (
          <div className="glass-card p-6 space-y-3">
            <CheckCircle className="h-12 w-12 text-success mx-auto" />
            <p className="font-semibold text-lg">App já instalado!</p>
            <p className="text-sm text-muted-foreground">
              O SALBCARE já está na tela inicial do seu dispositivo.
            </p>
          </div>
        ) : deferredPrompt ? (
          <Button onClick={handleInstall} className="w-full gradient-primary text-lg py-6 gap-3">
            <Download className="h-5 w-5" />
            Instalar agora
          </Button>
        ) : isIOS ? (
          <div className="glass-card p-6 space-y-4 text-left">
            <p className="font-semibold text-center">Como instalar no iPhone/iPad:</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">1</div>
                <p className="text-sm pt-1">
                  Toque no ícone <Share className="inline h-4 w-4 text-primary" /> <strong>Compartilhar</strong> na barra do Safari
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">2</div>
                <p className="text-sm pt-1">
                  Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">3</div>
                <p className="text-sm pt-1">
                  Toque em <strong>"Adicionar"</strong> para confirmar
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 space-y-4 text-left">
            <p className="font-semibold text-center">Como instalar no Android:</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">1</div>
                <p className="text-sm pt-1">
                  Toque no ícone <MoreVertical className="inline h-4 w-4 text-primary" /> <strong>Menu</strong> do navegador
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">2</div>
                <p className="text-sm pt-1">
                  Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">3</div>
                <p className="text-sm pt-1">
                  Confirme tocando em <strong>"Instalar"</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="space-y-3 text-left">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Vantagens</p>
          <div className="grid gap-2">
            {[
              "Acesso rápido pela tela inicial",
              "Funciona offline (dados em cache)",
              "Carregamento mais rápido",
              "Sem ocupar espaço na memória",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Install;
