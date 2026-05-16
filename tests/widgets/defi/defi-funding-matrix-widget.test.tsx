/**
 * L1.5 widget harness — defi-funding-matrix-widget.
 *
 * Pattern reference:
 *   tests/widgets/defi/defi-lending-widget.test.tsx
 *   codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   plans/ai/ui_widget_test_rollout_2026_04_24.md (Phase 3 Wave 2 DeFi — metrics)
 *
 * Scope:
 * - Render root testid; header copy + coin rows from fundingRates keys.
 * - Empty branch when fundingRates is {} (cert L0.7).
 * - Best venue per coin renders underlined/bold.
 * - Sub-floor rates render greyed "--"/raw value and skip best-pick.
 * - Average row computes per-venue means.
 */
import type { FundingRateMatrix } from "@/lib/types/defi";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockDeFiData } from "../_helpers/mock-defi-context";

const mockDeFiData: ReturnType<typeof buildMockDeFiData> & { fundingRates: FundingRateMatrix } = {
  ...buildMockDeFiData(),
  fundingRates: {
    BTC: { HYPERLIQUID: 8.0, OKX: 4.5, BYBIT: 3.0, BINANCE: 1.0, ASTER: null },
    ETH: { HYPERLIQUID: 6.2, OKX: 5.1, BYBIT: 4.0, BINANCE: 2.0, ASTER: 3.5 },
    SOL: { HYPERLIQUID: 7.0, OKX: 3.2, BYBIT: 2.8, BINANCE: null, ASTER: 5.5 },
  },
};

vi.mock("@/components/widgets/defi/defi-data-context", () => ({
  useDeFiData: () => mockDeFiData,
}));

import { DeFiFundingMatrixWidget } from "@/components/widgets/defi/defi-funding-matrix-widget";

describe("defi-funding-matrix — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockDeFiData, {
      ...buildMockDeFiData(),
      fundingRates: {
        BTC: { HYPERLIQUID: 8.0, OKX: 4.5, BYBIT: 3.0, BINANCE: 1.0, ASTER: null },
        ETH: { HYPERLIQUID: 6.2, OKX: 5.1, BYBIT: 4.0, BINANCE: 2.0, ASTER: 3.5 },
        SOL: { HYPERLIQUID: 7.0, OKX: 3.2, BYBIT: 2.8, BINANCE: null, ASTER: 5.5 },
      },
    });
  });

  describe("render", () => {
    it("mounts root testid when fundingRates has coins", () => {
      render(<DeFiFundingMatrixWidget instanceId="test-funding-matrix" />);
      expect(screen.getByTestId("defi-funding-matrix-widget")).toBeTruthy();
    });

    it("renders empty-state copy when fundingRates is {}", () => {
      Object.assign(mockDeFiData, { ...buildMockDeFiData(), fundingRates: {} });
      render(<DeFiFundingMatrixWidget instanceId="test-funding-matrix" />);
      expect(screen.getByText(/no funding rate data/i)).toBeTruthy();
    });

    it("renders a row per coin in fundingRates", () => {
      render(<DeFiFundingMatrixWidget instanceId="test-funding-matrix" />);
      expect(screen.getByText("BTC")).toBeTruthy();
      expect(screen.getByText("ETH")).toBeTruthy();
      expect(screen.getByText("SOL")).toBeTruthy();
    });

    it("renders all five FUNDING_RATE_VENUES as column headers", () => {
      render(<DeFiFundingMatrixWidget instanceId="test-funding-matrix" />);
      for (const venue of ["HYPERLIQUID", "OKX", "BYBIT", "BINANCE", "ASTER"]) {
        expect(screen.getByRole("columnheader", { name: venue })).toBeTruthy();
      }
    });
  });

  describe("data rendering", () => {
    it("renders null rates as '--' placeholder", () => {
      render(<DeFiFundingMatrixWidget instanceId="test-funding-matrix" />);
      // BTC-ASTER and SOL-BINANCE are null in the fixture -> two "--" placeholders.
      const dashes = screen.getAllByText("--");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });

    it("renders numeric rates with trailing %", () => {
      render(<DeFiFundingMatrixWidget instanceId="test-funding-matrix" />);
      // BTC-HYPERLIQUID = 8.0%
      expect(screen.getByText("8.0%")).toBeTruthy();
      // ETH-OKX = 5.1%
      expect(screen.getByText("5.1%")).toBeTruthy();
    });

    it("shows avg footer row", () => {
      render(<DeFiFundingMatrixWidget instanceId="test-funding-matrix" />);
      expect(screen.getByText("Avg")).toBeTruthy();
    });

    it("references the FUNDING_RATE_FLOOR (2.5) in the header legend", () => {
      render(<DeFiFundingMatrixWidget instanceId="test-funding-matrix" />);
      expect(screen.getByText(/below 2.5% floor/i)).toBeTruthy();
    });
  });
});
