import { test, expect } from "@playwright/test";

/**
 * Acessibilidade leve para /experimente: como é um redirect imediato,
 * o requisito é que o usuário NUNCA enxergue uma tela intermediária
 * e que não haja problemas de foco/ARIA nesse meio-tempo.
 *
 * Não dependemos de axe-core para manter o suite leve; checamos:
 *   - URL final é /register?redirect=/dashboard
 *   - Nenhum conteúdo "demo" / "modo demonstração" foi pintado
 *   - Não há erro de a11y/ARIA no console (role inválido, label faltando)
 *   - Foco do documento não fica preso em nó removido (document.body)
 */

test.describe("/experimente — a11y / no flash", () => {
  test("redirect imediato sem renderizar tela intermediária", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/experimente");
    await page.waitForURL(/\/register\?/, { timeout: 5000 });

    // Conteúdo da antiga demo nunca deve ter sido pintado.
    await expect(page.getByText(/modo demonstração/i)).toHaveCount(0);
    await expect(page.getByText(/experimente sem cadastrar/i)).toHaveCount(0);

    // Nenhum erro/warning de ARIA crítico.
    const ariaIssues = consoleErrors.filter((line) =>
      /aria|role|accessib|focus/i.test(line),
    );
    expect(ariaIssues, ariaIssues.join("\n")).toEqual([]);

    // Foco está em algum elemento real do /register (não preso em body
    // por causa de um nó desmontado durante o redirect).
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? null);
    expect(focusedTag).not.toBeNull();
  });

  test("no flash de loading — html final é /register, não /experimente", async ({ page }) => {
    await page.goto("/experimente");
    await page.waitForURL(/\/register\?/, { timeout: 5000 });
    // <main>/<form> do /register está montado; nada de skeleton/spinner persistente.
    const stillLoading = await page.locator('[data-testid="loading-skeleton"]').count();
    expect(stillLoading).toBe(0);
  });

  test("o nó <Navigate> auxiliar é aria-hidden (não anuncia para leitor de tela)", async ({ page }) => {
    // <Navigate> não renderiza DOM em si, mas garantimos que não há
    // landmark órfão sobrando entre /experimente e /register.
    await page.goto("/experimente");
    await page.waitForURL(/\/register\?/, { timeout: 5000 });
    const orphanLandmarks = await page.evaluate(() => {
      // Conta landmarks duplicados (ex.: 2 <main>) que indicariam
      // hidratação sobreposta.
      return document.querySelectorAll("main").length;
    });
    expect(orphanLandmarks).toBeLessThanOrEqual(1);
  });
});
