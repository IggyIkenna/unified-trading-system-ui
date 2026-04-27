// Glossary-token rendering: body strings may contain `{{term:<id>}}` or
// `{{term:<id>|<label>}}` markers. They are substituted at render time by
// `components/marketing/render-with-terms.tsx` so we can wrap acronyms in
// <Term> tooltips without widening BriefingSection/BriefingPillar to ReactNode.
//
// Structure-options vocabulary: the IM and Regulatory pillars below source
// their structure descriptions from `lib/marketing/structure-options.ts`
// so the same labels and descriptions appear on the briefings, in the
// questionnaire, in /strategy-evaluation, and in the diagram on the
// regulatory page. Edit the SSOT, not the briefing copy.
import { STRUCTURE_OPTIONS, STRUCTURE_ROLE_CLARITY } from "@/lib/marketing/structure-options";

/**
 * Post-first-call briefing content — six commercial paths.
 *
 * Codex SSOT:
 * - unified-trading-pm/codex/14-playbooks/experience/im-decision-journey.md
 * - unified-trading-pm/codex/14-playbooks/experience/dart-briefing.md
 * - unified-trading-pm/codex/14-playbooks/experience/regulatory-umbrella-briefing.md
 * - unified-trading-pm/codex/14-playbooks/commercial-model/signal-leasing.md
 * - unified-trading-pm/codex/14-playbooks/_ssot-rules/10-strategy-instruction-schema-principles.md
 * - unified-trading-pm/codex/14-playbooks/shared-core/instruction-schema-fit-and-package-boundaries.md
 * - unified-trading-pm/codex/09-strategy/architecture-v2/category-instrument-coverage.md
 * - unified-trading-pm/plans/active/signal_leasing_broadcast_architecture_2026_04_20.plan.md (Phase 2 D1-D10)
 *
 * Voice: rule 02 (tone & posture) — present tense, specific, UK English.
 * Pricing numbers are codex-private per rule 08 — none appear here.
 * No raw-data resale claims per rule 07.
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

export interface BriefingPillar {
  slug: "investment-management" | "dart-trading-infrastructure" | "regulated-operating-models";
  title: string;
  tldr: string;
  frame: string;
  sections: readonly BriefingSection[];
  keyMessages: readonly string[];
  nextCall: string;
  cta: BriefingCta;
}

const BOOK_SECOND_CALL: BriefingCta = {
  label: "Book 45-minute call",
  href: "/contact",
};

export const BRIEFING_PILLARS: readonly BriefingPillar[] = [
  // ── Canonical post-2026-04-26 pillars (three-route marketing model) ──
  {
    slug: "dart-trading-infrastructure",
    title: "DART Trading Infrastructure",
    // Public lobby tone per user review 2026-04-26: let the diagram (where
    // you sit / where Odum sits / where we meet) carry the boundary, keep
    // prose short and selective. Eight-field schema detail, exclusivity
    // legal framing, dashboard taxonomy, and HMAC/credential mechanics
    // move to the second call.
    tldr: "{{term:dart|DART}} is the trading stack Odum uses to research, test, execute, monitor, and report systematic strategies.",
    frame:
      "Clients can use it in two main ways: send their own signals into Odum's execution and reporting layer, or build and run strategies through the full research-to-execution pipeline. In selected cases, Odum can also deliver its own signals to approved counterparties.",
    sections: [
      {
        title: "Signals-In — your strategy, our execution",
        body: "Your models and signal generation stay on your side. Odum receives structured instructions, then handles execution, reconciliation, position tracking, and reporting. This route fits teams that already have alpha or decision logic, but want a controlled execution and post-trade layer rather than rebuilding the whole operating stack.",
        bodyAfter:
          "The fit call confirms schema compatibility, venues, instruments, and the level of execution control required.",
      },
      {
        title: "Full pipeline — research to execution on one stack",
        body: "Build, test, promote, and run strategies on the same components Odum uses internally. This route fits teams that want access to the full DART environment: data, research, backtesting, paper trading, live promotion, execution, monitoring, and reporting.",
        bodyAfter:
          "Where appropriate, client strategy IP is scoped under the agreed commercial relationship and not shared across other client engagements.",
      },
      {
        title: "Odum-provided signals — selected counterparty arrangements",
        // Held back deliberately — Signals-Out is not the central DART
        // commercial path, so this section is short, lower-weight, and
        // placed last among the three shapes.
        body: "In selected cases, Odum may provide signals to counterparties who execute on their own infrastructure. These engagements are assessed case by case and include delivery health, acknowledgement reporting, and reconciliation where applicable.",
      },
      {
        title: "Risk, governance, and reporting",
        body: "Risk controls operate at the execution layer across the three shapes: position monitoring, instrument and venue eligibility, leverage and concentration limits, and kill-switches. Day-to-day work runs in the authenticated platform; equivalent operations are exposed programmatically via the Unified Trading API and service REST endpoints. Reporting carries the same shape across the three workflows — positions, P&L attribution, reconciliation, delivery health, audit trail, and compliance artefacts.",
      },
      {
        title: "Commitment floor",
        body: "Twelve-month minimum engagement across the three DART shapes — onboarding, venue provisioning, and per-client setup are real costs the floor recovers. Pricing is per block (venue packs, chain packs, instrument-type packs), mixable across shapes; specific numbers are walked through at the second call.",
      },
    ],
    keyMessages: [
      "DART is one operating stack with three engagement shapes.",
      "Signals-In: your models, Odum's execution, reconciliation, and reporting.",
      "Full pipeline: research-to-execution on the components Odum uses internally; client strategy IP scoped to the engagement where appropriate.",
      "Odum-provided signals: selected counterparty arrangements, assessed case by case.",
      "Risk, governance, and reporting are applied consistently across the three shapes.",
      "Twelve-month minimum engagement; per-block pricing — specifics at the second call.",
    ],
    nextCall:
      "The 45-minute second call confirms which DART shape fits, walks venue and instrument-type compatibility, and scopes the packs your engagement requires. Specific pricing and operational detail are walked through during the call.",
    cta: BOOK_SECOND_CALL,
  },
  {
    slug: "regulated-operating-models",
    title: "Regulated Operating Models",
    // Public lobby tone per user review 2026-04-26: lighter, less "internal
    // memo". The detailed hierarchy lives in the diagram below the frame
    // (RegUmbrellaHierarchyDiagram); we don't repeat it as prose. Per-block
    // pricing, MLRO/AIFM detail, and AR registration timelines move to the
    // second call.
    tldr: "Some trading engagements need more than technology. Where appropriate, Odum can help structure selected engagements around governance, supervisory reporting, FCA coverage, SMA routes, affiliate fund pathways, or AR-style arrangements.",
    frame:
      "The right structure depends on who is appointed to manage the mandate, where the capital sits, who faces the end client, what permissions are required, and whether the engagement is best handled directly by Odum, by the client, or through an approved affiliate route. Odum can act as investment manager where appointed, or as delegated trading manager / sub-adviser where another regulated manager or affiliate carries the formal fund role. Odum does not custody client capital. Venue, broker, or wallet permissions are scoped to the mandate, and withdrawal authority is never requested.",
    sections: [
      {
        title: "Two main client-facing operating routes",
        body: "Most engagements run through one of two routes — the Pooled Fund route on the EU / affiliate-supported side, or the SMA route on the UK / direct side. A single engagement can also combine both where the mandate spans UK and EU coverage.",
        bullets: [
          `{{strong:${STRUCTURE_OPTIONS["pooled-fund-affiliate"].label} (${STRUCTURE_OPTIONS["pooled-fund-affiliate"].tag})}} — ${STRUCTURE_OPTIONS["pooled-fund-affiliate"].description}`,
          `{{strong:${STRUCTURE_OPTIONS["sma-direct"].label} (${STRUCTURE_OPTIONS["sma-direct"].tag})}} — ${STRUCTURE_OPTIONS["sma-direct"].description}`,
          `{{strong:${STRUCTURE_OPTIONS.combined.label}}} — ${STRUCTURE_OPTIONS.combined.description}`,
          "{{strong:AR-style arrangement}} — Where a client wants to be customer-facing under its own brand, an AR-style structure may be considered case by case. This normally requires additional onboarding, compliance review, and role clarity.",
        ],
        bodyAfter: STRUCTURE_ROLE_CLARITY,
      },
      {
        title: "Custody and control",
        body: "The regulated operating model is a governance, permission, and reporting layer. It is not a custody product. For {{term:sma}} arrangements, the client or relevant entity holds the accounts. For pooled or affiliate fund structures, assets sit with the relevant fund, custodian, administrator, or affiliate platform route. Odum may operate the strategy or trading layer, but custody and fund administration sit with the appointed fund-side parties. Odum's access, where granted, is scoped to the mandate and does not include withdrawal permissions.",
      },
      {
        title: "Multi-vehicle reporting",
        body: "Where an engagement includes multiple funds, share classes, SMA books, or sub-entities, each book is reported separately and then rolled up into a supervisory view for the relevant client umbrella. The reporting surface can show {{term:nav|NAV}}, attribution, compliance artefacts, audit trail, positions, orders, fills, and reconciliation events at the correct level of the hierarchy.",
      },
      {
        title: "Risk and supervision",
        body: "Risk controls operate at the execution and reporting layers, regardless of the selected structure. These may include venue eligibility, instrument restrictions, leverage limits, concentration checks, position monitoring, kill-switches, and reconciliation controls. Where Odum is appointed investment manager, Odum carries the relevant supervisory responsibility for that mandate. Where a client, affiliate manager, AIFM, or fund platform carries the formal role, Odum's responsibility is scoped to the delegated trading, advisory, reporting, or infrastructure function agreed in the documents.",
      },
      {
        title: "Distribution",
        body: "Distribution support is not included by default. Where requested, it is discussed separately and contracted separately.",
      },
      {
        title: "Commercial floor",
        body: "Regulated operating models require real setup work: legal review, compliance scoping, onboarding, reporting configuration, venue or custodian coordination, and supervisory workflow design. For that reason, engagements are normally scoped around a minimum term and priced by blocks: regulatory model, reporting core, execution layer, venue packs, instrument packs, and additional vehicles where relevant. Specific pricing is discussed after fit is confirmed.",
      },
    ],
    keyMessages: [
      "Fit-driven structure: Odum-as-IM, SMA, affiliate fund / AIFM pathway, sub-adviser, or AR-style.",
      "Odum manages the strategy and operating layer; the legal appointment, custody route, and regulatory role depend on the agreed structure.",
      "No custody by Odum.",
      "No withdrawal authority requested.",
      "Multi-vehicle structures can roll into one supervisory view.",
      "Reporting uses the same operating surface Odum uses internally.",
      "Distribution is separate.",
      "Pricing depends on structure, scope, and onboarding complexity.",
    ],
    nextCall:
      "Use the second call to resolve the structure against your facts: UK or EU path, SMA or fund, single or multi-vehicle, Odum-as-IM or affiliate-led with Odum as delegated trading manager / sub-adviser, custody route, reporting requirements, and regulatory scope.",
    cta: BOOK_SECOND_CALL,
  },
  // ── Legacy pillars below — slugs intercepted by next.config.mjs redirects;
  //    kept as type-safe legacy content until a follow-up cleanup pass.
  {
    slug: "investment-management",
    title: "Odum-Managed Strategies",
    tldr: "Odum manages selected systematic strategies for allocators through agreed fund or {{term:sma}} structures. Reporting runs on the same operating surface Odum uses internally, filtered by entitlement.",
    frame:
      "Odum manages selected systematic strategies for allocators through agreed fund or {{term:sma}} structures. Allocators access the same operating surface Odum uses internally, filtered by mandate, share class, or SMA partition. In a direct Odum mandate, Odum acts as investment manager and operates the strategy; custody remains with the agreed {{term:venue}}, broker, custodian, or client-controlled account structure. Odum does not request withdrawal authority and does not hold client assets as principal.",
    sections: [
      {
        title: "Structure: direct Odum-managed mandates",
        body: `**${STRUCTURE_OPTIONS["sma-direct"].label} (${STRUCTURE_OPTIONS["sma-direct"].tag}):** ${STRUCTURE_OPTIONS["sma-direct"].description}`,
        bodyAfter:
          "**Direct pooled fund:** investors hold share-class exposure in an Odum-managed fund where Odum is appointed investment manager. Fund assets sit with a qualified third-party custodian; each allocator sees only its own share-class NAV, exposure, and P&L. Both paths use the same operating and reporting surface, and Odum manages the strategy layer without holding client assets as principal. Where an engagement instead needs an affiliate-led pooled fund, AIFM pathway, or combined UK + EU coverage, see /briefings/regulated-operating-models for the full structural picture.",
      },
      {
        title: "The strategy surface",
        body: "The strategy surface shows the strategies available for your mandate, with maturity, capacity, reporting scope, and allocation status. Allocators do not see research workspaces or authoring tools; they see the investable surface relevant to their structure and eligibility.",
      },
      {
        title: "Reporting surface",
        body: "Positions, exposures, {{term:pnl|P&L}} attribution by factor, reconciliation breaks, and audit trail. Allocator reporting is a partition of the same operating system Odum's own traders and risk desk use — entitlement-filtered to your share class (Pooled) or SMA partition. Same components, same data, different views.",
      },
      {
        title: "Regulatory posture and commitment floor",
        body: "Odum operates under FCA permissions. {{term:mlro}}, compliance monitoring, and supervisory reporting run internally — not outsourced. Twelve-month minimum engagement; the floor reflects real provisioning costs (legal review, venue onboarding, per-client setup, reconciliation, share-class or SMA mechanics).",
      },
      {
        title: "Fees",
        body: "Fees are agreed by mandate. The standard posture is performance-linked, with the final structure depending on strategy capacity, liquidity, operational complexity, and whether the client chooses a pure performance-share model or a lower performance-share model with a modest platform-access component. Specific ranges are walked at the second call and confirmed at Commercial Tailoring.",
      },
    ],
    keyMessages: [
      "Odum manages selected systematic strategies for allocator mandates.",
      "Allocators can access strategies through direct SMA, pooled-fund, or approved affiliate structures where applicable.",
      "Odum does not custody client assets; custody follows the agreed structure.",
      "Odum manages the strategy and operating layer; the legal appointment, custody route, and regulatory role depend on the agreed structure.",
      "Reporting uses the same operating surface Odum uses internally, filtered by entitlement.",
      "Fees, capacity, liquidity, and onboarding are agreed mandate by mandate.",
    ],
    nextCall:
      "The 45-minute second call walks the strategies your mandate shape fits, the SMA-versus-pooled choice against your isolation preference, the venue setup against your existing relationships, and fee structure against the strategies in scope.",
    cta: BOOK_SECOND_CALL,
  },
] as const;
