/**
 * Smoke tests for the guest-mode page guards: when there's no authenticated
 * user, the four "core" pages (Home/Agenda/Patients/Financial) must render
 * a guest variant and the four "premium" pages (Telehealth/Mentoria/
 * Accounting/Legal) must render the GuestPaywall.
 *
 * We avoid pulling Supabase + react-query graphs into vitest by mocking
 * useAuth + every heavy hook the pages depend on. The aim is purely to
 * validate the early-return branches we added in each page component.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ── Mocks ────────────────────────────────────────────────────────────────
let mockUser: { id: string; email?: string } | null = null;

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    session: mockUser ? { user: mockUser } : null,
    loading: false,
    userType: mockUser ? "professional" : null,
    userTypeLoading: false,
    signOut: vi.fn(),
    subscription: {
      subscribed: false,
      plan: "basic",
      subscriptionEnd: null,
      loading: false,
      trialDaysRemaining: 0,
      paymentStatus: "none",
      needsOnboarding: false,
    },
    refreshSubscription: vi.fn(),
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ order: () => ({ data: [], error: null }) }),
      }),
    }),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
  },
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
    useQuery: () => ({ data: undefined, isLoading: false, refetch: vi.fn() }),
    useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  };
});

vi.mock("@/hooks/useFreemiumLimits", () => ({
  FREE_LIMITS: {
    financialTransactions: 10,
    patients: 5,
    appointments: 5,
    telehealthAttempts: 0,
    mentorshipMessages: 5,
  },
  useFreemiumLimits: () => ({
    isFree: true,
    isAdmin: false,
    isPaid: false,
    isLoading: false,
    canAddFinancial: true,
    canAddPatient: true,
    canAddAppointment: true,
    canCreateTelehealth: false,
    canSendMentorship: true,
    financialCount: 0,
    financialLimit: 10,
    patientsCount: 0,
    patientsLimit: 5,
    appointmentsCount: 0,
    appointmentsLimit: 5,
    telehealthCount: 0,
    telehealthLimit: 0,
    mentorshipCount: 0,
    mentorshipLimit: 5,
    usageByModule: {} as any,
  }),
}));

vi.mock("@/components/SEOHead", () => ({ default: () => null }));
vi.mock("@/components/PageContainer", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

beforeEach(() => {
  mockUser = null;
  if (typeof window !== "undefined") window.localStorage.clear();
});

const renderPage = async (loader: () => Promise<{ default: React.ComponentType }>) => {
  const Mod = await loader();
  return render(
    <MemoryRouter>
      <Mod.default />
    </MemoryRouter>,
  );
};

// ── Core pages: must render guest variant when !user ─────────────────────
describe("guest mode — core pages render localStorage variant when !user", () => {
  it("Dashboard (Home) shows guest dashboard", async () => {
    await renderPage(() => import("@/pages/Dashboard"));
    expect(screen.getByTestId("guest-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("guest-banner")).toBeInTheDocument();
  });

  it("Patients shows guest patients list", async () => {
    await renderPage(() => import("@/pages/Patients"));
    expect(screen.getByTestId("guest-patients")).toBeInTheDocument();
  });

  it("Agenda shows guest agenda", async () => {
    await renderPage(() => import("@/pages/Agenda"));
    expect(screen.getByTestId("guest-agenda")).toBeInTheDocument();
  });

  it("Financial shows the guest paywall (premium feature)", async () => {
    await renderPage(() => import("@/pages/Financial"));
    expect(screen.getByTestId("guest-paywall")).toBeInTheDocument();
  });
});

// ── Premium pages: must always demand a paid account when !user ──────────
describe("guest mode — premium pages always show paywall when !user", () => {
  it("Telehealth → guest paywall", async () => {
    await renderPage(() => import("@/pages/DashboardTeleconsulta"));
    expect(screen.getByTestId("guest-paywall")).toBeInTheDocument();
  });

  it("Mentoria → guest paywall", async () => {
    await renderPage(() => import("@/pages/DashboardMentoria"));
    expect(screen.getByTestId("guest-paywall")).toBeInTheDocument();
  });

  it("Accounting → guest paywall", async () => {
    await renderPage(() => import("@/pages/Accounting"));
    expect(screen.getByTestId("guest-paywall")).toBeInTheDocument();
  });

  it("Legal → guest paywall", async () => {
    await renderPage(() => import("@/pages/Legal"));
    expect(screen.getByTestId("guest-paywall")).toBeInTheDocument();
  });
});
