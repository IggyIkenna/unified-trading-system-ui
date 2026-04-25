import {
  ACCOUNTS,
  CLIENTS,
  getAccountsForClient,
  getAccountsForVenue,
  getAggregatedPnL,
  getAggregatedTimeSeries,
  getFilteredAlerts,
  getFilteredServices,
  getFilteredStrategies,
  getLiveBatchDelta,
  getStrategyPerformance,
  getStrategyServices,
  getToday,
  getYesterday,
  ORGANIZATIONS,
  SERVICE_asset_group_MAP,
  SERVICE_VENUE_MAP,
  STRATEGIES,
  type Alert,
  type FilterContext,
} from "@/lib/mocks/fixtures/trading-data";
import { describe, expect, it } from "vitest";

const BASE_FILTER: FilterContext = {
  organizationIds: [],
  clientIds: [],
  strategyIds: [],
  mode: "live",
  date: "2026-04-01",
};

describe("trading-data fixtures", () => {
  it("ORGANIZATIONS / CLIENTS / STRATEGIES / ACCOUNTS are non-empty", () => {
    expect(ORGANIZATIONS.length).toBeGreaterThan(0);
    expect(CLIENTS.length).toBeGreaterThan(0);
    expect(STRATEGIES.length).toBeGreaterThan(0);
    expect(ACCOUNTS.length).toBeGreaterThan(0);
  });

  it("ORGANIZATIONS entries have id/name/type", () => {
    for (const o of ORGANIZATIONS) {
      expect(typeof o.id).toBe("string");
      expect(typeof o.name).toBe("string");
      expect(["internal", "external"]).toContain(o.type);
    }
  });

  it("CLIENTS entries reference an existing organisation", () => {
    const orgIds = new Set(ORGANIZATIONS.map((o) => o.id));
    for (const c of CLIENTS) {
      expect(orgIds.has(c.orgId)).toBe(true);
    }
  });

  it("STRATEGIES entries each reference a known client", () => {
    const clientIds = new Set(CLIENTS.map((c) => c.id));
    for (const s of STRATEGIES) {
      expect(typeof s.id).toBe("string");
      expect(typeof s.baseCapital).toBe("number");
      expect(clientIds.has(s.clientId)).toBe(true);
    }
  });

  it("getAccountsForClient / getAccountsForVenue filter correctly", () => {
    const someClient = ACCOUNTS[0].clientId;
    const perClient = getAccountsForClient(someClient);
    expect(perClient.length).toBeGreaterThan(0);
    for (const a of perClient) expect(a.clientId).toBe(someClient);

    const someVenue = ACCOUNTS[0].venue;
    const perVenue = getAccountsForVenue(someVenue);
    expect(perVenue.length).toBeGreaterThan(0);
    for (const a of perVenue) expect(a.venue).toBe(someVenue);
  });

  it("getFilteredStrategies returns all when filter is empty", () => {
    const all = getFilteredStrategies(BASE_FILTER);
    expect(all.length).toBe(STRATEGIES.length);
  });

  it("getFilteredStrategies narrows when orgIds is provided", () => {
    const someOrg = CLIENTS[0].orgId;
    const out = getFilteredStrategies({ ...BASE_FILTER, organizationIds: [someOrg] });
    for (const s of out) {
      const client = CLIENTS.find((c) => c.id === s.clientId);
      expect(client?.orgId).toBe(someOrg);
    }
  });

  it("getAggregatedPnL returns a well-formed aggregate", () => {
    const agg = getAggregatedPnL(BASE_FILTER);
    expect(agg.strategyId).toBe("AGGREGATE");
    expect(typeof agg.total).toBe("number");
    expect(typeof agg.funding).toBe("number");
  });

  it("getAggregatedTimeSeries returns pnl/nav/exposure arrays of equal length", () => {
    const ts = getAggregatedTimeSeries(BASE_FILTER);
    expect(ts.pnl.length).toBe(ts.nav.length);
    expect(ts.nav.length).toBe(ts.exposure.length);
  }, 20_000);

  it("getLiveBatchDelta returns equal-length arrays", () => {
    const delta = getLiveBatchDelta(BASE_FILTER);
    expect(delta.pnl.length).toBe(delta.nav.length);
  }, 20_000);

  it("getStrategyPerformance returns metrics per strategy", () => {
    const rows = getStrategyPerformance(BASE_FILTER);
    expect(rows.length).toBe(STRATEGIES.length);
    const first = rows[0];
    expect(typeof first.id).toBe("string");
    expect(typeof first.pnl).toBe("number");
    expect(typeof first.sharpe).toBe("number");
  });

  it("getToday / getYesterday return ISO-date strings", () => {
    expect(getToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getYesterday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("SERVICE_asset_group_MAP / SERVICE_VENUE_MAP are keyed by service name", () => {
    expect(Object.keys(SERVICE_asset_group_MAP).length).toBeGreaterThan(0);
    expect(Object.keys(SERVICE_VENUE_MAP).length).toBeGreaterThan(0);
    expect(SERVICE_asset_group_MAP["Execution Service"]).toBeDefined();
  });

  it("getStrategyServices / getFilteredServices return service lists", () => {
    const sid = STRATEGIES[0].id;
    const services = getStrategyServices(sid);
    expect(Array.isArray(services)).toBe(true);
    expect(services.length).toBeGreaterThan(0);

    const filtered = getFilteredServices(BASE_FILTER);
    expect(Array.isArray(filtered)).toBe(true);
    expect(filtered.length).toBeGreaterThan(0);

    expect(getStrategyServices("not_a_real_strategy_id")).toEqual([]);
  });

  it("getFilteredAlerts filters by strategy context", () => {
    const alerts: Alert[] = [
      { id: "a1", message: "m", severity: "low", timestamp: "t", source: "s" },
      {
        id: "a2",
        message: "m",
        severity: "high",
        timestamp: "t",
        source: "s",
        strategyId: "does-not-exist",
      },
    ];
    const out = getFilteredAlerts(alerts, BASE_FILTER);
    // unknown strategyId is filtered out; un-attributed alert passes through
    expect(out.some((a) => a.id === "a1")).toBe(true);
    expect(out.some((a) => a.id === "a2")).toBe(false);
  });
});
