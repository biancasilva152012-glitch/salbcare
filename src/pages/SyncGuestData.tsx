import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CloudUpload,
  Trash2,
  Users,
  Calendar,
  Video,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
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

  // Per-step progress used by the progress bar. "pending" → "running" → "done"
  // (or "failed"). Teleconsultas é uma etapa apenas de placeholder por
  // enquanto (não há rascunhos guest delas), mas mostramos o status para o
  // usuário ter visibilidade.
  type StepStatus = "pending" | "running" | "done" | "failed" | "skipped";
  type Steps = {
    patients: StepStatus;
    appointments: StepStatus;
    teleconsultations: StepStatus;
  };
  const initialSteps = (): Steps => ({
    patients: "pending",
    appointments: "pending",
    teleconsultations: "pending",
  });
  const [steps, setSteps] = useState<Steps>(initialSteps);
  const [lastError, setLastError] = useState<string | null>(null);
  /** Per-step error so we can show "tentar só Pacientes" / "tentar só Agendamentos". */
  const [stepError, setStepError] = useState<{
    patients?: string;
    appointments?: string;
  }>({});

  // Running summary accumulated across (possibly partial) retries. We use a
  // single object so the footer can show live counts before the user confirms,
  // and so retrying only the failed step adds to (not replaces) what already
  // succeeded.
  const emptySummary = (): GuestSyncSummary => ({
    outcome: "merged",
    patients: { imported: 0, skippedDuplicate: 0, skippedQuota: 0 },
    appointments: { imported: 0, skippedDuplicate: 0, skippedQuota: 0 },
    duplicates: { patients: [], appointments: [] },
    at: new Date().toISOString(),
  });
  const [liveSummary, setLiveSummary] = useState<GuestSyncSummary>(emptySummary);
  /** Patients/Appointments still pending in localStorage (not yet imported nor
   *  permanently skipped). After a step succeeds we drop the imported items
   *  from this list so a retry only re-tries what's left. */
  const [pendingPatients, setPendingPatients] = useState<GuestPatient[]>(() =>
    readGuestPatients(),
  );
  const [pendingAppointments, setPendingAppointments] = useState<GuestAppointment[]>(
    () => readGuestAppointments(),
  );

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
  /**
   * Each step is a self-contained async function so the UI can retry just the
   * failed one (e.g. only Pacientes or only Agendamentos). Steps mutate the
   * `liveSummary` and the local pending lists so the running totals stay
   * coherent across partial retries.
   */
  type StepKey = "patients" | "appointments";

  const runPatientsStep = async (): Promise<void> => {
    if (!user) return;
    setSteps((s) => ({ ...s, patients: "running" }));
    setStepError((e) => ({ ...e, patients: undefined }));

    if (!importPatients) {
      setLiveSummary((s) => ({
        ...s,
        patients: { ...s.patients, skippedQuota: pendingPatients.length },
      }));
      setSteps((s) => ({ ...s, patients: "skipped" }));
      return;
    }
    if (pendingPatients.length === 0) {
      setSteps((s) => ({ ...s, patients: "done" }));
      return;
    }

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
    const newDuplicates: typeof liveSummary.duplicates.patients = [];
    let skippedDup = 0;
    let skippedQuota = 0;
    for (const p of pendingPatients) {
      const nameKey = normalizeName(p.name);
      const emailKey = normalizeEmail(p.email);
      if (emailKey && seenEmails.has(emailKey)) {
        skippedDup += 1;
        newDuplicates.push({ label: `${p.name} <${p.email}>`, reason: "email" });
        continue;
      }
      if (seenNames.has(nameKey)) {
        skippedDup += 1;
        newDuplicates.push({ label: p.name, reason: "name" });
        continue;
      }
      if (!isPaid && accepted.length >= patientSlotsLeft) {
        skippedQuota += 1;
        continue;
      }
      accepted.push(p);
      seenNames.add(nameKey);
      if (emailKey) seenEmails.add(emailKey);
    }

    let importedCount = 0;
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
      importedCount = data?.length ?? rows.length;
    }

    setPendingPatients([]);
    setLiveSummary((s) => ({
      ...s,
      patients: {
        imported: s.patients.imported + importedCount,
        skippedDuplicate: s.patients.skippedDuplicate + skippedDup,
        skippedQuota: s.patients.skippedQuota + skippedQuota,
      },
      duplicates: {
        ...s.duplicates,
        patients: [...s.duplicates.patients, ...newDuplicates],
      },
    }));
    setSteps((s) => ({ ...s, patients: "done" }));
  };

  const runAppointmentsStep = async (): Promise<void> => {
    if (!user) return;
    setSteps((s) => ({ ...s, appointments: "running" }));
    setStepError((e) => ({ ...e, appointments: undefined }));

    if (!importAppointments) {
      setLiveSummary((s) => ({
        ...s,
        appointments: { ...s.appointments, skippedQuota: pendingAppointments.length },
      }));
      setSteps((s) => ({ ...s, appointments: "skipped" }));
      return;
    }
    if (pendingAppointments.length === 0) {
      setSteps((s) => ({ ...s, appointments: "done" }));
      return;
    }

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
    const newDuplicates: typeof liveSummary.duplicates.appointments = [];
    let skippedDup = 0;
    let skippedQuota = 0;
    for (const a of pendingAppointments) {
      const key = appointmentKey(a.patient_name, a.date, a.time);
      if (seen.has(key)) {
        skippedDup += 1;
        newDuplicates.push({
          label: `${a.patient_name} — ${a.date.split("-").reverse().slice(0, 2).join("/")} ${a.time}`,
          reason: "name+date+time",
        });
        continue;
      }
      if (!isPaid && accepted.length >= appointmentSlotsLeft) {
        skippedQuota += 1;
        continue;
      }
      accepted.push(a);
      seen.add(key);
    }

    let importedCount = 0;
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
      importedCount = data?.length ?? rows.length;
    }

    setPendingAppointments([]);
    setLiveSummary((s) => ({
      ...s,
      appointments: {
        imported: s.appointments.imported + importedCount,
        skippedDuplicate: s.appointments.skippedDuplicate + skippedDup,
        skippedQuota: s.appointments.skippedQuota + skippedQuota,
      },
      duplicates: {
        ...s.duplicates,
        appointments: [...s.duplicates.appointments, ...newDuplicates],
      },
    }));
    setSteps((s) => ({ ...s, appointments: "done" }));
  };

  const finalize = () => {
    if (!user) return;
    setSteps((s) => ({ ...s, teleconsultations: "skipped" }));
    const finalSummary: GuestSyncSummary = { ...liveSummary, at: new Date().toISOString() };
    clearGuestStorage();
    markGuestSyncAcknowledged();
    clearGuestSyncLock();
    endMerge(user.id);
    writeGuestSyncSummary(finalSummary);
    navigate(`/sync-guest-data/done?next=${encodeURIComponent(next)}`, { replace: true });
  };

  const runMerge = async (scope: "all" | StepKey) => {
    if (!user) return;

    if (hasMergedFor(user.id)) {
      toast.info("Os dados de visitante já foram importados nesta conta.");
      clearGuestStorage();
      markGuestSyncAcknowledged();
      clearGuestSyncLock();
      navigate(next, { replace: true });
      return;
    }
    if (isMergeInFlight(user.id)) {
      toast.info("Importação já em andamento — aguarde…");
      return;
    }
    if (!beginMerge(user.id)) {
      toast.error("Não foi possível iniciar a importação. Tente novamente.");
      return;
    }

    setMerging(true);
    setLastError(null);

    const stepsToRun: StepKey[] =
      scope === "all" ? ["patients", "appointments"] : [scope];

    let anyStepFailed = false;
    for (const k of stepsToRun) {
      try {
        if (k === "patients") await runPatientsStep();
        else await runAppointmentsStep();
      } catch (err: any) {
        anyStepFailed = true;
        const msg =
          err?.message ??
          `Falha ao importar ${k === "patients" ? "pacientes" : "agendamentos"}.`;
        setStepError((e) => ({ ...e, [k]: msg }));
        setLastError(msg);
        setSteps((s) => ({ ...s, [k]: "failed" }));
        toast.error(msg);
        break;
      }
    }

    try {
      window.localStorage.removeItem("salbcare_guest_sync_inflight");
    } catch {
      /* ignore */
    }

    if (anyStepFailed) {
      setMerging(false);
      return;
    }

    setSteps((s) => {
      const allDoneOrSkipped =
        (s.patients === "done" || s.patients === "skipped") &&
        (s.appointments === "done" || s.appointments === "skipped");
      if (allDoneOrSkipped) {
        setTimeout(finalize, 0);
      } else {
        setMerging(false);
      }
      return s;
    });
  };

  const handleMerge = () => {
    void runMerge("all");
  };
  const handleRetry = () => {
    setSteps(initialSteps());
    setStepError({});
    setLastError(null);
    void runMerge("all");
  };
  const handleRetryStep = (k: StepKey) => {
    void runMerge(k);
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
    if (user) endMerge(user.id);
    writeGuestSyncSummary(summary);
    navigate(`/sync-guest-data/done?next=${encodeURIComponent(next)}`, { replace: true });
  };

  /**
   * "Limpar manualmente" — wipes the local guest data without going through the
   * import/discard flow. Useful when the user just wants the guest cache gone
   * (e.g. fixed on another device) and stays on the same page so they can
   * confirm the counters dropped to zero.
   */
  const handleManualClear = () => {
    const totalP = guestPatients.length;
    const totalA = guestAppointments.length;
    if (totalP === 0 && totalA === 0) {
      toast.info("Não há dados de visitante para limpar.");
      return;
    }
    const ok = window.confirm(
      `Apagar ${totalP} paciente(s) e ${totalA} consulta(s) do visitante neste navegador? Esta ação não pode ser desfeita.`,
    );
    if (!ok) return;
    clearGuestStorage();
    markGuestSyncAcknowledged();
    clearGuestSyncLock();
    toast.success("Dados de visitante removidos deste navegador.");
    navigate(next, { replace: true });
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

          {/* Progresso por etapa (visível durante e após a importação) */}
          {(merging || lastError || Object.values(steps).some((s) => s !== "pending")) && (
            <section
              className="glass-card p-4 space-y-3"
              data-testid="sync-progress"
              aria-live="polite"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">Progresso da importação</p>
                <span className="text-[11px] text-muted-foreground" data-testid="sync-progress-percent">
                  {(() => {
                    const total = 3;
                    const completed = Object.values(steps).filter(
                      (s) => s === "done" || s === "skipped",
                    ).length;
                    return `${Math.round((completed / total) * 100)}%`;
                  })()}
                </span>
              </div>
              <Progress
                value={
                  (Object.values(steps).filter((s) => s === "done" || s === "skipped").length / 3) *
                  100
                }
                className="h-2"
              />
              <ul className="space-y-1.5 text-[12px]">
                {([
                  { key: "patients", label: "Pacientes", icon: Users },
                  { key: "appointments", label: "Agendamentos", icon: Calendar },
                  { key: "teleconsultations", label: "Teleconsultas", icon: Video },
                ] as const).map(({ key, label, icon: Icon }) => {
                  const st = steps[key];
                  const dot =
                    st === "done"
                      ? "bg-emerald-500"
                      : st === "running"
                        ? "bg-primary animate-pulse"
                        : st === "failed"
                          ? "bg-destructive"
                          : st === "skipped"
                            ? "bg-muted-foreground/40"
                            : "bg-muted-foreground/20";
                  const labelSt =
                    st === "done"
                      ? "concluído"
                      : st === "running"
                        ? "em andamento…"
                        : st === "failed"
                          ? "falhou"
                          : st === "skipped"
                            ? "pulado"
                            : "aguardando";
                  return (
                    <li key={key} className="flex items-center gap-2" data-testid={`sync-step-${key}`}>
                      <span className={`inline-block h-2 w-2 rounded-full ${dot}`} aria-hidden />
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground">— {labelSt}</span>
                    </li>
                  );
                })}
              </ul>

              {lastError && (
                <div
                  className="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-[11px] text-destructive"
                  data-testid="sync-error"
                >
                  {lastError}
                </div>
              )}

              {lastError && !merging && (
                <Button
                  onClick={handleRetry}
                  size="sm"
                  variant="outline"
                  className="w-full"
                  data-testid="sync-retry-btn"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Tentar importar novamente
                </Button>
              )}
            </section>
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
              onClick={handleManualClear}
              disabled={merging}
              variant="ghost"
              size="sm"
              className="w-full text-destructive hover:text-destructive"
              data-testid="sync-manual-clear-btn"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Limpar manualmente os dados deste navegador
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
