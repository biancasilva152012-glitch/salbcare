/**
 * Vitest coverage for `migrateDemoToAccount`.
 *
 * Asserts the full import summary contract:
 *   - imported counts (patients + appointments)
 *   - skipped counts (duplicate patient names, slot overlaps)
 *   - per-item conflict reasons (specific enough for the UI summary)
 *   - that imported appointments stay linked to the right patient row
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Supabase client mock — supports `.from(table).select().eq()` reads and
// `.insert(rows).select()` writes used by migrateDemoToAccount.
// ---------------------------------------------------------------------------
type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = {
  patients: [],
  appointments: [],
};

const supabaseMock = {
  from: (table: string) => {
    return {
      select: (_cols?: string) => ({
        eq: (_col: string, _val: unknown) =>
          Promise.resolve({ data: tables[table] ?? [], error: null }),
      }),
      insert: (rows: Row[]) => ({
        select: (_cols?: string) => {
          const inserted = rows.map((r, i) => ({
            id: `${table}-${tables[table].length + i + 1}`,
            ...r,
          }));
          tables[table].push(...inserted);
          return Promise.resolve({ data: inserted, error: null });
        },
      }),
    };
  },
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock,
}));

// jsdom provides localStorage, but reset between tests for isolation.
beforeEach(() => {
  tables.patients = [];
  tables.appointments = [];
  window.localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

const seedDemo = (patients: unknown[], appointments: unknown[]) => {
  window.localStorage.setItem(
    "salbcare_demo_patients",
    JSON.stringify(patients),
  );
  window.localStorage.setItem(
    "salbcare_demo_appointments",
    JSON.stringify(appointments),
  );
};

describe("migrateDemoToAccount", () => {
  it("returns empty result when there is no demo data", async () => {
    const { migrateDemoToAccount } = await import("@/lib/demoStorage");
    const result = await migrateDemoToAccount("user-1");
    expect(result.patients).toBe(0);
    expect(result.appointments).toBe(0);
    expect(result.conflicts).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it("imports new patients and appointments and reports them in the summary", async () => {
    seedDemo(
      [
        { id: "p1", name: "Maria Silva", phone: "11999990000" },
        { id: "p2", name: "João Souza", phone: "" },
      ],
      [
        { id: "a1", patient: "Maria Silva", date: "2099-01-10", time: "09:00", type: "presencial" },
        { id: "a2", patient: "João Souza", date: "2099-01-10", time: "10:00", type: "online" },
      ],
    );

    const { migrateDemoToAccount } = await import("@/lib/demoStorage");
    const result = await migrateDemoToAccount("user-1");

    expect(result.patients).toBe(2);
    expect(result.appointments).toBe(2);
    expect(result.skippedPatients).toBe(0);
    expect(result.skippedAppointments).toBe(0);
    expect(result.conflicts).toHaveLength(0);
    expect(result.importedPatientNames).toEqual(
      expect.arrayContaining(["Maria Silva", "João Souza"]),
    );
    expect(result.importedAppointmentLabels).toHaveLength(2);
    // Appointments must be linked to the freshly inserted patients
    expect(tables.appointments[0]).toMatchObject({ patient_name: "Maria Silva" });
    expect(tables.appointments[0].patient_id).toBeTruthy();
  });

  it("detects duplicate patients by normalized name (diacritics + case)", async () => {
    tables.patients.push({ id: "existing-1", name: "joão souza" });

    seedDemo(
      [{ id: "p1", name: "João Souza", phone: "" }],
      [],
    );

    const { migrateDemoToAccount } = await import("@/lib/demoStorage");
    const result = await migrateDemoToAccount("user-1");

    expect(result.patients).toBe(0);
    expect(result.skippedPatients).toBe(1);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]).toMatchObject({
      kind: "patient",
      label: "João Souza",
    });
    expect(result.conflicts[0].reason).toMatch(/já existia/i);
  });

  it("detects exact appointment duplicates (same patient + date + time)", async () => {
    tables.appointments.push({
      id: "existing-1",
      patient_name: "Maria Silva",
      date: "2099-01-10",
      time: "09:00",
    });

    seedDemo(
      [{ id: "p1", name: "Maria Silva", phone: "" }],
      [
        { id: "a1", patient: "Maria Silva", date: "2099-01-10", time: "09:00", type: "presencial" },
      ],
    );

    const { migrateDemoToAccount } = await import("@/lib/demoStorage");
    const result = await migrateDemoToAccount("user-1");

    expect(result.appointments).toBe(0);
    expect(result.skippedAppointments).toBe(1);
    const conflict = result.conflicts.find((c) => c.kind === "appointment");
    expect(conflict).toBeDefined();
    expect(conflict?.reason).toMatch(/idêntica/i);
  });

  it("detects slot overlaps (same date+time, different patient) and names the occupant", async () => {
    tables.appointments.push({
      id: "existing-1",
      patient_name: "Carlos Lima",
      date: "2099-01-15",
      time: "14:30",
    });

    seedDemo(
      [{ id: "p1", name: "Maria Silva", phone: "" }],
      [
        { id: "a1", patient: "Maria Silva", date: "2099-01-15", time: "14:30", type: "presencial" },
      ],
    );

    const { migrateDemoToAccount } = await import("@/lib/demoStorage");
    const result = await migrateDemoToAccount("user-1");

    expect(result.skippedAppointments).toBe(1);
    const conflict = result.conflicts.find((c) => c.kind === "appointment");
    expect(conflict?.reason).toMatch(/já ocupado por Carlos Lima/);
  });

  it("clears local demo storage on successful migration", async () => {
    seedDemo(
      [{ id: "p1", name: "Ana", phone: "" }],
      [],
    );
    const { migrateDemoToAccount } = await import("@/lib/demoStorage");
    await migrateDemoToAccount("user-1");
    expect(window.localStorage.getItem("salbcare_demo_patients")).toBeNull();
    expect(window.localStorage.getItem("salbcare_demo_appointments")).toBeNull();
  });
});
