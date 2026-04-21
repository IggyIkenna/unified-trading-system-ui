/**
 * Questionnaire -> Persona resolver (Phase 4 of
 * `ui_unification_v2_sanitisation_2026_04_20.plan.md`).
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

import type { QuestionnaireResponse } from "@/lib/questionnaire/types";

export type ResolvedPersonaId =
  | "prospect-dart"
  | "prospect-im-sma"
  | "prospect-im-pooled"
  | "prospect-regulatory"
  | "prospect-signals-only"
  | "prospect-generic";

/**
 * Canonical mapping used by runtime persona resolution and by the admin
 * playback surface. Keyed on persona id, value is the AuthPersona.id used by
 * `lib/auth/personas.ts`. `prospect-im-sma` / `prospect-im-pooled` route to
 * the existing `client-im-sma` / `client-im-pooled` personas so the auth
 * provider can seed a live user without adding new personas in the same
 * wave. `prospect-generic` falls back to `prospect-dart` (broad safe view).
 */
export const RESOLVED_PERSONA_TO_AUTH_ID: Readonly<
  Record<ResolvedPersonaId, string>
> = {
  "prospect-dart": "prospect-dart",
  "prospect-im-sma": "client-im-sma",
  "prospect-im-pooled": "client-im-pooled",
  "prospect-regulatory": "prospect-regulatory",
  "prospect-signals-only": "prospect-signals-only",
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
  const researchStyles = new Set([
    "ml_directional",
    "rules_directional",
    "event_driven",
    "stat_arb",
    "vol_trading",
  ]);
  const hasResearchStyle = response.strategy_style.some((s) =>
    researchStyles.has(s),
  );
  if (hasResearchStyle) return false;

  // Signals-In prospects typically pick carry / arbitrage / market_making —
  // strategies the client is prepared to run on their own signals but needs
  // Odum to execute + report.
  const execOnlyStyles = new Set(["carry", "arbitrage", "market_making"]);
  const allExecOnly = response.strategy_style.every((s) =>
    execOnlyStyles.has(s),
  );
  // Heuristic: only route to signals-only when the prospect picked execution
  // oriented styles AND service_family is DART (not combo which is broader).
  return (
    response.service_family === "DART" &&
    response.strategy_style.length > 0 &&
    allExecOnly
  );
}

export function resolvePersonaFromQuestionnaire(
  response: QuestionnaireResponse,
): ResolvedPersonaId {
  switch (response.service_family) {
    case "IM": {
      if (response.fund_structure === "SMA") return "prospect-im-sma";
      // Pooled + NA default to pooled shape — commercial SSOT treats NA as
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
      "prospect-generic",
    ];
    return valid.includes(raw as ResolvedPersonaId)
      ? (raw as ResolvedPersonaId)
      : null;
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
