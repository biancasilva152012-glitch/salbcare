import { test, expect, type BrowserContext, type Route } from "@playwright/test";

/**
 * Cobertura E2E do fluxo de cadastro:
 *
 *  1) Cadastro bem-sucedido leva direto a /dashboard, sem passar por /login.
 *  2) SubscriptionGuard / rota protegida não bloqueia recém-cadastrado em
 *     /dashboard, /dashboard/agenda nem /dashboard/pacientes durante o trial.
 *
 * Modos:
 *  - Padrão (mock): intercepta os endpoints do Supabase Auth/REST com
 *    matchers específicos (path-suffix), simulando signup com sessão imediata.
 *  - Real (E2E_REAL_SIGNUP=1): roda contra o backend real. Requer
 *    E2E_SIGNUP_EMAIL_DOMAIN (ex.: "@mailinator.com") para gerar e-mails
 *    descartáveis e auto-confirm habilitado em Auth.
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

const REAL_SIGNUP = process.env.E2E_REAL_SIGNUP === "1";
const REAL_DOMAIN = process.env.E2E_SIGNUP_EMAIL_DOMAIN ?? "@mailinator.com";

const FAKE_USER_ID = "00000000-0000-4000-8000-000000000001";
const FAKE_EMAIL = REAL_SIGNUP
  ? `salbcare-e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}${REAL_DOMAIN}`
  : `e2e-signup-${Date.now()}@example.test`;

function buildSession(email = FAKE_EMAIL, userId = FAKE_USER_ID) {
  const now = Math.floor(Date.now() / 1000);
  const user = {
    id: userId,
    aud: "authenticated",
    role: "authenticated",
    email,
    created_at: new Date().toISOString(),
    app_metadata: { provider: "email" },
    user_metadata: {
      name: "Usuário E2E",
      user_type: "professional",
      professional_type: "medico",
    },
  };
  return {
    access_token: "fake-access-token",
    refresh_token: "fake-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: now + 3600,
    user,
  };
}

/**
 * Mocks específicos por path — usar URL pattern com host fixo + sufixos
 * exatos evita interceptar chamadas não relacionadas e quebrar quando
 * uma nova rota Supabase aparece.
 */
async function installSupabaseMocks(
  context: BrowserContext,
  opts: { profileBody?: unknown; profileContentRange?: string } = {},
) {
  const json = (route: Route, body: unknown, status = 200, extra: Record<string, string> = {}) =>
    route.fulfill({
      status,
      contentType: "application/json",
      headers: extra,
      body: typeof body === "string" ? body : JSON.stringify(body),
    });

  // RPC: check_email_user_type → e-mail livre.
  await context.route(
    (url) =>
      url.host.includes(PROJECT_REF) &&
      url.pathname === "/rest/v1/rpc/check_email_user_type",
    (route) => json(route, null),
  );

  // signup → sessão imediata (auto-confirm).
  await context.route(
    (url) =>
      url.host.includes(PROJECT_REF) && url.pathname === "/auth/v1/signup",
    (route) => {
      const session = buildSession();
      json(route, { ...session.user, session, user: session.user });
    },
  );

  // signInWithPassword fallback (caso a sessão não venha do signup).
  await context.route(
    (url) =>
      url.host.includes(PROJECT_REF) &&
      url.pathname === "/auth/v1/token" &&
      url.searchParams.get("grant_type") === "password",
    (route) => {
      const session = buildSession();
      json(route, session);
    },
  );

  // profiles select/update — path exato.
  await context.route(
    (url) =>
      url.host.includes(PROJECT_REF) && url.pathname === "/rest/v1/profiles",
    (route) =>
      json(
        route,
        opts.profileBody ?? [],
        200,
        { "content-range": opts.profileContentRange ?? "0-0/0" },
      ),
  );

  // professionals insert.
  await context.route(
    (url) =>
      url.host.includes(PROJECT_REF) &&
      url.pathname === "/rest/v1/professionals",
    (route) => json(route, [], 201),
  );

  // Edge functions (notify-admin-signup, check-subscription, etc.)
  await context.route(
    (url) =>
      url.host.includes(PROJECT_REF) &&
      url.pathname.startsWith("/functions/v1/"),
    (route) => json(route, {}),
  );

  // Demais RPCs → null (catch-all genérico, mas escopado a /rpc/).
  await context.route(
    (url) =>
      url.host.includes(PROJECT_REF) &&
      url.pathname.startsWith("/rest/v1/rpc/"),
    (route) => json(route, null),
  );
}

async function preloadSession(context: BrowserContext) {
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
}

function trackPaths(page: import("@playwright/test").Page) {
  const visited: string[] = [];
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) {
      try {
        visited.push(new URL(frame.url()).pathname);
      } catch {}
    }
  });
  return visited;
}

test.describe("Cadastro → Dashboard direto (sem passar por /login)", () => {
  test(`[${REAL_SIGNUP ? "REAL" : "MOCK"}] redireciona signup para /dashboard`, async ({
    page,
    context,
  }) => {
    const visitedPaths = trackPaths(page);

    if (!REAL_SIGNUP) {
      await installSupabaseMocks(context);
      await preloadSession(context);
    }

    await page.goto("/register");
    await page.getByLabel("Nome completo *").fill("Usuário E2E");
    await page.getByLabel("E-mail *").fill(FAKE_EMAIL);
    await page.getByLabel("Senha *").fill("senhaSegura123");
    await page.getByRole("button", { name: /Entrar no SalbCare/i }).click();

    await page.waitForURL(/\/dashboard(\?|$|#)/, { timeout: 30_000 });

    expect(
      visitedPaths.filter((p) => p === "/login"),
      `passou por /login: ${visitedPaths.join(" → ")}`,
    ).toHaveLength(0);
    expect(page.url()).toMatch(/\/dashboard/);
  });
});

test.describe("SubscriptionGuard libera rotas durante trial imediato", () => {
  for (const path of ["/dashboard", "/dashboard/agenda", "/dashboard/pacientes"]) {
    test(`recém-cadastrado pode acessar ${path}`, async ({ page, context }) => {
      // Profile mínimo de profissional em trial, sem council_number.
      await installSupabaseMocks(context, {
        profileBody: [
          {
            user_id: FAKE_USER_ID,
            email: FAKE_EMAIL,
            user_type: "professional",
            professional_type: "medico",
            payment_status: "trialing",
            trial_start_date: new Date().toISOString(),
            plan: "basic",
          },
        ],
        profileContentRange: "0-0/1",
      });
      await preloadSession(context);

      await context.addInitScript(() => {
        try {
          window.sessionStorage.setItem("salbcare_just_signed_up", "1");
        } catch {}
      });

      const blockedPaths = ["/login", "/upgrade", "/subscription", "/complete-profile"];
      const visited = trackPaths(page);

      await page.goto(path);
      await page.waitForLoadState("networkidle");

      expect(page.url()).toMatch(new RegExp(path.replace(/\//g, "\\/")));
      for (const blocked of blockedPaths) {
        expect(
          visited.includes(blocked),
          `não deveria redirecionar para ${blocked} ao acessar ${path}; histórico: ${visited.join(" → ")}`,
        ).toBe(false);
      }
    });
  }
});
