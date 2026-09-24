import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/** Sends signed-in users straight to the app home instead of public entry pages. */
const RedirectIfAuthed = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (!loading && user) {
    let justSignedUp = false;
    try { justSignedUp = sessionStorage.getItem("salbcare_just_signed_up") === "1"; } catch { /* ignore */ }
    return <Navigate to={justSignedUp ? "/primeiros-passos" : "/dashboard"} replace />;
  }
  return <>{children}</>;
};

export default RedirectIfAuthed;
