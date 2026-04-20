import { describe, expect, it } from "vitest";
import {
  CATEGORY_COLORS,
  RISK_COLORS,
  STATUS_COLORS,
  STRATEGY_CATALOG,
  getCatalogSummary,
  getStrategiesByCategory,
  getStrategiesByFamily,
  getStrategiesByRiskLevel,
  getStrategiesByStatus,
  getStrategyById,
} from "@/lib/mocks/fixtures/strategy-catalog-data";

describe("strategy-catalog-data fixtures", () => {
  it("CATEGORY_COLORS covers the 5 categories", () => {
    expect(Object.keys(CATEGORY_COLORS).sort()).toEqual(
      ["CEFI", "DEFI", "PREDICTION", "SPORTS", "TRADFI"].sort(),
    );
  });

  it("RISK_COLORS covers the 4 risk levels", () => {
    expect(Object.keys(RISK_COLORS).sort()).toEqual(
      ["HIGH", "LOW", "MEDIUM", "VERY_HIGH"].sort(),
    );
  });

  it("STATUS_COLORS covers all readiness statuses", () => {
    expect(Object.keys(STATUS_COLORS).sort()).toEqual(
      ["BACKTEST", "LIVE", "PAPER", "RESEARCH", "STAGING", "SUSPENDED"].sort(),
    );
  });

  it("STRATEGY_CATALOG is a non-empty array of well-formed entries", () => {
    expect(Array.isArray(STRATEGY_CATALOG)).toBe(true);
    expect(STRATEGY_CATALOG.length).toBeGreaterThan(0);
    const first = STRATEGY_CATALOG[0];
    expect(typeof first.strategy_id).toBe("string");
    expect(typeof first.name).toBe("string");
    expect(typeof first.description).toBe("string");
    expect(typeof first.performance.expected_sharpe).toBe("number");
    expect(Array.isArray(first.performance.monthly_returns)).toBe(true);
    expect(typeof first.risk.max_position_usd).toBe("number");
    expect(typeof first.money_ops.min_deposit_usd).toBe("number");
  });

  it("strategy_ids are unique across the catalog", () => {
    const ids = STRATEGY_CATALOG.map((s) => s.strategy_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getStrategyById returns a matching entry, undefined otherwise", () => {
    const [probe] = STRATEGY_CATALOG;
    const found = getStrategyById(probe.strategy_id);
    expect(found?.strategy_id).toBe(probe.strategy_id);
    expect(getStrategyById("does_not_exist_123")).toBeUndefined();
  });

  it("getStrategiesByCategory filters by category", () => {
    const defi = getStrategiesByCategory("DEFI");
    for (const s of defi) expect(s.category).toBe("DEFI");
  });

  it("getStrategiesByFamily filters by family", () => {
    const [probe] = STRATEGY_CATALOG;
    const fam = getStrategiesByFamily(probe.family);
    for (const s of fam) expect(s.family).toBe(probe.family);
    expect(fam.length).toBeGreaterThan(0);
  });

  it("getStrategiesByStatus filters by status", () => {
    const live = getStrategiesByStatus("LIVE");
    for (const s of live) expect(s.readiness.status).toBe("LIVE");
  });

  it("getStrategiesByRiskLevel filters by risk level", () => {
    const medium = getStrategiesByRiskLevel("MEDIUM");
    for (const s of medium) expect(s.risk.risk_level).toBe("MEDIUM");
  });

  it("getCatalogSummary totals match catalog size", () => {
    const summary = getCatalogSummary();
    expect(summary.total).toBe(STRATEGY_CATALOG.length);
    expect(summary.liveCount).toBeGreaterThanOrEqual(0);
    const byCategoryTotal = Object.values(summary.byCategory).reduce((a, b) => a + b, 0);
    expect(byCategoryTotal).toBe(summary.total);
  });
});
