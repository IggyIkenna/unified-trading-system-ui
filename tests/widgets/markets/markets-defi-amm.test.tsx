/**
 * L1.5 widget harness — markets-defi-amm-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan Phase 5
 *
 * Scope:
 * - Loading state renders spinner (via LiveFeedWidget).
 * - Error state renders error message + Retry button.
 * - Empty state when assetClass != 'defi' shows redirect message.
 * - Empty state when assetClass = 'defi' but no rows shows "No AMM activity yet".
 * - With defi assetClass and rows: DeFi market structure warning card visible.
 * - Table columns visible (Time, Pool, Action, Amount In, Amount Out).
 *
 * Out of scope:
 * - Recharts SVG chart internals (happy-dom can't render them).
 * - Real WebSocket feed interactions (L3b).
 * - Visual regression (L4 — deferred).
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockMarketsData, buildMockOrderFlowEntry } from "../_helpers/mock-markets-context";

const mockMarketsData = buildMockMarketsData();

vi.mock("@/components/widgets/markets/markets-data-context", () => ({
  useMarketsData: () => mockMarketsData,
}));

// LiveFeedWidget is a shared component that the widget wraps; allow it to
// render normally — no additional mocking needed.

import { MarketsDefiAmmWidget } from "@/components/widgets/markets/markets-defi-amm-widget";

describe("markets-defi-amm-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockMarketsData, buildMockMarketsData());
  });

  describe("loading state", () => {
    it("shows Loading spinner when isLoading is true", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ isLoading: true }));
      render(<MarketsDefiAmmWidget instanceId="markets-defi-amm" layoutMode="grid" />);
      expect(screen.getByText(/loading/i)).toBeTruthy();
    });
  });

  describe("error state", () => {
    it("shows error message when isError is true", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ isError: true }));
      render(<MarketsDefiAmmWidget instanceId="markets-defi-amm" layoutMode="grid" />);
      expect(screen.getByText(/Failed to load AMM activity/i)).toBeTruthy();
    });

    it("shows Retry button on error", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ isError: true }));
      render(<MarketsDefiAmmWidget instanceId="markets-defi-amm" layoutMode="grid" />);
      expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy();
    });
  });

  describe("empty state — non-defi asset class", () => {
    it("shows redirect message when assetClass is 'crypto'", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ assetClass: "crypto" }));
      render(<MarketsDefiAmmWidget instanceId="markets-defi-amm" layoutMode="grid" />);
      expect(screen.getByText(/Set asset class to DeFi/i)).toBeTruthy();
    });

    it("shows redirect message when assetClass is 'tradfi'", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ assetClass: "tradfi" }));
      render(<MarketsDefiAmmWidget instanceId="markets-defi-amm" layoutMode="grid" />);
      expect(screen.getByText(/Set asset class to DeFi/i)).toBeTruthy();
    });
  });

  describe("empty state — defi with no rows", () => {
    it("shows 'No AMM activity yet' when assetClass=defi and orderFlowData is empty", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ assetClass: "defi", orderFlowData: [] }));
      render(<MarketsDefiAmmWidget instanceId="markets-defi-amm" layoutMode="grid" />);
      expect(screen.getByText(/No AMM activity yet/i)).toBeTruthy();
    });
  });

  describe("populated defi state", () => {
    it("shows DeFi market structure warning when assetClass is 'defi' with rows", () => {
      Object.assign(
        mockMarketsData,
        buildMockMarketsData({
          assetClass: "defi",
          orderFlowData: [buildMockOrderFlowEntry({ type: "trade" })],
        }),
      );
      render(<MarketsDefiAmmWidget instanceId="markets-defi-amm" layoutMode="grid" />);
      expect(screen.getByText(/DeFi market structure/i)).toBeTruthy();
    });

    it("renders table column headers when rows present", () => {
      Object.assign(
        mockMarketsData,
        buildMockMarketsData({
          assetClass: "defi",
          orderFlowData: [buildMockOrderFlowEntry({ type: "trade", venue: "Uniswap V3" })],
        }),
      );
      render(<MarketsDefiAmmWidget instanceId="markets-defi-amm" layoutMode="grid" />);
      expect(screen.getByText("Time")).toBeTruthy();
      expect(screen.getByText("Pool")).toBeTruthy();
      expect(screen.getByText("Action")).toBeTruthy();
    });

    it("shows Swap badge for trade-type rows", () => {
      Object.assign(
        mockMarketsData,
        buildMockMarketsData({
          assetClass: "defi",
          orderFlowData: [buildMockOrderFlowEntry({ type: "trade" })],
        }),
      );
      render(<MarketsDefiAmmWidget instanceId="markets-defi-amm" layoutMode="grid" />);
      expect(screen.getByText("Swap")).toBeTruthy();
    });

    it("shows LP badge for non-trade-type rows", () => {
      Object.assign(
        mockMarketsData,
        buildMockMarketsData({
          assetClass: "defi",
          orderFlowData: [buildMockOrderFlowEntry({ type: "bid" })],
        }),
      );
      render(<MarketsDefiAmmWidget instanceId="markets-defi-amm" layoutMode="grid" />);
      expect(screen.getByText("LP")).toBeTruthy();
    });
  });
});
