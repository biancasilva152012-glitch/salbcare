import { test, expect } from "@playwright/test";

/**
 * 1) Regression: utm_* / ref preservados (com múltiplos valores) tanto no
 *    fluxo visitante quanto no fluxo autenticado.
 * 2) Robustez: se o destino final (ex.: /dashboard/agenda) for removido do
 *    app, o usuário cai numa tela controlada de erro (NotFound) — não
 *    fica girando nem flashando /experimente.
 * 3) Higiene: localStorage da demo é limpo após visitar /experimente.
 *
 * O fluxo autenticado é simulado mockando a sessão Supabase no
 * localStorage + interceptando chamadas REST/auth/functions.
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
    id: "00000000-0000-0000-0000-000000000099",
    aud: "authenticated",
    role: "authenticated",
    email: "regression@test.local",
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
  },
});

const stubSupabase = async (page: import("@playwright/test").Page) => {
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

const seedAuth = async (page: import("@playwright/test").Page) => {
  await page.addInitScript(
    ({ key, session }) => {
      window.localStorage.setItem(key, JSON.stringify({ currentSession: session, expiresAt: session.expires_at }));
    },
    { key: SESSION_KEY, session: fakeSession() },
  );
};

test.describe("/experimente — regressão utm/ref + robustez", () => {
  test("visitante: preserva utm_* repetidos e ref repetidos exatamente (vai direto a /dashboard)", async ({ page }) => {
    await page.goto(
      "/experimente?utm_source=hero&utm_source=footer&utm_medium=cpc&ref=a&ref=b&evil=1",
    );
    await page.waitForURL(/\/dashboard(\?|$)/);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/dashboard");
    const sp = url.searchParams;
    expect(sp.getAll("utm_source")).toEqual(["hero", "footer"]);
    expect(sp.getAll("ref")).toEqual(["a", "b"]);
    expect(sp.get("utm_medium")).toBe("cpc");
    expect(sp.get("redirect")).toBeNull();
    expect(sp.get("evil")).toBeNull();
  });

  test("logado: preserva utm_* repetidos exatamente e ignora `next` no querystring final", async ({ page }) => {
    await stubSupabase(page);
    await seedAuth(page);
    await page.goto(
      "/experimente?utm_source=a&utm_source=b&utm_campaign=launch&next=/dashboard/agenda",
    );
    await page.waitForURL((url) => url.pathname.startsWith("/dashboard"));

    const url = new URL(page.url());
    expect(url.pathname).toBe("/dashboard/agenda");
    expect(url.searchParams.getAll("utm_source")).toEqual(["a", "b"]);
    expect(url.searchParams.get("utm_campaign")).toBe("launch");
    expect(url.searchParams.get("next")).toBeNull();
  });

  test("rota final inexistente (deep route removida) cai em NotFound, não em loop", async ({ page }) => {
    await stubSupabase(page);
    await seedAuth(page);

    // Rota dentro de /dashboard/* que NÃO existe no app atual.
    await page.goto("/experimente?next=/dashboard/agenda/rota-inexistente-xyz");

    // O redirect leva para a rota deep, mas como ela não casa com nenhuma
    // <Route>, o catch-all "*" mostra a tela controlada NotFound.
    await page.waitForURL(/\/dashboard\/agenda\/rota-inexistente-xyz/, { timeout: 5000 });
    await expect(page.getByRole("heading", { name: /Página não encontrada/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /voltar ao painel/i })).toBeVisible();

    // Não há nenhum vestígio de "modo demonstração" e nada de skeleton preso.
    await expect(page.locator('[data-testid="loading-skeleton"]')).toHaveCount(0);
  });

  test("limpa todas as chaves do demo no localStorage após visitar /experimente", async ({ page }) => {
    // Popula uma "sujeira" prévia em uma rota qualquer, já existente.
    await page.goto("/");
    const DEMO_KEYS = [
      "salbcare_demo_patients",
      "salbcare_demo_appointments",
      "salbcare_demo_visited",
      "salbcare_demo_active_tab",
      "salbcare_demo_patients_search",
      "salbcare_demo_patients_filter",
      "salbcare_demo_appts_search",
      "salbcare_demo_appts_filter",
      "salbcare_demo_usage_counters",
      "salbcare_demo_last_migration",
      "salbcare_demo_guest_id",
    ];
    await page.evaluate((keys) => {
      keys.forEach((k) => localStorage.setItem(k, "stale"));
      localStorage.setItem("auth-token", "keep-me");
      localStorage.setItem("user-prefs", "keep-me-too");
    }, DEMO_KEYS);

    await page.goto("/experimente");
    await page.waitForURL(/\/register\?/);

    const state = await page.evaluate((keys) => ({
      demo: keys.map((k) => [k, localStorage.getItem(k)] as const),
      kept: {
        auth: localStorage.getItem("auth-token"),
        prefs: localStorage.getItem("user-prefs"),
      },
    }), DEMO_KEYS);

    for (const [k, v] of state.demo) {
      expect(v, `chave ${k} deveria ter sido removida`).toBeNull();
    }
    expect(state.kept.auth).toBe("keep-me");
    expect(state.kept.prefs).toBe("keep-me-too");
  });
});
