/**
 * Plan A strategy lifecycle — TypeScript mirror of UAC 5-dim catalogue.
 *
 * **Maturity phase meaning and ordering (normative):** `unified-trading-pm/codex/09-strategy/
 * architecture-v2/strategy-lifecycle-maturity.md` §1. UAC implements that document;
 * this file mirrors runtime enums and labels for the UI.
 *
 * Code SSOT: unified-api-contracts/unified_api_contracts/internal/domain/strategy_service/
 *   - catalogue.py         → StrategyInstance + STRATEGY_INSTANCE_CATALOGUE
 *   - venue_set_variants.py → VenueSetVariant + PricingTier + VENUE_SET_VARIANTS
 *   - enums.py             → StrategyMaturityPhase + ProductRouting + AccountType
 *
 * Refreshed from UAC via
 * `unified-trading-pm/scripts/openapi/generate_ui_reference_data.py` (writes
 * `lib/registry/ui-reference-data.json`). If the Python SSOT changes, rerun
 * that script and update the types / helpers below so the mirror stays in
 * lock-step. The mirror tests in `tests/unit/lib/architecture-v2/` fail
 * loudly if the JSON shape drifts.
 */

import rawReference from "@/lib/registry/ui-reference-data.json";

import type { ShareClass, StrategyArchetype, StrategyFamily } from "./enums";

// ──────────────────────────────────────────────────────────────────────────
// Enum mirrors
// ──────────────────────────────────────────────────────────────────────────

/**
 * 11 forward-only maturity phases + orthogonal `retired` terminal state.
 *
 * 2026-04-29 (Phase 1B): `pilot` added between `paper_stable` and `live_early`
 * per dart_ux_cockpit_refactor_2026_04_29.plan.md §4.8.7. Pilot = real money,
 * capped at 1-5% of target size; bridges paper (simulated fills) and live
 * (full target capital). The bundle promotion-status taxonomy in
 * `lib/architecture-v2/strategy-release-bundle.ts` maps onto this canonical
 * phase list.
 */
export type StrategyMaturityPhase =
  | "smoke"
  | "backtest_30d"
  | "backtest_minimal"
  | "backtest_1yr"
  | "backtest_multi_year"
  | "paper_1d"
  | "paper_14d"
  | "paper_stable"
  | "pilot"
  | "live_early"
  | "live_stable"
  | "monitor"
  | "retired";

export const STRATEGY_MATURITY_PHASES: readonly StrategyMaturityPhase[] = [
  "smoke",
  "backtest_30d",
  "backtest_minimal",
  "backtest_1yr",
  "backtest_multi_year",
  "paper_1d",
  "paper_14d",
  "paper_stable",
  "pilot",
  "live_early",
  "live_stable",
  "monitor",
  "retired",
] as const;

export const MATURITY_PHASE_LABEL: Record<StrategyMaturityPhase, string> = {
  smoke: "Smoke",
  backtest_30d: "Backtest 30d",
  backtest_minimal: "Backtest <1y",
  backtest_1yr: "Backtest 1y",
  backtest_multi_year: "Backtest Ny",
  paper_1d: "Paper 1d",
  paper_14d: "Paper 14d",
  paper_stable: "Paper stable",
  pilot: "Pilot",
  live_early: "Live (early)",
  live_stable: "Live (stable)",
  monitor: "Monitor",
  retired: "Retired",
};

export const MATURITY_PHASE_TONE: Record<StrategyMaturityPhase, "muted" | "amber" | "sky" | "emerald" | "violet"> = {
  smoke: "muted",
  backtest_30d: "muted",
  backtest_minimal: "muted",
  backtest_1yr: "amber",
  backtest_multi_year: "amber",
  paper_1d: "sky",
  paper_14d: "sky",
  paper_stable: "violet",
  pilot: "violet",
  live_early: "emerald",
  live_stable: "emerald",
  monitor: "amber",
  retired: "muted",
};

/** Which customer surfaces an instance may be routed to. */
export type ProductRouting = "dart_only" | "im_only" | "both" | "internal_only";

export const PRODUCT_ROUTINGS: readonly ProductRouting[] = ["dart_only", "im_only", "both", "internal_only"] as const;

export const PRODUCT_ROUTING_LABEL: Record<ProductRouting, string> = {
  dart_only: "DART",
  im_only: "IM",
  both: "DART + IM",
  internal_only: "Internal",
};

/** Account type — distinguishes odum-paper / odum-live seed runs from real customer accounts. */
export type AccountType = "live" | "paper";

export const ACCOUNT_TYPES: readonly AccountType[] = ["live", "paper"] as const;

/** Pricing tier declared by a venue-set variant — drives upsell-ladder copy. */
export type VenueSetPricingTier = "base" | "premium" | "top_tier" | "apex";

export const VENUE_SET_PRICING_TIER_LABEL: Record<VenueSetPricingTier, string> = {
  base: "Base",
  premium: "Premium",
  top_tier: "Top-tier",
  apex: "Apex",
};

/** UAC capability-registry cell status — BLOCKED entries are excluded from the catalogue. */
export type CoverageStatus = "SUPPORTED" | "PARTIAL" | "BLOCKED";

/** ShareClass label for the default catalogue 4 (BTC/ETH/USD/USDT) + catch-all for broader enum. */
export const SHARE_CLASS_LABEL: Record<ShareClass, string> = {
  BTC: "BTC",
  ETH: "ETH",
  USD: "USD",
  USDT: "USDT",
  USDC: "USDC",
  FDUSD: "FDUSD",
  GBP: "GBP",
  EUR: "EUR",
  SOL: "SOL",
};

// ──────────────────────────────────────────────────────────────────────────
// Catalogue types
// ──────────────────────────────────────────────────────────────────────────

export type VenueSetVariantId = string;

export interface VenueSetVariant {
  readonly id: VenueSetVariantId;
  readonly archetype: StrategyArchetype;
  readonly venues: readonly string[];
  readonly instrumentTypes: readonly string[];
  readonly label: string;
  readonly pricingTier: VenueSetPricingTier;
}

/**
 * 5-dim strategy instance identity.
 *
 * Keyed on {family, archetype, venue_set_variant_id, instrument_type_set,
 * share_class}. `shareClass` is null when the archetype has only one share
 * class variant. `instanceId` is the deterministic hash computed by
 * {@link https://github.com/IggyIkenna/unified-api-contracts/blob/main/unified_api_contracts/internal/domain/strategy_service/catalogue.py UAC catalogue.py}.
 */
export interface StrategyInstance {
  readonly instanceId: string;
  readonly family: StrategyFamily;
  readonly archetype: StrategyArchetype;
  readonly venueSetVariantId: VenueSetVariantId;
  readonly instrumentTypeSet: readonly string[];
  readonly shareClass: ShareClass | null;
  readonly coverageStatus: CoverageStatus;
}

/**
 * Mutable lifecycle state for an instance. Firestore-backed once Plan A Phase 3
 * ships `PATCH /api/v1/registry/strategy-instances/{id}/lifecycle`. Series refs
 * point at `odum-paper` / `odum-live` account P&L streams for the performance
 * overlay (Plan C).
 */
export interface StrategyInstanceLifecycle {
  readonly instanceId: string;
  readonly maturityPhase: StrategyMaturityPhase;
  readonly productRouting: ProductRouting;
  readonly backtestSeriesRef: string | null;
  readonly paperSeriesRef: string | null;
  readonly liveSeriesRef: string | null;
  readonly availableSince: string | null;
  readonly phasedAt: string | null;
}

/** Default lifecycle view for an instance that has no Firestore row yet. */
export const LIFECYCLE_UNKNOWN: StrategyInstanceLifecycle = {
  instanceId: "",
  maturityPhase: "paper_stable",
  productRouting: "both",
  backtestSeriesRef: null,
  paperSeriesRef: null,
  liveSeriesRef: null,
  availableSince: null,
  phasedAt: null,
};

// ──────────────────────────────────────────────────────────────────────────
// Data loaders — hydrate from `lib/registry/ui-reference-data.json`
// ──────────────────────────────────────────────────────────────────────────

interface RawReferenceShape {
  readonly strategy_instance_catalogue?: {
    readonly instances?: ReadonlyArray<{
      readonly instance_id: string;
      readonly family: string;
      readonly archetype: string;
      readonly venue_set_variant_id: string;
      readonly instrument_type_set: readonly string[];
      readonly share_class: string | null;
      readonly coverage_status: string;
    }>;
  };
  readonly venue_set_variants?: ReadonlyArray<{
    readonly id: string;
    readonly archetype: string;
    readonly venues: readonly string[];
    readonly instrument_types: readonly string[];
    readonly label: string;
    readonly pricing_tier: string;
  }>;
  readonly lifecycle_enums?: {
    readonly strategy_maturity_phases?: readonly string[];
    readonly product_routings?: readonly string[];
    readonly account_types?: readonly string[];
  };
}

const reference = rawReference as RawReferenceShape;

const rawInstances = reference.strategy_instance_catalogue?.instances ?? [];
const rawVariants = reference.venue_set_variants ?? [];

const STRATEGY_INSTANCE_CATALOGUE: readonly StrategyInstance[] = rawInstances.map((entry) => ({
  instanceId: entry.instance_id,
  family: entry.family as StrategyFamily,
  archetype: entry.archetype as StrategyArchetype,
  venueSetVariantId: entry.venue_set_variant_id,
  instrumentTypeSet: entry.instrument_type_set,
  shareClass: (entry.share_class as ShareClass | null) ?? null,
  coverageStatus: entry.coverage_status as CoverageStatus,
}));

const VENUE_SET_VARIANTS_DATA: readonly VenueSetVariant[] = rawVariants.map((entry) => ({
  id: entry.id,
  archetype: entry.archetype as StrategyArchetype,
  venues: entry.venues,
  instrumentTypes: entry.instrument_types,
  label: entry.label,
  pricingTier: entry.pricing_tier as VenueSetPricingTier,
}));

const VARIANTS_BY_ID: ReadonlyMap<VenueSetVariantId, VenueSetVariant> = new Map(
  VENUE_SET_VARIANTS_DATA.map((v) => [v.id, v]),
);

const INSTANCES_BY_ID: ReadonlyMap<string, StrategyInstance> = new Map(
  STRATEGY_INSTANCE_CATALOGUE.map((i) => [i.instanceId, i]),
);

export function loadStrategyCatalogue(): readonly StrategyInstance[] {
  return STRATEGY_INSTANCE_CATALOGUE;
}

export function loadVenueSetVariants(): readonly VenueSetVariant[] {
  return VENUE_SET_VARIANTS_DATA;
}

export function lookupVenueSetVariant(id: VenueSetVariantId): VenueSetVariant | undefined {
  return VARIANTS_BY_ID.get(id);
}

export function lookupStrategyInstance(instanceId: string): StrategyInstance | undefined {
  return INSTANCES_BY_ID.get(instanceId);
}

export function variantsForArchetype(archetype: StrategyArchetype): readonly VenueSetVariant[] {
  return VENUE_SET_VARIANTS_DATA.filter((v) => v.archetype === archetype);
}

// ──────────────────────────────────────────────────────────────────────────
// Gating helpers
// ──────────────────────────────────────────────────────────────────────────

/**
 * Does this maturity phase permit offering an allocation CTA?
 *
 * Per plan: `paper_stable`, `pilot`, `live_early`, `live_stable`, `monitor`
 * qualify — strategies running on real or paper-stable infrastructure with
 * the same code path as live. Pre-paper-stable smoke / backtest / paper-1d
 * are not yet allocatable; retired is terminal.
 *
 * 2026-04-29 (Phase 1B): `pilot` + `monitor` added per §4.8.7. Pilot is
 * capped real-money execution (1-5% of target size); monitor is running
 * live with capacity-decay measurement. Both serve real positions and so
 * permit incoming allocations.
 */
export function allowsAllocationCta(phase: StrategyMaturityPhase): boolean {
  return (
    phase === "paper_stable" ||
    phase === "pilot" ||
    phase === "live_early" ||
    phase === "live_stable" ||
    phase === "monitor"
  );
}

/**
 * Ladder order of non-retired maturity phases. Mirror of UAC
 * ``_PHASE_LADDER`` in ``internal/domain/strategy_service/lifecycle.py``.
 */
const MATURITY_PHASE_LADDER: readonly StrategyMaturityPhase[] = [
  "smoke",
  "backtest_30d",
  "backtest_minimal",
  "backtest_1yr",
  "backtest_multi_year",
  "paper_1d",
  "paper_14d",
  "paper_stable",
  "pilot",
  "live_early",
  "live_stable",
  "monitor",
] as const;

/** Return ladder index, or -1 for `retired` (orthogonal terminal state). */
export function maturityPhaseRank(phase: StrategyMaturityPhase): number {
  if (phase === "retired") return -1;
  return MATURITY_PHASE_LADDER.indexOf(phase);
}

/**
 * Validate a maturity phase transition.
 * - `retired` is terminal — no transitions out of it.
 * - Any phase may transition to `retired`.
 * - Forward-only moves up the ladder; skipping phases is allowed
 *   (e.g. `backtest_1yr` → `paper_1d` because multi-year is optional).
 * - Backward moves are rejected.
 *
 * Mirror of UAC `is_valid_maturity_transition`.
 */
export function isValidMaturityTransition(from: StrategyMaturityPhase, to: StrategyMaturityPhase): boolean {
  if (from === "retired") return false;
  if (to === "retired") return true;
  return maturityPhaseRank(to) > maturityPhaseRank(from);
}

/** Return the list of legal forward transitions from a given phase. */
export function legalMaturityTargets(from: StrategyMaturityPhase): readonly StrategyMaturityPhase[] {
  return STRATEGY_MATURITY_PHASES.filter((to) => to !== from && isValidMaturityTransition(from, to));
}

/** Is the instance visible to a non-admin viewer under this routing? */
export function isClientVisible(routing: ProductRouting, surface: "dart" | "im"): boolean {
  if (routing === "internal_only") return false;
  if (routing === "both") return true;
  if (surface === "dart") return routing === "dart_only";
  return routing === "im_only";
}
