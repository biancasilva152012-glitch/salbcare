import { forwardRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

interface ProfessionalRouteProps {
  children: React.ReactNode;
  /** Mantido por compatibilidade. Acesso sem login foi desativado: sempre exige login. */
  allowGuest?: boolean;
}

const ProfessionalRoute = forwardRef<HTMLDivElement, ProfessionalRouteProps>(({ children }, ref) => {
  const { user, loading, userType, userTypeLoading } = useAuth();
  const location = useLocation();

  if (loading || (user && userTypeLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (userType === "patient") return <Navigate to="/patient-dashboard" replace />;

  return <div ref={ref} className="contents">{children}</div>;
});

ProfessionalRoute.displayName = "ProfessionalRoute";

export default ProfessionalRoute;
