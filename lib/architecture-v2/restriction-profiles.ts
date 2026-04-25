// AUTO-GENERATED from PM demo-ops/profiles/*.yaml.
// Do not edit by hand. Re-run:
//   bash unified-trading-pm/scripts/propagation/sync-restriction-profiles-to-ui.sh --write
// SSOT: unified-trading-pm/codex/14-playbooks/demo-ops/profiles/*.yaml
// Validator: unified-trading-pm/codex/14-playbooks/demo-ops/_tools/validate_profiles.py
// UAC engine: unified-api-contracts/unified_api_contracts/internal/architecture_v2/restriction_profiles.py

import type { TileLockState } from "../visibility/tile-lock-state";

export type PersonaId =
  | "admin"
  | "anon"
  | "client-full"
  | "desmond-dart-full"
  | "desmond-signals-in"
  | "elysium-defi-full"
  | "prospect-dart"
  | "prospect-dart-full"
  | "prospect-dart-signals-in"
  | "prospect-im"
  | "prospect-perp-funding"
  | "prospect-regulatory";

export type DemoFlavour = "broader_platform" | "turbo" | "deep_dive" | "sales_pitch";

export type TileId =
  | "data"
  | "research"
  | "promote"
  | "trading"
  | "observe"
  | "reports"
  | "investor-relations"
  | "admin";

export interface RestrictionProfileYaml {
  readonly persona_id: PersonaId;
  readonly base_audience: string;
  readonly description: string;
  readonly tiles: Readonly<Record<TileId, TileLockState>>;
  readonly flavour_overrides: Readonly<
    Partial<Record<DemoFlavour, Readonly<Partial<Record<TileId, TileLockState>>>>>
  >;
}

export const RESTRICTION_PROFILES: Readonly<Record<PersonaId, RestrictionProfileYaml>> = {
  "admin": {
      "base_audience": "admin",
      "description": "Odum internal admin. Sees every service tile unlocked regardless of flavour. Short-circuit path in `access_control` \u2014 admin scope always allows.",
      "flavour_overrides": {},
      "persona_id": "admin",
      "tiles": {
          "admin": "unlocked",
          "data": "unlocked",
          "investor-relations": "unlocked",
          "observe": "unlocked",
          "promote": "unlocked",
          "reports": "unlocked",
          "research": "unlocked",
          "trading": "unlocked"
      }
  },
  "anon": {
      "base_audience": "trading_platform_subscriber",
      "description": "Anonymous visitor (no authenticated persona). Every service tile is hidden \u2014 the marketing site routes them to sign-in / book-a-call flows before any tile becomes reachable. Present here so the engine returns a deterministic profile rather than a default-null.",
      "flavour_overrides": {},
      "persona_id": "anon",
      "tiles": {
          "admin": "hidden",
          "data": "hidden",
          "investor-relations": "hidden",
          "observe": "hidden",
          "promote": "hidden",
          "reports": "hidden",
          "research": "hidden",
          "trading": "hidden"
      }
  },
  "client-full": {
      "base_audience": "trading_platform_subscriber",
      "description": "Paying full-DART client. Operates the full Research\u2192Promote\u2192Trading\u2192Observe lifecycle with reporting. Does not see investor-relations (that's IM-side).",
      "flavour_overrides": {
          "deep_dive": {},
          "turbo": {
              "reports": "padlocked-visible"
          }
      },
      "persona_id": "client-full",
      "tiles": {
          "admin": "hidden",
          "data": "unlocked",
          "investor-relations": "hidden",
          "observe": "unlocked",
          "promote": "unlocked",
          "reports": "unlocked",
          "research": "unlocked",
          "trading": "unlocked"
      }
  },
  "desmond-dart-full": {
      "base_audience": "trading_platform_subscriber",
      "description": "",
      "flavour_overrides": {},
      "persona_id": "desmond-dart-full",
      "tiles": {
          "admin": "hidden",
          "data": "unlocked",
          "investor-relations": "unlocked",
          "observe": "unlocked",
          "promote": "unlocked",
          "reports": "unlocked",
          "research": "unlocked",
          "trading": "unlocked"
      }
  },
  "desmond-signals-in": {
      "base_audience": "trading_platform_subscriber",
      "description": "",
      "flavour_overrides": {},
      "persona_id": "desmond-signals-in",
      "tiles": {
          "admin": "hidden",
          "data": "unlocked",
          "investor-relations": "unlocked",
          "observe": "unlocked",
          "promote": "padlocked-visible",
          "reports": "unlocked",
          "research": "padlocked-visible",
          "trading": "unlocked"
      }
  },
  "elysium-defi-full": {
      "base_audience": "trading_platform_subscriber",
      "description": "Patrick / Elysium DeFi Full upgrade-preview persona. Same universe access as the base elysium-defi persona but with strategy-full + ml-full entitlements unlocked so research + promote + customisation tiles are visible. Toggle from elysium-defi via DemoPlanToggle.",
      "flavour_overrides": {},
      "persona_id": "elysium-defi-full",
      "tiles": {
          "admin": "hidden",
          "data": "unlocked",
          "investor-relations": "hidden",
          "observe": "unlocked",
          "promote": "unlocked",
          "reports": "unlocked",
          "research": "unlocked",
          "trading": "unlocked"
      }
  },
  "prospect-dart": {
      "base_audience": "trading_platform_subscriber",
      "description": "Warm DART prospect. Sees the DART engagement story \u2014 data, research, trading, observe, reporting. Promote is padlocked as a full-DART upsell tease. Investor-relations is hidden (IM-only).",
      "flavour_overrides": {
          "broader_platform": {
              "promote": "unlocked"
          },
          "turbo": {
              "data": "padlocked-visible",
              "reports": "padlocked-visible",
              "research": "padlocked-visible"
          }
      },
      "persona_id": "prospect-dart",
      "tiles": {
          "admin": "hidden",
          "data": "unlocked",
          "investor-relations": "hidden",
          "observe": "unlocked",
          "promote": "padlocked-visible",
          "reports": "unlocked",
          "research": "unlocked",
          "trading": "unlocked"
      }
  },
  "prospect-dart-full": {
      "base_audience": "trading_platform_subscriber",
      "description": "Generic DART Full prospect demo persona \u2014 equivalent to client-full but used in prospect demos where the org isn't a paying client yet. All Research \u2192 Promote \u2192 Trading \u2192 Observe lifecycle tiles unlocked.",
      "flavour_overrides": {},
      "persona_id": "prospect-dart-full",
      "tiles": {
          "admin": "hidden",
          "data": "unlocked",
          "investor-relations": "hidden",
          "observe": "unlocked",
          "promote": "unlocked",
          "reports": "unlocked",
          "research": "unlocked",
          "trading": "unlocked"
      }
  },
  "prospect-dart-signals-in": {
      "base_audience": "trading_platform_subscriber",
      "description": "Generic DART Signals-In prospect demo persona. Trading + signal-intake + observe + reports unlocked; research + promote padlocked (kept visible to signal upgrade path). Strategy catalogue visible (read-only universe).",
      "flavour_overrides": {},
      "persona_id": "prospect-dart-signals-in",
      "tiles": {
          "admin": "hidden",
          "data": "unlocked",
          "investor-relations": "hidden",
          "observe": "unlocked",
          "promote": "padlocked-visible",
          "reports": "unlocked",
          "research": "padlocked-visible",
          "trading": "unlocked"
      }
  },
  "prospect-im": {
      "base_audience": "im_client",
      "description": "Warm prospect on the IM path. Odum runs strategies; client sees reporting + capital statements. DART surfaces (research/promote/trading/observe) are hidden because IM clients don't operate strategies themselves.",
      "flavour_overrides": {
          "sales_pitch": {
              "data": "padlocked-visible"
          },
          "turbo": {
              "data": "hidden"
          }
      },
      "persona_id": "prospect-im",
      "tiles": {
          "admin": "hidden",
          "data": "padlocked-visible",
          "investor-relations": "unlocked",
          "observe": "hidden",
          "promote": "hidden",
          "reports": "unlocked",
          "research": "hidden",
          "trading": "hidden"
      }
  },
  "prospect-perp-funding": {
      "base_audience": "trading_platform_subscriber",
      "description": "Reg-Umbrella + DART Signals-In prospect operating cross-exchange perp-funding arbitrage (CeFi + DeFi). Trading + signal-intake + reports + observe unlocked; research + promote padlocked.",
      "flavour_overrides": {},
      "persona_id": "prospect-perp-funding",
      "tiles": {
          "admin": "hidden",
          "data": "unlocked",
          "investor-relations": "hidden",
          "observe": "unlocked",
          "promote": "padlocked-visible",
          "reports": "unlocked",
          "research": "padlocked-visible",
          "trading": "unlocked"
      }
  },
  "prospect-regulatory": {
      "base_audience": "reg_umbrella_client",
      "description": "Warm prospect on the Reg Umbrella path. Emerging manager who will operate their own strategies under Odum's regulatory wrapper. Sees reporting + compliance-facing tiles. Research/promote hidden (compliance overlay, not strategy research surface). Trading + observe padlocked because the client will operate those under their own infra once onboarded.",
      "flavour_overrides": {
          "deep_dive": {
              "observe": "unlocked",
              "trading": "unlocked"
          },
          "turbo": {
              "observe": "hidden",
              "trading": "hidden"
          }
      },
      "persona_id": "prospect-regulatory",
      "tiles": {
          "admin": "hidden",
          "data": "padlocked-visible",
          "investor-relations": "hidden",
          "observe": "padlocked-visible",
          "promote": "hidden",
          "reports": "unlocked",
          "research": "hidden",
          "trading": "padlocked-visible"
      }
  },
} as const;

/**
 * Resolve the effective tile lock-state for a persona + optional flavour.
 * Matches the overlay order of
 * `unified_api_contracts.internal.architecture_v2.restriction_profiles.resolve_profile`:
 * base → flavour → (questionnaire no-op) → (env no-op).
 */
export function resolveTileLockState(
  personaId: PersonaId | string,
  tileId: TileId,
  flavour?: DemoFlavour,
): TileLockState {
  const profile = RESTRICTION_PROFILES[personaId as PersonaId];
  if (profile === undefined) {
    // Unknown persona → hidden (matches anon.yaml semantics + UAC fallback).
    return "hidden";
  }
  const override = flavour !== undefined ? profile.flavour_overrides[flavour] : undefined;
  if (override !== undefined && override[tileId] !== undefined) {
    return override[tileId] as TileLockState;
  }
  return profile.tiles[tileId];
}

export const KNOWN_PERSONA_IDS: readonly PersonaId[] = Object.keys(RESTRICTION_PROFILES).sort() as PersonaId[];
