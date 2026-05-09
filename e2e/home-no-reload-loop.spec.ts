import { test, expect } from "@playwright/test";

/**
 * Garante que a home pública NÃO entra em loop de reload quando acessada
 * "via link externo" (sem cookies/sessão prévia, com referrer do Google).
 *
 * Cobre a regressão real: dupla registração de Service Worker no mesmo
 * escopo "/" causava controllerchange contínuo → reload infinito.
 */
test.describe("Home pública — sem loop de reload (acesso externo)", () => {
  test("permanece estável por 30s sem refresh", async ({ page, context }) => {
    await context.clearCookies();
    await context.addInitScript(() => {
      try { localStorage.clear(); sessionStorage.clear(); } catch {}
    });

    // Conta navegações no nível do frame principal.
    let navigations = 0;
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) navigations += 1;
    });

    // Captura logs de loop emitidos por src/lib/swDiagnostics.ts
    const swLoopLogs: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("sw-loop-detected")) swLoopLogs.push(text);
    });

    // Simula chegada via Google.
    await page.setExtraHTTPHeaders({ referer: "https://www.google.com/" });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#root")).not.toBeEmpty();

    const navsAfterLoad = navigations;

    // Observa por 30s.
    await page.waitForTimeout(30_000);

    const extraNavs = navigations - navsAfterLoad;
    expect(
      extraNavs,
      `Home pública refez ${extraNavs} navegação(ões) em 30s — provável loop de reload`,
    ).toBe(0);
    expect(
      swLoopLogs,
      `Diagnóstico SW detectou loop:\n${swLoopLogs.join("\n")}`,
    ).toEqual([]);

    // Sanity: app continua interativo.
    await expect(page.locator("#root")).not.toBeEmpty();
    expect(new URL(page.url()).pathname).toBe("/");
  });
});
