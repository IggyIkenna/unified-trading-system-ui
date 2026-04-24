/**
 * L1.5 widget harness — options-watchlist-widget (widgetId: options-watchlist).
 *
 * Pattern per:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan.md Phase 5
 *
 * Scope:
 * - Widget mounts and passes correct props to WatchlistPanel.
 * - Active list ID and selected symbol propagate from context.
 * - onListChange and onSelectSymbol callbacks wire through to context setters.
 * - Multiple watchlists visible when context provides them.
 *
 * Out of scope:
 * - WatchlistPanel internal search, add/remove (L3b)
 * - Visual regression (L4 deferred)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildMockOptionsData, buildMockWatchlist, buildMockWatchlistSymbol } from "../_helpers/mock-options-context";

const mockOptionsData = buildMockOptionsData();

vi.mock("@/components/widgets/options/options-data-context", () => ({
  useOptionsData: () => mockOptionsData,
}));

vi.mock("@/components/trading/watchlist-panel", () => ({
  WatchlistPanel: (props: {
    watchlists: { id: string; label: string; symbols: { id: string; symbol: string }[] }[];
    activeListId: string;
    onListChange: (id: string) => void;
    selectedSymbolId?: string;
    onSelectSymbol: (sym: { id: string; symbol: string }) => void;
    editable?: boolean;
  }) => (
    <div data-testid="watchlist-panel-stub">
      <span data-testid="active-list-id">{props.activeListId}</span>
      <span data-testid="selected-symbol-id">{props.selectedSymbolId ?? ""}</span>
      <span data-testid="watchlist-count">{props.watchlists.length}</span>
      <span data-testid="editable">{String(props.editable)}</span>
      {props.watchlists.map((wl) => (
        <button key={wl.id} data-testid={`list-btn-${wl.id}`} onClick={() => props.onListChange(wl.id)}>
          {wl.label}
        </button>
      ))}
      {props.watchlists.flatMap((wl) =>
        wl.symbols.map((sym) => (
          <button key={sym.id} data-testid={`sym-btn-${sym.id}`} onClick={() => props.onSelectSymbol(sym)}>
            {sym.symbol}
          </button>
        )),
      )}
    </div>
  ),
}));

import { OptionsWatchlistWidget } from "@/components/widgets/options/options-watchlist-widget";

describe("options-watchlist widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockOptionsData, buildMockOptionsData());
  });

  describe("render", () => {
    it("mounts WatchlistPanel stub", () => {
      render(<OptionsWatchlistWidget />);
      expect(screen.getByTestId("watchlist-panel-stub")).toBeTruthy();
    });

    it("passes the active watchlistId to WatchlistPanel", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ watchlistId: "crypto-top" }));
      render(<OptionsWatchlistWidget />);
      expect(screen.getByTestId("active-list-id").textContent).toBe("crypto-top");
    });

    it("passes selectedWatchlistSymbolId to WatchlistPanel", () => {
      Object.assign(mockOptionsData, buildMockOptionsData({ selectedWatchlistSymbolId: "eth" }));
      render(<OptionsWatchlistWidget />);
      expect(screen.getByTestId("selected-symbol-id").textContent).toBe("eth");
    });

    it("passes all watchlists from context", () => {
      const wl1 = buildMockWatchlist({ id: "crypto-top", label: "Crypto Top" });
      const wl2 = buildMockWatchlist({ id: "tradfi-us", label: "TradFi US", symbols: [] });
      Object.assign(mockOptionsData, buildMockOptionsData({ watchlists: [wl1, wl2] }));
      render(<OptionsWatchlistWidget />);
      expect(screen.getByTestId("watchlist-count").textContent).toBe("2");
    });

    it("renders editable=true (context passes editable prop to WatchlistPanel)", () => {
      render(<OptionsWatchlistWidget />);
      // OptionsWatchlistWidget passes editable prop
      expect(screen.getByTestId("editable").textContent).toBe("true");
    });
  });

  describe("callbacks", () => {
    it("calls setWatchlistId when onListChange is invoked", () => {
      const setWatchlistId = vi.fn();
      const data = buildMockOptionsData({
        watchlists: [
          buildMockWatchlist({ id: "crypto-top", label: "Crypto Top" }),
          buildMockWatchlist({ id: "tradfi-us", label: "TradFi US", symbols: [] }),
        ],
      });
      data.setWatchlistId = setWatchlistId;
      Object.assign(mockOptionsData, data);
      render(<OptionsWatchlistWidget />);
      fireEvent.click(screen.getByTestId("list-btn-tradfi-us"));
      expect(setWatchlistId).toHaveBeenCalledWith("tradfi-us");
    });

    it("calls handleWatchlistSelect when a symbol is clicked", () => {
      const handleWatchlistSelect = vi.fn();
      const btcSym = buildMockWatchlistSymbol({ id: "btc", symbol: "BTC" });
      const data = buildMockOptionsData({
        watchlists: [buildMockWatchlist({ id: "crypto-top", label: "Crypto Top", symbols: [btcSym] })],
      });
      data.handleWatchlistSelect = handleWatchlistSelect;
      Object.assign(mockOptionsData, data);
      render(<OptionsWatchlistWidget />);
      fireEvent.click(screen.getByTestId("sym-btn-btc"));
      expect(handleWatchlistSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "btc", symbol: "BTC" }));
    });
  });
});
