/**
 * L1.5 widget harness — markets-controls-widget.
 *
 * Pattern reference:
 *   unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5)
 *   unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan.md Phase 5
 *
 * Scope:
 * - Render with mocked MarketsDataContext; assert visible controls mount.
 * - View-mode toggle (cross-section / time-series) calls setViewMode.
 * - Data-mode toggle (live / batch) calls setDataMode.
 * - Order-flow view buttons call setOrderFlowView.
 * - Generate Report button produces a sonner toast (stub verified).
 * - Book-depth select only visible when orderFlowView=book and assetClass!=defi.
 *
 * Out of scope:
 * - Real route wiring (L2 smoke)
 * - Multi-widget markets context interactions (L3b)
 * - Visual regression (L4 — deferred)
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMockMarketsData } from "../_helpers/mock-markets-context";

const mockMarketsData = buildMockMarketsData();

vi.mock("@/components/widgets/markets/markets-data-context", () => ({
  useMarketsData: () => mockMarketsData,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { MarketsControlsWidget } from "@/components/widgets/markets/markets-controls-widget";
import { toast } from "sonner";

describe("markets-controls-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockMarketsData, buildMockMarketsData());
    vi.clearAllMocks();
  });

  describe("render", () => {
    it("mounts with view-mode buttons visible", () => {
      render(<MarketsControlsWidget instanceId="markets-controls" layoutMode="grid" />);
      expect(screen.getByText("Cross-Section")).toBeTruthy();
      expect(screen.getByText("Time Series")).toBeTruthy();
    });

    it("renders data-mode buttons", () => {
      render(<MarketsControlsWidget instanceId="markets-controls" layoutMode="grid" />);
      expect(screen.getByText("Live")).toBeTruthy();
      expect(screen.getByText("Batch")).toBeTruthy();
    });

    it("renders Generate Report button", () => {
      render(<MarketsControlsWidget instanceId="markets-controls" layoutMode="grid" />);
      expect(screen.getByText("Generate Report")).toBeTruthy();
    });

    it("renders order-flow view buttons", () => {
      render(<MarketsControlsWidget instanceId="markets-controls" layoutMode="grid" />);
      expect(screen.getByText("Market Orders")).toBeTruthy();
      expect(screen.getByText("Live Book")).toBeTruthy();
      expect(screen.getByText("My Orders")).toBeTruthy();
    });
  });

  describe("view-mode toggle", () => {
    it("calls setViewMode with 'time-series' when clicked", () => {
      render(<MarketsControlsWidget instanceId="markets-controls" layoutMode="grid" />);
      fireEvent.click(screen.getByText("Time Series"));
      expect(mockMarketsData.setViewMode).toHaveBeenCalledWith("time-series");
    });

    it("calls setViewMode with 'cross-section' when clicked", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ viewMode: "time-series" }));
      render(<MarketsControlsWidget instanceId="markets-controls" layoutMode="grid" />);
      fireEvent.click(screen.getByText("Cross-Section"));
      expect(mockMarketsData.setViewMode).toHaveBeenCalledWith("cross-section");
    });
  });

  describe("data-mode toggle", () => {
    it("calls setDataMode with 'batch' when Batch clicked", () => {
      render(<MarketsControlsWidget instanceId="markets-controls" layoutMode="grid" />);
      fireEvent.click(screen.getByText("Batch"));
      expect(mockMarketsData.setDataMode).toHaveBeenCalledWith("batch");
    });

    it("calls setDataMode with 'live' when Live clicked", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ dataMode: "batch" }));
      render(<MarketsControlsWidget instanceId="markets-controls" layoutMode="grid" />);
      fireEvent.click(screen.getByText("Live"));
      expect(mockMarketsData.setDataMode).toHaveBeenCalledWith("live");
    });
  });

  describe("order-flow view buttons", () => {
    it("calls setOrderFlowView with 'orders' when Market Orders clicked", () => {
      render(<MarketsControlsWidget instanceId="markets-controls" layoutMode="grid" />);
      fireEvent.click(screen.getByText("Market Orders"));
      expect(mockMarketsData.setOrderFlowView).toHaveBeenCalledWith("orders");
    });

    it("calls setOrderFlowView with 'book' when Live Book clicked", () => {
      render(<MarketsControlsWidget instanceId="markets-controls" layoutMode="grid" />);
      fireEvent.click(screen.getByText("Live Book"));
      expect(mockMarketsData.setOrderFlowView).toHaveBeenCalledWith("book");
    });
  });

  describe("Generate Report button", () => {
    it("fires toast.info when Generate Report is clicked", () => {
      render(<MarketsControlsWidget instanceId="markets-controls" layoutMode="grid" />);
      fireEvent.click(screen.getByText("Generate Report"));
      expect(toast.info).toHaveBeenCalledTimes(1);
    });
  });

  describe("book-depth select visibility", () => {
    it("hides Depth select when orderFlowView is 'orders'", () => {
      render(<MarketsControlsWidget instanceId="markets-controls" layoutMode="grid" />);
      // orderFlowView defaults to 'orders' in mock — Depth control absent
      expect(screen.queryByText("Depth")).toBeNull();
    });

    it("hides Depth select when assetClass is 'defi' even if orderFlowView is 'book'", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ orderFlowView: "book", assetClass: "defi" }));
      render(<MarketsControlsWidget instanceId="markets-controls" layoutMode="grid" />);
      expect(screen.queryByText("Depth")).toBeNull();
    });

    it("shows Depth select when orderFlowView is 'book' and assetClass is 'crypto'", () => {
      Object.assign(mockMarketsData, buildMockMarketsData({ orderFlowView: "book", assetClass: "crypto" }));
      render(<MarketsControlsWidget instanceId="markets-controls" layoutMode="grid" />);
      expect(screen.getByText("Depth")).toBeTruthy();
    });
  });
});
