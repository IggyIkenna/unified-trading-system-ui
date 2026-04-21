import {
  FAMILY_METADATA,
  STRATEGY_FAMILIES_V2,
  legacyFamilyToV2,
  type StrategyFamily,
} from "@/lib/architecture-v2";
import type { StrategyCatalogEntry } from "@/lib/mocks/fixtures/strategy-catalog-data";
import { STRATEGY_CATALOG } from "@/lib/mocks/fixtures/strategy-catalog-data";

export interface FamilyAggregate {
  family: StrategyFamily;
  label: string;
  slug: string;
  accentClass: string;
  total: number;
  live: number;
  paper: number;
  categories: readonly string[];
  avgSharpe: number;
  avgTargetApy: number;
  minApy: number;
  maxApy: number;
  sampleVenues: readonly string[];
  entries: readonly StrategyCatalogEntry[];
}

function mean(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  let sum = 0;
  for (const v of values) {
    sum += v;
  }
  return sum / values.length;
}

export function groupCatalogByFamily(
  catalog: readonly StrategyCatalogEntry[] = STRATEGY_CATALOG,
): readonly FamilyAggregate[] {
  const perFamily = new Map<StrategyFamily, StrategyCatalogEntry[]>();
  for (const family of STRATEGY_FAMILIES_V2) {
    perFamily.set(family, []);
  }
  for (const entry of catalog) {
    const family = legacyFamilyToV2(entry.family);
    const bucket = perFamily.get(family);
    if (bucket) {
      bucket.push(entry);
    }
  }
  const out: FamilyAggregate[] = [];
  for (const family of STRATEGY_FAMILIES_V2) {
    const entries = perFamily.get(family) ?? [];
    const meta = FAMILY_METADATA[family];
    const sharpes = entries.map((e) => e.performance.expected_sharpe);
    const apyMids = entries.map(
      (e) => (e.performance.target_apy_range[0] + e.performance.target_apy_range[1]) / 2,
    );
    const apyLows = entries.map((e) => e.performance.target_apy_range[0]);
    const apyHighs = entries.map((e) => e.performance.target_apy_range[1]);
    const categories = new Set<string>();
    const venues = new Set<string>();
    let live = 0;
    let paper = 0;
    for (const e of entries) {
      categories.add(e.category);
      if (e.readiness.status === "LIVE") live++;
      if (e.readiness.status === "PAPER") paper++;
      for (const v of e.config.venues.slice(0, 3)) {
        venues.add(v);
        if (venues.size >= 10) break;
      }
    }
    out.push({
      family,
      label: meta.label,
      slug: meta.slug,
      accentClass: meta.accentClass,
      total: entries.length,
      live,
      paper,
      categories: Array.from(categories),
      avgSharpe: Number(mean(sharpes).toFixed(2)),
      avgTargetApy: Number(mean(apyMids).toFixed(1)),
      minApy: apyLows.length > 0 ? Math.min(...apyLows) : 0,
      maxApy: apyHighs.length > 0 ? Math.max(...apyHighs) : 0,
      sampleVenues: Array.from(venues).slice(0, 6),
      entries,
    });
  }
  return out;
}

export function getFamilyAggregate(slug: string): FamilyAggregate | null {
  const aggregates = groupCatalogByFamily();
  return aggregates.find((a) => a.slug === slug) ?? null;
}
