import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  hasMigratableDemoData,
  readDemoPatients,
  readDemoAppointments,
  mergeGuestCountersIntoAccount,
  syncDemoCounters,
} from "@/lib/demoStorage";
import ImportDemoDataModal from "@/components/ImportDemoDataModal";

/**
 * Mounted globally inside <AuthProvider>. As soon as we detect a freshly
 * authenticated user that still has /experimente data sitting in localStorage,
 * we open the import modal — regardless of which route they landed on.
 *
 * Also runs the backend counter merge so the anonymous demo usage is carried
 * over to the user's account (preventing limit reset by simply signing up).
 */
export default function GlobalDemoMigration() {
  const { user, loading } = useAuth();
  const [active, setActive] = useState(false);
  const handledFor = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    if (handledFor.current === user.id) return;
    handledFor.current = user.id;

    // Best-effort: merge guest counters into the new user's row, then re-sync
    // the local copy with the merged remote total. Failures are silent.
    (async () => {
      const merged = await mergeGuestCountersIntoAccount();
      if (!merged) {
        await syncDemoCounters(user.id);
      }
    })();

    if (!hasMigratableDemoData()) return;
    const totals = readDemoPatients().length + readDemoAppointments().length;
    if (totals === 0) return;
    setActive(true);
  }, [user, loading]);

  if (!active || !user) return null;

  return (
    <ImportDemoDataModal
      userId={user.id}
      onDone={() => setActive(false)}
    />
  );
}
