import { describe, it, expect } from "vitest";
import { resolveUpgradeReason, buildCheckoutQuery } from "../upgradeReason";

describe("resolveUpgradeReason", () => {
  it("retorna null para entrada vazia", () => {
    expect(resolveUpgradeReason(null)).toBeNull();
    expect(resolveUpgradeReason(undefined)).toBeNull();
    expect(resolveUpgradeReason("")).toBeNull();
    expect(resolveUpgradeReason("   ")).toBeNull();
  });

  it("aceita chaves canônicas vindas do PremiumFeatureModal/CTA", () => {
    expect(resolveUpgradeReason("prescriptions")).toBe("prescriptions");
    expect(resolveUpgradeReason("certificates")).toBe("certificates");
    expect(resolveUpgradeReason("telehealth")).toBe("telehealth");
    expect(resolveUpgradeReason("public_directory")).toBe("public_directory");
    expect(resolveUpgradeReason("patients")).toBe("patients");
    expect(resolveUpgradeReason("financial")).toBe("financial");
    expect(resolveUpgradeReason("mentorship")).toBe("mentorship");
  });

  it("mapeia variações em PT-BR para prescriptions", () => {
    expect(resolveUpgradeReason("Receitas digitais")).toBe("prescriptions");
    expect(resolveUpgradeReason("Atestado médico")).toBe("prescriptions");
    expect(resolveUpgradeReason("Receitas e atestados digitais")).toBe("prescriptions");
    expect(resolveUpgradeReason("PRESCRICAO")).toBe("prescriptions");
    expect(resolveUpgradeReason("Certificado digital")).toBe("prescriptions");
  });

  it("mapeia variações para telehealth", () => {
    expect(resolveUpgradeReason("Teleconsulta")).toBe("telehealth");
    expect(resolveUpgradeReason("video chamada")).toBe("telehealth");
    expect(resolveUpgradeReason("Google Meet")).toBe("telehealth");
  });

  it("mapeia variações para public_directory", () => {
    expect(resolveUpgradeReason("Diretório público")).toBe("public_directory");
    expect(resolveUpgradeReason("aparecer em /profissionais")).toBe("public_directory");
    expect(resolveUpgradeReason("marketplace de pacientes")).toBe("public_directory");
  });

  it("retorna null para reason desconhecido", () => {
    expect(resolveUpgradeReason("foo")).toBeNull();
    expect(resolveUpgradeReason("upgrade")).toBeNull();
  });
});

describe("buildCheckoutQuery", () => {
  it("sempre pré-seleciona o plano Essencial (plan=basic)", () => {
    const qs = buildCheckoutQuery(null, null);
    const p = new URLSearchParams(qs);
    expect(p.get("plan")).toBe("basic");
    expect(p.get("reason")).toBeNull();
  });

  it("propaga reason canônico no checkout", () => {
    const qs = buildCheckoutQuery("prescriptions", "prescriptions");
    const p = new URLSearchParams(qs);
    expect(p.get("plan")).toBe("basic");
    expect(p.get("reason")).toBe("prescriptions");
  });

  it("propaga reason resolvido (não a string crua) quando há match", () => {
    // O caller passa o key resolvido para evitar enviar lixo
    const qs = buildCheckoutQuery("telehealth", "video chamada");
    expect(new URLSearchParams(qs).get("reason")).toBe("telehealth");
  });

  it("propaga raw quando o caller não conseguiu resolver mas quer manter rastro", () => {
    const qs = buildCheckoutQuery(null, "outro_motivo");
    expect(new URLSearchParams(qs).get("reason")).toBe("outro_motivo");
  });

  it("garante que todos os reasons do PremiumFeatureModal pré-selecionam Essencial", () => {
    const reasons = [
      "prescriptions",
      "certificates",
      "telehealth",
      "public_directory",
    ] as const;
    for (const r of reasons) {
      const key = resolveUpgradeReason(r);
      expect(key).toBe(r);
      const qs = buildCheckoutQuery(key, r);
      expect(new URLSearchParams(qs).get("plan")).toBe("basic");
      expect(new URLSearchParams(qs).get("reason")).toBe(r);
    }
  });
});
