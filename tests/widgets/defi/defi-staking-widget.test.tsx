/**
 * L1.5 widget harness — defi-staking-widget.
 *
 * Pattern reference:
 *   tests/widgets/defi/defi-lending-widget.test.tsx (pilot)
 *   codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   plans/ai/ui_widget_test_rollout_2026_04_24.md (Phase 3 Wave 2 DeFi)
 *
 * Scope:
 * - Render with mocked DeFiData; root testid mounts.
 * - Empty-protocols branch renders "No staking protocols (mock)." copy.
 * - Operation toggle (STAKE ↔ UNSTAKE) flips the execute button label + side.
 * - Amount input + annual yield reactive output.
 * - Execute button enable/disable + executeDeFiOrder payload shape for STAKE/UNSTAKE.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockDeFiData } from "../_helpers/mock-defi-context";

interface MockStakingProtocol {
  name: string;
  venue_id: string;
  asset: string;
  apy: number;
  tvl: number;
  minStake: number;
  unbondingDays: number;
}

function buildMockStakingProtocol(overrides: Partial<MockStakingProtocol> = {}): MockStakingProtocol {
  return {
    name: "Lido",
    venue_id: "LIDO-ETHEREUM",
    asset: "ETH",
    apy: 3.4,
    tvl: 32_400_000_000,
    minStake: 0,
    unbondingDays: 0,
    ...overrides,
  };
}

const mockDeFiData = buildBaseMock();

function buildBaseMock() {
  return {
    ...buildMockDeFiData(),
    stakingProtocols: [buildMockStakingProtocol()] as MockStakingProtocol[],
    tokenBalances: { ETH: 10, WETH: 8, USDC: 50_000 } as Record<string, number>,
  };
}

vi.mock("@/components/widgets/defi/defi-data-context", () => ({
  useDeFiData: () => mockDeFiData,
}));

vi.mock("@/hooks/use-active-strategy-id", () => ({
  useActiveStrategyId: () => "YIELD_STAKING_SIMPLE@lido-steth-ethereum-eth-prod",
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { DeFiStakingWidget } from "@/components/widgets/defi/defi-staking-widget";

describe("defi-staking-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockDeFiData, buildBaseMock());
  });

  describe("render", () => {
    it("mounts root testid when staking protocols are available", () => {
      render(<DeFiStakingWidget />);
      expect(screen.getByTestId("defi-staking-widget")).toBeTruthy();
    });

    it("shows empty-state copy when stakingProtocols is empty", () => {
      Object.assign(mockDeFiData, { ...buildBaseMock(), stakingProtocols: [] });
      render(<DeFiStakingWidget />);
      expect(screen.queryByTestId("defi-staking-widget")).toBeNull();
      expect(screen.getByText(/no staking protocols/i)).toBeTruthy();
    });

    it("renders expected APY from selected protocol", () => {
      render(<DeFiStakingWidget />);
      // apy=3.4 → formatPercent(3.4, 1) = "3.4%"
      expect(screen.getByTestId("expected-apy").textContent).toContain("3.4");
    });
  });

  describe("operation toggle", () => {
    it("defaults to STAKE", () => {
      render(<DeFiStakingWidget />);
      expect(screen.getByTestId("execute-button").textContent).toContain("STAKE");
    });

    it("flips execute label when switching to UNSTAKE", () => {
      render(<DeFiStakingWidget />);
      fireEvent.click(screen.getByTestId("operation-button-UNSTAKE"));
      expect(screen.getByTestId("execute-button").textContent).toContain("UNSTAKE");
    });
  });

  describe("amount input + reactive annual yield", () => {
    it("shows dash when amount is empty", () => {
      render(<DeFiStakingWidget />);
      // Widget renders ASCII hyphen "-" as the empty-state placeholder.
      expect(screen.getByTestId("expected-yield").textContent).toContain("-");
    });

    it("computes annual yield from amount × apy when amount > 0", () => {
      render(<DeFiStakingWidget />);
      fireEvent.change(screen.getByTestId("amount-input"), { target: { value: "100" } });
      // 100 * (3.4 / 100) = 3.4 ETH
      expect(screen.getByTestId("expected-yield").textContent).toContain("3.4");
      expect(screen.getByTestId("expected-yield").textContent).toContain("ETH");
    });
  });

  describe("execute button", () => {
    it("is disabled when amount is empty", () => {
      render(<DeFiStakingWidget />);
      const btn = screen.getByTestId("execute-button") as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it("enables when amount > 0", () => {
      render(<DeFiStakingWidget />);
      fireEvent.change(screen.getByTestId("amount-input"), { target: { value: "1" } });
      const btn = screen.getByTestId("execute-button") as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    it("calls executeDeFiOrder with STAKE payload + side=buy", () => {
      const spy = vi.fn();
      Object.assign(mockDeFiData, { ...buildBaseMock(), executeDeFiOrder: spy });
      render(<DeFiStakingWidget />);
      fireEvent.change(screen.getByTestId("amount-input"), { target: { value: "2.5" } });
      fireEvent.click(screen.getByTestId("execute-button"));
      expect(spy).toHaveBeenCalledTimes(1);
      const payload = spy.mock.calls[0]![0] as Record<string, unknown>;
      expect(payload).toMatchObject({
        client_id: "internal-trader",
        instruction_type: "STAKE",
        venue: "LIDO-ETHEREUM",
        side: "buy",
        quantity: 2.5,
        asset_group: "DeFi",
        lane: "defi",
      });
    });

    it("flips side to sell when UNSTAKE is selected", () => {
      const spy = vi.fn();
      Object.assign(mockDeFiData, { ...buildBaseMock(), executeDeFiOrder: spy });
      render(<DeFiStakingWidget />);
      fireEvent.click(screen.getByTestId("operation-button-UNSTAKE"));
      fireEvent.change(screen.getByTestId("amount-input"), { target: { value: "1" } });
      fireEvent.click(screen.getByTestId("execute-button"));
      const payload = spy.mock.calls[0]![0] as Record<string, unknown>;
      expect(payload).toMatchObject({
        instruction_type: "UNSTAKE",
        side: "sell",
      });
    });
  });
});
