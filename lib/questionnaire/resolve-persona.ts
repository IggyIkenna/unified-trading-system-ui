/**
 * Questionnaire -> Persona resolver (Phase 4 of
 * `ui_unification_v2_sanitisation_2026_04_20.md`).
 *
 * Bridges the 6-axis `QuestionnaireResponse` (SSOT in
 * `unified-api-contracts/unified_api_contracts/internal/architecture_v2/restriction_profiles.py`)
 * onto the restriction-profile / persona catalogue in
 * `lib/auth/personas.ts`. The returned persona id seeds the
 * AvailabilityStoreProvider visibility filter + the demo-auth session.
 *
 * Logic mirrors codex:
 *   unified-trading-pm/codex/09-strategy/architecture-v2/restriction-policy.md
 *   § 4 Questionnaire-driven filtering
 *
 * The IM axis splits on fund_structure:
 *   - SMA             -> client-im-sma
 *   - Pooled          -> client-im-pooled
 *   - NA              -> client-im-pooled (default Pooled treatment per plan)
 *
 * DART + reduced entitlements -> prospect-signals-only (DART Signals-In path).
 * Pure DART answer            -> prospect-dart.
 * RegUmbrella                 -> prospect-regulatory.
 * combo                       -> prospect-dart (broadest visibility).
 * Unrecognised / fallback     -> prospect-dart (safe generic).
 */

import type { CoverageStatus, StrategyCatalogueFilter } from "@/lib/architecture-v2/catalogue-filter";
import type { ShareClass, StrategyFamily, VenueAssetGroupV2 } from "@/lib/architecture-v2/enums";
import type { QuestionnaireResponse } from "@/lib/questionnaire/types";

export type ResolvedPersonaId =
  | "prospect-dart"
  | "prospect-im-sma"
  | "prospect-im-pooled"
  | "prospect-regulatory"
  | "prospect-signals-only"
  | "prospect-perp-funding"
  | "prospect-generic";

/**
 * Canonical mapping used by runtime persona resolution and by the admin
 * playback surface. Keyed on persona id, value is the AuthPersona.id used by
 * `lib/auth/personas.ts`. `prospect-im-sma` / `prospect-im-pooled` route to
 * the existing `client-im-sma` / `client-im-pooled` personas so the auth
 * provider can seed a live user without adding new personas in the same
 * wave. `prospect-generic` falls back to `prospect-dart` (broad safe view).
 */
export const RESOLVED_PERSONA_TO_AUTH_ID: Readonly<Record<ResolvedPersonaId, string>> = {
  "prospect-dart": "prospect-dart",
  "prospect-im-sma": "client-im-sma",
  "prospect-im-pooled": "client-im-pooled",
  "prospect-regulatory": "prospect-regulatory",
  "prospect-signals-only": "prospect-signals-only",
  "prospect-perp-funding": "prospect-perp-funding",
  "prospect-generic": "prospect-dart",
};

export const RESOLVED_PERSONA_STORAGE_KEY = "odum-persona/v1" as const;

/**
 * True iff the questionnaire indicates DART-only entitlements without
 * ML / Research intent. Defines the DART-Signals-In slice.
 */
function isDartSignalsIn(response: QuestionnaireResponse): boolean {
  if (response.service_family !== "DART" && response.service_family !== "combo") {
    return false;
  }
  // A DART Signals-In prospect only ticks execution + data-style styles and
  // does NOT pick ml_directional / rules_directional / event_driven (which
  // require DART Full research + model build).
  const researchStyles = new Set(["ml_directional", "rules_directional", "event_driven", "stat_arb", "vol_trading"]);
  const hasResearchStyle = response.strategy_style.some((s) => researchStyles.has(s));
  if (hasResearchStyle) return false;

  // Signals-In prospects typically pick carry / arbitrage / market_making —
  // strategies the client is prepared to run on their own signals but needs
  // Odum to execute + report.
  const execOnlyStyles = new Set(["carry", "arbitrage", "market_making"]);
  const allExecOnly = response.strategy_style.every((s) => execOnlyStyles.has(s));
  // Heuristic: only route to signals-only when the prospect picked execution
  // oriented styles AND service_family is DART (not combo which is broader).
  return response.service_family === "DART" && response.strategy_style.length > 0 && allExecOnly;
}

/**
 * True iff the questionnaire signature matches a Desmond-shape prospect:
 * Reg Umbrella OR combo + perp instruments + arbitrage (or carry) strategy
 * style + CeFi or DeFi categories. Route to `prospect-perp-funding` so the
 * demo session lands with cross-exchange perp-funding arb strategies
 * unlocked and everything else scoped away.
 */
function isPerpFundingArbShape(response: QuestionnaireResponse): boolean {
  const regOrCombo = response.service_family === "RegUmbrella" || response.service_family === "combo";
  if (!regOrCombo) return false;
  const hasPerp = response.instrument_types.includes("perp");
  const hasArbStyle = response.strategy_style.includes("arbitrage") || response.strategy_style.includes("carry");
  const hasCrossExchangeCats = response.categories.includes("CeFi") || response.categories.includes("DeFi");
  return hasPerp && hasArbStyle && hasCrossExchangeCats;
}

export function resolvePersonaFromQuestionnaire(response: QuestionnaireResponse): ResolvedPersonaId {
  // Desmond-shape route takes precedence over the generic family switch —
  // a RegUmbrella prospect who specifically answered perp + arbitrage gets
  // the perp-funding demo surface rather than the bare regulatory one.
  if (isPerpFundingArbShape(response)) return "prospect-perp-funding";

  switch (response.service_family) {
    case "IM": {
      if ((response.fund_structure ?? []).includes("SMA")) return "prospect-im-sma";
      // Pooled + NA + prop default to pooled shape — commercial SSOT treats NA/prop as
      // pooled for filter purposes.
      return "prospect-im-pooled";
    }
    case "RegUmbrella":
      return "prospect-regulatory";
    case "DART": {
      if (isDartSignalsIn(response)) return "prospect-signals-only";
      return "prospect-dart";
    }
    case "combo":
      // combo = union of DART + IM filters; route to prospect-dart for the
      // broadest visibility slice. Admin can override downstream.
      return "prospect-dart";
    default:
      return "prospect-generic";
  }
}

/**
 * Persist the resolved persona id to `localStorage` so the
 * AvailabilityStoreProvider (+ downstream audience helpers) can seed on the
 * next navigation. Safe to call on server; no-ops when `window` is absent.
 */
export function persistResolvedPersona(id: ResolvedPersonaId): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RESOLVED_PERSONA_STORAGE_KEY, id);
  } catch {
    // quota exhausted — silently drop in dev
  }
}

export function readResolvedPersona(): ResolvedPersonaId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RESOLVED_PERSONA_STORAGE_KEY);
    if (raw === null) return null;
    const valid: ResolvedPersonaId[] = [
      "prospect-dart",
      "prospect-im-sma",
      "prospect-im-pooled",
      "prospect-regulatory",
      "prospect-signals-only",
      "prospect-perp-funding",
      "prospect-generic",
    ];
    return valid.includes(raw as ResolvedPersonaId) ? (raw as ResolvedPersonaId) : null;
  } catch {
    return null;
  }
}

export function clearResolvedPersona(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RESOLVED_PERSONA_STORAGE_KEY);
  } catch {
    // nothing to do
  }
}

const CATEGORY_TO_ASSET_GROUP: Record<string, VenueAssetGroupV2> = {
  CeFi: "CEFI",
  DeFi: "DEFI",
  TradFi: "TRADFI",
  Sports: "SPORTS",
  Prediction: "PREDICTION",
};

const STYLE_TO_FAMILY: Record<string, StrategyFamily> = {
  ml_directional: "ML_DIRECTIONAL",
  rules_directional: "RULES_DIRECTIONAL",
  carry: "CARRY_AND_YIELD",
  arbitrage: "ARBITRAGE_STRUCTURAL",
  market_making: "MARKET_MAKING",
  event_driven: "EVENT_DRIVEN",
  vol_trading: "VOL_TRADING",
  stat_arb: "STAT_ARB_PAIRS",
};

const SHARE_CLASS_MAP: Record<string, readonly ShareClass[]> = {
  usd_only: ["USDT", "USDC", "USD", "GBP", "EUR"],
  btc_neutral: ["BTC"],
  eth_neutral: ["ETH"],
};

/**
 * Map a `QuestionnaireResponse` to a pre-seeded `StrategyCatalogueFilter`
 * for the FOMO/Explore tab. Rules-based expansion layer: carry + neutral
 * also surfaces `ARBITRAGE_STRUCTURAL` (structural arb is market-neutral
 * by construction and closely related to carry strategies).
 */
export function seedFiltersFromQuestionnaire(r: QuestionnaireResponse): StrategyCatalogueFilter {
  const filter: {
    families?: readonly StrategyFamily[];
    venueAssetGroups?: readonly VenueAssetGroupV2[];
    shareClasses?: readonly ShareClass[];
    coverageStatuses?: readonly CoverageStatus[];
  } = {};

  // categories → venue asset_group
  if (r.categories?.length) {
    const mapped = r.categories
      .map((c) => CATEGORY_TO_ASSET_GROUP[c])
      .filter((v): v is VenueAssetGroupV2 => v !== undefined);
    if (mapped.length) filter.venueAssetGroups = mapped;
  }

  // strategy_style → families
  let families: StrategyFamily[] = [];
  if (r.strategy_style?.length) {
    families = r.strategy_style.map((s) => STYLE_TO_FAMILY[s]).filter((f): f is StrategyFamily => f !== undefined);
  }

  // market_neutral expansion — if no styles chosen, derive from neutrality
  if (r.market_neutral === "neutral") {
    // Include ARBITRAGE_STRUCTURAL alongside CARRY_AND_YIELD (structural arb is neutral)
    if (families.length > 0) {
      if (families.includes("CARRY_AND_YIELD") && !families.includes("ARBITRAGE_STRUCTURAL")) {
        families = [...families, "ARBITRAGE_STRUCTURAL"];
      }
    } else {
      families = ["CARRY_AND_YIELD", "ARBITRAGE_STRUCTURAL", "MARKET_MAKING", "STAT_ARB_PAIRS"];
    }
  } else if (r.market_neutral === "directional" && families.length === 0) {
    families = ["ML_DIRECTIONAL", "RULES_DIRECTIONAL", "EVENT_DRIVEN"];
  }

  if (families.length) filter.families = families;

  // risk_profile → coverage_status preference
  if (r.risk_profile === "low") {
    filter.coverageStatuses = ["SUPPORTED"];
  } else if (r.risk_profile === "high") {
    filter.coverageStatuses = ["SUPPORTED", "PARTIAL"];
  }

  // share_class_preferences → shareClasses (union all selected, empty = no filter)
  if (r.share_class_preferences && r.share_class_preferences.length > 0) {
    const allClasses = r.share_class_preferences.flatMap((p) => SHARE_CLASS_MAP[p] ?? []);
    const unique = [...new Set(allClasses)] as ShareClass[];
    if (unique.length) filter.shareClasses = unique;
  }

  return filter;
}
