import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CloudUpload,
  Trash2,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import PageContainer from "@/components/PageContainer";
import SEOHead from "@/components/SEOHead";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useFreemiumLimits, FREE_LIMITS } from "@/hooks/useFreemiumLimits";
import { supabase } from "@/integrations/supabase/client";
import {
  readGuestPatients,
  readGuestAppointments,
  clearGuestStorage,
  markGuestSyncAcknowledged,
  hasGuestData,
  clearGuestSyncLock,
  writeGuestSyncSummary,
  normalizeName,
  normalizeEmail,
  appointmentKey,
  beginMerge,
  endMerge,
  hasMergedFor,
  isMergeInFlight,
  type GuestPatient,
  type GuestAppointment,
  type GuestSyncSummary,
} from "@/lib/guestStorage";

/**
 * /sync-guest-data — interstitial page shown right after login when the user
 * still has guest patients/appointments in localStorage.
 *
 * Three outcomes:
 *  1. Mesclar  → import everything to Supabase respecting:
 *                 - the free quota (5/5)
 *                 - duplicate detection (name for patients, name+date+time for
 *                   appointments) against existing Supabase rows AND within
 *                   the incoming batch.
 *  2. Descartar → wipes localStorage and goes back to the dashboard.
 *  3. Decidir depois → just acknowledges and dismisses the screen.
 *
 * After merge/discard the user is sent to /sync-guest-data/done with a summary.
 */
const SyncGuestData = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const { user, loading: authLoading } = useAuth();
  const { isPaid, patientsCount, appointmentsCount, isLoading: limitsLoading } =
    useFreemiumLimits();

  const guestPatients = useMemo<GuestPatient[]>(() => readGuestPatients(), []);
  const guestAppointments = useMemo<GuestAppointment[]>(
    () => readGuestAppointments(),
    [],
  );

  const [importPatients, setImportPatients] = useState(true);
  const [importAppointments, setImportAppointments] = useState(true);
  const [merging, setMerging] = useState(false);

  // ── Guards ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent("/sync-guest-data")}`, { replace: true });
      return;
    }
    if (!hasGuestData()) {
      // Nothing to merge — just acknowledge so the toast/route stops firing.
      markGuestSyncAcknowledged();
      clearGuestSyncLock();
      navigate(next, { replace: true });
    }
  }, [authLoading, user, navigate, next]);

  // Quota math (only meaningful for non-paid users)
  const patientSlotsLeft = isPaid
    ? guestPatients.length
    : Math.max(0, FREE_LIMITS.patients - patientsCount);
  const appointmentSlotsLeft = isPaid
    ? guestAppointments.length
    : Math.max(0, FREE_LIMITS.appointments - appointmentsCount);

  const patientsTrimmed = Math.max(
    0,
    guestPatients.length - (isPaid ? guestPatients.length : patientSlotsLeft),
  );
  const appointmentsTrimmed = Math.max(
    0,
    guestAppointments.length - (isPaid ? guestAppointments.length : appointmentSlotsLeft),
  );

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleMerge = async () => {
    if (!user) return;
    setMerging(true);

    const summary: GuestSyncSummary = {
      outcome: "merged",
      patients: { imported: 0, skippedDuplicate: 0, skippedQuota: 0 },
      appointments: { imported: 0, skippedDuplicate: 0, skippedQuota: 0 },
      duplicates: { patients: [], appointments: [] },
      at: new Date().toISOString(),
    };

    try {
      // ── PATIENTS ────────────────────────────────────────────────────────
      if (importPatients && guestPatients.length > 0) {
        // Existing names + emails in Supabase (RLS-scoped to this user)
        const { data: existing, error: exErr } = await supabase
          .from("patients")
          .select("name, email");
        if (exErr) throw exErr;
        const seenNames = new Set<string>(
          (existing ?? []).map((r) => normalizeName(r.name)),
        );
        const seenEmails = new Set<string>(
          (existing ?? [])
            .map((r) => normalizeEmail((r as any).email))
            .filter((e) => e.length > 0),
        );

        const accepted: GuestPatient[] = [];
        for (const p of guestPatients) {
          const nameKey = normalizeName(p.name);
          const emailKey = normalizeEmail(p.email);
          // Email match wins as the more specific criterion
          if (emailKey && seenEmails.has(emailKey)) {
            summary.patients.skippedDuplicate += 1;
            summary.duplicates.patients.push({ label: `${p.name} <${p.email}>`, reason: "email" });
            continue;
          }
          if (seenNames.has(nameKey)) {
            summary.patients.skippedDuplicate += 1;
            summary.duplicates.patients.push({ label: p.name, reason: "name" });
            continue;
          }
          if (!isPaid && accepted.length >= patientSlotsLeft) {
            summary.patients.skippedQuota += 1;
            continue;
          }
          accepted.push(p);
          seenNames.add(nameKey);
          if (emailKey) seenEmails.add(emailKey);
        }

        if (accepted.length > 0) {
          const rows = accepted.map((p) => ({
            user_id: user.id,
            name: p.name,
            phone: p.phone ?? null,
            email: p.email ?? null,
            notes: p.notes ?? null,
          }));
          const { error, data } = await supabase
            .from("patients")
            .insert(rows)
            .select("id");
          if (error) throw error;
          summary.patients.imported = data?.length ?? rows.length;
        }
      } else if (!importPatients) {
        summary.patients.skippedQuota = guestPatients.length;
      }

      // ── APPOINTMENTS ────────────────────────────────────────────────────
      if (importAppointments && guestAppointments.length > 0) {
        const { data: existing, error: exErr } = await supabase
          .from("appointments")
          .select("patient_name, date, time");
        if (exErr) throw exErr;
        const seen = new Set<string>(
          (existing ?? []).map((r) =>
            appointmentKey(r.patient_name as string, r.date as string, r.time as string),
          ),
        );

        const accepted: GuestAppointment[] = [];
        for (const a of guestAppointments) {
          const key = appointmentKey(a.patient_name, a.date, a.time);
          if (seen.has(key)) {
            summary.appointments.skippedDuplicate += 1;
            summary.duplicates.appointments.push({
              label: `${a.patient_name} — ${a.date.split("-").reverse().slice(0, 2).join("/")} ${a.time}`,
              reason: "name+date+time",
            });
            continue;
          }
          if (!isPaid && accepted.length >= appointmentSlotsLeft) {
            summary.appointments.skippedQuota += 1;
            continue;
          }
          accepted.push(a);
          seen.add(key);
        }

        if (accepted.length > 0) {
          const rows = accepted.map((a) => ({
            user_id: user.id,
            patient_name: a.patient_name,
            date: a.date,
            time: a.time,
            appointment_type: a.appointment_type,
            notes: a.notes ?? null,
            status: "scheduled",
          }));
          const { error, data } = await supabase
            .from("appointments")
            .insert(rows)
            .select("id");
          if (error) throw error;
          summary.appointments.imported = data?.length ?? rows.length;
        }
      } else if (!importAppointments) {
        summary.appointments.skippedQuota = guestAppointments.length;
      }

      clearGuestStorage();
      markGuestSyncAcknowledged();
      clearGuestSyncLock();
      writeGuestSyncSummary(summary);
      navigate(`/sync-guest-data/done?next=${encodeURIComponent(next)}`, { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Falha ao importar dados do modo guest.");
      setMerging(false);
    }
  };

  const handleDiscard = () => {
    const summary: GuestSyncSummary = {
      outcome: "discarded",
      patients: { imported: 0, skippedDuplicate: 0, skippedQuota: guestPatients.length },
      appointments: { imported: 0, skippedDuplicate: 0, skippedQuota: guestAppointments.length },
      duplicates: { patients: [], appointments: [] },
      at: new Date().toISOString(),
    };
    clearGuestStorage();
    markGuestSyncAcknowledged();
    clearGuestSyncLock();
    writeGuestSyncSummary(summary);
    navigate(`/sync-guest-data/done?next=${encodeURIComponent(next)}`, { replace: true });
  };

  const handleLater = () => {
    markGuestSyncAcknowledged();
    clearGuestSyncLock();
    toast.info("Você pode voltar nesta tela manualmente em /sync-guest-data.");
    navigate(next, { replace: true });
  };

  if (authLoading || limitsLoading) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-md py-10 text-center text-sm text-muted-foreground">
          Carregando…
        </div>
      </PageContainer>
    );
  }

  const nothingToImport = guestPatients.length === 0 && guestAppointments.length === 0;

  return (
    <>
      <SEOHead
        title="Sincronizar dados do modo guest | SALBCARE"
        description="Mescle ou descarte os pacientes e consultas que você criou no modo guest."
        canonical="/sync-guest-data"
      />
      <PageContainer>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md space-y-5 py-4"
          data-testid="sync-guest-data"
        >
          <header className="space-y-1.5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <CloudUpload className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold">Sincronizar rascunhos do modo guest</h1>
            <p className="text-xs text-muted-foreground">
              Detectamos pacientes e consultas que você criou antes de logar.
              Decida o que fazer com eles. Duplicados serão ignorados automaticamente.
            </p>
          </header>

          {/* Bloco: Pacientes */}
          {guestPatients.length > 0 && (
            <section
              className="glass-card p-4 space-y-3"
              data-testid="sync-patients-section"
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={importPatients}
                  onCheckedChange={(v) => setImportPatients(v === true)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">
                      {guestPatients.length} paciente
                      {guestPatients.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isPaid
                      ? "Plano Essencial — todos cabem (após dedup)."
                      : `Plano grátis: até ${patientSlotsLeft} cabem (${patientsCount}/${FREE_LIMITS.patients} já usados).`}
                  </p>
                </div>
              </label>
              {patientsTrimmed > 0 && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 text-[11px]">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Até {patientsTrimmed} paciente(s) podem ficar de fora por limite
                    do plano grátis.
                  </span>
                </div>
              )}
            </section>
          )}

          {/* Bloco: Consultas */}
          {guestAppointments.length > 0 && (
            <section
              className="glass-card p-4 space-y-3"
              data-testid="sync-appointments-section"
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={importAppointments}
                  onCheckedChange={(v) => setImportAppointments(v === true)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">
                      {guestAppointments.length} consulta
                      {guestAppointments.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isPaid
                      ? "Plano Essencial — todas cabem (após dedup)."
                      : `Plano grátis: até ${appointmentSlotsLeft} cabem (${appointmentsCount}/${FREE_LIMITS.appointments} já usadas).`}
                  </p>
                </div>
              </label>
              {appointmentsTrimmed > 0 && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 text-[11px]">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Até {appointmentsTrimmed} consulta(s) podem ficar de fora por
                    limite do plano grátis.
                  </span>
                </div>
              )}
            </section>
          )}

          {/* Upgrade nudge para usuários free com sobras */}
          {!isPaid && (patientsTrimmed > 0 || appointmentsTrimmed > 0) && (
            <Button asChild variant="outline" className="w-full" size="sm">
              <Link to="/upgrade?reason=guest_sync">
                Atualizar para importar tudo
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          )}

          {/* Ações principais */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={handleMerge}
              disabled={merging || nothingToImport}
              className="w-full gradient-primary font-semibold"
              data-testid="sync-merge-btn"
            >
              {merging ? (
                "Importando…"
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mesclar com a minha conta
                </>
              )}
            </Button>
            <Button
              onClick={handleDiscard}
              disabled={merging}
              variant="outline"
              className="w-full"
              data-testid="sync-discard-btn"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Descartar rascunhos
            </Button>
            <Button
              onClick={handleLater}
              disabled={merging}
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              data-testid="sync-later-btn"
            >
              Decidir depois
            </Button>
          </div>
        </motion.div>
      </PageContainer>
    </>
  );
};

export default SyncGuestData;
