/**
 * Freemium Debug Panel
 *
 * Floating widget that shows the current freemium counters per module
 * (patients, appointments, telehealth) and the *origin* of each value
 * (local cache vs backend). Helps quickly spot inconsistencies between
 * the optimistic localStorage counters and the source of truth.
 *
 * Visibility:
 *  - Always visible in development (`import.meta.env.DEV`)
 *  - Visible in production for admin emails (config/admin.ts)
 *  - Otherwise hidden completely
 *
 * It also exposes a programmatic check: after each backend sync, callers can
 * push the latest backend snapshot into the panel via `window.__salbcareDebug`
 * so we can compare meters with the persisted counters and surface mismatches.
 */
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/config/admin";
import {
  DEMO_LIMITS,
  getModuleUsage,
  readUsageCounters,
  syncDemoCounters,
  type DemoUsageCounters,
  type ModuleUsage,
} from "@/lib/demoStorage";
import { useFreemiumLimits, FREE_LIMITS } from "@/hooks/useFreemiumLimits";
import { Bug, RefreshCw, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

type Origin = "local" | "backend" | "synced";

type Snapshot = {
  local: DemoUsageCounters;
  backend: DemoUsageCounters | null;
  origin: Origin;
  lastSyncAt: string | null;
  mismatches: string[];
};

declare global {
  interface Window {
    __salbcareDebug?: {
      pushBackend: (counters: DemoUsageCounters) => void;
      check: () => Snapshot;
    };
  }
}

const STORAGE_KEY = "salbcare_debug_panel_open";

const buildSnapshot = (
  local: DemoUsageCounters,
  backend: DemoUsageCounters | null,
  lastSyncAt: string | null,
): Snapshot => {
  const mismatches: string[] = [];
  if (backend) {
    (Object.keys(local) as (keyof DemoUsageCounters)[]).forEach((k) => {
      if (local[k] !== backend[k]) {
        mismatches.push(`${k}: local=${local[k]} backend=${backend[k]}`);
      }
    });
  }
  return {
    local,
    backend,
    origin: backend ? (mismatches.length === 0 ? "synced" : "backend") : "local",
    lastSyncAt,
    mismatches,
  };
};

export default function FreemiumDebugPanel() {
  const { user } = useAuth();
  const { usageByModule, isFree } = useFreemiumLimits();
  const isDev = import.meta.env.DEV;
  const isAdmin = isAdminEmail(user?.email);
  const enabled = isDev || isAdmin;

  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });
  const [snapshot, setSnapshot] = useState<Snapshot>(() =>
    buildSnapshot(readUsageCounters(), null, null),
  );
  const [syncing, setSyncing] = useState(false);

  // Expose hooks for the rest of the app to push backend snapshots into the panel.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    window.__salbcareDebug = {
      pushBackend: (counters) => {
        setSnapshot((prev) =>
          buildSnapshot(readUsageCounters(), counters, new Date().toISOString()),
        );
      },
      check: () => buildSnapshot(readUsageCounters(), snapshot.backend, snapshot.lastSyncAt),
    };
    return () => {
      if (window.__salbcareDebug) delete window.__salbcareDebug;
    };
  }, [enabled, snapshot.backend, snapshot.lastSyncAt]);

  // Refresh the local snapshot whenever the panel opens or the user changes.
  useEffect(() => {
    if (!enabled) return;
    setSnapshot((prev) =>
      buildSnapshot(readUsageCounters(), prev.backend, prev.lastSyncAt),
    );
  }, [enabled, open, user?.id]);

  // Build the module list shown in the panel.
  // We intentionally exclude Teleconsulta (no longer surfaced) and add the
  // Mentoria AI quota — that's the next gating point we want to monitor.
  type DebugRow = {
    key: "patients" | "appointments" | "mentorship";
    label: string;
    used: number;
    limit: number;
    percent: number;
    origin: "local" | "backend";
    views?: ModuleUsage["views"];
  };

  const moduleRows: DebugRow[] = useMemo(() => {
    const patients = getModuleUsage("patients");
    const appointments = getModuleUsage("appointments");
    const mentorship = usageByModule.mentorship;
    return [
      {
        key: "patients",
        label: "Pacientes",
        used: patients.used,
        limit: patients.limit,
        percent: patients.percent,
        origin: user ? "backend" : "local",
      },
      {
        key: "appointments",
        label: "Consultas",
        used: appointments.used,
        limit: appointments.limit,
        percent: appointments.percent,
        origin: user ? "backend" : "local",
      },
      {
        key: "mentorship",
        label: "Mentoria IA",
        used: mentorship.used,
        limit: mentorship.limit,
        percent: mentorship.percent,
        origin: "backend",
      },
    ];
  }, [snapshot, usageByModule, user]);

  if (!enabled) return null;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const merged = await syncDemoCounters(user?.id ?? null);
      setSnapshot(buildSnapshot(readUsageCounters(), merged, new Date().toISOString()));
      toast.success("Contadores sincronizados");
    } catch {
      toast.error("Falha ao sincronizar com o backend");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      {/* Floating toggle */}
      <button
        type="button"
        onClick={toggle}
        aria-label="Abrir painel de debug freemium"
        data-testid="debug-panel-toggle"
        className="fixed bottom-20 right-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition hover:scale-105"
      >
        <Bug className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Painel de debug freemium"
          data-testid="debug-panel"
          className="fixed bottom-32 right-4 z-[60] w-[min(92vw,360px)] max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              <span className="text-sm font-semibold">Freemium Debug</span>
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-wide"
                data-testid="debug-panel-origin"
              >
                {snapshot.origin}
              </Badge>
            </div>
            <button
              type="button"
              onClick={toggle}
              aria-label="Fechar painel"
              className="rounded p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 px-4 py-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {user ? `User: ${user.email}` : "Sessão anônima (guest)"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
                className="h-7 gap-1 text-xs"
                data-testid="debug-panel-sync"
              >
                <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
                Sync
              </Button>
            </div>

            {snapshot.mismatches.length > 0 ? (
              <div
                className="flex items-start gap-2 rounded border border-destructive/40 bg-destructive/5 p-2 text-[11px] text-destructive"
                data-testid="debug-panel-mismatch"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div>
                  <div className="font-semibold">Mismatch detectado</div>
                  <ul className="mt-1 list-disc pl-4">
                    {snapshot.mismatches.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : snapshot.backend ? (
              <div className="flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/5 p-2 text-[11px] text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Local e backend consistentes</span>
              </div>
            ) : null}

            <div className="space-y-2">
              {(Object.keys(moduleUsage) as (keyof typeof moduleUsage)[]).map((key) => {
                const u = moduleUsage[key];
                return (
                  <div
                    key={key}
                    className="rounded-md border border-border/60 p-2"
                    data-testid={`debug-module-${key}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{u.label}</span>
                      <span className="text-muted-foreground">
                        {u.used}/{u.limit}
                      </span>
                    </div>
                    <Progress value={u.percent} className="mt-1 h-1.5" />
                    {u.views && (
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        Views: {u.views.used}/{u.views.limit}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <details className="rounded border border-border/60 p-2 text-[11px]">
              <summary className="cursor-pointer font-medium">Raw counters</summary>
              <div className="mt-2 space-y-1">
                <div>
                  <span className="text-muted-foreground">Local: </span>
                  <code>{JSON.stringify(snapshot.local)}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">Backend: </span>
                  <code>
                    {snapshot.backend ? JSON.stringify(snapshot.backend) : "—"}
                  </code>
                </div>
                <div>
                  <span className="text-muted-foreground">Last sync: </span>
                  <code>{snapshot.lastSyncAt ?? "—"}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">Limits: </span>
                  <code>{JSON.stringify(DEMO_LIMITS)}</code>
                </div>
              </div>
            </details>
          </div>
        </div>
      )}
    </>
  );
}
