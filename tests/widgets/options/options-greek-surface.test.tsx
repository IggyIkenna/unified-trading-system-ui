/**
 * L1.5 widget harness — options-greek-surface-widget (widgetId: options-greek-surface).
 *
 * Pattern per:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan.md Phase 5
 *
 * Scope:
 * - Widget mounts and delegates to the correct surface panel based on isCrypto.
 * - Crypto path renders GreeksSurfacePanel with the active asset.
 * - TradFi path renders TradFiVolSurfacePanel with the active TradFi asset.
 * - No SVG / canvas assertions (3D chart — L4 deferred per task spec).
 *
 * Out of scope:
 * - 3D surface chart interactions (Playwright ct, L4)
 * - Real route wiring (L2)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildMockOptionsData } from "../_helpers/mock-options-context";

const mockOptionsData = buildMockOptionsData();

vi.mock("@/components/widgets/options/options-data-context", () => ({
  useOptionsData: () => mockOptionsData,
}));

vi.mock("@/components/trading/options-futures-panel", () => ({
  GreeksSurfacePanel: ({ asset }: { asset: string }) => (
    <div data-testid="greeks-surface-panel-stub">GreeksSurface:{asset}</div>
  ),
  TradFiVolSurfacePanel: ({ tradFiAsset }: { tradFiAsset: string }) => (
    <div data-testid="tradfi-vol-surface-panel-stub">TradFiVolSurface:{tradFiAsset}</div>
  ),
}));

import { OptionsGreekSurfaceWidget } from "@/components/widgets/options/options-greek-surface-widget";

describe("options-greek-surface widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockOptionsData, buildMockOptionsData());
  });

  describe("render — crypto mode", () => {
    it("renders GreeksSurfacePanel when isCrypto is true", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ assetClass: "crypto", isCrypto: true, asset: "BTC" }));
      render(<OptionsGreekSurfaceWidget />);
      expect(screen.getByTestId("greeks-surface-panel-stub")).toBeTruthy();
      expect(screen.queryByTestId("tradfi-vol-surface-panel-stub")).toBeNull();
    });

    it("passes the active crypto asset to GreeksSurfacePanel", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ assetClass: "crypto", isCrypto: true, asset: "ETH" }));
      render(<OptionsGreekSurfaceWidget />);
      expect(screen.getByTestId("greeks-surface-panel-stub").textContent).toContain("ETH");
    });

    it("updates panel when asset changes to SOL", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ assetClass: "crypto", isCrypto: true, asset: "SOL" }));
      render(<OptionsGreekSurfaceWidget />);
      expect(screen.getByTestId("greeks-surface-panel-stub").textContent).toContain("SOL");
    });
  });

  describe("render — TradFi mode", () => {
    it("renders TradFiVolSurfacePanel when isCrypto is false", () => {
      Object.assign(
        mockOptionsData,
        buildMockOptionsData({ assetClass: "tradfi", isCrypto: false, tradFiAsset: "SPY" }),
      );
      render(<OptionsGreekSurfaceWidget />);
      expect(screen.getByTestId("tradfi-vol-surface-panel-stub")).toBeTruthy();
      expect(screen.queryByTestId("greeks-surface-panel-stub")).toBeNull();
    });

    it("passes the active TradFi asset to TradFiVolSurfacePanel", () => {
      Object.assign(
        mockOptionsData,
        buildMockOptionsData({ assetClass: "tradfi", isCrypto: false, tradFiAsset: "QQQ" }),
      );
      render(<OptionsGreekSurfaceWidget />);
      expect(screen.getByTestId("tradfi-vol-surface-panel-stub").textContent).toContain("QQQ");
    });

    it("switches from crypto to TradFi panel on context change", () => {
      // Start crypto
      Object.assign(mockOptionsData, buildMockOptionsData({ assetClass: "crypto", isCrypto: true }));
      const { unmount } = render(<OptionsGreekSurfaceWidget />);
      expect(screen.getByTestId("greeks-surface-panel-stub")).toBeTruthy();
      unmount();

      // Switch to TradFi
      Object.assign(mockOptionsData, buildMockOptionsData({ assetClass: "tradfi", isCrypto: false }));
      render(<OptionsGreekSurfaceWidget />);
      expect(screen.getByTestId("tradfi-vol-surface-panel-stub")).toBeTruthy();
    });
  });
});
