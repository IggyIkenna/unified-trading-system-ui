/**
 * SERVICE_LABELS — single source of truth for service display labels.
 *
 * Per `marketing_site_three_route_consolidation_2026_04_26.plan` and codex SSOT
 * `unified-trading-pm/codex/08-workflows/signup-signin-workflow.md` §2.7.2:
 *
 * - `marketing` — public-facing display label. Used on homepage cards, engagement-route
 *   page titles, briefings, nav labels, public meta tags, IR-facing materials.
 * - `legal` — legal / contract / signup / admin label. Used in signup forms, admin
 *   tooling, contract templates, FCA-permission references, email templates,
 *   service-category metadata fields.
 * - `slug` — URL slug for `?service=` query param and route segments. UNCHANGED across
 *   marketing and legal contexts.
 *
 * Public marketing collapses Odum Signals into DART Trading Infrastructure as a
 * capability; the `signals` service path remains distinct in signup/contract surfaces.
 *
 * For "Regulatory Umbrella": existing legal/admin contracts may retain that phrase
 * for backwards compat, but new legal drafting should prefer the specific structure
 * name (Advisory / AR / SMA / affiliate fund) or "Regulated Operating Models" pending
 * compliance review.
 */
export interface ServiceLabel {
  readonly marketing: string;
  readonly legal: string;
  readonly slug: string;
}

export type ServiceKey = "investment" | "dart" | "signals" | "regulatory";

export const SERVICE_LABELS: Record<ServiceKey, ServiceLabel> = {
  investment: {
    marketing: "Odum-Managed Strategies",
    legal: "Investment Management",
    slug: "investment",
  },
  dart: {
    marketing: "DART Trading Infrastructure",
    legal: "DART",
    slug: "platform",
  },
  signals: {
    // Signals is no longer a top-level public service — it surfaces inside
    // DART Trading Infrastructure as the signals capability. Kept here for
    // legal/admin contexts that still reference the line item directly.
    marketing: "DART signals capability",
    legal: "Odum Signals",
    slug: "signals",
  },
  regulatory: {
    marketing: "Regulated Operating Models",
    legal: "Regulatory Umbrella",
    slug: "regulatory",
  },
} as const;

/**
 * Public-marketing route paths. URL slugs unchanged; display labels via SERVICE_LABELS.
 */
export const PUBLIC_ROUTE_PATHS = {
  investment: "/investment-management",
  dart: "/platform",
  regulatory: "/regulatory",
  whoWeAre: "/who-we-are",
  contact: "/contact",
  startYourReview: "/start-your-review",
  questionnaire: "/questionnaire",
  briefings: "/briefings",
} as const;

/**
 * Briefing canonical slugs (consolidated 2026-04-26).
 *
 * Old slugs (`platform`, `dart-full`, `dart-signals-in`, `signals-out`) redirect to
 * `dart-trading-infrastructure`. Old `regulatory` redirects to `regulated-operating-models`.
 */
export const BRIEFING_SLUGS = {
  investment: "investment-management",
  dart: "dart-trading-infrastructure",
  regulatory: "regulated-operating-models",
} as const;
