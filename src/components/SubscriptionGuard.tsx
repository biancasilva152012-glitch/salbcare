import { ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: ReactNode;
}

export function SubscriptionGuard({ children }: Props) {
  const sub = useSubscription();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [polling, setPolling] = useState(false);
  const [resolved, setResolved] = useState(false);
  const pollCount = useRef(0);

  // Post-checkout polling: if user just came from Stripe, poll for up to 5s
  const pollSubscription = useCallback(async () => {
    if (!user || pollCount.current >= 5) {
      setPolling(false);
      setResolved(true);
      return;
    }

    pollCount.current += 1;
    const { data: prof } = await supabase
      .from("professionals")
      .select("subscription_status")
      .eq("user_id", user.id)
      .maybeSingle();

    const status = (prof as any)?.subscription_status;
    if (status === "trialing" || status === "active") {
      setPolling(false);
      setResolved(true);
      // Force page reload to refresh subscription state
      window.location.reload();
      return;
    }

    setTimeout(pollSubscription, 1000);
  }, [user]);

  useEffect(() => {
    // If status is null/canceled but we just came from checkout, poll
    if (!sub.isLoading && sub.isCanceled && !sub.isAdmin) {
      const fromCheckout = sessionStorage.getItem("salbcare_from_checkout");
      if (fromCheckout === "true") {
        sessionStorage.removeItem("salbcare_from_checkout");
        setPolling(true);
        pollCount.current = 0;
        pollSubscription();
        return;
      }
      navigate("/subscription", { replace: true });
    }
  }, [sub.isLoading, sub.isCanceled, sub.isAdmin, navigate, pollSubscription]);

  // Admin bypass — no banners, full access
  if (sub.isAdmin) {
    return <>{children}</>;
  }

  if (sub.isLoading || polling) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sub.isCanceled) return null;

  return (
    <>
      {sub.isPastDue && <PastDueBanner />}
      {sub.status === "trialing" && <TrialBanner trialEndsAt={sub.trialEndsAt} />}
      {children}
    </>
  );
}

function PastDueBanner() {
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Erro ao abrir portal de pagamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#7F1D1D] text-white px-4 py-3 flex items-center justify-between gap-3 rounded-lg mb-4">
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>Seu pagamento falhou. Atualize seu cartão para manter o acesso.</span>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={openPortal}
        disabled={loading}
        className="shrink-0 text-xs"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Atualizar pagamento"}
      </Button>
    </div>
  );
}

function TrialBanner({ trialEndsAt }: { trialEndsAt: string | null }) {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (dismissed) return null;

  let daysLeft = 0;
  if (trialEndsAt) {
    const diff = new Date(trialEndsAt).getTime() - Date.now();
    daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const openPortal = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Erro ao abrir portal de pagamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1E3A5F] text-white px-4 py-3 flex items-center justify-between gap-3 rounded-lg mb-4">
      <span className="text-sm">
        Você está no período de teste. <strong>{daysLeft} {daysLeft === 1 ? "dia restante" : "dias restantes"}</strong>.
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" variant="secondary" onClick={openPortal} disabled={loading} className="text-xs">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Adicionar cartão"}
        </Button>
        <button onClick={() => setDismissed(true)} className="text-white/60 hover:text-white text-xs">✕</button>
      </div>
    </div>
  );
}

export function FeatureLock() {
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Erro ao abrir portal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
      <Lock className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground text-center mb-3">Atualize seu pagamento para usar este recurso</p>
      <Button size="sm" onClick={openPortal} disabled={loading}>
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Regularizar agora"}
      </Button>
    </div>
  );
}

export default SubscriptionGuard;
