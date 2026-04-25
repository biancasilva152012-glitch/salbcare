import { Link } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Inline read-only banner shown on Patients/Agenda when the user logged in but
 * still has unresolved guest drafts. Encourages going to /sync-guest-data
 * before creating new rows that could collide with the pending merge.
 */
const GuestSyncLockBanner = ({ section }: { section: "pacientes" | "agenda" }) => (
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
        de criar nov{section === "agenda" ? "as consultas" : "os pacientes"}{" "}
        para evitar duplicatas.
      </p>
      <Button asChild size="sm" variant="outline" className="mt-2 h-7 text-xs">
        <Link to={`/sync-guest-data?next=/dashboard/${section}`}>
          Resolver agora
          <ArrowRight className="h-3 w-3 ml-1" />
        </Link>
      </Button>
    </div>
  </div>
);

export default GuestSyncLockBanner;
