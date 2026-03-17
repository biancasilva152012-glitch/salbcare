import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const PatientRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, userType, userTypeLoading } = useAuth();

  if (loading || userTypeLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (userType === "professional") return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default PatientRoute;
