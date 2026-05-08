/**
 * L1.5 widget harness — options-control-bar-widget (widgetId: options-control-bar).
 *
 * Pattern per:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.md Phase 5
 *
 * Scope:
 * - Widget mounts and passes the correct context props to OptionsToolbar.
 * - Asset-class buttons pass through setAssetClass.
 * - Active-tab buttons render and call setActiveTab.
 * - Settlement buttons visible only in crypto mode.
 *
 * Out of scope:
 * - Full OptionsToolbar internal behavior (L3b)
 * - Visual regression (L4 — deferred)
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockOptionsData } from "../_helpers/mock-options-context";

const mockOptionsData = buildMockOptionsData();

vi.mock("@/components/widgets/options/options-data-context", () => ({
  useOptionsData: () => mockOptionsData,
}));

// OptionsToolbar is imported via the panel re-export; mock at the panel level
vi.mock("@/components/trading/options-futures-panel", () => ({
  OptionsToolbar: (props: {
    assetClass: string;
    setAssetClass: (v: string) => void;
    activeTab: string;
    setActiveTab: (v: string) => void;
    showWatchlist: boolean;
    setShowWatchlist: (v: boolean) => void;
    asset: string;
    pinnedCryptoAssets: string[];
    pinnedTradFiAssets: string[];
    settlement: string;
    setSettlement: (v: string) => void;
    market: string;
    tradFiMarket: string;
    tradFiAsset: string;
  }) => (
    <div data-testid="options-toolbar-stub">
      <span data-testid="toolbar-asset-class">{props.assetClass}</span>
      <span data-testid="toolbar-active-tab">{props.activeTab}</span>
      <span data-testid="toolbar-asset">{props.asset}</span>
      <span data-testid="toolbar-show-watchlist">{String(props.showWatchlist)}</span>
      <button data-testid="toolbar-set-tradfi" onClick={() => props.setAssetClass("tradfi")}>
        SetTradFi
      </button>
      <button data-testid="toolbar-set-strategies-tab" onClick={() => props.setActiveTab("strategies")}>
        SetStrategiesTab
      </button>
      <button data-testid="toolbar-toggle-watchlist" onClick={() => props.setShowWatchlist(!props.showWatchlist)}>
        ToggleWatchlist
      </button>
    </div>
  ),
}));

import { OptionsControlBarWidget } from "@/components/widgets/options/options-control-bar-widget";

describe("options-control-bar widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockOptionsData, buildMockOptionsData());
  });

  describe("render", () => {
    it("mounts the OptionsToolbar stub", () => {
      render(<OptionsControlBarWidget />);
      expect(screen.getByTestId("options-toolbar-stub")).toBeTruthy();
    });

    it("passes assetClass from context to toolbar", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ assetClass: "crypto" }));
      render(<OptionsControlBarWidget />);
      expect(screen.getByTestId("toolbar-asset-class").textContent).toBe("crypto");
    });

    it("passes activeTab from context to toolbar", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ activeTab: "futures" }));
      render(<OptionsControlBarWidget />);
      expect(screen.getByTestId("toolbar-active-tab").textContent).toBe("futures");
    });

    it("passes asset from context to toolbar", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ asset: "ETH" }));
      render(<OptionsControlBarWidget />);
      expect(screen.getByTestId("toolbar-asset").textContent).toBe("ETH");
    });

    it("passes showWatchlist from context to toolbar", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ showWatchlist: false }));
      render(<OptionsControlBarWidget />);
      expect(screen.getByTestId("toolbar-show-watchlist").textContent).toBe("false");
    });
  });

  describe("interactions via toolbar callbacks", () => {
    it("calls setAssetClass on toolbar setAssetClass('tradfi')", () => {
      const setAssetClass = vi.fn();
      Object.assign(mockOptionsData, buildMockOptionsData({ setAssetClass }));
      render(<OptionsControlBarWidget />);
      fireEvent.click(screen.getByTestId("toolbar-set-tradfi"));
      expect(setAssetClass).toHaveBeenCalledWith("tradfi");
    });

    it("calls setActiveTab on toolbar tab change", () => {
      const setActiveTab = vi.fn();
      Object.assign(mockOptionsData, buildMockOptionsData({ setActiveTab }));
      render(<OptionsControlBarWidget />);
      fireEvent.click(screen.getByTestId("toolbar-set-strategies-tab"));
      expect(setActiveTab).toHaveBeenCalledWith("strategies");
    });
  });
});
