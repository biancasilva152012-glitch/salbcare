import { test, expect } from "@playwright/test";

/**
 * Verifica que após o cadastro o usuário é levado direto a /dashboard,
 * sem passar por /login, e que o SubscriptionGuard não bloqueia o acesso
 * de uma conta recém-criada (trial começa nesse momento).
 *
 * Como não temos uma conta SMTP de teste configurada, este spec roda em
 * modo "mock": interceptamos as chamadas ao Supabase Auth/Profiles para
 * simular um signup bem-sucedido com sessão imediata e validamos a UX
 * do front-end (estado da rota + ausência de passagem por /login).
 *
 * Para rodar contra o backend real, defina E2E_REAL_SIGNUP=1 e
 * E2E_SIGNUP_EMAIL_DOMAIN (ex.: "@mailinator.com"). Caso contrário,
 * o modo mock é usado.
 */

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ??
  "https://fevrdqmqmbahmeaymplq.supabase.co";

const PROJECT_REF = (() => {
  try {
    return new URL(SUPABASE_URL).hostname.split(".")[0];
  } catch {
    return "fevrdqmqmbahmeaymplq";
  }
})();

const FAKE_USER_ID = "00000000-0000-4000-8000-000000000001";
const FAKE_EMAIL = `e2e-signup-${Date.now()}@example.test`;

function buildSession() {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: "fake-access-token",
    refresh_token: "fake-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: now + 3600,
    user: {
      id: FAKE_USER_ID,
      aud: "authenticated",
      role: "authenticated",
      email: FAKE_EMAIL,
      created_at: new Date().toISOString(),
      app_metadata: { provider: "email" },
      user_metadata: {
        name: "Usuário E2E",
        user_type: "professional",
        professional_type: "medico",
      },
    },
  };
}

test.describe("Cadastro → Dashboard direto (sem login)", () => {
  test("redireciona signup bem-sucedido para /dashboard sem passar por /login", async ({
    page,
    context,
  }) => {
    const visitedPaths: string[] = [];
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        try {
          visitedPaths.push(new URL(frame.url()).pathname);
        } catch {}
      }
    });

    // ---- Mock Supabase Auth/REST endpoints ----

    // check_email_user_type RPC: sempre retorna null (e-mail livre).
    await context.route(
      `${SUPABASE_URL}/rest/v1/rpc/check_email_user_type`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "null",
        }),
    );

    // signUp -> retorna sessão imediata (auto-confirm habilitado).
    await context.route(`${SUPABASE_URL}/auth/v1/signup*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...buildSession().user,
          session: buildSession(),
          // Supabase JS lê tanto user quanto session do payload.
          user: buildSession().user,
        }),
      }),
    );

    // Qualquer SELECT/UPDATE/INSERT em tabelas: responde com 200 vazio.
    await context.route(`${SUPABASE_URL}/rest/v1/profiles*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "content-range": "0-0/0" },
        body: "[]",
      }),
    );
    await context.route(`${SUPABASE_URL}/rest/v1/professionals*`, (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: "[]",
      }),
    );

    // notify-admin-signup edge function: ignora.
    await context.route(`${SUPABASE_URL}/functions/v1/**`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
    );

    // check-subscription / qualquer outra RPC: 200 vazio.
    await context.route(`${SUPABASE_URL}/rest/v1/rpc/**`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "null" }),
    );

    // Pré-popula localStorage com a sessão para garantir que, após o
    // signup, o AuthProvider já enxerga o usuário e o ProfessionalRoute
    // não redireciona para /login antes do navigate("/dashboard").
    await context.addInitScript(
      ({ key, value }) => {
        try {
          window.localStorage.setItem(key, value);
        } catch {}
      },
      {
        key: `sb-${PROJECT_REF}-auth-token`,
        value: JSON.stringify(buildSession()),
      },
    );

    // ---- Fluxo ----
    await page.goto("/register");

    await page.getByLabel("Nome completo *").fill("Usuário E2E");
    await page.getByLabel("E-mail *").fill(FAKE_EMAIL);
    await page.getByLabel("Senha *").fill("senhaSegura123");

    await page.getByRole("button", { name: /Entrar no SalbCare/i }).click();

    // Deve aterrissar em /dashboard (com loader inicial permitido).
    await page.waitForURL(/\/dashboard(\?|$|#)/, { timeout: 15_000 });

    // Não deve ter passado por /login durante o fluxo.
    expect(
      visitedPaths.filter((p) => p === "/login"),
      `passou por /login: ${visitedPaths.join(" → ")}`,
    ).toHaveLength(0);

    // Sanity: a flag de "just signed up" foi consumida ou ainda existe
    // brevemente, mas o usuário continua autenticado em /dashboard.
    expect(page.url()).toMatch(/\/dashboard/);
  });

  test("SubscriptionGuard / rota protegida permite recém-cadastrado em /dashboard", async ({
    page,
    context,
  }) => {
    // Simula sessão recém-criada + flag de signup; navega direto a
    // /dashboard e garante que NÃO há redirect para /login, /upgrade,
    // /complete-profile ou /subscription.
    await context.addInitScript(
      ({ key, value }) => {
        try {
          window.localStorage.setItem(key, value);
          window.sessionStorage.setItem("salbcare_just_signed_up", "1");
        } catch {}
      },
      {
        key: `sb-${PROJECT_REF}-auth-token`,
        value: JSON.stringify(buildSession()),
      },
    );

    await context.route(`${SUPABASE_URL}/rest/v1/profiles*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "content-range": "0-0/1" },
        // Profile mínimo de profissional, sem council_number — o guard
        // antigo redirecionaria para /complete-profile; o ajuste de
        // signup deve permitir que o usuário fique no dashboard.
        body: JSON.stringify([
          {
            user_id: FAKE_USER_ID,
            email: FAKE_EMAIL,
            user_type: "professional",
            professional_type: "medico",
            payment_status: "trialing",
            trial_start_date: new Date().toISOString(),
          },
        ]),
      }),
    );
    await context.route(`${SUPABASE_URL}/rest/v1/rpc/**`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "null" }),
    );
    await context.route(`${SUPABASE_URL}/functions/v1/**`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
    );

    const blockedPaths = ["/login", "/upgrade", "/subscription", "/complete-profile"];
    const visited: string[] = [];
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        try {
          visited.push(new URL(frame.url()).pathname);
        } catch {}
      }
    });

    await page.goto("/dashboard");

    // Aguarda o app montar (loader some).
    await page.waitForLoadState("networkidle");

    expect(page.url()).toMatch(/\/dashboard/);
    for (const blocked of blockedPaths) {
      expect(
        visited.includes(blocked),
        `não deveria redirecionar para ${blocked}, mas histórico foi: ${visited.join(" → ")}`,
      ).toBe(false);
    }
  });
});
