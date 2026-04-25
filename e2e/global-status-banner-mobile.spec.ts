/**
 * GlobalStatusBanner — viewport mobile.
 *
 * Garante que, mesmo em telas pequenas (375x812 — iPhone X), o banner
 * renderiza:
 *   - O contador X/Y em PT.
 *   - O título "Você está bloqueado…" quando guest atinge o limite.
 *   - O CTA mobile com o `next` correto (`/sync-guest-data`).
 *
 * O CTA desktop fica `hidden sm:inline-flex`, por isso usamos o
 * data-testid `global-status-banner-cta-mobile` que aparece SOMENTE no
 * layout mobile (`sm:hidden`).
 */
import { expect, test } from "@playwright/test";
import { seedGuestUsage, SELECTORS } from "./helpers/statusBanner";

test.use({ viewport: { width: 375, height: 812 } });

test.describe("GlobalStatusBanner — mobile", () => {
  test("mostra título PT, contador e CTA mobile com next correto (warn)", async ({
    page,
  }) => {
    await seedGuestUsage(page, 2, 0);
    await page.goto("/dashboard/pacientes");

    const banner = page.getByTestId(SELECTORS.banner);
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute("data-blocked", "0");

    // Texto em PT
    await expect(page.getByTestId(SELECTORS.title)).toContainText(
      /Modo visitante/i,
    );
    await expect(page.getByTestId(SELECTORS.counter)).toContainText(
      "2/3 pacientes",
    );

    // CTA desktop está oculto via Tailwind (`hidden sm:inline-flex`),
    // mas continua no DOM. O CTA mobile (`sm:hidden`) é o visível.
    const ctaMobile = page.getByTestId(SELECTORS.ctaMobile);
    await expect(ctaMobile).toBeVisible();
    await expect(ctaMobile).toContainText(/Criar conta grátis/i);

    // Atributo `data-cta-to` só está no CTA desktop, mas o link mobile
    // aponta para o mesmo destino — clicamos e validamos a URL.
    await ctaMobile.click();
    await expect(page).toHaveURL(/\/register\?next=%2Fsync-guest-data/);
  });

  test('mostra "Desbloquear agora" no CTA mobile quando guest está bloqueado', async ({
    page,
  }) => {
    await seedGuestUsage(page, 3, 3);
    await page.goto("/dashboard/pacientes");

    const banner = page.getByTestId(SELECTORS.banner);
    await expect(banner).toHaveAttribute("data-blocked", "1");

    await expect(page.getByTestId(SELECTORS.title)).toContainText(
      /Você está bloqueado/i,
    );

    const ctaMobile = page.getByTestId(SELECTORS.ctaMobile);
    await expect(ctaMobile).toBeVisible();
    await expect(ctaMobile).toContainText(/Desbloquear agora/i);

    await ctaMobile.click();
    await expect(page).toHaveURL(/\/register\?next=%2Fsync-guest-data/);
  });
});
