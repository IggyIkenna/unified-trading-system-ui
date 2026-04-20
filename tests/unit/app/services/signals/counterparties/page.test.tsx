import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import AdminCounterpartiesPage from "@/app/(platform)/services/signals/counterparties/page";
import { renderWithPersona } from "@/tests/helpers/persona-wrapper";

function renderAsPersona(personaId: string) {
  const { Wrapper } = renderWithPersona(personaId);
  return render(<AdminCounterpartiesPage />, { wrapper: Wrapper });
}

describe("AdminCounterpartiesPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the counterparty list table for admin persona", () => {
    renderAsPersona("admin");
    // Title
    expect(screen.getByText(/Admin · Signal Counterparties/)).toBeInTheDocument();
    // Table renders with all three seeded fixtures
    const table = screen.getByTestId("admin-counterparties-table");
    expect(table).toBeInTheDocument();
    expect(screen.getByTestId("admin-counterparties-row-cp-alpha")).toBeInTheDocument();
    expect(screen.getByTestId("admin-counterparties-row-cp-beta")).toBeInTheDocument();
    expect(screen.getByTestId("admin-counterparties-row-cp-gamma")).toBeInTheDocument();
  });

  it("shows the detail panel for the first counterparty on mount", () => {
    renderAsPersona("admin");
    const detail = screen.getByTestId("admin-counterparties-detail-cp-alpha");
    expect(detail).toBeInTheDocument();
  });

  it("toggling an entitlement requires a reason + emits an audit event", () => {
    renderAsPersona("admin");

    // No events initially
    expect(
      screen.queryByTestId(
        "admin-counterparties-audit-COUNTERPARTY_ENTITLEMENT_CHANGED",
      ),
    ).toBeNull();

    // Fill the reason field
    const reasonInput = screen.getByTestId(
      "admin-counterparties-reason-cp-alpha",
    );
    act(() => {
      fireEvent.change(reasonInput, {
        target: { value: "QG test: granting new slot" },
      });
    });

    const toggleBtn = screen.getByTestId(
      "admin-counterparties-toggle-cp-alpha-btc_carry_basis_dated_cefi-perp-1.0",
    );
    expect(toggleBtn).not.toBeDisabled();

    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(
      screen.getByTestId(
        "admin-counterparties-audit-COUNTERPARTY_ENTITLEMENT_CHANGED",
      ),
    ).toBeInTheDocument();
  });

  it("active-status flip emits ACTIVE_CHANGED event", () => {
    renderAsPersona("admin");
    const reasonInput = screen.getByTestId(
      "admin-counterparties-reason-cp-alpha",
    );
    act(() => {
      fireEvent.change(reasonInput, {
        target: { value: "incident response" },
      });
    });
    const activeBtn = screen.getByTestId(
      "admin-counterparties-active-cp-alpha",
    );
    act(() => {
      fireEvent.click(activeBtn);
    });
    expect(
      screen.getByTestId(
        "admin-counterparties-audit-COUNTERPARTY_ACTIVE_CHANGED",
      ),
    ).toBeInTheDocument();
  });

  it("blocks non-admin (client) personas with admin-only message", () => {
    renderAsPersona("client-full");
    expect(screen.getByText(/Admin only/)).toBeInTheDocument();
    // Table should not be rendered
    expect(screen.queryByTestId("admin-counterparties-table")).toBeNull();
  });
});
