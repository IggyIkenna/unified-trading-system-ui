/**
 * L1.5 widget harness — defi-staking-rewards-widget.
 *
 * Pattern reference:
 *   tests/widgets/defi/defi-lending-widget.test.tsx
 *   codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   plans/ai/ui_widget_test_rollout_2026_04_24.plan.md (Phase 3 Wave 2 DeFi — metrics)
 *
 * Scope:
 * - Summary strip: Accrued/Claimed/Sold totals from stakingRewards reduction.
 * - Per-token reward card renders token + frequency badge.
 * - Empty branch: stakingRewards is [] (cert L0.7).
 * - Error branch: stakingRewards is null / rewardPnl is null (cert L0.8).
 * - Claim button wired to claimReward(token).
 * - Claim & Sell button wired to claimAndSellReward(token).
 * - Buttons hidden when accrued_amount === 0.
 * - Reward P&L section sums rewardPnl amounts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildMockDeFiData } from "../_helpers/mock-defi-context";
import type { StakingReward, RewardPnLBreakdown } from "@/lib/types/defi";

function buildMockStakingReward(overrides: Partial<StakingReward> = {}): StakingReward {
  return {
    token: "stETH",
    accrued_amount: 1.25,
    accrued_value_usd: 3125,
    claimed_amount: 0,
    sold_amount: 0,
    sold_value_usd: 0,
    next_payout: "2099-01-01T00:00:00Z",
    frequency: "WEEKLY",
    ...overrides,
  };
}

const DEFAULT_REWARDS: StakingReward[] = [buildMockStakingReward()];
const DEFAULT_PNL: RewardPnLBreakdown = [
  { key: "staking_yield", label: "Staking yield", amount: 1200 },
  { key: "restaking_reward", label: "Restaking reward", amount: 300 },
];

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockDeFiData = {
  ...buildMockDeFiData(),
  stakingRewards: DEFAULT_REWARDS as StakingReward[] | null,
  claimReward: vi.fn(),
  claimAndSellReward: vi.fn(),
  rewardPnl: DEFAULT_PNL as RewardPnLBreakdown | null,
};

vi.mock("@/components/widgets/defi/defi-data-context", () => ({
  useDeFiData: () => mockDeFiData,
}));

import { DeFiStakingRewardsWidget } from "@/components/widgets/defi/defi-staking-rewards-widget";

describe("defi-staking-rewards — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockDeFiData, {
      ...buildMockDeFiData(),
      stakingRewards: [buildMockStakingReward()],
      claimReward: vi.fn(),
      claimAndSellReward: vi.fn(),
      rewardPnl: DEFAULT_PNL.map((x) => ({ ...x })),
    });
  });

  describe("render", () => {
    it("mounts root testid with rewards data present", () => {
      render(<DeFiStakingRewardsWidget instanceId="test-staking-rewards" />);
      expect(screen.getByTestId("defi-staking-rewards-widget")).toBeTruthy();
    });

    it("renders the per-token reward card (stETH Rewards + WEEKLY badge)", () => {
      render(<DeFiStakingRewardsWidget instanceId="test-staking-rewards" />);
      expect(screen.getByText(/stETH Rewards/)).toBeTruthy();
      expect(screen.getByText("WEEKLY")).toBeTruthy();
    });

    it("renders summary strip totals (accrued $3,125.00 from the fixture)", () => {
      render(<DeFiStakingRewardsWidget instanceId="test-staking-rewards" />);
      // "Accrued" appears twice (summary strip + per-card row) — getAll.
      expect(screen.getAllByText("Accrued").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("$3,125.00")).toBeTruthy();
    });
  });

  describe("empty + error branches", () => {
    it("renders empty copy when stakingRewards is []", () => {
      Object.assign(mockDeFiData, {
        ...buildMockDeFiData(),
        stakingRewards: [],
        rewardPnl: DEFAULT_PNL,
      });
      render(<DeFiStakingRewardsWidget instanceId="test-staking-rewards" />);
      expect(screen.getByText(/no staking rewards available/i)).toBeTruthy();
    });

    it("renders failure copy when rewardPnl is null", () => {
      Object.assign(mockDeFiData, {
        ...buildMockDeFiData(),
        stakingRewards: [buildMockStakingReward()],
        rewardPnl: null,
      });
      render(<DeFiStakingRewardsWidget instanceId="test-staking-rewards" />);
      expect(screen.getByText(/failed to load staking rewards data/i)).toBeTruthy();
    });
  });

  describe("claim actions", () => {
    it("calls claimReward(token) on Claim click", () => {
      const claimReward = vi.fn();
      Object.assign(mockDeFiData, {
        ...buildMockDeFiData(),
        stakingRewards: [buildMockStakingReward()],
        claimReward,
        claimAndSellReward: vi.fn(),
        rewardPnl: DEFAULT_PNL.map((x) => ({ ...x })),
      });
      render(<DeFiStakingRewardsWidget instanceId="test-staking-rewards" />);
      fireEvent.click(screen.getByRole("button", { name: /^Claim$/i }));
      expect(claimReward).toHaveBeenCalledWith("stETH");
    });

    it("calls claimAndSellReward(token) on Claim & Sell click", () => {
      const claimAndSellReward = vi.fn();
      Object.assign(mockDeFiData, {
        ...buildMockDeFiData(),
        stakingRewards: [buildMockStakingReward()],
        claimReward: vi.fn(),
        claimAndSellReward,
        rewardPnl: DEFAULT_PNL.map((x) => ({ ...x })),
      });
      render(<DeFiStakingRewardsWidget instanceId="test-staking-rewards" />);
      fireEvent.click(screen.getByRole("button", { name: /Claim & Sell/i }));
      expect(claimAndSellReward).toHaveBeenCalledWith("stETH");
    });

    it("hides Claim buttons when accrued_amount is 0", () => {
      Object.assign(mockDeFiData, {
        ...buildMockDeFiData(),
        stakingRewards: [buildMockStakingReward({ accrued_amount: 0, accrued_value_usd: 0 })],
        claimReward: vi.fn(),
        claimAndSellReward: vi.fn(),
        rewardPnl: DEFAULT_PNL.map((x) => ({ ...x })),
      });
      render(<DeFiStakingRewardsWidget instanceId="test-staking-rewards" />);
      expect(screen.queryByRole("button", { name: /^Claim$/i })).toBeNull();
      expect(screen.queryByRole("button", { name: /Claim & Sell/i })).toBeNull();
    });
  });

  describe("reward P&L attribution", () => {
    it("renders factor labels from rewardPnl", () => {
      render(<DeFiStakingRewardsWidget instanceId="test-staking-rewards" />);
      expect(screen.getByText("Staking yield")).toBeTruthy();
      expect(screen.getByText("Restaking reward")).toBeTruthy();
    });

    it("renders Total Reward P&L sum (+$1,500 from 1200 + 300)", () => {
      render(<DeFiStakingRewardsWidget instanceId="test-staking-rewards" />);
      expect(screen.getByText(/total reward p&l/i)).toBeTruthy();
      expect(screen.getByText("+$1,500")).toBeTruthy();
    });
  });
});
