/**
 * PremiumRoute — auditoria backend.
 *
 * Garante que quando o <PremiumRoute> redireciona para /upgrade, o helper
 * `logPremiumRouteBlock` é chamado e termina inserindo uma linha em
 * `premium_route_blocks` com:
 *   - module exato passado como prop ("accounting", "legal" etc.)
 *   - reason exato derivado do estado da assinatura
 *     (trial_expired | subscription_canceled | premium_required)
 *   - attempted_path com a rota que o usuário tentou abrir
 *   - user_id do usuário autenticado
 *
 * O console.info também sai com a mesma assinatura — útil para inspeção
 * em dev e testes E2E.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// ── Mocks de auth ────────────────────────────────────────────────────────
type SubState = {
  subscribed: boolean;
  loading: boolean;
  trialDaysRemaining: number;
  paymentStatus: "none" | "active" | "canceled" | "trialing";
};

let mockUser: { id: string; email?: string } | null = null;
let mockSub: SubState = {
  subscribed: false,
  loading: false,
  trialDaysRemaining: 0,
  paymentStatus: "none",
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    subscription: mockSub,
    userType: "professional",
    userTypeLoading: false,
  }),
}));

vi.mock("@/config/admin", () => ({
  isAdminEmail: () => false,
}));

// ── Mock do supabase client (capturamos chamadas a .insert) ──────────────
type AuditPayload = {
  user_id: string;
  module: string;
  reason: string;
  attempted_path: string | null;
  metadata: Record<string, unknown>;
};
const insertSpy = vi.fn((_payload: AuditPayload) =>
  Promise.resolve({ data: null, error: null }),
);
const fromSpy = vi.fn((_table: string) => ({ insert: insertSpy }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: "u-99" } } }),
    },
    from: (table: string) => fromSpy(table),
  },
}));

// Importa DEPOIS dos mocks
import PremiumRoute from "@/components/PremiumRoute";

const renderAt = (path: string, module: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/dashboard/contabilidade"
          element={
            <PremiumRoute module={module}>
              <div data-testid="protected">SECRET</div>
            </PremiumRoute>
          }
        />
        <Route
          path="/dashboard/juridico"
          element={
            <PremiumRoute module={module}>
              <div data-testid="protected">SECRET</div>
            </PremiumRoute>
          }
        />
        <Route path="/upgrade" element={<div data-testid="upgrade">UPGRADE</div>} />
        <Route path="/login" element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  mockUser = { id: "u-99", email: "free@example.com" };
  mockSub = {
    subscribed: false,
    loading: false,
    trialDaysRemaining: 0,
    paymentStatus: "none",
  };
  insertSpy.mockClear();
  fromSpy.mockClear();
  // Limpa rate-limit para evitar interferência entre testes
  if (typeof window !== "undefined") {
    window.sessionStorage.clear();
  }
});

describe("PremiumRoute — auditoria backend", () => {
  it("trial expirado → grava module e reason exatos em premium_route_blocks", async () => {
    mockSub = {
      subscribed: false,
      loading: false,
      trialDaysRemaining: 0,
      paymentStatus: "none",
    };

    renderAt("/dashboard/contabilidade?utm=x", "accounting");

    // Redireciona para /upgrade
    expect(await screen.findByTestId("upgrade")).toBeInTheDocument();

    // E grava na tabela de auditoria
    await waitFor(() => expect(insertSpy).toHaveBeenCalledTimes(1));
    expect(fromSpy).toHaveBeenCalledWith("premium_route_blocks");
    const payload = insertSpy.mock.calls[0][0];
    expect(payload).toMatchObject({
      user_id: "u-99",
      module: "accounting",
      reason: "trial_expired",
    });
    expect(payload.attempted_path).toBe("/dashboard/contabilidade?utm=x");
    expect(payload.metadata).toMatchObject({
      trialDaysRemaining: 0,
      paymentStatus: "none",
    });
  });

  it("assinatura cancelada → reason='subscription_canceled' com module exato", async () => {
    mockSub = {
      subscribed: false,
      loading: false,
      trialDaysRemaining: 0,
      paymentStatus: "canceled",
    };

    renderAt("/dashboard/juridico", "legal");

    expect(await screen.findByTestId("upgrade")).toBeInTheDocument();
    await waitFor(() => expect(insertSpy).toHaveBeenCalledTimes(1));
    const payload = insertSpy.mock.calls[0][0];
    expect(payload.module).toBe("legal");
    expect(payload.reason).toBe("subscription_canceled");
    expect(payload.attempted_path).toBe("/dashboard/juridico");
  });

  it("trial ainda ativo (>0 dias) → libera acesso e NÃO grava bloqueio", async () => {
    mockSub = {
      subscribed: false,
      loading: false,
      trialDaysRemaining: 3,
      paymentStatus: "trialing",
    };

    renderAt("/dashboard/contabilidade", "accounting");

    expect(await screen.findByTestId("protected")).toBeInTheDocument();
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("rate-limit: redirecionamentos repetidos não duplicam linhas em <5s", async () => {
    mockSub = {
      subscribed: false,
      loading: false,
      trialDaysRemaining: 0,
      paymentStatus: "canceled",
    };

    const { unmount } = renderAt("/dashboard/contabilidade", "accounting");
    await waitFor(() => expect(insertSpy).toHaveBeenCalledTimes(1));
    unmount();

    // Re-monta — mesma assinatura → rate-limit deve impedir 2ª inserção.
    renderAt("/dashboard/contabilidade", "accounting");
    // Aguarda o redirect para garantir que o efeito rodou.
    expect(await screen.findByTestId("upgrade")).toBeInTheDocument();
    // Mantém em 1 (rate-limited).
    await new Promise((r) => setTimeout(r, 50));
    expect(insertSpy).toHaveBeenCalledTimes(1);
  });
});
