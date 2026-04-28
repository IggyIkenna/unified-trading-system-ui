/**
 * Shared terminology SSOT.
 *
 * Every user-facing label that names a strategy-system concept MUST come from
 * here, not be inlined as a string literal. This prevents drift like the
 * "DeFi/DeFi" mis-label we hit on 2026-04-25 and the "asset class" / "asset
 * group" inconsistency.
 *
 * Renaming a term: update the value here, run the unit tests + visual diff;
 * every consumer picks it up automatically.
 */

export const TERMS = {
  // Hierarchy
  PRIMARY_CATEGORY: "primary execution category",
  ASSET_GROUP: "asset group",
  STRATEGY_FAMILY: "strategy family",
  STRATEGY_ARCHETYPE: "strategy archetype",
  STRATEGY_INSTANCE: "strategy instance",

  // Catalogue
  CATALOGUE: "strategy catalogue",
  ENVELOPE: "strategy envelope",
  BESPOKE: "bespoke",
  CUSTOM_BUILD: "custom build",

  // Filtering
  FILTER_CATEGORY: "Category",
  FILTER_FAMILY: "Family",
  FILTER_ARCHETYPE: "Archetype",
  FILTER_INSTANCE: "Strategy",
  FILTER_ALL: "All",

  // Access states
  ACCESS_TERMINAL_AND_REPORTS: "Available for terminal & reports",
  ACCESS_REPORTS_ONLY: "Reports only",
  ACCESS_LOCKED_VISIBLE: "Locked: upgrade to access",
  ACCESS_HIDDEN: "Not available",

  // Tenor buckets
  TENOR_0DTE: "0DTE",
  TENOR_WEEKLY: "Weekly",
  TENOR_MONTHLY: "Monthly",
  TENOR_QUARTERLY: "Quarterly",
  TENOR_LEAPS: "LEAPS",
  TENOR_MULTI: "Multi-tenor",

  // Common UI strings
  SEARCH_PLACEHOLDER: "Search the catalogue",
  EMPTY_RESULTS: "No strategies match the selected filters",
} as const;

export type TermKey = keyof typeof TERMS;

export const CATEGORY_LABELS: Record<string, string> = {
  CEFI: "CeFi",
  DEFI: "DeFi",
  TRADFI: "TradFi",
  SPORTS: "Sports",
  PREDICTION: "Prediction",
  CROSS_CATEGORY: "Cross-category",
};

/**
 * Pretty-print a category enum value.
 * Falls back to the raw string if no mapping exists (defensive — should never
 * happen for known categories).
 */
export function formatCategory(category: string): string {
  return CATEGORY_LABELS[category.toUpperCase()] ?? category;
}

export const TENOR_LABELS: Record<string, string> = {
  "0dte": TERMS.TENOR_0DTE,
  weekly: TERMS.TENOR_WEEKLY,
  monthly: TERMS.TENOR_MONTHLY,
  quarterly: TERMS.TENOR_QUARTERLY,
  leaps: TERMS.TENOR_LEAPS,
  "multi-tenor": TERMS.TENOR_MULTI,
};

export function formatTenor(tenor: string): string {
  return TENOR_LABELS[tenor.toLowerCase()] ?? tenor;
}
