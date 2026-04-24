/**
 * L1.5 widget harness — accounts-transfer.
 *
 * Scope:
 * - Render with mocked AccountsDataContext; transfer-type pills render.
 * - Default mode is "venue-to-venue" — Initiate Transfer button visible.
 * - Switching transfer type updates primary action button label.
 * - Execute button disabled when amount is empty; enabled when amount > 0.
 * - Submit path (venue-to-venue) calls addTransferEntry + useSubmitTransfer.mutate
 *   with the expected payload shape (direction: cross_venue, idempotency_key, etc.).
 * - Batch-mode guard short-circuits submission (cert L3 — guardBatch).
 * - Empty-state (cert L0.7): "No accounts available. Connect a venue..."
 *
 * Hermeticity: the widget's useSubmitTransfer hook normally calls useAuth +
 * apiFetch. We mock the hook itself to capture the mutate payload shape.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildMockAccountsData } from "../_helpers/mock-accounts-context";

const mockData = buildMockAccountsData();

const mockMutate = vi.fn();
const mockExecutionMode = { isPaper: false, isBatch: false, mode: "live" as string };

vi.mock("@/components/widgets/accounts/accounts-data-context", () => ({
  useAccountsData: () => mockData,
}));

vi.mock("@/lib/execution-mode-context", () => ({
  useExecutionMode: () => mockExecutionMode,
}));

vi.mock("@/hooks/api/use-submit-transfer", () => ({
  useSubmitTransfer: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { AccountsTransferWidget } from "@/components/widgets/accounts/accounts-transfer-widget";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

const noopProps = {} as unknown as WidgetComponentProps;

describe("accounts-transfer — L1.5 harness", () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockExecutionMode.isPaper = false;
    mockExecutionMode.isBatch = false;
    mockExecutionMode.mode = "live";
    Object.assign(mockData, buildMockAccountsData());
  });

  describe("render", () => {
    it("renders all four transfer-type pills", () => {
      render(<AccountsTransferWidget {...noopProps} />);
      expect(screen.getByRole("button", { name: "Venue" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Sub ↔ Main" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Withdraw" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Deposit" })).toBeTruthy();
    });

    it("defaults to venue-to-venue mode — Initiate Transfer button visible", () => {
      render(<AccountsTransferWidget {...noopProps} />);
      expect(screen.getByRole("button", { name: /Initiate Transfer/i })).toBeTruthy();
    });
  });

  describe("transfer-type switching", () => {
    it("switches to withdraw mode and shows Withdraw submit button", () => {
      render(<AccountsTransferWidget {...noopProps} />);
      fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
      // The submit button now reads "Withdraw" (different from the type pill
      // because type pill is inside the 4-grid and submit is full-width).
      const submits = screen.getAllByRole("button", { name: /^Withdraw$/ });
      // At least 2: the type pill plus the submit button.
      expect(submits.length).toBeGreaterThanOrEqual(2);
    });

    it("switches to deposit mode and shows the confirm-deposit button", () => {
      render(<AccountsTransferWidget {...noopProps} />);
      fireEvent.click(screen.getByRole("button", { name: "Deposit" }));
      expect(screen.getByRole("button", { name: /I've sent the deposit/i })).toBeTruthy();
    });
  });

  describe("submit — venue-to-venue", () => {
    it("toggles Initiate Transfer enable-state based on amount input", () => {
      render(<AccountsTransferWidget {...noopProps} />);
      const btn = screen.getByRole("button", { name: /Initiate Transfer/i }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
      fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "100" } });
      expect(btn.disabled).toBe(false);
    });

    it("calls useSubmitTransfer.mutate with cross_venue payload shape on submit", () => {
      render(<AccountsTransferWidget {...noopProps} />);
      fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "250" } });
      fireEvent.click(screen.getByRole("button", { name: /Initiate Transfer/i }));
      expect(mockMutate).toHaveBeenCalledTimes(1);
      const payload = mockMutate.mock.calls[0]![0] as Record<string, unknown>;
      expect(payload).toMatchObject({
        direction: "cross_venue",
        asset: "USDC",
        amount: "250",
      });
      expect(payload.from_venue).toBeTruthy();
      expect(payload.to_venue).toBeTruthy();
      expect(typeof payload.idempotency_key).toBe("string");
    });

    it("also appends the transfer entry to the history via addTransferEntry", () => {
      const addEntry = vi.fn();
      Object.assign(mockData, buildMockAccountsData({ addTransferEntry: addEntry }));
      render(<AccountsTransferWidget {...noopProps} />);
      fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "100" } });
      fireEvent.click(screen.getByRole("button", { name: /Initiate Transfer/i }));
      expect(addEntry).toHaveBeenCalledTimes(1);
      const entry = addEntry.mock.calls[0]![0] as Record<string, unknown>;
      expect(entry).toMatchObject({
        type: "Venue→Venue",
        amount: 100,
        status: "Pending",
      });
    });
  });

  describe("batch-mode guard", () => {
    it("disables submit button and labels it 'Disabled in Batch' in batch mode", () => {
      mockExecutionMode.isBatch = true;
      render(<AccountsTransferWidget {...noopProps} />);
      const btn = screen.getByRole("button", { name: /Disabled in Batch/i }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });

  describe("paper-mode annotation", () => {
    it("tags the history entry type with '(Paper)' in paper mode", () => {
      mockExecutionMode.isPaper = true;
      const addEntry = vi.fn();
      Object.assign(mockData, buildMockAccountsData({ addTransferEntry: addEntry }));
      render(<AccountsTransferWidget {...noopProps} />);
      fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "50" } });
      fireEvent.click(screen.getByRole("button", { name: /Initiate Transfer/i }));
      const entry = addEntry.mock.calls[0]![0] as Record<string, unknown>;
      expect(entry.type).toBe("Venue→Venue (Paper)");
    });
  });

  describe("empty state", () => {
    it("renders 'No accounts available' when balances is empty and not loading", () => {
      Object.assign(mockData, buildMockAccountsData({ balances: [] }));
      render(<AccountsTransferWidget {...noopProps} />);
      expect(screen.getByText(/No accounts available. Connect a venue to initiate a transfer/i)).toBeTruthy();
    });
  });
});
