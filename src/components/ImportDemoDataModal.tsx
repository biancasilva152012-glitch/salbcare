import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, Loader2, CheckCircle2, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  hasMigratableDemoData,
  migrateDemoToAccount,
  readDemoAppointments,
  readDemoPatients,
  clearDemoStorage,
} from "@/lib/demoStorage";

type Props = {
  userId: string | null;
  /** Called once the modal closes (either after migrating or skipping). */
  onDone?: () => void;
};

/**
 * Shown right after a successful sign-up. If the visitor has data left in
 * the /experimente local demo, we offer to import it into their fresh account.
 */
export default function ImportDemoDataModal({ userId, onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [counts, setCounts] = useState({ patients: 0, appointments: 0 });

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
    onDone?.();
  };

  const importNow = async () => {
    if (!userId) return;
    setBusy(true);
    const result = await migrateDemoToAccount(userId);
    setBusy(false);
    if (result.errors.length) {
      toast.error(`Não consegui importar tudo: ${result.errors.join(" • ")}`);
      return;
    }
    toast.success(
      `Importado: ${result.patients} paciente(s) e ${result.appointments} consulta(s)`,
    );
    close();
  };

  const skip = () => {
    clearDemoStorage();
    close();
  };

  if (!open) return null;

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
            Vão ficar vinculados à sua conta nova. Você pode editar ou apagar depois.
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
