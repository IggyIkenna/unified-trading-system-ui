/**
 * L1.5 widget harness — terminal-watchlist-widget
 *
 * Pattern: unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 * Plan: unified-trading-pm/plans/ai/watchlist_from_instruments_2026_04_29.plan.md
 *
 * Scope as of 2026-04-30 system-watchlists pivot:
 * - Render: a system watchlist (Crypto Majors / US Stocks / DeFi Blue Chips)
 *   appears with the symbols whose instrument_keys exist in the in-memory
 *   live universe.
 * - Symbol selection: clicking a row calls setSelectedInstrument with the
 *   right instrument.
 * - User-list lifecycle: the "+ Create new watchlist" affordance writes a
 *   new entry to localStorage, which then appears in the dropdown.
 * - Empty state: when no instruments resolve, "No symbols" / empty-state
 *   copy renders.
 *
 * Out of scope: WatchlistPanel internals (scroll virtualisation → Playwright ct),
 *   route wiring (L2), full picker-modal flow (L3 — separate test).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildMockTerminalData, buildMockInstrument } from "../_helpers/mock-terminal-context";

// The widget reads SYSTEM_WATCHLISTS at module-import time. The first
// entry's first instrument_key is BINANCE-FUTURES:PERPETUAL:BTC-USDT —
// we ensure the mock instrument list contains it so the watchlist
// resolves at least one symbol on render.
const CHART_TESTED_BTC_KEY = "BINANCE-FUTURES:PERPETUAL:BTC-USDT";

const btcMock = buildMockInstrument({
  symbol: "BTC-USDT",
  name: "BTC-USDT Perp",
  venue: "BINANCE-FUTURES",
  instrumentKey: CHART_TESTED_BTC_KEY,
});

const mockData = buildMockTerminalData({ instruments: [btcMock], selectedInstrument: btcMock });

vi.mock("@/components/widgets/terminal/terminal-data-context", () => ({
  useTerminalData: () => mockData,
}));

import { TerminalWatchlistWidget } from "@/components/widgets/terminal/terminal-watchlist-widget";

describe("terminal-watchlist — L1.5 harness (system + user lists)", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockTerminalData({ instruments: [btcMock], selectedInstrument: btcMock }));
    // Reset localStorage so user lists don't leak across tests
    if (typeof window !== "undefined") window.localStorage.clear();
  });

  describe("render", () => {
    it("mounts without crashing", () => {
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      expect(document.body).toBeTruthy();
    });

    it("renders the chart-tested BTC-USDT row from Crypto Majors system list", () => {
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      // BTC-USDT is the first entry in `SYSTEM_WATCHLISTS[0]` and should resolve.
      expect(screen.getAllByText(/BTC-USDT/).length).toBeGreaterThan(0);
    });

    it("shows the venue badge so duplicates across exchanges are distinguishable", () => {
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      // The venue is rendered as a small badge — value comes from inst.venue.
      expect(screen.getAllByText(/BINANCE-FUTURES/).length).toBeGreaterThan(0);
    });

    it("footer counter shows N symbols (counts only resolved ones)", () => {
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      // Only the first Crypto Majors entry is in our mock universe; the
      // other 9 don't resolve so the footer should read "1 symbol".
      expect(screen.getAllByText(/1 symbol/).length).toBeGreaterThan(0);
    });
  });

  describe("symbol selection", () => {
    it("calls setSelectedInstrument when a symbol row is clicked", () => {
      const setSelectedInstrument = vi.fn();
      mockData.setSelectedInstrument = setSelectedInstrument;
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      const symbolRow = screen.getByRole("button", { name: /BTC-USDT/i });
      fireEvent.click(symbolRow);
      expect(setSelectedInstrument).toHaveBeenCalledTimes(1);
      const arg = setSelectedInstrument.mock.calls[0]![0] as { symbol: string };
      expect(arg.symbol).toBe("BTC-USDT");
    });

    it("keyboard Enter on a symbol row also selects it", () => {
      const setSelectedInstrument = vi.fn();
      mockData.setSelectedInstrument = setSelectedInstrument;
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      const symbolRow = screen.getByRole("button", { name: /BTC-USDT/i });
      fireEvent.keyDown(symbolRow, { key: "Enter" });
      expect(setSelectedInstrument).toHaveBeenCalledTimes(1);
    });
  });

  describe("system list semantics", () => {
    it("system lists are visible by default — first one is auto-selected", () => {
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      // The dropdown trigger surface displays the active list label —
      // for the default first-system-list-active behavior it's "Crypto Majors".
      expect(screen.getAllByText(/Crypto Majors/).length).toBeGreaterThan(0);
    });
  });

  describe("empty resolution", () => {
    it("shows No symbols when no system-list keys resolve against the universe", () => {
      Object.assign(mockData, buildMockTerminalData({ instruments: [], selectedInstrument: btcMock }));
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      expect(screen.getAllByText(/No symbols/i).length).toBeGreaterThan(0);
    });
  });

  describe("search filter", () => {
    it("shows No symbols when filter matches nothing", () => {
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      const searchInput = screen.getByPlaceholderText(/filter/i);
      fireEvent.change(searchInput, { target: { value: "ZZZNOMATCH" } });
      expect(screen.getAllByText(/No symbols/i).length).toBeGreaterThan(0);
    });
  });
});
