/**
 * guestStorage: the hard limit (3) for patients & appointments must reject
 * additional inserts with reason="limit", since this is what the UI uses
 * to surface the upgrade message.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  addGuestPatient,
  addGuestAppointment,
  GUEST_LIMITS,
  readGuestPatients,
  readGuestAppointments,
  clearGuestStorage,
  getGuestUsage,
} from "@/lib/guestStorage";

beforeEach(() => {
  clearGuestStorage();
});

describe("guestStorage limits", () => {
  it("blocks the 4th patient with reason=limit", () => {
    for (let i = 0; i < GUEST_LIMITS.patients; i++) {
      const r = addGuestPatient({ name: `Paciente ${i}` });
      expect(r.ok).toBe(true);
    }
    const blocked = addGuestPatient({ name: "Excedente" });
    expect(blocked.ok).toBe(false);
    if (blocked.ok === false) expect(blocked.reason).toBe("limit");
    expect(readGuestPatients().length).toBe(GUEST_LIMITS.patients);
  });

  it("blocks the 4th appointment with reason=limit", () => {
    for (let i = 0; i < GUEST_LIMITS.appointments; i++) {
      const r = addGuestAppointment({
        patient_name: `P${i}`,
        date: "2026-01-01",
        time: "10:00",
        appointment_type: "presencial",
      });
      expect(r.ok).toBe(true);
    }
    const blocked = addGuestAppointment({
      patient_name: "Excedente",
      date: "2026-01-01",
      time: "11:00",
      appointment_type: "presencial",
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok === false) expect(blocked.reason).toBe("limit");
    expect(readGuestAppointments().length).toBe(GUEST_LIMITS.appointments);
  });

  it("rejects empty/invalid input with reason=invalid", () => {
    const r = addGuestPatient({ name: "" });
    expect(r.ok).toBe(false);
    if (r.ok === false) expect(r.reason).toBe("invalid");
  });

  it("getGuestUsage reflects current counts", () => {
    addGuestPatient({ name: "A" });
    addGuestAppointment({
      patient_name: "B",
      date: "2026-01-01",
      time: "10:00",
      appointment_type: "online",
    });
    const usage = getGuestUsage();
    expect(usage.patients.used).toBe(1);
    expect(usage.patients.remaining).toBe(GUEST_LIMITS.patients - 1);
    expect(usage.appointments.used).toBe(1);
    expect(usage.appointments.remaining).toBe(GUEST_LIMITS.appointments - 1);
  });
});
