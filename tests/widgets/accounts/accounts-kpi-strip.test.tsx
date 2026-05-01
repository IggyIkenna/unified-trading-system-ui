/**
 * L1.5 widget harness — accounts-kpi-strip.
 *
 * Scope (per unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md):
 * - Render with mocked AccountsDataContext; three KPI labels visible.
 * - Loading skeleton branch (cert L0.6).
 * - Empty balances branch (cert L0.7 — "No balance data...").
 * - Error branch (cert L0.8).
 * - Total NAV / Free / Locked values flow through from context.
 *
 * Out of scope: L2 route smoke, L4 visual, layout-mode persistence.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildMockAccountsData, buildMockBalanceRecord } from "../_helpers/mock-accounts-context";

const mockData = buildMockAccountsData();

vi.mock("@/components/widgets/accounts/accounts-data-context", () => ({
  useAccountsData: () => mockData,
}));

// KpiSummaryWidget persists layout via localStorage and pokes a header slot
// from widget chrome. Neutralise the chrome hook so the widget renders
// standalone in the harness.
vi.mock("@/components/widgets/widget-chrome-context", () => ({
  useWidgetHeaderEndSlot: () => null,
}));

// Force tier-zero into "unsupported" so the widget falls through to legacy.
vi.mock("@/lib/cockpit/use-tier-zero-scenario", () => ({
  useTierZeroScenario: () => ({
    matchedScenarios: [],
    strategies: [],
    positions: [],
    backtests: [],
    bundles: [],
    status: "unsupported" as const,
  }),
}));

import { AccountsKpiWidget } from "@/components/widgets/accounts/accounts-kpi-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

const noopProps = {} as unknown as WidgetComponentProps;

describe("accounts-kpi-strip — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockAccountsData());
  });

  describe("render", () => {
    it("renders all three KPI labels from context", () => {
      render(<AccountsKpiWidget {...noopProps} />);
      expect(screen.getByText("Total NAV")).toBeTruthy();
      expect(screen.getByText("Available (Free)")).toBeTruthy();
      expect(screen.getByText("Locked (In Use)")).toBeTruthy();
    });

    it("surfaces totalNAV / totalFree / totalLocked as $-prefixed values", () => {
      Object.assign(
        mockData,
        buildMockAccountsData({
          balances: [
            buildMockBalanceRecord({ venue: "Binance", free: 40_000, locked: 10_000, total: 50_000 }),
            buildMockBalanceRecord({ venue: "OKX", free: 20_000, locked: 30_000, total: 50_000 }),
          ],
        }),
      );
      render(<AccountsKpiWidget {...noopProps} />);
      // formatCurrency(100_000, 0) = "100K"
      expect(screen.getByText("$100K")).toBeTruthy();
      // free = 60K, locked = 40K
      expect(screen.getByText("$60K")).toBeTruthy();
      expect(screen.getByText("$40K")).toBeTruthy();
    });
  });

  describe("loading state", () => {
    it("does not render KPI labels while loading", () => {
      Object.assign(mockData, buildMockAccountsData({ isLoading: true }));
      render(<AccountsKpiWidget {...noopProps} />);
      expect(screen.queryByText("Total NAV")).toBeNull();
      expect(screen.queryByText("Available (Free)")).toBeNull();
    });
  });

  describe("empty state", () => {
    it("renders 'No balance data for connected venues' when balances is empty", () => {
      Object.assign(mockData, buildMockAccountsData({ balances: [] }));
      render(<AccountsKpiWidget {...noopProps} />);
      expect(screen.getByText(/No balance data for connected venues/i)).toBeTruthy();
      expect(screen.queryByText("Total NAV")).toBeNull();
    });
  });

  describe("error state", () => {
    it("renders the error message from context.error instead of KPI strip", () => {
      Object.assign(mockData, buildMockAccountsData({ error: new Error("balance service down") }));
      render(<AccountsKpiWidget {...noopProps} />);
      expect(screen.getByText(/Failed to load account balances: balance service down/i)).toBeTruthy();
      expect(screen.queryByText("Total NAV")).toBeNull();
    });
  });

  describe("sentiment", () => {
    it("still renders free/locked tiles when balances reduce to zero totals", () => {
      Object.assign(
        mockData,
        buildMockAccountsData({
          balances: [buildMockBalanceRecord({ venue: "ZeroVenue", free: 0, locked: 0, total: 0 })],
        }),
      );
      render(<AccountsKpiWidget {...noopProps} />);
      // formatCurrency(0, 0) = "0"; three $0 cells expected.
      const zeros = screen.getAllByText("$0");
      expect(zeros.length).toBeGreaterThanOrEqual(3);
    });
  });
});
