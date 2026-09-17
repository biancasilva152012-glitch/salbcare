import { forwardRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

interface ProfessionalRouteProps {
  children: React.ReactNode;
  /**
   * When true, visitors without an auth session are allowed in (guest mode).
   * Guest pages must handle the `!user` case themselves — typically by
   * rendering a localStorage-backed view or the GuestPaywall.
   */
  allowGuest?: boolean;
}

const ProfessionalRoute = forwardRef<HTMLDivElement, ProfessionalRouteProps>(({ children, allowGuest = false }, ref) => {
  const { user, loading, userType, userTypeLoading } = useAuth();
  const location = useLocation();

  if (loading || (user && userTypeLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    if (allowGuest) return <div ref={ref} className="contents">{children}</div>;
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (userType === "patient") return <Navigate to="/patient-dashboard" replace />;

  return <div ref={ref} className="contents">{children}</div>;
});

ProfessionalRoute.displayName = "ProfessionalRoute";

export default ProfessionalRoute;
