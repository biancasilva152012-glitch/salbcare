import { test, expect } from "@playwright/test";

/**
 * E2E: Kite WhatsApp booking modal
 *
 * - Opens via the hero "Appointment" CTA
 * - Validates required service/date/time
 * - Rejects past dates (date input min=today + JS guard)
 * - On valid submit, opens a wa.me URL with the correctly encoded message
 */

test.describe("/kite — WhatsApp booking modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/kite");
    // Intercept window.open so we can capture the WhatsApp URL synchronously
    await page.addInitScript(() => {
      (window as any).__openedUrls = [];
      const orig = window.open;
      window.open = ((url?: string | URL) => {
        (window as any).__openedUrls.push(String(url ?? ""));
        return null;
      }) as any;
      void orig;
    });
  });

  async function openModal(page: import("@playwright/test").Page) {
    // Multiple "Appointment" buttons may exist (hero + tabs). Use the first one.
    const btn = page.getByRole("button", { name: /Appointment/i }).first();
    await btn.click();
    await expect(page.getByRole("dialog")).toBeVisible();
  }

  test("shows validation errors when submitting empty form", async ({ page }) => {
    await openModal(page);
    await page.getByRole("button", { name: /Confirm on WhatsApp/i }).click();
    await expect(page.getByText(/please choose a service/i)).toBeVisible();
    await expect(page.getByText(/please choose a valid date/i)).toBeVisible();
    await expect(page.getByText(/please choose a time/i)).toBeVisible();
    const opened = await page.evaluate(() => (window as any).__openedUrls as string[]);
    expect(opened).toEqual([]);
  });

  test("rejects a past date", async ({ page }) => {
    await openModal(page);
    await page.getByRole("button", { name: /^Dental$/ }).click();
    // Force a past date bypassing the min attribute
    await page.locator("#kw-date").evaluate((el: HTMLInputElement) => {
      el.value = "2000-01-01";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.locator("#kw-time").fill("10:00");
    await page.getByRole("button", { name: /Confirm on WhatsApp/i }).click();
    await expect(page.getByText(/please choose a valid date/i)).toBeVisible();
    const opened = await page.evaluate(() => (window as any).__openedUrls as string[]);
    expect(opened).toEqual([]);
  });

  test("opens correctly encoded wa.me URL on valid submit", async ({ page }) => {
    await openModal(page);
    await page.getByRole("button", { name: /^Dental$/ }).click();

    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    await page.locator("#kw-date").fill(future);
    await page.locator("#kw-time").fill("14:30");
    await page.locator("#kw-name").fill("Maria Tester");
    await page.locator("#kw-email").fill("maria@example.com");

    await page.getByRole("button", { name: /Confirm on WhatsApp/i }).click();

    const opened = await page.evaluate(() => (window as any).__openedUrls as string[]);
    expect(opened.length).toBe(1);
    const url = opened[0];
    expect(url).toMatch(/^https:\/\/wa\.me\/5588996924700\?text=/);

    const text = decodeURIComponent(url.split("?text=")[1]);
    expect(text).toContain("Olá! Gostaria de marcar um horário na SalbCare.");
    expect(text).toContain("Serviço: Dental");
    expect(text).toContain(`Data preferida: ${future}`);
    expect(text).toContain("Horário preferido: 14:30");
    expect(text).toContain("Nome: Maria Tester");
    expect(text).toContain("Email: maria@example.com");
  });
});
