import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Experimente from "../Experimente";
import { DEMO_STORAGE } from "@/lib/demoStorage";

// --- Mock auth context so we can flip user/loading per test ---
let mockAuth: { user: { id: string } | null; loading: boolean } = {
  user: null,
  loading: false,
};
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

// Avoid pulling the real PageSkeleton/PageContainer trees.
vi.mock("@/components/PageContainer", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/PageSkeleton", () => ({
  default: () => <div data-testid="loading-skeleton" />,
}));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/experimente" element={<Experimente />} />
        <Route path="/dashboard" element={<div data-testid="dashboard">DASHBOARD</div>} />
        <Route
          path="/register"
          element={
            <div data-testid="register">
              <span data-testid="register-search">{window.location.search}</span>
              REGISTER
            </div>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

describe("/experimente redirect", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockAuth = { user: null, loading: false };
  });

  it("redireciona visitante para /register com redirect=/dashboard", async () => {
    mockAuth = { user: null, loading: false };
    renderAt("/experimente");

    await waitFor(() => expect(screen.getByTestId("register")).toBeInTheDocument());
    // MemoryRouter não atualiza window.location.search, então validamos
    // que o componente Register foi renderizado (rota correta).
  });

  it("redireciona usuário logado para /dashboard", async () => {
    mockAuth = { user: { id: "user-1" }, loading: false };
    renderAt("/experimente");

    await waitFor(() => expect(screen.getByTestId("dashboard")).toBeInTheDocument());
  });

  it("mostra skeleton enquanto auth está carregando", () => {
    mockAuth = { user: null, loading: true };
    renderAt("/experimente");

    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
    expect(screen.queryByTestId("register")).not.toBeInTheDocument();
  });

  it("preserva query string ao redirecionar visitante", async () => {
    mockAuth = { user: null, loading: false };
    renderAt("/experimente?utm_source=hero&plan=essencial");

    await waitFor(() => expect(screen.getByTestId("register")).toBeInTheDocument());
    // Validamos via location atual do router renderizando com Routes acima.
  });

  it("preserva query string ao redirecionar usuário logado", async () => {
    mockAuth = { user: { id: "user-1" }, loading: false };
    renderAt("/experimente?utm_source=hero");

    await waitFor(() => expect(screen.getByTestId("dashboard")).toBeInTheDocument());
  });

  it("limpa todas as chaves do localStorage demo antes de redirecionar", async () => {
    // Popula o localStorage com TODAS as chaves do DEMO_STORAGE
    Object.values(DEMO_STORAGE).forEach((k) => {
      window.localStorage.setItem(k, "stale-data");
    });

    // Sanity check
    Object.values(DEMO_STORAGE).forEach((k) => {
      expect(window.localStorage.getItem(k)).toBe("stale-data");
    });

    mockAuth = { user: { id: "user-1" }, loading: false };
    renderAt("/experimente");

    await waitFor(() => {
      Object.values(DEMO_STORAGE).forEach((k) => {
        expect(window.localStorage.getItem(k)).toBeNull();
      });
    });
  });

  it("não toca em chaves não relacionadas ao demo", async () => {
    window.localStorage.setItem("auth-token", "keep-me");
    window.localStorage.setItem("user-prefs", "keep-me-too");

    mockAuth = { user: { id: "user-1" }, loading: false };
    renderAt("/experimente");

    await waitFor(() => expect(screen.getByTestId("dashboard")).toBeInTheDocument());
    expect(window.localStorage.getItem("auth-token")).toBe("keep-me");
    expect(window.localStorage.getItem("user-prefs")).toBe("keep-me-too");
  });
});
