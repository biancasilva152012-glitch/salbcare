/**
 * E2E-ish guard: when the guest visitor has filled their quota, clicking
 * "Novo Paciente" / "Nova Consulta" must NOT open the create form. Instead
 * the upgrade modal (GuestLimitDialog) must appear, blocking submission.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GuestPatients from "@/components/guest/GuestPatients";
import GuestAgenda from "@/components/guest/GuestAgenda";
import {
  GUEST_DATA_KEY,
  GUEST_LIMITS,
  readGuestPatients,
  readGuestAppointments,
} from "@/lib/guestStorage";

const seedGuest = (patients: number, appointments: number) => {
  const ps = Array.from({ length: patients }, (_, i) => ({
    id: `p${i}`,
    name: `Paciente ${i}`,
    created_at: new Date().toISOString(),
  }));
  const as = Array.from({ length: appointments }, (_, i) => ({
    id: `a${i}`,
    patient_name: `Paciente ${i}`,
    date: "2026-04-25",
    time: "10:00",
    appointment_type: "presencial",
    created_at: new Date().toISOString(),
  }));
  window.localStorage.setItem(
    GUEST_DATA_KEY,
    JSON.stringify({ patients: ps, appointments: as, startedAt: null }),
  );
};

beforeEach(() => {
  window.localStorage.clear();
});

describe("Guest limits — patients", () => {
  it("opens the upgrade modal instead of the form when at the limit", () => {
    seedGuest(GUEST_LIMITS.patients, 0);
    render(
      <MemoryRouter>
        <GuestPatients />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("guest-patients-new-btn"));

    expect(screen.getByTestId("guest-limit-dialog")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Nome \*/i)).not.toBeInTheDocument();
  });

  it("never persists a new patient when at the limit (submit blocked)", () => {
    seedGuest(GUEST_LIMITS.patients, 0);
    const before = readGuestPatients().length;
    render(
      <MemoryRouter>
        <GuestPatients />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("guest-patients-new-btn"));
    // Form is not even mounted, so nothing can be submitted.
    expect(screen.queryByText(/Salvar paciente/i)).not.toBeInTheDocument();
    expect(readGuestPatients().length).toBe(before);
  });

  it("allows opening the form when below the limit", () => {
    seedGuest(GUEST_LIMITS.patients - 1, 0);
    render(
      <MemoryRouter>
        <GuestPatients />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("guest-patients-new-btn"));
    expect(screen.queryByTestId("guest-limit-dialog")).not.toBeInTheDocument();
  });
});

describe("Guest limits — appointments", () => {
  it("opens the upgrade modal instead of the form when at the limit", () => {
    seedGuest(0, GUEST_LIMITS.appointments);
    render(
      <MemoryRouter>
        <GuestAgenda />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("guest-agenda-new-btn"));
    expect(screen.getByTestId("guest-limit-dialog")).toBeInTheDocument();
  });

  it("never persists a new appointment when at the limit (submit blocked)", () => {
    seedGuest(0, GUEST_LIMITS.appointments);
    const before = readGuestAppointments().length;
    render(
      <MemoryRouter>
        <GuestAgenda />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("guest-agenda-new-btn"));
    expect(screen.queryByText(/Salvar consulta/i)).not.toBeInTheDocument();
    expect(readGuestAppointments().length).toBe(before);
  });

  it("upgrade modal exposes both register and upgrade CTAs", () => {
    seedGuest(0, GUEST_LIMITS.appointments);
    render(
      <MemoryRouter>
        <GuestAgenda />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("guest-agenda-new-btn"));
    expect(screen.getByText(/Criar conta grátis/i)).toBeInTheDocument();
    expect(screen.getByText(/Ver plano Essencial/i)).toBeInTheDocument();
  });
});
