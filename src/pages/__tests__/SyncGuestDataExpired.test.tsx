/**
 * Integração: fallback de /sync-guest-data quando o checkpoint expira.
 *
 * Garante que:
 *   - banner "Sessão de importação expirada" aparece (testid sync-checkpoint-expired)
 *   - mostra contadores parciais corretos (importados / duplicados / pendentes)
 *   - oferece os três CTAs: Retomar / Recomeçar do zero / Descartar
 *   - "Retomar" preserva o liveSummary do checkpoint
 *   - "Recomeçar do zero" zera os steps mas mantém o resumo parcial visível
 *     (toast informa) e remove o checkpoint
 *   - "Descartar" some o banner e remove o checkpoint do localStorage
 *
 * Este caminho exige `useAuth` retornando um usuário, então mockamos o
 * AuthContext + useFreemiumLimits + supabase para evitar rede.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  GUEST_DATA_KEY,
  GUEST_SYNC_CHECKPOINT_KEY,
  GUEST_SYNC_CHECKPOINT_TTL_MS,
  type GuestSyncCheckpoint,
} from "@/lib/guestStorage";

// ── Mocks ────────────────────────────────────────────────────────────────
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "u@example.com" },
    loading: false,
    userType: "professional",
    userTypeLoading: false,
    subscription: { subscribed: false, loading: false, trialDaysRemaining: 0 },
  }),
}));

vi.mock("@/hooks/useFreemiumLimits", async (orig) => {
  const real = (await orig()) as any;
  return {
    ...real,
    useFreemiumLimits: () => ({
      isPaid: false,
      patientsCount: 0,
      appointmentsCount: 0,
      isLoading: false,
      isAdmin: false,
      isFree: true,
      usageByModule: {
        patients: { used: 0, limit: 5, percent: 0, blocked: false },
        appointments: { used: 0, limit: 5, percent: 0, blocked: false },
        financial: { used: 0, limit: 10, percent: 0, blocked: false },
      },
    }),
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
    }),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/SEOHead", () => ({
  default: () => null,
}));

// SyncGuestData precisa ser importado depois dos mocks
const importSync = async () => (await import("@/pages/SyncGuestData")).default;

const seedGuestPatients = (n: number) => {
  const ps = Array.from({ length: n }, (_, i) => ({
    id: `gp${i}`,
    name: `Guest ${i}`,
    created_at: new Date().toISOString(),
  }));
  window.localStorage.setItem(
    GUEST_DATA_KEY,
    JSON.stringify({ patients: ps, appointments: [], startedAt: null }),
  );
};

const seedExpiredCheckpoint = (overrides?: Partial<GuestSyncCheckpoint>) => {
  const updatedAt = new Date(
    Date.now() - GUEST_SYNC_CHECKPOINT_TTL_MS - 10_000,
  ).toISOString();
  const cp: GuestSyncCheckpoint = {
    userId: "user-1",
    steps: { patients: "done", appointments: "pending", teleconsultations: "pending" },
    liveSummary: {
      outcome: "merged",
      patients: { imported: 2, skippedDuplicate: 1, skippedQuota: 0 },
      appointments: { imported: 0, skippedDuplicate: 0, skippedQuota: 0 },
      duplicates: { patients: [], appointments: [] },
      at: updatedAt,
    },
    pendingPatientIds: ["gp2"],
    pendingAppointmentIds: [],
    importPatients: true,
    importAppointments: true,
    updatedAt,
    ...overrides,
  };
  window.localStorage.setItem(GUEST_SYNC_CHECKPOINT_KEY, JSON.stringify(cp));
  return cp;
};

const renderPage = async () => {
  const SyncGuestData = await importSync();
  return render(
    <MemoryRouter initialEntries={["/sync-guest-data?next=/dashboard"]}>
      <Routes>
        <Route path="/sync-guest-data" element={<SyncGuestData />} />
        <Route path="/sync-guest-data/done" element={<div>DONE</div>} />
        <Route path="/dashboard" element={<div>DASH</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.clearAllMocks();
});

describe("SyncGuestData — fallback de checkpoint expirado", () => {
  it("exibe o banner de expirado com contadores parciais e os 3 CTAs", async () => {
    seedGuestPatients(3);
    seedExpiredCheckpoint();

    await renderPage();

    const banner = await screen.findByTestId("sync-checkpoint-expired");
    expect(banner).toBeInTheDocument();
    // Resumo parcial: 2 importados, 1 duplicado, 1 pendente
    expect(within(banner).getByText("2", { selector: ".font-semibold" })).toBeInTheDocument();
    expect(within(banner).getByText("1", { selector: ".font-semibold.text-amber-600, .font-semibold.text-amber-600.dark\\:text-amber-400" }).textContent).toContain("1");
    // CTAs presentes
    expect(screen.getByTestId("sync-checkpoint-resume")).toBeInTheDocument();
    expect(screen.getByTestId("sync-checkpoint-restart")).toBeInTheDocument();
    expect(screen.getByTestId("sync-checkpoint-discard")).toBeInTheDocument();
  });

  it('"Retomar" preserva o liveSummary do checkpoint e remove o banner', async () => {
    seedGuestPatients(3);
    seedExpiredCheckpoint();
    await renderPage();

    const resume = await screen.findByTestId("sync-checkpoint-resume");
    fireEvent.click(resume);

    // Banner some
    expect(screen.queryByTestId("sync-checkpoint-expired")).not.toBeInTheDocument();
    // Resumo "ao vivo" passa a refletir o que veio do checkpoint
    const live = await screen.findByTestId("sync-live-summary");
    expect(live.textContent).toMatch(/2/); // 2 pacientes importados
  });

  it('"Recomeçar do zero" some com o banner e zera o checkpoint', async () => {
    seedGuestPatients(3);
    seedExpiredCheckpoint();
    await renderPage();

    const restart = await screen.findByTestId("sync-checkpoint-restart");
    fireEvent.click(restart);

    expect(screen.queryByTestId("sync-checkpoint-expired")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(GUEST_SYNC_CHECKPOINT_KEY)).toBeNull();
    // Pacientes guest ainda estão lá para serem reimportados
    expect(window.localStorage.getItem(GUEST_DATA_KEY)).not.toBeNull();
  });

  it('"Descartar" remove o checkpoint do storage e some com o banner', async () => {
    seedGuestPatients(3);
    seedExpiredCheckpoint();
    await renderPage();

    const discard = await screen.findByTestId("sync-checkpoint-discard");
    fireEvent.click(discard);

    expect(screen.queryByTestId("sync-checkpoint-expired")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(GUEST_SYNC_CHECKPOINT_KEY)).toBeNull();
  });

  it("checkpoint fresco (não expirado) NÃO mostra o banner de fallback", async () => {
    seedGuestPatients(3);
    // updatedAt agora → fresh
    const fresh: GuestSyncCheckpoint = {
      userId: "user-1",
      steps: { patients: "running", appointments: "pending", teleconsultations: "pending" },
      liveSummary: {
        outcome: "merged",
        patients: { imported: 1, skippedDuplicate: 0, skippedQuota: 0 },
        appointments: { imported: 0, skippedDuplicate: 0, skippedQuota: 0 },
        duplicates: { patients: [], appointments: [] },
        at: new Date().toISOString(),
      },
      pendingPatientIds: ["gp1", "gp2"],
      pendingAppointmentIds: [],
      importPatients: true,
      importAppointments: true,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(GUEST_SYNC_CHECKPOINT_KEY, JSON.stringify(fresh));

    await renderPage();

    expect(screen.queryByTestId("sync-checkpoint-expired")).not.toBeInTheDocument();
  });
});

// ── Boundary: comportamento exato no TTL ───────────────────────────────────
//
// `GUEST_SYNC_CHECKPOINT_TTL_MS` define o limite. A regra implementada em
// `readGuestSyncCheckpointDetailed` é:
//   - age <= TTL  →  fresh   (NUNCA aciona o fallback)
//   - age >  TTL  →  expired (aciona o fallback)
//
// Esses testes congelam Date.now para garantir que o limite é respeitado
// no milissegundo certo — sem flakiness por relógio real.
describe("SyncGuestData — fronteira do TTL", () => {
  it("age = TTL exatamente → checkpoint é considerado FRESH (sem fallback)", async () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);

    const updatedAt = new Date(now - GUEST_SYNC_CHECKPOINT_TTL_MS).toISOString();
    const cp: GuestSyncCheckpoint = {
      userId: "user-1",
      steps: { patients: "running", appointments: "pending", teleconsultations: "pending" },
      liveSummary: {
        outcome: "merged",
        patients: { imported: 1, skippedDuplicate: 0, skippedQuota: 0 },
        appointments: { imported: 0, skippedDuplicate: 0, skippedQuota: 0 },
        duplicates: { patients: [], appointments: [] },
        at: updatedAt,
      },
      pendingPatientIds: ["gp0"],
      pendingAppointmentIds: [],
      importPatients: true,
      importAppointments: true,
      updatedAt,
    };
    window.localStorage.setItem(GUEST_SYNC_CHECKPOINT_KEY, JSON.stringify(cp));
    seedGuestPatients(3);

    // Sanity: o helper concorda com a UI sobre o limite.
    const { readGuestSyncCheckpointDetailed } = await import("@/lib/guestStorage");
    expect(readGuestSyncCheckpointDetailed("user-1").status).toBe("fresh");

    await renderPage();

    expect(screen.queryByTestId("sync-checkpoint-expired")).not.toBeInTheDocument();
  });

  it("age = TTL + 1ms → checkpoint é EXPIRED (fallback aparece)", async () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);

    const updatedAt = new Date(now - GUEST_SYNC_CHECKPOINT_TTL_MS - 1).toISOString();
    const cp: GuestSyncCheckpoint = {
      userId: "user-1",
      steps: { patients: "done", appointments: "pending", teleconsultations: "pending" },
      liveSummary: {
        outcome: "merged",
        patients: { imported: 2, skippedDuplicate: 0, skippedQuota: 0 },
        appointments: { imported: 0, skippedDuplicate: 0, skippedQuota: 0 },
        duplicates: { patients: [], appointments: [] },
        at: updatedAt,
      },
      pendingPatientIds: ["gp2"],
      pendingAppointmentIds: [],
      importPatients: true,
      importAppointments: true,
      updatedAt,
    };
    window.localStorage.setItem(GUEST_SYNC_CHECKPOINT_KEY, JSON.stringify(cp));
    seedGuestPatients(3);

    const { readGuestSyncCheckpointDetailed } = await import("@/lib/guestStorage");
    expect(readGuestSyncCheckpointDetailed("user-1").status).toBe("expired");

    await renderPage();

    expect(await screen.findByTestId("sync-checkpoint-expired")).toBeInTheDocument();
  });
});
