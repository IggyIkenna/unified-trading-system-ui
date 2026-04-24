/**
 * L1.5 widget harness — accounts-margin-util.
 *
 * Scope:
 * - Render with mocked venueMargins; card title "Margin Utilization by Venue" visible.
 * - Loading branch: no card shown (skeleton rows only).
 * - Empty branch (cert L0.7): "No margin data for connected venues."
 * - Error branch (cert L0.8): error.message surfaces in destructive banner.
 * - Venue label from mock appears in the aggregated list.
 *
 * Widget delegates rendering to components/trading/margin-utilization.tsx
 * (shared primitive). This harness exercises the widget wrapper's guard
 * branches and contract with the shared primitive, not the primitive itself.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildMockAccountsData, buildMockVenueMargin } from "../_helpers/mock-accounts-context";

const mockData = buildMockAccountsData();

vi.mock("@/components/widgets/accounts/accounts-data-context", () => ({
  useAccountsData: () => mockData,
}));

import { AccountsMarginUtilWidget } from "@/components/widgets/accounts/accounts-margin-util-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

const noopProps = {} as unknown as WidgetComponentProps;

describe("accounts-margin-util — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockAccountsData());
  });

  describe("render", () => {
    it("renders the margin utilization card title", () => {
      render(<AccountsMarginUtilWidget {...noopProps} />);
      expect(screen.getByText("Margin Utilization by Venue")).toBeTruthy();
    });

    it("renders the venueLabel from the mocked venueMargins", () => {
      Object.assign(
        mockData,
        buildMockAccountsData({
          venueMargins: [buildMockVenueMargin({ venue: "okx", venueLabel: "OKX-Margin" })],
        }),
      );
      render(<AccountsMarginUtilWidget {...noopProps} />);
      expect(screen.getByText("OKX-Margin")).toBeTruthy();
    });

    it("renders a venue count badge matching number of unique venues", () => {
      Object.assign(
        mockData,
        buildMockAccountsData({
          venueMargins: [
            buildMockVenueMargin({ venue: "binance", venueLabel: "Binance" }),
            buildMockVenueMargin({ venue: "okx", venueLabel: "OKX" }),
            buildMockVenueMargin({ venue: "deribit", venueLabel: "Deribit" }),
          ],
        }),
      );
      render(<AccountsMarginUtilWidget {...noopProps} />);
      expect(screen.getByText("3 venues")).toBeTruthy();
    });
  });

  describe("loading state", () => {
    it("does not render the card when isLoading is true", () => {
      Object.assign(mockData, buildMockAccountsData({ isLoading: true }));
      render(<AccountsMarginUtilWidget {...noopProps} />);
      expect(screen.queryByText("Margin Utilization by Venue")).toBeNull();
    });
  });

  describe("empty state", () => {
    it("renders 'No margin data for connected venues' when venueMargins is empty", () => {
      Object.assign(mockData, buildMockAccountsData({ venueMargins: [] }));
      render(<AccountsMarginUtilWidget {...noopProps} />);
      expect(screen.getByText(/No margin data for connected venues/i)).toBeTruthy();
    });
  });

  describe("error state", () => {
    it("renders 'Failed to load margin data' with context.error.message", () => {
      Object.assign(mockData, buildMockAccountsData({ error: new Error("margin fetch failed") }));
      render(<AccountsMarginUtilWidget {...noopProps} />);
      expect(screen.getByText(/Failed to load margin data: margin fetch failed/i)).toBeTruthy();
      expect(screen.queryByText("Margin Utilization by Venue")).toBeNull();
    });
  });
});
