import { test, expect } from "@playwright/test";
import { loginViaApi, requireTestUser } from "./helpers/auth";

/**
 * E2E: modal de Diagnóstico Financeiro
 *
 * Cobre o fluxo completo:
 *  - Etapa 1: seleção do objetivo (radio button custom com role="radio")
 *  - Botão "Continuar" manual habilita após seleção
 *  - Etapa 2: seleção da faixa de faturamento
 *  - Etapa 3: tela de diagnóstico/insights aparece com texto correto
 *
 * Também valida que ao fechar e reabrir o modal o progresso é
 * preservado (sessionStorage), evitando que o usuário perca a resposta.
 */
test.describe("Diagnóstico Financeiro – modal", () => {
  test.beforeAll(() => requireTestUser(test));

  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto("/dashboard");
  });

  test("usuário completa as duas etapas e vê o diagnóstico final", async ({
    page,
  }) => {
    // Garante estado limpo do progresso persistido
    await page.evaluate(() =>
      sessionStorage.removeItem("salbcare_financial_diagnosis_progress"),
    );

    // Abre o modal pelo banner do dashboard
    const opener = page
      .getByRole("button", { name: /diagn[óo]stico/i })
      .first();
    await opener.click();

    const modal = page.getByTestId("financial-diagnosis-modal");
    await expect(modal).toBeVisible();

    // Etapa 1: botão "Continuar" inicia desabilitado
    const continueBtn = page.getByTestId("diagnosis-next");
    await expect(continueBtn).toBeDisabled();

    await page.getByTestId("diagnosis-goal-increase_profit").click();
    await expect(
      page.getByTestId("diagnosis-goal-increase_profit"),
    ).toHaveAttribute("aria-checked", "true");
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // Etapa 2
    await expect(page.getByText(/quanto você fatura/i)).toBeVisible();
    const continueBtn2 = page.getByTestId("diagnosis-next");
    await expect(continueBtn2).toBeDisabled();

    await page.getByTestId("diagnosis-range-3k_8k").click();
    await expect(page.getByTestId("diagnosis-range-3k_8k")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(continueBtn2).toBeEnabled();
    await continueBtn2.click();

    // Etapa 3: diagnóstico final
    await expect(page.getByText(/diagnóstico preliminar/i)).toBeVisible();
    const insights = page.getByTestId("diagnosis-insights");
    await expect(insights).toBeVisible();
    await expect(insights.locator("li")).toHaveCount(3);
    await expect(page.getByTestId("diagnosis-finish")).toBeVisible();
  });

  test("progresso é preservado ao fechar e reabrir o modal", async ({
    page,
  }) => {
    await page.evaluate(() =>
      sessionStorage.removeItem("salbcare_financial_diagnosis_progress"),
    );

    await page.getByRole("button", { name: /diagn[óo]stico/i }).first().click();
    await expect(page.getByTestId("financial-diagnosis-modal")).toBeVisible();

    await page.getByTestId("diagnosis-goal-tax_optimization").click();
    await page.getByTestId("diagnosis-next").click();
    await expect(page.getByText(/quanto você fatura/i)).toBeVisible();

    // Fecha sem concluir (Escape)
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("financial-diagnosis-modal")).toBeHidden();

    // Reabre — deve cair direto na Etapa 2 com goal já marcado
    await page.getByRole("button", { name: /diagn[óo]stico/i }).first().click();
    await expect(page.getByTestId("financial-diagnosis-modal")).toBeVisible();
    await expect(page.getByText(/quanto você fatura/i)).toBeVisible();
  });
});
