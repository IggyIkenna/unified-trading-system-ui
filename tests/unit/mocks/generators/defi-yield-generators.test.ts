import { describe, expect, it } from "vitest";
import {
  STRATEGY_ID_MAP,
  generateAllYieldSeries,
  generateYieldForStrategy,
  generateYieldSummary,
} from "@/lib/mocks/generators/defi-yield-generators";

describe("defi-yield-generators", () => {
  it("generateAllYieldSeries returns one series per strategy def", () => {
    const series = generateAllYieldSeries(30);
    expect(Array.isArray(series)).toBe(true);
    expect(series.length).toBeGreaterThan(0);
    const first = series[0];
    expect(typeof first.strategy_id).toBe("string");
    expect(typeof first.strategy_name).toBe("string");
    expect(typeof first.target_apy_pct).toBe("number");
    expect(typeof first.capital_usd).toBe("number");
    expect(typeof first.color).toBe("string");
    expect(Array.isArray(first.data)).toBe(true);
    expect(first.data.length).toBe(30);
    const dp = first.data[0];
    expect(typeof dp.date).toBe("string");
    expect(typeof dp.apy_pct).toBe("number");
    expect(typeof dp.cumulative_pnl_usd).toBe("number");
    expect(typeof dp.daily_pnl_usd).toBe("number");
  });

  it("generateYieldForStrategy returns a series for a known id, null otherwise", () => {
    const first = generateAllYieldSeries(5)[0];
    const series = generateYieldForStrategy(first.strategy_id, 10);
    expect(series).not.toBeNull();
    expect(series?.strategy_id).toBe(first.strategy_id);
    expect(series?.data.length).toBe(10);

    expect(generateYieldForStrategy("UNKNOWN_STRAT_ID", 5)).toBeNull();
  });

  it("generateYieldSummary returns one summary per strategy", () => {
    const summary = generateYieldSummary(60);
    expect(Array.isArray(summary)).toBe(true);
    expect(summary.length).toBeGreaterThan(0);
    for (const row of summary) {
      expect(typeof row.strategy_id).toBe("string");
      expect(typeof row.strategy_name).toBe("string");
    }
  });

  it("STRATEGY_ID_MAP maps presentation IDs to UI IDs", () => {
    expect(typeof STRATEGY_ID_MAP).toBe("object");
    expect(Object.keys(STRATEGY_ID_MAP).length).toBeGreaterThan(0);
  });
});
