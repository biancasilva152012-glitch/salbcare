/**
 * Guest mode storage — runs the dashboard in localStorage when no auth user.
 *
 * STORAGE LAYOUT (single key):
 *   salbcare_guest_data = {
 *     patients: GuestPatient[],
 *     appointments: GuestAppointment[],
 *     startedAt: ISO string
 *   }
 *
 * Legacy keys (`salbcare_guest_patients`, `salbcare_guest_appointments`,
 * `salbcare_guest_started_at`) are auto-migrated into the unified key on first
 * read and then removed.
 *
 * Limits are intentionally low (3/3) to drive sign-up.
 */

export const GUEST_LIMITS = {
  patients: 3,
  appointments: 3,
} as const;

/** Single-key bundle used by the whole app. */
export const GUEST_DATA_KEY = "salbcare_guest_data";

/** Legacy keys (only kept here so we can migrate + clear them). */
const LEGACY_KEYS = {
  patients: "salbcare_guest_patients",
  appointments: "salbcare_guest_appointments",
  startedAt: "salbcare_guest_started_at",
} as const;

/** Re-exported for backwards compatibility (tests, components that imported the
 * old surface). All entries point at the SAME single key now. */
export const GUEST_STORAGE = {
  patients: GUEST_DATA_KEY,
  appointments: GUEST_DATA_KEY,
  startedAt: GUEST_DATA_KEY,
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

type GuestBundle = {
  patients: GuestPatient[];
  appointments: GuestAppointment[];
  startedAt: string | null;
};

const emptyBundle = (): GuestBundle => ({
  patients: [],
  appointments: [],
  startedAt: null,
});

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const safeReadJson = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const safeRemove = (key: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

/**
 * Reads the unified bundle. If the bundle is missing but legacy keys exist,
 * migrate them in-place and remove the legacy entries. Idempotent.
 */
function readBundle(): GuestBundle {
  if (typeof window === "undefined") return emptyBundle();

  const fromUnified = safeReadJson<GuestBundle | null>(GUEST_DATA_KEY, null);

  // Legacy snapshot
  const legacyPatients = safeReadJson<GuestPatient[]>(LEGACY_KEYS.patients, []);
  const legacyAppointments = safeReadJson<GuestAppointment[]>(
    LEGACY_KEYS.appointments,
    [],
  );
  const legacyStartedAt = (() => {
    try {
      return window.localStorage.getItem(LEGACY_KEYS.startedAt);
    } catch {
      return null;
    }
  })();

  const hasLegacy =
    legacyPatients.length > 0 ||
    legacyAppointments.length > 0 ||
    Boolean(legacyStartedAt);

  if (!fromUnified && !hasLegacy) return emptyBundle();

  // Merge: unified takes priority for items, legacy fills in gaps. We never
  // duplicate by id, so re-running migration is a no-op.
  const base: GuestBundle = fromUnified ?? emptyBundle();
  if (hasLegacy) {
    const seenP = new Set(base.patients.map((p) => p.id));
    for (const p of legacyPatients) {
      if (!seenP.has(p.id)) {
        base.patients.push(p);
        seenP.add(p.id);
      }
    }
    const seenA = new Set(base.appointments.map((a) => a.id));
    for (const a of legacyAppointments) {
      if (!seenA.has(a.id)) {
        base.appointments.push(a);
        seenA.add(a.id);
      }
    }
    if (!base.startedAt && legacyStartedAt) {
      base.startedAt = legacyStartedAt;
    }
    writeBundle(base);
    safeRemove(LEGACY_KEYS.patients);
    safeRemove(LEGACY_KEYS.appointments);
    safeRemove(LEGACY_KEYS.startedAt);
  }

  return base;
}

function writeBundle(b: GuestBundle) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(b));
  } catch {
    /* quota or private mode — silently ignore */
  }
}

export function ensureGuestStartedAt(): string {
  const b = readBundle();
  if (b.startedAt) return b.startedAt;
  const now = new Date().toISOString();
  b.startedAt = now;
  writeBundle(b);
  return now;
}

// ── Patients ────────────────────────────────────────────────────────────────
export function readGuestPatients(): GuestPatient[] {
  return readBundle().patients;
}

export function addGuestPatient(
  input: Omit<GuestPatient, "id" | "created_at">,
): { ok: true; patient: GuestPatient } | { ok: false; reason: "limit" | "invalid" } {
  if (!input.name?.trim()) return { ok: false, reason: "invalid" };
  const b = readBundle();
  if (b.patients.length >= GUEST_LIMITS.patients) return { ok: false, reason: "limit" };
  const patient: GuestPatient = {
    id: newId(),
    name: input.name.trim(),
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    created_at: new Date().toISOString(),
  };
  b.patients = [patient, ...b.patients];
  writeBundle(b);
  return { ok: true, patient };
}

export function deleteGuestPatient(id: string) {
  const b = readBundle();
  b.patients = b.patients.filter((p) => p.id !== id);
  writeBundle(b);
}

// ── Appointments ────────────────────────────────────────────────────────────
export function readGuestAppointments(): GuestAppointment[] {
  return readBundle().appointments;
}

export function addGuestAppointment(
  input: Omit<GuestAppointment, "id" | "created_at">,
):
  | { ok: true; appointment: GuestAppointment }
  | { ok: false; reason: "limit" | "invalid" } {
  if (!input.patient_name?.trim() || !input.date || !input.time) {
    return { ok: false, reason: "invalid" };
  }
  const b = readBundle();
  if (b.appointments.length >= GUEST_LIMITS.appointments) return { ok: false, reason: "limit" };
  const appointment: GuestAppointment = {
    id: newId(),
    patient_name: input.patient_name.trim(),
    date: input.date,
    time: input.time,
    appointment_type: input.appointment_type ?? "presencial",
    notes: input.notes?.trim() || undefined,
    created_at: new Date().toISOString(),
  };
  b.appointments = [appointment, ...b.appointments];
  writeBundle(b);
  return { ok: true, appointment };
}

export function deleteGuestAppointment(id: string) {
  const b = readBundle();
  b.appointments = b.appointments.filter((a) => a.id !== id);
  writeBundle(b);
}

// ── Aggregate usage (drives the GuestBanner) ────────────────────────────────
export type GuestUsage = {
  patients: { used: number; limit: number; remaining: number };
  appointments: { used: number; limit: number; remaining: number };
};

export function getGuestUsage(): GuestUsage {
  const b = readBundle();
  return {
    patients: {
      used: b.patients.length,
      limit: GUEST_LIMITS.patients,
      remaining: Math.max(0, GUEST_LIMITS.patients - b.patients.length),
    },
    appointments: {
      used: b.appointments.length,
      limit: GUEST_LIMITS.appointments,
      remaining: Math.max(0, GUEST_LIMITS.appointments - b.appointments.length),
    },
  };
}

/** Wipes the guest bundle AND any leftover legacy keys. */
export function clearGuestStorage() {
  if (typeof window === "undefined") return;
  safeRemove(GUEST_DATA_KEY);
  safeRemove(LEGACY_KEYS.patients);
  safeRemove(LEGACY_KEYS.appointments);
  safeRemove(LEGACY_KEYS.startedAt);
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
  const b = readBundle();
  return b.patients.length > 0 || b.appointments.length > 0;
}

// ── Read-only lock during pending sync ──────────────────────────────────────
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

// ── In-flight merge guard (idempotency) ─────────────────────────────────────
/**
 * Prevents duplicate imports if the user refreshes the sync page while the
 * merge is in flight. Stores `${userId}:${ISO}` so we can both detect the
 * "currently merging for this user" state and recover if the tab actually
 * crashes (we expire entries older than 10 minutes).
 */
export const GUEST_MERGE_INFLIGHT_KEY = "salbcare_guest_sync_inflight";
export const GUEST_MERGE_DONE_KEY = "salbcare_guest_sync_done_for";

const TEN_MINUTES = 10 * 60 * 1000;

export function isMergeInFlight(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(GUEST_MERGE_INFLIGHT_KEY);
    if (!raw) return false;
    const [uid, iso] = raw.split("|");
    if (uid !== userId) return false;
    const ts = Date.parse(iso);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < TEN_MINUTES;
  } catch {
    return false;
  }
}

export function beginMerge(userId: string): boolean {
  if (typeof window === "undefined") return false;
  if (hasMergedFor(userId)) return false;
  if (isMergeInFlight(userId)) return false;
  try {
    window.localStorage.setItem(
      GUEST_MERGE_INFLIGHT_KEY,
      `${userId}|${new Date().toISOString()}`,
    );
    return true;
  } catch {
    return false;
  }
}

export function endMerge(userId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GUEST_MERGE_INFLIGHT_KEY);
    const prev = window.localStorage.getItem(GUEST_MERGE_DONE_KEY);
    const list = prev ? prev.split(",").filter(Boolean) : [];
    if (!list.includes(userId)) list.push(userId);
    window.localStorage.setItem(GUEST_MERGE_DONE_KEY, list.join(","));
  } catch {
    /* ignore */
  }
}

export function hasMergedFor(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(GUEST_MERGE_DONE_KEY);
    if (!raw) return false;
    return raw.split(",").includes(userId);
  } catch {
    return false;
  }
}

// ── Sync summary (handed to the confirmation screen) ────────────────────────
export type DuplicateRecord = {
  label: string;
  reason: "name" | "email" | "name+date+time";
};

export type GuestSyncSummary = {
  outcome: "merged" | "discarded" | "manual_clear";
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
export function normalizeName(name: string | null | undefined): string {
  return (name ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
}

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").toLowerCase().trim();
}

export function appointmentKey(name: string, date: string, time: string): string {
  return `${normalizeName(name)}|${date}|${time.slice(0, 5)}`;
}
