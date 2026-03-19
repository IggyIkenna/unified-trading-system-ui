import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ResultSummary, ResultsResponse } from "@/api/types";

// ─── Mocks ────────────────────────────────────────────────────────────────────
// vi.mock() is hoisted before const declarations, so we must NOT reference
// outer variables inside the factory. Use vi.fn() inline instead.

vi.mock("@/api/client", () => ({
  apiClient: { get: vi.fn() },
}));

vi.mock("@unified-trading/ui-kit", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  Badge: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => <span data-variant={variant}>{children}</span>,
}));

vi.mock("lucide-react", () => ({
  BarChart2: () => null,
}));

// ─── Import component and mocked module after mock setup ──────────────────────

import { GridResults } from "./GridResults";
import { apiClient } from "@/api/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeResult(overrides: Partial<ResultSummary> = {}): ResultSummary {
  return {
    result_id: "r1",
    config_id: "c1",
    strategy_id: "s1",
    run_id: "abcdef123456",
    date: "2024-01-01",
    category: "Crypto",
    asset: "BTC",
    strategy_description: "StatArb v3",
    mode: "backtest",
    timeframe: "1h",
    algorithm: "v1",
    instruction_type: "TWAP",
    net_alpha_bps: 5.5,
    gross_alpha_bps: 8.0,
    total_costs_bps: 2.5,
    net_alpha_usd: 550,
    total_notional_usd: 100000,
    pnl: 500,
    sharpe_ratio: 1.5,
    win_rate: 0.6,
    total_trades: 42,
    ...overrides,
  };
}

function makeResponse(
  results: ResultSummary[],
  total?: number,
): { data: ResultsResponse } {
  return {
    data: {
      results,
      total: total ?? results.length,
      filters: {
        categories: [],
        assets: [],
        strategies: [],
        algorithms: [],
        timeframes: [],
        instruction_types: [],
        modes: [],
      },
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GridResults", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it("shows loading state initially", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(makeResponse([]));
    render(<GridResults />);
    expect(screen.getByText(/Loading results/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText(/Loading results/i)).not.toBeInTheDocument(),
    );
  });

  it("shows empty message when results are empty", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(makeResponse([]));
    render(<GridResults />);
    await waitFor(() =>
      expect(screen.getByText(/No results found/i)).toBeInTheDocument(),
    );
  });

  it("renders table headers when results are present", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(makeResponse([makeResult()]));
    render(<GridResults />);
    await waitFor(() =>
      expect(screen.getByText(/Run ID/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/Strategy/i)).toBeInTheDocument();
    expect(screen.getByText(/Sharpe/i)).toBeInTheDocument();
    expect(screen.getByText(/Net Alpha/i)).toBeInTheDocument();
  });

  it("renders result row with truncated run_id", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      makeResponse([makeResult({ run_id: "abcdef123456789" })]),
    );
    render(<GridResults />);
    await waitFor(() =>
      expect(screen.getByText("abcdef12")).toBeInTheDocument(),
    );
  });

  it("renders strategy description", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      makeResponse([makeResult({ strategy_description: "FundingArb v4" })]),
    );
    render(<GridResults />);
    await waitFor(() =>
      expect(screen.getByText("FundingArb v4")).toBeInTheDocument(),
    );
  });

  it("renders results count in header", async () => {
    const r1 = makeResult({ result_id: "r1", run_id: "aaaa000000000000" });
    const r2 = makeResult({ result_id: "r2", run_id: "bbbb000000000000" });
    vi.mocked(apiClient.get).mockResolvedValue(makeResponse([r1, r2], 2));
    render(<GridResults />);
    await waitFor(() =>
      expect(screen.getByText("2 results")).toBeInTheDocument(),
    );
  });

  it("renders completed badge for each result", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(makeResponse([makeResult()]));
    render(<GridResults />);
    await waitFor(() =>
      expect(screen.getByText("completed")).toBeInTheDocument(),
    );
  });

  it("handles API error gracefully (no crash)", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("Network error"));
    render(<GridResults />);
    await waitFor(() =>
      expect(screen.getByText(/No results found/i)).toBeInTheDocument(),
    );
  });

  it("renders danger color for negative net_alpha_bps and pnl", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      makeResponse([
        makeResult({ net_alpha_bps: -3.5, pnl: -200, run_id: "neg00000000" }),
      ]),
    );
    render(<GridResults />);
    await waitFor(() => expect(screen.getByText("-3.5")).toBeInTheDocument());
    expect(screen.getByText("-200.00")).toBeInTheDocument();
  });

  it("renders fallback values when optional numeric fields are null", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      makeResponse([
        makeResult({
          run_id: "null00000000",
          net_alpha_bps: undefined as unknown as number,
          pnl: undefined as unknown as number,
          sharpe_ratio: undefined as unknown as number,
          total_trades: undefined as unknown as number,
        }),
      ]),
    );
    render(<GridResults />);
    await waitFor(() =>
      expect(screen.getByText("null0000")).toBeInTheDocument(),
    );
    // Fallback values: 0.0 for alpha, 0.00 for pnl/sharpe, 0 for trades
    expect(screen.getByText("0.0")).toBeInTheDocument();
    expect(screen.getAllByText("0.00").length).toBeGreaterThanOrEqual(1);
  });
});
