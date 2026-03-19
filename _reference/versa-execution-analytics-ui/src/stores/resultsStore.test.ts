import { describe, it, expect, beforeEach } from "vitest";
import { useResultsStore } from "./resultsStore";
import type { ResultSummary, FilterOptions } from "../api/types";
import { act } from "@testing-library/react";

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

const emptyFilters: FilterOptions = {
  categories: [],
  assets: [],
  strategies: [],
  algorithms: [],
  timeframes: [],
  instruction_types: [],
  modes: [],
};

function getStore() {
  return useResultsStore.getState();
}

describe("resultsStore", () => {
  beforeEach(() => {
    act(() => {
      useResultsStore.getState().clearResults();
    });
  });

  it("starts with empty results and null selectedResultId", () => {
    const state = getStore();
    expect(state.results).toHaveLength(0);
    expect(state.selectedResultId).toBeNull();
  });

  it("setResults replaces results and filters", () => {
    const results = [makeResult({ result_id: "r1" })];
    const filters: FilterOptions = { ...emptyFilters, categories: ["Crypto"] };
    act(() => {
      getStore().setResults(results, filters);
    });
    expect(getStore().results).toHaveLength(1);
    expect(getStore().filters.categories).toEqual(["Crypto"]);
  });

  it("addResults appends new unique results", () => {
    const r1 = makeResult({ result_id: "r1" });
    const r2 = makeResult({ result_id: "r2" });
    act(() => {
      getStore().setResults([r1], emptyFilters);
    });
    act(() => {
      getStore().addResults([r2]);
    });
    expect(getStore().results).toHaveLength(2);
  });

  it("addResults deduplicates by result_id", () => {
    const r1 = makeResult({ result_id: "r1" });
    act(() => {
      getStore().setResults([r1], emptyFilters);
    });
    // Adding same r1 again should not increase count
    act(() => {
      getStore().addResults([r1]);
    });
    expect(getStore().results).toHaveLength(1);
  });

  it("addResults only adds truly new results when mixed", () => {
    const r1 = makeResult({ result_id: "r1" });
    const r2 = makeResult({ result_id: "r2" });
    const r3 = makeResult({ result_id: "r3" });
    act(() => {
      getStore().setResults([r1, r2], emptyFilters);
    });
    // r2 is duplicate, r3 is new
    act(() => {
      getStore().addResults([r2, r3]);
    });
    expect(getStore().results).toHaveLength(3);
    expect(getStore().results.map((r) => r.result_id)).toContain("r3");
  });

  it("clearResults empties results and resets selectedResultId", () => {
    act(() => {
      getStore().setResults([makeResult()], emptyFilters);
      getStore().selectResult("r1");
    });
    act(() => {
      getStore().clearResults();
    });
    const state = getStore();
    expect(state.results).toHaveLength(0);
    expect(state.selectedResultId).toBeNull();
  });

  it("selectResult sets selectedResultId", () => {
    act(() => {
      getStore().selectResult("r1");
    });
    expect(getStore().selectedResultId).toBe("r1");
  });

  it("selectResult can be set to null", () => {
    act(() => {
      getStore().selectResult("r1");
    });
    act(() => {
      getStore().selectResult(null);
    });
    expect(getStore().selectedResultId).toBeNull();
  });

  it("clearResults resets filters to empty", () => {
    const filters: FilterOptions = { ...emptyFilters, categories: ["Crypto"] };
    act(() => {
      getStore().setResults([makeResult()], filters);
    });
    act(() => {
      getStore().clearResults();
    });
    expect(getStore().filters.categories).toEqual([]);
  });
});
