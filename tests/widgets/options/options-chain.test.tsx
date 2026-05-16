/**
 * L1.5 widget harness — options-chain-widget (widgetId: options-chain).
 *
 * Pattern per:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan Phase 5
 *
 * Scope:
 * - Renders chain tab for crypto vs TradFi underlying.
 * - Empty-optionRows guard (cert L0.7).
 * - Trade panel docking toggled by selectedInstrument presence.
 * - No chart/canvas assertions (L4 deferred).
 *
 * Out of scope:
 * - Row-level strike interaction (sub-component internals — L3b)
 * - Real route wiring (L2)
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockOptionsData } from "../_helpers/mock-options-context";

const mockOptionsData = buildMockOptionsData();

vi.mock("@/components/widgets/options/options-data-context", () => ({
  useOptionsData: () => mockOptionsData,
}));

vi.mock("@/components/trading/options-futures-panel", () => ({
  OptionsChainTab: ({ asset }: { asset: string }) => (
    <div data-testid="options-chain-tab-stub">OptionsChainTab:{asset}</div>
  ),
  TradFiOptionsChainTab: ({ tradFiAsset }: { tradFiAsset: string }) => (
    <div data-testid="tradfi-chain-tab-stub">TradFiChainTab:{tradFiAsset}</div>
  ),
  TradePanel: ({ instrument }: { instrument: { name: string } }) => (
    <div data-testid="trade-panel-stub">TradePanel:{instrument.name}</div>
  ),
}));

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

import { OptionsChainWidget } from "@/components/widgets/options/options-chain-widget";

describe("options-chain widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockOptionsData, buildMockOptionsData());
  });

  describe("render — crypto chain", () => {
    it("renders the crypto OptionsChainTab when isCrypto and optionRows exist", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ assetClass: "crypto", isCrypto: true }));
      render(<OptionsChainWidget />);
      expect(screen.getByTestId("options-chain-tab-stub")).toBeTruthy();
      expect(screen.queryByTestId("tradfi-chain-tab-stub")).toBeNull();
    });

    it("passes the active crypto asset to OptionsChainTab", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ assetClass: "crypto", isCrypto: true, asset: "SOL" }));
      render(<OptionsChainWidget />);
      expect(screen.getByTestId("options-chain-tab-stub").textContent).toContain("SOL");
    });
  });

  describe("render — TradFi chain", () => {
    it("renders TradFiOptionsChainTab when isCrypto is false", () => {
      Object.assign(
        mockOptionsData,
        buildMockOptionsData({ assetClass: "tradfi", isCrypto: false, tradFiAsset: "SPY" }),
      );
      render(<OptionsChainWidget />);
      expect(screen.getByTestId("tradfi-chain-tab-stub")).toBeTruthy();
      expect(screen.queryByTestId("options-chain-tab-stub")).toBeNull();
    });

    it("passes the active TradFi asset to TradFiOptionsChainTab", () => {
      Object.assign(
        mockOptionsData,
        buildMockOptionsData({ assetClass: "tradfi", isCrypto: false, tradFiAsset: "QQQ" }),
      );
      render(<OptionsChainWidget />);
      expect(screen.getByTestId("tradfi-chain-tab-stub").textContent).toContain("QQQ");
    });
  });

  describe("empty state", () => {
    it("shows empty-state message when optionRows is empty (cert L0.7)", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ optionRows: [] }));
      render(<OptionsChainWidget />);
      expect(screen.getByText(/no options contracts available/i)).toBeTruthy();
      expect(screen.queryByTestId("options-chain-tab-stub")).toBeNull();
    });
  });

  describe("trade panel docking", () => {
    it("does not show TradePanel when selectedInstrument is null", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ assetClass: "crypto", isCrypto: true }));
      // Default: selectedInstrument = null
      render(<OptionsChainWidget />);
      expect(screen.queryByTestId("trade-panel-stub")).toBeNull();
    });

    it("shows TradePanel when selectedInstrument is an option (non-future)", () => {
      const data = buildMockOptionsData({ assetClass: "crypto", isCrypto: true });
      data.selectedInstrument = { name: "BTC-26JUN26-70000-C", type: "option", price: 1225, strike: 70000 };
      Object.assign(mockOptionsData, data);
      render(<OptionsChainWidget />);
      expect(screen.getByTestId("trade-panel-stub")).toBeTruthy();
      expect(screen.getByTestId("trade-panel-stub").textContent).toContain("BTC-26JUN26-70000-C");
    });

    it("does not show TradePanel when selectedInstrument is a future", () => {
      const data = buildMockOptionsData({ assetClass: "crypto", isCrypto: true });
      data.selectedInstrument = { name: "BTC-PERPETUAL", type: "future", price: 71583 };
      Object.assign(mockOptionsData, data);
      render(<OptionsChainWidget />);
      // hasSelection = selectedInstrument !== null && type !== "future" -> false
      expect(screen.queryByTestId("trade-panel-stub")).toBeNull();
    });
  });
});
