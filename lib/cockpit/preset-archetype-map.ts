/**
 * PRESET_ARCHETYPE_MAP — declarative binding between cockpit presets and the
 * strategy archetypes they surface.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §8 (Phase 6).
 *
 * Some presets bind to a fixed list of archetypes (`kind: "explicit"`);
 * others are dynamic and resolve their archetype set against the user's
 * subscriptions / signal-routing entitlements / maturity state at render
 * time (`kind: "resolver"`).
 */

import type { StrategyArchetype } from "@/lib/architecture-v2/enums";

export type PresetArchetypeBinding =
  | { readonly kind: "explicit"; readonly archetypeIds: readonly StrategyArchetype[] }
  | {
      readonly kind: "resolver";
      readonly resolver:
        | "signal-routing-visible" // archetypes reachable via Signals-In routing for this user
        | "subscribed-only" // user's owned strategies (live + paper)
        | "visible-by-maturity" // archetypes with at least one owned/available_to_request instance
        | "owned-or-mandate-allocated"; // for IM Executive Overview
    };

export const PRESET_ARCHETYPE_MAP: Readonly<Record<string, PresetArchetypeBinding>> = {
  "arbitrage-command": {
    kind: "explicit",
    archetypeIds: [
      "ARBITRAGE_PRICE_DISPERSION",
      "LIQUIDATION_CAPTURE",
      "CARRY_BASIS_PERP",
      "CARRY_BASIS_DATED",
      "STAT_ARB_PAIRS_FIXED",
    ],
  },

  "defi-yield-risk": {
    kind: "explicit",
    archetypeIds: [
      "YIELD_ROTATION_LENDING",
      "YIELD_STAKING_SIMPLE",
      "CARRY_RECURSIVE_STAKED",
      "CARRY_STAKED_BASIS",
      "LIQUIDATION_CAPTURE",
    ],
  },

  "volatility-research-lab": {
    kind: "explicit",
    archetypeIds: ["VOL_TRADING_OPTIONS", "ARBITRAGE_PRICE_DISPERSION"],
  },

  "sports-prediction-desk": {
    kind: "explicit",
    archetypeIds: [
      "ML_DIRECTIONAL_EVENT_SETTLED",
      "ARBITRAGE_PRICE_DISPERSION",
      "MARKET_MAKING_EVENT_SETTLED",
      "EVENT_DRIVEN",
    ],
  },

  // Resolver-driven — archetypes derived at render time from user state.
  "signals-in-monitor": { kind: "resolver", resolver: "signal-routing-visible" },
  "research-to-live-pipeline": { kind: "resolver", resolver: "visible-by-maturity" },
  "live-trading-desk": { kind: "resolver", resolver: "subscribed-only" },
  "executive-overview": { kind: "resolver", resolver: "owned-or-mandate-allocated" },
};
