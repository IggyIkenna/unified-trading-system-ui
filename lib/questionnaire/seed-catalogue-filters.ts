/**
 * seedFiltersFromQuestionnaire — questionnaire/strategy-evaluation answers
 * → catalogue-filter shape.
 *
 * Funnel Coherence plan Workstream E4 (absorbed from
 * dart_ui_strategy_filtering_and_onboarding_2026_04_24.plan.md Phase 3).
 *
 * Maps the prospect's questionnaire / strategy-evaluation answers (asset
 * groups, instrument types, market_neutral preference, risk profile,
 * leverage preference) to a catalogue filter shape that the post-signin
 * strategy-catalogue surface can hydrate.
 *
 * IMPORTANT: this seed is computed at submit time but does NOT redirect
 * public users into /services/*. The seed is persisted to:
 *   - questionnaire envelope: Firestore /questionnaires/{id}.catalogue_seed
 *   - strategy-evaluation doc: /strategy_evaluations/{id}.catalogue_seed
 *   - localStorage: odum-catalogue-seed-v1 (continuity across pages)
 *
 * The signed-in catalogue (post-signup) reads the seed when opening
 * /services/reports/strategy-catalogue and hydrates the filter state.
 * Demo/UAT mode (post-Strategy-Review demo session) also hydrates the
 * Reality view from this seed.
 */

export interface CatalogueSeed {
  readonly assetGroups: readonly string[];
  readonly instrumentTypes: readonly string[];
  readonly marketNeutral?: boolean;
  readonly riskProfile?: string;
  readonly leveragePreference?: string;
}

const STORAGE_KEY = "odum-catalogue-seed-v1";

interface QuestionnaireLikeInput {
  // Questionnaire envelope axes.
  categories?: readonly string[];
  asset_groups?: readonly string[];
  instrument_types?: readonly string[];
  market_neutral?: boolean;
  risk_profile?: string;
  leverage_preference?: string;
  // Strategy-evaluation client-side state shape.
  assetGroups?: ReadonlySet<string> | readonly string[];
  instrumentTypes?: ReadonlySet<string> | readonly string[];
  // Allocator-path fields.
  allocatorAllowedVenues?: string;
  allocatorLeverageCap?: string;
}

function asArray(value: ReadonlySet<string> | readonly string[] | undefined): readonly string[] {
  if (!value) return [];
  if (value instanceof Set) return Array.from(value);
  return value;
}

/**
 * Build a catalogue-seed shape from any of the supported questionnaire-like
 * payloads. Empty axes are dropped so the consumer can detect "no preference"
 * and skip filter hydration.
 */
export function seedFiltersFromQuestionnaire(input: QuestionnaireLikeInput): CatalogueSeed {
  // Asset groups arrive under either name across submission shapes; fall
  // through and dedupe.
  const assetGroups = Array.from(
    new Set(
      [...asArray(input.asset_groups), ...asArray(input.categories), ...asArray(input.assetGroups)].filter(Boolean),
    ),
  );
  const instrumentTypes = Array.from(
    new Set([...asArray(input.instrument_types), ...asArray(input.instrumentTypes)].filter(Boolean)),
  );

  const seed: CatalogueSeed = {
    assetGroups,
    instrumentTypes,
    ...(typeof input.market_neutral === "boolean" ? { marketNeutral: input.market_neutral } : {}),
    ...(input.risk_profile ? { riskProfile: input.risk_profile } : {}),
    ...(input.leverage_preference ? { leveragePreference: input.leverage_preference } : {}),
  };
  return seed;
}

/**
 * Persist a seed to localStorage for continuity across pages (e.g. after a
 * questionnaire submit, the briefings landing reads the seed and may show
 * a "filtered to your preferences" banner where relevant).
 */
export function persistSeed(seed: CatalogueSeed): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  } catch {
    // ignore — localStorage may be disabled in private mode
  }
}

/**
 * Read a previously-persisted seed from localStorage. Returns null when no
 * seed exists or parsing fails.
 */
export function readPersistedSeed(): CatalogueSeed | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CatalogueSeed>;
    return {
      assetGroups: Array.isArray(parsed.assetGroups) ? parsed.assetGroups : [],
      instrumentTypes: Array.isArray(parsed.instrumentTypes) ? parsed.instrumentTypes : [],
      ...(typeof parsed.marketNeutral === "boolean" ? { marketNeutral: parsed.marketNeutral } : {}),
      ...(typeof parsed.riskProfile === "string" ? { riskProfile: parsed.riskProfile } : {}),
      ...(typeof parsed.leveragePreference === "string" ? { leveragePreference: parsed.leveragePreference } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Build URL query-string pairs for hydrating the signed-in catalogue from
 * a seed. Used post-signup to deep-link into the catalogue surface.
 */
export function seedToQueryParams(seed: CatalogueSeed): Record<string, string> {
  const params: Record<string, string> = {};
  if (seed.assetGroups.length > 0) params.asset_groups = seed.assetGroups.join(",");
  if (seed.instrumentTypes.length > 0) params.instrument_types = seed.instrumentTypes.join(",");
  if (typeof seed.marketNeutral === "boolean") params.market_neutral = seed.marketNeutral ? "1" : "0";
  if (seed.riskProfile) params.risk_profile = seed.riskProfile;
  if (seed.leveragePreference) params.leverage_preference = seed.leveragePreference;
  return params;
}
