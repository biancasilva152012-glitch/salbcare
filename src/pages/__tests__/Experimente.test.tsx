import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Experimente from "../Experimente";
import { DEMO_STORAGE } from "@/lib/demoStorage";

let mockAuth: { user: { id: string } | null; loading: boolean } = {
  user: null,
  loading: false,
};
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("@/components/PageContainer", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/PageSkeleton", () => ({
  default: () => <div data-testid="loading-skeleton" />,
}));

const LocationProbe = () => {
  const loc = useLocation();
  return (
    <div>
      <span data-testid="path">{loc.pathname}</span>
      <span data-testid="search">{loc.search}</span>
    </div>
  );
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/experimente" element={<Experimente />} />
        <Route
          path="/dashboard/*"
          element={
            <div>
              <div data-testid="dashboard">DASHBOARD</div>
              <LocationProbe />
            </div>
          }
        />
        <Route
          path="/register"
          element={
            <div>
              <div data-testid="register">REGISTER</div>
              <LocationProbe />
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

  it("visitante → /register?redirect=/dashboard", async () => {
    renderAt("/experimente");
    await waitFor(() => expect(screen.getByTestId("register")).toBeInTheDocument());
    expect(screen.getByTestId("search").textContent).toBe("?redirect=%2Fdashboard");
  });

  it("logado → /dashboard", async () => {
    mockAuth = { user: { id: "u1" }, loading: false };
    renderAt("/experimente");
    await waitFor(() => expect(screen.getByTestId("dashboard")).toBeInTheDocument());
    expect(screen.getByTestId("path").textContent).toBe("/dashboard");
  });

  it("loading mostra skeleton", () => {
    mockAuth = { user: null, loading: true };
    renderAt("/experimente");
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  it("preserva utm_* e descarta params inesperados", async () => {
    renderAt("/experimente?utm_source=hero&utm_campaign=launch&evil=1");
    await waitFor(() => expect(screen.getByTestId("register")).toBeInTheDocument());
    const search = screen.getByTestId("search").textContent ?? "";
    expect(search).toContain("utm_source=hero");
    expect(search).toContain("utm_campaign=launch");
    expect(search).toContain("redirect=%2Fdashboard");
    expect(search).not.toContain("evil");
  });

  it("usa ?next= quando rota está na allowlist (logado)", async () => {
    mockAuth = { user: { id: "u1" }, loading: false };
    renderAt("/experimente?next=/dashboard/agenda");
    await waitFor(() => expect(screen.getByTestId("dashboard")).toBeInTheDocument());
    expect(screen.getByTestId("path").textContent).toBe("/dashboard/agenda");
  });

  it("ignora ?next= fora da allowlist e cai em /dashboard", async () => {
    mockAuth = { user: { id: "u1" }, loading: false };
    renderAt("/experimente?next=/admin/users");
    await waitFor(() => expect(screen.getByTestId("dashboard")).toBeInTheDocument());
    expect(screen.getByTestId("path").textContent).toBe("/dashboard");
  });

  it("bloqueia ?next= absoluto/protocol-relative (open-redirect)", async () => {
    renderAt("/experimente?next=https://evil.com");
    await waitFor(() => expect(screen.getByTestId("register")).toBeInTheDocument());
    expect(screen.getByTestId("search").textContent).toContain("redirect=%2Fdashboard");

    renderAt("/experimente?next=//evil.com");
    await waitFor(() => expect(screen.getAllByTestId("register").length).toBeGreaterThan(0));
  });

  it("propaga ?next= permitido para /register?redirect=", async () => {
    renderAt("/experimente?next=/dashboard/pacientes&utm_source=ads");
    await waitFor(() => expect(screen.getByTestId("register")).toBeInTheDocument());
    const search = screen.getByTestId("search").textContent ?? "";
    expect(search).toContain("redirect=%2Fdashboard%2Fpacientes");
    expect(search).toContain("utm_source=ads");
  });

  it("limpa todas as chaves do DEMO_STORAGE no redirect", async () => {
    Object.values(DEMO_STORAGE).forEach((k) =>
      window.localStorage.setItem(k, "stale"),
    );
    mockAuth = { user: { id: "u1" }, loading: false };
    renderAt("/experimente");

    await waitFor(() => {
      Object.values(DEMO_STORAGE).forEach((k) => {
        expect(window.localStorage.getItem(k)).toBeNull();
      });
    });
  });

  it("não toca em chaves não-demo", async () => {
    window.localStorage.setItem("auth-token", "keep");
    mockAuth = { user: { id: "u1" }, loading: false };
    renderAt("/experimente");
    await waitFor(() => expect(screen.getByTestId("dashboard")).toBeInTheDocument());
    expect(window.localStorage.getItem("auth-token")).toBe("keep");
  });

  it("emite log leve sem dados sensíveis", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    mockAuth = { user: { id: "u1" }, loading: false };
    renderAt("/experimente");
    await waitFor(() => expect(screen.getByTestId("dashboard")).toBeInTheDocument());
    const calls = spy.mock.calls.filter((c) => String(c[0]).includes("[experimente]"));
    expect(calls.length).toBeGreaterThan(0);
    const payload = calls[0][1] as { authenticated: boolean; cleanedKeys: number };
    expect(payload).toMatchObject({ authenticated: true });
    expect(typeof payload.cleanedKeys).toBe("number");
    // garante que nenhum dado sensível (id, email) vaza
    const serialized = JSON.stringify(calls);
    expect(serialized).not.toContain("u1");
    spy.mockRestore();
  });
});
