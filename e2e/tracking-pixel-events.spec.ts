import { test, expect } from "@playwright/test";

/**
 * Validates Meta Pixel (fbq) and GA4 (gtag) tracking on key funnel events.
 * Stubs window.fbq and window.gtag before page load and records every call.
 */

const installSpies = async (page: import("@playwright/test").Page) => {
  await page.addInitScript(() => {
    // @ts-expect-error global spy stores
    window.__fbqCalls = [];
    // @ts-expect-error
    window.__gtagCalls = [];
    const fbq = (...args: unknown[]) => {
      // @ts-expect-error
      window.__fbqCalls.push(args);
    };
    // @ts-expect-error keep API surface minimal but compatible
    fbq.queue = []; fbq.loaded = true; fbq.version = "2.0"; fbq.callMethod = fbq;
    // @ts-expect-error
    window.fbq = fbq;
    // @ts-expect-error
    window._fbq = fbq;
    // @ts-expect-error
    window.gtag = (...args: unknown[]) => {
      // @ts-expect-error
      window.__gtagCalls.push(args);
    };
  });
};

const getFbqCalls = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as any).__fbqCalls as unknown[][]);
const getGtagCalls = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as any).__gtagCalls as unknown[][]);

test.describe("Tracking — ViewContent & Lead", () => {
  test.beforeEach(async ({ page }) => {
    await installSpies(page);
  });

  test("ViewContent dispara em /planos", async ({ page }) => {
    await page.goto("/planos");
    await page.waitForLoadState("networkidle");
    const fb = await getFbqCalls(page);
    const viewContent = fb.find(
      (c) => c[0] === "track" && c[1] === "ViewContent" && (c[2] as any)?.content_name === "Pricing Page"
    );
    expect(viewContent).toBeTruthy();
    const ga = await getGtagCalls(page);
    expect(ga.some((c) => c[0] === "event" && c[1] === "view_content")).toBeTruthy();
  });

  test("Lead dispara ao clicar em Assinar plano em /planos", async ({ page }) => {
    await page.goto("/planos");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /Assinar plano mensal/i }).click().catch(async () => {
      await page.getByRole("button", { name: /Assinar plano/i }).first().click();
    });
    const fb = await getFbqCalls(page);
    const lead = fb.find((c) => c[0] === "track" && c[1] === "Lead");
    expect(lead).toBeTruthy();
    expect((lead?.[2] as any)?.currency).toBe("BRL");
  });

  test("Lead dispara no CTA hero da landing", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator('[data-track="hero_cta_register"]').first().click();
    const fb = await getFbqCalls(page);
    expect(fb.some((c) => c[0] === "track" && c[1] === "Lead")).toBeTruthy();
  });

  test("Lead dispara em CTAs de outras seções", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Testando CTA de "Começar trial" ou "Ver planos" fora do hero
    const cta = page.locator('[data-track="footer_cta_trial"]').first();
    await cta.click();
    const fb = await getFbqCalls(page);
    expect(fb.some((c) => c[0] === "track" && c[1] === "Lead")).toBeTruthy();
  });

  test("Eventos Lead/ViewContent são deduplicados em cliques rápidos", async ({ page }) => {
    await page.goto("/planos");
    await page.waitForLoadState("networkidle");
    const cta = page.getByRole("button", { name: /Assinar plano/i }).first();
    // Stay on page by intercepting navigation
    await page.route("**/register*", (route) => route.fulfill({ status: 204, body: "" }));
    await cta.click();
    await cta.click();
    await cta.click();
    const fb = await getFbqCalls(page);
    const leads = fb.filter((c) => c[0] === "track" && c[1] === "Lead");
    expect(leads.length).toBeLessThanOrEqual(1);
  });
});
