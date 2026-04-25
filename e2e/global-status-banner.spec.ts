/**
 * GlobalStatusBanner E2E.
 *
 * Cobre os três cenários do banner:
 *   1. Guest visitor próximo / no limite → banner com contador X/Y
 *      e CTA mudando para "Desbloquear agora" quando bloqueado.
 *   2. Banner oculto em rotas públicas (/, /blog, /upgrade).
 *   3. Banner oculto quando guest está bem abaixo do limite (<66%).
 *
 * O cenário "free quota ≥80%" e "trial ≤3 dias" precisam de auth real, então
 * para mantermos o spec rápido e sem flake, validamos só que o banner é
 * idempotente (mesmo signature, mesmo dismiss) e que o CTA leva para a tela
 * de upgrade correta.
 */
import { expect, test } from "@playwright/test";

const seedGuest = async (
  page: import("@playwright/test").Page,
  patients: number,
  appointments: number,
) => {
  await page.addInitScript(
    ({ patients, appointments }) => {
      const ps = Array.from({ length: patients }, (_, i) => ({
        id: `p${i}`,
        name: `Paciente ${i}`,
        created_at: new Date().toISOString(),
      }));
      const as = Array.from({ length: appointments }, (_, i) => ({
        id: `a${i}`,
        patient_name: `Paciente ${i}`,
        date: "2099-12-01",
        time: "10:00",
        appointment_type: "presencial",
        created_at: new Date().toISOString(),
      }));
      window.localStorage.setItem(
        "salbcare_guest_data",
        JSON.stringify({ patients: ps, appointments: as, startedAt: null }),
      );
      // Always reset dismiss key so banner is visible
      window.localStorage.removeItem("salbcare_status_banner_dismissed");
    },
    { patients, appointments },
  );
};

test.describe("GlobalStatusBanner — guest cenários", () => {
  test("aparece com contador X/Y quando guest está perto do limite (66-99%)", async ({ page }) => {
    // 2/3 pacientes (≥66%) — modo warn, não bloqueado
    await seedGuest(page, 2, 0);
    await page.goto("/dashboard/pacientes");

    const banner = page.getByTestId("global-status-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute("data-kind", "guest");
    await expect(banner).toHaveAttribute("data-blocked", "0");

    const counter = page.getByTestId("global-status-banner-counter");
    await expect(counter).toContainText("2/3 pacientes");

    // CTA modo warn
    const cta = page.getByTestId("global-status-banner-cta");
    await expect(cta).toContainText(/Criar conta grátis/i);
    await expect(cta).toHaveAttribute("data-cta-to", "/register?next=/sync-guest-data");
  });

  test('muda CTA para "Desbloquear agora" quando guest atinge o limite', async ({ page }) => {
    // 3/3 pacientes — bloqueado
    await seedGuest(page, 3, 0);
    await page.goto("/dashboard/pacientes");

    const banner = page.getByTestId("global-status-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute("data-blocked", "1");
    await expect(banner).toHaveAttribute("data-severity", "danger");

    await expect(page.getByTestId("global-status-banner-title")).toContainText(
      /Você está bloqueado/i,
    );

    // Desktop OU mobile CTA
    const cta = page
      .getByTestId("global-status-banner-cta")
      .or(page.getByTestId("global-status-banner-cta-mobile"))
      .first();
    await expect(cta).toContainText(/Desbloquear agora/i);
  });

  test("CTA leva para /register quando clicado no modo guest", async ({ page }) => {
    await seedGuest(page, 3, 3);
    await page.goto("/dashboard/pacientes");

    const cta = page
      .getByTestId("global-status-banner-cta")
      .or(page.getByTestId("global-status-banner-cta-mobile"))
      .first();
    await expect(cta).toBeVisible();
    await cta.click();

    await expect(page).toHaveURL(/\/register\?next=%2Fsync-guest-data/);
  });

  test("oculto em rotas públicas (landing, blog, upgrade)", async ({ page }) => {
    await seedGuest(page, 3, 3);

    for (const url of ["/", "/blog", "/upgrade"]) {
      await page.goto(url);
      // O banner não deve renderizar nas rotas listadas em HIDDEN_PREFIXES
      await expect(page.getByTestId("global-status-banner")).toHaveCount(0);
    }
  });

  test("oculto quando guest está bem abaixo do limite (<66%)", async ({ page }) => {
    // 1/3 pacientes (33%) — abaixo do threshold
    await seedGuest(page, 1, 0);
    await page.goto("/dashboard/pacientes");

    // Banner não deve aparecer (33% < 66%)
    await expect(page.getByTestId("global-status-banner")).toHaveCount(0);
  });

  test("é dispensado após clicar no X e não reaparece para o mesmo signature", async ({ page }) => {
    await seedGuest(page, 2, 0);
    await page.goto("/dashboard/pacientes");

    const banner = page.getByTestId("global-status-banner");
    await expect(banner).toBeVisible();
    await page.getByTestId("global-status-banner-dismiss").click();

    // Some é tirar o banner mas a chave já foi gravada — recarregar comprova
    await page.reload();
    await expect(page.getByTestId("global-status-banner")).toHaveCount(0);
  });
});
