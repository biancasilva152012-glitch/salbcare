/**
 * GlobalStatusBanner — cenários complementares E2E.
 *
 * Cobertura adicional ao spec base (`global-status-banner.spec.ts`):
 *   1. Contador dinâmico (X/Y pacientes·consultas) atualiza ao criar
 *      novos pacientes/consultas no fluxo de visitante.
 *   2. CTA muda para "Desbloquear agora" no limite e leva para
 *      `/register?next=/sync-guest-data` com o `next` correto.
 *   3. Dispensar (X) persiste após F5 mesmo no estado bloqueado
 *      (signature de "guest:blocked:…" não reaparece).
 *
 * Os cenários de "free quota ≥80%" e "trial ≤3 dias" exigem auth real
 * com a Supabase, então ficam fora deste spec — para mantermos a suíte
 * sem flake. Eles estão cobertos por testes de integração (vitest).
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
        time: `${String(8 + i).padStart(2, "0")}:00`,
        appointment_type: "presencial",
        created_at: new Date().toISOString(),
      }));
      window.localStorage.setItem(
        "salbcare_guest_data",
        JSON.stringify({ patients: ps, appointments: as, startedAt: null }),
      );
      window.localStorage.removeItem("salbcare_status_banner_dismissed");
    },
    { patients, appointments },
  );
};

test.describe("GlobalStatusBanner — contador dinâmico", () => {
  test("conta sobe e CTA muda automaticamente quando guest cria mais pacientes", async ({
    page,
  }) => {
    // Começa em 2/3 (warn) — banner já aparece com CTA "Criar conta grátis"
    await seedGuest(page, 2, 1);
    await page.goto("/dashboard/pacientes");

    const banner = page.getByTestId("global-status-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute("data-blocked", "0");
    await expect(page.getByTestId("global-status-banner-counter")).toContainText(
      "2/3 pacientes",
    );
    await expect(page.getByTestId("global-status-banner-cta")).toContainText(
      /Criar conta grátis/i,
    );

    // Cria o terceiro paciente direto pela UI guest
    await page.getByTestId("guest-patients-new-btn").click();
    await page.getByLabel(/Nome \*/i).fill("Paciente 3");
    await page.getByRole("button", { name: /Salvar paciente/i }).click();

    // Re-navega para forçar a re-leitura do localStorage pelo banner
    await page.goto("/dashboard/agenda");

    await expect(page.getByTestId("global-status-banner")).toBeVisible();
    await expect(page.getByTestId("global-status-banner")).toHaveAttribute(
      "data-blocked",
      "1",
    );
    await expect(page.getByTestId("global-status-banner-counter")).toContainText(
      "3/3 pacientes",
    );
    await expect(page.getByTestId("global-status-banner-title")).toContainText(
      /Você está bloqueado/i,
    );
  });
});

test.describe("GlobalStatusBanner — CTA bloqueado leva para upgrade correto", () => {
  test("guest no limite → CTA leva para /register com next=/sync-guest-data", async ({
    page,
  }) => {
    await seedGuest(page, 3, 0);
    await page.goto("/dashboard/pacientes");

    const banner = page.getByTestId("global-status-banner");
    await expect(banner).toHaveAttribute("data-blocked", "1");

    // Atributo informa o destino sem precisar navegar — útil para mobile/desktop
    const cta = page
      .getByTestId("global-status-banner-cta")
      .or(page.getByTestId("global-status-banner-cta-mobile"))
      .first();
    await expect(cta).toContainText(/Desbloquear agora/i);

    await cta.click();
    await expect(page).toHaveURL(/\/register\?next=%2Fsync-guest-data/);
  });
});

test.describe("GlobalStatusBanner — dismiss persiste mesmo bloqueado", () => {
  test("clicar no X no estado bloqueado não reaparece após F5", async ({ page }) => {
    await seedGuest(page, 3, 3);
    await page.goto("/dashboard/pacientes");

    const banner = page.getByTestId("global-status-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute("data-blocked", "1");

    await page.getByTestId("global-status-banner-dismiss").click();
    await expect(banner).toHaveCount(0);

    // Reload preserva a assinatura ("guest:blocked:3:3") no localStorage
    await page.reload();
    await expect(page.getByTestId("global-status-banner")).toHaveCount(0);

    // Sanity: muda a signature (volta para 2/3 → "guest:warn:2:0") e o
    // banner deve reaparecer porque é uma assinatura diferente.
    await page.evaluate(() => {
      window.localStorage.setItem(
        "salbcare_guest_data",
        JSON.stringify({
          patients: [
            { id: "p0", name: "A", created_at: new Date().toISOString() },
            { id: "p1", name: "B", created_at: new Date().toISOString() },
          ],
          appointments: [],
          startedAt: null,
        }),
      );
    });
    await page.reload();
    await expect(page.getByTestId("global-status-banner")).toBeVisible();
    await expect(page.getByTestId("global-status-banner-counter")).toContainText(
      "2/3 pacientes",
    );
  });
});
