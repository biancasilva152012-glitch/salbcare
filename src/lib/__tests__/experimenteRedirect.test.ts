import { describe, it, expect } from "vitest";
import { buildExperimenteRedirect } from "../experimenteRedirect";

const url = (s: string) => new URL(s, "http://x");

describe("buildExperimenteRedirect", () => {
  describe("base path support", () => {
    it("aplica prefixo /app no destino do logado", () => {
      const r = buildExperimenteRedirect({ authenticated: true, basePath: "/app" });
      expect(r).toBe("/app/dashboard");
    });

    it("aplica prefixo no /register e no ?redirect= do visitante", () => {
      const r = buildExperimenteRedirect({ authenticated: false, basePath: "/app" });
      const u = url(r);
      expect(u.pathname).toBe("/app/register");
      expect(u.searchParams.get("redirect")).toBe("/app/dashboard");
    });

    it("aplica prefixo combinado com ?next= permitido (logado, deep route)", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        basePath: "/app",
        search: "?next=/dashboard/agenda",
      });
      expect(r).toBe("/app/dashboard/agenda");
    });

    it("aplica prefixo combinado com ?next= permitido (visitante)", () => {
      const r = buildExperimenteRedirect({
        authenticated: false,
        basePath: "/app",
        search: "?next=/dashboard/pacientes",
      });
      const u = url(r);
      expect(u.pathname).toBe("/app/register");
      expect(u.searchParams.get("redirect")).toBe("/app/dashboard/pacientes");
    });

    it("normaliza basePath (com/sem barra inicial/final)", () => {
      expect(buildExperimenteRedirect({ authenticated: true, basePath: "app" }))
        .toBe("/app/dashboard");
      expect(buildExperimenteRedirect({ authenticated: true, basePath: "/app/" }))
        .toBe("/app/dashboard");
      expect(buildExperimenteRedirect({ authenticated: true, basePath: "/" }))
        .toBe("/dashboard");
      expect(buildExperimenteRedirect({ authenticated: true, basePath: "" }))
        .toBe("/dashboard");
      expect(buildExperimenteRedirect({ authenticated: true }))
        .toBe("/dashboard");
    });
  });

  describe("query sanitization", () => {
    it("remove TODOS os parâmetros desconhecidos no fluxo logado", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        search:
          "?utm_source=hero&foo=1&bar=2&token=secret&utm_campaign=launch&__proto__=x",
      });
      const u = url(r);
      expect(u.pathname).toBe("/dashboard");
      const keys = [...u.searchParams.keys()].sort();
      expect(keys).toEqual(["utm_campaign", "utm_source"]);
      expect(u.searchParams.get("foo")).toBeNull();
      expect(u.searchParams.get("token")).toBeNull();
    });

    it("remove TODOS os parâmetros desconhecidos no fluxo visitante (mantendo redirect)", () => {
      const r = buildExperimenteRedirect({
        authenticated: false,
        search: "?utm_source=hero&ref=abc&evil=1&password=123",
      });
      const u = url(r);
      const keys = [...u.searchParams.keys()].sort();
      expect(keys).toEqual(["redirect", "ref", "utm_source"]);
      expect(u.searchParams.get("redirect")).toBe("/dashboard");
      expect(u.searchParams.get("ref")).toBe("abc");
      expect(u.searchParams.get("evil")).toBeNull();
      expect(u.searchParams.get("password")).toBeNull();
    });

    it("preserva todos os utm_* e ref válidos", () => {
      const r = buildExperimenteRedirect({
        authenticated: false,
        search:
          "?utm_source=a&utm_medium=b&utm_campaign=c&utm_term=d&utm_content=e&ref=f",
      });
      const u = url(r);
      ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref"]
        .forEach((k) => expect(u.searchParams.has(k)).toBe(true));
    });

    it("não vaza next/nextRedirect no querystring final (são consumidos)", () => {
      const r1 = buildExperimenteRedirect({
        authenticated: true,
        search: "?next=/dashboard/agenda&utm_source=x",
      });
      expect(url(r1).searchParams.has("next")).toBe(false);

      const r2 = buildExperimenteRedirect({
        authenticated: false,
        search: "?nextRedirect=/dashboard/pacientes&utm_source=x",
      });
      const u = url(r2);
      expect(u.searchParams.has("nextRedirect")).toBe(false);
      expect(u.searchParams.has("next")).toBe(false);
      expect(u.searchParams.get("redirect")).toBe("/dashboard/pacientes");
    });

    it("aceita nextRedirect como sinônimo de next", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        search: "?nextRedirect=/dashboard/teleconsulta",
      });
      expect(r).toBe("/dashboard/teleconsulta");
    });
  });

  describe("open-redirect protection", () => {
    it.each([
      "https://evil.com",
      "//evil.com",
      "javascript:alert(1)",
      "/admin/users",
      "../etc/passwd",
      "",
    ])("descarta next inválido %p e usa /dashboard", (bad) => {
      const r = buildExperimenteRedirect({
        authenticated: false,
        search: `?next=${encodeURIComponent(bad)}`,
      });
      expect(url(r).searchParams.get("redirect")).toBe("/dashboard");
    });
  });
});
