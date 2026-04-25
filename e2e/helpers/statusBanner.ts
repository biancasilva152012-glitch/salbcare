/**
 * Helpers compartilhados pelos specs do GlobalStatusBanner.
 *
 * O banner lê `getGuestUsage()` do localStorage de forma síncrona, mas só
 * recalcula quando o componente re-renderiza (mudança de rota / auth /
 * limits). Por isso testes que criam pacientes/consultas via UI guest
 * precisam navegar para outra rota antes de checar o contador — e ainda
 * assim podem ter race contra o React rerender.
 *
 * Esses helpers encapsulam a espera correta para reduzir flake.
 */
import { expect, type Page } from "@playwright/test";

export const SELECTORS = {
  banner: "global-status-banner",
  counter: "global-status-banner-counter",
  title: "global-status-banner-title",
  cta: "global-status-banner-cta",
  ctaMobile: "global-status-banner-cta-mobile",
  dismiss: "global-status-banner-dismiss",
} as const;

export const DISMISS_KEY = "salbcare_status_banner_dismissed";
export const GUEST_DATA_KEY = "salbcare_guest_data";

/**
 * Aguarda o contador do banner conter o texto esperado (ex.: "4/5 pacientes",
 * "3/3 pacientes"). Tolera atraso de re-render e match parcial — o atributo
 * `data-counter` no <div root> também é considerado, então conseguimos
 * confirmar leitura mesmo se o <p> interno demorar a hidratar.
 *
 * @param expected texto que deve aparecer (case-insensitive, normalizado).
 * @param timeout  ms (default 5_000)
 */
export async function expectBannerCounter(
  page: Page,
  expected: string | RegExp,
  timeout = 5_000,
): Promise<void> {
  const banner = page.getByTestId(SELECTORS.banner);
  await expect(banner, "GlobalStatusBanner deve estar visível").toBeVisible({
    timeout,
  });
  const counter = page.getByTestId(SELECTORS.counter);
  await expect(counter, "contador do banner deve refletir o uso atual").toContainText(
    expected,
    { timeout },
  );
}

/** Aguarda o banner mudar para o estado bloqueado (data-blocked="1"). */
export async function expectBannerBlocked(page: Page, timeout = 5_000) {
  const banner = page.getByTestId(SELECTORS.banner);
  await expect(banner).toHaveAttribute("data-blocked", "1", { timeout });
  await expect(page.getByTestId(SELECTORS.title)).toContainText(
    /Você está bloqueado/i,
    { timeout },
  );
}

/** Aguarda o banner em estado warn (data-blocked="0", data-severity="warn"). */
export async function expectBannerWarn(page: Page, timeout = 5_000) {
  const banner = page.getByTestId(SELECTORS.banner);
  await expect(banner).toHaveAttribute("data-blocked", "0", { timeout });
  await expect(banner).toHaveAttribute("data-severity", "warn", { timeout });
}

/** Retorna o CTA visível (desktop OU mobile). */
export function ctaLocator(page: Page) {
  return page
    .getByTestId(SELECTORS.cta)
    .or(page.getByTestId(SELECTORS.ctaMobile))
    .first();
}

/** Lê o destino do CTA via atributo data-cta-to (não navega). */
export async function getCtaTarget(page: Page): Promise<string | null> {
  const desktop = page.getByTestId(SELECTORS.cta);
  if (await desktop.count()) {
    return desktop.getAttribute("data-cta-to");
  }
  return null;
}

/**
 * Semeia o storage de visitante com N pacientes/consultas. Sempre limpa
 * o dismiss key para garantir que o banner reapareça nesse seed.
 */
export async function seedGuestUsage(
  page: Page,
  patients: number,
  appointments: number,
) {
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
}
