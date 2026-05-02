import { test, expect } from "@playwright/test";

/**
 * Visitante anônimo nas rotas críticas.
 *
 * Comportamento esperado:
 * - /dashboard, /dashboard/agenda, /dashboard/financeiro são "guest-friendly"
 *   (renderizam shell de visitante) ou redirecionam para /login.
 * - Em nenhum caso o app deve mostrar 404 ou tela de NotFound do servidor.
 *
 * Combinado com `spa-refresh.spec.ts`, este spec cobre o caminho "sem sessão".
 */

const ROUTES = ["/dashboard", "/dashboard/agenda", "/dashboard/financeiro"];

test.describe("Refresh em rotas profundas — visitante anônimo", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await context.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {}
    });
  });

  for (const route of ROUTES) {
    test(`acesso direto + F5 em ${route} nunca cai em 404`, async ({ page }) => {
      const initial = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(initial).not.toBeNull();
      expect(initial!.status()).toBeLessThan(400);
      await expect(page.locator("#root")).not.toBeEmpty();

      // Estabiliza eventual redirect para /login
      await page.waitForLoadState("networkidle").catch(() => {});

      const path = new URL(page.url()).pathname;
      expect(path).not.toMatch(/\/404$/);
      // Aceitamos tanto a rota original (guest shell) quanto /login.
      expect([route, "/login"].some((p) => path.startsWith(p))).toBe(true);

      const html = (await page.content()).toLowerCase();
      expect(html).not.toContain("404: not found");
      expect(html).not.toContain("página não encontrada");

      // F5
      const reloaded = await page.reload({ waitUntil: "domcontentloaded" });
      expect(reloaded!.status()).toBeLessThan(400);
      await expect(page.locator("#root")).not.toBeEmpty();
      const htmlAfter = (await page.content()).toLowerCase();
      expect(htmlAfter).not.toContain("404: not found");
      expect(htmlAfter).not.toContain("página não encontrada");
    });
  }
});
