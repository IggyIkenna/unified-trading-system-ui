/**
 * G1.10 — Questionnaire TypeScript schema.
 *
 * Mirrors the UAC Pydantic model at
 * `unified-api-contracts/unified_api_contracts/internal/architecture_v2/restriction_profiles.py`
 * (`QuestionnaireResponse`). Keep the two in sync manually — the closed
 * enums are small and the drift risk is low. When the schema grows past
 * 10 fields, promote to a G1.8-style PM→TS sync script.
 *
 * SSOT (Python):
 *   - QuestionnaireResponse
 *   - QuestionnaireCategory
 *   - QuestionnaireInstrumentType
 *   - QuestionnaireStrategyStyle
 *   - QuestionnaireServiceFamily
 *   - QuestionnaireFundStructure
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
 * The 6-axis response shape. Every axis is required; empty tuples are
 * allowed (vague response → base profile fallback in UAC overlay logic).
 */
export interface QuestionnaireResponse {
  readonly categories: readonly QuestionnaireCategory[];
  readonly instrument_types: readonly QuestionnaireInstrumentType[];
  readonly venue_scope: readonly string[] | "all";
  readonly strategy_style: readonly QuestionnaireStrategyStyle[];
  readonly service_family: QuestionnaireServiceFamily;
  readonly fund_structure: QuestionnaireFundStructure;
}

/**
 * Client-side submission sink — picks localStorage (dev-mock) or Firestore
 * (staging/prod). Written once at page submit; downstream demo-provider
 * reads the same payload when hydrating a persona.
 */
export const QUESTIONNAIRE_LOCAL_STORAGE_KEY = "questionnaire-response-v1" as const;
