/**
 * L1.5 widget harness — defi-strategy-config-widget.
 *
 * Pattern reference:
 *   tests/widgets/defi/defi-lending-widget.test.tsx (pilot)
 *   codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   plans/ai/ui_widget_test_rollout_2026_04_24.plan.md (Phase 3 Wave 2 DeFi)
 *
 * Notes:
 * - This widget does NOT use DeFiDataContext; it is driven by the
 *   localStorage-backed defi-strategy-store and the schema-driven form. We mock
 *   the store + SchemaForm so the spec can assert on state transitions without
 *   depending on the (large) real schema surface.
 *
 * Scope:
 * - Loading → loaded transition (isLoading useEffect + localStorage read).
 * - Mode badge renders "Paper" by default.
 * - Client restrictions panel + risk indicators mount.
 * - Save Config button invokes saveDefiStrategyConfig(selectedStrategy, config).
 * - Deploy Strategy button invokes deployDefiStrategy(selectedStrategy).
 * - Promote button surfaces a toast.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const { getDefiStrategyConfig, saveDefiStrategyConfig, deployDefiStrategy, toastSuccess } = vi.hoisted(() => ({
  getDefiStrategyConfig: vi.fn<(id: string) => unknown>(() => undefined),
  saveDefiStrategyConfig: vi.fn(),
  deployDefiStrategy: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/lib/stores/defi-strategy-store", () => ({
  getDefiStrategyConfig,
  saveDefiStrategyConfig,
  deployDefiStrategy,
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: vi.fn(), info: vi.fn() },
}));

// SchemaForm pulls in many option lists + dynamic fields; stub to a trivial
// passthrough so the widget-under-test is the focus.
vi.mock("@/components/shared/schema-driven-form", () => ({
  SchemaForm: ({ values }: { values: Record<string, unknown> }) => (
    <div data-testid="schema-form-stub">{JSON.stringify(values)}</div>
  ),
}));

import { DeFiStrategyConfigWidget } from "@/components/widgets/defi/defi-strategy-config-widget";

describe("defi-strategy-config-widget — L1.5 harness", () => {
  beforeEach(() => {
    getDefiStrategyConfig.mockReset();
    getDefiStrategyConfig.mockReturnValue(undefined);
    saveDefiStrategyConfig.mockReset();
    deployDefiStrategy.mockReset();
    toastSuccess.mockReset();
  });

  describe("loading → loaded transition", () => {
    it("resolves out of the Skeleton state after mount effect runs", async () => {
      render(<DeFiStrategyConfigWidget />);
      // SchemaForm stub only renders after isLoading flips false
      await waitFor(() => {
        expect(screen.getByTestId("schema-form-stub")).toBeTruthy();
      });
    });
  });

  describe("header + info panels", () => {
    it("renders the default mode badge (Paper)", async () => {
      render(<DeFiStrategyConfigWidget />);
      await waitFor(() => {
        expect(screen.getByText(/^paper$/i)).toBeTruthy();
      });
    });

    it("renders the client restrictions panel", async () => {
      render(<DeFiStrategyConfigWidget />);
      await waitFor(() => {
        expect(screen.getByText(/client config/i)).toBeTruthy();
      });
      expect(screen.getByText(/OKX, Bybit, Binance/)).toBeTruthy();
      expect(screen.getByText(/HyperLiquid/)).toBeTruthy();
    });

    it("renders the risk indicators panel with known labels", async () => {
      render(<DeFiStrategyConfigWidget />);
      await waitFor(() => {
        expect(screen.getByText(/risk indicators/i)).toBeTruthy();
      });
      expect(screen.getByText(/Oracle Depeg/)).toBeTruthy();
      expect(screen.getByText(/USDT Peg/)).toBeTruthy();
    });
  });

  describe("action buttons", () => {
    it("Save Config calls saveDefiStrategyConfig with the active strategy id", async () => {
      render(<DeFiStrategyConfigWidget />);
      const save = await screen.findByRole("button", { name: /save config/i });
      fireEvent.click(save);
      expect(saveDefiStrategyConfig).toHaveBeenCalledTimes(1);
      // Default selectedStrategy is AAVE_LENDING (useState initial value).
      expect(saveDefiStrategyConfig.mock.calls[0]![0]).toBe("AAVE_LENDING");
      // Second arg is a config object
      expect(typeof saveDefiStrategyConfig.mock.calls[0]![1]).toBe("object");
      expect(toastSuccess).toHaveBeenCalled();
    });

    it("Deploy Strategy calls deployDefiStrategy with the active strategy id", async () => {
      render(<DeFiStrategyConfigWidget />);
      const deploy = await screen.findByRole("button", { name: /deploy strategy/i });
      fireEvent.click(deploy);
      expect(deployDefiStrategy).toHaveBeenCalledTimes(1);
      expect(deployDefiStrategy).toHaveBeenCalledWith("AAVE_LENDING");
      expect(toastSuccess).toHaveBeenCalled();
    });

    it("Promote surfaces a toast without invoking store writers", async () => {
      render(<DeFiStrategyConfigWidget />);
      const promote = await screen.findByRole("button", { name: /promote/i });
      fireEvent.click(promote);
      expect(toastSuccess).toHaveBeenCalled();
      expect(saveDefiStrategyConfig).not.toHaveBeenCalled();
      expect(deployDefiStrategy).not.toHaveBeenCalled();
    });
  });

  describe("persisted-config path", () => {
    it("merges stored configs over defaults on mount", async () => {
      getDefiStrategyConfig.mockImplementation((id: string) =>
        id === "AAVE_LENDING"
          ? {
              strategy_id: id,
              share_class: "USDT",
              status: "deployed",
              deployed_at: null,
              config: { __marker: "from-store" },
            }
          : undefined,
      );
      render(<DeFiStrategyConfigWidget />);
      await waitFor(() => {
        // Stub serializes the current config — the stored marker should be present
        expect(screen.getByTestId("schema-form-stub").textContent).toContain("__marker");
      });
    });
  });
});
