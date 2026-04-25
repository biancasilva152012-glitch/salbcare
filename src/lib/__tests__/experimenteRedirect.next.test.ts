import { describe, it, expect } from "vitest";
import {
  buildExperimenteRedirect,
  getPreservedKeysFromSearch,
} from "../experimenteRedirect";

const u = (s: string) => new URL(s, "http://x");

describe("buildExperimenteRedirect — repeated next + extra edges", () => {
  describe("next repetido (determinístico)", () => {
    it("mantém destino quando vários nexts apontam para o MESMO valor", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        search: "?next=/dashboard/agenda&next=/dashboard/agenda",
      });
      expect(r).toBe("/dashboard/agenda");
    });

    it("descarta para /dashboard quando nexts válidos DIVERGEM (inconsistência)", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        search: "?next=/dashboard/agenda&next=/dashboard/pacientes",
      });
      // Política conservadora: dois destinos válidos diferentes = ambíguo → /dashboard
      expect(r).toBe("/dashboard");
    });

    it("ignora nexts inválidos e usa o único válido restante", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        search: "?next=/admin/users&next=https://evil.com&next=/dashboard/agenda",
      });
      expect(r).toBe("/dashboard/agenda");
    });

    it("cai em /dashboard quando NENHUM next é permitido", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        search: "?next=/admin&next=//evil.com&next=javascript:alert(1)",
      });
      expect(r).toBe("/dashboard");
    });

    it("mistura next + nextRedirect com mesmo destino é OK", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        search: "?nextRedirect=/dashboard/agenda&next=/dashboard/agenda",
      });
      expect(r).toBe("/dashboard/agenda");
    });

    it("mistura next + nextRedirect com destinos diferentes é ambígua → /dashboard", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        search: "?nextRedirect=/dashboard/pacientes&next=/dashboard/agenda",
      });
      expect(r).toBe("/dashboard");
    });

    it("propaga corretamente o destino direto no fluxo visitante", () => {
      const r = buildExperimenteRedirect({
        authenticated: false,
        search: "?next=/admin&next=/dashboard/teleconsulta&utm_source=ads",
      });
      const parsed = u(r);
      expect(parsed.pathname).toBe("/dashboard/teleconsulta");
      expect(parsed.searchParams.get("utm_source")).toBe("ads");
      expect(parsed.searchParams.has("redirect")).toBe(false);
    });

    it("nunca vaza next/nextRedirect no querystring final mesmo repetidos", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        search:
          "?next=/dashboard/agenda&next=/dashboard/pacientes&nextRedirect=/dashboard/profile",
      });
      const sp = u(r).searchParams;
      expect(sp.has("next")).toBe(false);
      expect(sp.has("nextRedirect")).toBe(false);
    });
  });

  describe("espaços e plus signs", () => {
    it("preserva valores com espaços (codificados como +)", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        search: "?utm_campaign=spring+sale",
      });
      const v = u(r).searchParams.get("utm_campaign");
      expect(v).toBe("spring sale");
    });

    it("preserva valores com espaços (codificados como %20)", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        search: "?utm_campaign=spring%20sale",
      });
      expect(u(r).searchParams.get("utm_campaign")).toBe("spring sale");
    });

    it("preserva plus literal (codificado como %2B)", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        search: "?utm_term=a%2Bb",
      });
      expect(u(r).searchParams.get("utm_term")).toBe("a+b");
    });

    it("re-encoda corretamente espaços no output (%20 ou +) sem corromper", () => {
      const r = buildExperimenteRedirect({
        authenticated: false,
        search: "?utm_source=hero one&ref=foo bar",
      });
      const parsed = u(r);
      expect(parsed.pathname).toBe("/dashboard");
      expect(parsed.searchParams.get("utm_source")).toBe("hero one");
      expect(parsed.searchParams.get("ref")).toBe("foo bar");
    });
  });

  describe("mistura utm_*/ref em fluxo logado e visitante", () => {
    it("logado: preserva todos juntos exatamente, sem reordenar de forma destrutiva", () => {
      const r = buildExperimenteRedirect({
        authenticated: true,
        search:
          "?utm_source=a&ref=b&utm_medium=c&ref=d&utm_campaign=e&utm_source=f",
      });
      const sp = u(r).searchParams;
      expect(sp.getAll("utm_source")).toEqual(["a", "f"]);
      expect(sp.getAll("ref")).toEqual(["b", "d"]);
      expect(sp.get("utm_medium")).toBe("c");
      expect(sp.get("utm_campaign")).toBe("e");
    });

    it("visitante: idem e vai direto ao destino padrão", () => {
      const r = buildExperimenteRedirect({
        authenticated: false,
        search:
          "?utm_source=a&utm_source=b&ref=x&ref=y&utm_medium=z&garbage=1",
      });
      const parsed = u(r);
      expect(parsed.pathname).toBe("/dashboard");
      const sp = parsed.searchParams;
      expect(sp.getAll("utm_source")).toEqual(["a", "b"]);
      expect(sp.getAll("ref")).toEqual(["x", "y"]);
      expect(sp.get("utm_medium")).toBe("z");
      expect(sp.has("redirect")).toBe(false);
      expect(sp.has("garbage")).toBe(false);
    });
  });

  describe("garantia de não-open-redirect (defesa em profundidade)", () => {
    it.each([
      "?next=/dashboard/../admin",
      "?next=/dashboard%2F..%2Fadmin", // %2F = "/"
      "?next= /dashboard", // espaço inicial — falha startsWith("/")
      "?next=\\admin",
      "?next=%09/admin", // tab + path
    ])("descarta tentativa %p e cai em /dashboard", (search) => {
      const r = buildExperimenteRedirect({ authenticated: false, search });
      const redirect = u(r).searchParams.get("redirect");
      expect(redirect).toBe("/dashboard");
      expect(redirect).not.toContain("admin");
      expect(redirect).not.toContain("..");
    });

    it("redirect final NUNCA contém esquema externo, mesmo com input adversarial", () => {
      const adversarial =
        "?utm_source=ok&next=https://evil.com/path?redirect=/dashboard";
      const r = buildExperimenteRedirect({ authenticated: false, search: adversarial });
      expect(r).not.toMatch(/^https?:\/\//);
      expect(r).not.toContain("evil.com");
    });
  });
});

describe("getPreservedKeysFromSearch", () => {
  it("retorna lista ordenada de chaves preservadas (sem valores)", () => {
    expect(
      getPreservedKeysFromSearch("?utm_source=a&ref=b&token=c&utm_medium=d"),
    ).toEqual(["ref", "utm_medium", "utm_source"]);
  });

  it("dedup quando a mesma chave aparece múltiplas vezes", () => {
    expect(
      getPreservedKeysFromSearch("?utm_source=a&utm_source=b&utm_source=c"),
    ).toEqual(["utm_source"]);
  });

  it("nunca inclui next/nextRedirect", () => {
    expect(
      getPreservedKeysFromSearch("?next=/x&nextRedirect=/y&utm_source=a"),
    ).toEqual(["utm_source"]);
  });

  it("retorna [] para query vazia ou inválida", () => {
    expect(getPreservedKeysFromSearch("")).toEqual([]);
    expect(getPreservedKeysFromSearch("?")).toEqual([]);
    expect(getPreservedKeysFromSearch("?evil=1&token=x")).toEqual([]);
  });
});
