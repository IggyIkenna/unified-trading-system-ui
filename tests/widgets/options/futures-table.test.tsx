/**
 * L1.5 widget harness — options-futures-table-widget (widgetId: futures-table).
 *
 * Pattern per:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan.md Phase 5
 *
 * Scope:
 * - Render in crypto vs TradFi context.
 * - Empty-futures guard renders informational message.
 * - Table renders contract names from mocked futureRows.
 * - Widget delegates to FuturesTab (not testing FuturesTab internals).
 *
 * Out of scope:
 * - Real route wiring (L2 smoke)
 * - Row-click interaction (requires FuturesTab internals — L3b)
 * - Visual regression (L4 — deferred per plan)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildMockOptionsData } from "../_helpers/mock-options-context";

const mockOptionsData = buildMockOptionsData();

vi.mock("@/components/widgets/options/options-data-context", () => ({
  useOptionsData: () => mockOptionsData,
}));

// Sub-components read directly from mock fixture; mock to avoid heavy side-effects
vi.mock("@/components/trading/options-futures-panel", () => ({
  FuturesTab: ({ asset }: { asset: string }) => <div data-testid="futures-tab-stub">FuturesTab:{asset}</div>,
  TradePanel: () => <div data-testid="trade-panel-stub">TradePanel</div>,
}));

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

import { OptionsFuturesTableWidget } from "@/components/widgets/options/options-futures-table-widget";

describe("futures-table widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockOptionsData, buildMockOptionsData());
  });

  describe("render — crypto mode", () => {
    it("renders the FuturesTab stub when isCrypto and futureRows exist", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ assetClass: "crypto", isCrypto: true }));
      render(<OptionsFuturesTableWidget />);
      expect(screen.getByTestId("futures-tab-stub")).toBeTruthy();
    });

    it("passes the active asset to FuturesTab", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ assetClass: "crypto", isCrypto: true, asset: "ETH" }));
      render(<OptionsFuturesTableWidget />);
      expect(screen.getByTestId("futures-tab-stub").textContent).toContain("ETH");
    });

    it("shows empty-state message when futureRows is empty", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ assetClass: "crypto", isCrypto: true, futureRows: [] }));
      render(<OptionsFuturesTableWidget />);
      expect(screen.queryByTestId("futures-tab-stub")).toBeNull();
      expect(screen.getByText(/no futures contracts available/i)).toBeTruthy();
    });
  });

  describe("render — TradFi mode", () => {
    it("shows informational message when assetClass is tradfi", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ assetClass: "tradfi", isCrypto: false }));
      render(<OptionsFuturesTableWidget />);
      // Widget renders informational paragraph for non-crypto
      expect(screen.getByText(/crypto underlyings/i)).toBeTruthy();
      expect(screen.queryByTestId("futures-tab-stub")).toBeNull();
    });
  });

  describe("trade panel docking", () => {
    it("does not render TradePanel when selectedFuture is null", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ assetClass: "crypto", isCrypto: true }));
      // selectedFuture is null by default in buildMockOptionsData
      render(<OptionsFuturesTableWidget />);
      expect(screen.queryByTestId("trade-panel-stub")).toBeNull();
    });
  });
});
