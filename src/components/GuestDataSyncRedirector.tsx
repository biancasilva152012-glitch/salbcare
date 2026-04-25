import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  hasGuestData,
  hasGuestSyncBeenAcknowledged,
  setGuestSyncLock,
} from "@/lib/guestStorage";

/**
 * Auto-redirects to /sync-guest-data the FIRST time an authenticated user
 * lands somewhere in the dashboard with leftover guest data in localStorage.
 *
 * Skips:
 *  - users without guest data
 *  - already acknowledged sync
 *  - the sync page itself + login/register/onboarding/checkout flows
 *  - admin paths
 */
const SKIP_PREFIXES = [
  "/sync-guest-data",
  "/login",
  "/register",
  "/cadastro",
  "/forgot-password",
  "/reset-password",
  "/checkout",
  "/payment-success",
  "/sucesso",
  "/cancelado",
  "/complete-profile",
  "/onboarding",
  "/admin",
  "/admin-legacy",
  "/upgrade",
  "/subscription",
];

const GuestDataSyncRedirector = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const triggered = useRef(false);

  useEffect(() => {
    if (loading || !user || triggered.current) return;
    if (typeof window === "undefined") return;

    const path = location.pathname;
    if (SKIP_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return;
    if (hasGuestSyncBeenAcknowledged()) return;
    if (!hasGuestData()) return;

    triggered.current = true;
    setGuestSyncLock();
    const next = encodeURIComponent(location.pathname + location.search);
    navigate(`/sync-guest-data?next=${next}`, { replace: true });
  }, [user, loading, location.pathname, location.search, navigate]);

  return null;
};

export default GuestDataSyncRedirector;
