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

  it("aceita ?redirect= no fluxo visitante e re-emite como /register?redirect=", () => {
    const r = buildExperimenteRedirect({
      authenticated: false,
      search: "?redirect=/dashboard/pacientes",
    });
    const sp = u(r).searchParams;
    expect(u(r).pathname).toBe("/register");
    expect(sp.get("redirect")).toBe("/dashboard/pacientes");
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

  it("?redirect= no visitante é descartado e SOMENTE o redirect canônico fica", () => {
    const r = buildExperimenteRedirect({
      authenticated: false,
      search: "?redirect=/dashboard/agenda&redirect=/admin",
    });
    const sp = u(r).searchParams;
    // Os valores brutos `redirect=...` da query foram consumidos.
    // O `redirect=` que aparece no output é o canônico, gerado por nós.
    expect(sp.getAll("redirect")).toEqual(["/dashboard/agenda"]);
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
    const sp = u(r).searchParams;
    expect(u(r).pathname).toBe("/app/register");
    expect(sp.get("redirect")).toBe("/app/dashboard/pacientes");
    expect(sp.getAll("utm_source")).toEqual(["a", "b"]);
    expect(sp.get("ref")).toBe("x");
  });
});
