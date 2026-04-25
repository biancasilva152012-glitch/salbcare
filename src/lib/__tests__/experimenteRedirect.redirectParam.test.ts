import { describe, it, expect } from "vitest";
import { buildExperimenteRedirect } from "../experimenteRedirect";

const u = (s: string) => new URL(s, "http://x");

describe("buildExperimenteRedirect — redirect= como sinônimo de next", () => {
  it("aceita ?redirect=/dashboard/agenda como destino (logado)", () => {
    const r = buildExperimenteRedirect({
      authenticated: true,
      search: "?redirect=/dashboard/agenda",
    });
    expect(r).toBe("/dashboard/agenda");
  });

  it("aceita ?redirect= no fluxo visitante e leva direto ao destino", () => {
    const r = buildExperimenteRedirect({
      authenticated: false,
      search: "?redirect=/dashboard/pacientes",
    });
    const parsed = u(r);
    expect(parsed.pathname).toBe("/dashboard/pacientes");
    expect(parsed.searchParams.has("redirect")).toBe(false);
  });

  it("?redirect= e ?next= concordando → vai para o destino comum", () => {
    const r = buildExperimenteRedirect({
      authenticated: true,
      search: "?next=/dashboard/agenda&redirect=/dashboard/agenda",
    });
    expect(r).toBe("/dashboard/agenda");
  });

  it("?redirect= e ?next= DIVERGINDO → ambíguo → /dashboard", () => {
    const r = buildExperimenteRedirect({
      authenticated: true,
      search: "?next=/dashboard/agenda&redirect=/dashboard/pacientes",
    });
    expect(r).toBe("/dashboard");
  });

  it("?redirect= inválido + ?next= válido → usa o válido", () => {
    const r = buildExperimenteRedirect({
      authenticated: true,
      search: "?redirect=https://evil.com&next=/dashboard/agenda",
    });
    expect(r).toBe("/dashboard/agenda");
  });

  it("?redirect= bloqueia open-redirect mesmo sozinho", () => {
    const r = buildExperimenteRedirect({
      authenticated: true,
      search: "?redirect=https://evil.com",
    });
    expect(r).toBe("/dashboard");
  });

  it("?redirect= não vaza no querystring final (logado)", () => {
    const r = buildExperimenteRedirect({
      authenticated: true,
      search: "?redirect=/dashboard/agenda&utm_source=ads",
    });
    const sp = u(r).searchParams;
    expect(sp.has("redirect")).toBe(false);
    expect(sp.get("utm_source")).toBe("ads");
  });

  it("?redirect= no visitante é consumido e o destino vai direto na URL", () => {
    const r = buildExperimenteRedirect({
      authenticated: false,
      search: "?redirect=/dashboard/agenda&redirect=/admin",
    });
    const parsed = u(r);
    // O destino válido vira o pathname; nenhum `redirect=` aparece no querystring.
    expect(parsed.pathname).toBe("/dashboard/agenda");
    expect(parsed.searchParams.has("redirect")).toBe(false);
  });
});

describe("buildExperimenteRedirect — basePath em ?next=", () => {
  it("aceita ?next=/app/dashboard/agenda quando basePath=/app", () => {
    const r = buildExperimenteRedirect({
      authenticated: true,
      basePath: "/app",
      search: "?next=/app/dashboard/agenda",
    });
    expect(r).toBe("/app/dashboard/agenda");
  });

  it("aceita ?next=/dashboard/agenda (sem prefixo) quando basePath=/app", () => {
    const r = buildExperimenteRedirect({
      authenticated: true,
      basePath: "/app",
      search: "?next=/dashboard/agenda",
    });
    expect(r).toBe("/app/dashboard/agenda");
  });

  it("rejeita ?next=/other/dashboard quando basePath=/app", () => {
    const r = buildExperimenteRedirect({
      authenticated: true,
      basePath: "/app",
      search: "?next=/other/dashboard",
    });
    expect(r).toBe("/app/dashboard");
  });

  it("preserva utm_*/ref repetidos junto com basePath (logado)", () => {
    const r = buildExperimenteRedirect({
      authenticated: true,
      basePath: "/app",
      search: "?next=/dashboard/agenda&utm_source=a&utm_source=b&ref=x&ref=y",
    });
    const sp = u(r).searchParams;
    expect(u(r).pathname).toBe("/app/dashboard/agenda");
    expect(sp.getAll("utm_source")).toEqual(["a", "b"]);
    expect(sp.getAll("ref")).toEqual(["x", "y"]);
  });

  it("preserva utm_*/ref repetidos junto com basePath (visitante)", () => {
    const r = buildExperimenteRedirect({
      authenticated: false,
      basePath: "/app",
      search: "?redirect=/dashboard/pacientes&utm_source=a&utm_source=b&ref=x",
    });
    const parsed = u(r);
    const sp = parsed.searchParams;
    expect(parsed.pathname).toBe("/app/dashboard/pacientes");
    expect(sp.has("redirect")).toBe(false);
    expect(sp.getAll("utm_source")).toEqual(["a", "b"]);
    expect(sp.get("ref")).toBe("x");
  });
});
