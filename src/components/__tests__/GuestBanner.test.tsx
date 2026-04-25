/**
 * GuestBanner: when the user has filled the patient OR appointment quota,
 * the banner should swap its CTAs and surface a primary "Atualizar plano"
 * link to /upgrade. This is the conversion trigger we wired in for the
 * "limit reached" state.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GuestBanner from "@/components/GuestBanner";
import { GUEST_DATA_KEY, GUEST_LIMITS } from "@/lib/guestStorage";

beforeEach(() => {
  window.localStorage.clear();
});

const seedPatients = (n: number) => {
  const patients = Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    name: `Paciente ${i}`,
    created_at: new Date().toISOString(),
  }));
  window.localStorage.setItem(
    GUEST_DATA_KEY,
    JSON.stringify({ patients, appointments: [], startedAt: null }),
  );
};

describe("GuestBanner", () => {
  it("shows the regular CTA when quotas are not full", () => {
    render(
      <MemoryRouter>
        <GuestBanner />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId("guest-banner-upgrade-cta")).not.toBeInTheDocument();
    expect(screen.getByText(/Criar conta grátis/i)).toBeInTheDocument();
  });

  it("swaps to the upgrade CTA when patient quota is full", () => {
    seedPatients(GUEST_LIMITS.patients);
    render(
      <MemoryRouter>
        <GuestBanner />
      </MemoryRouter>,
    );
    const upgrade = screen.getByTestId("guest-banner-upgrade-cta");
    expect(upgrade).toBeInTheDocument();
    expect(upgrade.closest("a")).toHaveAttribute("href", "/upgrade?reason=guest_limit");
    expect(screen.getByText(/atingiu o limite do modo guest/i)).toBeInTheDocument();
  });
});
