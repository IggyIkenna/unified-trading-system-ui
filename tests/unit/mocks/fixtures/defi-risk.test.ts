import { describe, expect, it } from "vitest";
import {
  DEFI_RECONCILIATION_RECORDS,
  MOCK_DELTA_EXPOSURES,
  MOCK_PORTFOLIO_DELTA,
  MOCK_REBALANCE_PREVIEW,
  MOCK_TRADE_HISTORY,
  MOCK_TREASURY,
  STRATEGY_RISK_PROFILES,
  computeWeightedMockHealthFactor,
} from "@/lib/mocks/fixtures/defi-risk";

describe("defi-risk fixtures", () => {
  it("STRATEGY_RISK_PROFILES shape", () => {
    expect(Array.isArray(STRATEGY_RISK_PROFILES)).toBe(true);
    expect(STRATEGY_RISK_PROFILES.length).toBeGreaterThan(0);
    const first = STRATEGY_RISK_PROFILES[0];
    expect(typeof first.strategy_id).toBe("string");
    expect(typeof first.health_factor).toBe("number");
    expect(typeof first.liquidity_risk_pct).toBe("number");
  });

  it("MOCK_DELTA_EXPOSURES has numeric fields per entry", () => {
    expect(MOCK_DELTA_EXPOSURES.length).toBeGreaterThan(0);
    for (const e of MOCK_DELTA_EXPOSURES) {
      expect(typeof e.strategy_id).toBe("string");
      expect(typeof e.net_delta_usd).toBe("number");
      expect(typeof e.net_delta_eth).toBe("number");
    }
  });

  it("MOCK_PORTFOLIO_DELTA aggregates per_strategy", () => {
    expect(Array.isArray(MOCK_PORTFOLIO_DELTA.per_strategy)).toBe(true);
    expect(typeof MOCK_PORTFOLIO_DELTA.total_delta_usd).toBe("number");
  });

  it("MOCK_TREASURY snapshot includes share class breakdown", () => {
    const scb = MOCK_TREASURY.share_class_breakdown ?? [];
    expect(scb.length).toBeGreaterThan(0);
    const sc = scb[0];
    expect(typeof sc.share_class).toBe("string");
    expect(typeof sc.nav_usd).toBe("number");
    expect(typeof sc.pct_of_total).toBe("number");
    expect(Array.isArray(sc.strategies)).toBe(true);
  });

  it("MOCK_REBALANCE_PREVIEW has allocations and totals", () => {
    expect(Array.isArray(MOCK_REBALANCE_PREVIEW.allocations)).toBe(true);
    expect(MOCK_REBALANCE_PREVIEW.allocations.length).toBeGreaterThan(0);
    expect(typeof MOCK_REBALANCE_PREVIEW.total_instructions).toBe("number");
    expect(typeof MOCK_REBALANCE_PREVIEW.estimated_gas_usd).toBe("number");
  });

  it("DEFI_RECONCILIATION_RECORDS shape", () => {
    for (const rec of DEFI_RECONCILIATION_RECORDS) {
      expect(typeof rec.id).toBe("string");
      expect(typeof rec.date).toBe("string");
      expect(typeof rec.delta).toBe("number");
      expect(["pending", "resolved", "investigating"]).toContain(rec.status);
    }
  });

  it("MOCK_TRADE_HISTORY rows each carry an instant_pnl object", () => {
    expect(MOCK_TRADE_HISTORY.length).toBeGreaterThan(0);
    for (const row of MOCK_TRADE_HISTORY) {
      expect(typeof row.seq).toBe("number");
      expect(typeof row.venue).toBe("string");
      expect(typeof row.instant_pnl.net_pnl).toBe("number");
    }
  });

  it("computeWeightedMockHealthFactor returns a reasonable HF", () => {
    const hf = computeWeightedMockHealthFactor(MOCK_TREASURY.per_strategy_balance);
    expect(typeof hf).toBe("number");
    expect(hf).toBeGreaterThan(0);
    expect(hf).toBeLessThan(10);
  });

  it("computeWeightedMockHealthFactor returns default 1.85 when no balances", () => {
    // Empty-balance input covers the zero-weight fallback path.
    const emptyBalances = { ...MOCK_TREASURY.per_strategy_balance };
    for (const key of Object.keys(emptyBalances)) {
      emptyBalances[key as keyof typeof emptyBalances] = 0;
    }
    const hf = computeWeightedMockHealthFactor(emptyBalances);
    expect(hf).toBe(1.85);
  });
});
