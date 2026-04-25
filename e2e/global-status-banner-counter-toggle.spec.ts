/**
 * GlobalStatusBanner — contador ajusta ao criar/remover guest data
 * e o CTA alterna entre warn ("Criar conta grátis") e
 * blocked ("Desbloquear agora") na hora certa.
 *
 * Fluxo coberto:
 *   1. Começa com 2/3 pacientes (warn) + dismiss limpo.
 *   2. Cria mais 1 paciente via UI guest → 3/3 (blocked) + título muda.
 *   3. Remove 1 paciente → volta para 2/3 (warn) + título muda de novo.
 *
 * Como o GlobalStatusBanner só re-lê localStorage em mudança de rota
 * ou quando o `useFreemiumLimits` re-emite, navegamos entre
 * `/dashboard/pacientes` ↔ `/dashboard/agenda` para forçar o rerender.
 */
import { expect, test } from "@playwright/test";
import {
  expectBannerBlocked,
  expectBannerCounter,
  expectBannerWarn,
  SELECTORS,
  seedGuestUsage,
} from "./helpers/statusBanner";

test.describe("GlobalStatusBanner — contador + warn↔blocked toggle", () => {
  test("contador sobe ao criar e desce ao remover; CTA alterna warn↔blocked", async ({
    page,
  }) => {
    // Início: 2/3 pacientes (warn)
    await seedGuestUsage(page, 2, 0);
    await page.goto("/dashboard/pacientes");

    const banner = page.getByTestId(SELECTORS.banner);
    await expect(banner).toBeVisible();
    await expectBannerWarn(page);
    await expectBannerCounter(page, "2/3 pacientes");
    await expect(page.getByTestId(SELECTORS.cta)).toContainText(
      /Criar conta grátis/i,
    );

    // ─── Cria 3º paciente via UI guest ────────────────────────────────
    await page.getByTestId("guest-patients-new-btn").click();
    await page.getByLabel(/Nome \*/i).fill("Paciente 3");
    await page.getByRole("button", { name: /Salvar paciente/i }).click();

    // Força rerender do banner navegando entre rotas
    await page.goto("/dashboard/agenda");

    await expectBannerBlocked(page);
    await expectBannerCounter(page, "3/3 pacientes");
    const ctaBlocked = page
      .getByTestId(SELECTORS.cta)
      .or(page.getByTestId(SELECTORS.ctaMobile))
      .first();
    await expect(ctaBlocked).toContainText(/Desbloquear agora/i);

    // ─── Remove o último paciente direto pelo storage (simula DELETE) ──
    // O componente GuestPatients chama `deleteGuestPatient(id)` que reescreve
    // o array. Aqui replicamos o mesmo efeito sem depender da UI de
    // delete (que pode ter confirm dialog).
    await page.evaluate(() => {
      const key = "salbcare_guest_data";
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const data = JSON.parse(raw);
      data.patients = (data.patients || []).slice(0, 2); // mantém só 2
      window.localStorage.setItem(key, JSON.stringify(data));
      // Reseta dismiss para garantir que o banner reapareça
      window.localStorage.removeItem("salbcare_status_banner_dismissed");
    });

    // Re-navega para forçar leitura do storage
    await page.goto("/dashboard/pacientes");

    await expectBannerWarn(page);
    await expectBannerCounter(page, "2/3 pacientes");
    await expect(page.getByTestId(SELECTORS.cta)).toContainText(
      /Criar conta grátis/i,
    );
  });
});
