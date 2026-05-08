/**
 * L1.5 widget harness — defi-rates-overview-widget.
 *
 * Pattern reference:
 *   tests/widgets/defi/defi-lending-widget.test.tsx
 *   codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   plans/ai/ui_widget_test_rollout_2026_04_24.plan (Phase 3 Wave 2 DeFi — metrics)
 *
 * Scope:
 * - Render rows derived from lendingProtocols / stakingProtocols / liquidityPools.
 * - Best-supply / best-borrow detail picks the highest APY asset.
 * - Staking + LP rows render TVL (formatted via formatTvl).
 * - KPI strip reports total row count and max APY.
 * - Empty branch: all three source lists empty.
 */
import type { LiquidityPool, StakingProtocol } from "@/lib/types/defi";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockDeFiData, buildMockLendingProtocol } from "../_helpers/mock-defi-context";

function buildMockStakingProtocol(overrides: Partial<StakingProtocol> = {}): StakingProtocol {
  return {
    name: "Lido",
    venue_id: "LIDO-ETHEREUM",
    asset: "ETH",
    apy: 3.8,
    tvl: 25_000_000_000,
    minStake: 0.01,
    unbondingDays: 3,
    ...overrides,
  };
}

function buildMockLiquidityPool(overrides: Partial<LiquidityPool> = {}): LiquidityPool {
  return {
    name: "Uniswap V3",
    venue_id: "UNISWAPV3-ETHEREUM",
    token0: "ETH",
    token1: "USDC",
    feeTier: 0.003,
    tvl: 500_000_000,
    apr24h: 12.5,
    ...overrides,
  };
}

const mockDeFiData = {
  ...buildMockDeFiData(),
  stakingProtocols: [buildMockStakingProtocol()] as StakingProtocol[],
  liquidityPools: [buildMockLiquidityPool()] as LiquidityPool[],
};

vi.mock("@/components/widgets/defi/defi-data-context", () => ({
  useDeFiData: () => mockDeFiData,
}));

import { DeFiRatesOverviewWidget } from "@/components/widgets/defi/defi-rates-overview-widget";

describe("defi-rates-overview — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockDeFiData, {
      ...buildMockDeFiData(),
      stakingProtocols: [buildMockStakingProtocol()],
      liquidityPools: [buildMockLiquidityPool()],
    });
  });

  describe("render", () => {
    it("renders rows derived from lendingProtocols + stakingProtocols + liquidityPools", () => {
      render(<DeFiRatesOverviewWidget instanceId="test-rates-overview" />);
      // Lending (x2 — supply + borrow) from Aave V3
      expect(screen.getAllByText("Aave V3").length).toBeGreaterThanOrEqual(2);
      // Staking from Lido
      expect(screen.getByText("Lido")).toBeTruthy();
      // LP from Uniswap
      expect(screen.getByText("Uniswap V3")).toBeTruthy();
    });

    it("renders category cells for each source", () => {
      render(<DeFiRatesOverviewWidget instanceId="test-rates-overview" />);
      expect(screen.getByText("Lending supply")).toBeTruthy();
      expect(screen.getByText("Lending borrow")).toBeTruthy();
      expect(screen.getByText("Staking")).toBeTruthy();
      expect(screen.getByText("LP")).toBeTruthy();
    });

    it("best-supply detail uses the highest supplyApy asset (USDC @ 4.8 in the mock)", () => {
      render(<DeFiRatesOverviewWidget instanceId="test-rates-overview" />);
      expect(screen.getByText("Best: USDC")).toBeTruthy();
    });

    it("best-borrow detail uses the highest borrowApy asset (WBTC @ 8.9 in the mock)", () => {
      render(<DeFiRatesOverviewWidget instanceId="test-rates-overview" />);
      expect(screen.getByText("Best: WBTC")).toBeTruthy();
    });
  });

  describe("tvl formatting", () => {
    it("renders staking protocol TVL as $25.0B (>= 1e9 bucket)", () => {
      render(<DeFiRatesOverviewWidget instanceId="test-rates-overview" />);
      expect(screen.getByText("$25.0B")).toBeTruthy();
    });

    it("renders LP TVL as $500M (>= 1e6 bucket)", () => {
      render(<DeFiRatesOverviewWidget instanceId="test-rates-overview" />);
      expect(screen.getByText("$500M")).toBeTruthy();
    });

    it("renders LP token pair in detail column", () => {
      render(<DeFiRatesOverviewWidget instanceId="test-rates-overview" />);
      expect(screen.getByText("ETH/USDC")).toBeTruthy();
    });
  });

  describe("kpi strip", () => {
    it("reports total row count in the KPI strip (2 lending + 1 staking + 1 LP = 4)", () => {
      render(<DeFiRatesOverviewWidget instanceId="test-rates-overview" />);
      expect(screen.getByText("Rows")).toBeTruthy();
      expect(screen.getByText("4")).toBeTruthy();
    });

    it("reports max APY from the derived rows (12.5 from LP apr24h)", () => {
      render(<DeFiRatesOverviewWidget instanceId="test-rates-overview" />);
      expect(screen.getByText("Max APY / APR (mock)")).toBeTruthy();
      expect(screen.getByText("12.5%")).toBeTruthy();
    });
  });

  describe("empty branch", () => {
    it("renders zero rows + 0.0% max APY when all source lists are empty", () => {
      Object.assign(mockDeFiData, {
        ...buildMockDeFiData({
          lendingProtocols: [buildMockLendingProtocol({ assets: [], supplyApy: {}, borrowApy: {} })],
        }),
        lendingProtocols: [],
        stakingProtocols: [],
        liquidityPools: [],
      });
      render(<DeFiRatesOverviewWidget instanceId="test-rates-overview" />);
      expect(screen.getByText("0")).toBeTruthy();
      expect(screen.getByText("0.0%")).toBeTruthy();
    });
  });
});
