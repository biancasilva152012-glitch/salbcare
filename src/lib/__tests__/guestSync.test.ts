import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setGuestSyncLock,
  clearGuestSyncLock,
  isGuestSyncLocked,
  writeGuestSyncSummary,
  readGuestSyncSummary,
  clearGuestSyncSummary,
  normalizeName,
  appointmentKey,
  GUEST_SYNC_LOCK_KEY,
  GUEST_SYNC_SUMMARY_KEY,
} from "@/lib/guestStorage";

describe("guestStorage — sync lock", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("setGuestSyncLock writes the flag and isGuestSyncLocked reads it", () => {
    expect(isGuestSyncLocked()).toBe(false);
    setGuestSyncLock();
    expect(localStorage.getItem(GUEST_SYNC_LOCK_KEY)).toBe("1");
    expect(isGuestSyncLocked()).toBe(true);
  });

  it("clearGuestSyncLock removes the flag", () => {
    setGuestSyncLock();
    clearGuestSyncLock();
    expect(localStorage.getItem(GUEST_SYNC_LOCK_KEY)).toBeNull();
    expect(isGuestSyncLocked()).toBe(false);
  });
});

describe("guestStorage — sync summary", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it("writes and reads back a summary, then clears it", () => {
    const summary = {
      outcome: "merged" as const,
      patients: { imported: 2, skippedDuplicate: 1, skippedQuota: 0 },
      appointments: { imported: 1, skippedDuplicate: 0, skippedQuota: 1 },
      duplicates: {
        patients: [{ label: "Maria", reason: "name" as const }],
        appointments: [],
      },
      at: new Date().toISOString(),
    };
    writeGuestSyncSummary(summary);
    expect(sessionStorage.getItem(GUEST_SYNC_SUMMARY_KEY)).not.toBeNull();
    const got = readGuestSyncSummary();
    expect(got?.patients.imported).toBe(2);
    expect(got?.duplicates.patients[0]).toEqual({ label: "Maria", reason: "name" });
    clearGuestSyncSummary();
    expect(readGuestSyncSummary()).toBeNull();
  });
});

describe("guestStorage — dedup helpers", () => {
  it("normalizeName lowercases, strips accents and collapses whitespace", () => {
    expect(normalizeName("  José  da Silva ")).toBe("jose da silva");
    expect(normalizeName("MARIA")).toBe("maria");
    expect(normalizeName(null)).toBe("");
  });

  it("appointmentKey ignores casing, accents and trims seconds", () => {
    const a = appointmentKey("João", "2026-04-25", "14:30:00");
    const b = appointmentKey("joao", "2026-04-25", "14:30");
    expect(a).toBe(b);
  });

  it("appointmentKey differs when date or time differ", () => {
    expect(appointmentKey("Ana", "2026-04-25", "14:30")).not.toBe(
      appointmentKey("Ana", "2026-04-26", "14:30"),
    );
    expect(appointmentKey("Ana", "2026-04-25", "14:30")).not.toBe(
      appointmentKey("Ana", "2026-04-25", "15:30"),
    );
  });
});
