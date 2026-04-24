/**
 * L1.5 widget harness — saft-portfolio.
 *
 * Scope:
 * - Render with mocked saftRecords; KPI cards, table headers, Add SAFT button.
 * - Empty state (cert L0.7): "No SAFT records".
 * - Loading state (cert L0.6): spinner present; no KPI cards.
 * - Error state (cert L0.8): "Could not load account data".
 * - Add SAFT button opens the dialog.
 * - Save SAFT click emits a sonner toast (cert L4.1 fix note).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildMockAccountsData, buildMockSaftRecord } from "../_helpers/mock-accounts-context";

const mockData = buildMockAccountsData();

const { mockToast } = vi.hoisted(() => ({
  mockToast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/components/widgets/accounts/accounts-data-context", () => ({
  useAccountsData: () => mockData,
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

import { SaftPortfolioWidget } from "@/components/widgets/accounts/saft-portfolio-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

const noopProps = {} as unknown as WidgetComponentProps;

describe("saft-portfolio — L1.5 harness", () => {
  beforeEach(() => {
    mockToast.success.mockReset();
    mockToast.error.mockReset();
    mockToast.info.mockReset();
    Object.assign(mockData, buildMockAccountsData());
  });

  describe("render", () => {
    it("renders the summary line describing the widget", () => {
      render(<SaftPortfolioWidget {...noopProps} />);
      expect(screen.getByText(/Simple Agreement for Future Tokens tracking/i)).toBeTruthy();
    });

    it("renders all four KPI card labels", () => {
      render(<SaftPortfolioWidget {...noopProps} />);
      expect(screen.getByText("Total SAFTs")).toBeTruthy();
      expect(screen.getByText("Total Committed")).toBeTruthy();
      expect(screen.getByText("Vested Value")).toBeTruthy();
      expect(screen.getByText("Next Unlock")).toBeTruthy();
    });

    it("renders the SAFT portfolio table column headers", () => {
      render(<SaftPortfolioWidget {...noopProps} />);
      expect(screen.getByText("Token")).toBeTruthy();
      expect(screen.getByText("Round")).toBeTruthy();
      expect(screen.getByText("Committed")).toBeTruthy();
      expect(screen.getByText("Token Price")).toBeTruthy();
      expect(screen.getByText("Tokens")).toBeTruthy();
      expect(screen.getByText("Vested %")).toBeTruthy();
    });

    it("renders a token row from the mocked saftRecords", () => {
      Object.assign(
        mockData,
        buildMockAccountsData({
          saftRecords: [buildMockSaftRecord({ id: "saft-99", token: "Alpha (AL)", round: "Strategic" })],
        }),
      );
      render(<SaftPortfolioWidget {...noopProps} />);
      // Token label appears in both the SAFT table row and the vesting
      // timeline; assert presence, not uniqueness.
      expect(screen.getAllByText("Alpha (AL)").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Strategic")).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("renders 'No SAFT records' when saftRecords is empty", () => {
      Object.assign(mockData, buildMockAccountsData({ saftRecords: [] }));
      render(<SaftPortfolioWidget {...noopProps} />);
      expect(screen.getByText(/No SAFT records/i)).toBeTruthy();
      expect(screen.queryByText("Total SAFTs")).toBeNull();
    });
  });

  describe("loading state", () => {
    it("does not render the KPI cards when isLoading is true", () => {
      Object.assign(mockData, buildMockAccountsData({ isLoading: true }));
      render(<SaftPortfolioWidget {...noopProps} />);
      expect(screen.queryByText("Total SAFTs")).toBeNull();
    });
  });

  describe("error state", () => {
    it("renders the error fallback when context.error is set", () => {
      Object.assign(mockData, buildMockAccountsData({ error: new Error("boom") }));
      render(<SaftPortfolioWidget {...noopProps} />);
      expect(screen.getByText(/Could not load account data/i)).toBeTruthy();
      expect(screen.queryByText("Total SAFTs")).toBeNull();
    });
  });

  describe("add SAFT dialog", () => {
    it("opens the dialog when 'Add SAFT' button is clicked", () => {
      render(<SaftPortfolioWidget {...noopProps} />);
      fireEvent.click(screen.getByRole("button", { name: /Add SAFT/i }));
      expect(screen.getByText("Add SAFT Agreement")).toBeTruthy();
      expect(screen.getByText(/Record a new Simple Agreement for Future Tokens/i)).toBeTruthy();
    });

    it("emits a sonner toast when Save SAFT is clicked (demo placeholder)", () => {
      render(<SaftPortfolioWidget {...noopProps} />);
      fireEvent.click(screen.getByRole("button", { name: /Add SAFT/i }));
      fireEvent.click(screen.getByRole("button", { name: /Save SAFT/i }));
      expect(mockToast.info).toHaveBeenCalledTimes(1);
      expect(mockToast.info.mock.calls[0]![0]).toContain("SAFT API not available");
    });
  });
});
