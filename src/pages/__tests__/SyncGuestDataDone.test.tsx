import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SyncGuestDataDone from "@/pages/SyncGuestDataDone";
import {
  writeGuestSyncSummary,
  GUEST_SYNC_SUMMARY_KEY,
  type GuestSyncSummary,
} from "@/lib/guestStorage";

const renderAt = (path = "/sync-guest-data/done?next=/dashboard") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/sync-guest-data/done" element={<SyncGuestDataDone />} />
        <Route path="/dashboard" element={<div>DASH</div>} />
      </Routes>
    </MemoryRouter>,
  );

const mergedSummary: GuestSyncSummary = {
  outcome: "merged",
  patients: { imported: 2, skippedDuplicate: 1, skippedQuota: 0 },
  appointments: { imported: 1, skippedDuplicate: 1, skippedQuota: 0 },
  duplicates: {
    patients: [{ label: "Maria <maria@x.com>", reason: "email" }],
    appointments: [{ label: "João — 25/04 14:30", reason: "name+date+time" }],
  },
  at: new Date().toISOString(),
};

const discardedSummary: GuestSyncSummary = {
  outcome: "discarded",
  patients: { imported: 0, skippedDuplicate: 0, skippedQuota: 3 },
  appointments: { imported: 0, skippedDuplicate: 0, skippedQuota: 2 },
  duplicates: { patients: [], appointments: [] },
  at: new Date().toISOString(),
};

describe("SyncGuestDataDone", () => {
  beforeEach(() => sessionStorage.clear());

  it("merged: shows imported counts, skipped duplicates and reason labels", () => {
    writeGuestSyncSummary(mergedSummary);
    renderAt();

    expect(screen.getByText("Sincronização concluída")).toBeInTheDocument();
    // 2 imported (patients) + 1 imported (appointments) = 3
    expect(screen.getByText(/Importamos 3 item/i)).toBeInTheDocument();

    // Duplicate counter visible
    expect(
      screen.getByText(/2 item\(ns\) ignorado\(s\) por duplicidade/i),
    ).toBeInTheDocument();

    // Expand list
    fireEvent.click(screen.getByText(/2 item\(ns\) ignorado/i));
    const list = screen.getByTestId("done-duplicates-list");
    expect(list).toHaveTextContent("Maria <maria@x.com>");
    expect(list).toHaveTextContent("mesmo e-mail");
    expect(list).toHaveTextContent("João — 25/04 14:30");
    expect(list).toHaveTextContent("mesmo nome, data e horário");
  });

  it("discarded: shows discard heading and quota counts as descartados", () => {
    writeGuestSyncSummary(discardedSummary);
    renderAt();

    expect(screen.getByText("Rascunhos descartados")).toBeInTheDocument();
    expect(
      screen.getByText(/Removemos seus rascunhos do modo guest/i),
    ).toBeInTheDocument();
    // No duplicate list expected
    expect(screen.queryByTestId("done-duplicates-section")).toBeNull();
    // Sections present
    expect(screen.getByTestId("done-patients-section")).toBeInTheDocument();
    expect(screen.getByTestId("done-appointments-section")).toBeInTheDocument();
  });

  it("consumes the summary on render so it does not replay", () => {
    writeGuestSyncSummary(mergedSummary);
    expect(sessionStorage.getItem(GUEST_SYNC_SUMMARY_KEY)).not.toBeNull();
    renderAt();
    // Summary key wiped immediately by consumeGuestSyncSummary
    expect(sessionStorage.getItem(GUEST_SYNC_SUMMARY_KEY)).toBeNull();
  });

  it("redirects to next when no summary is present", () => {
    renderAt();
    expect(screen.getByText("DASH")).toBeInTheDocument();
  });

  it("back button navigates to next route", () => {
    writeGuestSyncSummary(mergedSummary);
    renderAt();
    fireEvent.click(screen.getByTestId("done-back-btn"));
    expect(screen.getByText("DASH")).toBeInTheDocument();
  });
});
