/**
 * Centralized helper for the anonymous /experimente demo session.
 * - Owns the localStorage keys
 * - Exposes a typed API for reading demo data and migrating it to a real account
 */

import { supabase } from "@/integrations/supabase/client";

export type DemoPatient = {
  id: string;
  name: string;
  phone: string;
  notes?: string;
};

export type DemoAppointment = {
  id: string;
  patient: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: "presencial" | "online";
};

export const DEMO_LIMITS = {
  patients: 5,
  appointments: 5,
  telehealthViews: 3,
  telehealthAttempts: 1,
} as const;

export type DemoModule = "patients" | "appointments" | "telehealth";

/**
 * Single source of truth mapping each module to its counter keys + limits.
 * Used by the unified `getModuleUsage` API so meters, Progress bars and the
 * contextual paywall always read from the same place.
 *
 * - `attempts` is the counter that drives the contextual block (premium action)
 * - `views` is informative only and NEVER blocks navigation
 */
export const DEMO_MODULE_CONFIG: Record<
  DemoModule,
  {
    attemptsKey: keyof DemoUsageCounters;
    attemptsLimit: number;
    viewsKey?: keyof DemoUsageCounters;
    viewsLimit?: number;
    label: string;
  }
> = {
  patients: {
    attemptsKey: "patientsCreated",
    attemptsLimit: DEMO_LIMITS.patients,
    label: "Pacientes",
  },
  appointments: {
    attemptsKey: "appointmentsCreated",
    attemptsLimit: DEMO_LIMITS.appointments,
    label: "Consultas",
  },
  telehealth: {
    attemptsKey: "telehealthAttempts",
    attemptsLimit: DEMO_LIMITS.telehealthAttempts,
    viewsKey: "telehealthViews",
    viewsLimit: DEMO_LIMITS.telehealthViews,
    label: "Teleconsulta",
  },
};

export const DEMO_STORAGE = {
  patients: "salbcare_demo_patients",
  appointments: "salbcare_demo_appointments",
  visited: "salbcare_demo_visited",
  activeTab: "salbcare_demo_active_tab",
  patientsSearch: "salbcare_demo_patients_search",
  patientsFilter: "salbcare_demo_patients_filter",
  appointmentsSearch: "salbcare_demo_appts_search",
  appointmentsFilter: "salbcare_demo_appts_filter",
  usageCounters: "salbcare_demo_usage_counters",
  lastMigration: "salbcare_demo_last_migration",
  guestId: "salbcare_demo_guest_id",
} as const;

/**
 * Stable opaque id for the anonymous demo session — created once per browser
 * and reused across visits so the backend can sync usage counters with the
 * eventual user account when the visitor signs up.
 */
export function getOrCreateGuestId(): string {
  if (typeof window === "undefined") return "ssr-guest";
  try {
    const existing = window.localStorage.getItem(DEMO_STORAGE.guestId);
    if (existing) return existing;
    const fresh = `guest_${crypto.randomUUID()}`;
    window.localStorage.setItem(DEMO_STORAGE.guestId, fresh);
    return fresh;
  } catch {
    return "fallback-guest";
  }
}

export type DemoUsageCounters = {
  patientsCreated: number;
  appointmentsCreated: number;
  telehealthViews: number;
  telehealthAttempts: number;
};

const EMPTY_COUNTERS: DemoUsageCounters = {
  patientsCreated: 0,
  appointmentsCreated: 0,
  telehealthViews: 0,
  telehealthAttempts: 0,
};

export function readUsageCounters(): DemoUsageCounters {
  return safeParse<DemoUsageCounters>(DEMO_STORAGE.usageCounters) ?? { ...EMPTY_COUNTERS };
}

export function incrementUsageCounter(key: keyof DemoUsageCounters): DemoUsageCounters {
  const current = readUsageCounters();
  const next = { ...current, [key]: current[key] + 1 };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(DEMO_STORAGE.usageCounters, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  return next;
}

/**
 * Force a counter to a specific value. Used to keep list-based counters
 * (patients/appointments) in sync with the actual list length so the meter
 * stays consistent after edits/deletes.
 */
export function setUsageCounter(
  key: keyof DemoUsageCounters,
  value: number,
): DemoUsageCounters {
  const current = readUsageCounters();
  const next = { ...current, [key]: Math.max(0, value) };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(DEMO_STORAGE.usageCounters, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  return next;
}

export type ModuleUsage = {
  module: DemoModule;
  label: string;
  used: number;
  limit: number;
  remaining: number;
  percent: number;
  /** True only when the premium *create* action is locked. Navigation/edit stays open. */
  blocked: boolean;
  /** Optional informative views counter (e.g. telehealth tab opens). Never blocks. */
  views?: { used: number; limit: number; remaining: number; percent: number };
};

/**
 * Unified read API for any module's usage. Reads counters + list lengths and
 * returns everything the UI (meter, Progress, contextual paywall) needs.
 *
 * IMPORTANT: only `attempts` (the create action) drives `blocked`. Views are
 * informative only — navigation in Patients, Agenda and Telehealth is always
 * open even after limits are reached.
 */
export function getModuleUsage(module: DemoModule): ModuleUsage {
  const cfg = DEMO_MODULE_CONFIG[module];
  const counters = readUsageCounters();

  // Patients/Appointments: the *current list length* is the source of truth
  // for "how many you have right now". This stays in sync even if the user
  // deletes records, while the counter store mirrors creation events.
  let used: number;
  if (module === "patients") used = readDemoPatients().length;
  else if (module === "appointments") used = readDemoAppointments().length;
  else used = counters[cfg.attemptsKey];

  const limit = cfg.attemptsLimit;
  const remaining = Math.max(0, limit - used);
  const percent = Math.min(100, (used / limit) * 100);

  let views: ModuleUsage["views"];
  if (cfg.viewsKey && cfg.viewsLimit) {
    const v = counters[cfg.viewsKey];
    views = {
      used: v,
      limit: cfg.viewsLimit,
      remaining: Math.max(0, cfg.viewsLimit - v),
      percent: Math.min(100, (v / cfg.viewsLimit) * 100),
    };
  }

  return {
    module,
    label: cfg.label,
    used,
    limit,
    remaining,
    percent,
    blocked: remaining === 0,
    views,
  };
}

export function getAllModuleUsage(): Record<DemoModule, ModuleUsage> {
  return {
    patients: getModuleUsage("patients"),
    appointments: getModuleUsage("appointments"),
    telehealth: getModuleUsage("telehealth"),
  };
}

function safeParse<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function readDemoPatients(): DemoPatient[] {
  return safeParse<DemoPatient[]>(DEMO_STORAGE.patients) ?? [];
}

export function readDemoAppointments(): DemoAppointment[] {
  return safeParse<DemoAppointment[]>(DEMO_STORAGE.appointments) ?? [];
}

/**
 * Returns true when the visitor produced anything worth migrating
 * (more than the seed data we ship with the demo).
 */
export function hasMigratableDemoData(): boolean {
  const p = readDemoPatients();
  const a = readDemoAppointments();
  return p.length > 0 || a.length > 0;
}

export function clearDemoStorage() {
  if (typeof window === "undefined") return;
  Object.values(DEMO_STORAGE).forEach((k) => {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  });
}

export type MigrationConflict = {
  kind: "patient" | "appointment";
  reason: string;
  label: string;
};

export type MigrationResult = {
  patients: number;
  appointments: number;
  skippedPatients: number;
  skippedAppointments: number;
  conflicts: MigrationConflict[];
  errors: string[];
  importedPatientNames: string[];
  importedAppointmentLabels: string[];
};

const emptyResult = (): MigrationResult => ({
  patients: 0,
  appointments: 0,
  skippedPatients: 0,
  skippedAppointments: 0,
  conflicts: [],
  errors: [],
  importedPatientNames: [],
  importedAppointmentLabels: [],
});

/**
 * Migrates the demo data stored in localStorage to the authenticated user's
 * Supabase tables. Detects conflicts against existing rows (same patient name
 * or same appointment date+time) and reports them in the result so the UI can
 * show a clear summary after the user confirms.
 *
 * Safe to call multiple times — clears local demo data on success.
 */
export async function migrateDemoToAccount(userId: string): Promise<MigrationResult> {
  const result = emptyResult();
  const demoPatients = readDemoPatients();
  const demoAppts = readDemoAppointments();

  if (demoPatients.length === 0 && demoAppts.length === 0) return result;

  // ---- Pre-fetch existing rows to detect conflicts ----
  const [existingPatientsRes, existingApptsRes] = await Promise.all([
    supabase.from("patients").select("id, name").eq("user_id", userId),
    supabase.from("appointments").select("id, date, time, patient_name").eq("user_id", userId),
  ]);

  const existingPatientByName = new Map<string, string>();
  (existingPatientsRes.data ?? []).forEach((row: { id: string; name: string }) => {
    existingPatientByName.set(row.name.trim().toLowerCase(), row.id);
  });
  const existingApptKeys = new Set<string>();
  (existingApptsRes.data ?? []).forEach((row: { date: string; time: string }) => {
    existingApptKeys.add(`${row.date}|${row.time}`);
  });

  // ---- Patients ----
  const insertedPatientByName: Record<string, string> = {};
  const patientsToInsert: typeof demoPatients = [];

  for (const p of demoPatients) {
    const key = p.name.trim().toLowerCase();
    const existingId = existingPatientByName.get(key);
    if (existingId) {
      // Reuse the existing patient — counts as a conflict, but we still link
      // their appointments so nothing is lost.
      insertedPatientByName[key] = existingId;
      result.skippedPatients += 1;
      result.conflicts.push({
        kind: "patient",
        reason: "Já existia na sua conta",
        label: p.name,
      });
    } else {
      patientsToInsert.push(p);
    }
  }

  if (patientsToInsert.length > 0) {
    const rows = patientsToInsert.map((p) => ({
      user_id: userId,
      name: p.name,
      phone: p.phone || null,
      notes: p.notes || null,
    }));
    const { data, error } = await supabase
      .from("patients")
      .insert(rows)
      .select("id, name");
    if (error) {
      result.errors.push(`Pacientes: ${error.message}`);
    } else if (data) {
      result.patients = data.length;
      data.forEach((row) => {
        insertedPatientByName[row.name.trim().toLowerCase()] = row.id;
        result.importedPatientNames.push(row.name);
      });
    }
  }

  // ---- Appointments — robust conflict key: patient (normalized) + date + time ----
  const normalizeName = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const existingApptByKey = new Map<
    string,
    { date: string; time: string; patient_name: string }
  >();
  (existingApptsRes.data ?? []).forEach(
    (row: { date: string; time: string; patient_name: string }) => {
      existingApptByKey.set(
        `${normalizeName(row.patient_name)}|${row.date}|${row.time}`,
        row,
      );
    },
  );
  const existingSlotByDateTime = new Map<string, string>();
  (existingApptsRes.data ?? []).forEach(
    (row: { date: string; time: string; patient_name: string }) => {
      existingSlotByDateTime.set(`${row.date}|${row.time}`, row.patient_name);
    },
  );

  const apptsToInsert: typeof demoAppts = [];
  for (const a of demoAppts) {
    const robustKey = `${normalizeName(a.patient)}|${a.date}|${a.time}`;
    const slotKey = `${a.date}|${a.time}`;
    const fmtDate = new Date(`${a.date}T00:00`).toLocaleDateString("pt-BR");

    if (existingApptByKey.has(robustKey)) {
      result.skippedAppointments += 1;
      result.conflicts.push({
        kind: "appointment",
        reason: `Consulta idêntica já existia (${a.patient} em ${fmtDate} às ${a.time})`,
        label: `${a.patient} — ${fmtDate} ${a.time}`,
      });
      continue;
    }
    if (existingSlotByDateTime.has(slotKey)) {
      const occupant = existingSlotByDateTime.get(slotKey);
      result.skippedAppointments += 1;
      result.conflicts.push({
        kind: "appointment",
        reason: `Horário ${fmtDate} ${a.time} já ocupado por ${occupant}`,
        label: `${a.patient} — ${fmtDate} ${a.time}`,
      });
      continue;
    }
    apptsToInsert.push(a);
  }

  if (apptsToInsert.length > 0) {
    const rows = apptsToInsert.map((a) => ({
      user_id: userId,
      patient_name: a.patient,
      patient_id: insertedPatientByName[normalizeName(a.patient)] ?? null,
      date: a.date,
      time: a.time,
      appointment_type: a.type,
      status: "scheduled",
    }));
    const { data, error } = await supabase
      .from("appointments")
      .insert(rows)
      .select("id, date, time, patient_name");
    if (error) {
      result.errors.push(`Consultas: ${error.message}`);
    } else if (data) {
      result.appointments = data.length;
      data.forEach((row: any) => {
        const fmt = new Date(`${row.date}T00:00`).toLocaleDateString("pt-BR");
        result.importedAppointmentLabels.push(
          `${row.patient_name} — ${fmt} ${row.time}`,
        );
      });
    }
  }

  // Persist a snapshot of the latest migration so the UI can re-show it later.
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        DEMO_STORAGE.lastMigration,
        JSON.stringify({ at: new Date().toISOString(), result }),
      );
    } catch {
      /* ignore */
    }
  }

  if (result.errors.length === 0) {
    clearDemoStorage();
  }

  return result;
}

// ============================================================================
// Backend counter sync — bridges localStorage with the demo_usage_counters table
// ============================================================================

type RemoteCountersRow = {
  patients_created: number;
  appointments_created: number;
  telehealth_views: number;
  telehealth_attempts: number;
};

const toLocalCounters = (row: RemoteCountersRow): DemoUsageCounters => ({
  patientsCreated: row.patients_created,
  appointmentsCreated: row.appointments_created,
  telehealthViews: row.telehealth_views,
  telehealthAttempts: row.telehealth_attempts,
});

const writeLocalCounters = (next: DemoUsageCounters) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DEMO_STORAGE.usageCounters,
      JSON.stringify(next),
    );
  } catch {
    /* ignore */
  }
};

/**
 * Fetches the latest counters from the backend (preferring the user-owned row
 * when authenticated, falling back to the guest row), reconciles them with
 * localStorage by taking the MAX of each counter, persists the result both
 * locally and remotely, and returns the merged values.
 *
 * Safe to call on every page load — it's idempotent and never decrements.
 */
export async function syncDemoCounters(
  userId: string | null,
): Promise<DemoUsageCounters> {
  const local = readUsageCounters();
  const guestId = getOrCreateGuestId();

  try {
    const query = userId
      ? supabase
          .from("demo_usage_counters")
          .select("patients_created,appointments_created,telehealth_views,telehealth_attempts")
          .eq("user_id", userId)
          .maybeSingle()
      : supabase
          .from("demo_usage_counters")
          .select("patients_created,appointments_created,telehealth_views,telehealth_attempts")
          .eq("guest_id", guestId)
          .maybeSingle();

    const { data: remote } = await query;

    const merged: DemoUsageCounters = remote
      ? {
          patientsCreated: Math.max(local.patientsCreated, remote.patients_created),
          appointmentsCreated: Math.max(local.appointmentsCreated, remote.appointments_created),
          telehealthViews: Math.max(local.telehealthViews, remote.telehealth_views),
          telehealthAttempts: Math.max(local.telehealthAttempts, remote.telehealth_attempts),
        }
      : local;

    writeLocalCounters(merged);

    // Push merged values back so the remote stays in sync.
    const payload = {
      patients_created: merged.patientsCreated,
      appointments_created: merged.appointmentsCreated,
      telehealth_views: merged.telehealthViews,
      telehealth_attempts: merged.telehealthAttempts,
      last_synced_at: new Date().toISOString(),
    };

    if (userId) {
      await supabase
        .from("demo_usage_counters")
        .upsert({ user_id: userId, ...payload }, { onConflict: "user_id" });
    } else {
      await supabase
        .from("demo_usage_counters")
        .upsert({ guest_id: guestId, ...payload }, { onConflict: "guest_id" });
    }

    return merged;
  } catch {
    // Backend unavailable — fall back to the local copy so the UI keeps working.
    return local;
  }
}

/**
 * Pushes a single counter increment to the backend. Best-effort: failures are
 * swallowed so the demo experience never breaks because of network issues.
 */
export async function pushCounterToBackend(
  userId: string | null,
  counters: DemoUsageCounters,
): Promise<void> {
  try {
    const guestId = getOrCreateGuestId();
    const payload = {
      patients_created: counters.patientsCreated,
      appointments_created: counters.appointmentsCreated,
      telehealth_views: counters.telehealthViews,
      telehealth_attempts: counters.telehealthAttempts,
      last_synced_at: new Date().toISOString(),
    };
    if (userId) {
      await supabase
        .from("demo_usage_counters")
        .upsert({ user_id: userId, ...payload }, { onConflict: "user_id" });
    } else {
      await supabase
        .from("demo_usage_counters")
        .upsert({ guest_id: guestId, ...payload }, { onConflict: "guest_id" });
    }
  } catch {
    /* ignore — local copy already persisted */
  }
}

/**
 * Called right after the user signs up: merges the guest row into the
 * authenticated user's row on the backend (sums counters, removes the guest
 * row to avoid double counting) and updates localStorage with the result.
 */
export async function mergeGuestCountersIntoAccount(): Promise<DemoUsageCounters | null> {
  const guestId =
    typeof window !== "undefined"
      ? window.localStorage.getItem(DEMO_STORAGE.guestId)
      : null;
  if (!guestId) return null;
  try {
    const { data, error } = await supabase.rpc("merge_demo_counters", {
      _guest_id: guestId,
    });
    if (error || !data) return null;
    const row = Array.isArray(data) ? data[0] : data;
    const merged = toLocalCounters(row as RemoteCountersRow);
    writeLocalCounters(merged);
    // Forget the guest id — we're now an account.
    try {
      window.localStorage.removeItem(DEMO_STORAGE.guestId);
    } catch {
      /* ignore */
    }
    return merged;
  } catch {
    return null;
  }
}

// ============================================================================
// Demo data export — CSV + PDF for the user to keep before subscribing
// ============================================================================

const csvEscape = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const buildCsv = (headers: string[], rows: (string | number | null | undefined)[][]) => {
  const lines = [headers.map(csvEscape).join(",")];
  rows.forEach((r) => lines.push(r.map(csvEscape).join(",")));
  return "\uFEFF" + lines.join("\n"); // BOM for Excel pt-BR compatibility
};

const triggerDownload = (filename: string, content: string | Blob, mime: string) => {
  if (typeof window === "undefined") return;
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export type DemoExportPayload = {
  patients: DemoPatient[];
  appointments: DemoAppointment[];
  telehealth: { views: number; attempts: number };
};

export function readDemoExportPayload(): DemoExportPayload {
  const counters = readUsageCounters();
  return {
    patients: readDemoPatients(),
    appointments: readDemoAppointments(),
    telehealth: {
      views: counters.telehealthViews,
      attempts: counters.telehealthAttempts,
    },
  };
}

export function exportDemoAsCsv() {
  const payload = readDemoExportPayload();
  const stamp = new Date().toISOString().slice(0, 10);

  const patientsCsv = buildCsv(
    ["Nome", "Telefone", "Observações"],
    payload.patients.map((p) => [p.name, p.phone, p.notes ?? ""]),
  );
  triggerDownload(`salbcare-demo-pacientes-${stamp}.csv`, patientsCsv, "text/csv;charset=utf-8");

  const apptsCsv = buildCsv(
    ["Paciente", "Data", "Hora", "Tipo"],
    payload.appointments.map((a) => [
      a.patient,
      new Date(`${a.date}T00:00`).toLocaleDateString("pt-BR"),
      a.time,
      a.type,
    ]),
  );
  triggerDownload(`salbcare-demo-agenda-${stamp}.csv`, apptsCsv, "text/csv;charset=utf-8");

  const teleCsv = buildCsv(
    ["Métrica", "Valor"],
    [
      ["Visualizações de Telehealth", payload.telehealth.views],
      ["Tentativas de teleconsulta", payload.telehealth.attempts],
    ],
  );
  triggerDownload(`salbcare-demo-teleconsultas-${stamp}.csv`, teleCsv, "text/csv;charset=utf-8");
}

/**
 * Lightweight PDF builder — no external deps. Generates a single A4 PDF with
 * three sections: Pacientes, Agenda e Teleconsultas. Plenty for an export
 * snapshot the user can review or attach when they subscribe later.
 */
function buildDemoPdf(payload: DemoExportPayload): Blob {
  const lines: string[] = [];
  lines.push("SalbCare — Resumo da sua demonstração");
  lines.push(`Gerado em ${new Date().toLocaleString("pt-BR")}`);
  lines.push("");
  lines.push(`PACIENTES (${payload.patients.length})`);
  payload.patients.forEach((p, i) => {
    lines.push(`${i + 1}. ${p.name}`);
    if (p.phone) lines.push(`   Tel: ${p.phone}`);
    if (p.notes) lines.push(`   Notas: ${p.notes}`);
  });
  if (payload.patients.length === 0) lines.push("(nenhum paciente cadastrado)");
  lines.push("");
  lines.push(`AGENDA (${payload.appointments.length})`);
  payload.appointments.forEach((a, i) => {
    const fmt = new Date(`${a.date}T00:00`).toLocaleDateString("pt-BR");
    lines.push(`${i + 1}. ${a.patient} — ${fmt} ${a.time} (${a.type})`);
  });
  if (payload.appointments.length === 0) lines.push("(nenhuma consulta agendada)");
  lines.push("");
  lines.push("TELECONSULTAS");
  lines.push(`Visualizações: ${payload.telehealth.views}`);
  lines.push(`Tentativas: ${payload.telehealth.attempts}`);
  lines.push("");
  lines.push("Crie sua conta para manter esses dados sincronizados em todos os dispositivos.");

  // Escape PDF text strings.
  const esc = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  const pageWidth = 595;
  const pageHeight = 842;
  const lineHeight = 16;
  const marginTop = 50;
  const marginLeft = 50;
  const usableHeight = pageHeight - marginTop - 50;
  const linesPerPage = Math.floor(usableHeight / lineHeight);

  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }
  if (pages.length === 0) pages.push([""]);

  // Build PDF objects.
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");

  const pageRefs = pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  objects.push(
    `<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} /MediaBox [0 0 ${pageWidth} ${pageHeight}] >>`,
  );

  pages.forEach((pageLines, idx) => {
    let stream = "BT /F1 11 Tf\n";
    stream += `${marginLeft} ${pageHeight - marginTop} Td\n`;
    pageLines.forEach((ln, i) => {
      if (i === 0) stream += `(${esc(ln)}) Tj\n`;
      else stream += `0 -${lineHeight} Td (${esc(ln)}) Tj\n`;
    });
    stream += "ET";
    const contentObjIdx = objects.length + 1; // 1-based ref of the next pushed object
    objects.push(
      `<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> /Contents ${contentObjIdx + 1} 0 R >>`,
    );
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  // Assemble PDF
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => {
    pdf += `${o.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export function exportDemoAsPdf() {
  const payload = readDemoExportPayload();
  const stamp = new Date().toISOString().slice(0, 10);
  const blob = buildDemoPdf(payload);
  triggerDownload(`salbcare-demo-${stamp}.pdf`, blob, "application/pdf");
}
