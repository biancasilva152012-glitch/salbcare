/**
 * GlobalStatusBanner — copy PT-BR, reason params e regras de signature.
 *
 * Cobertura:
 *  1. Copy em português + parâmetro `reason` correto no link de upgrade
 *     para cada cenário visível em modo guest.
 *  2. Helper `expectBannerCounter` reduz flake do contador dinâmico
 *     ao criar paciente e navegar.
 *  3. Limpar APENAS o `salbcare_status_banner_dismissed` (mantendo o uso
 *     guest intacto) faz o banner reaparecer com a MESMA signature —
 *     porque a regra é "não reaparecer enquanto a signature dispensada
 *     não muda", e a chave de signature é a única fonte de verdade.
 *  4. Trocar a signature (ex.: criar mais um paciente) faz o banner voltar
 *     mesmo sem limpar o dismiss — confirmando a regra inversa.
 */
import { expect, test } from "@playwright/test";
import {
  SELECTORS,
  DISMISS_KEY,
  GUEST_DATA_KEY,
  ctaLocator,
  expectBannerBlocked,
  expectBannerCounter,
  expectBannerWarn,
  getCtaTarget,
  seedGuestUsage,
} from "./helpers/statusBanner";

test.describe("GlobalStatusBanner — copy PT-BR e reason no CTA", () => {
  test('warn em PT mostra "Criar conta grátis" e linka /register?next=/sync-guest-data', async ({
    page,
  }) => {
    await seedGuestUsage(page, 2, 0); // 2/3 → warn
    await page.goto("/dashboard/pacientes");

    await expectBannerWarn(page);
    await expectBannerCounter(page, /2\/3 pacientes/i);

    const cta = page.getByTestId(SELECTORS.cta);
    await expect(cta).toContainText("Criar conta grátis");
    await expect(cta).toHaveAttribute(
      "data-cta-to",
      "/register?next=/sync-guest-data",
    );

    // Description em PT
    await expect(
      page.getByText(/Crie sua conta grátis para subir para 5\/5/i),
    ).toBeVisible();
  });

  test('bloqueado em PT mostra "Desbloquear agora" e mantém o reason via next', async ({
    page,
  }) => {
    await seedGuestUsage(page, 3, 3); // 3/3 → bloqueado
    await page.goto("/dashboard/pacientes");

    await expectBannerBlocked(page);
    await expectBannerCounter(page, /3\/3 pacientes/i);

    const cta = ctaLocator(page);
    await expect(cta).toContainText("Desbloquear agora");

    // O link mantém o mesmo destino (next=/sync-guest-data carrega o
    // contexto pós-cadastro pra mesclar). Validamos o atributo direto
    // pra não depender de navegação.
    expect(await getCtaTarget(page)).toBe("/register?next=/sync-guest-data");

    // Description em PT muda para CTA forte
    await expect(
      page.getByText(/Crie sua conta grátis para continuar/i),
    ).toBeVisible();
  });

  test("clicar no CTA bloqueado abre /register com next codificado", async ({
    page,
  }) => {
    await seedGuestUsage(page, 3, 0);
    await page.goto("/dashboard/pacientes");

    await expectBannerBlocked(page);
    await ctaLocator(page).click();
    await expect(page).toHaveURL(/\/register\?next=%2Fsync-guest-data/);
  });
});

test.describe("GlobalStatusBanner — contador dinâmico (helper)", () => {
  test("contador atualiza corretamente após criar mais 1 paciente via UI", async ({
    page,
  }) => {
    await seedGuestUsage(page, 2, 0);
    await page.goto("/dashboard/pacientes");

    await expectBannerCounter(page, /2\/3 pacientes/i);

    // Cria o terceiro paciente direto na UI guest
    await page.getByTestId("guest-patients-new-btn").click();
    await page.getByLabel(/Nome \*/i).fill("Paciente 3");
    await page.getByRole("button", { name: /Salvar paciente/i }).click();

    // Re-navega para forçar o memo do banner a recalcular
    await page.goto("/dashboard/agenda");

    // Helper aguarda o re-render — sem precisar de waitForTimeout
    await expectBannerCounter(page, /3\/3 pacientes/i);
    await expectBannerBlocked(page);
  });
});

test.describe("GlobalStatusBanner — regras de signature x dismiss", () => {
  test("limpar SOMENTE o dismiss faz o banner reaparecer (mesma signature)", async ({
    page,
  }) => {
    await seedGuestUsage(page, 2, 0);
    await page.goto("/dashboard/pacientes");

    const banner = page.getByTestId(SELECTORS.banner);
    await expect(banner).toBeVisible();

    // 1) Dispensa
    await page.getByTestId(SELECTORS.dismiss).click();
    await expect(banner).toHaveCount(0);

    // 2) Reload normal — não reaparece (signature dispensada está gravada)
    await page.reload();
    await expect(page.getByTestId(SELECTORS.banner)).toHaveCount(0);

    // 3) Limpa SOMENTE a chave de dismiss; uso guest continua o mesmo
    await page.evaluate((key) => window.localStorage.removeItem(key), DISMISS_KEY);

    // Confirma que o uso guest NÃO foi tocado
    const guestData = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      GUEST_DATA_KEY,
    );
    expect(guestData).not.toBeNull();
    const parsed = JSON.parse(guestData!);
    expect(parsed.patients).toHaveLength(2);
    expect(parsed.appointments).toHaveLength(0);

    // 4) Reload — banner reaparece com a MESMA signature porque o usuário
    // não dispensou mais (regra: dismiss persiste por signature, não para
    // sempre).
    await page.reload();
    await expectBannerCounter(page, /2\/3 pacientes/i);
  });

  test("trocar a signature (criar +1 paciente) reapresenta o banner sem limpar dismiss", async ({
    page,
  }) => {
    await seedGuestUsage(page, 2, 0);
    await page.goto("/dashboard/pacientes");

    await expect(page.getByTestId(SELECTORS.banner)).toBeVisible();
    await page.getByTestId(SELECTORS.dismiss).click();
    await expect(page.getByTestId(SELECTORS.banner)).toHaveCount(0);

    // Sem mexer no dismiss, mudamos a signature de fora (simula criação de
    // paciente)
    await page.evaluate(() => {
      const raw = window.localStorage.getItem("salbcare_guest_data");
      const cur = raw
        ? JSON.parse(raw)
        : { patients: [], appointments: [], startedAt: null };
      cur.patients = [
        ...cur.patients,
        { id: "p_new", name: "Novo", created_at: new Date().toISOString() },
      ];
      window.localStorage.setItem("salbcare_guest_data", JSON.stringify(cur));
    });

    await page.reload();
    // Agora 3/3 — signature passou de "guest:warn:2:0" para
    // "guest:blocked:3:0", então o banner volta mesmo com dismiss antigo.
    await expectBannerCounter(page, /3\/3 pacientes/i);
    await expectBannerBlocked(page);
  });
});
