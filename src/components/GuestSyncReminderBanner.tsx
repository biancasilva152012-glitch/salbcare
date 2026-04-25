import { Link } from "react-router-dom";
import { CloudUpload, Users, Calendar, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  hasGuestData,
  readGuestPatients,
  readGuestAppointments,
} from "@/lib/guestStorage";

const DISMISS_KEY = "salbcare_guest_sync_reminder_dismissed_at";

const wasDismissedRecently = () => {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Date.parse(raw);
    if (!Number.isFinite(ts)) return false;
    // Hide for 30 minutes after the user dismisses, then show again so we
    // don't permanently lose the merge offer if they navigated away.
    return Date.now() - ts < 30 * 60 * 1000;
  } catch {
    return false;
  }
};

const dismiss = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISS_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
};

/**
 * Soft, dismissible reminder shown on the authenticated dashboard whenever
 * leftover guest data exists in localStorage but the user already saw the
 * forced redirect once and chose "later" (acknowledged).
 *
 * Counterpart to GuestSyncLockBanner (which is read-only and lives on
 * Patients/Agenda). This one is a CTA-only nudge so the user can still merge
 * their work in instead of permanently losing it.
 */
const GuestSyncReminderBanner = () => {
  const [hidden, setHidden] = useState(() => wasDismissedRecently());
  if (hidden) return null;
  if (!hasGuestData()) return null;

  const pendingPatients = readGuestPatients().length;
  const pendingAppointments = readGuestAppointments().length;

  return (
    <div
      className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 space-y-3"
      data-testid="guest-sync-reminder-banner"
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
          <CloudUpload className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">
            Você tem dados do modo visitante para importar
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mescle agora para não perder o que você criou antes do login.
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {pendingPatients} paciente{pendingPatients === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {pendingAppointments} consulta{pendingAppointments === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            dismiss();
            setHidden(true);
          }}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Fechar lembrete"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button asChild size="sm" className="gradient-primary font-semibold flex-1">
          <Link
            to="/sync-guest-data?next=/dashboard"
            data-testid="guest-sync-reminder-cta"
          >
            Sincronizar agora
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default GuestSyncReminderBanner;
