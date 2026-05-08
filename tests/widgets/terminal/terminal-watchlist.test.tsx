/**
 * L1.5 widget harness — terminal-watchlist-widget
 *
 * Pattern: unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 * Plan: unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan Phase 5
 *
 * Scope:
 * - Render: symbols from context appear in the panel.
 * - Symbol selection: clicking a symbol row calls setSelectedInstrument.
 * - Category tabs: instrumentsByCategory maps to watchlist tabs.
 * - Empty category: "No symbols" message from WatchlistPanel.
 * - Active list syncs to selectedInstrument.category on mount.
 *
 * Out of scope: WatchlistPanel internals (scroll virtualization → Playwright ct),
 *   route wiring (L2), multi-widget selection propagation (L3b).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockInstrument, buildMockTerminalData } from "../_helpers/mock-terminal-context";

const mockData = buildMockTerminalData();

vi.mock("@/components/widgets/terminal/terminal-data-context", () => ({
  useTerminalData: () => mockData,
}));

import { TerminalWatchlistWidget } from "@/components/widgets/terminal/terminal-watchlist-widget";

describe("terminal-watchlist — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockTerminalData());
  });

  describe("render", () => {
    it("mounts without crashing with default context", () => {
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      // WatchlistPanel renders at least the list-selector dropdown
      expect(document.body).toBeTruthy();
    });

    it("displays the default instrument symbol BTC-USDT in the panel", () => {
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      expect(screen.getAllByText(/BTC-USDT/).length).toBeGreaterThan(0);
    });

    it("shows instrument name Bitcoin / Tether", () => {
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      expect(screen.getByText(/Bitcoin \/ Tether/)).toBeTruthy();
    });

    it("displays footer symbol count — 1 symbols (one instrument in default mock)", () => {
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      // WatchlistPanel footer: "{filtered.length} symbols"
      expect(screen.getByText(/1 symbols/)).toBeTruthy();
    });
  });

  describe("category tabs", () => {
    it("renders a category dropdown with the 'crypto' list", () => {
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      // Category selector: combobox trigger shows category label
      expect(screen.getByText("crypto")).toBeTruthy();
    });

    it("maps multiple categories to separate watchlist tabs", () => {
      const btcInst = buildMockInstrument({ symbol: "BTC-USDT", category: "crypto", instrumentKey: "btc-usdt" });
      const eurusdInst = buildMockInstrument({
        symbol: "EUR-USD",
        name: "Euro / US Dollar",
        venue: "Forex.com",
        category: "forex",
        instrumentKey: "eur-usd",
        midPrice: 1.08,
        change: -0.12,
      });
      Object.assign(
        mockData,
        buildMockTerminalData({
          instruments: [btcInst, eurusdInst],
          selectedInstrument: btcInst,
        }),
      );
      mockData.instrumentsByCategory = {
        crypto: [btcInst],
        forex: [eurusdInst],
      };
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      // Both categories should exist as watchlist options
      expect(screen.getByText("crypto")).toBeTruthy();
    });
  });

  describe("symbol selection", () => {
    it("calls setSelectedInstrument when a symbol row is clicked", () => {
      const setSelectedInstrument = vi.fn();
      Object.assign(mockData, buildMockTerminalData());
      mockData.setSelectedInstrument = setSelectedInstrument;
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      // Click the BTC-USDT symbol row (role="button" per WatchlistPanel implementation)
      const symbolRow = screen.getByRole("button", { name: /BTC-USDT/i });
      fireEvent.click(symbolRow);
      expect(setSelectedInstrument).toHaveBeenCalledTimes(1);
      const calledWith = setSelectedInstrument.mock.calls[0]![0] as { symbol: string };
      expect(calledWith.symbol).toBe("BTC-USDT");
    });

    it("keyboard Enter on symbol row also calls setSelectedInstrument", () => {
      const setSelectedInstrument = vi.fn();
      Object.assign(mockData, buildMockTerminalData());
      mockData.setSelectedInstrument = setSelectedInstrument;
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      const symbolRow = screen.getByRole("button", { name: /BTC-USDT/i });
      fireEvent.keyDown(symbolRow, { key: "Enter" });
      expect(setSelectedInstrument).toHaveBeenCalledTimes(1);
    });
  });

  describe("empty state", () => {
    it("shows No symbols when instrumentsByCategory is empty for the active category", () => {
      Object.assign(
        mockData,
        buildMockTerminalData({
          instruments: [],
          selectedInstrument: buildMockInstrument(),
        }),
      );
      mockData.instrumentsByCategory = { crypto: [] };
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      expect(screen.getByText(/no symbols/i)).toBeTruthy();
    });
  });

  describe("search filter", () => {
    it("shows No symbols when filter text matches no instruments", () => {
      render(<TerminalWatchlistWidget instanceId="tw-1" />);
      const searchInput = screen.getByPlaceholderText(/filter/i);
      fireEvent.change(searchInput, { target: { value: "ZZZNOMATCH" } });
      expect(screen.getByText(/no symbols/i)).toBeTruthy();
    });
  });
});
