import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProSubscription } from "@/hooks/useProSubscription";
import { CREAM, NAVY, TEAL } from "@/components/pro/brand";

/** Quantas revalidações fazemos antes de desistir (webhook do Stripe chega em segundos). */
const MAX_RETRIES = 8;
const RETRY_DELAY_MS = 2000;

/** Protege as rotas /pro/onboarding e /pro/painel: exige login e assinatura Pro ativa. */
const ProRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const { isActive, loading, refresh } = useProSubscription();
  const [attempts, setAttempts] = useState(0);
  // Só esperamos o webhook quando o usuário acabou de voltar do Stripe.
  const returningFromStripe = new URLSearchParams(location.search).get("status") === "success";
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Voltando do Stripe, a assinatura só é gravada quando o webhook chega.
  // Revalidamos algumas vezes antes de mandar o usuário de volta para /pro.
  useEffect(() => {
    if (!returningFromStripe) return;
    if (loading || authLoading || !user || isActive) return;
    if (attempts >= MAX_RETRIES) return;
    timer.current = setTimeout(() => {
      setAttempts((n) => n + 1);
      refresh();
    }, RETRY_DELAY_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [returningFromStripe, loading, authLoading, user, isActive, attempts, refresh]);

  const waitingForWebhook = returningFromStripe && !!user && !isActive && attempts < MAX_RETRIES;

  if (authLoading || loading || waitingForWebhook) {
    return (
      <div
        style={{ background: NAVY, color: CREAM, minHeight: "100vh" }}
        className="flex flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
        {waitingForWebhook && !authLoading && !loading && (
          <p className="max-w-xs text-sm" style={{ color: TEAL }}>
            Confirmando seu pagamento. Isso leva alguns segundos.
          </p>
        )}
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isActive) return <Navigate to="/pro" replace />;

  return <>{children}</>;
};

export default ProRoute;
