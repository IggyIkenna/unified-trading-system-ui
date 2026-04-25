/**
 * L1.5 widget harness — defi-flash-loans-widget.
 *
 * Pattern reference:
 *   tests/widgets/defi/defi-lending-widget.test.tsx (pilot)
 *   codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   plans/ai/ui_widget_test_rollout_2026_04_24.plan.md (Phase 3 Wave 2 DeFi)
 *
 * Scope:
 * - Render with mocked DeFiData; root testid mounts.
 * - Empty-steps branch: "No steps added" copy and execute button disabled.
 * - addFlashStep / removeFlashStep delegate to context.
 * - P&L preview reflects flashPnl fields.
 * - Execute button calls executeDeFiOrder with FLASH_BORROW payload + is_atomic=true.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockDeFiData } from "../_helpers/mock-defi-context";

interface MockFlashStep {
  id: string;
  operationType: string;
  algo_type: string;
  asset: string;
  amount: string;
  venue: string;
  max_slippage_bps: number;
}

function buildMockFlashStep(overrides: Partial<MockFlashStep> = {}): MockFlashStep {
  return {
    id: "step-1",
    operationType: "SWAP",
    algo_type: "SOR_DEX",
    asset: "ETH",
    amount: "100",
    venue: "UNISWAPV3-ETHEREUM",
    max_slippage_bps: 50,
    ...overrides,
  };
}

const mockDeFiData: ReturnType<typeof buildBaseMock> = buildBaseMock();

function buildBaseMock() {
  return {
    ...buildMockDeFiData(),
    swapTokens: ["ETH", "USDC", "USDT", "WBTC"] as readonly string[],
    flashSteps: [
      buildMockFlashStep({ id: "step-1" }),
      buildMockFlashStep({ id: "step-2", asset: "USDC", amount: "345600" }),
    ],
    addFlashStep: vi.fn(),
    removeFlashStep: vi.fn(),
    updateFlashStep: vi.fn(),
    flashPnl: {
      grossProfit: 1_250.5,
      flashFee: 27.5,
      gasEstimate: 45.0,
      netPnl: 1_178.0,
    },
  };
}

vi.mock("@/components/widgets/defi/defi-data-context", () => ({
  useDeFiData: () => mockDeFiData,
}));

vi.mock("@/hooks/use-active-strategy-id", () => ({
  useActiveStrategyId: () => "ARBITRAGE_PRICE_DISPERSION@uniswap-flashloan-eth-usdc-ethereum-prod",
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { DeFiFlashLoansWidget } from "@/components/widgets/defi/defi-flash-loans-widget";

describe("defi-flash-loans-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockDeFiData, buildBaseMock());
  });

  describe("render", () => {
    it("mounts root testid", () => {
      render(<DeFiFlashLoansWidget />);
      expect(screen.getByTestId("defi-flash-loans-widget")).toBeTruthy();
    });

    it("renders flash borrow + flash repay collapsible section triggers", () => {
      render(<DeFiFlashLoansWidget />);
      // Sections default to closed; their trigger titles are always visible.
      expect(screen.getByText(/flash borrow \(auto\)/i)).toBeTruthy();
      expect(screen.getByText(/flash repay \(auto\)/i)).toBeTruthy();
    });

    it("shows no-steps copy when flashSteps is empty", () => {
      Object.assign(mockDeFiData, { ...buildBaseMock(), flashSteps: [] });
      render(<DeFiFlashLoansWidget />);
      expect(screen.getByText(/no steps added/i)).toBeTruthy();
    });
  });

  describe("P&L preview", () => {
    it("displays gross profit, flash fee, gas estimate and net P&L from flashPnl", () => {
      render(<DeFiFlashLoansWidget />);
      // Values from buildBaseMock: gross 1,250.50 / fee 27.50 / gas 45.00 / net 1,178.00
      expect(screen.getByText(/\$1,250\.50/)).toBeTruthy();
      expect(screen.getByText(/\$27\.50/)).toBeTruthy();
      expect(screen.getByText(/\$45\.00/)).toBeTruthy();
      expect(screen.getByText(/\$1,178\.00/)).toBeTruthy();
    });
  });

  describe("step management", () => {
    it("calls addFlashStep when 'Add step' clicked", () => {
      const addFlashStep = vi.fn();
      Object.assign(mockDeFiData, { ...buildBaseMock(), addFlashStep });
      render(<DeFiFlashLoansWidget />);
      fireEvent.click(screen.getByRole("button", { name: /add step/i }));
      expect(addFlashStep).toHaveBeenCalledTimes(1);
    });
  });

  describe("execute bundle", () => {
    it("disables execute when flashSteps is empty", () => {
      Object.assign(mockDeFiData, { ...buildBaseMock(), flashSteps: [] });
      render(<DeFiFlashLoansWidget />);
      const btn = screen.getByRole("button", { name: /execute bundle/i }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it("enables execute when at least one step is present", () => {
      render(<DeFiFlashLoansWidget />);
      const btn = screen.getByRole("button", { name: /execute bundle/i }) as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    it("calls executeDeFiOrder with FLASH_BORROW payload (is_atomic=true)", () => {
      const spy = vi.fn();
      Object.assign(mockDeFiData, { ...buildBaseMock(), executeDeFiOrder: spy });
      render(<DeFiFlashLoansWidget />);
      fireEvent.click(screen.getByRole("button", { name: /execute bundle/i }));
      expect(spy).toHaveBeenCalledTimes(1);
      const payload = spy.mock.calls[0]![0] as Record<string, unknown>;
      expect(payload).toMatchObject({
        client_id: "internal-trader",
        instruction_type: "FLASH_BORROW",
        algo_type: "FLASH_LOAN_AAVE",
        venue: "AAVEV3-ETHEREUM",
        asset_group: "DeFi",
        lane: "defi",
        is_atomic: true,
      });
      expect(String(payload.instrument_id)).toMatch(/^FLASH_LOAN:/);
    });
  });
});
