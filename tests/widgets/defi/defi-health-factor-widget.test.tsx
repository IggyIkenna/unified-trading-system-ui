/**
 * L1.5 widget harness — defi-health-factor-widget.
 *
 * Pattern reference:
 *   tests/widgets/defi/defi-lending-widget.test.tsx
 *   codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   plans/ai/ui_widget_test_rollout_2026_04_24.plan.md (Phase 3 Wave 2 DeFi — metrics)
 *
 * Scope:
 * - Render root testid; HF number + status badge ("Healthy"/"Warning"/"Critical").
 * - Collateral oracle/market rate labels pull from `collateral_token`.
 * - Healthy / Warning / Critical badge transitions driven by `current_hf`.
 * - Spread block renders staking/borrow/net/leverage/leveraged_spread.
 * - Monitoring-interval string rendered from hf.monitoring_interval.
 * - Emergency-exit dialog opens, shows cost breakdown + numbered steps.
 * - Confirm Exit in batch mode triggers toast.info guard (cert L3.2 fix).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildMockDeFiData } from "../_helpers/mock-defi-context";
import type { HealthFactorDashboard, EmergencyExitEstimate } from "@/lib/types/defi";

function buildMockHealthFactor(overrides: Partial<HealthFactorDashboard> = {}): HealthFactorDashboard {
  return {
    current_hf: 1.8,
    liquidation_at: 1.0,
    warning_at: 1.3,
    buffer_pct: 0.45,
    collateral_token: "weETH",
    collateral_oracle_rate: 1.0512,
    collateral_market_rate: 1.0498,
    oracle_market_gap_pct: 0.0013,
    borrow_rate_pct: 3.2,
    staking_rate_pct: 4.5,
    net_spread_pct: 1.3,
    leverage: 4.0,
    leveraged_spread_pct: 5.2,
    monitoring_interval: "10s",
    emergency_exit_description: "unwind the recursive staking position",
    ...overrides,
  };
}

function buildMockEmergencyExit(overrides: Partial<EmergencyExitEstimate> = {}): EmergencyExitEstimate {
  return {
    estimated_gas_usd: 120,
    estimated_slippage_usd: 450,
    estimated_exchange_fees_usd: 80,
    total_cost_usd: 650,
    total_as_pct_of_nav: 0.012,
    estimated_time_minutes: 5,
    steps: ["Unwind leg 1", "Repay borrow", "Withdraw collateral"],
    ...overrides,
  };
}

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
import { toast } from "sonner";
const toastMock = toast as unknown as {
  success: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
};

const mockScope = {
  scope: {
    organizationIds: [] as string[],
    clientIds: [] as string[],
    strategyIds: [] as string[],
    assetGroupIds: [] as string[],
    strategyFamilyIdsV2: [] as string[],
    strategyArchetypeIds: [] as string[],
    underlyingIds: [] as string[],
    mode: "live" as "live" | "batch",
  },
};

vi.mock("@/lib/stores/global-scope-store", () => ({
  useGlobalScope: () => mockScope,
}));

const mockDeFiData = {
  ...buildMockDeFiData(),
  healthFactorDashboard: buildMockHealthFactor(),
  emergencyExit: buildMockEmergencyExit(),
};

vi.mock("@/components/widgets/defi/defi-data-context", () => ({
  useDeFiData: () => mockDeFiData,
}));

import { DeFiHealthFactorWidget } from "@/components/widgets/defi/defi-health-factor-widget";

describe("defi-health-factor — L1.5 harness", () => {
  beforeEach(() => {
    toastMock.success.mockClear();
    toastMock.info.mockClear();
    mockScope.scope.mode = "live";
    Object.assign(mockDeFiData, {
      ...buildMockDeFiData(),
      healthFactorDashboard: buildMockHealthFactor(),
      emergencyExit: buildMockEmergencyExit(),
    });
  });

  describe("render", () => {
    it("mounts root testid", () => {
      render(<DeFiHealthFactorWidget instanceId="test-hf" />);
      expect(screen.getByTestId("defi-health-factor-widget")).toBeTruthy();
    });

    it("renders current HF number formatted to 2 dp (1.80)", () => {
      render(<DeFiHealthFactorWidget instanceId="test-hf" />);
      expect(screen.getByText("1.80")).toBeTruthy();
    });

    it("renders Healthy badge when current_hf >= 1.5", () => {
      render(<DeFiHealthFactorWidget instanceId="test-hf" />);
      expect(screen.getByText("Healthy")).toBeTruthy();
    });

    it("renders Warning badge when 1.3 <= current_hf < 1.5", () => {
      Object.assign(mockDeFiData, {
        ...buildMockDeFiData(),
        healthFactorDashboard: buildMockHealthFactor({ current_hf: 1.35 }),
        emergencyExit: buildMockEmergencyExit(),
      });
      render(<DeFiHealthFactorWidget instanceId="test-hf" />);
      expect(screen.getByText("Warning")).toBeTruthy();
    });

    it("renders Critical badge when current_hf < 1.3", () => {
      Object.assign(mockDeFiData, {
        ...buildMockDeFiData(),
        healthFactorDashboard: buildMockHealthFactor({ current_hf: 1.1 }),
        emergencyExit: buildMockEmergencyExit(),
      });
      render(<DeFiHealthFactorWidget instanceId="test-hf" />);
      expect(screen.getByText("Critical")).toBeTruthy();
    });
  });

  describe("metrics panels", () => {
    it("renders collateral oracle + market rows using the collateral_token label", () => {
      render(<DeFiHealthFactorWidget instanceId="test-hf" />);
      expect(screen.getByText("weETH oracle rate")).toBeTruthy();
      expect(screen.getByText("weETH market rate")).toBeTruthy();
    });

    it("renders leveraged spread block labels + leverage value", () => {
      render(<DeFiHealthFactorWidget instanceId="test-hf" />);
      expect(screen.getByText(/rate spread \(leveraged\)/i)).toBeTruthy();
      expect(screen.getByText("4.0x")).toBeTruthy();
    });

    it("renders monitoring-interval copy from hf.monitoring_interval", () => {
      render(<DeFiHealthFactorWidget instanceId="test-hf" />);
      expect(screen.getByText(/monitoring: every 10s/i)).toBeTruthy();
    });
  });

  describe("emergency exit dialog", () => {
    it("opens dialog on Emergency Exit click + renders total cost $650", () => {
      render(<DeFiHealthFactorWidget instanceId="test-hf" />);
      fireEvent.click(screen.getByRole("button", { name: /emergency exit/i }));
      expect(screen.getByText(/emergency exit estimate/i)).toBeTruthy();
      expect(screen.getByText("$650")).toBeTruthy();
    });

    it("renders all unwind steps from emergencyExit.steps", () => {
      render(<DeFiHealthFactorWidget instanceId="test-hf" />);
      fireEvent.click(screen.getByRole("button", { name: /emergency exit/i }));
      expect(screen.getByText("Unwind leg 1")).toBeTruthy();
      expect(screen.getByText("Repay borrow")).toBeTruthy();
      expect(screen.getByText("Withdraw collateral")).toBeTruthy();
    });

    it("Confirm Exit in live mode calls toast.success with cost summary", () => {
      mockScope.scope.mode = "live";
      render(<DeFiHealthFactorWidget instanceId="test-hf" />);
      fireEvent.click(screen.getByRole("button", { name: /emergency exit/i }));
      fireEvent.click(screen.getByRole("button", { name: /confirm exit/i }));
      expect(toastMock.success).toHaveBeenCalledTimes(1);
      const call = toastMock.success.mock.calls[0];
      expect(call?.[0]).toMatch(/emergency exit initiated/i);
    });

    it("Confirm Exit in batch mode guards with toast.info + does NOT call toast.success", () => {
      mockScope.scope.mode = "batch";
      render(<DeFiHealthFactorWidget instanceId="test-hf" />);
      fireEvent.click(screen.getByRole("button", { name: /emergency exit/i }));
      fireEvent.click(screen.getByRole("button", { name: /confirm exit/i }));
      expect(toastMock.info).toHaveBeenCalledTimes(1);
      expect(toastMock.success).not.toHaveBeenCalled();
    });
  });
});
