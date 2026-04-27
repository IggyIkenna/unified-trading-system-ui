/**
 * Structure-options SSOT — canonical vocabulary for the two
 * client-facing operating routes Odum supports across mandates.
 *
 * Used across:
 * - /briefings/investment-management (Odum-Managed Strategies)
 * - /briefings/regulated-operating-models
 * - /questionnaire (structure-preference question)
 * - /strategy-evaluation (Path A allocator structure question;
 *   Path B regulatory overlay)
 * - components/marketing/reg-umbrella-hierarchy-diagram (Client-facing
 *   operating routes diagram labels)
 *
 * Rule: this file is the only place these labels and one-line descriptions
 * live. Surfaces import + render — they do not paraphrase. Keeps the
 * language identical from the first questionnaire question through to
 * the final briefing.
 *
 * The two routes are not mutually exclusive — a single client engagement
 * can combine UK + EU coverage (one of the legend items in the diagram).
 * The questionnaire / evaluation collect a *preference* signal; the final
 * structure is agreed at mandate documentation time.
 */

export type StructureOptionId = "pooled-fund-affiliate" | "sma-direct" | "combined" | "unsure";

export interface StructureOption {
  readonly id: StructureOptionId;
  /** Short label for cards / select options. */
  readonly label: string;
  /** One-line jurisdiction-and-posture tag (used as a sub-label). */
  readonly tag: string;
  /** Two-sentence description for briefings + evaluation cards. */
  readonly description: string;
  /** Single-sentence questionnaire blurb — even shorter than `description`. */
  readonly blurb: string;
  /** Odum's role under this structure. */
  readonly odumRole: string;
  /** Where investor capital sits. */
  readonly custody: string;
}

export const STRUCTURE_OPTIONS: Readonly<Record<StructureOptionId, StructureOption>> = {
  "pooled-fund-affiliate": {
    id: "pooled-fund-affiliate",
    label: "Pooled Fund route",
    tag: "EU / affiliate-supported",
    description:
      "Investors subscribe into a fund, share class, or pod operated by an approved affiliate manager, AIFM, administrator, or fund platform. The affiliate carries the formal fund role (manager of record, fund admin, KYC, NAV, custody coordination); Odum is appointed or delegated as trading manager / sub-adviser to operate the strategy and reporting layer.",
    blurb:
      "Pooled fund or share-class structure operated by an approved affiliate; Odum acts as delegated trading manager or sub-adviser.",
    odumRole: "Sub-adviser or delegated trading manager (operates the strategy and reporting layer)",
    custody: "Fund assets held by a qualified custodian under the affiliate fund route",
  },
  "sma-direct": {
    id: "sma-direct",
    label: "SMA route",
    tag: "UK / direct",
    description:
      "The client holds venue, broker, or custodian accounts in its own entity name and appoints Odum to manage the strategy under an investment-management agreement, advisory mandate, or scoped execution mandate. Odum receives scoped read-and-execute access to the client's accounts; withdrawal authority is never requested.",
    blurb:
      "Client-owned venue / broker / custodian accounts; Odum acts as investment manager where appointed under a direct mandate.",
    odumRole: "Investment manager where appointed (direct IMA, advisory, or execution mandate)",
    custody: "Client-owned venue, broker, or custodian accounts (scoped read + execute, no withdrawals)",
  },
  combined: {
    id: "combined",
    label: "Combined UK + EU coverage",
    tag: "both routes",
    description:
      "A single engagement can combine the SMA and Pooled Fund routes when the mandate spans UK and EU coverage, multiple investor types, or distinct operating postures across investor segments. The agreed operating model is set out in the documentation.",
    blurb: "A combined structure that spans both routes (UK + EU) under one engagement.",
    odumRole: "Role split across both routes per mandate documentation",
    custody: "Mixed — fund assets via affiliate route; client-owned accounts via SMA route",
  },
  unsure: {
    id: "unsure",
    label: "Not sure yet",
    tag: "to be agreed",
    description:
      "The right structure is agreed once mandate scope, investor jurisdiction, distribution posture, and regulatory permissions are clear. The fit call walks through the options against the specifics.",
    blurb: "Decide at the fit call once scope, jurisdiction, and permissions are clear.",
    odumRole: "Determined by the agreed structure",
    custody: "Determined by the agreed structure",
  },
};

/**
 * Display order for surfaces that render the options as a list / card grid.
 * Pooled-fund first (the EU / affiliate path is the broader, more flexible
 * one); SMA second (the UK / direct path); combined + unsure last.
 */
export const STRUCTURE_OPTION_ORDER: readonly StructureOptionId[] = [
  "pooled-fund-affiliate",
  "sma-direct",
  "combined",
  "unsure",
];

/**
 * Shared single-sentence framing used at the top of any structure-question
 * surface. Keeps the prompt identical across questionnaire + evaluation.
 */
export const STRUCTURE_PROMPT =
  "Two main client-facing operating routes are available; many engagements combine both. Which best describes the structure you'd like the engagement to use?";

/**
 * Cross-page note that prevents readers conflating the two layers.
 * Reused in briefings + diagram caption.
 */
export const STRUCTURE_ROLE_CLARITY =
  "The reporting hierarchy is separate from the legal appointment chain. Depending on the mandate, Odum may be the appointed investment manager, a delegated trading manager, a sub-adviser, or the infrastructure and reporting provider behind the regulated manager.";
