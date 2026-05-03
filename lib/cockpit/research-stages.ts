/**
 * ResearchStage ↔ route mapping.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §5.3 + Phase 4 of §17.
 *
 * The Research surface collapses behind a 6-stage journey rail:
 *
 *   Discover  — Strategy universe (catalogue · families · archetypes · examples)
 *   Build     — Build data and features (features · pipelines · datasets)
 *   Train     — Model experiments (ML · training · registry · model lineage)
 *   Validate  — Test before deployment (backtests · paper · stress · drift)
 *   Allocate  — Capital and mandate fit (allocation · risk · correlation · mandate)
 *   Promote   — Move to paper / live (release bundle · approval · handoff)
 *
 * The legacy BUILD_TABS / STRATEGY_SUB_TABS / ML_SUB_TABS arrays in
 * `components/shell/service-tabs.tsx` continue to render every per-route
 * page as a deep link — the journey rail is the new "category" layer
 * above them, mirroring how Phase 3's TerminalModeTabs sits above
 * TradingVerticalNav.
 */

import type { ResearchStage } from "@/lib/architecture-v2/workspace-scope";

export const RESEARCH_STAGES: readonly ResearchStage[] = [
  "discover",
  "build",
  "train",
  "validate",
  "allocate",
  "promote",
] as const;

export interface ResearchStageMeta {
  readonly stage: ResearchStage;
  readonly label: string;
  readonly tagline: string;
  /** Where clicking the stage tab routes the user. */
  readonly defaultHref: string;
  /**
   * Path prefixes that belong to this stage. Order doesn't matter — the
   * `researchStageForPath` resolver picks the longest match.
   */
  readonly routePrefixes: readonly string[];
}

export const RESEARCH_STAGE_META: Readonly<Record<ResearchStage, ResearchStageMeta>> = {
  discover: {
    stage: "discover",
    label: "Discover",
    tagline: "Strategy universe — catalogue, families, archetypes",
    defaultHref: "/services/research/strategies",
    routePrefixes: [
      "/services/research/strategies",
      "/services/research/strategy/catalog",
      "/services/research/strategy/families",
      "/services/research/strategy/heatmap",
      "/services/research/strategy/overview",
      "/services/research/strategy/sports",
      "/services/research/strategy/unity",
      "/services/research/strategy/venues",
      "/services/research/overview",
    ],
  },

  build: {
    stage: "build",
    label: "Build",
    tagline: "Data, features, datasets, pipelines",
    defaultHref: "/services/research/features",
    routePrefixes: [
      "/services/research/features",
      "/services/research/feature-etl",
      "/services/research/quant",
    ],
  },

  train: {
    stage: "train",
    label: "Train",
    tagline: "ML experiments, training runs, model registry",
    defaultHref: "/services/research/ml",
    routePrefixes: [
      "/services/research/ml",
    ],
  },

  validate: {
    stage: "validate",
    label: "Validate",
    tagline: "Backtests, paper, drift, execution simulation",
    defaultHref: "/services/research/strategy/backtests",
    routePrefixes: [
      "/services/research/strategy/backtests",
      "/services/research/strategy/results",
      "/services/research/strategy/compare",
      "/services/research/strategy/execution-policies",
      "/services/research/execution",
      "/services/research/signals",
    ],
  },

  allocate: {
    stage: "allocate",
    label: "Allocate",
    tagline: "Capital, risk, correlation, mandate fit",
    defaultHref: "/services/research/allocate",
    routePrefixes: [
      "/services/research/allocate",
      "/services/research/strategy/candidates",
    ],
  },

  promote: {
    stage: "promote",
    label: "Promote",
    tagline: "Release bundle, approval, paper/live handoff",
    defaultHref: "/services/research/strategy/handoff",
    routePrefixes: [
      "/services/research/strategy/handoff",
      "/services/promote",
    ],
  },
};

/**
 * Derive the active ResearchStage from a pathname. Longest-prefix-wins so
 * deep routes like `/services/research/ml/training` resolve to the most
 * specific stage (Train) rather than a parent (Build).
 *
 * Returns `null` when the path doesn't match any Research route — caller
 * falls back to scope.researchStage or the persona-default.
 */
export function researchStageForPath(pathname: string): ResearchStage | null {
  let bestStage: ResearchStage | null = null;
  let bestLen = 0;
  for (const stage of RESEARCH_STAGES) {
    for (const prefix of RESEARCH_STAGE_META[stage].routePrefixes) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        if (prefix.length > bestLen) {
          bestLen = prefix.length;
          bestStage = stage;
        }
      }
    }
  }
  return bestStage;
}

/**
 * Default stage when the user lands on the Research surface without an
 * explicit route or scope-anchored stage. Phase 6 will widen this to be
 * scope-aware (e.g. Research-to-Live preset → "discover"; ML preset →
 * "train"). For Phase 4 we ship the static default.
 */
export function defaultResearchStage(): ResearchStage {
  return "discover";
}
