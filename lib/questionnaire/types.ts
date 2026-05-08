/**
 * G1.10 — Questionnaire TypeScript schema.
 *
 * Mirrors the UAC Pydantic model at
 * `unified-api-contracts/unified_api_contracts/internal/architecture_v2/restriction_profiles.py`
 * (`QuestionnaireResponse`). Keep the two in sync manually — the closed
 * enums are small and the drift risk is low.
 *
 * 2026-04-21 Reg-Umbrella extension
 * (`plans/active/reg_umbrella_questionnaire_and_onboarding_docs_2026_04_21.plan`):
 * the 7 new axes are optional. Responses authored before this date remain
 * valid — every downstream consumer must treat the new fields as
 * `undefined`-tolerant.
 *
 * SSOT (Python):
 *   - QuestionnaireResponse
 *   - QuestionnaireCategory
 *   - QuestionnaireInstrumentType
 *   - QuestionnaireStrategyStyle
 *   - QuestionnaireServiceFamily
 *   - QuestionnaireFundStructure
 *   - QuestionnaireLicenceRegion  (2026-04-21)
 */

export type QuestionnaireCategory = "CeFi" | "DeFi" | "TradFi" | "Sports" | "Prediction";

export const QUESTIONNAIRE_CATEGORIES: readonly QuestionnaireCategory[] = [
  "CeFi",
  "DeFi",
  "TradFi",
  "Sports",
  "Prediction",
] as const;

export type QuestionnaireInstrumentType =
  | "spot"
  | "perp"
  | "dated_future"
  | "option"
  | "lending"
  | "staking"
  | "lp"
  | "event_settled";

export const QUESTIONNAIRE_INSTRUMENT_TYPES: readonly QuestionnaireInstrumentType[] = [
  "spot",
  "perp",
  "dated_future",
  "option",
  "lending",
  "staking",
  "lp",
  "event_settled",
] as const;

export type QuestionnaireStrategyStyle =
  | "ml_directional"
  | "rules_directional"
  | "stat_arb"
  | "arbitrage"
  | "carry"
  | "event_driven"
  | "market_making"
  | "vol_trading";

export const QUESTIONNAIRE_STRATEGY_STYLES: readonly QuestionnaireStrategyStyle[] = [
  "ml_directional",
  "rules_directional",
  "stat_arb",
  "arbitrage",
  "carry",
  "event_driven",
  "market_making",
  "vol_trading",
] as const;

export type QuestionnaireServiceFamily = "IM" | "DART" | "RegUmbrella" | "combo";

export const QUESTIONNAIRE_SERVICE_FAMILIES: readonly QuestionnaireServiceFamily[] = [
  "IM",
  "DART",
  "RegUmbrella",
  "combo",
] as const;

export type QuestionnaireFundStructure = "SMA" | "Pooled" | "prop" | "NA";

export const QUESTIONNAIRE_FUND_STRUCTURES: readonly QuestionnaireFundStructure[] = [
  "SMA",
  "Pooled",
  "prop",
  "NA",
] as const;

/**
 * Regulatory-licence jurisdiction preference — only collected when
 * `service_family ∈ {RegUmbrella, combo}`. "other" is a free-text escape
 * hatch captured alongside in `entity_jurisdiction`.
 *
 * 2026-04-21 (plan: reg-umbrella-questionnaire-and-onboarding-docs).
 */
export type QuestionnaireLicenceRegion =
  | "EU_only"
  | "UK_only"
  | "EU_or_UK"
  | "EU_and_UK"
  | "other";

export const QUESTIONNAIRE_LICENCE_REGIONS: readonly QuestionnaireLicenceRegion[] = [
  "EU_only",
  "UK_only",
  "EU_or_UK",
  "EU_and_UK",
  "other",
] as const;

/**
 * Market exposure preference axis (2026-04-24).
 * Drives FOMO catalogue filter seeding in `seedFiltersFromQuestionnaire()`.
 */
export type QuestionnaireMarketNeutrality = "neutral" | "directional" | "both";

export const QUESTIONNAIRE_MARKET_NEUTRALITIES: readonly QuestionnaireMarketNeutrality[] = [
  "neutral",
  "directional",
  "both",
] as const;

/** Base currency / hedging preference axis (2026-04-24). */
export type QuestionnaireShareClassPreference = "btc_neutral" | "eth_neutral" | "usd_only" | "any";

export const QUESTIONNAIRE_SHARE_CLASS_PREFERENCES: readonly QuestionnaireShareClassPreference[] = [
  "usd_only",
  "btc_neutral",
  "eth_neutral",
  "any",
] as const;

/** Risk appetite axis (2026-04-24). */
export type QuestionnaireRiskProfile = "low" | "medium" | "high";

export const QUESTIONNAIRE_RISK_PROFILES: readonly QuestionnaireRiskProfile[] = [
  "low",
  "medium",
  "high",
] as const;

/** Leverage tolerance axis (2026-04-24). */
export type QuestionnaireLeveragePreference = "none" | "low" | "medium" | "any";

export const QUESTIONNAIRE_LEVERAGE_PREFERENCES: readonly QuestionnaireLeveragePreference[] = [
  "none",
  "low",
  "medium",
  "any",
] as const;

/**
 * The response shape. The 6 base axes are always required; empty tuples
 * are allowed (vague response → base profile fallback in UAC overlay
 * logic). The 7 Reg-Umbrella axes (2026-04-21) are optional — collected
 * by the UI only when `service_family ∈ {RegUmbrella, combo}` and ignored
 * by persona-resolution + tile-lock overlay today. They surface in the
 * admin org detail view.
 *
 * The 5 strategy-preference axes (2026-04-24) are optional for all
 * service families. They feed `seedFiltersFromQuestionnaire()` in the
 * FOMO/Explore tab and the admin org detail view.
 */
export interface QuestionnaireResponse {
  // ── Base 6 axes (required) ──────────────────────────────────────────
  readonly categories: readonly QuestionnaireCategory[];
  readonly instrument_types: readonly QuestionnaireInstrumentType[];
  readonly venue_scope: readonly string[] | "all";
  readonly strategy_style: readonly QuestionnaireStrategyStyle[];
  readonly service_family: QuestionnaireServiceFamily;
  readonly fund_structure: readonly QuestionnaireFundStructure[];

  // ── Reg-Umbrella axes (optional) ────────────────────────────────────
  readonly licence_region?: QuestionnaireLicenceRegion | null;
  readonly targets_3mo?: string | null;
  readonly targets_1yr?: string | null;
  readonly targets_2yr?: string | null;
  readonly own_mlro?: boolean | null;
  readonly entity_jurisdiction?: string | null;
  readonly supported_currencies?: readonly string[];

  // ── Strategy-preference axes (optional; 2026-04-24) ─────────────────
  readonly market_neutral?: QuestionnaireMarketNeutrality | null;
  readonly share_class_preferences?: readonly QuestionnaireShareClassPreference[];
  readonly risk_profile?: QuestionnaireRiskProfile | null;
  readonly target_sharpe_min?: number | null;
  readonly leverage_preference?: QuestionnaireLeveragePreference | null;
}

/**
 * Client-side submission sink — picks localStorage (dev-mock) or Firestore
 * (staging/prod). Written once at page submit; downstream demo-provider
 * reads the same payload when hydrating a persona.
 */
export const QUESTIONNAIRE_LOCAL_STORAGE_KEY = "questionnaire-response-v1" as const;

/**
 * Envelope persisted alongside the questionnaire response so admins can
 * pivot from org / email → response. Added 2026-04-21 with the access-code
 * gate. No PII beyond email + firm name + a SHA-256 digest of the access
 * code (proof-of-access, not the code itself).
 */
export interface QuestionnaireEnvelope {
  readonly email: string;
  readonly firm_name: string;
  /** Hex SHA-256 digest of the access code used to unlock the page. */
  readonly access_code_fingerprint: string;
  /**
   * Stable id of the persisted response (Firestore doc id in staging/prod,
   * `q-local-<ts>` in dev/mock). Written by `submitQuestionnaire` after the
   * response lands so downstream signup can attach the response without a
   * server-side email lookup. See codex/08-workflows/signup-signin-workflow.md
   * §2.3.4.
   */
  readonly submissionId?: string;
}

export const QUESTIONNAIRE_ENVELOPE_LOCAL_STORAGE_KEY = "questionnaire-envelope-v1" as const;
