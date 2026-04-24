/**
 * Export E2E.
 *
 * Confirms the demo data export buttons (CSV + PDF) trigger downloads with
 * sensible filenames. Runs as a guest because exports are available before
 * subscribing — the whole point is the user can take their data with them.
 */
import { expect, test } from "@playwright/test";

const seedDemoData = async (page: import("@playwright/test").Page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "salbcare_demo_patients",
      JSON.stringify([
        { id: "p1", name: "Maria Export", phone: "(11) 90000-0001", notes: "" },
        { id: "p2", name: "João Export", phone: "(11) 90000-0002", notes: "" },
      ]),
    );
    window.localStorage.setItem(
      "salbcare_demo_appointments",
      JSON.stringify([
        {
          id: "a1",
          patient: "Maria Export",
          date: "2099-06-01",
          time: "09:00",
          type: "presencial",
        },
      ]),
    );
    window.localStorage.setItem(
      "salbcare_demo_usage_counters",
      JSON.stringify({
        patientsCreated: 2,
        appointmentsCreated: 1,
        telehealthViews: 2,
        telehealthAttempts: 0,
      }),
    );
    window.localStorage.setItem("salbcare_demo_visited", "1");
  });
};

test.describe("Demo exports", () => {
  test("CSV export produces a download with the demo data filename", async ({ page }) => {
    await seedDemoData(page);
    await page.goto("/experimente");

    // Three downloads are triggered (patients, agenda, telehealth).
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-csv").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/salbcare-demo-(pacientes|agenda|teleconsultas)-\d{4}-\d{2}-\d{2}\.csv/);
  });

  test("PDF export produces a single PDF download", async ({ page }) => {
    await seedDemoData(page);
    await page.goto("/experimente");

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-pdf").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/salbcare-demo-\d{4}-\d{2}-\d{2}\.pdf/);
  });
});
