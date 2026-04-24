/**
 * L1.5 widget harness — pnl-waterfall-widget.
 *
 * Chart-heavy widget: Recharts subviews (FactorHistogram + FactorPie) may not
 * fully render in happy-dom. Tests assert on surrounding controls (mode
 * toggle, date range, group-by, factor-view toggle, share-class select) and
 * text content driven by the mocked PnLDataProvider — not chart internals.
 *
 * See unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md (L1.5).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { buildMockPnLData } from "../_helpers/mock-pnl-context";

const mockPnLData = buildMockPnLData();

vi.mock("@/components/widgets/pnl/pnl-data-context", () => ({
  usePnLData: () => mockPnLData,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { PnlWaterfallWidget } from "@/components/widgets/pnl/pnl-waterfall-widget";

function renderWidget() {
  return render(<PnlWaterfallWidget instanceId="pnl-waterfall-test" />);
}

describe("pnl-waterfall-widget — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockPnLData, buildMockPnLData());
  });

  describe("render", () => {
    it("renders without crashing when data is present", () => {
      renderWidget();
      // Header controls present — Live/Batch labels appear in the toggle
      // buttons and in the status badge (multiple matches is expected).
      expect(screen.getAllByText("Live").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Batch").length).toBeGreaterThan(0);
      // Group-by buttons (Total, client, strategy, venue, asset).
      expect(screen.getByRole("button", { name: /^total$/i })).toBeTruthy();
    });

    it("shows loading skeleton when isLoading is true", () => {
      Object.assign(mockPnLData, buildMockPnLData({ isLoading: true }));
      const { container } = renderWidget();
      // Loading branch renders Skeleton placeholders instead of factor bars.
      // Factor names from DEFAULT_FACTORS must NOT appear.
      expect(screen.queryByText("Funding")).toBeNull();
      expect(container.querySelector('[data-slot="skeleton"]')).toBeTruthy();
    });

    it("shows empty-state copy when pnlComponents is empty", () => {
      Object.assign(mockPnLData, buildMockPnLData({ pnlComponents: [] }));
      renderWidget();
      expect(screen.getByText(/no p&l data available/i)).toBeTruthy();
    });

    it("renders residual alert banner when isResidualAlert is true", () => {
      Object.assign(mockPnLData, buildMockPnLData({ isResidualAlert: true }));
      renderWidget();
      expect(screen.getByText(/unexplained residual/i)).toBeTruthy();
    });
  });

  describe("mode toggle", () => {
    it("calls setDataMode('batch') when Batch button clicked", () => {
      const setDataMode = vi.fn();
      Object.assign(mockPnLData, buildMockPnLData({ setDataMode }));
      renderWidget();
      // Two "Batch" labels exist (toggle + right-aligned badge). Pick the
      // toggle button — it's the interactive one with onClick.
      const batchButtons = screen.getAllByRole("button", { name: /batch/i });
      fireEvent.click(batchButtons[0]!);
      expect(setDataMode).toHaveBeenCalledWith("batch");
    });

    it("calls setDataMode('live') when Live button clicked", () => {
      const setDataMode = vi.fn();
      Object.assign(mockPnLData, buildMockPnLData({ dataMode: "batch", setDataMode }));
      renderWidget();
      const liveButtons = screen.getAllByRole("button", { name: /^live$/i });
      fireEvent.click(liveButtons[0]!);
      expect(setDataMode).toHaveBeenCalledWith("live");
    });
  });

  describe("group-by selector", () => {
    it("calls setGroupBy when a group button is clicked", () => {
      const setGroupBy = vi.fn();
      Object.assign(mockPnLData, buildMockPnLData({ setGroupBy }));
      renderWidget();
      fireEvent.click(screen.getByRole("button", { name: /^strategy$/i }));
      expect(setGroupBy).toHaveBeenCalledWith("strategy");
    });
  });

  describe("factor-view toggle", () => {
    it("switches between bars, histogram, and pie views", () => {
      renderWidget();
      // Default view = bars -> factor names from DEFAULT_FACTORS visible.
      expect(screen.getByText("Funding")).toBeTruthy();

      fireEvent.click(screen.getByTestId("factor-view-histogram"));
      // Histogram subview swaps in — bars view list items gone. The
      // underlying data still has "Funding" (rendered by histogram too),
      // so we assert on the pressed-state instead.
      expect(screen.getByTestId("factor-view-histogram").getAttribute("aria-pressed")).toBe("true");

      fireEvent.click(screen.getByTestId("factor-view-pie"));
      expect(screen.getByTestId("factor-view-pie").getAttribute("aria-pressed")).toBe("true");

      fireEvent.click(screen.getByTestId("factor-view-bars"));
      expect(screen.getByTestId("factor-view-bars").getAttribute("aria-pressed")).toBe("true");
    });
  });

  describe("factor selection (bars view)", () => {
    it("calls setSelectedFactor when a factor bar is clicked", () => {
      const setSelectedFactor = vi.fn();
      Object.assign(mockPnLData, buildMockPnLData({ setSelectedFactor }));
      renderWidget();
      // Factor bars are role='button' divs with aria-pressed but no
      // aria-label — walk up from the factor-name text to the clickable
      // ancestor with role=button.
      const fundingLabel = screen.getByText("Funding");
      const fundingRow = fundingLabel.closest('[role="button"]') as HTMLElement | null;
      expect(fundingRow).toBeTruthy();
      fireEvent.click(fundingRow!);
      expect(setSelectedFactor).toHaveBeenCalledWith("Funding");
    });
  });

  describe("report button", () => {
    it("fires without crashing when clicked", async () => {
      const { toast } = await import("sonner");
      renderWidget();
      fireEvent.click(screen.getByRole("button", { name: /report/i }));
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
