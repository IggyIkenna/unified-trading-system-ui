import "@testing-library/jest-dom/vitest";
import { TestWrapper } from "@/tests/helpers/test-wrapper";
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  TradeMonitor,
  type ManualInstructionStatusResponse,
} from "@/components/dart/trade-monitor";

function makeSnapshot(
  overrides: Partial<ManualInstructionStatusResponse> = {},
): ManualInstructionStatusResponse {
  return {
    instruction_id: "instr-123",
    status: "pending",
    filled_qty: 0,
    avg_fill_price: null,
    unrealized_pnl: null,
    last_update_ts: "2026-05-10T10:00:00Z",
    ...overrides,
  };
}

describe("TradeMonitor", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders initial pending state with em-dash placeholders before first fetch resolves", () => {
    // Block the fetch so the snapshot stays null long enough to assert.
    const fetcher = vi.fn(() => new Promise<unknown>(() => {}));
    render(<TradeMonitor instructionId="instr-123" fetcher={fetcher} />, { wrapper: TestWrapper });

    expect(screen.getByTestId("trade-monitor")).toBeInTheDocument();
    expect(screen.getByTestId("trade-monitor-status-badge")).toHaveAttribute("data-status", "pending");
  });

  it("renders fetched snapshot once the poll resolves", async () => {
    const fetcher = vi.fn(async () =>
      makeSnapshot({
        status: "partial",
        filled_qty: 0.5,
        avg_fill_price: 65000.5,
        unrealized_pnl: 12.34,
        last_update_ts: "2026-05-10T10:30:00Z",
      }),
    );
    render(<TradeMonitor instructionId="instr-123" fetcher={fetcher} />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByTestId("trade-monitor-status-badge")).toHaveAttribute("data-status", "partial");
    });
    expect(screen.getByTestId("trade-monitor-filled-qty")).toHaveTextContent("0.5000");
    expect(screen.getByTestId("trade-monitor-avg-fill-price")).toHaveTextContent("65,000.50");
    expect(screen.getByTestId("trade-monitor-unrealized-pnl")).toHaveTextContent("12.34");
    expect(screen.getByTestId("trade-monitor-unrealized-pnl")).toHaveAttribute("data-pnl-sign", "positive");
  });

  it("flags negative unrealized P&L on the data attribute", async () => {
    const fetcher = vi.fn(async () =>
      makeSnapshot({ status: "filled", unrealized_pnl: -99.5 }),
    );
    render(<TradeMonitor instructionId="instr-123" fetcher={fetcher} />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByTestId("trade-monitor-unrealized-pnl")).toHaveAttribute(
        "data-pnl-sign",
        "negative",
      );
    });
  });

  it("renders an error banner when the first fetch fails and no snapshot is cached", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("502 Bad Gateway");
    });
    render(<TradeMonitor instructionId="instr-123" fetcher={fetcher} />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByTestId("trade-monitor-error")).toBeInTheDocument();
    });
    expect(screen.getByTestId("trade-monitor-error")).toHaveTextContent("502 Bad Gateway");
  });

  it("preserves the last good snapshot when a subsequent poll fails", async () => {
    let attempt = 0;
    const fetcher = vi.fn(async () => {
      attempt += 1;
      if (attempt === 1) {
        return makeSnapshot({ status: "filled", filled_qty: 1.5 });
      }
      throw new Error("transient network error");
    });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<TradeMonitor instructionId="instr-123" fetcher={fetcher} pollIntervalMs={1000} />, {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(screen.getByTestId("trade-monitor-status-badge")).toHaveAttribute("data-status", "filled");
    });

    await act(async () => {
      vi.advanceTimersByTime(1100);
    });
    // Wait for the second (failing) fetch to complete.
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    // The error is captured but the displayed snapshot stays as the last
    // known good state — operator-grade observability stays intact even
    // mid-network-blip.
    expect(screen.getByTestId("trade-monitor-filled-qty")).toHaveTextContent("1.5000");
  });

  it("polls on the configured interval", async () => {
    const fetcher = vi.fn(async () => makeSnapshot());
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<TradeMonitor instructionId="instr-123" fetcher={fetcher} pollIntervalMs={3000} />, {
      wrapper: TestWrapper,
    });

    // First fetch fires immediately.
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    await act(async () => {
      vi.advanceTimersByTime(3100);
    });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    await act(async () => {
      vi.advanceTimersByTime(3100);
    });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(3));
  });

  it("renders venue + instrument context when present in the response", async () => {
    const fetcher = vi.fn(async () =>
      makeSnapshot({ venue: "Bybit", instrument: "BTC-PERP" }),
    );
    render(<TradeMonitor instructionId="instr-123" fetcher={fetcher} />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByTestId("trade-monitor-context")).toHaveTextContent("BTC-PERP on Bybit");
    });
  });

  it("encodes special characters in the instruction id in the URL", async () => {
    const fetcher = vi.fn(async (url: string) => {
      expect(url).toContain("/api/instructions/instr%2F123/status");
      return makeSnapshot({ instruction_id: "instr/123" });
    });
    render(<TradeMonitor instructionId="instr/123" fetcher={fetcher} />, { wrapper: TestWrapper });

    await waitFor(() => expect(fetcher).toHaveBeenCalled());
  });
});
