import { describe, expect, it } from "vitest";
import {
  getFamilyAggregate,
  groupCatalogByFamily,
} from "@/app/(platform)/services/research/strategy/families/_components/aggregation";
import { STRATEGY_FAMILIES_V2 } from "@/lib/architecture-v2";
import { STRATEGY_CATALOG } from "@/lib/mocks/fixtures/strategy-catalog-data";

describe("family aggregation", () => {
  it("produces one aggregate per family", () => {
    const aggregates = groupCatalogByFamily();
    expect(aggregates).toHaveLength(STRATEGY_FAMILIES_V2.length);
    expect(aggregates.map((a) => a.family).sort()).toEqual([...STRATEGY_FAMILIES_V2].sort());
  });

  it("total catalog entries are conserved across families", () => {
    const aggregates = groupCatalogByFamily();
    const totalFromAgg = aggregates.reduce((a, b) => a + b.total, 0);
    expect(totalFromAgg).toBe(STRATEGY_CATALOG.length);
  });

  it("resolves slug to aggregate", () => {
    const agg = getFamilyAggregate("market-making");
    expect(agg?.family).toBe("MARKET_MAKING");
    expect(getFamilyAggregate("bogus-slug")).toBeNull();
  });
});
