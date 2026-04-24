/**
 * L1.5 widget harness — defi-reward-pnl-widget.
 *
 * Pattern reference:
 *   tests/widgets/defi/defi-lending-widget.test.tsx
 *   codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   plans/ai/ui_widget_test_rollout_2026_04_24.plan.md (Phase 3 Wave 2 DeFi)
 *
 * Scope (per cert docs/manifest/widget-certification/defi-reward-pnl.json):
 * - Render + root testid mount with factors present.
 * - Error guard when rewardPnl is null (cert L0.8).
 * - Loading guard when rewardPnl is empty list (cert L0.6).
 * - Empty state when all factors have amount=0 (cert L0.7).
 * - Waterfall bars render one entry per factor with label + formatted amount.
 * - Total reward sum displayed in header.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { RewardPnLBreakdown } from "@/lib/types/defi";
import { buildMockDeFiData } from "../_helpers/mock-defi-context";

const DEFAULT_REWARD_PNL: RewardPnLBreakdown = [
  { key: "staking_yield", label: "Staking Yield", amount: 1200 },
  { key: "restaking_reward", label: "Restaking Reward", amount: 450 },
  { key: "fees", label: "Fees", amount: -75 },
];

const mockDeFiData = {
  ...buildMockDeFiData(),
  rewardPnl: [...DEFAULT_REWARD_PNL],
};

vi.mock("@/components/widgets/defi/defi-data-context", () => ({
  useDeFiData: () => mockDeFiData,
}));

import { DeFiRewardPnlWidget } from "@/components/widgets/defi/defi-reward-pnl-widget";

function renderWidget() {
  return render(<DeFiRewardPnlWidget instanceId="defi-reward-pnl-1" />);
}

describe("defi-reward-pnl-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockDeFiData, {
      ...buildMockDeFiData(),
      rewardPnl: [...DEFAULT_REWARD_PNL],
    });
  });

  describe("render", () => {
    it("mounts root testid with factors present", () => {
      renderWidget();
      expect(screen.getByTestId("defi-reward-pnl-widget")).toBeTruthy();
    });

    it("renders a label per reward factor (cert L0)", () => {
      renderWidget();
      expect(screen.getByText("Staking Yield")).toBeTruthy();
      expect(screen.getByText("Restaking Reward")).toBeTruthy();
      expect(screen.getByText("Fees")).toBeTruthy();
    });

    it("displays the total reward P&L header", () => {
      renderWidget();
      expect(screen.getByText(/total reward/i)).toBeTruthy();
    });
  });

  describe("guards", () => {
    it("shows error guard when rewardPnl is null (cert L0.8)", () => {
      Object.assign(mockDeFiData, { ...buildMockDeFiData(), rewardPnl: null });
      renderWidget();
      expect(screen.getByText(/failed to load reward p&l/i)).toBeTruthy();
    });

    it("shows loading guard when rewardPnl is empty list (cert L0.6)", () => {
      Object.assign(mockDeFiData, { ...buildMockDeFiData(), rewardPnl: [] as RewardPnLBreakdown });
      renderWidget();
      expect(screen.getByText(/loading reward data/i)).toBeTruthy();
    });

    it("shows empty state when all factor amounts are zero (cert L0.7)", () => {
      Object.assign(mockDeFiData, {
        ...buildMockDeFiData(),
        rewardPnl: [
          { key: "staking_yield", label: "Staking Yield", amount: 0 },
          { key: "fees", label: "Fees", amount: 0 },
        ] as RewardPnLBreakdown,
      });
      renderWidget();
      expect(screen.getByText(/no reward p&l to display/i)).toBeTruthy();
    });
  });

  describe("waterfall bars", () => {
    it("renders positive + negative factor formatting", () => {
      renderWidget();
      // Positive factors show "+$<amount>"; negative show "-$<amount>".
      // Use regex to tolerate locale formatting.
      expect(screen.getByText(/\+\$1,?200/)).toBeTruthy();
      expect(screen.getByText(/-\$75/)).toBeTruthy();
    });
  });
});
