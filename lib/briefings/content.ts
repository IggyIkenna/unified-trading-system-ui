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
    tldr: "Where appropriate, Odum can structure trading engagements around governance, supervisory reporting, FCA coverage, SMA routes, or affiliate fund pathways. The reporting surface is the same component tree Odum uses internally for its own investment management. Default has Odum as IM of record; AR-style arrangements available case by case.",
    frame:
      "Some trading engagements require more than technology. Where appropriate, Odum can structure selected engagements around the right governance, permissions, reporting, and affiliate pathway — Odum as IM under FCA permissions, SMA routes, affiliate fund / AIFM partnerships, or AR-style arrangements where a client wants to be customer-facing IM under their own brand. The shape is fit-driven, not product-driven. Odum Research Ltd holds live FCA authorisation (FRN 975797 — verifiable on the FCA register at register.fca.org.uk) and operates compliance, MLRO, and supervisory reporting internally. Where the planned activity sits outside UK regulatory scope, an EU-regulated affiliate with AIFM and fund-administration permissions carries the EU-side mandate. Custody is a separate concern from regulatory cover: under SMA, you hold your own venue accounts and Odum operates scoped execute-plus-read API keys with no withdrawal authority; under Pooled, fund assets sit with a qualified third-party custodian (Copper for crypto; equivalent regulated custodians for other asset classes). The regulatory-relevant test is who is IM of record — that party holds trading discretion and carries the corresponding authorisation requirement.",
    sections: [
      {
        title: "Engagement shapes — fit-driven, not product-driven",
        body: "Where Odum is IM of record under FCA FRN 975797: fastest onboarding, no AR registration required. Where the engagement runs as an SMA: client holds venue accounts in their own entity name, Odum runs execution under scoped keys. Where a fund vehicle is needed: affiliate fund administrator + AIFM partner handles NAV, subscriptions, and redemptions; Odum is investment manager. Where the client specifically wants to be customer-facing IM under their own brand: AR-style arrangements available, but FCA AR registration adds 4–12 weeks of onboarding lead time, so speed-to-live engagements default to Odum-as-IM. New legal drafting prefers the specific structure name (Advisory / AR-style / SMA / affiliate fund) over a generic umbrella label.",
      },
      {
        title: "Custody, scoped keys, no withdrawal authority — ever",
        body: "Odum does not take custody of client or sub-entity capital. The regulated operating model is a permission and supervision construct, not a custody construct. Venue custody stays with the client (SMA) or with a qualified third-party custodian (Pooled). Odum operates scoped venue API keys held in Secret Manager — execute-plus-read where Odum is IM and runs execution, read-only-plus-read-transaction where the client is IM and executes under its own authorisation or AR status. Withdrawal permission is never requested under any configuration. Each fund or SMA under a multi-vehicle umbrella follows the same key-scoping rule per its mandate shape.",
      },
      {
        title: "Multi-vehicle setup",
        body: "Where the engagement involves multiple sub-entities (multiple share classes, multiple SMA books, multiple fund vehicles), they are addressed independently in the reporting surface. Positions, NAV, attribution, and compliance artefacts are scoped to the sub-entity. The parent client has supervisory visibility across its own multi-vehicle umbrella only — never across other clients on the platform. The hierarchy is the same regardless of which engagement shape is chosen for any given vehicle.",
      },
      {
        title: "Supervisory artefacts",
        body: "Standard supervisory artefacts: monthly NAV per fund or SMA book; quarterly performance attribution at strategy and venue granularity; compliance certifications and periodic attestations covering mandate boundaries, best execution, and conflicts; audit-trail access covering instructions, orders, fills, position movements, and reconciliation events. These are produced by the same surface Odum's own internal supervision uses — same components, same data — sliced per the client's umbrella.",
      },
      {
        title: "Risk and governance",
        body: "Risk and governance overlays scale with the engagement shape. Position-balance monitoring, risk-and-exposure checks, instrument and venue eligibility, leverage and concentration ceilings, and kill-switches all run at the same execution-service layer regardless of who is IM of record. Where Odum is IM, Odum's compliance and MLRO carry the supervisory load. Where the client is IM under an AR-style arrangement, Odum supplies the supervisory infrastructure but the client's own MLRO and compliance officer carry the regulatory load. Multi-vehicle umbrellas carry an additional supervisory overlay across the client's own sub-entities.",
      },
      {
        title: "Distribution",
        body: "Distribution support is available by separate agreement only. The regulated operating model itself does not include distribution. Where a client wants distribution support, the scope is agreed at the second call and contracted separately.",
      },
      {
        title: "Commitment floor",
        body: "Twelve-month minimum engagement. Onboarding costs are real — legal review, compliance setup, MLRO onboarding, venue provisioning, reporting setup — and the floor recovers them. Pricing is per block: regulatory operating model layer, reporting core, execution layer, venue packs, instrument-type packs. Multi-vehicle engagements carry per-additional-vehicle scope uplifts rather than N-times-the-base. Specific numbers are walked through at the second call.",
      },
    ],
    keyMessages: [
      "Engagement shape is fit-driven — Odum-as-IM, SMA, affiliate fund, or AR-style — assessed case by case.",
      "Odum does not custody. Scoped venue keys, no withdrawal authority, ever.",
      "Multi-vehicle umbrellas address sub-entities independently with supervisory overlay across the client's own umbrella only.",
      "Supervisory artefacts (NAV, attribution, compliance, audit trail) are produced by the same surface Odum's own internal supervision uses.",
      "Distribution support is by separate agreement only — not included in the regulated operating model.",
      "Twelve-month minimum engagement; per-block pricing with per-additional-vehicle uplifts on multi-vehicle umbrellas.",
    ],
    nextCall:
      "The 45-minute second call resolves engagement shape against your specifics — UK or EU path, Fund or SMA, single or multi-vehicle, Odum-as-IM or AR-style — walks the supervisory artefacts you need, and confirms the regulatory scope of your activity. Specific scope numbers and onboarding workstreams are codex-private and walked through during the call.",
    cta: BOOK_SECOND_CALL,
  },
  // ── Legacy pillars below — slugs intercepted by next.config.mjs redirects;
  //    kept as type-safe legacy content until a follow-up cleanup pass.
  {
    slug: "investment-management",
    title: "Odum-Managed Strategies",
    tldr: "Odum allocates client capital to its own systematic strategies under Odum's {{term:fca}} permissions. {{term:allocator}} reporting runs on the same surface Odum uses to operate the book.",
    frame:
      "Investment Management ({{term:im}}) allocates client capital to Odum-run systematic strategies under Odum's {{term:fca}} permissions. Reporting comes from the same surface Odum's own traders and risk desk use — same components, same data, entitlement-filtered for {{term:allocator}} views. Strategies are operated on Odum infrastructure, not wrapped on top of a third party. Custody model depends on structure: under {{term:sma}} you hold your own {{term:venue}} accounts in your own entity name and issue Odum scoped execute+read API keys; under {{term:pooled}} the fund's assets sit with a qualified third-party custodian (Copper for crypto; equivalent regulated custodians for other asset classes), you hold a share class in the fund, and you subscribe and redeem through the platform — automated via API and via the client dashboard. Odum Research Ltd — the investment manager — never holds principal; no custody role under either structure.",
    sections: [
      {
        title: "The strategy surface",
        body: "The second call opens with the catalogue screen — one row per strategy Odum offers you, with maturity (code-audited, backtested, paper, live-tiny, live-allocated) and capacity visible per slot. No research-phase placeholders, no authoring surfaces. What you see is live, allocable, and filtered to the public slice your mandate warrants plus any slots Odum has set aside for discretionary allocation on your side.",
      },
      {
        title: "Structure — SMA or Pooled with share classes",
        body: "Two structural options resolve at onboarding, with two different custody mechanics. SMA: you hold your own venue accounts in your own entity name, funded directly with the venue. Odum operates execution via scoped execute+read API keys kept in Odum Secret Manager and hot-reloaded into execution-service — no withdrawal authority, ever. Capital stays with you throughout; you can revoke a key at any time and execution on that venue closes inside the next reload cycle. Pooled: allocators subscribe to share classes in a fund vehicle whose assets sit with a qualified third-party custodian (Copper for crypto; equivalent regulated custodians for other asset classes). The custodian holds fund assets under their own regulatory permissions; Odum Research Ltd is the investment manager and does not custody. You see your share-class NAV and position attribution via the Odum portal, and you subscribe and redeem via platform request — automated via API and via the client dashboard. Pooled is operationally simpler and often better for smaller tickets or where share-class mechanics are a feature rather than a cost; SMA is the default for allocators who want full isolation, bespoke venue selection, or mandate-specific risk parameters.",
        bodyAfter:
          "Under the Pooled structure, visibility is strictly sliced by share-class identifier — you see only your own slice of positions, exposures, and P&L. There is no cross-client visibility within the Pooled vehicle. The choice between SMA and Pooled has real downstream consequences on onboarding, venue provisioning, reporting, and liquidity terms, walked through against your specifics at the second call.",
      },
      {
        title: "Pooled custody — qualified custodian and portal subscriptions",
        body: "This section covers Pooled only; SMA keeps you on your own venue accounts per the Structure section. Under Pooled, fund assets sit with a qualified third-party custodian regulated for the asset classes in scope — Copper for crypto, equivalent regulated custodians for {{term:tradfi}} and on-chain positions. Odum Research Ltd is the investment manager; the custodian holds fund assets under their own regulatory permissions. The fund administrator runs {{term:nav}} accounting, subscriptions, and redemptions. Odum Research Ltd never touches principal; the trading entity never holds client capital.",
        bodyAfter:
          "Subscriptions and redemptions are automated via the Odum platform. You log in to the client dashboard, see your share-class NAV and position attribution, and submit a subscription or redemption request; the request flows through compliance and NAV-calculation gates at the fund administrator and settles at the published NAV point. The same request surface is exposed as REST API endpoints so allocators with their own operations can script flows alongside the UI. Every state transition (subscription requested, subscribed, redemption requested, redeemed, settled) emits a lifecycle event into your audit trail.",
      },
      {
        title: "Reporting surface — the operating system, filtered",
        body: "Positions, exposures, {{term:pnl|P&L}} attribution by factor, reconciliation breaks, audit trail, compliance artefacts. The same surface Odum's own traders and risk desk use, filtered through your entitlement — share class if Pooled, SMA partition if standalone. Your allocator reporting is a partition of an operational system, not a purpose-built investor view assembled after the fact. The batch-and-live parity principle applies: the backtest view you see at onboarding uses the same components, the same risk checks, the same position tracking as live. The only thing that changes between batch and live is the execution-fill source.",
      },
      {
        title: "Regulatory posture and commitment floor",
        body: "Odum operates under FCA permissions. {{term:mlro}}, compliance monitoring, and supervisory reporting run internally — not outsourced. Twelve-month minimum engagement; the floor reflects real provisioning costs — legal review, venue onboarding, per-client API-key issuance, reconciliation setup, share-class or SMA mechanics.",
      },
      {
        title: "Performance-fee band and platform-fee choice",
        body: "Standard mandate posture is no management fee — IM runs on performance share only. Per codex/14-playbooks/commercial-model/im-profit-share-structures.md, the performance share sits in a 30-35% band on profits above a negotiated {{term:hwm|high-water mark}}; the lower end of the band applies to liquid, commoditised strategies (higher replaceability), the upper end applies to specialised or capacity-bound strategies (harder to source elsewhere). Specific rate per mandate is covered in the second call under codex-private pricing. At mandate signing you pick one of two platform-fee options: Option A — a small uplift on the performance share in exchange for zero fixed monthly charge, pure alignment posture. Option B — a small flat monthly platform-access fee in exchange for the lower performance share, a modest fixed floor. Either captures allocation to the same strategies; the choice is about whether you prefer full alignment or a small fixed component. Co-invest and asymmetric structures (where Odum provides skin-in-the-game alongside the client's allocation) are available on a bespoke basis for strategies where that alignment shape fits — walked through at contract drafting if relevant to your mandate.",
      },
      {
        title: "Related paths",
        body: "If you run an FCA-regulated operation and want Odum's permissions over your own activity, see the Regulatory Umbrella briefing at /briefings/regulatory — the reporting surface is shared between IM clients and Umbrella clients because the underlying stack is one. If you generate your own strategy signals and want to use Odum's execution and reporting rather than allocate capital to Odum-run strategies, see the DART Signals-In briefing at /briefings/dart-signals-in.",
      },
    ],
    keyMessages: [
      "Allocation to Odum-run strategies on Odum infrastructure under Odum's FCA permissions — not a third-party wrapper.",
      "Two structural options with two custody mechanics. SMA: your venue accounts in your own entity name, scoped Odum execute+read keys, no withdrawal authority — capital stays with you. Pooled: share classes in a fund vehicle, fund assets with a qualified third-party custodian (Copper or equivalent), subscriptions + redemptions via Odum portal.",
      "Custody depends on structure. SMA: your own venue accounts in your own entity name, scoped execute+read keys to Odum — no withdrawal authority, ever. Pooled: qualified third-party custodian (Copper or equivalent) holds fund assets; you subscribe and redeem via the Odum portal, automated via API and UI. Odum Research Ltd — the investment manager — never holds principal under either structure.",
      "Reporting is the same surface Odum uses internally, filtered by entitlement — share class or SMA partition. Same data, same components, different views.",
      "Performance share sits in a 30-35% band; no management fee. Platform-fee choice at signing: uplift on performance share (Option A) or small flat monthly access fee (Option B).",
      "Regulatory cover, compliance, and MLRO are operated inside Odum — not outsourced, not optional. Twelve-month minimum engagement.",
    ],
    nextCall:
      "The 45-minute second call walks the specific strategies your mandate shape fits, the SMA-versus-Pooled choice against your isolation preference and share-class mechanics, the read-only-key venue setup against your existing venue relationships, and the platform-fee option against your preferred alignment posture.",
    cta: BOOK_SECOND_CALL,
  },
] as const;
