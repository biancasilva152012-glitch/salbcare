/**
 * Guest mode storage — runs the dashboard in localStorage when no auth user.
 *
 * Keeps a strict separation from `demoStorage.ts`:
 * - demoStorage powers the dedicated /experimente tabs (legacy, redirect-only today)
 * - guestStorage powers the *real* dashboard pages (Patients, Agenda) when !user
 *
 * Limits are intentionally low (3/3) to drive sign-up; mentoria/telehealth/
 * financial/profile remain blocked behind the GuestPaywall.
 */

export const GUEST_LIMITS = {
  patients: 3,
  appointments: 3,
} as const;

export const GUEST_STORAGE = {
  patients: "salbcare_guest_patients",
  appointments: "salbcare_guest_appointments",
  startedAt: "salbcare_guest_started_at",
} as const;

export type GuestPatient = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
};

export type GuestAppointment = {
  id: string;
  patient_name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  appointment_type: "presencial" | "online";
  notes?: string;
  created_at: string;
};

const safeRead = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const safeWrite = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or private mode — silently ignore */
  }
};

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function ensureGuestStartedAt(): string {
  if (typeof window === "undefined") return new Date().toISOString();
  const existing = window.localStorage.getItem(GUEST_STORAGE.startedAt);
  if (existing) return existing;
  const now = new Date().toISOString();
  window.localStorage.setItem(GUEST_STORAGE.startedAt, now);
  return now;
}

// ── Patients ────────────────────────────────────────────────────────────────
export function readGuestPatients(): GuestPatient[] {
  return safeRead<GuestPatient[]>(GUEST_STORAGE.patients, []);
}

export function addGuestPatient(
  input: Omit<GuestPatient, "id" | "created_at">,
): { ok: true; patient: GuestPatient } | { ok: false; reason: "limit" | "invalid" } {
  if (!input.name?.trim()) return { ok: false, reason: "invalid" };
  const list = readGuestPatients();
  if (list.length >= GUEST_LIMITS.patients) return { ok: false, reason: "limit" };
  const patient: GuestPatient = {
    id: newId(),
    name: input.name.trim(),
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    created_at: new Date().toISOString(),
  };
  safeWrite(GUEST_STORAGE.patients, [patient, ...list]);
  return { ok: true, patient };
}

export function deleteGuestPatient(id: string) {
  safeWrite(
    GUEST_STORAGE.patients,
    readGuestPatients().filter((p) => p.id !== id),
  );
}

// ── Appointments ────────────────────────────────────────────────────────────
export function readGuestAppointments(): GuestAppointment[] {
  return safeRead<GuestAppointment[]>(GUEST_STORAGE.appointments, []);
}

export function addGuestAppointment(
  input: Omit<GuestAppointment, "id" | "created_at">,
):
  | { ok: true; appointment: GuestAppointment }
  | { ok: false; reason: "limit" | "invalid" } {
  if (!input.patient_name?.trim() || !input.date || !input.time) {
    return { ok: false, reason: "invalid" };
  }
  const list = readGuestAppointments();
  if (list.length >= GUEST_LIMITS.appointments) return { ok: false, reason: "limit" };
  const appointment: GuestAppointment = {
    id: newId(),
    patient_name: input.patient_name.trim(),
    date: input.date,
    time: input.time,
    appointment_type: input.appointment_type ?? "presencial",
    notes: input.notes?.trim() || undefined,
    created_at: new Date().toISOString(),
  };
  safeWrite(GUEST_STORAGE.appointments, [appointment, ...list]);
  return { ok: true, appointment };
}

export function deleteGuestAppointment(id: string) {
  safeWrite(
    GUEST_STORAGE.appointments,
    readGuestAppointments().filter((a) => a.id !== id),
  );
}

// ── Aggregate usage (drives the GuestBanner) ────────────────────────────────
export type GuestUsage = {
  patients: { used: number; limit: number; remaining: number };
  appointments: { used: number; limit: number; remaining: number };
};

export function getGuestUsage(): GuestUsage {
  const p = readGuestPatients().length;
  const a = readGuestAppointments().length;
  return {
    patients: {
      used: p,
      limit: GUEST_LIMITS.patients,
      remaining: Math.max(0, GUEST_LIMITS.patients - p),
    },
    appointments: {
      used: a,
      limit: GUEST_LIMITS.appointments,
      remaining: Math.max(0, GUEST_LIMITS.appointments - a),
    },
  };
}

export function clearGuestStorage() {
  if (typeof window === "undefined") return;
  for (const key of Object.values(GUEST_STORAGE)) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

/** Marker stored after the post-login sync screen runs (regardless of the
 * user's choice). Prevents the sync screen from showing on every navigation. */
export const GUEST_SYNC_ACK_KEY = "salbcare_guest_sync_ack";

export function markGuestSyncAcknowledged() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_SYNC_ACK_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
}

export function hasGuestSyncBeenAcknowledged(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return Boolean(window.localStorage.getItem(GUEST_SYNC_ACK_KEY));
  } catch {
    return true;
  }
}

export function hasGuestData(): boolean {
  return readGuestPatients().length > 0 || readGuestAppointments().length > 0;
}

// ── Read-only lock during pending sync ──────────────────────────────────────
/**
 * Set when the post-login sync redirector is triggered, cleared after the user
 * picks merge/discard/later. While set, the authenticated dashboard pages
 * (Patients, Agenda) should disable CRUD to avoid creating duplicates against
 * the same drafts the user is about to merge.
 */
export const GUEST_SYNC_LOCK_KEY = "salbcare_guest_sync_lock";

export function setGuestSyncLock() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_SYNC_LOCK_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearGuestSyncLock() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GUEST_SYNC_LOCK_KEY);
  } catch {
    /* ignore */
  }
}

export function isGuestSyncLocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(GUEST_SYNC_LOCK_KEY) === "1";
  } catch {
    return false;
  }
}

// ── Sync summary (handed to the confirmation screen) ────────────────────────
/** A single ignored item with the criterion that flagged it. */
export type DuplicateRecord = {
  label: string; // "Maria Silva" or "Maria — 25/04 14:30"
  reason: "name" | "email" | "name+date+time";
};

export type GuestSyncSummary = {
  outcome: "merged" | "discarded";
  patients: { imported: number; skippedDuplicate: number; skippedQuota: number };
  appointments: { imported: number; skippedDuplicate: number; skippedQuota: number };
  duplicates: {
    patients: DuplicateRecord[];
    appointments: DuplicateRecord[];
  };
  at: string;
};

export const GUEST_SYNC_SUMMARY_KEY = "salbcare_guest_sync_summary";

export function writeGuestSyncSummary(s: GuestSyncSummary) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(GUEST_SYNC_SUMMARY_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function readGuestSyncSummary(): GuestSyncSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(GUEST_SYNC_SUMMARY_KEY);
    return raw ? (JSON.parse(raw) as GuestSyncSummary) : null;
  } catch {
    return null;
  }
}

export function clearGuestSyncSummary() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(GUEST_SYNC_SUMMARY_KEY);
  } catch {
    /* ignore */
  }
}

/** Atomically read + delete the summary so refresh/back never replays it. */
export function consumeGuestSyncSummary(): GuestSyncSummary | null {
  const s = readGuestSyncSummary();
  if (s) clearGuestSyncSummary();
  return s;
}

// ── Dedup helpers ───────────────────────────────────────────────────────────
/** Normalize a name for duplicate comparison: lowercase + collapse whitespace. */
export function normalizeName(name: string | null | undefined): string {
  return (name ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
}

/** Normalize an email for duplicate comparison: lowercase + trim. Empty → "". */
export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").toLowerCase().trim();
}

/** Composite key for an appointment: name|date|HH:mm. */
export function appointmentKey(name: string, date: string, time: string): string {
  return `${normalizeName(name)}|${date}|${time.slice(0, 5)}`;
}

