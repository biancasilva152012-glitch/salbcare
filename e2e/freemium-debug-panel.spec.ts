/**
 * Debug panel E2E.
 *
 * The panel is dev-only by default; in CI / dev mode the toggle button must
 * appear and, when opened, list the three premium modules with their counters.
 */
import { expect, test } from "@playwright/test";

test("freemium debug panel shows per-module counters with origin label", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "salbcare_demo_usage_counters",
      JSON.stringify({
        patientsCreated: 3,
        appointmentsCreated: 2,
        telehealthViews: 1,
        telehealthAttempts: 0,
      }),
    );
  });

  await page.goto("/experimente");

  const toggle = page.getByTestId("debug-panel-toggle");
  await expect(toggle).toBeVisible();
  await toggle.click();

  const panel = page.getByTestId("debug-panel");
  await expect(panel).toBeVisible();
  await expect(page.getByTestId("debug-panel-origin")).toBeVisible();
  await expect(page.getByTestId("debug-module-patients")).toContainText("Pacientes");
  await expect(page.getByTestId("debug-module-appointments")).toContainText("Consultas");
  await expect(page.getByTestId("debug-module-telehealth")).toContainText("Teleconsulta");
});
