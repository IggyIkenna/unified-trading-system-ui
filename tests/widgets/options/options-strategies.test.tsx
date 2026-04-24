/**
 * L1.5 widget harness — options-strategies-widget (widgetId: options-strategies).
 *
 * Pattern per:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan.md Phase 5
 *
 * Scope:
 * - Mode toggle: "Futures Spreads" vs "Options Combos".
 * - Futures Spreads button disabled when isCrypto=false (TradFi).
 * - Correct sub-panel renders per strategiesMode.
 * - Scenario payoff panel always present.
 *
 * Out of scope:
 * - FuturesSpreadsTab / OptionsCombosPanel internals (L3b)
 * - Chart / SVG assertions (L4 deferred)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildMockOptionsData } from "../_helpers/mock-options-context";

const mockOptionsData = buildMockOptionsData();

vi.mock("@/components/widgets/options/options-data-context", () => ({
  useOptionsData: () => mockOptionsData,
}));

vi.mock("@/components/trading/options-futures-panel", () => ({
  FuturesSpreadsTab: ({ onSelectInstrument }: { onSelectInstrument: () => void }) => (
    <div data-testid="futures-spreads-tab-stub" onClick={onSelectInstrument}>
      FuturesSpreads
    </div>
  ),
  OptionsCombosPanel: ({ asset }: { asset: string }) => (
    <div data-testid="options-combos-panel-stub">OptionsCombos:{asset}</div>
  ),
  ScenarioTab: ({ assetClass, asset }: { assetClass: string; asset: string }) => (
    <div data-testid="scenario-tab-stub">
      Scenario:{assetClass}:{asset}
    </div>
  ),
}));

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

import { OptionsStrategiesWidget } from "@/components/widgets/options/options-strategies-widget";

describe("options-strategies widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockOptionsData, buildMockOptionsData());
  });

  describe("mode toggle", () => {
    it("renders both Futures Spreads and Options Combos buttons", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ assetClass: "crypto", isCrypto: true }));
      render(<OptionsStrategiesWidget />);
      expect(screen.getByText("Futures Spreads")).toBeTruthy();
      expect(screen.getByText("Options Combos")).toBeTruthy();
    });

    it("defaults to futures-spreads mode (FuturesSpreadsTab visible)", () => {
      Object.assign(
        mockOptionsData,
        buildMockOptionsData({ assetClass: "crypto", isCrypto: true, strategiesMode: "futures-spreads" }),
      );
      render(<OptionsStrategiesWidget />);
      expect(screen.getByTestId("futures-spreads-tab-stub")).toBeTruthy();
      expect(screen.queryByTestId("options-combos-panel-stub")).toBeNull();
    });

    it("shows OptionsCombosPanel when Options Combos button is clicked", () => {
      const setStrategiesMode = vi.fn();
      Object.assign(
        mockOptionsData,
        buildMockOptionsData({
          assetClass: "crypto",
          isCrypto: true,
          strategiesMode: "futures-spreads",
          setStrategiesMode,
        }),
      );
      render(<OptionsStrategiesWidget />);
      fireEvent.click(screen.getByText("Options Combos"));
      expect(setStrategiesMode).toHaveBeenCalledWith("options-combos");
    });

    it("renders OptionsCombosPanel when strategiesMode is options-combos", () => {
      Object.assign(
        mockOptionsData,
        buildMockOptionsData({ assetClass: "crypto", isCrypto: true, strategiesMode: "options-combos" }),
      );
      render(<OptionsStrategiesWidget />);
      expect(screen.getByTestId("options-combos-panel-stub")).toBeTruthy();
      expect(screen.queryByTestId("futures-spreads-tab-stub")).toBeNull();
    });
  });

  describe("crypto vs TradFi constraints", () => {
    it("Futures Spreads button is disabled when isCrypto is false", () => {
      Object.assign(
        mockOptionsData,
        buildMockOptionsData({ assetClass: "tradfi", isCrypto: false, strategiesMode: "options-combos" }),
      );
      render(<OptionsStrategiesWidget />);
      const btn = screen.getByText("Futures Spreads").closest("button") as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it("shows OptionsCombosPanel for TradFi even with futures-spreads mode context", () => {
      Object.assign(
        mockOptionsData,
        buildMockOptionsData({ assetClass: "tradfi", isCrypto: false, strategiesMode: "futures-spreads" }),
      );
      render(<OptionsStrategiesWidget />);
      // isCrypto=false falls through to OptionsCombosPanel
      expect(screen.getByTestId("options-combos-panel-stub")).toBeTruthy();
    });
  });

  describe("scenario payoff panel", () => {
    it("always renders the ScenarioTab regardless of mode", () => {
      Object.assign(
        mockOptionsData,
        buildMockOptionsData({ assetClass: "crypto", isCrypto: true, strategiesMode: "futures-spreads" }),
      );
      render(<OptionsStrategiesWidget />);
      expect(screen.getByTestId("scenario-tab-stub")).toBeTruthy();
    });

    it("passes assetClass and asset to ScenarioTab", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ assetClass: "crypto", isCrypto: true, asset: "SOL" }));
      render(<OptionsStrategiesWidget />);
      expect(screen.getByTestId("scenario-tab-stub").textContent).toContain("crypto");
      expect(screen.getByTestId("scenario-tab-stub").textContent).toContain("SOL");
    });
  });
});
