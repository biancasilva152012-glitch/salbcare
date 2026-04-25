import { describe, it, expect } from "vitest";
import { buildExperimenteRedirect } from "../experimenteRedirect";

const u = (s: string) => new URL(s, "http://x");

describe("buildExperimenteRedirect — query edge cases", () => {
  describe("chaves repetidas (utm_source 2x)", () => {
    it("preserva múltiplos valores para o mesmo utm_* (logado)", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        search: "?utm_source=hero&utm_source=footer&utm_medium=cpc",
      });
      const all = u(r).searchParams.getAll("utm_source");
      expect(all).toEqual(["hero", "footer"]);
      expect(u(r).searchParams.get("utm_medium")).toBe("cpc");
    });

    it("preserva múltiplos valores para o mesmo utm_* (visitante)", () => {
      const r = buildExperimenteRedirect({
        authenticated: false,
        search: "?utm_source=a&utm_source=b&ref=x&ref=y",
      });
      const parsed = u(r);
      expect(parsed.pathname).toBe("/dashboard");
      const sp = parsed.searchParams;
      expect(sp.getAll("utm_source")).toEqual(["a", "b"]);
      expect(sp.getAll("ref")).toEqual(["x", "y"]);
      expect(sp.has("redirect")).toBe(false);
    });

    it("preserva ordem original entre múltiplos utm_*", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        search: "?utm_source=first&utm_campaign=mid&utm_source=second",
      });
      // Ordem: first, mid, second. URLSearchParams.toString() mantém ordem.
      expect(r).toContain("utm_source=first");
      expect(r.indexOf("utm_source=first")).toBeLessThan(r.indexOf("utm_campaign=mid"));
      expect(r.indexOf("utm_campaign=mid")).toBeLessThan(r.indexOf("utm_source=second"));
    });
  });

  describe("valores vazios", () => {
    it("preserva utm_source com valor vazio (logado)", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        search: "?utm_source=&utm_medium=cpc",
      });
      const sp = u(r).searchParams;
      expect(sp.has("utm_source")).toBe(true);
      expect(sp.get("utm_source")).toBe("");
      expect(sp.get("utm_medium")).toBe("cpc");
    });

    it("trata ?next= vazio como ausente e cai em /dashboard", () => {
      const r = buildExperimenteRedirect({
        authenticated: false,
        search: "?next=",
      });
      expect(u(r).pathname).toBe("/dashboard");
    });

    it("query string vazia não quebra", () => {
      expect(buildExperimenteRedirect({ authenticated: true, search: "" })).toBe("/dashboard");
      expect(buildExperimenteRedirect({ authenticated: true, search: "?" })).toBe("/dashboard");
    });

    it("query só com '&' / '=' não quebra", () => {
      expect(() =>
        buildExperimenteRedirect({ authenticated: true, search: "?&&=&" }),
      ).not.toThrow();
      const r = buildExperimenteRedirect({ authenticated: false, search: "?&&=&" });
      expect(u(r).pathname).toBe("/dashboard");
    });
  });

  describe("percent-encoding malformado", () => {
    it("não lança quando o valor tem percent-encoding inválido", () => {
      // %ZZ e % isolado são inválidos. URLSearchParams é tolerante.
      expect(() =>
        buildExperimenteRedirect({
          authenticated: true,
          search: "?utm_source=hero%ZZ&utm_medium=%",
        }),
      ).not.toThrow();
      expect(() =>
        buildExperimenteRedirect({
          authenticated: false,
          search: "?utm_source=%E0%A4%A&ref=%",
        }),
      ).not.toThrow();
    });

    it("descarta `next` com percent-encoding malformado (não vira open-redirect)", () => {
      const r = buildExperimenteRedirect({
        authenticated: false,
        search: "?next=%2F%2Fevil.com",
      });
      // %2F%2F decodifica para "//" → bloqueado pela proteção de open-redirect.
      expect(u(r).searchParams.get("redirect")).toBe("/dashboard");
    });

    it("decodifica `next` percent-encoded válido e respeita allowlist", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        search: "?next=%2Fdashboard%2Fagenda",
      });
      expect(r).toBe("/dashboard/agenda");
    });
  });

  describe("garantia: NADA além de utm_*/ref escapa", () => {
    it("strip total de chaves desconhecidas mesmo quando misturadas com permitidas", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        search:
          "?utm_source=ok&password=leak&utm_medium=ok2&__proto__=evil&token=xxx&ref=keep",
      });
      const sp = u(r).searchParams;
      const keys = [...sp.keys()].sort();
      expect(keys).toEqual(["ref", "utm_medium", "utm_source"]);
    });
  });
});
