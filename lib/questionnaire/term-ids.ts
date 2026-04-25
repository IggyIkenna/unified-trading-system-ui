/**
 * Maps closed questionnaire enum values to `lib/glossary.ts` term ids.
 * Keep in sync with `lib/questionnaire/types.ts` arrays.
 */
import type {
  QuestionnaireCategory,
  QuestionnaireFundStructure,
  QuestionnaireInstrumentType,
  QuestionnaireLicenceRegion,
  QuestionnaireServiceFamily,
  QuestionnaireStrategyStyle,
} from "@/lib/questionnaire/types";

export const QUESTIONNAIRE_CATEGORY_TERM_ID: Record<QuestionnaireCategory, string> = {
  CeFi: "cefi",
  DeFi: "defi",
  TradFi: "tradfi",
  Sports: "category-sports",
  Prediction: "category-prediction",
};

export const QUESTIONNAIRE_INSTRUMENT_TERM_ID: Record<QuestionnaireInstrumentType, string> = {
  spot: "q-instr-spot",
  perp: "q-instr-perp",
  dated_future: "q-instr-dated-future",
  option: "q-instr-option",
  lending: "q-instr-lending",
  staking: "q-instr-staking",
  lp: "q-instr-lp",
  event_settled: "q-instr-event-settled",
};

export const QUESTIONNAIRE_STRATEGY_TERM_ID: Record<QuestionnaireStrategyStyle, string> = {
  ml_directional: "q-strat-ml-directional",
  rules_directional: "q-strat-rules-directional",
  stat_arb: "q-strat-stat-arb",
  arbitrage: "q-strat-arbitrage",
  carry: "q-strat-carry",
  event_driven: "q-strat-event-driven",
  market_making: "q-strat-market-making",
  vol_trading: "q-strat-vol-trading",
};

export const QUESTIONNAIRE_SERVICE_FAMILY_TERM_ID: Record<QuestionnaireServiceFamily, string> = {
  IM: "im",
  DART: "dart",
  RegUmbrella: "regulatory-umbrella",
  combo: "service-combo",
};

export const QUESTIONNAIRE_FUND_STRUCTURE_TERM_ID: Record<QuestionnaireFundStructure, string> = {
  SMA: "sma",
  Pooled: "pooled",
  prop: "fund-structure-prop",
  NA: "fund-structure-na",
};

export const QUESTIONNAIRE_LICENCE_REGION_TERM_ID: Record<QuestionnaireLicenceRegion, string> = {
  EU_only: "q-licence-eu-only",
  UK_only: "q-licence-uk-only",
  EU_or_UK: "q-licence-eu-or-uk",
  EU_and_UK: "q-licence-eu-and-uk",
  other: "q-licence-other",
};

function humanizeStrategy(style: QuestionnaireStrategyStyle): string {
  return style.replace(/_/g, " ");
}

function humanizeInstrument(it: QuestionnaireInstrumentType): string {
  if (it === "dated_future") return "dated future";
  if (it === "event_settled") return "event-settled";
  return it.replace(/_/g, " ");
}

function humanizeLicenceRegion(lr: QuestionnaireLicenceRegion): string {
  return lr.replace(/_/g, " ");
}

/** Visible label for a strategy checkbox — glossary carries the commercial meaning. */
export function questionnaireStrategyLabel(style: QuestionnaireStrategyStyle): string {
  return humanizeStrategy(style);
}

/** Visible label for an instrument type checkbox. */
export function questionnaireInstrumentLabel(it: QuestionnaireInstrumentType): string {
  return humanizeInstrument(it);
}

export function questionnaireLicenceRegionLabel(lr: QuestionnaireLicenceRegion): string {
  return humanizeLicenceRegion(lr);
}

export function serviceFamilyDisplayName(sf: QuestionnaireServiceFamily): string {
  if (sf === "RegUmbrella") return "Regulatory Umbrella";
  return sf;
}
