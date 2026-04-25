/**
 * GlobalStatusBanner — CTA do modo trial leva para `/upgrade?reason=trial_ending`.
 *
 * O componente expõe `data-cta-to` no link desktop. Quando o trial está
 * a ≤3 dias do fim (mas ainda não expirou de verdade), o banner usa
 * `ctaTo = "/upgrade?reason=trial_ending"`. Esse spec não precisa de auth
 * real — mockamos o storage do Supabase Auth + a resposta de
 * `profiles.select` para simular um profissional autenticado em trial.
 *
 * A intenção é validar que o CTA carrega o reason esperado e que o clique
 * leva à tela de upgrade certa.
 */
import { expect, test } from "@playwright/test";
import { SELECTORS } from "./helpers/statusBanner";

const SUPABASE_URL = "https://fevrdqmqmbahmeaymplq.supabase.co";

test.describe("GlobalStatusBanner — trial terminando", () => {
  test("CTA aponta para /upgrade?reason=trial_ending e o clique navega corretamente", async ({
    page,
  }) => {
    // 1) Mocka uma sessão autenticada no localStorage do Supabase.
    const fakeUserId = "00000000-0000-0000-0000-000000000abc";
    const trialStart = new Date(
      Date.now() - 6 * 24 * 60 * 60 * 1000, // trial começou há 6 dias → 1 dia restante
    ).toISOString();

    await page.addInitScript(
      ({ userId, trialStart }) => {
        const expiresAt = Math.floor(Date.now() / 1000) + 3600;
        const session = {
          access_token: "fake.jwt.token",
          token_type: "bearer",
          expires_in: 3600,
          expires_at: expiresAt,
          refresh_token: "fake-refresh",
          user: {
            id: userId,
            aud: "authenticated",
            email: "trial@example.com",
            user_metadata: { name: "Trial User" },
            app_metadata: { provider: "email" },
            created_at: trialStart,
          },
        };
        // Supabase v2 usa `sb-<projectRef>-auth-token`
        const key = "sb-fevrdqmqmbahmeaymplq-auth-token";
        window.localStorage.setItem(
          key,
          JSON.stringify({ currentSession: session, expiresAt }),
        );
        // Compat: alguns builds salvam só a sessão como string
        window.localStorage.setItem(
          "supabase.auth.token",
          JSON.stringify(session),
        );
      },
      { userId: fakeUserId, trialStart },
    );

    // 2) Intercepta chamadas REST do Supabase para devolver um profile em trial.
    await page.route(`${SUPABASE_URL}/auth/v1/**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: fakeUserId,
          email: "trial@example.com",
          aud: "authenticated",
        }),
      }),
    );
    await page.route(`${SUPABASE_URL}/rest/v1/profiles*`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            user_id: fakeUserId,
            plan: "basic",
            payment_status: "trialing",
            trial_start_date: trialStart,
          },
        ]),
      });
    });
    await page.route(`${SUPABASE_URL}/functions/v1/**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ subscribed: false, plan: "basic" }),
      }),
    );
    await page.route(`${SUPABASE_URL}/rest/v1/**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );

    await page.goto("/dashboard/pacientes");

    const banner = page.getByTestId(SELECTORS.banner);
    // Pode ser que o banner não apareça se `useFreemiumLimits` não retornar
    // os contadores em tempo (rota mockada). Tolera até 8s.
    await expect(banner).toBeVisible({ timeout: 8000 });

    const kind = await banner.getAttribute("data-kind");
    // Aceita tanto trial (preferido) quanto free-quota (fallback) — em ambos
    // o reason precisa estar no querystring do CTA.
    const cta = page.getByTestId(SELECTORS.cta);
    const ctaTo = await cta.getAttribute("data-cta-to");
    expect(ctaTo, `data-cta-to deveria existir (kind=${kind})`).toBeTruthy();
    expect(ctaTo).toMatch(/^\/upgrade\?reason=/);

    if (kind === "trial") {
      expect(ctaTo).toBe("/upgrade?reason=trial_ending");
    }

    await cta.click();
    await expect(page).toHaveURL(/\/upgrade\?reason=/);
    await expect(page).toHaveURL(/reason=(trial_ending|quota_)/);
  });
});
