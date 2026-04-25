/**
 * Pure required-field validator for the prospect questionnaire.
 *
 * Mirrors the form structure in app/(public)/questionnaire/page.tsx but
 * lives outside the React component so it's unit-testable in isolation.
 *
 * Rules:
 *   - Q1 (categories), Q2 (instrument types), Q4 (strategy style), Q6
 *     (fund structure) require at least one selection.
 *   - Q3 (venue scope) is required only when the user picked "explicit"
 *     and left the CSV blank.
 *   - Q7 / Q8 / Q9 of the Reg-Umbrella branch are required only when
 *     service_family ∈ {RegUmbrella, combo}.
 *   - Strategy preferences (Q7-Q11 of the main form, axes market_neutral
 *     / share_class / risk_profile / target_sharpe / leverage) are
 *     intentionally OPTIONAL and not validated here.
 *   - Envelope email + firm_name + firm_location are required for the
 *     access-code email pipeline.
 *
 * Returns null when the state is valid; otherwise returns the
 * `data-testid` of the first failing fieldset (so the caller can scroll
 * to it) and a human-readable message.
 */

import type {
  QuestionnaireCategory,
  QuestionnaireFundStructure,
  QuestionnaireInstrumentType,
  QuestionnaireLicenceRegion,
  QuestionnaireServiceFamily,
  QuestionnaireStrategyStyle,
} from "@/lib/questionnaire/types";

export interface ValidateRequiredInput {
  categories: ReadonlySet<QuestionnaireCategory> | readonly QuestionnaireCategory[];
  instrument_types: ReadonlySet<QuestionnaireInstrumentType> | readonly QuestionnaireInstrumentType[];
  venue_scope_mode: "all" | "explicit";
  venue_scope_csv: string;
  strategy_style: ReadonlySet<QuestionnaireStrategyStyle> | readonly QuestionnaireStrategyStyle[];
  service_family: QuestionnaireServiceFamily;
  fund_structure: ReadonlySet<QuestionnaireFundStructure> | readonly QuestionnaireFundStructure[];
  licence_region: QuestionnaireLicenceRegion | null;
  entity_jurisdiction: string;
  supported_currencies: ReadonlySet<string> | readonly string[];
  supported_currencies_other: string;
  email: string;
  firm_name: string;
  firm_location: string;
}

export interface ValidationFailure {
  readonly testId: string;
  readonly message: string;
}

export function isRegUmbrellaPath(service_family: QuestionnaireServiceFamily): boolean {
  return service_family === "RegUmbrella" || service_family === "combo";
}

/** Lightweight email shape check — RFC-strict validation is out of scope. */
export const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setOrArraySize<T>(value: ReadonlySet<T> | readonly T[]): number {
  if (value instanceof Set) return value.size;
  return (value as readonly T[]).length;
}

export function validateRequired(input: ValidateRequiredInput): ValidationFailure | null {
  if (setOrArraySize(input.categories) === 0) {
    return { testId: "axis-categories", message: "Pick at least one asset-class category (Q1)." };
  }
  if (setOrArraySize(input.instrument_types) === 0) {
    return { testId: "axis-instrument-types", message: "Pick at least one instrument type (Q2)." };
  }
  if (input.venue_scope_mode === "explicit" && input.venue_scope_csv.trim() === "") {
    return { testId: "axis-venue-scope", message: "List the venues you want, or switch to All venues (Q3)." };
  }
  if (setOrArraySize(input.strategy_style) === 0) {
    return { testId: "axis-strategy-style", message: "Pick at least one strategy style (Q4)." };
  }
  if (setOrArraySize(input.fund_structure) === 0) {
    return { testId: "axis-fund-structure", message: "Pick at least one fund structure (Q6)." };
  }
  if (isRegUmbrellaPath(input.service_family)) {
    if (input.licence_region === null) {
      return { testId: "axis-licence-region", message: "Pick a licence region (Reg Umbrella branch)." };
    }
    if (input.entity_jurisdiction.trim() === "") {
      return {
        testId: "axis-entity-jurisdiction",
        message: "Enter the entity jurisdiction (Reg Umbrella branch).",
      };
    }
    if (setOrArraySize(input.supported_currencies) === 0 && input.supported_currencies_other.trim() === "") {
      return {
        testId: "axis-supported-currencies",
        message: "Pick at least one supported currency (Reg Umbrella branch).",
      };
    }
  }
  if (input.email.trim() === "") {
    return {
      testId: "envelope-email",
      message: "Enter your work email — that's where the access code will be sent.",
    };
  }
  if (!EMAIL_SHAPE.test(input.email.trim())) {
    return { testId: "envelope-email", message: "That email doesn't look right — double-check it." };
  }
  if (input.firm_name.trim() === "") {
    return { testId: "envelope-firm-name", message: "Enter your firm name." };
  }
  if (input.firm_location.trim() === "") {
    return { testId: "envelope-location", message: "Pick where the firm is based (or planned to be)." };
  }
  return null;
}
