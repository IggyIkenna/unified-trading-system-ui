import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PnlAttributionPanel } from "@/components/signal-broadcast";
import { MOCK_PNL_ATTRIBUTION } from "@/lib/signal-broadcast";

describe("PnlAttributionPanel", () => {
  it("renders null when reporting-back is disabled", () => {
    const { container } = render(
      <PnlAttributionPanel enabled={false} rows={MOCK_PNL_ATTRIBUTION} />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(
      screen.queryByTestId("signal-broadcast-pnl-attribution-panel"),
    ).not.toBeInTheDocument();
  });

  it("renders the panel + rows when enabled", () => {
    render(<PnlAttributionPanel enabled={true} rows={MOCK_PNL_ATTRIBUTION} />);
    expect(
      screen.getByTestId("signal-broadcast-pnl-attribution-panel"),
    ).toBeInTheDocument();
    for (const row of MOCK_PNL_ATTRIBUTION) {
      expect(
        screen.getByTestId(`pnl-row-${row.slot_label}`),
      ).toBeInTheDocument();
    }
  });
});
