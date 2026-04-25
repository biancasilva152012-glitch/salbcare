import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Trash2,
  Users,
  Calendar,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";
import SEOHead from "@/components/SEOHead";
import {
  consumeGuestSyncSummary,
  type GuestSyncSummary,
  type DuplicateRecord,
} from "@/lib/guestStorage";

/**
 * /sync-guest-data/done — confirmation screen shown after the user merges or
 * discards their guest drafts. Displays:
 *  - what was imported (patients + appointments)
 *  - what was skipped (duplicates listed individually, quota counted)
 *  - a single CTA to go back to the dashboard
 */
const SyncGuestDataDone = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/dashboard";

  // Atomically read + delete the summary so back/refresh never replays it.
  const summary = useMemo<GuestSyncSummary | null>(() => consumeGuestSyncSummary(), []);
  const [showDuplicates, setShowDuplicates] = useState(false);

  // No summary? bounce back.
  useEffect(() => {
    if (!summary) navigate(next, { replace: true });
  }, [summary, next, navigate]);

  if (!summary) return null;

  const totalImported =
    summary.patients.imported + summary.appointments.imported;
  const totalDuplicates =
    summary.patients.skippedDuplicate + summary.appointments.skippedDuplicate;
  const totalQuota =
    summary.patients.skippedQuota + summary.appointments.skippedQuota;

  const isDiscard = summary.outcome === "discarded";

  return (
    <>
      <SEOHead
        title={isDiscard ? "Rascunhos descartados | SALBCARE" : "Sincronização concluída | SALBCARE"}
        description="Resumo da sincronização dos rascunhos do modo guest."
        canonical="/sync-guest-data/done"
      />
      <PageContainer>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md space-y-5 py-4"
          data-testid="sync-guest-data-done"
        >
          <header className="space-y-1.5 text-center">
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${
                isDiscard ? "bg-muted" : "bg-primary/10"
              }`}
            >
              {isDiscard ? (
                <Trash2 className="h-6 w-6 text-muted-foreground" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              )}
            </div>
            <h1 className="text-xl font-bold">
              {isDiscard ? "Rascunhos descartados" : "Sincronização concluída"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isDiscard
                ? "Removemos seus rascunhos do modo guest."
                : totalImported > 0
                  ? `Importamos ${totalImported} item(ns) para a sua conta.`
                  : "Nada novo foi importado — todos os rascunhos eram duplicados ou excederam o limite."}
            </p>
          </header>

          {/* Pacientes */}
          <section
            className="glass-card p-4 space-y-2"
            data-testid="done-patients-section"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Pacientes</p>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <Row label="Importados" value={summary.patients.imported} highlight />
              {summary.patients.skippedDuplicate > 0 && (
                <Row
                  label="Ignorados (já existiam)"
                  value={summary.patients.skippedDuplicate}
                />
              )}
              {summary.patients.skippedQuota > 0 && (
                <Row
                  label={isDiscard ? "Descartados" : "Não couberam no limite"}
                  value={summary.patients.skippedQuota}
                />
              )}
            </div>
          </section>

          {/* Consultas */}
          <section
            className="glass-card p-4 space-y-2"
            data-testid="done-appointments-section"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Consultas</p>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <Row label="Importadas" value={summary.appointments.imported} highlight />
              {summary.appointments.skippedDuplicate > 0 && (
                <Row
                  label="Ignoradas (já existiam)"
                  value={summary.appointments.skippedDuplicate}
                />
              )}
              {summary.appointments.skippedQuota > 0 && (
                <Row
                  label={isDiscard ? "Descartadas" : "Não couberam no limite"}
                  value={summary.appointments.skippedQuota}
                />
              )}
            </div>
          </section>

          {/* Lista de duplicados */}
          {totalDuplicates > 0 && (
            <section
              className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs"
              data-testid="done-duplicates-section"
            >
              <button
                type="button"
                onClick={() => setShowDuplicates((v) => !v)}
                className="flex w-full items-center justify-between gap-2 font-semibold text-amber-700 dark:text-amber-300"
              >
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {totalDuplicates} item(ns) ignorado(s) por duplicidade
                </span>
                {showDuplicates ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              {showDuplicates && (
                <ul className="mt-2 space-y-1 pl-5 list-disc text-muted-foreground" data-testid="done-duplicates-list">
                  {summary.duplicates.patients.map((d, i) => (
                    <li key={`p-${i}`}>
                      Paciente: {d.label}{" "}
                      <span className="text-[10px] uppercase tracking-wide opacity-70">
                        ({reasonLabel(d.reason)})
                      </span>
                    </li>
                  ))}
                  {summary.duplicates.appointments.map((d, i) => (
                    <li key={`a-${i}`}>
                      Consulta: {d.label}{" "}
                      <span className="text-[10px] uppercase tracking-wide opacity-70">
                        ({reasonLabel(d.reason)})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* Quota nudge */}
          {totalQuota > 0 && !isDiscard && (
            <Button asChild variant="outline" className="w-full" size="sm">
              <a href="/upgrade?reason=guest_sync_quota">
                Atualizar plano para subir o limite
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </a>
            </Button>
          )}

          <Button
            onClick={() => navigate(next, { replace: true })}
            className="w-full gradient-primary font-semibold"
            data-testid="done-back-btn"
          >
            Voltar ao dashboard
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </motion.div>
      </PageContainer>
    </>
  );
};

const Row = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) => (
  <div className="flex items-center justify-between">
    <span>{label}</span>
    <span
      className={
        highlight
          ? "font-semibold text-foreground tabular-nums"
          : "tabular-nums"
      }
    >
      {value}
    </span>
  </div>
);

export default SyncGuestDataDone;
