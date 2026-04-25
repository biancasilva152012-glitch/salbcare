import { Link } from "react-router-dom";
import { Lock, ArrowRight, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  readGuestPatients,
  readGuestAppointments,
} from "@/lib/guestStorage";

/**
 * Inline read-only banner shown on Patients/Agenda when the user logged in but
 * still has unresolved guest drafts. Encourages going to /sync-guest-data
 * before creating new rows that could collide with the pending merge.
 *
 * Surfaces a quick count of pending items so the user knows what they're
 * about to resolve before clicking through.
 */
const GuestSyncLockBanner = ({ section }: { section: "pacientes" | "agenda" }) => {
  const pendingPatients = readGuestPatients().length;
  const pendingAppointments = readGuestAppointments().length;

  return (
    <div
      className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 flex items-start gap-3 text-sm"
      data-testid="guest-sync-lock-banner"
      role="status"
    >
      <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-amber-800 dark:text-amber-200">
          Modo somente leitura
        </p>
        <p className="text-xs text-amber-700/90 dark:text-amber-300/90 mt-0.5">
          Você ainda tem rascunhos do modo guest pendentes. Sincronize-os antes
          de criar, editar ou salvar nov{section === "agenda" ? "as consultas" : "os pacientes"}{" "}
          para evitar duplicatas.
        </p>

        {/* Quick pending-count summary */}
        <div
          className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-amber-700/90 dark:text-amber-300/90"
          data-testid="guest-sync-lock-pending"
        >
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {pendingPatients} paciente{pendingPatients === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {pendingAppointments} consulta{pendingAppointments === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline" className="h-7 text-xs">
            <Link
              to={`/sync-guest-data?next=/dashboard/${section}`}
              data-testid="guest-sync-lock-resolve"
            >
              Resolver agora
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
          <Link
            to={`/sync-guest-data?next=/dashboard/${section}`}
            className="text-xs font-medium text-amber-800 dark:text-amber-200 underline underline-offset-2 hover:opacity-80"
            data-testid="guest-sync-lock-details"
          >
            Ver detalhes pendentes
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GuestSyncLockBanner;
