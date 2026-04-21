import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { StrategyCatalogueSurface } from "@/components/strategy-catalogue/StrategyCatalogueSurface";
import { AvailabilityStoreProvider } from "@/lib/architecture-v2";
import { loadStrategyCatalogue } from "@/lib/architecture-v2/lifecycle";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { id: "admin", role: "admin" } }),
}));

function renderSurface(ui: ReactElement) {
  return render(
    <AvailabilityStoreProvider persist={false}>{ui}</AvailabilityStoreProvider>,
  );
}

describe("<StrategyCatalogueSurface> viewMode rendering", () => {
  it("admin-universe renders the full catalogue read-only", () => {
    renderSurface(<StrategyCatalogueSurface viewMode="admin-universe" />);
    const grid = screen.getByTestId("admin-universe-grid");
    const rows = within(grid).getAllByTestId("admin-universe-row");
    expect(rows.length).toBe(loadStrategyCatalogue().length);
    expect(within(grid).getAllByRole("button", { name: "Details" }).length).toBeGreaterThan(0);
    expect(within(grid).queryByRole("button", { name: /Edit \(locked\)/ })).toBeNull();
  });

  it("admin-editor renders inline dropdowns + live-editor badge", () => {
    renderSurface(<StrategyCatalogueSurface viewMode="admin-editor" />);
    expect(
      screen.getByText(/Editor live · server validates forward-only/),
    ).toBeInTheDocument();
    const grid = screen.getByTestId("admin-editor-grid");
    // Every row has a maturity + routing dropdown.
    const maturitySelects = within(grid).getAllByTestId("admin-editor-maturity-select");
    const routingSelects = within(grid).getAllByTestId("admin-editor-routing-select");
    expect(maturitySelects.length).toBe(loadStrategyCatalogue().length);
    expect(routingSelects.length).toBe(loadStrategyCatalogue().length);
    // Dropdowns are disabled until server-side lifecycle records load — in tests
    // the GET mock returns an empty list so `record` stays null on every row.
    for (const sel of maturitySelects) expect(sel).toBeDisabled();
    for (const sel of routingSelects) expect(sel).toBeDisabled();
  });

  it("client-reality hides rows the viewer has not subscribed to", () => {
    const catalogue = loadStrategyCatalogue();
    const [first, second] = catalogue;
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    const subs = [first.instanceId];
    renderSurface(
      <StrategyCatalogueSurface
        viewMode="client-reality"
        subscribedInstanceIds={subs}
      />,
    );
    const grid = screen.getByTestId("reality-grid");
    const cards = within(grid).getAllByTestId("reality-position-card");
    expect(cards.length).toBe(1);
    expect(cards[0]).toHaveAttribute("data-instance-id", first.instanceId);
  });

  it("client-fomo hides rows the viewer has already subscribed to", () => {
    const catalogue = loadStrategyCatalogue();
    const [first] = catalogue;
    expect(first).toBeDefined();
    const subs = [first.instanceId];
    renderSurface(
      <StrategyCatalogueSurface
        viewMode="client-fomo"
        subscribedInstanceIds={subs}
      />,
    );
    const grid = screen.getByTestId("fomo-grid");
    const cards = within(grid).getAllByTestId("fomo-tearsheet-card");
    expect(cards.length).toBe(catalogue.length - 1);
    for (const card of cards) {
      expect(card).not.toHaveAttribute("data-instance-id", first.instanceId);
    }
  });

  it("applies family + archetype filter cascade", () => {
    const catalogue = loadStrategyCatalogue();
    const first = catalogue[0];
    expect(first).toBeDefined();
    renderSurface(
      <StrategyCatalogueSurface
        viewMode="admin-universe"
        filter={{ family: first.family, archetype: first.archetype }}
      />,
    );
    const grid = screen.getByTestId("admin-universe-grid");
    const rows = within(grid).getAllByTestId("admin-universe-row");
    const expected = catalogue.filter(
      (c) => c.family === first.family && c.archetype === first.archetype,
    ).length;
    expect(rows.length).toBe(expected);
  });
});
