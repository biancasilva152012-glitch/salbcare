import { test, expect, type Page } from "@playwright/test";

const SUPABASE_REF = "fevrdqmqmbahmeaymplq";
const SESSION_KEY = `sb-${SUPABASE_REF}-auth-token`;

/**
 * Stub mínimo para fazer o app entender que existe sessão ativa.
 * O AuthContext só precisa de `user.id` para tomar a decisão de redirect
 * em /experimente — depois o resto pode falhar silenciosamente (mocaremos
 * via route mock).
 */
const fakeSession = () => ({
  access_token: "fake-access",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "fake-refresh",
  user: {
    id: "00000000-0000-0000-0000-000000000001",
    aud: "authenticated",
    role: "authenticated",
    email: "e2e@test.local",
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
  },
});

const seedAuthSession = async (page: Page) => {
  await page.addInitScript(
    ({ key, session }) => {
      window.localStorage.setItem(key, JSON.stringify({ currentSession: session, expiresAt: session.expires_at }));
    },
    { key: SESSION_KEY, session: fakeSession() },
  );
};

const stubSupabaseEdges = async (page: Page) => {
  // Bloqueia chamadas para auth/REST/edge functions para que o app não
  // fique girando ou explodindo no caminho do redirect.
  await page.route(/supabase\.co\/auth\/v1\/.*/, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) }),
  );
  await page.route(/supabase\.co\/rest\/v1\/.*/, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route(/supabase\.co\/functions\/v1\/.*/, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ subscribed: false, product_id: null, subscription_end: null }),
    }),
  );
};

test.describe("/experimente — fluxo autenticado com deep route", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await stubSupabaseEdges(page);
    await seedAuthSession(page);
  });

  test("logado com ?next=/dashboard/agenda aterrissa em /dashboard/agenda", async ({ page }) => {
    await page.goto("/experimente?next=/dashboard/agenda&utm_source=hero");

    // Não deve passar por /register em nenhum momento.
    await page.waitForURL((u) => u.pathname.startsWith("/dashboard"), { timeout: 5000 });

    const url = new URL(page.url());
    expect(url.pathname).toBe("/dashboard/agenda");
    expect(url.searchParams.get("utm_source")).toBe("hero");
    expect(url.searchParams.get("next")).toBeNull();
  });

  test("logado sem ?next= aterrissa em /dashboard", async ({ page }) => {
    await page.goto("/experimente");
    await page.waitForURL((u) => u.pathname.startsWith("/dashboard"), { timeout: 5000 });
    expect(new URL(page.url()).pathname).toBe("/dashboard");
  });

  test("logado com ?next= fora da allowlist cai em /dashboard, não na rota maliciosa", async ({ page }) => {
    await page.goto("/experimente?next=/admin/users");
    await page.waitForURL((u) => u.pathname.startsWith("/dashboard"), { timeout: 5000 });
    expect(new URL(page.url()).pathname).toBe("/dashboard");
  });
});
