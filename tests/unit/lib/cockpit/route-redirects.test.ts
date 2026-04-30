import { describe, expect, it } from "vitest";

import {
  COCKPIT_ROUTE_REDIRECTS,
  cockpitAnchorForPath,
  isCataloguePath,
} from "@/lib/cockpit/route-redirects";

describe("COCKPIT_ROUTE_REDIRECTS — table integrity", () => {
  it("ships at least 20 mappings (Trading + Observe)", () => {
    expect(COCKPIT_ROUTE_REDIRECTS.length).toBeGreaterThanOrEqual(20);
  });

  it("every mapping has source / mode / surface", () => {
    for (const r of COCKPIT_ROUTE_REDIRECTS) {
      expect(r.source).toMatch(/^\/services\//);
      expect(["command", "markets", "strategies", "explain", "ops"]).toContain(r.mode);
      expect(r.surface).toBe("terminal");
    }
  });

  it("no duplicate sources", () => {
    const sources = COCKPIT_ROUTE_REDIRECTS.map((r) => r.source);
    expect(new Set(sources).size).toBe(sources.length);
  });

  it("Strategy Catalogue is NOT in the table (§22 — distinct surface)", () => {
    expect(COCKPIT_ROUTE_REDIRECTS.find((r) => r.source.startsWith("/services/strategy-catalogue"))).toBeUndefined();
  });
});

describe("cockpitAnchorForPath", () => {
  it("exact-match resolves to the canonical mode anchor", () => {
    expect(cockpitAnchorForPath("/services/trading/overview")?.mode).toBe("command");
    expect(cockpitAnchorForPath("/services/trading/markets")?.mode).toBe("markets");
    expect(cockpitAnchorForPath("/services/trading/strategies")?.mode).toBe("strategies");
    expect(cockpitAnchorForPath("/services/observe/reconciliation")?.mode).toBe("explain");
    expect(cockpitAnchorForPath("/services/observe/risk")?.mode).toBe("ops");
  });

  it("prefix-match resolves nested routes (e.g. /options/combos → markets)", () => {
    expect(cockpitAnchorForPath("/services/trading/options/combos")?.mode).toBe("markets");
    expect(cockpitAnchorForPath("/services/trading/sports/bet")?.mode).toBe("markets");
  });

  it("longest-prefix-wins — disambiguate /services/observe vs more-specific Explain routes", () => {
    expect(cockpitAnchorForPath("/services/observe/reconciliation/foo")?.mode).toBe("explain");
  });

  it("returns null for non-cockpit paths", () => {
    expect(cockpitAnchorForPath("/dashboard")).toBeNull();
    expect(cockpitAnchorForPath("/services/research/strategies")).toBeNull();
    expect(cockpitAnchorForPath("/services/strategy-catalogue")).toBeNull();
    expect(cockpitAnchorForPath("/")).toBeNull();
  });
});

describe("isCataloguePath", () => {
  it("matches catalogue + sub-routes", () => {
    expect(isCataloguePath("/services/strategy-catalogue")).toBe(true);
    expect(isCataloguePath("/services/strategy-catalogue/coverage")).toBe(true);
  });

  it("does not match non-catalogue paths", () => {
    expect(isCataloguePath("/services/trading/strategies")).toBe(false);
    expect(isCataloguePath("/dashboard")).toBe(false);
  });
});
