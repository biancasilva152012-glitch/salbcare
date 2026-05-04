import { test, expect } from "@playwright/test";

/**
 * E2E for Essential plan checkout flow.
 * Mocks Supabase auth + create-checkout edge function to validate
 * that clicking "Pagar" calls the function and redirects to Stripe.
 */

test("Checkout Essencial redireciona para Stripe", async ({ page, context }) => {
  // Seed authenticated session
  await context.addInitScript(() => {
    const session = {
      access_token: "fake-token",
      refresh_token: "fake-refresh",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      expires_in: 3600,
      token_type: "bearer",
      user: {
        id: "user-test-1",
        email: "test@salbcare.com",
        aud: "authenticated",
        role: "authenticated",
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      },
    };
    localStorage.setItem(
      "sb-fevrdqmqmbahmeaymplq-auth-token",
      JSON.stringify(session),
    );
  });

  // Mock auth user lookup
  await page.route("**/auth/v1/user**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user-test-1",
        email: "test@salbcare.com",
        aud: "authenticated",
      }),
    }),
  );

  // Mock create-checkout edge function — return a fake Stripe URL
  const stripeFakeUrl = "https://checkout.stripe.com/c/pay/fake_session_123";
  let invoked = false;
  await page.route("**/functions/v1/create-checkout", (route) => {
    invoked = true;
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: stripeFakeUrl }),
    });
  });

  // Intercept the redirect so we don't leave the test
  await page.route(stripeFakeUrl, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>Stripe OK</body></html>" }),
  );

  await page.goto("/checkout?plan=essencial&source=e2e");
  await page.waitForLoadState("networkidle");

  // Find pay button — match common labels
  const payBtn = page
    .getByRole("button", { name: /Pagar|Assinar|Continuar para o pagamento|Ir para pagamento/i })
    .first();
  await payBtn.click();

  // Wait for redirect to fake Stripe URL
  await page.waitForURL(stripeFakeUrl, { timeout: 5000 });
  expect(invoked).toBe(true);
  await expect(page.locator("body")).toContainText("Stripe OK");
});
