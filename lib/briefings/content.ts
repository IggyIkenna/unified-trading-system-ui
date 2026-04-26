// Glossary-token rendering: body strings may contain `{{term:<id>}}` or
// `{{term:<id>|<label>}}` markers. They are substituted at render time by
// `components/marketing/render-with-terms.tsx` so we can wrap acronyms in
// <Term> tooltips without widening BriefingSection/BriefingPillar to ReactNode.
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
    tldr: "DART is the trading infrastructure Odum uses to build, research, execute, and monitor its own systematic strategies. Available to clients across three workflows: client-provided signals (Signals-In), the full research-to-execution pipeline, and Odum-provided signals leased to counterparties.",
    frame:
      "DART (Data Analytics, Research & Trading) is one operating stack with three engagement shapes. Clients with their own strategy generators send structured instructions in via the eight-field signal schema and Odum runs execution, reconciliation, position tracking, and reporting. Clients building strategies use the full research surface — enriched data, backtest, paper, live-tiny promotion ladder — on the same components Odum's own traders use. Counterparties licensing Odum's strategies receive signals out and execute on their own infrastructure, with delivery health and acknowledgement reporting included. The same component tree powers all three; what differs is the seam between client and Odum.",
    sections: [
      {
        title: "Signals-In — your strategy, our execution",
        body: "Your strategy runs on your infrastructure; structured instructions flow into Odum's execution, reconciliation, and reporting stack. Your code never crosses the wire. Instructions land against the eight-field signal schema (instrument and venue context, side, size, price terms, lifecycle, attribution, identifier, timestamps). Odum runs venue routing, execution, reconciliation, position tracking, and reporting on the receipts. The research and backtest layers stay with your team — DART Signals-In is the execution-and-reporting half only. The 45-minute fit-call walks the schema field-by-field against your upstream and confirms venue / instrument-type compatibility before anything goes live.",
      },
      {
        title: "Full pipeline — research-to-execution on the same stack",
        body: "Research, promote through paper, and run live on the same components Odum uses for its own capital. Enriched data services, backtesting, the strategy catalogue, the maturity ladder (code-audited → backtested → paper → live-tiny → live-allocated), and the promotion ledger are visible end-to-end. Your IP stays yours: the engagement runs under client-exclusivity where appropriate — Odum does not run your strategy on its own book, and other clients do not run it either. Twelve-month minimum engagement; venue / chain / instrument-type packs scope per client.",
      },
      {
        title: "Odum-provided signals — counterparty leasing",
        body: "Where appropriate, DART can supply Odum-generated signals to counterparties who execute on their own infrastructure. The counterparty receives signals; execution stays with the counterparty. Delivery health (HMAC-signed webhooks, retry, observability), acknowledgement reporting, and delivery-vs-intent reconciliation are included. Engagement scope, counterparty fit, and exclusivity / non-exclusivity terms are assessed case by case. Available by separate agreement.",
      },
      {
        title: "Risk and governance",
        body: "DART carries risk and governance overlays appropriate to the engagement: position-balance monitoring, risk-and-exposure checks, instrument and venue eligibility, leverage and concentration ceilings, kill-switches at the execution-service layer. For Signals-In, governance is shape-aware — your strategy controls intent, Odum controls fills. For Full pipeline engagements, the maturity ladder enforces evidence-led promotion (no live capital allocated to a strategy that has not passed paper). For Odum-provided signals, counterparty credentials are managed via API-key reloaders with HMAC signing and shard-level failure isolation. Detailed risk posture and the supervisory artefacts available per engagement are walked at the second call.",
      },
      {
        title: "Dashboard, API, and reporting",
        body: "Day-to-day work runs in the authenticated platform: the post-login services portal (dashboard, data, research, trading, observe, reports — sliced to your entitlements). The same operations are available programmatically where we ship endpoints: the Unified Trading API and service REST APIs documented at /docs. Reporting carries the same shape across all three workflows: positions, P&L attribution by factor, reconciliation, delivery health (for Signals workflows), audit trail, compliance artefacts.",
      },
      {
        title: "Commitment floor",
        body: "Twelve-month minimum engagement across all three DART shapes. The floor reflects real provisioning costs — legal review, venue onboarding, per-client API-key issuance, reconciliation setup, schema fit-check (Signals-In), promotion-ladder onboarding (Full), counterparty credential setup (Signals-Out). Pricing is per block — venue packs, chain packs, instrument-type packs — mixable across the three shapes. Specific numbers walked at the second call.",
      },
    ],
    keyMessages: [
      "DART is one operating stack with three engagement shapes — your signals, our pipeline, or our signals.",
      "Signals-In: your strategy, Odum's execution and reporting via the eight-field schema.",
      "Full pipeline: research-to-execution on the components Odum uses for its own capital, with client exclusivity where appropriate.",
      "Odum-provided signals: leased to counterparties under separate agreement, with delivery health and acknowledgement reporting.",
      "Twelve-month minimum engagement; venue / chain / instrument-type packs scope per client.",
    ],
    nextCall:
      "The 45-minute second call confirms which DART shape fits, walks venue / instrument-type compatibility, scopes the packs your engagement requires, and locks the commitment floor. Specific numbers and operational details are codex-private — not in the briefing — and are walked through at the second call.",
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
      "The right structure depends on who manages the strategy, where the capital sits, who faces the end client, what permissions are required, and whether the engagement is best handled through Odum, the client, or an approved affiliate route. Odum does not custody client capital. Where venue or brokerage access is required, permissions are scoped to the agreed mandate. Withdrawal authority is never requested.",
    sections: [
      {
        title: "What this route can cover",
        // Softened from the previous "Default has Odum as IM of record;
        // AR-style arrangements available case by case." line — reads as
        // intelligent structuring rather than forcing one model.
        body: "In many cases, the simplest route is Odum acting as investment manager where the mandate fits. AR-style or affiliate-supported structures can be considered where the client needs a different operating posture.",
        bullets: [
          "{{strong:Odum as investment manager}} — Odum acts as the investment manager of record where the engagement fits within its permissions and mandate scope.",
          "{{strong:SMA route}} — The client keeps capital in its own venue, broker, or custodian accounts. Odum may operate scoped read-and-execute access where agreed.",
          "{{strong:Affiliate fund or AIFM pathway}} — Where a pooled fund or EU-side structure is required, the operating model may involve an approved fund administrator, AIFM, custodian, or affiliate arrangement.",
          "{{strong:AR-style arrangement}} — Where a client wants to be customer-facing under its own brand, an AR-style structure may be considered case by case. This usually requires more onboarding and regulatory review.",
        ],
      },
      {
        title: "Custody and control",
        body: "The regulated operating model is a governance, permission, and reporting layer. It is not a custody product. For {{term:sma}} arrangements, the client or relevant entity holds the accounts. For pooled structures, assets sit with an appropriate third-party custodian or administrator route. Odum's access, where granted, is scoped to the mandate and does not include withdrawal permissions.",
      },
      {
        title: "Multi-vehicle reporting",
        body: "Where an engagement includes multiple funds, share classes, SMA books, or sub-entities, each book is reported separately and then rolled up into a supervisory view for the relevant client umbrella. The reporting surface can show {{term:nav|NAV}}, attribution, compliance artefacts, audit trail, positions, orders, fills, and reconciliation events at the correct level of the hierarchy.",
      },
      {
        title: "Risk and supervision",
        body: "Risk controls operate at the execution and reporting layers, regardless of the selected structure. These may include venue eligibility, instrument restrictions, leverage limits, concentration checks, position monitoring, kill-switches, and reconciliation controls. The responsible regulatory role depends on the chosen model. Where Odum is investment manager, Odum carries the relevant supervisory responsibility. Where the client or an affiliate carries the role, the responsibilities are scoped accordingly.",
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
      "Fit-driven structure: Odum-as-IM, SMA, affiliate fund, or AR-style.",
      "No custody by Odum.",
      "No withdrawal authority requested.",
      "Multi-vehicle structures can roll into one supervisory view.",
      "Reporting uses the same operating surface Odum uses internally.",
      "Distribution is separate.",
      "Pricing depends on structure, scope, and onboarding complexity.",
    ],
    nextCall:
      "Use the second call to resolve the structure against your facts: UK or EU path, SMA or fund, single or multi-vehicle, Odum-as-IM or AR-style, custody route, reporting requirements, and regulatory scope.",
    cta: BOOK_SECOND_CALL,
  },
  // ── Legacy pillars below — slugs intercepted by next.config.mjs redirects;
  //    kept as type-safe legacy content until a follow-up cleanup pass.
  {
    slug: "investment-management",
    title: "Odum-Managed Strategies",
    tldr: "Odum allocates client capital to its own systematic strategies under Odum's {{term:fca}} permissions. {{term:allocator}} reporting runs on the same surface Odum uses to operate the book.",
    frame:
      "Odum allocates client capital to selected systematic strategies under Odum's {{term:fca}} permissions. Allocators access the same operating surface Odum uses internally, filtered by mandate, share class, or {{term:sma}} partition. The structure is agreed case by case: a pooled fund for share-class access, or SMA where the client keeps {{term:venue}} accounts in its own name. Odum acts as investment manager; it does not custody client assets under either structure.",
    sections: [
      {
        title: "Structure: pooled fund or SMA",
        body: "**Pooled fund:** clients subscribe into a share class. Fund assets sit with a qualified third-party custodian, and each allocator sees only its own share-class NAV, exposure, and P&L. Subscriptions and redemptions are handled through the platform and fund-administration process.",
        bodyAfter:
          "**SMA:** the client holds venue accounts in its own entity name and grants Odum scoped execute-and-read access. Capital remains in the client's accounts, and withdrawal permissions are never requested.",
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
      "Odum manages selected systematic strategies under FCA permissions.",
      "Allocators can access strategies through SMA or pooled-fund structures.",
      "Odum does not custody client assets; custody follows the agreed structure.",
      "Reporting uses the same operating surface Odum uses internally, filtered by entitlement.",
      "Fees, capacity, liquidity, and onboarding are agreed mandate by mandate.",
    ],
    nextCall:
      "The 45-minute second call walks the strategies your mandate shape fits, the SMA-versus-pooled choice against your isolation preference, the venue setup against your existing relationships, and fee structure against the strategies in scope.",
    cta: BOOK_SECOND_CALL,
  },
] as const;
