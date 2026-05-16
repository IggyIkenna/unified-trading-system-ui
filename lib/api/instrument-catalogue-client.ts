/**
 * Typed client for the instrument-catalogue GCS proxy (catalogue plan P3.1).
 *
 * Routes through `/api/catalogue/instrument?file=...` so the server-side
 * Storage SDK handles ADC. Types here mirror the
 * `unified-api-contracts/scripts/generate_instrument_catalogue.py` output
 * envelope.
 */

export type AssetGroupToken = "cefi" | "defi" | "tradfi" | "sports" | "prediction";

export type CoverageBand = "full" | "high" | "medium" | "low" | "none";

export interface CatalogueColumnSpec {
  name: string;
  dtype: string;
  nullable: boolean;
  unit: string | null;
  description: string | null;
}

export interface CatalogueEntry {
  asset_group: AssetGroupToken;
  data_type: string;
  venue: string;
  instrument_type: string | null;
  bucket: string | null;
  coverage_start: string | null;
  expected_days: number;
  captured_days: number;
  empty_confirmed_days: number;
  attempted_failed_days: number;
  coverage_pct: number;
  latest_captured_day: string | null;
  live_ready: boolean;
  batch_ready: boolean;
  retry_needed: boolean;
  live_capable: boolean;
  batch_capable: boolean;
  streaming_protocol: string | null;
  requires_credentials: boolean;
  ttm_cutoff_days: number | null;
  liquidity_cutoff_usd: number | null;
  retention_days: number | null;
  notes: string | null;
  schema: CatalogueColumnSpec[];
}

export interface InstrumentCatalogue {
  generated_at: string;
  entries: CatalogueEntry[];
}

export interface ShardDynamicsCapability {
  asset_group: AssetGroupToken;
  data_type: string;
  venue: string;
  instrument_type: string | null;
  live_capable: boolean;
  batch_capable: boolean;
  streaming_protocol: string | null;
  requires_credentials: boolean;
  ttm_cutoff_days: number | null;
  liquidity_cutoff_usd: number | null;
  retention_days: number | null;
  notes: string | null;
  sources: string[];
}

export interface ShardDynamicsSchema {
  asset_group: AssetGroupToken;
  data_type: string;
  source: string;
  columns: CatalogueColumnSpec[];
}

export interface ShardDynamics {
  generated_at: string;
  schemas: ShardDynamicsSchema[];
  capabilities: ShardDynamicsCapability[];
}

const ENDPOINT = "/api/catalogue/instrument";

async function fetchArtefact<T>(file: string): Promise<T> {
  const response = await fetch(`${ENDPOINT}?file=${encodeURIComponent(file)}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Catalogue fetch failed (${response.status}): ${detail || file}`);
  }
  return (await response.json()) as T;
}

export async function fetchInstrumentCatalogue(): Promise<InstrumentCatalogue> {
  return fetchArtefact<InstrumentCatalogue>("instrument-catalogue.json");
}

export async function fetchShardDynamics(): Promise<ShardDynamics> {
  return fetchArtefact<ShardDynamics>("shard-dynamics.json");
}

export async function fetchInstrumentCatalogueMarkdown(): Promise<string> {
  const response = await fetch(`${ENDPOINT}?file=instrument-catalogue.md`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Catalogue markdown fetch failed (${response.status}): ${detail}`);
  }
  return response.text();
}

/**
 * Map a coverage % to a colour band — matches the band emoji rules in
 * `generate_instrument_catalogue.py::_coverage_emoji`.
 */
export function coverageBand(coveragePct: number, expectedDays: number): CoverageBand {
  if (expectedDays === 0) return "none";
  if (coveragePct >= 0.9) return "full";
  if (coveragePct >= 0.5) return "medium";
  if (coveragePct === 0) return "none";
  return "low";
}
