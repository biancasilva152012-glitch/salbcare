import { test, expect } from "@playwright/test";
import { loginViaApi, requireTestUser } from "./helpers/auth";

/**
 * Validação específica: ao fechar e reabrir o modal de Diagnóstico
 * Financeiro AINDA NA ETAPA 1, a opção marcada e o botão "Continuar"
 * voltam exatamente como o usuário deixou (sem perder a seleção).
 */
test.describe("Diagnóstico Financeiro – Etapa 1 preserva seleção ao reabrir", () => {
  test.beforeAll(() => requireTestUser(test));

  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto("/dashboard");
    await page.evaluate(() =>
      sessionStorage.removeItem("salbcare_financial_diagnosis_progress"),
    );
  });

  test("seleção da Etapa 1 e botão Continuar persistem após fechar e reabrir", async ({
    page,
  }) => {
    // Abre o modal
    await page.getByRole("button", { name: /diagn[óo]stico/i }).first().click();
    await expect(page.getByTestId("financial-diagnosis-modal")).toBeVisible();

    // Continuar começa desabilitado
    await expect(page.getByTestId("diagnosis-next")).toBeDisabled();

    // Marca uma opção da Etapa 1 (sem avançar)
    await page.getByTestId("diagnosis-goal-reduce_expenses").click();
    await expect(
      page.getByTestId("diagnosis-goal-reduce_expenses"),
    ).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("diagnosis-next")).toBeEnabled();

    // Fecha sem avançar
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("financial-diagnosis-modal")).toBeHidden();

    // Reabre — DEVE permanecer na Etapa 1, com a mesma opção marcada
    // e o botão Continuar habilitado.
    await page.getByRole("button", { name: /diagn[óo]stico/i }).first().click();
    await expect(page.getByTestId("financial-diagnosis-modal")).toBeVisible();
    await expect(page.getByText(/qual seu maior objetivo/i)).toBeVisible();

    const opt = page.getByTestId("diagnosis-goal-reduce_expenses");
    await expect(opt).toHaveAttribute("aria-checked", "true");

    // Outras opções continuam não-marcadas
    await expect(
      page.getByTestId("diagnosis-goal-increase_profit"),
    ).toHaveAttribute("aria-checked", "false");

    // Continuar habilitado exatamente como antes
    await expect(page.getByTestId("diagnosis-next")).toBeEnabled();
  });
});
