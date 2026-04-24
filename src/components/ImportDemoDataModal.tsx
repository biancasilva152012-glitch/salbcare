import { useEffect, useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  X,
  AlertTriangle,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  hasMigratableDemoData,
  migrateDemoToAccount,
  readDemoAppointments,
  readDemoPatients,
  clearDemoStorage,
  type MigrationResult,
} from "@/lib/demoStorage";

type Props = {
  userId: string | null;
  /** Called once the modal closes (either after migrating or skipping). */
  onDone?: () => void;
};

/**
 * Shown right after a successful sign-up / first authenticated landing.
 * If the visitor still has data sitting in /experimente localStorage, we
 * offer to import it into their fresh account and then display a clear
 * summary of what was imported and any conflicts that were skipped.
 */
export default function ImportDemoDataModal({ userId, onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [counts, setCounts] = useState({ patients: 0, appointments: 0 });
  const [summary, setSummary] = useState<MigrationResult | null>(null);

  useEffect(() => {
    if (!userId) return;
    if (!hasMigratableDemoData()) return;
    setCounts({
      patients: readDemoPatients().length,
      appointments: readDemoAppointments().length,
    });
    setOpen(true);
  }, [userId]);

  const close = () => {
    setOpen(false);
    setSummary(null);
    onDone?.();
  };

  const importNow = async () => {
    if (!userId) return;
    setBusy(true);
    const result = await migrateDemoToAccount(userId);
    setBusy(false);
    setSummary(result);
    if (result.errors.length) {
      toast.error("Importação parcial — veja o resumo");
    } else if (result.conflicts.length > 0) {
      toast.success(
        `${result.patients + result.appointments} item(ns) importado(s) • ${result.conflicts.length} conflito(s)`,
      );
    } else {
      toast.success(
        `${result.patients} paciente(s) e ${result.appointments} consulta(s) importado(s)`,
      );
    }
  };

  const skip = () => {
    clearDemoStorage();
    close();
  };

  if (!open) return null;

  // ===== Summary view (after import) =====
  if (summary) {
    const hasErrors = summary.errors.length > 0;
    const hasConflicts = summary.conflicts.length > 0;
    return (
      <Dialog open={open} onOpenChange={(v) => (v ? null : close())}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 px-6 pt-8 pb-6 text-center relative">
            <button
              onClick={close}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-bold">Resumo da importação</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {hasErrors
                ? "Alguns itens não puderam ser migrados."
                : "Tudo pronto na sua conta nova."}
            </p>
          </div>

          <div className="px-6 py-4 space-y-3 max-h-[50vh] overflow-y-auto">
            {/* Imported */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Importados
              </p>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>
                  <strong>{summary.patients}</strong> paciente
                  {summary.patients === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>
                  <strong>{summary.appointments}</strong> consulta
                  {summary.appointments === 1 ? "" : "s"}
                </span>
              </div>
              {summary.importedPatientNames.length > 0 && (
                <ul className="text-[11px] text-muted-foreground list-disc pl-5 pt-1 space-y-0.5">
                  {summary.importedPatientNames.slice(0, 5).map((n) => (
                    <li key={`p-${n}`}>{n}</li>
                  ))}
                  {summary.importedPatientNames.length > 5 && (
                    <li>+{summary.importedPatientNames.length - 5} outros</li>
                  )}
                </ul>
              )}
              {summary.importedAppointmentLabels.length > 0 && (
                <ul className="text-[11px] text-muted-foreground list-disc pl-5 pt-1 space-y-0.5">
                  {summary.importedAppointmentLabels.slice(0, 5).map((n) => (
                    <li key={`a-${n}`}>{n}</li>
                  ))}
                  {summary.importedAppointmentLabels.length > 5 && (
                    <li>+{summary.importedAppointmentLabels.length - 5} outras</li>
                  )}
                </ul>
              )}
            </div>

            {/* Conflicts */}
            {hasConflicts && (
              <div className="space-y-1.5 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {summary.conflicts.length} conflito
                  {summary.conflicts.length === 1 ? "" : "s"} pulado
                  {summary.conflicts.length === 1 ? "" : "s"}
                </div>
                <ul className="text-[11px] text-muted-foreground list-disc pl-5 space-y-0.5">
                  {summary.conflicts.slice(0, 6).map((c, i) => (
                    <li key={i}>
                      <span className="font-medium text-foreground">{c.label}</span>{" "}
                      — {c.reason}
                    </li>
                  ))}
                  {summary.conflicts.length > 6 && (
                    <li>+{summary.conflicts.length - 6} outros</li>
                  )}
                </ul>
              </div>
            )}

            {/* Errors */}
            {hasErrors && (
              <div className="space-y-1 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Erros durante a importação
                </div>
                <ul className="text-[11px] text-muted-foreground list-disc pl-5 space-y-0.5">
                  {summary.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="px-6 pb-6">
            <Button onClick={close} className="w-full gradient-primary font-bold py-5">
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ===== Confirmation view (before import) =====
  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : skip())}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 px-6 pt-8 pb-6 text-center relative">
          <button
            onClick={skip}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold">Trazer seus dados da demo?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Encontrei o que você criou enquanto explorava sem cadastro.
          </p>
        </div>

        <div className="px-6 py-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <span>
              <strong>{counts.patients}</strong> paciente
              {counts.patients === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <span>
              <strong>{counts.appointments}</strong> consulta
              {counts.appointments === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            Vão ficar vinculados à sua conta nova. Itens duplicados serão pulados
            e listados no resumo.
          </p>
        </div>

        <div className="px-6 pb-6 space-y-2">
          <Button
            onClick={importNow}
            disabled={busy}
            className="w-full gradient-primary font-bold py-5"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importando…
              </>
            ) : (
              <>
                Sim, trazer tudo
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={skip}
            disabled={busy}
            className="w-full text-muted-foreground"
          >
            Não, começar do zero
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
