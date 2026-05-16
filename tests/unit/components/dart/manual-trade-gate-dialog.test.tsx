import "@testing-library/jest-dom/vitest";
import { TestWrapper } from "@/tests/helpers/test-wrapper";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ManualTradeGateDialog } from "@/components/dart/manual-trade-gate-dialog";
import type { PendingInstruction } from "@/lib/api/dart-client";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PENDING_ITEM: PendingInstruction = {
  instruction_id: "instr-001",
  strategy_id: "carry_staked_basis_v1",
  archetype: "carry_staked_basis",
  venue: "BYBIT",
  instrument_id: "ETH-PERP",
  side: "SELL",
  quantity: 1.5,
  price: null,
  algo: "MARKET",
  enqueued_at: new Date(Date.now() - 30_000).toISOString(),
  timeout_at: new Date(Date.now() + 270_000).toISOString(),
  seconds_remaining: 270,
  pre_trade_preview: {
    margin_usd: 3_200,
    position_limit_pct: 0.12,
    worst_case_loss_usd: 480,
  },
};

function makeLister(items: PendingInstruction[]) {
  return vi.fn(async () => items);
}

function makeApprover(result?: { instruction_id: string; action: string; message: string }) {
  return vi.fn(async () => result ?? { instruction_id: "instr-001", action: "approved", message: "ok" });
}

function makeRejecter(result?: { instruction_id: string; action: string; message: string }) {
  return vi.fn(async () => result ?? { instruction_id: "instr-001", action: "rejected", message: "ok" });
}

async function openDialog() {
  fireEvent.click(screen.getByTestId("gate-trigger"));
  await waitFor(() => expect(screen.getByTestId("manual-trade-gate-dialog")).toBeInTheDocument());
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ManualTradeGateDialog", () => {
  it("renders pending instruction cards with pre-trade metrics after opening", async () => {
    render(
      <ManualTradeGateDialog lister={makeLister([PENDING_ITEM])} approver={makeApprover()} rejecter={makeRejecter()}>
        <button data-testid="gate-trigger">Open gate</button>
      </ManualTradeGateDialog>,
      { wrapper: TestWrapper },
    );

    await openDialog();

    expect(screen.getByTestId("manual-trade-gate-card")).toBeInTheDocument();
    expect(screen.getByTestId("manual-trade-gate-margin")).toHaveTextContent("$3,200");
    expect(screen.getByTestId("manual-trade-gate-pos-limit")).toHaveTextContent("12.0%");
    expect(screen.getByTestId("manual-trade-gate-loss")).toHaveTextContent("$480");
    expect(screen.getByTestId("manual-trade-gate-approve")).toBeInTheDocument();
    expect(screen.getByTestId("manual-trade-gate-reject")).toBeInTheDocument();
  });

  it("removes the card after approve and shows empty state when queue drains", async () => {
    const approver = makeApprover();
    render(
      <ManualTradeGateDialog lister={makeLister([PENDING_ITEM])} approver={approver} rejecter={makeRejecter()}>
        <button data-testid="gate-trigger">Open gate</button>
      </ManualTradeGateDialog>,
      { wrapper: TestWrapper },
    );

    await openDialog();

    fireEvent.click(screen.getByTestId("manual-trade-gate-approve"));
    await waitFor(() => expect(approver).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId("manual-trade-gate-empty")).toBeInTheDocument());

    expect(approver.mock.calls[0][0]).toBe("instr-001");
  });

  it("shows an error banner and keeps card visible when approve throws", async () => {
    const failingApprover = vi.fn(async () => {
      throw new Error("503 Service Unavailable — execution-service offline");
    });
    render(
      <ManualTradeGateDialog lister={makeLister([PENDING_ITEM])} approver={failingApprover} rejecter={makeRejecter()}>
        <button data-testid="gate-trigger">Open gate</button>
      </ManualTradeGateDialog>,
      { wrapper: TestWrapper },
    );

    await openDialog();

    fireEvent.click(screen.getByTestId("manual-trade-gate-approve"));
    await waitFor(() => expect(screen.getByTestId("manual-trade-gate-error")).toBeInTheDocument());

    expect(screen.getByTestId("manual-trade-gate-error")).toHaveTextContent(/503 Service Unavailable/);
    expect(screen.getByTestId("manual-trade-gate-card")).toBeInTheDocument();
  });
});
