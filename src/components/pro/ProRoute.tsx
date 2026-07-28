import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProSubscription } from "@/hooks/useProSubscription";
import { CREAM, NAVY } from "@/components/pro/brand";

/** Protege as rotas /pro/onboarding e /pro/painel: exige login e assinatura Pro ativa. */
const ProRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const { isActive, loading, refresh } = useProSubscription();

  // Voltando do Stripe o webhook pode levar alguns segundos: revalida uma vez.
  useEffect(() => {
    if (!loading && user && !isActive) {
      const t = setTimeout(refresh, 2500);
      return () => clearTimeout(t);
    }
  }, [loading, user, isActive, refresh]);

  if (authLoading || loading) {
    return (
      <div style={{ background: NAVY, color: CREAM, minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isActive) return <Navigate to="/pro" replace />;

  return <>{children}</>;
};

export default ProRoute;
