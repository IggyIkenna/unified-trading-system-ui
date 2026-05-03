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
  /** Market exposure preference — "neutral" / "directional" / "both". */
  readonly marketNeutral?: string;
  /** Risk appetite — "low" / "medium" / "high". */
  readonly riskProfile?: string;
  /** Leverage tolerance — "none" / "low" / "medium" / "any". */
  readonly leveragePreference?: string;
  /** Optional minimum Sharpe ratio for FOMO-tab ranking. */
  readonly targetSharpeMin?: number;
  /** Base-currency / hedging preferences. */
  readonly shareClassPreferences?: readonly string[];
}

const STORAGE_KEY = "odum-catalogue-seed-v1";

interface QuestionnaireLikeInput {
  // Questionnaire envelope axes (snake_case).
  categories?: readonly string[];
  asset_groups?: readonly string[];
  instrument_types?: readonly string[];
  market_neutral?: string | boolean | null;
  risk_profile?: string | null;
  leverage_preference?: string | null;
  target_sharpe_min?: number | null;
  share_class_preferences?: readonly string[];
  // Strategy-evaluation client-side state shape (camelCase / Set).
  assetGroups?: ReadonlySet<string> | readonly string[];
  instrumentTypes?: ReadonlySet<string> | readonly string[];
  marketNeutral?: string | null;
  riskProfile?: string | null;
  leveragePreference?: string | null;
  targetSharpeMin?: number | null;
  shareClassPreferences?: readonly string[] | ReadonlySet<string>;
  // Allocator-path fields (informational, not yet mapped to filter axes).
  allocatorAllowedVenues?: string;
  allocatorLeverageCap?: string;
}

function asArray(value: ReadonlySet<string> | readonly string[] | undefined): readonly string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  // ReadonlySet<string> at this point — TS doesn't narrow `instanceof Set`
  // against the readonly variant, so we narrow via the array check above
  // and treat the remaining branch as the Set form.
  return Array.from(value as ReadonlySet<string>);
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

  // Normalise market_neutral. UAC uses literal strings ("neutral" |
  // "directional" | "both"); the older JSON shape used a boolean. Coerce
  // legacy boolean to the literal token so consumers can rely on a single
  // representation.
  const marketNeutral =
    typeof input.marketNeutral === "string"
      ? input.marketNeutral
      : typeof input.market_neutral === "string"
        ? input.market_neutral
        : typeof input.market_neutral === "boolean"
          ? input.market_neutral
            ? "neutral"
            : "directional"
          : undefined;
  const riskProfile = input.riskProfile ?? input.risk_profile ?? undefined;
  const leveragePreference = input.leveragePreference ?? input.leverage_preference ?? undefined;
  const targetSharpeMin = input.targetSharpeMin ?? input.target_sharpe_min ?? undefined;
  const shareClassPreferences = (() => {
    const v = input.shareClassPreferences ?? input.share_class_preferences;
    if (!v) return undefined;
    return Array.from(asArray(v)).filter(Boolean);
  })();

  const seed: CatalogueSeed = {
    assetGroups,
    instrumentTypes,
    ...(marketNeutral ? { marketNeutral } : {}),
    ...(riskProfile ? { riskProfile } : {}),
    ...(leveragePreference ? { leveragePreference } : {}),
    ...(typeof targetSharpeMin === "number" && Number.isFinite(targetSharpeMin) ? { targetSharpeMin } : {}),
    ...(shareClassPreferences && shareClassPreferences.length > 0 ? { shareClassPreferences } : {}),
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
      ...(typeof parsed.marketNeutral === "string" ? { marketNeutral: parsed.marketNeutral } : {}),
      ...(typeof parsed.riskProfile === "string" ? { riskProfile: parsed.riskProfile } : {}),
      ...(typeof parsed.leveragePreference === "string" ? { leveragePreference: parsed.leveragePreference } : {}),
      ...(typeof parsed.targetSharpeMin === "number" && Number.isFinite(parsed.targetSharpeMin)
        ? { targetSharpeMin: parsed.targetSharpeMin }
        : {}),
      ...(Array.isArray(parsed.shareClassPreferences) && parsed.shareClassPreferences.length > 0
        ? { shareClassPreferences: parsed.shareClassPreferences }
        : {}),
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
  if (seed.marketNeutral) params.market_neutral = seed.marketNeutral;
  if (seed.riskProfile) params.risk_profile = seed.riskProfile;
  if (seed.leveragePreference) params.leverage_preference = seed.leveragePreference;
  if (typeof seed.targetSharpeMin === "number" && Number.isFinite(seed.targetSharpeMin)) {
    params.target_sharpe_min = seed.targetSharpeMin.toString();
  }
  if (seed.shareClassPreferences && seed.shareClassPreferences.length > 0) {
    params.share_class_preferences = seed.shareClassPreferences.join(",");
  }
  return params;
}
