/**
 * L1.5 widget harness — defi-transfer-widget.
 *
 * Pattern reference:
 *   tests/widgets/defi/defi-lending-widget.test.tsx (pilot)
 *   codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   plans/ai/ui_widget_test_rollout_2026_04_24.plan.md (Phase 3 Wave 2 DeFi)
 *
 * Scope:
 * - Render with mocked DeFiData; root testid mounts.
 * - No-wallet branch: renders "No wallet connected" copy and no testid.
 * - Send-mode inputs: to-address, amount; execute disabled/enabled logic.
 * - Send payload shape (instruction_type=TRANSFER, algo_type=DIRECT, venue=WALLET-*).
 * - Bridge-mode: toggling transfer mode calls setTransferMode; getBridgeRoutes
 *   drives the bridge leg and bridge payload has algo_type=SOR_CROSS_CHAIN.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockDeFiData } from "../_helpers/mock-defi-context";

const mockDeFiData: ReturnType<typeof buildBaseMock> = buildBaseMock();

function buildBaseMock() {
  return {
    ...buildMockDeFiData(),
    connectedWallet: "0x7a23c0ffeebee4f91deadbeef1234567890abcd",
    tokenBalances: { ETH: 10, USDC: 50_000, USDT: 25_000, WETH: 2, WBTC: 0.5, DAI: 1_000 } as Record<string, number>,
    transferMode: "send" as "send" | "bridge",
    setTransferMode: vi.fn(),
    selectedChain: "ETHEREUM",
    setSelectedChain: vi.fn(),
    getBridgeRoutes: vi.fn((token: string, amount: number, _fromChain: string, _toChain: string) =>
      amount > 0
        ? [
          {
            protocol: "Across",
            feePct: 0.05,
            feeUsd: 5,
            estimatedTimeMin: 3,
            outputAmount: amount * 0.9995,
            isBestReturn: true,
            isFastest: true,
          },
          {
            protocol: "Stargate",
            feePct: 0.1,
            feeUsd: 10,
            estimatedTimeMin: 5,
            outputAmount: amount * 0.999,
            isBestReturn: false,
            isFastest: false,
          },
        ]
        : [],
    ),
    chainPortfolios: [
      {
        chain: "ETHEREUM",
        totalUsd: 100_000,
        tokenBreakdown: {},
        gasTokenBalance: 1.0,
        gasTokenSymbol: "ETH",
      },
    ],
    getMockPrice: vi.fn((_token: string) => 2500),
  };
}

vi.mock("@/components/widgets/defi/defi-data-context", () => ({
  useDeFiData: () => mockDeFiData,
}));

vi.mock("@/hooks/use-active-strategy-id", () => ({
  useActiveStrategyId: () => "YIELD_ROTATION_LENDING@aave-multichain-usdc-prod",
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { DeFiTransferWidget } from "@/components/widgets/defi/defi-transfer-widget";

describe("defi-transfer-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockDeFiData, buildBaseMock());
  });

  describe("render", () => {
    it("mounts root testid when wallet is connected", () => {
      render(<DeFiTransferWidget />);
      expect(screen.getByTestId("defi-transfer-widget")).toBeTruthy();
    });

    it("shows no-wallet branch when connectedWallet is null", () => {
      Object.assign(mockDeFiData, { ...buildBaseMock(), connectedWallet: null });
      render(<DeFiTransferWidget />);
      expect(screen.queryByTestId("defi-transfer-widget")).toBeNull();
      expect(screen.getByText(/no wallet connected/i)).toBeTruthy();
    });
  });

  describe("mode toggle", () => {
    it("calls setTransferMode('bridge') when bridge button clicked", () => {
      const setTransferMode = vi.fn();
      Object.assign(mockDeFiData, { ...buildBaseMock(), setTransferMode });
      render(<DeFiTransferWidget />);
      fireEvent.click(screen.getByTestId("transfer-mode-bridge"));
      expect(setTransferMode).toHaveBeenCalledWith("bridge");
    });
  });

  describe("send mode", () => {
    it("keeps execute-button disabled when to-address is empty", () => {
      render(<DeFiTransferWidget />);
      fireEvent.change(screen.getByTestId("amount-input"), { target: { value: "1" } });
      const btn = screen.getByTestId("execute-button") as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it("enables execute-button once amount and address are set", () => {
      render(<DeFiTransferWidget />);
      fireEvent.change(screen.getByTestId("to-address-input"), {
        target: { value: "0xabc1234567890abcdef1234567890abcdef12345" },
      });
      fireEvent.change(screen.getByTestId("amount-input"), { target: { value: "1" } });
      const btn = screen.getByTestId("execute-button") as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    it("calls executeDeFiOrder with TRANSFER payload on send", () => {
      const spy = vi.fn();
      Object.assign(mockDeFiData, { ...buildBaseMock(), executeDeFiOrder: spy });
      render(<DeFiTransferWidget />);
      fireEvent.change(screen.getByTestId("to-address-input"), {
        target: { value: "0xabc1234567890abcdef1234567890abcdef12345" },
      });
      fireEvent.change(screen.getByTestId("amount-input"), { target: { value: "2" } });
      fireEvent.click(screen.getByTestId("execute-button"));
      expect(spy).toHaveBeenCalledTimes(1);
      const payload = spy.mock.calls[0]![0] as Record<string, unknown>;
      expect(payload).toMatchObject({
        client_id: "internal-trader",
        instruction_type: "TRANSFER",
        algo_type: "DIRECT",
        quantity: 2,
        max_slippage_bps: 0,
        asset_group: "DeFi",
        lane: "defi",
        side: "sell",
      });
      expect(String(payload.venue)).toMatch(/^WALLET-/);
    });

    it("disables execute when amount exceeds token balance", () => {
      render(<DeFiTransferWidget />);
      fireEvent.change(screen.getByTestId("to-address-input"), {
        target: { value: "0xabc1234567890abcdef1234567890abcdef12345" },
      });
      // Default token is DEFI_TOKENS[0] = ETH, balance=10 — enter 1000 to exceed
      fireEvent.change(screen.getByTestId("amount-input"), { target: { value: "1000" } });
      const btn = screen.getByTestId("execute-button") as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });

  describe("bridge mode", () => {
    it("executes bridge payload with SOR_CROSS_CHAIN algo + BRIDGE instrument prefix", () => {
      const spy = vi.fn();
      Object.assign(mockDeFiData, { ...buildBaseMock(), transferMode: "bridge", executeDeFiOrder: spy });
      render(<DeFiTransferWidget />);
      fireEvent.change(screen.getByTestId("amount-input"), { target: { value: "1" } });
      fireEvent.click(screen.getByTestId("execute-button"));
      expect(spy).toHaveBeenCalledTimes(1);
      const payload = spy.mock.calls[0]![0] as Record<string, unknown>;
      expect(payload).toMatchObject({
        instruction_type: "TRANSFER",
        algo_type: "SOR_CROSS_CHAIN",
        quantity: 1,
        asset_group: "DeFi",
        lane: "defi",
      });
      expect(String(payload.instrument_id)).toMatch(/^BRIDGE:/);
    });
  });
});
