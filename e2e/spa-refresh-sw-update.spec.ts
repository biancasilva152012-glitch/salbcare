import { test, expect } from "@playwright/test";

/**
 * Simula o cenário "service worker antigo instalado" e valida que a
 * navegação em rotas profundas continua funcionando após o refresh.
 *
 * Cobre a regressão real que vimos em produção: um SW legado registrado em
 * `/sw.js` interceptava navegações e quebrava F5 em rotas como
 * /dashboard/financeiro. O kill-switch atual em `public/sw.js` precisa
 * desregistrar o SW e permitir que a SPA continue navegando.
 *
 * Este spec é resiliente quando a feature flag de SW está desativada no
 * preview/iframe (caso típico do dev local) — nesse cenário, o `register`
 * falha silenciosamente e o teste valida apenas que a navegação segue OK.
 */

const ROUTES = ["/dashboard", "/dashboard/agenda", "/dashboard/financeiro"];

test.describe("Atualização de Service Worker — navegação não quebra", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("registra SW kill-switch, faz F5 nas rotas críticas, mantém SPA viva", async ({
    page,
  }) => {
    // 1. Carrega o app uma vez para que /sw.js seja servido pela origem.
    await page.goto("/");
    await expect(page.locator("#root")).not.toBeEmpty();

    // 2. Tenta registrar /sw.js manualmente para simular o estado "SW legado
    //    presente". Em ambientes onde o SW está bloqueado (iframe, preview),
    //    o registro retorna `false` e seguimos o teste mesmo assim.
    const swRegistered = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        // Aguarda o ciclo install → activate (kill-switch se autodestrói no activate).
        await new Promise<void>((resolve) => {
          if (reg.active) return resolve();
          const sw = reg.installing || reg.waiting;
          if (!sw) return resolve();
          sw.addEventListener("statechange", () => {
            if (sw.state === "activated" || sw.state === "redundant") resolve();
          });
          setTimeout(resolve, 5_000);
        });
        return true;
      } catch {
        return false;
      }
    });

    // Log informativo — não falha o teste se SW for bloqueado.
    test.info().annotations.push({
      type: "sw-registered",
      description: String(swRegistered),
    });

    // 3. Para cada rota crítica: navigate + F5, validando que a SPA segue viva.
    for (const route of ROUTES) {
      const initial = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(initial!.status(), `navigate ${route}`).toBeLessThan(400);
      await expect(page.locator("#root")).not.toBeEmpty();

      const reloaded = await page.reload({ waitUntil: "domcontentloaded" });
      expect(reloaded!.status(), `reload ${route}`).toBeLessThan(400);
      await expect(page.locator("#root")).not.toBeEmpty();

      const html = (await page.content()).toLowerCase();
      expect(html, `404 não pode aparecer em ${route} após F5`).not.toContain(
        "404: not found",
      );
      expect(html).not.toContain("página não encontrada");
      expect(new URL(page.url()).pathname).not.toMatch(/\/404$/);
    }

    // 4. Confirma que o kill-switch fez seu trabalho: nenhum SW remanescente
    //    com scriptURL terminando em "/sw.js". Em ambientes sem SW, o array
    //    vem vazio e a asserção também passa.
    const lingering = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return [];
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs
        .map((r) => r.active?.scriptURL || r.waiting?.scriptURL || r.installing?.scriptURL || "")
        .filter((url) => url.endsWith("/sw.js"));
    });
    expect(lingering, "kill-switch deve ter desregistrado /sw.js").toEqual([]);
  });
});
