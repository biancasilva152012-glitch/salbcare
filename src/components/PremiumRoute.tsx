import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/config/admin";
import { logPremiumRouteBlock, type PremiumRouteReason } from "@/lib/premiumRouteAudit";

interface PremiumRouteProps {
  children: React.ReactNode;
  /** Human-friendly module name used in the upgrade reason query param. */
  module: string;
}

/**
 * Stronger guard than ProfessionalRoute: requires an *active* subscription
 * (or trial / admin) to enter. If the user is signed in but does NOT have a
 * paid plan, redirect to /upgrade with an explanation in the reason param,
 * AND record an audit row so the user (and admins) can inspect why.
 */
const PremiumRoute = ({ children, module }: PremiumRouteProps) => {
  const { user, loading, subscription, userType, userTypeLoading } = useAuth();
  const location = useLocation();

  const stillLoading =
    loading || (user && userTypeLoading) || subscription.loading;

  const hasAccess =
    !!user &&
    (isAdminEmail(user.email) ||
      subscription.subscribed ||
      subscription.paymentStatus === "active" ||
      subscription.trialDaysRemaining > 0);

  // Determine block reason (only used when redirecting)
  let blockReason: PremiumRouteReason | null = null;
  if (!stillLoading && user && !hasAccess) {
    if (subscription.paymentStatus === "canceled") {
      blockReason = "subscription_canceled";
    } else if (
      subscription.trialDaysRemaining === 0 &&
      subscription.paymentStatus !== "active"
    ) {
      blockReason = "trial_expired";
    } else {
      blockReason = "premium_required";
    }
  }

  // Fire the audit log exactly once per render that produces a redirect.
  useEffect(() => {
    if (!blockReason) return;
    void logPremiumRouteBlock({
      module,
      reason: blockReason,
      attemptedPath: location.pathname + location.search,
      metadata: {
        trialDaysRemaining: subscription.trialDaysRemaining,
        paymentStatus: subscription.paymentStatus || "none",
      },
    });
    // We intentionally only depend on the values that determine the audit
    // event identity; ignoring location.search churn caused by query params
    // we don't care about.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockReason, module]);

  if (stillLoading) {
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

  if (isAdminEmail(user.email)) return <>{children}</>;

  if (!hasAccess) {
    const back = encodeURIComponent(location.pathname);
    const reason = blockReason ?? "premium_required";
    return (
      <Navigate
        to={`/upgrade?reason=${reason}&module=${encodeURIComponent(module)}&back=${back}`}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default PremiumRoute;
