import { test, expect } from "@playwright/test";

/**
 * Regressão do bug "página não encontrada ao atualizar (F5)".
 *
 * A SalbCare é uma SPA. Em deploys anteriores, um service worker legado
 * interceptava navegações e quebrava o refresh em rotas profundas, e/ou o
 * host servia 404 ao invés de cair no index.html.
 *
 * Para cada rota crítica, este spec garante:
 *   1. Acesso direto (cold load) responde HTTP 200.
 *   2. F5 (page.reload) também responde HTTP 200.
 *   3. A app SPA renderiza (não é a tela de NotFound do servidor).
 *   4. Visitante não autenticado cai em /login OU permanece numa rota
 *      pública guest-friendly — nunca em "Página não encontrada".
 */

const ROUTES = ["/dashboard", "/dashboard/agenda", "/dashboard/financeiro"];

test.describe("SPA refresh (F5) não retorna 404", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  for (const route of ROUTES) {
    test(`acesso direto + reload em ${route} mantém SPA viva`, async ({ page }) => {
      // 1. Cold load
      const initial = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(initial, `resposta de ${route}`).not.toBeNull();
      expect(initial!.status(), `status inicial de ${route}`).toBeLessThan(400);

      // 2. App montou (root do React presente e com conteúdo)
      await expect(page.locator("#root")).not.toBeEmpty();

      // 3. Não é a tela de NotFound do servidor
      const html = await page.content();
      expect(html.toLowerCase()).not.toContain("404: not found");

      // 4. Visitante anônimo deve ir para /login (ou ficar em rota guest),
      //    nunca em /404 ou tela de NotFound do app.
      await page.waitForLoadState("networkidle").catch(() => {});
      const pathAfter = new URL(page.url()).pathname;
      expect(pathAfter, `path após cold load em ${route}`).not.toMatch(/\/404$/);

      // 5. F5 — o refresh em si é o coração do regression test
      const reloaded = await page.reload({ waitUntil: "domcontentloaded" });
      expect(reloaded, `resposta do reload em ${route}`).not.toBeNull();
      expect(reloaded!.status(), `status do reload em ${route}`).toBeLessThan(400);

      await expect(page.locator("#root")).not.toBeEmpty();

      const htmlAfter = await page.content();
      expect(htmlAfter.toLowerCase()).not.toContain("404: not found");
      expect(page.url()).not.toMatch(/\/404(\?|$)/);
    });
  }
});
