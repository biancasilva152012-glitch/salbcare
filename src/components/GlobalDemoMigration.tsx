import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  hasMigratableDemoData,
  readDemoPatients,
  readDemoAppointments,
} from "@/lib/demoStorage";
import ImportDemoDataModal from "@/components/ImportDemoDataModal";

/**
 * Mounted globally inside <AuthProvider>. As soon as we detect a freshly
 * authenticated user that still has /experimente data sitting in localStorage,
 * we open the import modal — regardless of which route they landed on.
 *
 * This guarantees data captured in the guest session is never lost: it is
 * either migrated to the new account or explicitly discarded by the user.
 */
export default function GlobalDemoMigration() {
  const { user, loading } = useAuth();
  const [active, setActive] = useState(false);
  const handledFor = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    if (handledFor.current === user.id) return;
    if (!hasMigratableDemoData()) {
      handledFor.current = user.id;
      return;
    }
    // Avoid empty migrations (no real entries beyond the seeds removed).
    const totals = readDemoPatients().length + readDemoAppointments().length;
    if (totals === 0) {
      handledFor.current = user.id;
      return;
    }
    handledFor.current = user.id;
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
