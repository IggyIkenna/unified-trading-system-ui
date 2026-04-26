/**
 * Briefing content TypeScript types.
 *
 * SSOT for the structured shape of briefing content served at
 * `/briefings/*` routes. The YAML store under `content/briefings/*.yaml`
 * conforms to these types; the loader (`lib/briefings/loader.ts`) parses
 * YAML at build time and returns typed `BriefingPillar` records.
 *
 * Glossary-token rendering: body strings may contain `{{term:<id>}}` or
 * `{{term:<id>|<label>}}` markers. They are substituted at render time by
 * `components/marketing/render-with-terms.tsx` so we can wrap acronyms in
 * <Term> tooltips without widening BriefingSection/BriefingPillar to
 * ReactNode.
 *
 * Plan: unified-trading-pm/plans/active/refactor_g3_3_briefings_cms_migration_2026_04_20.plan.md
 */

export interface BriefingCta {
  readonly label: string;
  readonly href: string;
}

export type BriefingAppliesTo = "signals-in" | "full-pipeline" | "both";

export interface BriefingSection {
  readonly title: string;
  readonly body: string;
  readonly bullets?: readonly string[];
  readonly bodyAfter?: string;
  /**
   * Optional path-applicability tag. Only meaningful on the `platform`
   * briefing where sections describe one or both of the two DART paths.
   * Rendered as a small badge next to the section title.
   */
  readonly appliesTo?: BriefingAppliesTo;
}

/**
 * Canonical slug vocabulary for briefing pillars. The union is closed:
 * YAML content under `content/briefings/<slug>.yaml` must carry one of
 * these values. `_hub.yaml` is a separate file describing the hub index
 * and does NOT use `BriefingPillarSlug`.
 */
export type BriefingPillarSlug = "investment-management" | "dart-trading-infrastructure" | "regulated-operating-models";

export interface BriefingPillar {
  slug: BriefingPillarSlug;
  title: string;
  tldr: string;
  frame: string;
  sections: readonly BriefingSection[];
  keyMessages: readonly string[];
  nextCall: string;
  cta: BriefingCta;
}

/**
 * Shape of `content/briefings/_hub.yaml` — hub-level copy. The sub-pillar
 * cards themselves come from the individual pillar YAML files; this file
 * covers only the hub framing strings and ordering.
 */
export interface BriefingHub {
  readonly title: string;
  readonly tldr: string;
  /**
   * Optional lead copy between the hub hero and the card grid — e.g. “start here”
   * framing for all four commercial paths. Parsed from `content/briefings/_hub.yaml`
   * when the `intro` key is present.
   */
  readonly intro?: string;
  readonly cta: BriefingCta;
  /**
   * Pillar slug ordering for the hub card grid. The loader asserts every
   * referenced slug resolves to a pillar YAML file.
   */
  readonly displayOrder: readonly BriefingPillarSlug[];
}
