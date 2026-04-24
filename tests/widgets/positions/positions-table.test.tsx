/**
 * L1.5 widget harness — positions-table.
 *
 * Covers:
 * - Render with mocked context, root testid mounts.
 * - Column headers from buildColumns (Instrument, Side, Quantity, etc.).
 * - Rows render from filteredPositions (strategy names, venues, side badges).
 * - Loading, error, and empty states surfaced via TableWidget props.
 * - Refresh button invokes context.refetchPositions.
 * - Search input wired to context.setSearchQuery.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildMockPositionsData, buildMockPositionRecord } from "../_helpers/mock-positions-context";

const mockData = buildMockPositionsData();

vi.mock("@/components/widgets/positions/positions-data-context", () => ({
  usePositionsData: () => mockData,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/services/trading/positions",
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { PositionsTableWidget } from "@/components/widgets/positions/positions-table-widget";

const WIDGET_PROPS = { instanceId: "positions-table-test" };

describe("positions-table — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockPositionsData());
  });

  describe("render", () => {
    it("mounts root testid", () => {
      render(<PositionsTableWidget {...WIDGET_PROPS} />);
      expect(screen.getByTestId("positions-table-widget")).toBeTruthy();
    });

    it("renders core column headers from buildColumns", () => {
      render(<PositionsTableWidget {...WIDGET_PROPS} />);
      expect(screen.getByText("Instrument")).toBeTruthy();
      expect(screen.getByText("Side")).toBeTruthy();
      expect(screen.getByText("Quantity")).toBeTruthy();
      expect(screen.getByText("Entry Price")).toBeTruthy();
      expect(screen.getByText("Current Price")).toBeTruthy();
      expect(screen.getByText("Net P&L")).toBeTruthy();
    });

    it("renders strategy names from filteredPositions rows", () => {
      render(<PositionsTableWidget {...WIDGET_PROPS} />);
      // Default two rows from mock factory
      expect(screen.getByText("ETH Basis Trade")).toBeTruthy();
      expect(screen.getByText("BTC Basis")).toBeTruthy();
    });

    it("renders side badges for LONG and SHORT positions", () => {
      render(<PositionsTableWidget {...WIDGET_PROPS} />);
      expect(screen.getByText("LONG")).toBeTruthy();
      expect(screen.getByText("SHORT")).toBeTruthy();
    });
  });

  describe("state branches", () => {
    it("shows empty-message row when filteredPositions is empty", () => {
      Object.assign(mockData, buildMockPositionsData({ positions: [], filteredPositions: [] }));
      render(<PositionsTableWidget {...WIDGET_PROPS} />);
      expect(screen.getByText("No positions match your filters")).toBeTruthy();
    });

    it("surfaces error via TableWidget when positionsError is set", () => {
      Object.assign(mockData, buildMockPositionsData({ positionsError: new Error("boom") }));
      render(<PositionsTableWidget {...WIDGET_PROPS} />);
      expect(screen.getByText("Failed to load positions")).toBeTruthy();
    });

    it("propagates isLoading to TableWidget (loading branch active)", () => {
      Object.assign(mockData, buildMockPositionsData({ isLoading: true }));
      // Should render without throwing; rows not asserted because loading skeleton varies
      render(<PositionsTableWidget {...WIDGET_PROPS} />);
      expect(screen.getByTestId("positions-table-widget")).toBeTruthy();
    });
  });

  describe("toolbar actions", () => {
    it("calls refetchPositions when Refresh is clicked", () => {
      const refetch = vi.fn();
      Object.assign(mockData, buildMockPositionsData());
      mockData.refetchPositions = refetch;
      render(<PositionsTableWidget {...WIDGET_PROPS} />);
      const refreshBtn = screen.getByRole("button", { name: /refresh/i });
      fireEvent.click(refreshBtn);
      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it("calls setSearchQuery when user types in the search input", () => {
      const setSearch = vi.fn();
      Object.assign(mockData, buildMockPositionsData());
      mockData.setSearchQuery = setSearch;
      render(<PositionsTableWidget {...WIDGET_PROPS} />);
      const searchInput = screen.getByPlaceholderText(/search positions/i);
      fireEvent.change(searchInput, { target: { value: "ETH" } });
      expect(setSearch).toHaveBeenCalledWith("ETH");
    });
  });

  describe("health factor column", () => {
    it("renders the HF value for DeFi rows with health_factor set", () => {
      const defiRow = buildMockPositionRecord({
        id: "defi-1",
        strategy_id: "DEFI_AAVE_LEND_HUF_1D",
        strategy_name: "Aave Lending",
        instrument: "AAVEV3-ETHEREUM:A_TOKEN:AUSDC@ETHEREUM",
        venue: "AAVEV3-ETHEREUM",
        health_factor: 1.85,
      });
      Object.assign(mockData, buildMockPositionsData({ positions: [defiRow], filteredPositions: [defiRow] }));
      render(<PositionsTableWidget {...WIDGET_PROPS} />);
      expect(screen.getByText("1.85")).toBeTruthy();
    });
  });
});
