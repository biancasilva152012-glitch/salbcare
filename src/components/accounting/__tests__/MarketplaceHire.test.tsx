/**
 * Integração: clicar em "Contratar" no Accounting Marketplace dispara
 * `supabase.from('partner_hires').insert({ user_id, partner_id })` e
 * a query subsequente passa a marcar o parceiro como contratado.
 *
 * Foco: contrato com o backend. Renderizamos somente o `MarketplaceTab`
 * envolvido por um `QueryClientProvider`, mockando supabase + AuthContext.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ── Mock auth ────────────────────────────────────────────────────────────
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-42", email: "u@example.com" } }),
}));

// ── Mock supabase ────────────────────────────────────────────────────────
const partnersFixture = [
  {
    id: "p-1",
    company_name: "Contábil Saúde",
    specialty: "Médicos PJ",
    rating: 5,
    reviews_count: 12,
    monthly_price: 199,
  },
  {
    id: "p-2",
    company_name: "Conta Pro",
    specialty: "Psicólogos",
    rating: 4.7,
    reviews_count: 8,
    monthly_price: 149,
  },
];
let hires: { user_id: string; partner_id: string }[] = [];
const insertSpy = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "accounting_partners") {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({ data: partnersFixture, error: null }),
          }),
        };
      }
      if (table === "partner_hires") {
        return {
          select: () => ({
            eq: (_col: string, _v: string) =>
              Promise.resolve({ data: [...hires], error: null }),
          }),
          insert: (row: any) => {
            insertSpy(row);
            hires.push(row);
            return Promise.resolve({ data: null, error: null });
          },
        };
      }
      return {};
    },
  },
}));

// Mock toast (sonner) para não poluir
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import MarketplaceTab from "@/components/accounting/MarketplaceTab";

const renderTab = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MarketplaceTab />
    </QueryClientProvider>,
  );
};

describe("AccountingMarketplace — contratar parceiro", () => {
  beforeEach(() => {
    hires = [];
    insertSpy.mockClear();
  });

  it("renderiza parceiros e clicar em Contratar insere em partner_hires", async () => {
    renderTab();

    // Aguarda parceiros aparecerem
    expect(await screen.findByText("Contábil Saúde")).toBeInTheDocument();
    expect(screen.getByText("Conta Pro")).toBeInTheDocument();

    const buttons = screen.getAllByRole("button", { name: /Contratar/i });
    expect(buttons).toHaveLength(2);

    fireEvent.click(buttons[0]);

    await waitFor(() =>
      expect(insertSpy).toHaveBeenCalledWith({
        user_id: "user-42",
        partner_id: "p-1",
      }),
    );

    // O backend mockado guarda o registro
    expect(hires).toEqual([{ user_id: "user-42", partner_id: "p-1" }]);
  });

  it("após contratar, o parceiro mostra estado 'Contratado' (refetch)", async () => {
    // Pré-carrega: já existe um hire para p-2
    hires = [{ user_id: "user-42", partner_id: "p-2" }];

    renderTab();

    // Aguarda render dos cards
    await screen.findByText("Conta Pro");

    // O parceiro p-2 deve estar como "Contratado" (não tem botão Contratar)
    await waitFor(() => {
      expect(screen.getByText(/Contratado/i)).toBeInTheDocument();
    });

    // p-1 ainda tem botão
    expect(screen.getByRole("button", { name: /Contratar/i })).toBeInTheDocument();
  });
});
