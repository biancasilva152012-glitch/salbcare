import { test, expect, type Page } from "@playwright/test";

/**
 * Quando a rota final do redirect não existe mais (ex.: /dashboard/agenda
 * removida), o app cai no <NotFound>. Este teste garante que o botão
 * "Voltar ao painel" leva para /dashboard sem reativar o fluxo de demo
 * e sem perder os parâmetros permitidos previamente preservados.
 */

const SUPABASE_REF = "fevrdqmqmbahmeaymplq";
const SESSION_KEY = `sb-${SUPABASE_REF}-auth-token`;

const fakeSession = () => ({
  access_token: "fake",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "fake",
  user: {
    id: "00000000-0000-0000-0000-0000000000aa",
    aud: "authenticated",
    role: "authenticated",
    email: "notfound@test.local",
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
  },
});

const stubSupabase = async (page: Page) => {
  await page.route(/supabase\.co\/auth\/v1\/.*/, (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await page.route(/supabase\.co\/rest\/v1\/.*/, (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route(/supabase\.co\/functions\/v1\/.*/, (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ subscribed: false, product_id: null, subscription_end: null }),
    }),
  );
};

const seedAuth = async (page: Page) => {
  await page.addInitScript(
    ({ key, session }) => {
      window.localStorage.setItem(key, JSON.stringify({ currentSession: session, expiresAt: session.expires_at }));
    },
    { key: SESSION_KEY, session: fakeSession() },
  );
};

test.describe("/experimente — fallback NotFound + Voltar ao painel", () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabase(page);
    await seedAuth(page);
  });

  test('botão "Voltar ao painel" leva para /dashboard sem reativar demo', async ({ page }) => {
    // Polui localStorage com dados antigos da demo. Devem permanecer
    // limpos depois de passar por /experimente, mesmo após cair em NotFound
    // e voltar para /dashboard.
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("salbcare_demo_patients", "stale");
      localStorage.setItem("salbcare_demo_usage_counters", "stale");
    });

    await page.goto(
      "/experimente?next=/dashboard/agenda/rota-removida-xyz&utm_source=hero",
    );

    // Cai em NotFound (rota inexistente).
    await expect(page.getByRole("heading", { name: /Página não encontrada/i })).toBeVisible();

    // Demo já foi limpa pelo /experimente.
    const demoCleared = await page.evaluate(() => ({
      patients: localStorage.getItem("salbcare_demo_patients"),
      counters: localStorage.getItem("salbcare_demo_usage_counters"),
    }));
    expect(demoCleared.patients).toBeNull();
    expect(demoCleared.counters).toBeNull();

    // Clica "Voltar ao painel".
    const backLink = page.getByRole("link", { name: /voltar ao painel/i });
    await expect(backLink).toBeVisible();
    await backLink.click();

    // Aterrissa em /dashboard limpo (sem reaplicar /experimente nem demo).
    await page.waitForURL((url) => url.pathname === "/dashboard");
    expect(new URL(page.url()).pathname).toBe("/dashboard");

    // Nada de "modo demonstração" reaparecendo, nada de skeleton preso.
    await expect(page.getByText(/modo demonstração/i)).toHaveCount(0);
    await expect(page.locator('[data-testid="loading-skeleton"]')).toHaveCount(0);

    // localStorage da demo continua limpo (não foi reativado).
    const stillClean = await page.evaluate(() => ({
      patients: localStorage.getItem("salbcare_demo_patients"),
      counters: localStorage.getItem("salbcare_demo_usage_counters"),
    }));
    expect(stillClean.patients).toBeNull();
    expect(stillClean.counters).toBeNull();
  });

  test("telemetria registra flow=authed + preservedKeys (sem valores)", async ({ page }) => {
    const logs: Array<{ text: string }> = [];
    page.on("console", (msg) => {
      if (msg.text().includes("[experimente]")) logs.push({ text: msg.text() });
    });

    await page.goto("/experimente?utm_source=hero&ref=abc&token=secret");
    await page.waitForURL((u) => u.pathname.startsWith("/dashboard"));

    expect(logs.length).toBeGreaterThan(0);
    const joined = logs.map((l) => l.text).join("\n");
    expect(joined).toContain("authed");
    expect(joined).toContain("utm_source");
    expect(joined).toContain("ref");
    // Valores nunca devem ser logados.
    expect(joined).not.toContain("hero");
    expect(joined).not.toContain("abc");
    expect(joined).not.toContain("secret");
  });
});
