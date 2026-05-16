/**
 * L1.5 widget harness — enhanced-basis-dashboard (EnhancedBasisWidget).
 *
 * Pattern reference:
 *   tests/widgets/defi/defi-lending-widget.test.tsx
 *   codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   plans/ai/ui_widget_test_rollout_2026_04_24.md (Phase 3 Wave 2 DeFi)
 *
 * Scope (per cert docs/manifest/widget-certification/enhanced-basis-dashboard.json):
 * - Render + root testid mount with market data present.
 * - Best-opportunity banner surfaces highest annualised yield (cert L0).
 * - Per-asset rows render with pair + venue labels from hardcoded maps (cert L1 finding).
 * - Empty-state when basisTradeAssets has no matching market data (cert L0.7).
 * - Table columns: pair, basis bps, funding 8h, APY render from context.
 */
import type { BasisTradeMarketData } from "@/lib/types/defi";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockDeFiData } from "../_helpers/mock-defi-context";

function buildMarketData(overrides: Partial<BasisTradeMarketData> = {}): BasisTradeMarketData {
  return {
    spotPrice: 3200,
    perpPrice: 3220,
    fundingRate: 0.0001,
    fundingRateAnnualized: 0.18,
    basis24h: 25,
    basisBps: 62,
    volume24h: 1_250_000_000,
    slippage: 3,
    ...overrides,
  };
}

const mockDeFiData = {
  ...buildMockDeFiData(),
  basisTradeAssets: ["ETH", "SOL"],
  basisTradeMarketData: {
    ETH: buildMarketData({ spotPrice: 3200, perpPrice: 3220, basisBps: 62, fundingRateAnnualized: 0.18 }),
    SOL: buildMarketData({ spotPrice: 152.3, perpPrice: 153.1, basisBps: 52, fundingRateAnnualized: 0.32 }),
  } as Record<string, BasisTradeMarketData>,
};

vi.mock("@/components/widgets/defi/defi-data-context", () => ({
  useDeFiData: () => mockDeFiData,
}));

import { EnhancedBasisWidget } from "@/components/widgets/defi/enhanced-basis-widget";

function renderWidget() {
  return render(<EnhancedBasisWidget instanceId="enhanced-basis-1" />);
}

describe("enhanced-basis-dashboard — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockDeFiData, {
      ...buildMockDeFiData(),
      basisTradeAssets: ["ETH", "SOL"],
      basisTradeMarketData: {
        ETH: buildMarketData({ spotPrice: 3200, perpPrice: 3220, basisBps: 62, fundingRateAnnualized: 0.18 }),
        SOL: buildMarketData({ spotPrice: 152.3, perpPrice: 153.1, basisBps: 52, fundingRateAnnualized: 0.32 }),
      },
    });
  });

  describe("render", () => {
    it("mounts root testid with basis data present", () => {
      renderWidget();
      expect(screen.getByTestId("enhanced-basis-widget")).toBeTruthy();
    });

    it("renders the Enhanced Basis Dashboard title", () => {
      renderWidget();
      expect(screen.getByText(/enhanced basis dashboard/i)).toBeTruthy();
    });

    it("renders one row per asset in basisTradeAssets", () => {
      renderWidget();
      expect(screen.getByText("ETH/USDT")).toBeTruthy();
      expect(screen.getByText("SOL/USDT")).toBeTruthy();
    });

    it("surfaces venue labels from the per-asset hardcoded maps", () => {
      renderWidget();
      // ETH -> Uniswap V3 (spot) + Hyperliquid (perp); SOL -> Raydium + Drift.
      expect(screen.getAllByText("Uniswap V3").length).toBeGreaterThan(0);
      expect(screen.getByText("Raydium")).toBeTruthy();
      expect(screen.getByText("Drift")).toBeTruthy();
    });
  });

  describe("best opportunity", () => {
    it("highlights the asset with highest annualised yield", () => {
      // SOL has fundingRateAnnualized 0.32 (32%), ETH has 0.18 (18%) — SOL wins.
      renderWidget();
      // The banner renders "Best Opportunity:" and "SOL/USDT (Raydium / Drift)"
      // in sibling spans inside the same container. Walk up to the banner div.
      const banner = screen.getByText(/best opportunity/i).closest("div");
      expect(banner).toBeTruthy();
      expect(banner!.textContent).toContain("SOL/USDT");
    });
  });

  describe("empty state (cert L0.7)", () => {
    it("renders empty message when no assets map to market data", () => {
      Object.assign(mockDeFiData, {
        ...buildMockDeFiData(),
        basisTradeAssets: ["ETH"],
        basisTradeMarketData: {} as Record<string, BasisTradeMarketData>,
      });
      renderWidget();
      expect(screen.getByText(/no basis opportunities available/i)).toBeTruthy();
    });
  });

  describe("per-row metrics", () => {
    it("renders basis bps badge per row", () => {
      renderWidget();
      expect(screen.getByText(/62 bps/i)).toBeTruthy();
      expect(screen.getByText(/52 bps/i)).toBeTruthy();
    });
  });
});
