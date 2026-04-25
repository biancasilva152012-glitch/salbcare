import { test, expect } from "@playwright/test";

/**
 * /experimente é um redirect público.
 * - Visitantes NÃO autenticados vão DIRETO para /dashboard (modo guest).
 *   Não passa por /register em nenhum momento.
 * - Usuários autenticados vão direto para /dashboard.
 *
 * Este spec só cobre o caminho do visitante (não exige sessão).
 * Os fluxos autenticados são cobertos pelos testes unitários
 * em src/pages/__tests__/Experimente.test.tsx.
 */

test.describe("/experimente redirect (visitante)", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("vai direto para /dashboard sem passar por /register", async ({ page }) => {
    await page.goto("/experimente");
    await page.waitForURL(/\/dashboard(\?|$)/);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/dashboard");

    // Garante que nenhum vestígio do antigo modo demo foi renderizado.
    await expect(page.getByText(/modo demonstração/i)).toHaveCount(0);
  });

  test("preserva parâmetros utm_* e ignora params inesperados", async ({ page }) => {
    await page.goto(
      "/experimente?utm_source=hero&utm_campaign=launch&evil=1&next=/dashboard/agenda",
    );
    await page.waitForURL(/\/dashboard\/agenda(\?|$)/);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/dashboard/agenda");
    expect(url.searchParams.get("utm_source")).toBe("hero");
    expect(url.searchParams.get("utm_campaign")).toBe("launch");
    expect(url.searchParams.get("evil")).toBeNull();
    expect(url.searchParams.get("redirect")).toBeNull();
  });

  test("ignora ?next= fora da allowlist e cai em /dashboard", async ({ page }) => {
    await page.goto("/experimente?next=/admin/users");
    await page.waitForURL(/\/dashboard(\?|$)/);
    expect(new URL(page.url()).pathname).toBe("/dashboard");
  });

  test("bloqueia ?next= absoluto (open-redirect)", async ({ page }) => {
    await page.goto("/experimente?next=https://evil.com");
    await page.waitForURL(/\/dashboard(\?|$)/);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/dashboard");
    expect(url.toString()).not.toContain("evil.com");
  });

  test("limpa o localStorage do demo (chaves salbcare_demo_*)", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("salbcare_demo_patients", "stale");
      localStorage.setItem("salbcare_demo_usage_counters", "stale");
      localStorage.setItem("auth-token", "keep");
    });

    await page.goto("/experimente");
    await page.waitForURL(/\/dashboard(\?|$)/);

    const remaining = await page.evaluate(() => ({
      demoPatients: localStorage.getItem("salbcare_demo_patients"),
      demoCounters: localStorage.getItem("salbcare_demo_usage_counters"),
      authToken: localStorage.getItem("auth-token"),
    }));
    expect(remaining.demoPatients).toBeNull();
    expect(remaining.demoCounters).toBeNull();
    expect(remaining.authToken).toBe("keep");
  });

  test("emite log leve [experimente] sem dados sensíveis", async ({ page }) => {
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.text().includes("[experimente]")) logs.push(msg.text());
    });
    await page.goto("/experimente");
    await page.waitForURL(/\/dashboard(\?|$)/);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.join("\n")).not.toMatch(/@.*\./); // sem e-mail
  });
});
