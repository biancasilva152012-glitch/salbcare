import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  clearGuestStorage,
  GUEST_SYNC_ACK_KEY,
  GUEST_SYNC_LOCK_KEY,
  GUEST_MERGE_INFLIGHT_KEY,
  GUEST_MERGE_DONE_KEY,
  GUEST_SYNC_SUMMARY_KEY,
} from "@/lib/guestStorage";

/**
 * /guest — entry point for testing the visitor experience end-to-end.
 *
 * Guarantees a clean visitor session by:
 *  1. Signing out any existing Supabase session (so subscription/admin bypass
 *     does not leak into the test).
 *  2. Wiping localStorage keys that drive guest counters, sync acks, and the
 *     post-login merge guard so the user starts at "0/3" again.
 *  3. Redirecting to `next` (defaults to `/dashboard`) which renders the
 *     guest variant of the page.
 *
 * Used for QA flows: guest → limits → login → Stripe checkout → premium.
 */
const GuestEntry = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/dashboard";

  useEffect(() => {
    let cancelled = false;
    const reset = async () => {
      try {
        await supabase.auth.signOut();
      } catch {
        /* already signed out */
      }
      if (cancelled || typeof window === "undefined") return;

      // Clear guest data + every sync-related marker so counters restart
      clearGuestStorage();
      try {
        window.localStorage.removeItem(GUEST_SYNC_ACK_KEY);
        window.localStorage.removeItem(GUEST_SYNC_LOCK_KEY);
        window.localStorage.removeItem(GUEST_MERGE_INFLIGHT_KEY);
        window.localStorage.removeItem(GUEST_MERGE_DONE_KEY);
        window.sessionStorage.removeItem(GUEST_SYNC_SUMMARY_KEY);
      } catch {
        /* ignore */
      }

      navigate(next, { replace: true });
    };
    void reset();
    return () => {
      cancelled = true;
    };
  }, [navigate, next]);

  return (
    <div
      className="flex min-h-screen items-center justify-center text-sm text-muted-foreground"
      data-testid="guest-entry-loading"
    >
      <Loader2 className="h-4 w-4 animate-spin mr-2" />
      Iniciando modo visitante…
    </div>
  );
};

export default GuestEntry;
