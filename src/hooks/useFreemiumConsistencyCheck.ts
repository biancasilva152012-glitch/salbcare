/**
 * Runtime consistency check between the freemium UI meters and the backend
 * counters. After each backend sync, compares the locally-rendered values
 * against the persisted ones and:
 *   - logs a clear warning to the console (always)
 *   - triggers a sonner toast with the divergence (once per mismatch fingerprint)
 *   - lets the backend value win silently by re-reading localStorage
 *     (since `syncDemoCounters` already wrote the merged value, there's
 *     nothing to overwrite — we just surface it)
 *
 * Use this hook on any page that renders freemium meters/Progress so we
 * catch divergences as soon as they happen.
 */
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  readUsageCounters,
  syncDemoCounters,
  type DemoUsageCounters,
} from "@/lib/demoStorage";

const fingerprint = (a: DemoUsageCounters, b: DemoUsageCounters) =>
  `${a.patientsCreated}-${a.appointmentsCreated}-${a.telehealthAttempts}|${b.patientsCreated}-${b.appointmentsCreated}-${b.telehealthAttempts}`;

export function useFreemiumConsistencyCheck(userId: string | null) {
  const lastWarningRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const before = readUsageCounters();
      const merged = await syncDemoCounters(userId);
      if (cancelled) return;

      const fp = fingerprint(before, merged);
      const diverged =
        before.patientsCreated !== merged.patientsCreated ||
        before.appointmentsCreated !== merged.appointmentsCreated ||
        before.telehealthAttempts !== merged.telehealthAttempts ||
        before.telehealthViews !== merged.telehealthViews;

      if (diverged && lastWarningRef.current !== fp) {
        lastWarningRef.current = fp;
        // eslint-disable-next-line no-console
        console.warn("[freemium] UI counters diverged from backend — reconciling", {
          before,
          merged,
        });
        toast.warning("Contadores ajustados", {
          description:
            "Sincronizamos seus limites com o servidor para manter tudo consistente.",
          duration: 4000,
        });
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [userId]);
}
