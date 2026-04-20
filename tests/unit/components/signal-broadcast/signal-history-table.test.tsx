import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SignalHistoryTable } from "@/components/signal-broadcast";
import { MOCK_COUNTERPARTY, MOCK_SIGNAL_EMISSIONS } from "@/lib/signal-broadcast";

describe("SignalHistoryTable", () => {
  it("renders the container with the canonical data-testid", () => {
    render(
      <SignalHistoryTable
        emissions={MOCK_SIGNAL_EMISSIONS}
        entitledSlots={MOCK_COUNTERPARTY.allowed_slots}
      />,
    );
    expect(
      screen.getByTestId("signal-broadcast-signal-history-table"),
    ).toBeInTheDocument();
  });

  it("renders only emissions whose slot is in the entitled set", () => {
    render(
      <SignalHistoryTable
        emissions={MOCK_SIGNAL_EMISSIONS}
        entitledSlots={[MOCK_COUNTERPARTY.allowed_slots[0]]}
      />,
    );
    // First emission is on slot 0 — should render.
    expect(
      screen.getByTestId("signal-history-row-em-0001"),
    ).toBeInTheDocument();
    // em-0003 is slot 1, should be filtered out.
    expect(
      screen.queryByTestId("signal-history-row-em-0003"),
    ).not.toBeInTheDocument();
  });

  it("exposes slot + status filter triggers", () => {
    render(
      <SignalHistoryTable
        emissions={MOCK_SIGNAL_EMISSIONS}
        entitledSlots={MOCK_COUNTERPARTY.allowed_slots}
      />,
    );
    expect(
      screen.getByTestId("signal-history-slot-filter"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("signal-history-status-filter"),
    ).toBeInTheDocument();
  });

  it("labels delivery status correctly", () => {
    render(
      <SignalHistoryTable
        emissions={MOCK_SIGNAL_EMISSIONS}
        entitledSlots={MOCK_COUNTERPARTY.allowed_slots}
      />,
    );
    // em-0003 is a retrying row.
    const retryStatus = screen.getByTestId("signal-history-status-em-0003");
    expect(retryStatus).toHaveTextContent("Retrying");
    // em-0007 is failed.
    const failStatus = screen.getByTestId("signal-history-status-em-0007");
    expect(failStatus).toHaveTextContent("Failed");
  });
});
