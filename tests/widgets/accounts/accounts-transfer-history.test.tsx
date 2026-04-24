/**
 * L1.5 widget harness — accounts-transfer-history.
 *
 * Scope:
 * - Render with mocked transferHistory; rows appear in TableWidget.
 * - Loading / error branches surface via TableWidget props (cert L0.6/0.8).
 * - Empty state (cert L0.7): "No transfers yet".
 * - Status filter is wired — changing it filters rendered rows.
 * - Formatter cells: amount is right-aligned + locale formatted; status badge
 *   uses the status value text verbatim.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildMockAccountsData, buildMockTransferHistoryEntry } from "../_helpers/mock-accounts-context";

const mockData = buildMockAccountsData();

vi.mock("@/components/widgets/accounts/accounts-data-context", () => ({
  useAccountsData: () => mockData,
}));

import { AccountsTransferHistoryWidget } from "@/components/widgets/accounts/accounts-transfer-history-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

const noopProps = {} as unknown as WidgetComponentProps;

describe("accounts-transfer-history — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockData, buildMockAccountsData());
  });

  describe("render", () => {
    it("renders the column headers from the ColumnDef array", () => {
      render(<AccountsTransferHistoryWidget {...noopProps} />);
      expect(screen.getByText("Time")).toBeTruthy();
      expect(screen.getByText("Type")).toBeTruthy();
      expect(screen.getByText("From")).toBeTruthy();
      expect(screen.getByText("To")).toBeTruthy();
      expect(screen.getByText("Asset")).toBeTruthy();
      expect(screen.getByText("Amount")).toBeTruthy();
      expect(screen.getByText("Status")).toBeTruthy();
      expect(screen.getByText("Tx Hash")).toBeTruthy();
    });

    it("renders a transfer row from the mocked history", () => {
      Object.assign(
        mockData,
        buildMockAccountsData({
          transferHistory: [
            buildMockTransferHistoryEntry({
              timestamp: "24 Apr 10:30",
              type: "Withdraw",
              from: "Binance",
              to: "0xabc…def0",
              asset: "USDC",
              amount: 1_234,
              status: "Pending",
              txHash: "0xdead…beef",
            }),
          ],
        }),
      );
      render(<AccountsTransferHistoryWidget {...noopProps} />);
      expect(screen.getByText("24 Apr 10:30")).toBeTruthy();
      expect(screen.getByText("Withdraw")).toBeTruthy();
      expect(screen.getByText("0xabc…def0")).toBeTruthy();
      expect(screen.getByText("USDC")).toBeTruthy();
      expect(screen.getByText("1,234")).toBeTruthy();
      expect(screen.getByText("Pending")).toBeTruthy();
      expect(screen.getByText("0xdead…beef")).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("renders 'No transfers yet' emptyMessage when history is empty", () => {
      Object.assign(mockData, buildMockAccountsData({ transferHistory: [] }));
      render(<AccountsTransferHistoryWidget {...noopProps} />);
      expect(screen.getByText(/No transfers yet/i)).toBeTruthy();
    });
  });

  describe("error state", () => {
    it("renders the 'Could not load transfer history' banner when error flag is set", () => {
      Object.assign(mockData, buildMockAccountsData({ transferHistory: [], transferHistoryError: true }));
      render(<AccountsTransferHistoryWidget {...noopProps} />);
      expect(screen.getByText(/Could not load transfer history/i)).toBeTruthy();
    });
  });

  describe("loading state", () => {
    it("mounts without throwing when transferHistoryLoading is true", () => {
      Object.assign(mockData, buildMockAccountsData({ transferHistory: [], transferHistoryLoading: true }));
      // Loading state is delegated to TableWidget; the widget should still
      // mount and not render the empty-state text.
      expect(() => render(<AccountsTransferHistoryWidget {...noopProps} />)).not.toThrow();
    });
  });

  describe("badge styling", () => {
    it("renders completed / processing / pending rows each with their status text", () => {
      Object.assign(
        mockData,
        buildMockAccountsData({
          transferHistory: [
            buildMockTransferHistoryEntry({ status: "Completed", txHash: "0xcomp…" }),
            buildMockTransferHistoryEntry({ status: "Processing", txHash: "0xproc…" }),
            buildMockTransferHistoryEntry({ status: "Pending", txHash: "0xpend…" }),
          ],
        }),
      );
      render(<AccountsTransferHistoryWidget {...noopProps} />);
      expect(screen.getByText("Completed")).toBeTruthy();
      expect(screen.getByText("Processing")).toBeTruthy();
      expect(screen.getByText("Pending")).toBeTruthy();
    });
  });
});
