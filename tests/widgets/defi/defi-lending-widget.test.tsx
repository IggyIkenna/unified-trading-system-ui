/**
 * L1.5 widget harness pilot — defi-lending-widget.
 *
 * Pattern reference for rollout per
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan.md
 *
 * Scope:
 * - Render with mocked data-context; assert testid mounts.
 * - Interactive surfaces: operation toggle, asset select, amount input.
 * - Reactive output: expected-output row appears when amount > 0 and
 *   differs for LEND (aToken) vs BORROW (base asset).
 * - Execute button enable/disable + executeDeFiOrder payload shape.
 * - Empty-protocols branch (AlertTriangle) from widget cert L0.7.
 *
 * Out of scope (covered elsewhere):
 * - Real route wiring (L2 smoke)
 * - End-to-end LEND→WITHDRAW trader flow (L3b strategy spec)
 * - Visual regression (L4 — deferred per plan)
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockDeFiData, buildMockLendingProtocol } from "../_helpers/mock-defi-context";

const mockDeFiData = buildMockDeFiData();

vi.mock("@/components/widgets/defi/defi-data-context", () => ({
  useDeFiData: () => mockDeFiData,
}));

vi.mock("@/hooks/use-active-strategy-id", () => ({
  useActiveStrategyId: () => "YIELD_ROTATION_LENDING@aave-multichain-usdc-prod",
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { DeFiLendingWidget } from "@/components/widgets/defi/defi-lending-widget";

describe("defi-lending-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockDeFiData, buildMockDeFiData());
  });

  describe("render", () => {
    it("mounts root testid with protocols available", () => {
      render(<DeFiLendingWidget />);
      expect(screen.getByTestId("defi-lending-widget")).toBeTruthy();
    });

    it("shows empty-state AlertTriangle when no lending protocols", () => {
      Object.assign(mockDeFiData, buildMockDeFiData({ lendingProtocols: [] }));
      render(<DeFiLendingWidget />);
      expect(screen.queryByTestId("defi-lending-widget")).toBeNull();
      expect(screen.getByText(/no lending protocols available/i)).toBeTruthy();
    });

    it("renders supply + borrow APY from selected protocol", () => {
      render(<DeFiLendingWidget />);
      // Default asset is ETH; protocol has supplyApy.ETH = 0.035, borrowApy.ETH = 0.062
      expect(screen.getByTestId("supply-apy").textContent).toContain("3.50");
      expect(screen.getByTestId("borrow-apy").textContent).toContain("6.20");
    });
  });

  describe("operation toggle", () => {
    it("defaults to LEND", () => {
      render(<DeFiLendingWidget />);
      expect(screen.getByTestId("execute-button").textContent).toContain("LEND");
    });

    it("updates execute button label when switching to BORROW", () => {
      render(<DeFiLendingWidget />);
      fireEvent.click(screen.getByTestId("operation-button-BORROW"));
      expect(screen.getByTestId("execute-button").textContent).toContain("BORROW");
    });

    it("cycles through all four operations", () => {
      render(<DeFiLendingWidget />);
      for (const op of ["BORROW", "WITHDRAW", "REPAY", "LEND"] as const) {
        fireEvent.click(screen.getByTestId(`operation-button-${op}`));
        expect(screen.getByTestId("execute-button").textContent).toContain(op);
      }
    });
  });

  describe("amount input + reactive output", () => {
    it("hides expected-output when amount is empty", () => {
      render(<DeFiLendingWidget />);
      expect(screen.queryByTestId("expected-output")).toBeNull();
    });

    it("reveals expected-output when amount > 0", () => {
      render(<DeFiLendingWidget />);
      fireEvent.change(screen.getByTestId("amount-input"), { target: { value: "1" } });
      expect(screen.getByTestId("expected-output")).toBeTruthy();
    });

    it("uses aToken prefix on LEND expected-output", () => {
      render(<DeFiLendingWidget />);
      fireEvent.change(screen.getByTestId("amount-input"), { target: { value: "2" } });
      // Default op = LEND, default asset = ETH -> aETH
      expect(screen.getByTestId("expected-output").textContent).toContain("aETH");
    });

    it("uses base asset on BORROW expected-output", () => {
      render(<DeFiLendingWidget />);
      fireEvent.click(screen.getByTestId("operation-button-BORROW"));
      fireEvent.change(screen.getByTestId("amount-input"), { target: { value: "2" } });
      const text = screen.getByTestId("expected-output").textContent ?? "";
      expect(text).toContain("ETH");
      expect(text).not.toContain("aETH");
    });
  });

  describe("health factor", () => {
    it("shows current HF from context on mount", () => {
      render(<DeFiLendingWidget />);
      expect(screen.getByTestId("current-hf").textContent).toContain("1.80");
    });

    it("shows after-hf dash placeholder when amount empty", () => {
      render(<DeFiLendingWidget />);
      // Widget renders ASCII hyphen "-" as the empty-state placeholder.
      expect(screen.getByTestId("after-hf").textContent).toContain("-");
    });

    it("shows computed after-hf when amount > 0", () => {
      render(<DeFiLendingWidget />);
      fireEvent.change(screen.getByTestId("amount-input"), { target: { value: "1" } });
      // calculateHealthFactorDelta mock returns +0.15 on LEND -> 1.8 + 0.15 = 1.95
      expect(screen.getByTestId("after-hf").textContent).toContain("1.95");
    });
  });

  describe("execute button", () => {
    it("is disabled when amount is empty", () => {
      render(<DeFiLendingWidget />);
      const btn = screen.getByTestId("execute-button") as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it("enables when amount > 0", () => {
      render(<DeFiLendingWidget />);
      fireEvent.change(screen.getByTestId("amount-input"), { target: { value: "0.5" } });
      const btn = screen.getByTestId("execute-button") as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    it("calls executeDeFiOrder with expected payload shape on click", () => {
      const spy = vi.fn();
      Object.assign(mockDeFiData, buildMockDeFiData({ executeDeFiOrder: spy }));
      render(<DeFiLendingWidget />);
      fireEvent.change(screen.getByTestId("amount-input"), { target: { value: "1.5" } });
      fireEvent.click(screen.getByTestId("execute-button"));
      expect(spy).toHaveBeenCalledTimes(1);
      const payload = spy.mock.calls[0]![0] as Record<string, unknown>;
      expect(payload).toMatchObject({
        client_id: "internal-trader",
        instruction_type: "LEND",
        venue: "AAVEV3-ETHEREUM",
        quantity: 1.5,
        asset_group: "DeFi",
        lane: "defi",
      });
    });
  });

  describe("protocol switching", () => {
    it("uses first protocol's assets when selectedLendingProtocol maps to that protocol", () => {
      const morpho = buildMockLendingProtocol({
        name: "Morpho",
        venue_id: "MORPHO-ETHEREUM",
        assets: ["USDC", "DAI"],
        supplyApy: { USDC: 5.0, DAI: 4.0 },
        borrowApy: { USDC: 7.0, DAI: 6.0 },
      });
      Object.assign(mockDeFiData, buildMockDeFiData({ lendingProtocols: [morpho], selectedLendingProtocol: "Morpho" }));
      render(<DeFiLendingWidget />);
      // After mount effect runs, asset defaults to USDC (first in Morpho's assets)
      // supplyApy.USDC = 0.05 -> 5.00%
      expect(screen.getByTestId("supply-apy").textContent).toContain("5.00");
    });
  });
});
