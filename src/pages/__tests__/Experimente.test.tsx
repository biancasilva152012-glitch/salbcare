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

  it("visitante → /dashboard direto (sem /register)", async () => {
    renderAt("/experimente");
    await waitFor(() => expect(screen.getByTestId("dashboard")).toBeInTheDocument());
    expect(screen.getByTestId("path").textContent).toBe("/dashboard");
    expect(screen.queryByTestId("register")).not.toBeInTheDocument();
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
    await waitFor(() => expect(screen.getByTestId("dashboard")).toBeInTheDocument());
    const search = screen.getByTestId("search").textContent ?? "";
    expect(search).toContain("utm_source=hero");
    expect(search).toContain("utm_campaign=launch");
    expect(search).not.toContain("redirect=");
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

  it("bloqueia ?next= absoluto/protocol-relative (open-redirect) e cai em /dashboard", async () => {
    renderAt("/experimente?next=https://evil.com");
    await waitFor(() => expect(screen.getByTestId("dashboard")).toBeInTheDocument());
    expect(screen.getByTestId("path").textContent).toBe("/dashboard");
    expect(screen.queryByTestId("register")).not.toBeInTheDocument();

    renderAt("/experimente?next=//evil.com");
    await waitFor(() => expect(screen.getAllByTestId("dashboard").length).toBeGreaterThan(0));
  });

  it("propaga ?next= permitido direto para o destino (visitante)", async () => {
    renderAt("/experimente?next=/dashboard/pacientes&utm_source=ads");
    await waitFor(() => expect(screen.getByTestId("dashboard")).toBeInTheDocument());
    expect(screen.getByTestId("path").textContent).toBe("/dashboard/pacientes");
    const search = screen.getByTestId("search").textContent ?? "";
    expect(search).toContain("utm_source=ads");
    expect(search).not.toContain("redirect=");
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

  it("emite log leve com flow + preservedKeys (sem dados sensíveis)", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    mockAuth = { user: { id: "u1" }, loading: false };
    renderAt("/experimente?utm_source=hero&ref=abc&token=secret");
    await waitFor(() => expect(screen.getByTestId("dashboard")).toBeInTheDocument());
    const calls = spy.mock.calls.filter((c) => String(c[0]).includes("[experimente]"));
    expect(calls.length).toBeGreaterThan(0);
    const payload = calls[0][1] as {
      flow: "authed" | "visitor";
      cleanedKeys: number;
      preservedKeys: string[];
    };
    expect(payload.flow).toBe("authed");
    expect(typeof payload.cleanedKeys).toBe("number");
    expect(payload.preservedKeys.sort()).toEqual(["ref", "utm_source"]);
    // garante que nenhum dado sensível (id, email, valor de token) vaza
    const serialized = JSON.stringify(calls);
    expect(serialized).not.toContain("u1");
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("hero"); // valores não são logados
    expect(serialized).not.toContain("abc");
    spy.mockRestore();
  });
});
