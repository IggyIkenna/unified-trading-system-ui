/**
 * L1.5 widget harness — defi-trade-history-widget.
 *
 * Pattern reference:
 *   tests/widgets/defi/defi-lending-widget.test.tsx
 *   tests/widgets/book/book-trade-history.test.tsx
 *   codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   plans/ai/ui_widget_test_rollout_2026_04_24.plan.md (Phase 3 Wave 2 DeFi)
 *
 * Scope (per cert docs/manifest/widget-certification/defi-trade-history.json):
 * - Render rows from tradeHistory context.
 * - Parent-row test-ids present; child-fill rows distinguished (cert L4.1).
 * - Empty state when tradeHistory is empty (cert L0.7).
 * - Header summary surfaces trade count + net P&L when rows present.
 * - Row click on parent with execution_chain toggles expansion (cert L4.1).
 * - Status badges render per row.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { TradeHistoryRow } from "@/lib/types/defi";
import { buildMockDeFiData } from "../_helpers/mock-defi-context";

function buildMockTradeRow(overrides: Partial<TradeHistoryRow> = {}): TradeHistoryRow {
  return {
    seq: 1,
    timestamp: "2026-04-24T12:00:00Z",
    instruction_type: "SWAP",
    algo_type: "SOR_DEX",
    instrument_id: "ETH/USDC",
    venue: "UNISWAPV3-ETHEREUM",
    amount: 1.5,
    price: 2500,
    expected_output: 3750,
    actual_output: 3745,
    instant_pnl: {
      gross_pnl: -5,
      price_slippage_usd: 5,
      gas_cost_usd: 12,
      trading_fee_usd: 3,
      bridge_fee_usd: 0,
      net_pnl: -20,
    } as TradeHistoryRow["instant_pnl"],
    running_pnl: -20,
    status: "filled",
    ...overrides,
  };
}

const mockDeFiData = {
  ...buildMockDeFiData(),
  tradeHistory: [
    buildMockTradeRow({ seq: 1, instruction_type: "SWAP", venue: "UNISWAPV3-ETHEREUM" }),
    buildMockTradeRow({
      seq: 2,
      instruction_type: "LEND",
      venue: "AAVEV3-ETHEREUM",
      instrument_id: "USDC",
      running_pnl: 42,
      status: "filled",
    }),
  ] as TradeHistoryRow[],
};

vi.mock("@/components/widgets/defi/defi-data-context", () => ({
  useDeFiData: () => mockDeFiData,
}));

import { DeFiTradeHistoryWidget } from "@/components/widgets/defi/defi-trade-history-widget";

describe("defi-trade-history-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockDeFiData, {
      ...buildMockDeFiData(),
      tradeHistory: [
        buildMockTradeRow({ seq: 1, instruction_type: "SWAP", venue: "UNISWAPV3-ETHEREUM" }),
        buildMockTradeRow({
          seq: 2,
          instruction_type: "LEND",
          venue: "AAVEV3-ETHEREUM",
          instrument_id: "USDC",
          running_pnl: 42,
          status: "filled",
        }),
      ],
    });
  });

  describe("render", () => {
    it("renders a row per parent trade in tradeHistory", () => {
      render(<DeFiTradeHistoryWidget />);
      const rows = screen.getAllByTestId("trade-history-row");
      expect(rows.length).toBe(2);
    });

    it("surfaces instruction_type and venue per row", () => {
      render(<DeFiTradeHistoryWidget />);
      expect(screen.getByText("SWAP")).toBeTruthy();
      expect(screen.getByText("LEND")).toBeTruthy();
      expect(screen.getByText("UNISWAPV3-ETHEREUM")).toBeTruthy();
      expect(screen.getByText("AAVEV3-ETHEREUM")).toBeTruthy();
    });

    it("shows empty-state message when tradeHistory is empty (cert L0.7)", () => {
      Object.assign(mockDeFiData, { ...buildMockDeFiData(), tradeHistory: [] as TradeHistoryRow[] });
      render(<DeFiTradeHistoryWidget />);
      expect(screen.getByText(/no trade history yet/i)).toBeTruthy();
    });

    it("renders header summary (trade count) when rows are present", () => {
      render(<DeFiTradeHistoryWidget />);
      // Header shows 'Trades: <n>' with n counting non-child rows.
      expect(screen.getByText(/trades:/i)).toBeTruthy();
    });
  });

  describe("child fills (cert L4.1)", () => {
    it("marks child rows with data-testid='trade-history-child'", () => {
      Object.assign(mockDeFiData, {
        ...buildMockDeFiData(),
        tradeHistory: [
          buildMockTradeRow({ seq: 10, instruction_type: "SWAP" }),
          buildMockTradeRow({ seq: 11, instruction_type: "SWAP", is_child_fill: true, parent_seq: 10 }),
        ],
      });
      render(<DeFiTradeHistoryWidget />);
      expect(screen.getAllByTestId("trade-history-row").length).toBe(1);
      expect(screen.getAllByTestId("trade-history-child").length).toBe(1);
    });
  });

  describe("row expansion", () => {
    it("clicking a parent row with execution_chain reveals chain details", () => {
      Object.assign(mockDeFiData, {
        ...buildMockDeFiData(),
        tradeHistory: [
          buildMockTradeRow({
            seq: 99,
            instruction_type: "SWAP",
            execution_chain: [
              { label: "Quote", detail: "SOR", duration_ms: 12 },
              { label: "Submit", detail: "Uniswap", duration_ms: 85 },
            ] as TradeHistoryRow["execution_chain"],
          }),
        ],
      });
      render(<DeFiTradeHistoryWidget />);
      const row = screen.getAllByTestId("trade-history-row")[0]!;
      // Expansion content not visible before click
      expect(screen.queryByText("Quote")).toBeNull();
      fireEvent.click(row);
      expect(screen.getByText("Quote")).toBeTruthy();
      expect(screen.getByText("Submit")).toBeTruthy();
    });
  });
});
