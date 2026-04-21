// PLACEHOLDER — replaced by lib/architecture-v2/lifecycle.ts once Plan A Phase 2
// propagation ships. Do not delete before then; the handoff PR will rename this
// file or replace its contents wholesale.
//
// Mirrors the shape declared in plans/active/strategy_lifecycle_maturity_model_2026_04_21.plan.md
// (Phase 1 enums + 5-dim StrategyInstance). Plan A (unified-api-contracts +
// unified-trading-pm/scripts/propagation) is mid-flight; until it lands + the
// UI reference-data JSON regenerates, every downstream component imports from
// HERE so the handoff is a single-file swap.

import type { StrategyArchetype, StrategyFamily } from "./enums";

/** 9 forward-only maturity phases + orthogonal `retired` terminal state. */
export type StrategyMaturityPhase =
  | "smoke"
  | "backtest_minimal"
  | "backtest_1yr"
  | "backtest_multi_year"
  | "paper_1d"
  | "paper_14d"
  | "paper_stable"
  | "live_early"
  | "live_stable"
  | "retired";

export const STRATEGY_MATURITY_PHASES: readonly StrategyMaturityPhase[] = [
  "smoke",
  "backtest_minimal",
  "backtest_1yr",
  "backtest_multi_year",
  "paper_1d",
  "paper_14d",
  "paper_stable",
  "live_early",
  "live_stable",
  "retired",
] as const;

/** Maps each phase to its user-facing label (short, ≤14 chars for chip use). */
export const MATURITY_PHASE_LABEL: Record<StrategyMaturityPhase, string> = {
  smoke: "Smoke",
  backtest_minimal: "Backtest <1y",
  backtest_1yr: "Backtest 1y",
  backtest_multi_year: "Backtest Ny",
  paper_1d: "Paper 1d",
  paper_14d: "Paper 14d",
  paper_stable: "Paper stable",
  live_early: "Live (early)",
  live_stable: "Live (stable)",
  retired: "Retired",
};

/** Maps each phase to a stable Tailwind token palette for badge rendering. */
export const MATURITY_PHASE_TONE: Record<StrategyMaturityPhase, "muted" | "amber" | "sky" | "emerald" | "violet"> = {
  smoke: "muted",
  backtest_minimal: "muted",
  backtest_1yr: "amber",
  backtest_multi_year: "amber",
  paper_1d: "sky",
  paper_14d: "sky",
  paper_stable: "violet",
  live_early: "emerald",
  live_stable: "emerald",
  retired: "muted",
};

/** Which customer surfaces an instance may be routed to. */
export type ProductRouting = "dart_only" | "im_only" | "both" | "internal_only";

export const PRODUCT_ROUTING_LABEL: Record<ProductRouting, string> = {
  dart_only: "DART",
  im_only: "IM",
  both: "DART + IM",
  internal_only: "Internal",
};

/** Collateral-currency share classes. Null on the instance when only one variant exists. */
export type ShareClass = "btc" | "eth" | "usd" | "usdt";

export const SHARE_CLASS_LABEL: Record<ShareClass, string> = {
  btc: "BTC",
  eth: "ETH",
  usd: "USD",
  usdt: "USDT",
};

/** Pricing tier declared by a venue-set variant. Drives upsell ladder copy. */
export type VenueSetPricingTier = "base" | "premium" | "top_tier" | "apex";

/**
 * Identifier for a named venue-set + instrument-type-set bundle (e.g.
 * `ely_base_3cex` = [OKX, Binance, Bybit]). Plan A Phase 1
 * registry/venue_set_variants/ declares the canonical ladder.
 */
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
 * share_class}. `share_class` is null when the archetype has only one share
 * class variant. `instance_id` is a deterministic hash of the other fields
 * (see Plan A p1-strategy-instance-5dim-rewrite).
 */
export interface StrategyInstanceV5 {
  readonly instanceId: string;
  readonly family: StrategyFamily;
  readonly archetype: StrategyArchetype;
  readonly venueSetVariantId: VenueSetVariantId;
  readonly instrumentTypeSet: readonly string[];
  readonly shareClass: ShareClass | null;
}

/**
 * Mutable lifecycle state for an instance. Sourced from Firestore
 * `strategy_instance_lifecycle/{instance_id}` once Plan A Phase 3 ships.
 * Series-refs point to `odum-paper` / `odum-live` account P&L streams.
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

/**
 * Default lifecycle view for a not-yet-Plan-A-materialised instance. Renders
 * as "—" everywhere with the "Populated by Plan A / Phase 2" tooltip.
 */
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

/**
 * Gate: does this maturity phase permit offering an allocation CTA?
 * Matches the plan's p5-fomo-cta-gating-test: only `paper_stable` and later.
 */
export function allowsAllocationCta(phase: StrategyMaturityPhase): boolean {
  return (
    phase === "paper_stable" ||
    phase === "live_early" ||
    phase === "live_stable"
  );
}

/**
 * Gate: is the instance visible to a non-admin viewer under this routing?
 * Internal-only is hidden from client surfaces.
 */
export function isClientVisible(
  routing: ProductRouting,
  surface: "dart" | "im",
): boolean {
  if (routing === "internal_only") return false;
  if (routing === "both") return true;
  if (surface === "dart") return routing === "dart_only";
  return routing === "im_only";
}
