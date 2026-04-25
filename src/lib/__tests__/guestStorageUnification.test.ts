/**
 * Verifies the salbcare_guest_data unification:
 * - reads from the new single key
 * - auto-migrates data from the legacy keys on first read
 * - clears both new and legacy keys on clearGuestStorage
 * - protects merge with begin/end/hasMergedFor (idempotency)
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  GUEST_DATA_KEY,
  readGuestPatients,
  readGuestAppointments,
  addGuestPatient,
  clearGuestStorage,
  beginMerge,
  endMerge,
  hasMergedFor,
  isMergeInFlight,
} from "@/lib/guestStorage";

const LEGACY_PATIENTS = "salbcare_guest_patients";
const LEGACY_APPTS = "salbcare_guest_appointments";

beforeEach(() => window.localStorage.clear());

describe("guest storage unification", () => {
  it("auto-migrates legacy keys into salbcare_guest_data on first read", () => {
    window.localStorage.setItem(
      LEGACY_PATIENTS,
      JSON.stringify([{ id: "p1", name: "Maria", created_at: "x" }]),
    );
    window.localStorage.setItem(
      LEGACY_APPTS,
      JSON.stringify([
        { id: "a1", patient_name: "João", date: "2099-01-01", time: "10:00", appointment_type: "presencial", created_at: "x" },
      ]),
    );

    const patients = readGuestPatients();
    const appts = readGuestAppointments();

    expect(patients).toHaveLength(1);
    expect(appts).toHaveLength(1);
    // Unified key written
    expect(window.localStorage.getItem(GUEST_DATA_KEY)).not.toBeNull();
    // Legacy keys cleared
    expect(window.localStorage.getItem(LEGACY_PATIENTS)).toBeNull();
    expect(window.localStorage.getItem(LEGACY_APPTS)).toBeNull();
  });

  it("writes new patients into the unified key", () => {
    addGuestPatient({ name: "Ana" });
    const raw = window.localStorage.getItem(GUEST_DATA_KEY);
    expect(raw).not.toBeNull();
    const bundle = JSON.parse(raw!);
    expect(bundle.patients[0].name).toBe("Ana");
  });

  it("clearGuestStorage wipes both unified and legacy keys", () => {
    addGuestPatient({ name: "Ana" });
    window.localStorage.setItem(LEGACY_PATIENTS, "[]");
    clearGuestStorage();
    expect(window.localStorage.getItem(GUEST_DATA_KEY)).toBeNull();
    expect(window.localStorage.getItem(LEGACY_PATIENTS)).toBeNull();
  });

  it("merge guard prevents duplicate imports for the same user_id", () => {
    const uid = "user-abc";
    expect(beginMerge(uid)).toBe(true);
    expect(isMergeInFlight(uid)).toBe(true);
    // Second call while in-flight → blocked
    expect(beginMerge(uid)).toBe(false);
    endMerge(uid);
    expect(isMergeInFlight(uid)).toBe(false);
    expect(hasMergedFor(uid)).toBe(true);
    // After completion → still blocked (idempotent)
    expect(beginMerge(uid)).toBe(false);
  });

  it("merge guard is per-user (other users still allowed)", () => {
    beginMerge("user-1");
    endMerge("user-1");
    expect(hasMergedFor("user-2")).toBe(false);
    expect(beginMerge("user-2")).toBe(true);
  });
});
