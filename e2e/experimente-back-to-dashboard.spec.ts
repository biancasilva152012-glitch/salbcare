import { test, expect, type Page } from "@playwright/test";

/**
 * E2E: "Voltar ao painel" funciona corretamente após /experimente cair
 * em rota inexistente, com basePath e querystring contendo utm_*/ref
 * repetidos.
 *
 * Como o app é servido na raiz neste deploy, simulamos o cenário "basePath"
 * usando ?next=/dashboard/<rota-inexistente>. A regressão crítica é:
 *   - Visita /experimente?next=<deep-route-inválida>&utm_source=a&utm_source=b&ref=x&ref=y
 *   - Cai em NotFound (tela controlada)
 *   - Clica "Voltar ao painel"
 *   - Aterrissa em /dashboard sem reativar o demo nem perder dados.
 *
 * Para o caso autenticado, sessão Supabase é mockada via localStorage +
 * route mocks (mesmo padrão usado nos outros specs).
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
    id: "00000000-0000-0000-0000-0000000000bb",
    aud: "authenticated",
    role: "authenticated",
    email: "back-button@test.local",
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

test.describe("/experimente — Voltar ao painel após rota profunda inexistente", () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabase(page);
    await seedAuth(page);
  });

  test("rota deep inexistente + utm/ref repetidos: NotFound → /dashboard limpo", async ({ page }) => {
    // Pré-popula sujeira do antigo demo no localStorage.
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("salbcare_demo_patients", "stale");
      localStorage.setItem("salbcare_demo_appointments", "stale");
      localStorage.setItem("salbcare_demo_usage_counters", "stale");
    });

    await page.goto(
      "/experimente?next=/dashboard/agenda/sub-rota-inexistente" +
        "&utm_source=hero&utm_source=footer&ref=a&ref=b&utm_campaign=launch",
    );

    // O destino existe enquanto path /dashboard/agenda/* mas a sub-rota
    // específica cai no catch-all do React Router → NotFound.
    await expect(page.getByRole("heading", { name: /Página não encontrada/i })).toBeVisible();

    // /experimente já limpou o demo no caminho.
    let demo = await page.evaluate(() => ({
      p: localStorage.getItem("salbcare_demo_patients"),
      a: localStorage.getItem("salbcare_demo_appointments"),
      c: localStorage.getItem("salbcare_demo_usage_counters"),
    }));
    expect(demo.p).toBeNull();
    expect(demo.a).toBeNull();
    expect(demo.c).toBeNull();

    // Clica "Voltar ao painel".
    const backLink = page.getByRole("link", { name: /voltar ao painel/i });
    await expect(backLink).toBeVisible();
    await backLink.click();

    // Aterrissa em /dashboard.
    await page.waitForURL((u) => u.pathname === "/dashboard");
    expect(new URL(page.url()).pathname).toBe("/dashboard");

    // Demo continua limpo (não foi reativado pelo retorno).
    demo = await page.evaluate(() => ({
      p: localStorage.getItem("salbcare_demo_patients"),
      a: localStorage.getItem("salbcare_demo_appointments"),
      c: localStorage.getItem("salbcare_demo_usage_counters"),
    }));
    expect(demo.p).toBeNull();
    expect(demo.a).toBeNull();
    expect(demo.c).toBeNull();

    // Sem flash da tela antiga e sem skeleton preso.
    await expect(page.getByText(/modo demonstração/i)).toHaveCount(0);
    await expect(page.locator('[data-testid="loading-skeleton"]')).toHaveCount(0);
  });

  test("?redirect= e ?next= divergentes caem em /dashboard (regra de ambiguidade)", async ({ page }) => {
    await page.goto(
      "/experimente?next=/dashboard/agenda&redirect=/dashboard/pacientes" +
        "&utm_source=ads",
    );
    await page.waitForURL((u) => u.pathname.startsWith("/dashboard"));
    const url = new URL(page.url());
    // Política conservadora: dois destinos válidos diferentes → /dashboard.
    expect(url.pathname).toBe("/dashboard");
    // utm_source segue preservado.
    expect(url.searchParams.get("utm_source")).toBe("ads");
    // Nem next nem redirect bruto sobrevivem.
    expect(url.searchParams.has("next")).toBe(false);
    expect(url.searchParams.has("redirect")).toBe(false);
  });
});
