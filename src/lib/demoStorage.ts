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
} as const;

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

  // ---- Appointments ----
  const apptsToInsert: typeof demoAppts = [];
  for (const a of demoAppts) {
    const key = `${a.date}|${a.time}`;
    if (existingApptKeys.has(key)) {
      result.skippedAppointments += 1;
      result.conflicts.push({
        kind: "appointment",
        reason: "Horário já ocupado na sua agenda",
        label: `${a.patient} — ${a.date} ${a.time}`,
      });
      continue;
    }
    apptsToInsert.push(a);
  }

  if (apptsToInsert.length > 0) {
    const rows = apptsToInsert.map((a) => ({
      user_id: userId,
      patient_name: a.patient,
      patient_id: insertedPatientByName[a.patient.trim().toLowerCase()] ?? null,
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
        result.importedAppointmentLabels.push(
          `${row.patient_name} — ${row.date} ${row.time}`,
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
