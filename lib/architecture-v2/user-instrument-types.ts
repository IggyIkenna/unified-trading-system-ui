/**
 * User-instrument-type derivation — drives DART view-gating per the new
 * tile-split SSOT (codex/14-playbooks/dart/dart-terminal-vs-research.md).
 *
 * Chain:
 *
 *   user.assigned_strategies   (slot labels, e.g. "ML_DIRECTIONAL_CONTINUOUS@cefi-spot-binance")
 *      │
 *      ▼
 *   strategy_instruments.json  (GCS proxy at /api/catalogue/envelope?file=strategy_instruments.json)
 *      │
 *      ▼
 *   StrategyInstrumentsSlot[]  { archetype_id, category, instrument_type, venue, instruments[] }
 *      │
 *      ▼
 *   { instrumentTypes: Set<string>, assetGroups: Set<StrategyCategory> }
 *
 * Used by `<PageEntitlementGate>` to gate views like /services/trading/options
 * (requires `instrument_type ∈ {option, future}`) and /services/trading/sports
 * (requires asset_group SPORTS) — content renders for entitled users, FOMO
 * overlay otherwise.
 *
 * Modes:
 *   - "reality": strict — only slots whose key matches `user.assigned_strategies`
 *   - "fomo":    reality + teaser-strategy slots (deterministic stable subset
 *                from Strategy Catalogue Explore tab). Default for non-DART-Full
 *                users — drives upsell visibility.
 *
 * Admin (`entitlements.includes("*")`) → early bypass returning ALL instrument
 * types + ALL asset groups.
 */

import type { AuthUser } from "@/lib/auth/types";
import { loadStrategyInstruments } from "@/lib/architecture-v2/envelope-loader";
import type { StrategyInstrumentsSlot } from "@/lib/architecture-v2/envelope-loader";

/** Asset-group keys carried in `strategy_instruments.json` slots (lowercase
 * per the GCS path-segment SSOT — see CLAUDE.md asset-group-vocabulary
 * exceptions). Mirrors `StrategyCategory` (uppercase) for view-gating. */
export type SlotCategoryLowercase = "cefi" | "defi" | "sports" | "tradfi" | "prediction";

/** View-gating asset_group enum (uppercase). Matches `lib/architecture-v2/
 * enums.ts:StrategyCategory` shape — re-declared here to avoid an extra
 * import cycle. */
export type AssetGroup = "CEFI" | "DEFI" | "SPORTS" | "TRADFI" | "PREDICTION";

const ALL_ASSET_GROUPS: readonly AssetGroup[] = ["CEFI", "DEFI", "SPORTS", "TRADFI", "PREDICTION"];

/** All instrument-type values currently emitted by `strategy_instruments.json`
 * (UAC-driven; this list is loose for the admin/wildcard early-bypass. The
 * actual filter uses string-set intersection so adding new instrument types
 * upstream Just Works). */
const ALL_INSTRUMENT_TYPES: readonly string[] = [
  "spot",
  "spot_pair",
  "future",
  "perp",
  "perpetual",
  "option",
  "equity",
  "index",
  "commodity",
  "currency",
  "bond",
  "etf",
  "pool",
  "lending",
  "lst",
  "yield_bearing",
  "staking",
  "exchange_odds",
  "fixed_odds",
  "prediction_event",
];

export type DerivationMode = "reality" | "fomo";

export interface DerivedInstrumentTypes {
  instrumentTypes: Set<string>;
  assetGroups: Set<AssetGroup>;
}

function isWildcardUser(user: AuthUser | null | undefined): boolean {
  if (!user || !Array.isArray(user.entitlements)) return false;
  for (const e of user.entitlements) {
    if (typeof e === "string" && e === "*") return true;
  }
  return false;
}

function uppercaseAssetGroup(category: string): AssetGroup | null {
  const up = category.toUpperCase();
  if (up === "CEFI" || up === "DEFI" || up === "SPORTS" || up === "TRADFI" || up === "PREDICTION") {
    return up;
  }
  return null;
}

/**
 * Default teaser-strategy count. Mirrors the Strategy Catalogue Explore tab
 * (`app/(platform)/services/strategy-catalogue/page.tsx`) "first 4 instances"
 * heuristic.
 */
const DEFAULT_TEASER_COUNT = 4;

/**
 * Pick a deterministic-stable subset of slots NOT in `user.assigned_strategies`,
 * to drive FOMO view-gating + the catalogue Explore tab. Sorted by slot key
 * ascending so the same `n` slots come back across reloads.
 */
export async function teaserStrategiesForUser(
  user: AuthUser | null | undefined,
  count: number = DEFAULT_TEASER_COUNT,
): Promise<readonly string[]> {
  if (count <= 0) return [];
  const data = await loadStrategyInstruments();
  const assigned = new Set<string>(user?.assigned_strategies ?? []);
  const candidates = Object.keys(data.slots)
    .filter((slotKey) => !assigned.has(slotKey))
    .sort();
  return candidates.slice(0, count);
}

/**
 * Walk a slot list and accumulate the union of instrument_type + uppercase
 * asset_group values.
 */
function accumulate(slots: readonly StrategyInstrumentsSlot[], out: DerivedInstrumentTypes): void {
  for (const slot of slots) {
    if (slot.instrument_type) out.instrumentTypes.add(slot.instrument_type);
    const ag = uppercaseAssetGroup(slot.category);
    if (ag) out.assetGroups.add(ag);
  }
}

/**
 * Resolve the set of instrument types + asset groups available to a user.
 *
 * @param user - Auth user (may be null/undefined → empty result)
 * @param mode - "reality" (entitled-only) | "fomo" (entitled + teaser)
 */
export async function instrumentTypesForUser(
  user: AuthUser | null | undefined,
  mode: DerivationMode = "reality",
): Promise<DerivedInstrumentTypes> {
  // Admin / wildcard → see everything.
  if (isWildcardUser(user)) {
    return {
      instrumentTypes: new Set<string>(ALL_INSTRUMENT_TYPES),
      assetGroups: new Set<AssetGroup>(ALL_ASSET_GROUPS),
    };
  }
  const out: DerivedInstrumentTypes = {
    instrumentTypes: new Set<string>(),
    assetGroups: new Set<AssetGroup>(),
  };
  if (!user) return out;

  const data = await loadStrategyInstruments();
  const assigned = user.assigned_strategies ?? [];
  const realitySlots = assigned
    .map((slotKey) => data.slots[slotKey])
    .filter((s): s is StrategyInstrumentsSlot => Boolean(s));
  accumulate(realitySlots, out);

  if (mode === "fomo") {
    const teaserKeys = await teaserStrategiesForUser(user);
    const teaserSlots = teaserKeys
      .map((slotKey) => data.slots[slotKey])
      .filter((s): s is StrategyInstrumentsSlot => Boolean(s));
    accumulate(teaserSlots, out);
  }

  return out;
}

/**
 * Convenience wrapper for callers that only need asset groups (e.g. the
 * Sports / DeFi / Predictions trading sub-domains).
 */
export async function assetGroupsForUser(
  user: AuthUser | null | undefined,
  mode: DerivationMode = "reality",
): Promise<Set<AssetGroup>> {
  const { assetGroups } = await instrumentTypesForUser(user, mode);
  return assetGroups;
}
