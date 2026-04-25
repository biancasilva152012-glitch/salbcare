import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface ProfessionalRouteProps {
  children: React.ReactNode;
  /**
   * When true, visitors without an auth session are allowed in (guest mode).
   * Guest pages must handle the `!user` case themselves — typically by
   * rendering a localStorage-backed view or the GuestPaywall.
   */
  allowGuest?: boolean;
}

const ProfessionalRoute = ({ children, allowGuest = false }: ProfessionalRouteProps) => {
  const { user, loading, userType, userTypeLoading } = useAuth();

  if (loading || (user && userTypeLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    if (allowGuest) return <>{children}</>;
    return <Navigate to="/login" replace />;
  }
  if (userType === "patient") return <Navigate to="/patient-dashboard" replace />;

  return <>{children}</>;
};

export default ProfessionalRoute;
