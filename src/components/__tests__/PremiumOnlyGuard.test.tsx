/**
 * PremiumOnlyGuard: garante que guest vê o GuestPaywall, free vê a tela
 * de upgrade e paid passa direto. Cobre o gap em que um free logado
 * conseguia entrar nas páginas de Mentoria/Telessaúde/Contabilidade/Jurídico.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

let mockUser: { id: string; email?: string } | null = null;
let mockIsPaid = false;
let mockIsAdmin = false;

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    subscription: {
      subscribed: mockIsPaid,
      plan: "basic",
      subscriptionEnd: null,
      loading: false,
      trialDaysRemaining: 0,
      paymentStatus: mockIsPaid ? "active" : "none",
      needsOnboarding: false,
    },
  }),
}));

vi.mock("@/hooks/useFreemiumLimits", () => ({
  FREE_LIMITS: {
    financialTransactions: 10,
    patients: 5,
    appointments: 5,
    telehealthAttempts: 0,
    mentorshipMessages: 5,
  },
  useFreemiumLimits: () => ({
    isPaid: mockIsPaid,
    isAdmin: mockIsAdmin,
    isLoading: false,
  }),
}));

vi.mock("@/components/PageContainer", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import PremiumOnlyGuard from "@/components/PremiumOnlyGuard";

const renderGuard = () =>
  render(
    <MemoryRouter>
      <PremiumOnlyGuard feature="A Mentora IA" reason="mentorship">
        <div data-testid="protected-children">SECRET</div>
      </PremiumOnlyGuard>
    </MemoryRouter>,
  );

beforeEach(() => {
  mockUser = null;
  mockIsPaid = false;
  mockIsAdmin = false;
});

describe("PremiumOnlyGuard", () => {
  it("shows the GuestPaywall when no user (guest)", () => {
    renderGuard();
    expect(screen.getByTestId("guest-paywall")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-children")).not.toBeInTheDocument();
  });

  it("shows the upgrade screen when user is logged in but on free plan", () => {
    mockUser = { id: "u1", email: "free@example.com" };
    renderGuard();
    expect(screen.getByTestId("premium-only-guard")).toBeInTheDocument();
    const cta = screen.getByTestId("premium-upgrade-cta");
    expect(cta.closest("a")).toHaveAttribute("href", "/upgrade?reason=mentorship");
    expect(screen.queryByTestId("protected-children")).not.toBeInTheDocument();
  });

  it("renders children when user is on the paid plan", () => {
    mockUser = { id: "u1" };
    mockIsPaid = true;
    renderGuard();
    expect(screen.getByTestId("protected-children")).toBeInTheDocument();
    expect(screen.queryByTestId("premium-only-guard")).not.toBeInTheDocument();
  });

  it("renders children for admin even when not paid", () => {
    mockUser = { id: "u1" };
    mockIsAdmin = true;
    renderGuard();
    expect(screen.getByTestId("protected-children")).toBeInTheDocument();
  });
});
