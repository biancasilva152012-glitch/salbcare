import { test, expect } from "@playwright/test";
import { loginViaApi, requireTestUser } from "./helpers/auth";

/**
 * Validação dos textos/KPIs exatos do RESULTADO FINAL do diagnóstico
 * financeiro após completar Etapa 1 (objetivo) e Etapa 2 (faixa de
 * faturamento). Garante que as combinações pré-escritas em
 * `generateInsights()` aparecem corretamente para o usuário.
 *
 * Os cenários cobrem 2 combinações estratégicas + a combinação default
 * (todas devem produzir 3 itens de insight).
 */
test.describe("Diagnóstico Financeiro – KPIs e textos do resultado final", () => {
  test.beforeAll(() => requireTestUser(test));

  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto("/dashboard");
    await page.evaluate(() =>
      sessionStorage.removeItem("salbcare_financial_diagnosis_progress"),
    );
  });

  async function openModal(page: import("@playwright/test").Page) {
    await page.getByRole("button", { name: /diagn[óo]stico/i }).first().click();
    await expect(page.getByTestId("financial-diagnosis-modal")).toBeVisible();
  }

  test("Reduzir despesas + R$ 3-8k mostra insights corretos", async ({
    page,
  }) => {
    await openModal(page);
    await page.getByTestId("diagnosis-goal-reduce_expenses").click();
    await page.getByTestId("diagnosis-next").click();
    await page.getByTestId("diagnosis-range-3k_8k").click();
    await page.getByTestId("diagnosis-next").click();

    // Header da etapa 3
    await expect(
      page.getByText(/seu diagnóstico preliminar/i),
    ).toBeVisible();
    await expect(
      page.getByText(/o que a mentora ia já consegue te dizer/i),
    ).toBeVisible();

    const insights = page.getByTestId("diagnosis-insights");
    await expect(insights).toBeVisible();
    await expect(insights.locator("li")).toHaveCount(3);

    // KPI específico da escolha "reduzir despesas"
    await expect(insights).toContainText(/22% dos custos/i);
    // KPI específico da faixa 3k-8k
    await expect(insights).toContainText(/35% no primeiro semestre/i);
    // Frase de fechamento sempre presente
    await expect(insights).toContainText(
      /primeiro lançamento de receita/i,
    );

    // CTA final visível e com texto exato
    const finish = page.getByTestId("diagnosis-finish");
    await expect(finish).toBeVisible();
    await expect(finish).toHaveText(/continuar para meus lançamentos/i);
  });

  test("Avaliar CNPJ + acima de R$ 20k mostra insights de PJ", async ({
    page,
  }) => {
    await openModal(page);
    await page.getByTestId("diagnosis-goal-evaluate_cnpj").click();
    await page.getByTestId("diagnosis-next").click();
    await page.getByTestId("diagnosis-range-over_20k").click();
    await page.getByTestId("diagnosis-next").click();

    const insights = page.getByTestId("diagnosis-insights");
    await expect(insights.locator("li")).toHaveCount(3);

    // KPI específico da meta "evaluate_cnpj"
    await expect(insights).toContainText(/CNPJ vs PF/i);
    // KPI específico da faixa over_20k
    await expect(insights).toContainText(/2-3x mais imposto/i);
  });

  test("Botão Voltar permite revisar a Etapa 2 a partir do resultado", async ({
    page,
  }) => {
    await openModal(page);
    await page.getByTestId("diagnosis-goal-tax_optimization").click();
    await page.getByTestId("diagnosis-next").click();
    await page.getByTestId("diagnosis-range-under_3k").click();
    await page.getByTestId("diagnosis-next").click();

    // Está na etapa 3
    await expect(page.getByTestId("diagnosis-insights")).toBeVisible();

    // Volta para Etapa 2 — faixa selecionada continua marcada
    await page.getByTestId("diagnosis-back").click();
    await expect(page.getByText(/quanto você fatura/i)).toBeVisible();
    await expect(page.getByTestId("diagnosis-range-under_3k")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});
