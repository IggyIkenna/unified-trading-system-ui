/**
 * G1.10 — Questionnaire TypeScript schema.
 *
 * Mirrors the UAC Pydantic model at
 * `unified-api-contracts/unified_api_contracts/internal/architecture_v2/restriction_profiles.py`
 * (`QuestionnaireResponse`). Keep the two in sync manually — the closed
 * enums are small and the drift risk is low.
 *
 * 2026-04-21 Reg-Umbrella extension
 * (`plans/active/reg_umbrella_questionnaire_and_onboarding_docs_2026_04_21.plan.md`):
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

export type QuestionnaireFundStructure = "SMA" | "Pooled" | "NA";

export const QUESTIONNAIRE_FUND_STRUCTURES: readonly QuestionnaireFundStructure[] = [
  "SMA",
  "Pooled",
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
 * The response shape. The 6 base axes are always required; empty tuples
 * are allowed (vague response → base profile fallback in UAC overlay
 * logic). The 7 Reg-Umbrella axes (2026-04-21) are optional — collected
 * by the UI only when `service_family ∈ {RegUmbrella, combo}` and ignored
 * by persona-resolution + tile-lock overlay today. They surface in the
 * admin org detail view.
 */
export interface QuestionnaireResponse {
  // ── Base 6 axes (required) ──────────────────────────────────────────
  readonly categories: readonly QuestionnaireCategory[];
  readonly instrument_types: readonly QuestionnaireInstrumentType[];
  readonly venue_scope: readonly string[] | "all";
  readonly strategy_style: readonly QuestionnaireStrategyStyle[];
  readonly service_family: QuestionnaireServiceFamily;
  readonly fund_structure: QuestionnaireFundStructure;

  // ── Reg-Umbrella axes (optional) ────────────────────────────────────
  readonly licence_region?: QuestionnaireLicenceRegion | null;
  readonly targets_3mo?: string | null;
  readonly targets_1yr?: string | null;
  readonly targets_2yr?: string | null;
  readonly own_mlro?: boolean | null;
  readonly entity_jurisdiction?: string | null;
  readonly supported_currencies?: readonly string[];
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
}

export const QUESTIONNAIRE_ENVELOPE_LOCAL_STORAGE_KEY = "questionnaire-envelope-v1" as const;
