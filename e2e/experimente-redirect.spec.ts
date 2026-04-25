import { test, expect } from "@playwright/test";

/**
 * /experimente é um redirect. Visitantes vão para /register com
 * ?redirect=/dashboard (preservando utm_* e ?next= permitido).
 * Usuários autenticados vão direto para /dashboard.
 *
 * Este spec só cobre o caminho do visitante (não exige sessão).
 * Os fluxos autenticados são cobertos pelos testes unitários
 * em src/pages/__tests__/Experimente.test.tsx.
 */

test.describe("/experimente redirect (visitante)", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("vai direto para /register?redirect=/dashboard sem tela intermediária", async ({ page }) => {
    await page.goto("/experimente");
    await page.waitForURL(/\/register\?/);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/register");
    expect(url.searchParams.get("redirect")).toBe("/dashboard");

    // Garante que nenhum vestígio do antigo modo demo foi renderizado.
    await expect(page.getByText(/modo demonstração/i)).toHaveCount(0);
  });

  test("preserva parâmetros utm_* e ignora params inesperados", async ({ page }) => {
    await page.goto(
      "/experimente?utm_source=hero&utm_campaign=launch&evil=1&next=/dashboard/agenda",
    );
    await page.waitForURL(/\/register\?/);
    const url = new URL(page.url());
    expect(url.searchParams.get("utm_source")).toBe("hero");
    expect(url.searchParams.get("utm_campaign")).toBe("launch");
    expect(url.searchParams.get("redirect")).toBe("/dashboard/agenda");
    expect(url.searchParams.get("evil")).toBeNull();
  });

  test("ignora ?next= fora da allowlist e cai em /dashboard", async ({ page }) => {
    await page.goto("/experimente?next=/admin/users");
    await page.waitForURL(/\/register\?/);
    expect(new URL(page.url()).searchParams.get("redirect")).toBe("/dashboard");
  });

  test("bloqueia ?next= absoluto (open-redirect)", async ({ page }) => {
    await page.goto("/experimente?next=https://evil.com");
    await page.waitForURL(/\/register\?/);
    const redirect = new URL(page.url()).searchParams.get("redirect");
    expect(redirect).toBe("/dashboard");
    expect(redirect).not.toContain("evil.com");
  });

  test("limpa o localStorage do demo (chaves salbcare_demo_*)", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("salbcare_demo_patients", "stale");
      localStorage.setItem("salbcare_demo_usage_counters", "stale");
      localStorage.setItem("auth-token", "keep");
    });

    await page.goto("/experimente");
    await page.waitForURL(/\/register\?/);

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
    await page.waitForURL(/\/register\?/);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.join("\n")).not.toMatch(/@.*\./); // sem e-mail
  });
});
