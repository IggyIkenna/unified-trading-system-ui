/**
 * L1.5 widget harness — defi-swap-widget.
 *
 * Pattern reference:
 *   tests/widgets/defi/defi-lending-widget.test.tsx (pilot)
 *   codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   plans/ai/ui_widget_test_rollout_2026_04_24.plan.md (Phase 3 Wave 2 DeFi)
 *
 * Scope:
 * - Render with mocked DeFiData context; assert root testid mounts.
 * - Loading branch when swapTokens is empty (Skeleton, no testid).
 * - Input interactions: amountIn, slippage options, chain select.
 * - Reactive output: expected-output updates from generateSwapRoute.
 * - Gas-insufficient branch when selected chain portfolio gasTokenBalance < threshold.
 * - Execute button enable/disable + executeDeFiOrder payload shape.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildMockDeFiData } from "../_helpers/mock-defi-context";

interface MockSwapRoute {
  path: string[];
  pools: string[];
  priceImpactPct: number;
  expectedOutput: number;
  gasEstimateEth: number;
  gasEstimateUsd: number;
  algo_type: string;
  venue_fills: MockVenueFill[];
  reference_price: number;
}

interface MockVenueFill {
  venue: string;
  venue_display: string;
  allocation_pct: number;
  input_amount: number;
  fill_price: number;
  fill_qty: number;
  price_impact_bps: number;
  gas_usd: number;
  fee_bps: number;
}

function buildMockVenueFill(overrides: Partial<MockVenueFill> = {}): MockVenueFill {
  return {
    venue: "UNISWAPV3-ETHEREUM",
    venue_display: "Uniswap V3",
    allocation_pct: 100,
    input_amount: 1,
    fill_price: 2500,
    fill_qty: 1,
    price_impact_bps: 1.5,
    gas_usd: 9,
    fee_bps: 30,
    ...overrides,
  };
}

function buildMockSwapRoute(overrides: Partial<MockSwapRoute> = {}): MockSwapRoute {
  return {
    path: ["USDT", "ETH"],
    pools: ["UNISWAPV3-ETHEREUM"],
    priceImpactPct: 0.001,
    expectedOutput: 1.2345,
    gasEstimateEth: 0.003,
    gasEstimateUsd: 9.0,
    algo_type: "SOR_DEX",
    venue_fills: [buildMockVenueFill()],
    reference_price: 2500,
    ...overrides,
  };
}

const generateSwapRouteMock = vi.fn((tokenIn: string, tokenOut: string, amountIn: number) =>
  buildMockSwapRoute({
    path: [tokenIn, tokenOut],
    expectedOutput: amountIn * 2500,
    venue_fills: [buildMockVenueFill({ input_amount: amountIn, fill_qty: amountIn * 2500 })],
  }),
);

const mockDeFiData: ReturnType<typeof buildBaseMock> = buildBaseMock();

function buildBaseMock() {
  return {
    ...buildMockDeFiData(),
    swapTokens: ["USDT", "ETH", "USDC", "WBTC", "weETH"] as readonly string[],
    selectedChain: "ETHEREUM",
    setSelectedChain: vi.fn(),
    chainPortfolios: [
      {
        chain: "ETHEREUM",
        totalUsd: 100_000,
        tokenBreakdown: {},
        gasTokenBalance: 1.0,
        gasTokenSymbol: "ETH",
      },
    ],
    generateSwapRoute: generateSwapRouteMock,
    getMockPrice: vi.fn((_token: string) => 2500),
    calculateBasisTradeFundingImpact: vi.fn((_asset: string) => 12),
    calculateBasisTradeCostOfCarry: vi.fn((_capital: number, _asset: string) => 3),
  };
}

vi.mock("@/components/widgets/defi/defi-data-context", () => ({
  useDeFiData: () => mockDeFiData,
}));

vi.mock("@/hooks/use-active-strategy-id", () => ({
  useActiveStrategyId: () => "YIELD_ROTATION_LENDING@aave-multichain-usdc-prod",
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { DeFiSwapWidget } from "@/components/widgets/defi/defi-swap-widget";

describe("defi-swap-widget — L1.5 harness", () => {
  beforeEach(() => {
    generateSwapRouteMock.mockClear();
    Object.assign(mockDeFiData, buildBaseMock());
  });

  describe("render", () => {
    it("mounts root testid when swapTokens are available", () => {
      render(<DeFiSwapWidget />);
      expect(screen.getByTestId("defi-swap-widget")).toBeTruthy();
    });

    it("shows loading Skeleton branch when swapTokens is empty (cert L0.6)", () => {
      Object.assign(mockDeFiData, { ...buildBaseMock(), swapTokens: [] as readonly string[] });
      render(<DeFiSwapWidget />);
      expect(screen.queryByTestId("defi-swap-widget")).toBeNull();
    });

    it("renders default expected-output placeholder when amount empty", () => {
      render(<DeFiSwapWidget />);
      expect(screen.getByTestId("expected-output").textContent).toContain("0.00");
    });
  });

  describe("amount input + reactive output", () => {
    it("updates expected-output via generateSwapRoute when amount > 0", () => {
      render(<DeFiSwapWidget />);
      fireEvent.change(screen.getByTestId("capital-input"), { target: { value: "2" } });
      // Our mock returns amountIn * 2500 → expectedOutput 5000 → formatted "5,000.00"
      expect(screen.getByTestId("expected-output").textContent).toContain("5,000.00");
      expect(generateSwapRouteMock).toHaveBeenCalled();
    });

    it("does not call generateSwapRoute when amount is zero", () => {
      render(<DeFiSwapWidget />);
      expect(generateSwapRouteMock).not.toHaveBeenCalled();
    });
  });

  describe("slippage options", () => {
    it("renders the three slippage option buttons", () => {
      render(<DeFiSwapWidget />);
      expect(screen.getByTestId("slippage-option-0.1")).toBeTruthy();
      expect(screen.getByTestId("slippage-option-0.5")).toBeTruthy();
      expect(screen.getByTestId("slippage-option-1")).toBeTruthy();
    });

    it("does not crash when a different slippage is selected", () => {
      render(<DeFiSwapWidget />);
      fireEvent.click(screen.getByTestId("slippage-option-1"));
      // No assertion on visual-only state; just ensure interaction is safe
      expect(screen.getByTestId("defi-swap-widget")).toBeTruthy();
    });
  });

  describe("gas insufficiency branch", () => {
    it("shows low-gas warning when selected chain's gasTokenBalance is below threshold", () => {
      Object.assign(mockDeFiData, {
        ...buildBaseMock(),
        chainPortfolios: [
          {
            chain: "ETHEREUM",
            totalUsd: 0,
            tokenBreakdown: {},
            gasTokenBalance: 0.001,
            gasTokenSymbol: "ETH",
          },
        ],
      });
      render(<DeFiSwapWidget />);
      expect(screen.getByText(/low eth balance/i)).toBeTruthy();
    });
  });

  describe("execute button", () => {
    it("is disabled when amount is empty", () => {
      render(<DeFiSwapWidget />);
      const btn = screen.getByTestId("execute-button") as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it("enables when amount > 0", () => {
      render(<DeFiSwapWidget />);
      fireEvent.change(screen.getByTestId("capital-input"), { target: { value: "1" } });
      const btn = screen.getByTestId("execute-button") as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    it("calls executeDeFiOrder with expected payload shape on click", () => {
      const spy = vi.fn();
      Object.assign(mockDeFiData, { ...buildBaseMock(), executeDeFiOrder: spy });
      render(<DeFiSwapWidget />);
      fireEvent.change(screen.getByTestId("capital-input"), { target: { value: "3" } });
      fireEvent.click(screen.getByTestId("execute-button"));
      expect(spy).toHaveBeenCalledTimes(1);
      const payload = spy.mock.calls[0]![0] as Record<string, unknown>;
      expect(payload).toMatchObject({
        client_id: "internal-trader",
        instruction_type: "SWAP",
        quantity: 3,
        asset_class: "DeFi",
        lane: "defi",
        order_type: "market",
        side: "buy",
      });
      expect(String(payload.instrument_id)).toMatch(/^SWAP:/);
    });
  });
});
