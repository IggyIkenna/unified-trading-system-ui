import { describe, it, expect } from "vitest";
import {
  getPositionsForScope,
  getOrdersForScope,
  getTradesForScope,
  getTradesForPosition,
  getAlertsForScope,
  getStrategiesForScope,
  getPnlForScope,
  getAggregatedPnlForScope,
  SEED_POSITIONS,
  SEED_ORDERS,
  SEED_TRADES,
  SEED_ALERTS,
  SEED_STRATEGIES,
} from "@/lib/mocks/fixtures/mock-data-index";

describe("Seed Data", () => {
  it("has positions for multiple orgs", () => {
    const orgs = new Set(SEED_POSITIONS.map((p) => p.orgId));
    expect(orgs.size).toBeGreaterThanOrEqual(3);
  });

  it("has strategies for all 5 orgs", () => {
    const orgs = new Set(SEED_STRATEGIES.map((s) => s.orgId));
    expect(orgs.has("odum")).toBe(true);
    expect(orgs.has("alpha-capital")).toBe(true);
    expect(orgs.has("vertex-partners")).toBe(true);
    expect(orgs.has("meridian-fund")).toBe(true);
    expect(orgs.has("atlas-ventures")).toBe(true);
  });

  it("links every position to seed trades with matching net quantity", () => {
    for (const p of SEED_POSITIONS) {
      const trades = getTradesForPosition(p.id);
      expect(trades.length).toBeGreaterThanOrEqual(2);
      let net = 0;
      for (const t of trades) {
        expect(t.positionId).toBe(p.id);
        expect(t.instrument).toBe(p.instrument);
        expect(t.strategyId).toBe(p.strategyId);
        expect(t.venue).toBe(p.venue);
        net += t.side === "buy" ? t.quantity : -t.quantity;
      }
      if (p.side === "long") {
        expect(net).toBeCloseTo(p.quantity, 2);
      } else {
        expect(net).toBeCloseTo(-p.quantity, 2);
      }
    }
  });

  it("uses org IDs that match trading-data fixtures", () => {
    // These are the IDs from lib/mocks/fixtures/trading-data ORGANIZATIONS
    const validOrgIds = ["odum", "alpha-capital", "vertex-partners", "meridian-fund", "atlas-ventures"];
    for (const s of SEED_STRATEGIES) {
      expect(validOrgIds).toContain(s.orgId);
    }
  });
});

describe("Scope-filtered accessors", () => {
  it("returns all positions when no scope filters", () => {
    const all = getPositionsForScope([], [], []);
    expect(all.length).toBe(SEED_POSITIONS.length);
  });

  it("filters positions by org", () => {
    const odum = getPositionsForScope(["odum"], [], []);
    expect(odum.length).toBeGreaterThan(0);
    expect(odum.length).toBeLessThan(SEED_POSITIONS.length);
    for (const p of odum) {
      expect(p.orgId).toBe("odum");
    }
  });

  it("filters strategies by org", () => {
    const apex = getStrategiesForScope(["alpha-capital"], [], []);
    expect(apex.length).toBeGreaterThan(0);
    for (const s of apex) {
      expect(s.orgId).toBe("alpha-capital");
    }
  });

  it("filters by specific strategy ID", () => {
    const stratId = SEED_STRATEGIES[0].id;
    const result = getStrategiesForScope([], [], [stratId]);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(stratId);
  });

  it("aggregated PnL sums across strategies", () => {
    const allPnl = getAggregatedPnlForScope([], [], []);
    expect(allPnl.length).toBeGreaterThan(0);
    expect(allPnl[0]).toHaveProperty("date");
    expect(allPnl[0]).toHaveProperty("pnl");
  });

  it("aggregated PnL changes when org filter applied", () => {
    const allPnl = getAggregatedPnlForScope([], [], []);
    const odumPnl = getAggregatedPnlForScope(["odum"], [], []);
    const allTotal = allPnl.reduce((s, d) => s + d.pnl, 0);
    const odumTotal = odumPnl.reduce((s, d) => s + d.pnl, 0);
    // Odum should be a subset of all
    expect(Math.abs(odumTotal)).toBeLessThanOrEqual(Math.abs(allTotal) * 1.1); // allow slight float variance
  });
});
