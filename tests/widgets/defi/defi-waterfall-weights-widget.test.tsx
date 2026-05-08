/**
 * L1.5 widget harness — defi-waterfall-weights-widget.
 *
 * Pattern reference:
 *   tests/widgets/defi/defi-lending-widget.test.tsx
 *   codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   plans/ai/ui_widget_test_rollout_2026_04_24.plan (Phase 3 Wave 2 DeFi — metrics)
 *
 * Scope:
 * - Render root testid; Pillar 1 coin labels + % columns.
 * - Empty-coin branch (`coin_weights` is {}) renders italic "No coin allocations".
 * - Pillar 2 default copy before any coin selection ("select a coin above").
 * - Clicking a coin row reveals that coin's venue weights in Pillar 2.
 * - Clicking the selected coin again toggles selection off.
 * - Restricted venues banner renders when `restricted_venues` is non-empty.
 * - Restricted venue gets a "Restricted" badge inside Pillar 2 rows.
 */
import type { WaterfallWeights } from "@/lib/types/defi";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockDeFiData } from "../_helpers/mock-defi-context";

function buildMockWaterfallWeights(overrides: Partial<WaterfallWeights> = {}): WaterfallWeights {
  return {
    coin_weights: {
      BTC: 0.5,
      ETH: 0.3,
      SOL: 0.2,
    },
    venue_weights: {
      BTC: { HYPERLIQUID: 0.6, BINANCE: 0.4 },
      ETH: { HYPERLIQUID: 0.5, BINANCE: 0.5 },
      SOL: { HYPERLIQUID: 0.7, BINANCE: 0.3 },
    },
    restricted_venues: ["BINANCE"],
    ...overrides,
  };
}

const mockDeFiData = {
  ...buildMockDeFiData(),
  waterfallWeights: buildMockWaterfallWeights(),
};

vi.mock("@/components/widgets/defi/defi-data-context", () => ({
  useDeFiData: () => mockDeFiData,
}));

import { DeFiWaterfallWeightsWidget } from "@/components/widgets/defi/defi-waterfall-weights-widget";

describe("defi-waterfall-weights — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockDeFiData, {
      ...buildMockDeFiData(),
      waterfallWeights: buildMockWaterfallWeights(),
    });
  });

  describe("render", () => {
    it("mounts root testid", () => {
      render(<DeFiWaterfallWeightsWidget instanceId="test-waterfall" />);
      expect(screen.getByTestId("defi-waterfall-weights-widget")).toBeTruthy();
    });

    it("renders Pillar 1 coin labels from coin_weights", () => {
      render(<DeFiWaterfallWeightsWidget instanceId="test-waterfall" />);
      expect(screen.getByText("BTC")).toBeTruthy();
      expect(screen.getByText("ETH")).toBeTruthy();
      expect(screen.getByText("SOL")).toBeTruthy();
    });

    it("renders Pillar 1 percentages (0.5 -> 50%, 0.3 -> 30%, 0.2 -> 20%)", () => {
      render(<DeFiWaterfallWeightsWidget instanceId="test-waterfall" />);
      expect(screen.getByText("50%")).toBeTruthy();
      expect(screen.getByText("30%")).toBeTruthy();
      expect(screen.getByText("20%")).toBeTruthy();
    });

    it("renders Pillar 2 default copy with no selection", () => {
      render(<DeFiWaterfallWeightsWidget instanceId="test-waterfall" />);
      expect(screen.getByText(/select a coin above/i)).toBeTruthy();
      expect(screen.getByText(/click a coin in pillar 1/i)).toBeTruthy();
    });
  });

  describe("empty branch", () => {
    it("renders italic 'No coin allocations' when coin_weights is {}", () => {
      Object.assign(mockDeFiData, {
        ...buildMockDeFiData(),
        waterfallWeights: buildMockWaterfallWeights({ coin_weights: {}, venue_weights: {} }),
      });
      render(<DeFiWaterfallWeightsWidget instanceId="test-waterfall" />);
      expect(screen.getByText(/no coin allocations available/i)).toBeTruthy();
    });
  });

  describe("coin selection", () => {
    it("clicking a coin reveals that coin's venue weights in Pillar 2", () => {
      render(<DeFiWaterfallWeightsWidget instanceId="test-waterfall" />);
      fireEvent.click(screen.getByText("BTC"));
      // Pillar 2 header now includes (BTC)
      expect(screen.getByText(/pillar 2: venue weights \(btc\)/i)).toBeTruthy();
      // First 6 chars of venue labels: "HYPERL" and "BINANC"
      expect(screen.getByText("HYPERL")).toBeTruthy();
      expect(screen.getByText("BINANC")).toBeTruthy();
    });

    it("clicking the selected coin again clears selection", () => {
      render(<DeFiWaterfallWeightsWidget instanceId="test-waterfall" />);
      fireEvent.click(screen.getByText("BTC"));
      fireEvent.click(screen.getByText("BTC"));
      expect(screen.getByText(/select a coin above/i)).toBeTruthy();
    });
  });

  describe("restricted venues", () => {
    it("renders restricted-venues banner when restricted_venues is non-empty", () => {
      render(<DeFiWaterfallWeightsWidget instanceId="test-waterfall" />);
      expect(screen.getByText(/patrick restricted from: binance/i)).toBeTruthy();
    });

    it("renders a 'Restricted' badge next to restricted venue rows after selection", () => {
      render(<DeFiWaterfallWeightsWidget instanceId="test-waterfall" />);
      fireEvent.click(screen.getByText("BTC"));
      expect(screen.getByText("Restricted")).toBeTruthy();
    });

    it("omits the restricted-venues banner when restricted_venues is []", () => {
      Object.assign(mockDeFiData, {
        ...buildMockDeFiData(),
        waterfallWeights: buildMockWaterfallWeights({ restricted_venues: [] }),
      });
      render(<DeFiWaterfallWeightsWidget instanceId="test-waterfall" />);
      expect(screen.queryByText(/patrick restricted from/i)).toBeNull();
    });
  });
});
