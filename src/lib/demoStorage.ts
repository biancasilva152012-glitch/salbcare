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
} as const;

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
} as const;

export type DemoUsageCounters = {
  patientsCreated: number;
  appointmentsCreated: number;
  telehealthViews: number;
};

const EMPTY_COUNTERS: DemoUsageCounters = {
  patientsCreated: 0,
  appointmentsCreated: 0,
  telehealthViews: 0,
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

export type MigrationResult = {
  patients: number;
  appointments: number;
  errors: string[];
};

/**
 * Migrates the demo data stored in localStorage to the authenticated user's
 * Supabase tables. Safe to call multiple times — clears local data on success.
 */
export async function migrateDemoToAccount(userId: string): Promise<MigrationResult> {
  const result: MigrationResult = { patients: 0, appointments: 0, errors: [] };
  const demoPatients = readDemoPatients();
  const demoAppts = readDemoAppointments();

  if (demoPatients.length === 0 && demoAppts.length === 0) return result;

  // Insert patients first so we can link appointments by name → patient_id
  const insertedPatients: Record<string, string> = {}; // name (lowercased) → patient.id

  if (demoPatients.length > 0) {
    const rows = demoPatients.map((p) => ({
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
        insertedPatients[row.name.toLowerCase()] = row.id;
      });
    }
  }

  if (demoAppts.length > 0) {
    const rows = demoAppts.map((a) => ({
      user_id: userId,
      patient_name: a.patient,
      patient_id: insertedPatients[a.patient.toLowerCase()] ?? null,
      date: a.date,
      time: a.time,
      appointment_type: a.type,
      status: "scheduled",
    }));
    const { error, count } = await supabase
      .from("appointments")
      .insert(rows, { count: "exact" });
    if (error) {
      result.errors.push(`Consultas: ${error.message}`);
    } else {
      result.appointments = count ?? rows.length;
    }
  }

  if (result.errors.length === 0) {
    clearDemoStorage();
  }

  return result;
}
