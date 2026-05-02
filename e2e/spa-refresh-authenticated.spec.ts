import { test, expect } from "@playwright/test";
import { loginAs, requireTestUser, STORAGE_KEY } from "./helpers/auth";

/**
 * Login + F5 nas rotas críticas.
 *
 * Garante que após F5 em /dashboard, /dashboard/agenda e /dashboard/financeiro:
 *  - O usuário continua autenticado (a sessão Supabase persiste em localStorage).
 *  - A rota não retorna 404 nem cai em /login.
 *  - Elementos específicos de cada tela renderizam (sem regressão de rota).
 *
 * Reutiliza a sessão do mesmo processo via cache em `helpers/auth.ts`,
 * reduzindo flakiness — só fazemos um POST /auth/v1/token por execução.
 */

const SCREENS = [
  {
    route: "/dashboard",
    // Dashboard logado mostra avatar/menu admin/painel — usamos o link "Agenda"
    // do BottomNav que sempre aparece para profissionais autenticados.
    expect: { role: "link" as const, name: /agenda/i },
  },
  {
    route: "/dashboard/agenda",
    expect: { role: "heading" as const, name: /^agenda$/i },
  },
  {
    route: "/dashboard/financeiro",
    // "Total recebido em <mês>" é o KPI principal da tela.
    expect: { text: /total recebido em/i },
  },
] as const;

test.describe("Refresh em rotas profundas — autenticado", () => {
  test.beforeAll(() => {
    requireTestUser(test);
  });

  for (const screen of SCREENS) {
    test(`F5 em ${screen.route} mantém sessão e renderiza UI esperada`, async ({ page }) => {
      // 1. Login programático + navigate
      await loginAs(page, screen.route);
      await expect(page.locator("#root")).not.toBeEmpty();

      // 2. Verifica que não fomos redirecionados para /login
      const pathBefore = new URL(page.url()).pathname;
      expect(pathBefore, `não devia cair em /login antes do F5`).not.toBe("/login");
      expect(pathBefore).not.toMatch(/\/404$/);

      // 3. Elemento específico da tela renderiza
      if ("role" in screen.expect) {
        await expect(
          page.getByRole(screen.expect.role, { name: screen.expect.name }).first(),
        ).toBeVisible({ timeout: 15_000 });
      } else {
        await expect(page.getByText(screen.expect.text).first()).toBeVisible({
          timeout: 15_000,
        });
      }

      // 4. F5
      const reloaded = await page.reload({ waitUntil: "domcontentloaded" });
      expect(reloaded!.status()).toBeLessThan(400);

      // 5. Sessão persiste no localStorage
      const tokenAfter = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
      expect(tokenAfter, "sessão Supabase deve persistir após F5").not.toBeNull();

      // 6. URL continua a mesma — nada de redirect para /login após refresh
      const pathAfter = new URL(page.url()).pathname;
      expect(pathAfter).toBe(screen.route);
      expect(pathAfter).not.toMatch(/\/404$/);

      // 7. Elemento específico continua presente após refresh
      if ("role" in screen.expect) {
        await expect(
          page.getByRole(screen.expect.role, { name: screen.expect.name }).first(),
        ).toBeVisible({ timeout: 15_000 });
      } else {
        await expect(page.getByText(screen.expect.text).first()).toBeVisible({
          timeout: 15_000,
        });
      }

      // 8. Nada de NotFound do app/host
      const html = (await page.content()).toLowerCase();
      expect(html).not.toContain("404: not found");
      expect(html).not.toContain("página não encontrada");
    });
  }
});
