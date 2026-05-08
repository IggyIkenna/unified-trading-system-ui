/**
 * L1.5 widget harness — markets-live-book-widget.
 *
 * Pattern: unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 * Plan:    unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan Phase 5
 *
 * Scope:
 * - Renders with mocked context (no crash, key structure visible).
 * - Loading / error / empty states from cert L0.6/L0.7/L0.8.
 * - isDefi asset class shows DeFi empty-state message (cert L0.7).
 * - Non-defi asset class shows header badges and legend footer.
 * - Batch mode (liveBookUpdates=[]) shows "No book updates yet".
 * - Table columns: Exch Time, Delay, Venue rendered from book update.
 *
 * Out of scope:
 * - Real WebSocket, live routes (L2).
 * - Chart internals, screenshot diffs (L4).
 */
import type { LiveBookUpdate } from "@/lib/types/markets";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockMarketsData } from "../_helpers/mock-markets-context";

// ---------------------------------------------------------------------------
// Inline fixture extensions (mock-markets-context owns ownOrders/liveBookUpdates)
// ---------------------------------------------------------------------------

function buildMockBookUpdate(overrides: Partial<LiveBookUpdate> = {}): LiveBookUpdate {
  return {
    id: "book-1",
    exchangeTime: "2026-03-17T10:00:00.000Z",
    localTime: "2026-03-17T10:00:00.001Z",
    delayMs: 3,
    updateType: "book",
    bidLevels: [
      { price: 64990, size: 1.2, updated: false },
      { price: 64980, size: 0.8, updated: true },
    ],
    askLevels: [
      { price: 65010, size: 0.5, updated: false },
      { price: 65020, size: 1.0, updated: false },
    ],
    venue: "BINANCE",
    ...overrides,
  };
}

function buildMockTradeUpdate(overrides: Partial<LiveBookUpdate> = {}): LiveBookUpdate {
  return {
    id: "trade-1",
    exchangeTime: "2026-03-17T10:01:00.000Z",
    localTime: "2026-03-17T10:01:00.001Z",
    delayMs: 7,
    updateType: "trade",
    venue: "COINBASE",
    trade: {
      price: 65000,
      size: 0.5,
      side: "buy",
      aggressor: "buyer",
      isOwn: false,
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Module mocks — must be hoisted before component import.
// ---------------------------------------------------------------------------

const mockMarketsData = buildMockMarketsData();

vi.mock("@/components/widgets/markets/markets-data-context", () => ({
  useMarketsData: () => mockMarketsData,
}));

// useLiveFeed is a simple slice — mock it to return the input unchanged so
// tests stay deterministic without a real useMemo/React environment concern.
vi.mock("@/components/shared/live-feed-widget", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/shared/live-feed-widget")>();
  return {
    ...actual,
    useLiveFeed: <T,>(items: T[]) => items,
  };
});

import { MarketsLiveBookWidget } from "@/components/widgets/markets/markets-live-book-widget";

describe("markets-live-book-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockMarketsData, buildMockMarketsData());
  });

  describe("loading state (cert L0.6)", () => {
    it("shows loading spinner when isLoading=true", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ isLoading: true }));
      render(<MarketsLiveBookWidget />);
      expect(screen.getByText(/loading/i)).toBeTruthy();
    });
  });

  describe("error state (cert L0.8)", () => {
    it("shows error message and retry button when isError=true", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ isError: true }));
      render(<MarketsLiveBookWidget />);
      expect(screen.getByText(/failed to load order book data/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy();
    });
  });

  describe("defi empty state (cert L0.7)", () => {
    it("shows defi-specific empty message when assetClass=defi", () => {
      Object.assign(
        mockMarketsData,
        buildMockMarketsData({ assetClass: "defi", liveBookUpdates: [buildMockBookUpdate()] } as Parameters<
          typeof buildMockMarketsData
        >[0] & { liveBookUpdates: LiveBookUpdate[] }),
      );
      // spread liveBookUpdates separately since the base helper doesn't expose it
      mockMarketsData.liveBookUpdates = [buildMockBookUpdate()];
      mockMarketsData.assetClass = "defi";
      render(<MarketsLiveBookWidget />);
      expect(screen.getByText(/switch asset to crypto or tradfi/i)).toBeTruthy();
    });
  });

  describe("empty book (cert L0.7)", () => {
    it("shows 'No book updates yet' when liveBookUpdates is empty and assetClass=crypto", () => {
      mockMarketsData.liveBookUpdates = [];
      mockMarketsData.assetClass = "crypto";
      render(<MarketsLiveBookWidget />);
      expect(screen.getByText(/no book updates yet/i)).toBeTruthy();
    });
  });

  describe("render with book data", () => {
    it("shows header badges (venue label, update count) for crypto", () => {
      mockMarketsData.liveBookUpdates = [buildMockBookUpdate()];
      mockMarketsData.assetClass = "crypto";
      render(<MarketsLiveBookWidget />);
      // 1 update shows in badge
      expect(screen.getByText(/1 updates/)).toBeTruthy();
    });

    it("renders table header columns: Exch Time, Delay, Venue", () => {
      mockMarketsData.liveBookUpdates = [buildMockBookUpdate()];
      mockMarketsData.assetClass = "crypto";
      render(<MarketsLiveBookWidget />);
      expect(screen.getByText("Exch Time")).toBeTruthy();
      expect(screen.getByText("Delay")).toBeTruthy();
      expect(screen.getByText("Venue")).toBeTruthy();
    });

    it("renders bid column headers at bookDepth=2", () => {
      mockMarketsData.liveBookUpdates = [buildMockBookUpdate()];
      mockMarketsData.assetClass = "crypto";
      mockMarketsData.bookDepth = 2;
      render(<MarketsLiveBookWidget />);
      expect(screen.getByText("Bid 2")).toBeTruthy();
      expect(screen.getByText("Bid 1")).toBeTruthy();
      expect(screen.getByText("Ask 1")).toBeTruthy();
      expect(screen.getByText("Ask 2")).toBeTruthy();
    });

    it("renders trade row with venue from mock trade update", () => {
      mockMarketsData.liveBookUpdates = [buildMockTradeUpdate()];
      mockMarketsData.assetClass = "crypto";
      mockMarketsData.bookDepth = 2;
      render(<MarketsLiveBookWidget />);
      expect(screen.getByText("COINBASE")).toBeTruthy();
    });

    it("renders legend footer with Market Trade and Own (*) labels for non-defi", () => {
      mockMarketsData.liveBookUpdates = [buildMockBookUpdate()];
      mockMarketsData.assetClass = "crypto";
      render(<MarketsLiveBookWidget />);
      expect(screen.getByText(/market trade/i)).toBeTruthy();
      expect(screen.getByText(/own \(\*\)/i)).toBeTruthy();
    });
  });
});
