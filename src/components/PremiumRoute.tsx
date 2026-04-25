import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/config/admin";

interface PremiumRouteProps {
  children: React.ReactNode;
  /** Human-friendly module name used in the upgrade reason query param. */
  module: string;
}

/**
 * Stronger guard than ProfessionalRoute: requires an *active* subscription
 * (or trial / admin) to enter. If the user is signed in but does NOT have a
 * paid plan, redirect to /upgrade with an explanation in the reason param.
 *
 * Visitors (no session) are bounced to /login first so the next= chain still
 * brings them back here after auth + payment.
 */
const PremiumRoute = ({ children, module }: PremiumRouteProps) => {
  const { user, loading, subscription, userType, userTypeLoading } = useAuth();
  const location = useLocation();

  if (loading || (user && userTypeLoading) || subscription.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (userType === "patient") return <Navigate to="/patient-dashboard" replace />;

  // Admins always get through (mirrors AuthContext bypass)
  if (isAdminEmail(user.email)) return <>{children}</>;

  const hasAccess =
    subscription.subscribed ||
    subscription.paymentStatus === "active" ||
    subscription.trialDaysRemaining > 0;

  if (!hasAccess) {
    const back = encodeURIComponent(location.pathname);
    return (
      <Navigate
        to={`/upgrade?reason=premium_required&module=${encodeURIComponent(module)}&back=${back}`}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default PremiumRoute;
