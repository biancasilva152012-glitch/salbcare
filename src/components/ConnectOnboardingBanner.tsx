import { useState } from "react";
import { AlertTriangle, ExternalLink, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  stripeOnboardingComplete?: boolean;
  stripeAccountId?: string | null;
}

const ConnectOnboardingBanner = ({ stripeOnboardingComplete, stripeAccountId }: Props) => {
  const [loading, setLoading] = useState(false);

  if (stripeOnboardingComplete) return null;

  const handleStartOnboarding = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("connect-onboarding", {
        body: { return_url: window.location.origin },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao iniciar cadastro bancário. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card ring-1 ring-yellow-500/30 bg-yellow-500/5 p-4 space-y-2">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Dados bancários pendentes</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            Cadastre seus dados bancários para receber pelos atendimentos realizados pela SALBCARE.
            Enquanto não configurar, seu perfil não aparecerá nas buscas públicas.
          </p>
        </div>
      </div>
      <Button
        onClick={handleStartOnboarding}
        disabled={loading}
        size="sm"
        className="w-full gap-2 gradient-primary font-semibold"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Preparando...</>
        ) : (
          <><ExternalLink className="h-4 w-4" /> Cadastrar dados bancários</>
        )}
      </Button>
      <p className="text-[10px] text-muted-foreground text-center">
        Os pagamentos são transferidos automaticamente em até 2 dias úteis. A SALBCARE retém 10% como taxa da plataforma.
      </p>
    </div>
  );
};

export default ConnectOnboardingBanner;
