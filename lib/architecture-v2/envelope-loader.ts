/**
 * Client-side fetcher for the strategy catalogue envelope artefacts.
 *
 * Reads from /api/catalogue/envelope?file=... (which proxies GCS).
 * Memoised in-memory; pages can call these freely without thrashing the API.
 *
 * Underlying artefacts (regenerated daily by UAC scripts):
 *   envelope.json         — full catalogue, structured by category → family → archetype → cells
 *   strategy_instruments.json — slot → concrete instrument list
 *   availability.json     — per-archetype allowed categories, tenor buckets, bespoke flag
 */

export interface EnvelopeCell {
  instrument_type: string;
  status: "SUPPORTED" | "PARTIAL";
  venue_count: number;
  venue_combos: number;
  tf_count: number;
  instances: number;
  venues: string[];
  note?: string | null;
}

export interface EnvelopeArchetype {
  tenors?: string[] | null;
  timeframes: string[];
  venue_combo_policy: "single_venue" | "cross_venue_pairs" | "same_venue_basis";
  bespoke_capable: boolean;
  instances_total: number;
  cells: EnvelopeCell[];
}

export interface EnvelopeFamily {
  archetypes: Record<string, EnvelopeArchetype>;
}

export interface EnvelopeCategory {
  instances_count: number;
  bespoke_count: number;
  families: Record<string, EnvelopeFamily>;
}

export interface EnvelopeJson {
  schema_version: string;
  categories: Record<string, EnvelopeCategory>;
  totals: { instances: number; bespoke_archetype_rows: number };
}

export interface StrategyInstrumentsSlot {
  archetype_id: string;
  category: string;
  instrument_type: string;
  venue: string;
  instrument_bucket: string | null;
  instruments: string[];
  source: string;
}

export interface StrategyInstrumentsJson {
  schema_version: string;
  generated_at: string;
  source_script: string;
  resolver: string;
  slot_count: number;
  slots: Record<string, StrategyInstrumentsSlot>;
}

export interface AvailabilityArchetype {
  family: string;
  allowed_categories: string[];
  bespoke_capable: boolean;
  tenor_buckets: string[] | null;
  timeframes: string[];
  venue_combo_policy: string;
  cells: Array<{
    category: string;
    instrument_type: string;
    status: string;
    venue_count: number;
    venue_examples: string[];
  }>;
}

export interface AvailabilityJson {
  schema_version: string;
  archetype_count: number;
  archetypes: Record<string, AvailabilityArchetype>;
  forbidden_combinations: Array<{ archetype_id: string; category: string }>;
  tenor_buckets_known: string[];
  categories_known: string[];
}

let envelopeCache: Promise<EnvelopeJson> | null = null;
let instrumentsCache: Promise<StrategyInstrumentsJson> | null = null;
let availabilityCache: Promise<AvailabilityJson> | null = null;

async function fetchArtefact<T>(file: string): Promise<T> {
  const res = await fetch(`/api/catalogue/envelope?file=${encodeURIComponent(file)}`);
  if (!res.ok) {
    throw new Error(`Failed to load ${file}: ${res.status} ${res.statusText}`);
  }
  // Mock-mode interceptor may swap the body for non-JSON; guard `res.json()`
  // and surface a useful message instead of an opaque parse failure.
  const text = await res.text();
  if (!text || text.trim().startsWith("<")) {
    throw new Error(
      `Failed to load ${file}: response is not JSON (mock mode may be intercepting the GCS proxy route: switch to real-data mode or run regen-catalogue.sh).`,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new Error(`Failed to parse ${file}: ${err instanceof Error ? err.message : "invalid JSON"}`);
  }
}

export function loadEnvelope(): Promise<EnvelopeJson> {
  if (envelopeCache === null) {
    envelopeCache = fetchArtefact<EnvelopeJson>("envelope.json");
  }
  return envelopeCache;
}

export function loadStrategyInstruments(): Promise<StrategyInstrumentsJson> {
  if (instrumentsCache === null) {
    instrumentsCache = fetchArtefact<StrategyInstrumentsJson>("strategy_instruments.json");
  }
  return instrumentsCache;
}

export function loadAvailability(): Promise<AvailabilityJson> {
  if (availabilityCache === null) {
    availabilityCache = fetchArtefact<AvailabilityJson>("availability.json");
  }
  return availabilityCache;
}

/**
 * Lookup the concrete instrument list for a strategy slot.
 * slotKey format: ``{archetype}@{category}-{instrument}-{venue}`` (lowercase
 * category as in strategy_instruments.json).
 */
export async function instrumentsForSlot(slotKey: string): Promise<string[]> {
  const data = await loadStrategyInstruments();
  return data.slots[slotKey]?.instruments ?? [];
}

export async function slotsForArchetype(archetype: string): Promise<StrategyInstrumentsSlot[]> {
  const data = await loadStrategyInstruments();
  return Object.values(data.slots).filter((s) => s.archetype_id === archetype);
}

export async function slotsForCategory(category: string): Promise<StrategyInstrumentsSlot[]> {
  const data = await loadStrategyInstruments();
  return Object.values(data.slots).filter((s) => s.category.toLowerCase() === category.toLowerCase());
}

export async function archetypesAllowedInCategory(category: string): Promise<string[]> {
  const data = await loadAvailability();
  return Object.entries(data.archetypes)
    .filter(([, a]) => a.allowed_categories.includes(category))
    .map(([id]) => id);
}

/**
 * 2026-04-28 DART tile-split (D.6): instances organised by the research-side
 * family → archetype → asset_group hierarchy.
 *
 * Builds a 3-level grouped index of the strategy instances catalogue:
 *
 *   Map<family, Map<archetype, Map<asset_group, slot[]>>>
 *
 * Used by the DART Research strategy-selection UIs (/services/research/
 * strategy/{families,catalog,overview} + /services/research/strategies).
 * The research lens is family-led — quants think "show me all
 * CARRY_AND_YIELD strategies" rather than the public catalogue's
 * asset-group-led "show me all CEFI strategies" ordering.
 *
 * Note: family is derived from archetype via `ARCHETYPE_TO_FAMILY` in
 * `lib/architecture-v2/enums.ts`. Slots whose archetype has no family
 * mapping are bucketed under the literal string "OTHER".
 *
 * SSOT: codex/14-playbooks/dart/dart-terminal-vs-research.md.
 */
export async function instancesByFamilyArchetypeAssetGroup(): Promise<
  Map<string, Map<string, Map<string, StrategyInstrumentsSlot[]>>>
> {
  const { ARCHETYPE_TO_FAMILY } = await import("./enums");
  const data = await loadStrategyInstruments();
  const out = new Map<string, Map<string, Map<string, StrategyInstrumentsSlot[]>>>();
  for (const slot of Object.values(data.slots)) {
    const family = (ARCHETYPE_TO_FAMILY as Record<string, string | undefined>)[slot.archetype_id] ?? "OTHER";
    const archetype = slot.archetype_id;
    const assetGroup = slot.category.toUpperCase();
    let archMap = out.get(family);
    if (!archMap) {
      archMap = new Map();
      out.set(family, archMap);
    }
    let agMap = archMap.get(archetype);
    if (!agMap) {
      agMap = new Map();
      archMap.set(archetype, agMap);
    }
    const slots = agMap.get(assetGroup);
    if (slots) {
      slots.push(slot);
    } else {
      agMap.set(assetGroup, [slot]);
    }
  }
  return out;
}

export async function isBespokeCapable(archetype: string): Promise<boolean> {
  const data = await loadAvailability();
  return data.archetypes[archetype]?.bespoke_capable ?? false;
}

export async function tenorsForArchetype(archetype: string): Promise<string[] | null> {
  const data = await loadAvailability();
  return data.archetypes[archetype]?.tenor_buckets ?? null;
}
