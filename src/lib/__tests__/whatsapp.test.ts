import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  WHATSAPP_NUMBER,
  DEFAULT_WHATSAPP_MESSAGE,
  buildWhatsAppUrl,
  buildLeadWhatsAppMessage,
  LEAD_MESSAGE_MAX_CHARS,
} from "../whatsapp";

const LANDING_DIR = "src/components/landing";
const FAB_FILE = "src/components/WhatsAppFab.tsx";

const walk = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(tsx?|jsx?)$/.test(entry)) out.push(p);
  }
  return out;
};

describe("WhatsApp helper", () => {
  it("builds wa.me URL with the official number and default message", () => {
    const url = buildWhatsAppUrl();
    expect(url.startsWith(`https://wa.me/${WHATSAPP_NUMBER}?text=`)).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1])).toBe(DEFAULT_WHATSAPP_MESSAGE);
  });

  it("buildLeadWhatsAppMessage stays under hard limit even with huge inputs", () => {
    const huge = "x".repeat(5000);
    const msg = buildLeadWhatsAppMessage({
      nome: huge, email: huge, whatsapp: huge, dor: huge,
    });
    expect(msg.length).toBeLessThanOrEqual(LEAD_MESSAGE_MAX_CHARS);
    expect(msg.startsWith(DEFAULT_WHATSAPP_MESSAGE)).toBe(true);
  });

  it("buildLeadWhatsAppMessage includes all variables for normal input", () => {
    const msg = buildLeadWhatsAppMessage({
      nome: "Ana Souza",
      email: "ana@clinic.com",
      whatsapp: "(11) 98888-7777",
      dor: "controle financeiro",
    });
    expect(msg).toContain("Nome: Ana Souza");
    expect(msg).toContain("E-mail: ana@clinic.com");
    expect(msg).toContain("WhatsApp: (11) 98888-7777");
    expect(msg).toContain("Principal dor: controle financeiro");
  });
});

describe("Landing CTAs use wa.me only (no api.whatsapp.com)", () => {
  const files = [...walk(LANDING_DIR), FAB_FILE];

  it("collected landing files for inspection", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const f of files) {
    it(`${f} does not use api.whatsapp.com`, () => {
      const src = readFileSync(f, "utf8");
      expect(src.includes("api.whatsapp.com")).toBe(false);
    });
  }

  it("LeadDemoFormSection uses the unified buildLeadWhatsAppMessage template", () => {
    const src = readFileSync(`${LANDING_DIR}/LeadDemoFormSection.tsx`, "utf8");
    expect(src).toContain("buildLeadWhatsAppMessage");
    // No raw "Olá Bianca" string concatenations outside the helper
    const rawMatches = src.match(/`Olá Bianca[^`]*\$\{/g) || [];
    expect(rawMatches.length).toBe(0);
  });
});
