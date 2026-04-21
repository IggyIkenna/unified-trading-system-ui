import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StrategyCatalogueSurface } from "@/components/strategy-catalogue/StrategyCatalogueSurface";
import { AvailabilityStoreProvider } from "@/lib/architecture-v2";
import { loadStrategyCatalogue } from "@/lib/architecture-v2/lifecycle";
import {
  listStrategyInstanceLifecycles,
  patchStrategyInstanceLifecycle,
  type LifecycleRecord,
} from "@/lib/admin/api/strategy-lifecycle";
import {
  isValidMaturityTransition,
  legalMaturityTargets,
  maturityPhaseRank,
} from "@/lib/architecture-v2/lifecycle";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { id: "admin", role: "admin" } }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/admin/api/strategy-lifecycle", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/admin/api/strategy-lifecycle")
  >("@/lib/admin/api/strategy-lifecycle");
  return {
    ...actual,
    listStrategyInstanceLifecycles: vi.fn(),
    patchStrategyInstanceLifecycle: vi.fn(),
  };
});

const mockedList = vi.mocked(listStrategyInstanceLifecycles);
const mockedPatch = vi.mocked(patchStrategyInstanceLifecycle);

function renderSurface(ui: ReactElement) {
  return render(
    <AvailabilityStoreProvider persist={false}>{ui}</AvailabilityStoreProvider>,
  );
}

describe("isValidMaturityTransition (lifecycle ladder helper)", () => {
  it("rejects transitions out of retired", () => {
    expect(isValidMaturityTransition("retired", "live_early")).toBe(false);
    expect(isValidMaturityTransition("retired", "retired")).toBe(false);
  });

  it("allows any phase → retired", () => {
    expect(isValidMaturityTransition("smoke", "retired")).toBe(true);
    expect(isValidMaturityTransition("paper_1d", "retired")).toBe(true);
    expect(isValidMaturityTransition("live_stable", "retired")).toBe(true);
  });

  it("allows forward ladder moves with skips", () => {
    expect(isValidMaturityTransition("backtest_1yr", "paper_1d")).toBe(true);
    expect(isValidMaturityTransition("smoke", "live_stable")).toBe(true);
  });

  it("rejects backward ladder moves + no-op", () => {
    expect(isValidMaturityTransition("paper_14d", "paper_1d")).toBe(false);
    expect(isValidMaturityTransition("live_stable", "backtest_1yr")).toBe(false);
    expect(isValidMaturityTransition("paper_1d", "paper_1d")).toBe(false);
  });

  it("maturityPhaseRank returns -1 for retired", () => {
    expect(maturityPhaseRank("retired")).toBe(-1);
    expect(maturityPhaseRank("smoke")).toBe(0);
    expect(maturityPhaseRank("live_stable")).toBeGreaterThan(0);
  });

  it("legalMaturityTargets excludes self + backward + includes retired", () => {
    const targets = legalMaturityTargets("paper_14d");
    expect(targets).not.toContain("paper_14d");
    expect(targets).not.toContain("paper_1d");
    expect(targets).toContain("paper_stable");
    expect(targets).toContain("retired");
  });
});

describe("<StrategyCatalogueSurface viewMode='admin-editor'> live editing", () => {
  const firstInstance = loadStrategyCatalogue()[0];

  beforeEach(() => {
    mockedList.mockReset();
    mockedPatch.mockReset();
  });

  it("disables dropdowns until server-side lifecycle record loads", async () => {
    mockedList.mockResolvedValue([]);
    renderSurface(<StrategyCatalogueSurface viewMode="admin-editor" />);
    await waitFor(() => expect(mockedList).toHaveBeenCalledOnce());
    const grid = screen.getByTestId("admin-editor-grid");
    const maturitySelects = within(grid).getAllByTestId("admin-editor-maturity-select");
    for (const sel of maturitySelects) expect(sel).toBeDisabled();
  });

  it("enables dropdowns for seeded instances", async () => {
    const seed: LifecycleRecord = {
      instance_id: firstInstance.instanceId,
      maturity_phase: "paper_1d",
      product_routing: "dart_only",
    };
    mockedList.mockResolvedValue([seed]);
    renderSurface(<StrategyCatalogueSurface viewMode="admin-editor" />);
    await waitFor(() => expect(mockedList).toHaveBeenCalledOnce());
    const grid = await screen.findByTestId("admin-editor-grid");
    const row = within(grid)
      .getAllByTestId("admin-editor-row")
      .find((el) => el.getAttribute("data-instance-id") === firstInstance.instanceId)!;
    expect(row).toBeDefined();
    // First row is the seeded instance (catalogue order is stable).
    const maturity = within(row).getByTestId("admin-editor-maturity-select");
    const routing = within(row).getByTestId("admin-editor-routing-select");
    expect(row).toHaveAttribute("data-instance-id", firstInstance.instanceId);
    await waitFor(() => expect(maturity).not.toBeDisabled());
    expect(routing).not.toBeDisabled();
  });

  it("calls PATCH with maturity_phase when dropdown changes", async () => {
    const seed: LifecycleRecord = {
      instance_id: firstInstance.instanceId,
      maturity_phase: "paper_1d",
      product_routing: "dart_only",
    };
    mockedList.mockResolvedValue([seed]);
    mockedPatch.mockResolvedValue({ ...seed, maturity_phase: "paper_14d" });
    renderSurface(<StrategyCatalogueSurface viewMode="admin-editor" />);
    await waitFor(() => expect(mockedList).toHaveBeenCalledOnce());
    const grid = await screen.findByTestId("admin-editor-grid");
    const row = within(grid)
      .getAllByTestId("admin-editor-row")
      .find((el) => el.getAttribute("data-instance-id") === firstInstance.instanceId)!;
    expect(row).toBeDefined();
    const select = within(row).getByTestId("admin-editor-maturity-select");
    await waitFor(() => expect(select).not.toBeDisabled());
    await userEvent.selectOptions(select, "paper_14d");
    await waitFor(() =>
      expect(mockedPatch).toHaveBeenCalledWith(firstInstance.instanceId, {
        maturity_phase: "paper_14d",
      }),
    );
  });

  it("calls PATCH with product_routing when routing dropdown changes", async () => {
    const seed: LifecycleRecord = {
      instance_id: firstInstance.instanceId,
      maturity_phase: "paper_stable",
      product_routing: "dart_only",
    };
    mockedList.mockResolvedValue([seed]);
    mockedPatch.mockResolvedValue({ ...seed, product_routing: "both" });
    renderSurface(<StrategyCatalogueSurface viewMode="admin-editor" />);
    await waitFor(() => expect(mockedList).toHaveBeenCalledOnce());
    const grid = await screen.findByTestId("admin-editor-grid");
    const row = within(grid)
      .getAllByTestId("admin-editor-row")
      .find((el) => el.getAttribute("data-instance-id") === firstInstance.instanceId)!;
    expect(row).toBeDefined();
    const select = within(row).getByTestId("admin-editor-routing-select");
    await waitFor(() => expect(select).not.toBeDisabled());
    await userEvent.selectOptions(select, "both");
    await waitFor(() =>
      expect(mockedPatch).toHaveBeenCalledWith(firstInstance.instanceId, {
        product_routing: "both",
      }),
    );
  });

  it("surfaces the load error banner on GET failure", async () => {
    mockedList.mockRejectedValue(new Error("server down"));
    renderSurface(<StrategyCatalogueSurface viewMode="admin-editor" />);
    const banner = await screen.findByTestId("admin-editor-load-error");
    expect(banner).toHaveTextContent("server down");
  });
});
