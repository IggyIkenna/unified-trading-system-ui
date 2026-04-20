import {
  STRATEGY_CATALOG,
  type StrategyCatalogEntry,
  type StrategyCategory,
} from "@/lib/mocks/fixtures/strategy-catalog-data";

export interface ApiStrategyCatalogRow {
  id: string;
  domain: string;
  family: string;
  label: string;
  params?: unknown;
}

export interface StrategyCatalogEnvelope {
  data: {
    strategies: ApiStrategyCatalogRow[];
    families?: Record<string, ApiStrategyCatalogRow[]>;
    total?: number;
  };
  mode?: string;
}

function domainToCategory(domain: string): StrategyCategory {
  const d = domain.toUpperCase();
  if (d === "SPORTS") return "SPORTS";
  if (d === "PREDICTIONS" || d === "PREDICTION") return "PREDICTION";
  if (d === "TRADFI") return "TRADFI";
  if (d === "CEFI") return "CEFI";
  return "DEFI";
}

function templateEntry(): StrategyCatalogEntry {
  return structuredClone(STRATEGY_CATALOG[0]);
}

/** Merge registry rows with rich mock rows (same `strategy_id`) or synthesise a minimal row. */
export function mergeApiStrategyCatalog(envelope: StrategyCatalogEnvelope): StrategyCatalogEntry[] {
  const rows = envelope.data?.strategies ?? [];
  const byId = new Map(STRATEGY_CATALOG.map((s) => [s.strategy_id.toUpperCase(), s]));

  return rows.map((row) => {
    const key = row.id.toUpperCase();
    const existing = byId.get(key);
    if (existing) {
      return {
        ...existing,
        name: row.label || existing.name,
        family: row.family || existing.family,
        subcategory: row.family || existing.subcategory,
        category: row.domain ? domainToCategory(row.domain) : existing.category,
      };
    }
    const base = templateEntry();
    const cat = domainToCategory(row.domain);
    return {
      ...base,
      strategy_id: row.id,
      name: row.label,
      category: cat,
      family: row.family,
      subcategory: row.family,
      description: `Registered strategy programme (${row.family}, ${row.domain}). Economics are confirmed during onboarding.`,
      how_it_works:
        "This row is sourced from the live strategy registry. Presentation metrics may mirror a representative template until a dedicated catalogue profile is bound.",
    };
  });
}
