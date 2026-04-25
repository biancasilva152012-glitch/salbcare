import { describe, it, expect, beforeEach } from "vitest";
import { DEMO_STORAGE, clearDemoStorage } from "../demoStorage";

describe("clearDemoStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("remove todas as chaves do DEMO_STORAGE quando presentes", () => {
    Object.values(DEMO_STORAGE).forEach((k) => {
      window.localStorage.setItem(k, "x");
    });
    const removed = clearDemoStorage();

    expect(removed.sort()).toEqual([...Object.values(DEMO_STORAGE)].sort());
    Object.values(DEMO_STORAGE).forEach((k) => {
      expect(window.localStorage.getItem(k)).toBeNull();
    });
  });

  it("não remove chaves não relacionadas ao demo", () => {
    window.localStorage.setItem("auth-token", "keep");
    window.localStorage.setItem("user-prefs", "keep");
    window.localStorage.setItem("sb-session", "keep");
    Object.values(DEMO_STORAGE).forEach((k) => {
      window.localStorage.setItem(k, "x");
    });

    clearDemoStorage();

    expect(window.localStorage.getItem("auth-token")).toBe("keep");
    expect(window.localStorage.getItem("user-prefs")).toBe("keep");
    expect(window.localStorage.getItem("sb-session")).toBe("keep");
  });

  it("retorna apenas as chaves que existiam (não as ausentes)", () => {
    window.localStorage.setItem(DEMO_STORAGE.patients, "x");
    window.localStorage.setItem(DEMO_STORAGE.appointments, "x");

    const removed = clearDemoStorage();
    expect(removed.sort()).toEqual([
      DEMO_STORAGE.appointments,
      DEMO_STORAGE.patients,
    ].sort());
  });

  it("é idempotente — segunda chamada retorna lista vazia", () => {
    Object.values(DEMO_STORAGE).forEach((k) => {
      window.localStorage.setItem(k, "x");
    });

    expect(clearDemoStorage().length).toBeGreaterThan(0);
    expect(clearDemoStorage()).toEqual([]);
  });
});
