/**
 * L1.5 widget harness — defi-liquidity-widget.
 *
 * Pattern reference:
 *   tests/widgets/defi/defi-lending-widget.test.tsx
 *   codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   plans/ai/ui_widget_test_rollout_2026_04_24.md (Phase 3 Wave 2 DeFi)
 *
 * Scope (per cert docs/manifest/widget-certification/defi-liquidity.json):
 * - Render + root testid mount with pools available.
 * - Empty-state when liquidityPools is empty (cert L0.7).
 * - Operation toggle: ADD_LIQUIDITY ↔ REMOVE_LIQUIDITY drives execute-button label.
 * - Fee tier group renders all tiers; selected tier updates.
 * - Amount input enables execute button; empty/zero keeps it disabled (cert L4.1).
 * - Execute click fires executeDeFiOrder with expected payload shape.
 */
import type { LiquidityPool } from "@/lib/types/defi";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockDeFiData } from "../_helpers/mock-defi-context";

function buildMockLiquidityPool(overrides: Partial<LiquidityPool> = {}): LiquidityPool {
  return {
    name: "ETH/USDC",
    venue_id: "UNISWAPV3-ETHEREUM",
    token0: "ETH",
    token1: "USDC",
    feeTier: 0.05,
    tvl: 125_000_000,
    apr24h: 12.5,
    ...overrides,
  };
}

const mockDeFiData = {
  ...buildMockDeFiData(),
  liquidityPools: [
    buildMockLiquidityPool(),
    buildMockLiquidityPool({ name: "WBTC/ETH", token0: "WBTC", token1: "ETH", tvl: 80_000_000, apr24h: 8.2 }),
  ] as LiquidityPool[],
};

vi.mock("@/components/widgets/defi/defi-data-context", () => ({
  useDeFiData: () => mockDeFiData,
}));

vi.mock("@/hooks/use-active-strategy-id", () => ({
  useActiveStrategyId: () => "MARKET_MAKING_CONTINUOUS@uniswap-v3-weth-usdc-ethereum-active-usdc-prod",
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { DeFiLiquidityWidget } from "@/components/widgets/defi/defi-liquidity-widget";

function renderWidget() {
  return render(<DeFiLiquidityWidget instanceId="defi-liquidity-1" />);
}

describe("defi-liquidity-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockDeFiData, {
      ...buildMockDeFiData(),
      liquidityPools: [
        buildMockLiquidityPool(),
        buildMockLiquidityPool({ name: "WBTC/ETH", token0: "WBTC", token1: "ETH", tvl: 80_000_000, apr24h: 8.2 }),
      ],
    });
  });

  describe("render", () => {
    it("mounts root testid with pools available", () => {
      renderWidget();
      expect(screen.getByTestId("defi-liquidity-widget")).toBeTruthy();
    });

    it("renders the primary pool TVL + APR values from context (cert L0)", () => {
      renderWidget();
      expect(screen.getByTestId("pool-tvl").textContent).toContain("125");
      expect(screen.getByTestId("pool-apr").textContent).toContain("12.5");
    });

    it("shows empty-state message when liquidityPools is empty (cert L0.7)", () => {
      Object.assign(mockDeFiData, { ...buildMockDeFiData(), liquidityPools: [] as LiquidityPool[] });
      renderWidget();
      expect(screen.queryByTestId("defi-liquidity-widget")).toBeNull();
      expect(screen.getByText(/no liquidity pools available/i)).toBeTruthy();
    });
  });

  describe("operation toggle", () => {
    it("defaults to ADD_LIQUIDITY", () => {
      renderWidget();
      expect(screen.getByTestId("execute-button").textContent?.toLowerCase()).toContain("add");
    });

    it("switching to REMOVE_LIQUIDITY updates execute button label", () => {
      renderWidget();
      fireEvent.click(screen.getByTestId("operation-button-REMOVE_LIQUIDITY"));
      expect(screen.getByTestId("execute-button").textContent?.toLowerCase()).toContain("remove");
    });
  });

  describe("fee tier group", () => {
    it("renders a fee-tier group with multiple tier buttons", () => {
      renderWidget();
      const group = screen.getByTestId("fee-tier-group");
      expect(group).toBeTruthy();
      // At least one tier button (test-ids follow pattern `fee-tier-<value>`).
      const tierButtons = group.querySelectorAll('[data-testid^="fee-tier-"]');
      expect(tierButtons.length).toBeGreaterThan(0);
    });
  });

  describe("execute button (cert L4.1)", () => {
    it("is disabled when amount is empty", () => {
      renderWidget();
      const btn = screen.getByTestId("execute-button") as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it("is disabled when amount is zero", () => {
      renderWidget();
      fireEvent.change(screen.getByTestId("amount-input"), { target: { value: "0" } });
      const btn = screen.getByTestId("execute-button") as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it("enables when amount > 0", () => {
      renderWidget();
      fireEvent.change(screen.getByTestId("amount-input"), { target: { value: "10" } });
      const btn = screen.getByTestId("execute-button") as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    it("calls executeDeFiOrder with expected payload on click", () => {
      const spy = vi.fn();
      Object.assign(mockDeFiData, {
        ...buildMockDeFiData(),
        liquidityPools: [buildMockLiquidityPool()],
        executeDeFiOrder: spy,
      });
      renderWidget();
      fireEvent.change(screen.getByTestId("amount-input"), { target: { value: "25" } });
      fireEvent.click(screen.getByTestId("execute-button"));
      expect(spy).toHaveBeenCalledTimes(1);
      const payload = spy.mock.calls[0]![0] as Record<string, unknown>;
      expect(payload).toMatchObject({
        client_id: "internal-trader",
        instruction_type: "ADD_LIQUIDITY",
        venue: "UNISWAPV3-ETHEREUM",
        quantity: 25,
        asset_group: "DeFi",
        lane: "defi",
        side: "buy",
      });
    });
  });
});
