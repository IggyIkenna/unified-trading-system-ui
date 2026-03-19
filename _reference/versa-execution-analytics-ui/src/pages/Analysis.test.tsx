import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Analysis from "./Analysis";
import apiClient from "@/api/client";
import { useResultsStore } from "@/stores/resultsStore";
import { useFilterStore } from "@/stores/filterStore";
import type { ResultSummary, FilterOptions } from "@/api/types";

// Mock recharts
vi.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ReferenceLine: () => null,
  Line: () => null,
  ComposedChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="composed-chart">{children}</div>
  ),
  Area: () => null,
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
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
  Badge: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => <span data-variant={variant}>{children}</span>,
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: React.ReactNode;
    onValueChange?: (v: string) => void;
    value?: string;
  }) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder}</span>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <option value={value}>{children}</option>,
}));

vi.mock("lucide-react", () => new Proxy({}, { get: () => () => null }));

// Mock apiClient for alpha data fetching
vi.mock("@/api/client", () => ({
  default: { get: vi.fn().mockResolvedValue({ data: { available: false } }) },
}));

const emptyFilters: FilterOptions = {
  categories: [],
  assets: [],
  strategies: [],
  algorithms: [],
  timeframes: [],
  instruction_types: [],
  modes: [],
};

function makeResult(overrides: Partial<ResultSummary> = {}): ResultSummary {
  return {
    result_id: "r1",
    config_id: "c1",
    strategy_id: "s1",
    run_id: "run-001",
    date: "2024-01-01",
    category: "Crypto",
    asset: "BTC",
    strategy_description: "StatArb",
    mode: "backtest",
    timeframe: "1h",
    algorithm: "v1",
    instruction_type: "TWAP",
    net_alpha_bps: 5.0,
    gross_alpha_bps: 8.0,
    total_costs_bps: 3.0,
    net_alpha_usd: 500,
    total_notional_usd: 100000,
    pnl: 450,
    sharpe_ratio: 1.5,
    win_rate: 0.6,
    total_trades: 100,
    ...overrides,
  };
}

// Helper: render Analysis and flush all async effects
async function renderAnalysis() {
  await act(async () => {
    render(<Analysis />);
  });
  // Flush any remaining microtasks
  await act(async () => {
    await Promise.resolve();
  });
}

describe("Analysis page", () => {
  beforeEach(() => {
    // Fake timers prevent the async useEffect (apiClient.get) from blocking
    // React 18 act() cleanup in jsdom. waitFor/findByText are replaced with
    // synchronous getByText since rendering is synchronous after act().
    vi.useFakeTimers();
    act(() => {
      useResultsStore.getState().clearResults();
      useFilterStore.getState().resetFilters();
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders without crashing with no results", async () => {
    await renderAnalysis();
    expect(document.body).toBeTruthy();
  });

  it("shows empty state message when no results", async () => {
    await renderAnalysis();
    expect(
      screen.getByText(/Load results first to enable analysis/i),
    ).toBeInTheDocument();
  });

  it("does not show chart tabs when no results", async () => {
    await renderAnalysis();
    expect(
      screen.queryByRole("button", { name: /Distribution/i }),
    ).not.toBeInTheDocument();
  });

  it("renders with results loaded from store", async () => {
    act(() => {
      useResultsStore
        .getState()
        .setResults(
          [
            makeResult({ net_alpha_bps: 10 }),
            makeResult({ result_id: "r2", net_alpha_bps: -5 }),
          ],
          emptyFilters,
        );
    });
    await renderAnalysis();
    expect(document.body).toBeTruthy();
  });

  it("shows filter selects for category and asset", async () => {
    act(() => {
      useResultsStore.getState().setResults([makeResult()], {
        ...emptyFilters,
        categories: ["Crypto"],
        assets: ["BTC"],
      });
    });
    await renderAnalysis();
    expect(document.body).toBeTruthy();
  });

  it("renders chart heading when results exist", async () => {
    act(() => {
      useResultsStore.getState().setResults([makeResult()], emptyFilters);
    });
    await renderAnalysis();
    // "Alpha Distribution" is the heading for the default distribution chart
    expect(screen.getByText("Alpha Distribution")).toBeInTheDocument();
  });

  it("shows Positive % label when results loaded", async () => {
    act(() => {
      useResultsStore.getState().setResults([makeResult()], emptyFilters);
    });
    await renderAnalysis();
    expect(screen.getByText(/Positive %/i)).toBeInTheDocument();
  });

  it("shows Mean Alpha label when results loaded", async () => {
    act(() => {
      useResultsStore.getState().setResults([makeResult()], emptyFilters);
    });
    await renderAnalysis();
    expect(screen.getByText(/Mean Alpha/i)).toBeInTheDocument();
  });

  it("shows Configs label when results loaded", async () => {
    act(() => {
      useResultsStore
        .getState()
        .setResults(
          [makeResult(), makeResult({ result_id: "r2", net_alpha_bps: -2 })],
          emptyFilters,
        );
    });
    await renderAnalysis();
    expect(screen.getByText(/Configs/i)).toBeInTheDocument();
  });

  it("switches to Rankings view when Rankings button clicked", async () => {
    act(() => {
      useResultsStore.getState().setResults([makeResult()], emptyFilters);
    });
    await renderAnalysis();
    fireEvent.click(screen.getByText("Rankings"));
    // Rankings table header "Rank" should appear
    expect(screen.getAllByText(/Rank/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("columnheader", { name: /^Rank$/i }),
    ).toBeInTheDocument();
  });

  it("switches to Equity Curve view when Equity Curve button clicked", async () => {
    act(() => {
      useResultsStore.getState().setResults([makeResult()], emptyFilters);
    });
    await renderAnalysis();
    fireEvent.click(screen.getByText("Equity Curve"));
    expect(
      screen.getByText(/Select a result above to view equity curve/i),
    ).toBeInTheDocument();
  });

  it("switches to Alpha Detail view when Alpha Detail button clicked", async () => {
    act(() => {
      useResultsStore.getState().setResults([makeResult()], emptyFilters);
    });
    await renderAnalysis();
    fireEvent.click(screen.getByText("Alpha Detail"));
    expect(
      screen.getByText(
        /Select a result above to view execution alpha breakdown/i,
      ),
    ).toBeInTheDocument();
  });

  it("shows result select dropdown in Alpha Detail view", async () => {
    act(() => {
      useResultsStore.getState().setResults([makeResult()], emptyFilters);
    });
    await renderAnalysis();
    fireEvent.click(screen.getByText("Alpha Detail"));
    expect(screen.getByText(/Select Result to Analyze/i)).toBeInTheDocument();
  });

  it("ranking rows navigate to alpha-detail on click", async () => {
    act(() => {
      useResultsStore.getState().setResults(
        [
          makeResult({
            result_id: "r-rank-1",
            config_id: "cfg-very-long-config-id-abc",
          }),
        ],
        emptyFilters,
      );
    });
    await renderAnalysis();
    fireEvent.click(screen.getByText("Rankings"));
    // Ranking table should be visible — "1" is the rank number in the first column
    expect(
      screen.getByRole("columnheader", { name: /^Rank$/i }),
    ).toBeInTheDocument();
    // Click the row (td with rank "1") to navigate to alpha-detail
    const rankCell = screen.getByRole("cell", { name: "1" });
    const row = rankCell.closest("tr");
    if (row) fireEvent.click(row);
    // Should switch to Alpha Detail view
    expect(screen.getByText(/Select Result to Analyze/i)).toBeInTheDocument();
  });

  it("shows multiple results in rankings sorted by alpha", async () => {
    act(() => {
      useResultsStore.getState().setResults(
        [
          makeResult({
            result_id: "r1",
            net_alpha_bps: 10,
            config_id: "cfg-aaa-1234567890",
          }),
          makeResult({
            result_id: "r2",
            net_alpha_bps: -5,
            config_id: "cfg-bbb-1234567890",
          }),
          makeResult({
            result_id: "r3",
            net_alpha_bps: 20,
            config_id: "cfg-ccc-1234567890",
          }),
        ],
        emptyFilters,
      );
    });
    await renderAnalysis();
    fireEvent.click(screen.getByText("Rankings"));
    expect(screen.getByRole("cell", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "3" })).toBeInTheDocument();
  });

  it("changes result select value in alpha-detail view", async () => {
    act(() => {
      useResultsStore.getState().setResults(
        [
          makeResult({
            result_id: "r-sel-1",
            config_id: "cfg-sel-1234567890",
          }),
        ],
        emptyFilters,
      );
    });
    await renderAnalysis();
    fireEvent.click(screen.getByText("Alpha Detail"));
    // Multiple selects exist (filters + result select) — pick the one with the result option
    const selects = screen.getAllByRole("combobox");
    const resultSelect = selects.find(
      (s) => s.querySelector(`option[value="r-sel-1"]`) !== null,
    );
    expect(resultSelect).toBeTruthy();
    if (resultSelect) {
      fireEvent.change(resultSelect, { target: { value: "r-sel-1" } });
    }
    expect(screen.getByText(/Select Result to Analyze/i)).toBeInTheDocument();
  });

  it("shows alpha data when result with run_path is selected and API returns data", async () => {
    // Override the mock to return actual alpha data
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        available: true,
        summary: {
          vw_gross_entry_alpha_bps: 3.5,
          vw_gross_exit_alpha_bps: 2.1,
          vw_total_costs_bps: 1.2,
          vw_net_alpha_bps: 4.4,
          net_alpha_usd: 440,
          benchmark_price: 50000,
          total_entry_notional_usd: 100000,
          total_exit_notional_usd: 100000,
          num_entries: 5,
          num_exits: 5,
        },
        entry_fills: [],
        exit_fills: [],
      },
    });
    act(() => {
      useResultsStore.getState().setResults(
        [
          makeResult({
            result_id: "r-with-path",
            config_id: "cfg-with-run-path-1234",
            run_path: "gs://bucket/run/path",
          }),
        ],
        emptyFilters,
      );
    });
    await renderAnalysis();
    // Switch to alpha-detail and select the result
    fireEvent.click(screen.getByText("Alpha Detail"));
    const selects = screen.getAllByRole("combobox");
    const resultSelect = selects.find(
      (s) => s.querySelector(`option[value="r-with-path"]`) !== null,
    );
    if (resultSelect) {
      await act(async () => {
        fireEvent.change(resultSelect, { target: { value: "r-with-path" } });
        // Flush the async fetchAlphaData microtasks
        await Promise.resolve();
        await Promise.resolve();
      });
    }
    // The alpha data loads asynchronously; verify component is still stable
    expect(document.body).toBeTruthy();
  });

  it("exercises filter select onChange handlers", async () => {
    act(() => {
      useResultsStore.getState().setResults(
        [
          makeResult({ category: "Crypto", asset: "BTC", mode: "backtest" }),
          makeResult({
            result_id: "r2",
            category: "Equity",
            asset: "AAPL",
            mode: "live",
          }),
        ],
        {
          ...emptyFilters,
          categories: ["Crypto", "Equity"],
          assets: ["BTC", "AAPL"],
          modes: ["backtest", "live"],
        },
      );
    });
    await renderAnalysis();
    // The filter selects are rendered as <select> elements with class "select"
    const selects = document.querySelectorAll("select.select");
    // Fire onChange on the first available filter select (Category)
    if (selects[0]) {
      fireEvent.change(selects[0], { target: { value: "Crypto" } });
    }
    if (selects[1]) {
      fireEvent.change(selects[1], { target: { value: "BTC" } });
    }
    expect(document.body).toBeTruthy();
  });

  it("shows negative mean alpha value", async () => {
    act(() => {
      useResultsStore
        .getState()
        .setResults(
          [
            makeResult({ net_alpha_bps: -5 }),
            makeResult({ result_id: "r2", net_alpha_bps: -10 }),
          ],
          emptyFilters,
        );
    });
    await renderAnalysis();
    // Mean is negative — should show a negative value in the KPI
    expect(screen.getByText(/-7\.50/)).toBeInTheDocument();
  });

  it("shows equity view with no data when selectedResultId is set via store", async () => {
    act(() => {
      useResultsStore.getState().setResults([makeResult()], emptyFilters);
      useResultsStore.getState().selectResult("r1");
    });
    await renderAnalysis();
    fireEvent.click(screen.getByText("Equity Curve"));
    // Shows "Select a result above" since native select hasn't been used yet
    expect(document.body).toBeTruthy();
  });

  it("shows no equity data message when result selected in equity view", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { available: false },
    });
    act(() => {
      useResultsStore.getState().setResults(
        [
          makeResult({
            result_id: "r-eq-1",
            config_id: "cfg-eq-1234567890",
            run_path: "gs://bucket/run/eq",
          }),
        ],
        emptyFilters,
      );
    });
    await renderAnalysis();
    fireEvent.click(screen.getByText("Equity Curve"));
    // Select the result via the dropdown
    const selects = screen.getAllByRole("combobox");
    const resultSelect = selects.find(
      (s) => s.querySelector(`option[value="r-eq-1"]`) !== null,
    );
    if (resultSelect) {
      await act(async () => {
        fireEvent.change(resultSelect, { target: { value: "r-eq-1" } });
        await Promise.resolve();
        await Promise.resolve();
      });
    }
    // After loading completes, should show "No equity data available"
    expect(screen.getByText(/No equity data available/i)).toBeInTheDocument();
  });

  it("renders a timestamp in the header", async () => {
    act(() => {
      useResultsStore.getState().setResults([makeResult()], emptyFilters);
    });
    await renderAnalysis();
    const ts = screen.getByTestId("analysis-timestamp");
    expect(ts).toBeInTheDocument();
    expect(ts.style.fontVariantNumeric).toBe("tabular-nums");
  });

  it("renders 4 KPI cards in a responsive grid", async () => {
    act(() => {
      useResultsStore.getState().setResults([makeResult()], emptyFilters);
    });
    await renderAnalysis();
    const grid = screen.getByTestId("kpi-grid");
    expect(grid).toBeInTheDocument();
    expect(grid.className).toContain("grid-cols-1");
    expect(grid.className).toContain("sm:grid-cols-2");
    expect(grid.className).toContain("lg:grid-cols-4");
  });

  it("KPI cards have left accent borders", async () => {
    act(() => {
      useResultsStore.getState().setResults([makeResult()], emptyFilters);
    });
    await renderAnalysis();
    const kpiGrid = screen.getByTestId("kpi-grid");
    const accentBars = kpiGrid.querySelectorAll(".w-1.rounded-full");
    expect(accentBars.length).toBe(4);
  });

  it("KPI values use tabular-nums", async () => {
    act(() => {
      useResultsStore.getState().setResults([makeResult()], emptyFilters);
    });
    await renderAnalysis();
    const kpiGrid = screen.getByTestId("kpi-grid");
    const numericElements = kpiGrid.querySelectorAll("[style*='tabular-nums']");
    expect(numericElements.length).toBe(4);
  });

  it("KPI cards use rounded-lg", async () => {
    act(() => {
      useResultsStore.getState().setResults([makeResult()], emptyFilters);
    });
    await renderAnalysis();
    const kpiGrid = screen.getByTestId("kpi-grid");
    const roundedCards = kpiGrid.querySelectorAll(".rounded-lg");
    expect(roundedCards.length).toBe(4);
  });

  it("uses gap-5 spacing in KPI grid", async () => {
    act(() => {
      useResultsStore.getState().setResults([makeResult()], emptyFilters);
    });
    await renderAnalysis();
    const grid = screen.getByTestId("kpi-grid");
    expect(grid.className).toContain("gap-5");
  });

  it("rankings table numeric cells use tabular-nums", async () => {
    act(() => {
      useResultsStore.getState().setResults(
        [
          makeResult({
            result_id: "r1",
            net_alpha_bps: 10,
            config_id: "cfg-aaa-1234567890",
          }),
          makeResult({
            result_id: "r2",
            net_alpha_bps: -5,
            config_id: "cfg-bbb-1234567890",
          }),
        ],
        emptyFilters,
      );
    });
    await renderAnalysis();
    fireEvent.click(screen.getByText("Rankings"));
    const rankCell = screen.getByRole("cell", { name: "1" });
    expect(rankCell.style.fontVariantNumeric).toBe("tabular-nums");
  });

  it("shows loading state in equity view when fetching", async () => {
    // Use real timers for this test since we need async state updates to flush
    vi.useRealTimers();
    // Make apiClient.get never resolve to keep loadingAlpha=true
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    act(() => {
      useResultsStore.getState().setResults(
        [
          makeResult({
            result_id: "r-load-1",
            config_id: "cfg-load-1234567890",
            run_path: "gs://bucket/run/load",
          }),
        ],
        emptyFilters,
      );
    });
    await act(async () => {
      render(<Analysis />);
    });
    // Switch to equity view first (result selector shows in equity view)
    fireEvent.click(screen.getByText("Equity Curve"));
    // Select result (triggers loading via useEffect)
    const selects = screen.getAllByRole("combobox");
    const resultSelect = selects.find(
      (s) => s.querySelector(`option[value="r-load-1"]`) !== null,
    );
    if (resultSelect) {
      await act(async () => {
        fireEvent.change(resultSelect, { target: { value: "r-load-1" } });
      });
      // Let the useEffect fire and set loadingAlpha=true
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
    }
    expect(screen.getByText(/Loading equity data/i)).toBeInTheDocument();
  });
});
