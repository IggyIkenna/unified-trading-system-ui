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
  slug:
    | "investment-management"
    | "regulatory"
    | "platform"
    | "dart-signals-in"
    | "dart-full"
    | "signals-out";
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
  {
    slug: "investment-management",
    title: "Investment Management",
    tldr:
      "Odum allocates client capital to its own systematic strategies under Odum's {{term:fca}} permissions. {{term:allocator}} reporting runs on the same surface Odum uses to operate the book.",
    frame:
      "Investment Management ({{term:im}}) allocates client capital to Odum-run systematic strategies under Odum's {{term:fca}} permissions. Reporting comes from the same surface Odum's own traders and risk desk use — same components, same data, entitlement-filtered for {{term:allocator}} views. Strategies are operated on Odum infrastructure, not wrapped on top of a third party. Custody model depends on structure: under {{term:sma}} you hold your own {{term:venue}} accounts in your own entity name and issue Odum scoped execute+read API keys; under {{term:pooled}} the fund's assets sit with a qualified third-party custodian (Copper for crypto; equivalent regulated custodians for other asset classes), you hold a share class in the fund, and you subscribe and redeem through the platform — automated via API and via the client dashboard. Odum Research Ltd — the investment manager — never holds principal; no custody role under either structure.",
    sections: [
      {
        title: "The strategy surface",
        body:
          "The second call opens with the catalogue screen — one row per strategy Odum offers you, with maturity (code-audited, backtested, paper, live-tiny, live-allocated) and capacity visible per slot. No research-phase placeholders, no authoring surfaces. What you see is live, allocable, and filtered to the public slice your mandate warrants plus any slots Odum has set aside for discretionary allocation on your side.",
      },
      {
        title: "Structure — SMA or Pooled with share classes",
        body:
          "Two structural options resolve at onboarding, with two different custody mechanics. SMA: you hold your own venue accounts in your own entity name, funded directly with the venue. Odum operates execution via scoped execute+read API keys kept in Odum Secret Manager and hot-reloaded into execution-service — no withdrawal authority, ever. Capital stays with you throughout; you can revoke a key at any time and execution on that venue closes inside the next reload cycle. Pooled: allocators subscribe to share classes in a fund vehicle whose assets sit with a qualified third-party custodian (Copper for crypto; equivalent regulated custodians for other asset classes). The custodian holds fund assets under their own regulatory permissions; Odum Research Ltd is the investment manager and does not custody. You see your share-class NAV and position attribution via the Odum portal, and you subscribe and redeem via platform request — automated via API and via the client dashboard. Pooled is operationally simpler and often better for smaller tickets or where share-class mechanics are a feature rather than a cost; SMA is the default for allocators who want full isolation, bespoke venue selection, or mandate-specific risk parameters.",
        bodyAfter:
          "Under the Pooled structure, visibility is strictly sliced by share-class identifier — you see only your own slice of positions, exposures, and P&L. There is no cross-client visibility within the Pooled vehicle. The choice between SMA and Pooled has real downstream consequences on onboarding, venue provisioning, reporting, and liquidity terms, walked through against your specifics at the second call.",
      },
      {
        title: "Pooled custody — qualified custodian and portal subscriptions",
        body:
          "This section covers Pooled only; SMA keeps you on your own venue accounts per the Structure section. Under Pooled, fund assets sit with a qualified third-party custodian regulated for the asset classes in scope — Copper for crypto, equivalent regulated custodians for {{term:tradfi}} and on-chain positions. Odum Research Ltd is the investment manager; the custodian holds fund assets under their own regulatory permissions. The fund administrator runs {{term:nav}} accounting, subscriptions, and redemptions. Odum Research Ltd never touches principal; the trading entity never holds client capital.",
        bodyAfter:
          "Subscriptions and redemptions are automated via the Odum platform. You log in to the client dashboard, see your share-class NAV and position attribution, and submit a subscription or redemption request; the request flows through compliance and NAV-calculation gates at the fund administrator and settles at the published NAV point. The same request surface is exposed as REST API endpoints so allocators with their own operations can script flows alongside the UI. Every state transition (subscription requested, subscribed, redemption requested, redeemed, settled) emits a lifecycle event into your audit trail.",
      },
      {
        title: "Reporting surface — the operating system, filtered",
        body:
          "Positions, exposures, {{term:pnl|P&L}} attribution by factor, reconciliation breaks, audit trail, compliance artefacts. The same surface Odum's own traders and risk desk use, filtered through your entitlement — share class if Pooled, SMA partition if standalone. Your allocator reporting is a partition of an operational system, not a purpose-built investor view assembled after the fact. The batch-and-live parity principle applies: the backtest view you see at onboarding uses the same components, the same risk checks, the same position tracking as live. The only thing that changes between batch and live is the execution-fill source.",
      },
      {
        title: "Regulatory posture and commitment floor",
        body:
          "Odum operates under FCA permissions. {{term:mlro}}, compliance monitoring, and supervisory reporting run internally — not outsourced. Twelve-month minimum engagement; the floor reflects real provisioning costs — legal review, venue onboarding, per-client API-key issuance, reconciliation setup, share-class or SMA mechanics.",
      },
      {
        title: "Performance-fee band and platform-fee choice",
        body:
          "Standard mandate posture is no management fee — IM runs on performance share only. Per codex/14-playbooks/commercial-model/im-profit-share-structures.md, the performance share sits in a 30-35% band on profits above a negotiated {{term:hwm|high-water mark}}; the lower end of the band applies to liquid, commoditised strategies (higher replaceability), the upper end applies to specialised or capacity-bound strategies (harder to source elsewhere). Specific rate per mandate is covered in the second call under codex-private pricing. At mandate signing you pick one of two platform-fee options: Option A — a small uplift on the performance share in exchange for zero fixed monthly charge, pure alignment posture. Option B — a small flat monthly platform-access fee in exchange for the lower performance share, a modest fixed floor. Either captures allocation to the same strategies; the choice is about whether you prefer full alignment or a small fixed component. Co-invest and asymmetric structures (where Odum provides skin-in-the-game alongside the client's allocation) are available on a bespoke basis for strategies where that alignment shape fits — walked through at contract drafting if relevant to your mandate.",
      },
      {
        title: "Related paths",
        body:
          "If you run an FCA-regulated operation and want Odum's permissions over your own activity, see the Regulatory Umbrella briefing at /briefings/regulatory — the reporting surface is shared between IM clients and Umbrella clients because the underlying stack is one. If you generate your own strategy signals and want to use Odum's execution and reporting rather than allocate capital to Odum-run strategies, see the DART Signals-In briefing at /briefings/dart-signals-in.",
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
  {
    slug: "platform",
    title: "DART — Start here",
    tldr:
      "{{term:dart|DART}} (Data Analytics, Research & Trading) is the set of services Odum uses internally, packaged for client use. This briefing orients you across the two DART paths — signals-in and full pipeline — and points at the deeper briefing that fits.",
    frame:
      "{{term:dart|DART}} — Data Analytics, Research & Trading — is the set of services Odum uses internally to build, research, promote, execute, and monitor systematic strategies. The underlying system is one; the commercial path picks which surfaces you touch. This briefing is the orientation layer. It frames the two paths within DART and hands you to the deeper briefing that matches. Signals-in (you generate signals; Odum operates execution, risk, allocation, reporting) lives at /briefings/dart-signals-in. Full pipeline (you additionally use Odum's research and promote layer on the same components) lives at /briefings/dart-full. The inverse direction — our signals delivered to your execution on your own infrastructure — is Odum Signals at /briefings/signals-out, a distinct fourth path outside DART.",
    sections: [
      {
        title: "Two paths — which one fits your operation",
        appliesTo: "both",
        body:
          "Signals-only clients plug their own strategy outputs into Odum's execution and reporting stack — continue at /briefings/dart-signals-in for the full mechanic. Full-pipeline clients additionally use Odum's research, backtest, and promote layer to author strategies on Odum data — continue at /briefings/dart-full for that deeper path. The upgrade from signals-only to full pipeline is a formal commercial event, not a bolt-on — if you expect to need research during the engagement, resolve to full pipeline now. The instruction-schema fit-check in the next section resolves which path fits.",
      },
      {
        title: "Instruction schema — the signals-only fit-check",
        appliesTo: "signals-in",
        body:
          "Signals-only runs on a published instruction schema. Odum needs eight fields on every instruction for execution, risk, and allocation to operate cleanly. Your upstream either produces them already or can be adapted to — that decision is yours to make before the second call. The full field-by-field spec lives at /briefings/dart-signals-in.",
        bullets: [
          "Instrument and venue context — instrument, venue or chain, instrument-type category.",
          "Intended action — buy, sell, hedge, close, roll, or a combination that maps to a known execution primitive.",
          "Size or target exposure — quantity, notional, or target exposure in a unit Odum's risk and allocation services understand.",
          "Timeframe or urgency — market, scheduled, over-window, passive limit.",
          "Order constraints — price limits, participation limits, slippage budget, venue restrictions, time-in-force.",
          "Strategy or instruction identifier — a stable identifier linking the instruction back to your upstream for reconciliation.",
          "Lifecycle behaviour — how you modify, replace, or cancel an open instruction.",
          "Essential risk and allocation constraints — per-instruction limits, per-client allocation caps, correlation limits.",
        ],
        bodyAfter:
          "What stays on your side: regime classification logic, raw model code, signal-generation methodology, portfolio construction math, optimisation objective. Your strategic edge does not cross the fence.",
      },
      {
        title: "The strategy catalogue",
        appliesTo: "both",
        body:
          "The catalogue shows one row per strategy slot with a maturity tag (code-audited → backtested → paper → live-tiny → live-allocated) and a phase tag (research, paper, live). Research, paper, and live are phase views of the same catalogue — a live-allocated slot can be pulled into research phase for a re-run over a new regime window. Pre-backtested slots are not visible externally. Signals-In clients see the catalogue for context and allocation capacity; Full Pipeline clients additionally interact with the catalogue through the research and promote surfaces (see /briefings/dart-full).",
      },
      {
        title: "Research, promote, execute",
        appliesTo: "full-pipeline",
        body:
          "Full-pipeline clients interrogate historical data in research, promote candidates through paper to live, and trade on the execution layer. Signals-only clients skip research and promote — they send instructions in and use execution, reporting, and reconciliation. The research-and-promote pipeline is a block boundary between the two paths, not a feature flag. The deeper walkthrough lives at /briefings/dart-full.",
      },
      {
        title: "Commitment and packs",
        appliesTo: "both",
        body:
          "Twelve-month minimum engagement. Your scope is defined by venue packs, chain packs, and instrument-type packs. A typical signals-only shape is three venues, two chains, two instrument types; full-pipeline shapes add research breadth. Pricing is per block, mixable across tiers. Numbers live in the second call.",
      },
      {
        title: "Where to go next — the three deeper briefings",
        body:
          "This is an orientation briefing, not a depth briefing. Each path has its own dedicated briefing with the schema, mechanics, lock-matrix, and commercial structure spelled out in full:",
        bullets: [
          "DART Signals-In (your signals → our execution) — full eight-field instruction schema, venue/instrument compatibility matrix, lifecycle semantics, what signals-only does NOT enable. Read: /briefings/dart-signals-in.",
          "DART Full Pipeline (your research → your promote → our stack) — research surface walkthrough, 8-stage maturity ladder, three-band metered research (baseline / complex / full-matrix sweep), four-tier exclusivity anchor (commodity → targeted → carved-out → uniquely-differentiated). Read: /briefings/dart-full.",
          "Odum Signals (our signals → your execution) — full signal payload schema, webhook + REST-pull delivery mechanics, HMAC signing, idempotency, light observability UI, hybrid commercial shape. A distinct fourth path outside DART. Read: /briefings/signals-out.",
        ],
        bodyAfter:
          "Pick the briefing that fits your intended engagement — reading all three is fine if you are deciding between them. The fit-check in each briefing resolves whether the path is right for you before the second call is scheduled. For the two capital-running paths (Investment Management and Regulatory Umbrella) see /briefings/investment-management and /briefings/regulatory respectively.",
      },
    ],
    keyMessages: [
      "DART is the set of services Odum uses internally, packaged for client use. Not a wrapper on top.",
      "Two paths — signals-only or full pipeline. The instruction-schema fit-check resolves which one fits.",
      "Research, paper, and live are phase views of one catalogue, not three separate systems.",
      "Signals-only stops at the block boundary — execution, reporting, reconciliation. Research and promote are full-pipeline only.",
      "Twelve-month minimum engagement. Venue, chain, and instrument-type packs scope per client.",
    ],
    nextCall:
      "If the fit-check lands on signals-only, the 45-minute second call walks the instruction schema against your upstream and covers execution, reconciliation, and reporting scope. If it lands on full pipeline, the call walks the research surface against one of your strategy candidates and the promotion path through to live.",
    cta: BOOK_SECOND_CALL,
  },
  {
    slug: "regulatory",
    title: "Regulatory Umbrella",
    tldr:
      "Firms running regulated activity that want operational cover without seeking direct {{term:fca}} authorisation operate under Odum's permissions. Odum is the regulated counterparty.",
    frame:
      "Firms running regulated activity that want operational cover without seeking direct {{term:fca}} authorisation operate under Odum's permissions. Odum holds live FCA authorisation, operates compliance and {{term:mlro}} functions internally, and is the regulated counterparty. The firm retains strategic and commercial control; regulatory operations run through Odum. Onboarding uses scoped read-only-plus-read-transaction {{term:venue}} API keys — no capital moves to Odum, no execution runs through Odum's venues. You keep operational and custodial control; Odum operates the regulatory and reporting overlay.",
    sections: [
      {
        title: "Regulatory scope",
        body:
          "Per codex/14-playbooks/experience/regulatory-umbrella-briefing.md, the briefing enumerates the FCA permissions Odum holds and the regulated activities they cover — arranging deals in investments, advising on investments, operating a fund or SMA, and the related ancillary activities — specific enough for you to check whether your planned activity fits. Activities outside Odum's scope are named as outside scope, not hedged. A prospect whose activity does not fit learns that from the briefing, not from a third meeting. The umbrella operates the firm as an {{term:ar|appointed representative}} (or the equivalent structural vehicle for fund-style clients) under Odum's principal permissions. Odum does NOT advise firms on obtaining their own direct FCA authorisation — if you want to pursue direct authorisation as your endgame, Odum is the wrong counterparty for that project; the Umbrella is the right vehicle for firms that want operational cover under another principal's permissions.",
      },
      {
        title: "Onboarding — five workstreams in parallel",
        body:
          "Five workstreams run in parallel, each with a stated Odum owner and a stated dependency on you:",
        bullets: [
          "Legal scoping and agreements — compliance team owns; you provide planned activity detail and corporate structure. Output: appointed-representative agreement or sub-fund documentation, scoped to the regulated activities you run.",
          "KYC/AML and suitability — MLRO owns; you provide key-person KYC, source-of-funds evidence, and onboarding diligence on your own clients. Output: MLRO sign-off on firm and key personnel.",
          "Compliance and risk-tolerance profiling — compliance lead owns; you provide policy and procedure documentation, plus a risk-tolerance profile per sub-client or mandate. Output: compliance monitoring plan and risk register.",
          "Mandate drafting and venue setup with read-only keys — operations plus engineering own; you provide venue preferences and issue scoped read-only-plus-read-transaction API keys. Output: venue onboarding manifest and reporting-scope sign-off.",
          "Reporting setup — engineering owns; you sign off on the reporting entitlement surface and the set of share-class or sub-mandate identifiers. Output: operating reporting surface live for your firm.",
        ],
        bodyAfter:
          "Parallel execution, not sequential. The reader leaves with a mental model of what onboarding feels like and what they are responsible for.",
      },
      {
        title: "Operating model once live",
        body:
          "The Umbrella firm operates as the appointed representative (or the equivalent fund-style vehicle) under Odum's FCA permissions. Odum runs compliance monitoring, supervisory checks, transaction reporting, and best-execution evidence on the firm's activity. You retain strategic and commercial control of the business; regulatory operations run through Odum. Multi-fund and multi-SMA structures are supported natively: a Regulatory Umbrella client can operate as the designated representative with N funds, N SMAs, or a mix under their umbrella entity — each sub-vehicle with its own share class (if pooled) or its own standalone SMA partition, reported and supervised inside the same surface.",
      },
      {
        title: "Supervisory artifacts — what you get monthly and quarterly",
        body:
          "Umbrella clients receive a defined set of supervisory artefacts on a published cadence, produced directly from the operating stack:",
        bullets: [
          "Monthly {{term:nav}} and position reports per sub-fund or SMA, reconciled against venue balances.",
          "Quarterly performance attribution, breaking {{term:pnl|P&L}} out by strategy, factor, and execution quality where relevant.",
          "Monthly compliance monitoring reports — breach log, near-miss log, remediation status.",
          "Transaction reporting artefacts under {{term:mifid|MIFID}} or equivalent regimes, generated from fills on your scoped venue keys.",
          "{{term:best-execution|Best-execution}} evidence packs per venue per period.",
          "Annual compliance certifications and audit-trail access for your own auditors and regulators-in-scope.",
        ],
      },
      {
        title: "Reporting surface — inherited from the operating stack",
        body:
          "Regulatory Umbrella clients get the full Odum reporting and analytics tool-set the same way IM clients do — positions, exposures, P&L attribution, performance breakdowns, reconciliation, audit trail, MIFID and transaction reporting, supervisory artefacts. Not a separate regulatory-reporting product; a partition of the operating system, entitlement-filtered to your regulated-activity view.",
        bodyAfter:
          "Read-only venue API keys stay in Odum's Secret Manager for the duration of the engagement and can be revoked by you at any time. Odum pulls position, order, and fill data from your venues into the shared reporting surface — no capital moves to Odum, no execution runs through Odum's venues. The same keys let you build up funds, sub-clients, and sub-mandates under your firm and track their performance and breakdowns in the platform with full sub-partition isolation.",
      },
      {
        title: "Commitment",
        body:
          "Twelve-month minimum engagement. Onboarding costs are real — legal review, compliance setup, MLRO onboarding, venue provisioning, reporting setup — and the floor recovers them. Pricing is per block: regulatory umbrella reporting, reporting core, execution layer, venue packs, instrument-type packs. Numbers are walked through at the second call.",
      },
      {
        title: "Related paths",
        body:
          "If you are looking to allocate capital to Odum-run strategies rather than cover your own regulated activity, see the Investment Management briefing at /briefings/investment-management — the reporting surface is shared because the underlying operating stack is one. If you additionally want access to Odum's research and promote layer on your own strategies under the umbrella, see the DART Full Pipeline briefing at /briefings/dart-full.",
      },
    ],
    keyMessages: [
      "Odum holds FCA permissions and operates compliance, MLRO, and supervisory reporting internally. Not outsourced oversight repackaged.",
      "Umbrella clients operate under Odum's permissions as appointed representatives (or the equivalent fund-style vehicle). Odum carries the regulatory obligations.",
      "Onboarding has five parallel workstreams — legal, KYC/AML, compliance and risk-tolerance, mandate drafting plus venue setup, reporting — each with a stated Odum owner.",
      "Multi-fund and multi-SMA structures are native: one umbrella client can run N funds or SMAs, each with its own share class or partition, supervised inside one surface.",
      "Supervisory artefacts run on a defined cadence — monthly NAV and compliance, quarterly attribution, transaction reporting, best-execution packs, annual certifications, audit-trail access.",
      "Reg Umbrella clients inherit the full IM/DART reporting and analytics tool-set via read-only venue API keys. No capital movement; you keep operational control.",
      "Twelve-month minimum engagement. The floor recovers real onboarding costs.",
    ],
    nextCall:
      "The 45-minute second call walks your specific activity against Odum's permissions, confirms scope fit, maps the five onboarding workstreams against your situation, and resolves the sub-structure — how many funds, SMAs, or mandates under the umbrella and the share-class or partition mechanics for each.",
    cta: BOOK_SECOND_CALL,
  },
  {
    slug: "dart-signals-in",
    title: "DART Signals-In — your signals, our execution",
    tldr:
      "Your strategy generates signals upstream. Odum's execution, risk, allocation, and reporting stack runs the rest. The integration surface is a fixed, published instruction schema.",
    frame:
      "{{term:dart|DART}} — Data Analytics, Research & Trading — Signals-In is the downstream path for firms that already run their own strategy research and want to plug signal output into a full execution and reporting stack. Your upstream keeps its edge; Odum's downstream stack operates on structured instructions. Direction is one-way: your signals come in, Odum executes on {{term:venue|venues}} via scoped execute+read API keys held in Secret Manager. Two execution-account options: (1) the default — a segregated sub-account carved out of Odum's existing venue accounts under your own name at the exchange's sub-account primitive; this skips the multi-week exchange onboarding you would otherwise face; (2) your own venue account or prime-broker relationship if you prefer to hold the account yourself, in which case you issue Odum the same scoped execute+read API keys. Either way, Odum Research Ltd never has withdrawal authority and never holds principal. The fit-check is whether your upstream already produces the eight required fields — or can be adapted to.",
    sections: [
      {
        title: "What crosses the fence and what does not",
        body:
          "Signals-In is a boundary product. Your side of the fence holds regime classification logic, raw model internals, features, weights, training process, signal-generation methodology, portfolio construction maths, and optimisation objective. Odum's side holds execution routing, risk checks, allocation, reconciliation, and reporting. The boundary is the instruction schema — eight fields, nothing more. Your strategic edge never enters Odum's systems.",
      },
      {
        title: "Multi-mandate and sub-client structure",
        body:
          "A single Signals-In engagement can represent N of your own internal sub-clients or sub-mandates — one client identifier per sub-mandate, each with its own reporting partition, its own P&L attribution, and (where the venue supports it) its own venue sub-account inside your venue master account. Positions, P&L, reporting, and reconciliation partition cleanly per sub-client. This is the Signals-In equivalent of the Reg Umbrella N-funds-or-SMAs pattern: one commercial engagement, one instruction-schema integration, multiple downstream partitions. The instruction schema carries the sub-client identifier so execution-service routes to the correct venue sub-account without upstream re-keying. If your upstream represents only a single trading book, the same mechanic applies with N=1.",
      },
      {
        title: "The eight-field instruction schema — full spec",
        body:
          "Every instruction your upstream emits carries eight fields. Each field has a defined shape, validation semantics, and downstream consumer inside Odum's stack. This is the fit-check — the contract Odum's execution, risk, allocation, and reconciliation services operate on. The eight-field shape and the three-depth pricing dimension (minimal / standard / rich) are the SSOT defined in codex/14-playbooks/shared-core/instruction-schema-fit-and-package-boundaries.md and rule 10 (strategy instruction schema principles). Your current signal surface either produces these already or can be adapted to produce them. If neither, Signals-In is not the right path — you are either a Full Pipeline client (Odum runs the upstream) or a bespoke engagement with a custom-premium block.",
        bullets: [
          "Field 1 — instrument and venue context. Values: a resolved instrument_id from Odum's instruments catalogue, a venue or chain identifier from the compatibility matrix (any CeFi venue in the venue registry; any DeFi chain in UAC CHAIN_RPC_TEMPLATES; Polymarket or Kalshi for prediction; sports venues for sports fixtures), and an instrument-type category (spot, perp, dated future, option, prediction market, sports fixture, on-chain spot, flash-loan swap). Consumer: instruments-service resolution plus execution-service venue routing.",
          "Field 2 — intended action. Values: buy, sell, hedge, close, roll, or a combination that maps to a single execution primitive in Odum's algo library. Multi-leg structures are supported on venues that support them (see the compatibility matrix — Options multi-leg depends on the venue pack). Consumer: execution-service algo selector.",
          "Field 3 — size or target exposure. Values: quantity (contracts, shares, tokens), notional (in a specified currency), or target portfolio exposure expressed as a fraction or a notional cap. Unit must be one Odum's risk and allocation services understand — declared at onboarding per strategy identifier. Consumer: risk-and-exposure-service plus portfolio-allocator.",
          "Field 4 — timeframe or urgency. Values: market (fill-now), scheduled (fill at a timestamp), over-window (participate across a duration with a declared participation rate), passive-limit (rest at a price, optionally with a timeout). Maps one-to-one onto Odum's execution-algo library entries. Consumer: execution-service algo parameterisation.",
          "Field 5 — order constraints. Values: price limits (absolute or relative), participation limits (max percentage of venue volume), slippage budget (in basis points; DeFi flash-loan orders typically carry bps), venue restrictions (if a sub-strategy excludes certain venues), time-in-force (GTC, IOC, FOK, GTD with an expiry). Consumer: execution-service algo parameterisation.",
          "Field 6 — strategy or instruction identifier. Values: a client-stable identifier, unique per strategy per instruction, that survives restarts on your side. Used for reconciliation, P&L attribution, and lifecycle. Consumer: reconciliation service plus reporting-attribution pipeline.",
          "Field 7 — lifecycle behaviour. Values: supersede (new instruction replaces prior, prior's open quantity cancelled, new parameters apply from acknowledgement), add (new instruction sits alongside prior, both active and tracked independently under the same strategy_id), cancel (instruction-level cancel — cancel open quantity on all fills belonging to this instruction id; already-filled quantity is not unwound, that is a new counter-instruction). Amend within an active instruction (e.g. changing a price limit on unfilled working portion) is a lifecycle update event on the same instruction id, not a new instruction. Consumer: instructions-service lifecycle handler; execution-service translates to venue-side protocol per venue's amend capability.",
          "Field 8 — essential risk and allocation constraints. Values: per-instruction risk limits (max loss, max notional), per-client allocation caps (position cap per strategy), correlation limits (max gross exposure across a correlated basket). These are hard gates; breaches cause the instruction to be rejected at the allocation layer before it reaches execution. Consumer: risk-and-exposure-service plus portfolio-allocator.",
        ],
        bodyAfter:
          "Schema depth is a dimension inside the integration. Minimal depth carries the eight fields and little else — onboarding cost is lowest. Standard depth adds common extensions: strategy-family tags, parent-child instruction grouping for multi-leg orders, scheduling hints, reconciliation annotations. Rich depth covers bespoke fields negotiated per client — proprietary risk dimensions, custom execution directives, custom lifecycle states; onboarding cost is higher, typically bundled with a custom-premium block. Deeper schema, higher onboarding effort; pricing sits inside the instructions-integration block, not as a separate block.",
      },
      {
        title: "Venue and instrument compatibility matrix",
        body:
          "The schema is compatible with most venue and instrument-type combinations, but not all. Known incompatibilities — from the codex compatibility matrix in instruction-schema-fit-and-package-boundaries.md section (b) — are spelled out upfront so the fit-check resolves cleanly. Each row names the venue category, instrument type, execution mode, and whether the combination is compatible today:",
        bullets: [
          "Any {{term:cefi|CeFi}} venue in the venue registry, instrument-type spot / {{term:perpetual|perp}} / dated future, execution mode market / limit / schedule — compatible, minimal schema sufficient.",
          "Any CeFi venue, instrument-type options, execution mode multi-leg structure — depends on venue. Multi-leg order capability is a venue-pack sub-dimension; some venues support, some do not. Confirmed at second call.",
          "Any {{term:defi|DeFi}} chain in UAC CHAIN_RPC_TEMPLATES, instrument-type spot (DEX), execution mode flash-loan or swap — compatible, standard schema plus DeFi-specific order constraints ({{term:slippage}} in bps).",
          "DeFi chain, instrument-type perps (on-chain) — depends on protocol; documented in the instrument-type pack per protocol.",
          "DeFi chain, instrument-type options — BLOCKED. No DeFi options protocol integrated today; this combination routes to a custom-premium block or is declined.",
          "DeFi chain, instrument-type dated futures — BLOCKED. No DeFi dated-future protocol integrated today.",
          "Polymarket or Kalshi, instrument-type prediction markets, execution mode limit / taker — compatible, standard schema with sports-style event-settled lifecycle field.",
          "Sports venues, instrument-type sports fixtures, execution mode pre-match or in-play — compatible, rich schema with event-lifecycle fields.",
        ],
        bodyAfter:
          "The full compatibility matrix, including blocker predicates, is the runtime contract Odum's instruction gateway enforces. A prospect whose planned flow hits a BLOCKED combination learns that at the fit-check, not three meetings in.",
      },
      {
        title: "Lifecycle semantics and idempotency",
        body:
          "Lifecycle behaviour at the client boundary (supersede / add / cancel, plus amend as a lifecycle-update event on the same instruction id) is distinct from venue-side behaviour. The client sends one semantic; Odum's execution layer translates to the venue protocol that produces the equivalent outcome — some venues support native amend, some require cancel-and-replace. Idempotency is enforced on the instruction identifier: re-sending the same instruction id with the same lifecycle semantic is a no-op from Odum's side; re-sending with supersede is a replace. This gives your upstream a safe retry model on network failures without duplicate execution risk.",
      },
      {
        title: "Signals-In versus Full Pipeline — side by side",
        body:
          "Signals-In and Full Pipeline are the two paths inside DART. The boundary is the research and promote layer. Signals-In clients send instructions in and use execution, reporting, and reconciliation. Full Pipeline clients additionally author strategies on Odum data through the research surface. Moving from Signals-In to Full Pipeline later is a formal commercial event, not a bolt-on — if research access is on your horizon, resolve to Full Pipeline now.",
        bullets: [
          "Signals-In — your upstream generates signals; Odum runs execution, reporting, reconciliation, risk, allocation. Research and promote surfaces are not included.",
          "Full Pipeline — Odum additionally runs the research surface on the same catalogue and promotes candidates through paper to live. Cross-strategy analytics included.",
          "Both paths operate on the same underlying components. The commercial path picks which surfaces you touch — the system itself is one.",
        ],
      },
      {
        title: "What Signals-In enables and what it does not",
        body:
          "Per the codex enablement map (sections (d) and (e) of instruction-schema-fit-and-package-boundaries.md), well-formed instructions against the schema enable: execution (algo selection, venue routing, fills), reconciliation (instruction to fills), position tracking, P&L attribution to your declared strategy_id, exposure analytics on your own flow, execution-quality and TCA on your own flow, and the reporting surface (positions, P&L, reconciliation, audit). Signals-In does NOT enable: backtest or research surface over historical data, the promotion pipeline (shadow to paper to live-tiny to allocated), live-vs-backtest P&L comparison that requires Odum-side backtest lineage, full P&L attribution back to your upstream signal-generation features, cross-strategy research analytics drawing on data beyond your own flow, or regime classification analytics. Those capabilities sit in block 6 (research / promote) which is excluded from Signals-In by design. The boundary is load-bearing: research bolted on at Signals-In pricing would be underpriced. Upgrading to Full Pipeline is a formal commercial event — a new quote, new blocks, new scope — not an incremental bolt-on.",
      },
      {
        title: "Scope, commitment, commercial posture",
        body:
          "Twelve-month minimum engagement. Scope is defined by venue packs, chain packs, and instrument-type packs — a typical Signals-In shape is three venues, two chains, two instrument types. Pricing is per block, mixable. Numbers live in the second call. The fit-check — whether your upstream produces the eight fields and what schema depth your flow warrants — happens before the demo, not during it.",
      },
      {
        title: "Related paths",
        body:
          "If you want access to Odum's research surface and promote pipeline on top of execution and reporting, see DART Full Pipeline at /briefings/dart-full. For the full DART framing across both paths, see /briefings/platform. The inverse direction — Odum-generated signals delivered to your execution infrastructure — is Odum Signals at /briefings/signals-out.",
      },
    ],
    keyMessages: [
      "Signals-In runs on a fixed, published instruction schema — eight fields, three depths (minimal / standard / rich). Your upstream either produces the fields or is adapted to. The fit-check happens before the demo.",
      "Direction is one-way — your signals, our execution. Two execution-account options: segregated sub-account carved out of Odum's existing venue accounts (fast onboarding, default) or your own venue / prime-broker account (if you already run one). Either way, Odum holds scoped execute+read API keys in Secret Manager — no withdrawal authority, ever, and no principal on Odum Research Ltd's books.",
      "Your strategic edge stays upstream. Regime logic, model internals, signal generation, portfolio construction, features, weights — none of it crosses into Odum's systems.",
      "Venue and instrument-type compatibility is spelled out — CeFi spot / perp / dated fully supported, Options depends on venue, DeFi spot supported, DeFi options and dated futures are BLOCKED today.",
      "Lifecycle semantics: supersede replaces, add sits alongside, cancel cancels open quantity. Amend is an update on the same instruction id. Idempotency on instruction id gives a safe retry model.",
      "Research and promote are not included. That is the block boundary to Full Pipeline. Upgrading is a formal commercial event.",
      "Scope is venue, chain, and instrument-type packs on the flow your instructions actually touch. Twelve-month minimum engagement.",
    ],
    nextCall:
      "The 45-minute second call walks the eight-field instruction schema against your upstream field by field, resolves any gaps, confirms the venue and instrument-type compatibility against your planned flow, picks the schema depth tier, and scopes the venue, chain, and instrument-type packs your engagement requires. If your upstream needs adaptation, the call surfaces exactly what — so you can scope the upstream work before committing.",
    cta: BOOK_SECOND_CALL,
  },
  {
    slug: "dart-full",
    title: "DART Full Pipeline",
    tldr:
      "Odum's research, promote, paper, and live pipeline on the same components Odum uses internally. You author strategies on Odum data, promote candidates through paper to live, and execute on the production stack.",
    frame:
      "{{term:dart|DART}} — Data Analytics, Research & Trading — Full Pipeline is the deeper path within DART for firms that want access to Odum's research surface, promotion pipeline, and execution layer as a single continuous operation. Research, paper, and live are phase views of one catalogue — not three separate systems. A live-allocated slot can be pulled back into research phase for a re-run over a new regime window; a research candidate promotes through paper to live on the same components.",
    sections: [
      {
        title: "The research surface — what a client sees when they sit down",
        body:
          "Research runs on Odum's historical data — tick data, on-chain events, reference instruments, corporate actions, venue metadata, features, and derived factors. You author strategies in the same runtime Odum's own researchers use, with the same data access, the same feature library, and the same backtest engine. The research surface is not a sandbox wrapper on top — it is the surface Odum uses internally, entitlement-filtered to your work. When you open the research tool, the left pane shows the strategy catalogue (your slots plus any shared reference slots), the centre pane shows the authoring environment for the currently-selected strategy slot, and the right pane shows the backtest results: {{term:pnl|P&L}} curve, {{term:drawdown}} profile, factor attribution, fill-quality proxies from the matching engine, and live-vs-backtest diff once the slot has been promoted beyond backtested. Same components, batch and live — the batch-equals-live principle means the backtest exercises the same position tracking, risk checks, and allocation services as live; the only seam that differs is the execution-fill source (matching engine vs real venue).",
      },
      {
        title: "Custody — segregated sub-account by default, your own venue optional",
        body:
          "Full Pipeline runs on the same custody mechanic as Signals-In. Two execution-account options: (1) default — a segregated sub-account carved out of Odum's existing venue accounts, held in your name at the exchange's native sub-account primitive, so you avoid the multi-week direct exchange onboarding; (2) opt-out — your own venue or prime-broker account if you prefer to hold the relationship yourself, in which case you issue Odum the same scoped execute+read API keys. In both cases Odum operates via keys held in Secret Manager and hot-reloaded into execution-service — no withdrawal authority, ever. Odum Research Ltd never holds principal. Sub-mandate partitioning works the same way — one engagement can carry N sub-mandates, each with its own reporting partition, its own research scope, paper allocation, and live capital.",
      },
      {
        title: "The 8-stage maturity ladder",
        body:
          "A strategy slot moves through an explicit {{term:maturity}} ladder. The ladder is the canonical artefact clients see alongside the catalogue — each slot carries its current stage, visible to you as a filter and a sort axis. Stages advance via automated watchdog policies (no hidden discretionary override), and ops intervention is limited to incident-response demotion.",
        bullets: [
          "CODE_NOT_WRITTEN — archetype placeholder, visible internally only.",
          "CODE_WRITTEN — code lives in strategy-service but not yet audited.",
          "CODE_AUDITED — code reviewed against archetype contract; the earliest stage external clients see.",
          "BACKTESTED — strategy has cleared a backtest run against a declared historical window; the earliest stage visible on DART-externally-viewable surfaces.",
          "PAPER_TRADING — promoted to paper mode on live data, no real fills.",
          "PAPER_TRADING_VALIDATED — cleared the 14-day paper validation window via the shadow-deployment policy; eligible for live-tiny.",
          "LIVE_TINY — allocated real capital at small scale to confirm live parity with paper.",
          "LIVE_ALLOCATED — promoted to full allocation; the strategy is now part of the live book.",
        ],
        bodyAfter:
          "The research surface lets you filter the catalogue by maturity stage, re-run a live-allocated slot over a new regime window in research phase, and submit promotion candidates through paper. Each stage transition emits a lifecycle event that appears in your audit trail.",
      },
      {
        title: "Promote — the pipeline into live",
        body:
          "Promotion is a defined pipeline, not a discretionary judgement call. Candidates move: backtested → paper candidate → paper-validated (after 14 days clean) → live-tiny (first non-zero allocation) → live-allocated (scaled to full allocation). The ladder is explicit — there is no hidden promotion step. Your promoted slots appear in the catalogue alongside Odum's own, entitlement-filtered to your view. The shadow-deployment policy governs the paper-validated gate; the first non-zero allocation directive from the portfolio-allocator triggers live-tiny → live-allocated on its own.",
      },
      {
        title: "Metered research — baseline / complex / full-matrix sweep",
        body:
          "Research access is metered on a three-band backtest model. A baseline backtest (single strategy, single venue, standard feature set, one regime window) sits at the low end of quantum consumption — suitable for daily iteration on an authored strategy. A complex backtest (multi-venue, extended feature set, multiple regime windows, scenario sweeps) consumes materially more quantum per run and is the common shape for promotion candidates. A full-matrix sweep (cross-archetype, cross-venue, cross-regime — the backtest of backtests) is the heaviest band and is reserved for exclusivity-tier clients and for Odum-internal strategy research. Bundled-credit packaging is the default commercial shape: a monthly quantum budget that resets, with overflow priced per unit above the budget. Per-counterparty rate limits apply on top — a hard cap on concurrent backtests and a soft cap on data-window breadth to prevent any one client from saturating the backtest engine. Specific quantum mechanics and budget tiers live in the second call under codex-private pricing. The intent is alignment: research usage scales with the commercial engagement rather than drifting outside scope.",
      },
      {
        title: "The strategy catalogue — one row per slot",
        body:
          "The catalogue shows one row per strategy slot, with the maturity tag (the 8-stage ladder above) orthogonal to a phase tag (research, paper, live) that selects which view of the slot you are looking at. Pre-backtested slots are not visible externally. Your promoted slots and Odum's own live slots share the catalogue — entitlement filters which rows you see and which rows you can re-run in research.",
      },
      {
        title: "Strategy family catalogue — teaser of the combinatoric universe",
        body:
          "Odum's strategy catalogue is organised as 18 archetypes across 4-5 categories ({{term:cefi|CeFi}}, {{term:defi|DeFi}}, {{term:tradfi|TradFi}}, Sports, Prediction) applied to 8 instrument-type cells (spot, perp, dated future, option, prediction market, sports fixture, on-chain spot, flash-loan swap). Not every combination is supported — some are BLOCKED by structural constraints in the venue-and-instrument coverage matrix, some are INVESTMENT_MANAGEMENT_RESERVED (operated for Odum's own {{term:im|IM}} mandates and not offered to SaaS clients), some are CLIENT_EXCLUSIVE (negotiated exclusivity on a specific archetype-by-category-by-instrument cell). Full pipeline clients see the subset that is PUBLIC plus any CLIENT_EXCLUSIVE cells carved out for their mandate. The full catalogue with cell-level coverage and lock state lives behind light-auth at /briefings/dart-full.",
      },
      {
        title: "Exclusivity and IP-power — four-tier anchor",
        body:
          "Full Pipeline engagements can include strategy-level exclusivity on specific archetype or instrument-type combinations — a commercial tier uplift rather than a default. Per codex/14-playbooks/commercial-model/exclusivity-and-noncompete.md and the lock matrix in codex/14-playbooks/shared-core/strategy-allocation-lock-matrix.md, the exclusivity grades into four tiers:",
        bullets: [
          "Commodity — shared PUBLIC cells. No exclusivity carved; the cell is available to any Full Pipeline client that wants to operate it. Standard pricing, no tier uplift.",
          "Targeted — shared PUBLIC cells, but one client's authored strategy variant runs under a named strategy_id that no other client re-authors. The underlying archetype remains open; the specific variant is scoped to the client. Modest tier uplift reflecting the authoring effort.",
          "Carved-out — CLIENT_EXCLUSIVE cell reserved for one mandate for the duration of the engagement. The archetype-by-category-by-instrument combination is locked to the client via the lock matrix; other clients cannot operate it. Material tier uplift reflecting the opportunity cost of removing the cell from the wider catalogue.",
          "Uniquely-differentiated — CLIENT_EXCLUSIVE plus a bespoke archetype extension or a custom combination that the catalogue would not otherwise carry. The strategy is authored, operated, and reported exclusively for the mandate, often with a block-13 custom-premium component covering the novel build. Highest tier; walked through against your intended research focus at the second call.",
        ],
        bodyAfter:
          "The tier is not retroactive — a client can ascend (commodity → targeted → carved-out) by re-scoping the mandate at renewal. Releasing a carved-out cell back to PUBLIC is a formal commercial event and ends the exclusivity premium from that release date.",
      },
      {
        title: "Commitment and block scope",
        body:
          "Twelve-month minimum engagement. Scope is defined by venue packs, chain packs, and instrument-type packs, plus research breadth (the set of archetype and category cells you can interrogate in research). Cross-strategy research analytics are included. Pricing composes per block and per exclusivity tier. Numbers live in the second call.",
      },
      {
        title: "Related paths",
        body:
          "If your upstream already produces signals and you only want Odum's execution and reporting layer, the lighter path is DART Signals-In at /briefings/dart-signals-in — no research, no promote, just execution on a fixed instruction schema. If you want Odum to run capital for you under Odum's FCA permissions rather than operate strategies under your own firm, see Investment Management at /briefings/investment-management.",
      },
    ],
    keyMessages: [
      "Full Pipeline is research, promote, paper, and live on the same components Odum uses internally. Not a wrapper, not a sandbox — the operational surface, entitlement-filtered.",
      "Research, paper, and live are phase views of one catalogue. A live slot can return to research; a research candidate promotes through a defined 8-stage ladder.",
      "The 8-stage maturity ladder (code-not-written → code-written → code-audited → backtested → paper → paper-validated → live-tiny → live-allocated) is automated by watchdog policies. No hidden discretionary override.",
      "Research access is metered — monthly quantum budget with overflow pricing, per-counterparty rate limits, aligned to the commercial engagement.",
      "The strategy catalogue spans 18 archetypes x 4-5 categories x 8 instrument-types. Cell-level lock state (PUBLIC / INVESTMENT_MANAGEMENT_RESERVED / CLIENT_EXCLUSIVE / RETIRED) governs what you see.",
      "Exclusivity is a commercial tier uplift on specific archetype or instrument combinations, not the default posture.",
      "Twelve-month minimum engagement. Scope composes venue, chain, instrument-type, and research breadth per block.",
    ],
    nextCall:
      "The 45-minute second call walks the research surface against one of your strategy candidates, traces a promotion path through the 8-stage maturity ladder to live on that candidate, walks the cell-level lock state against your intended research focus, and scopes the research breadth and exclusivity tier your mandate warrants.",
    cta: BOOK_SECOND_CALL,
  },
  {
    slug: "signals-out",
    title: "Odum Signals — our signals, your execution",
    tldr:
      "Odum runs strategies internally and leases the signals to counterparties who execute on their own infrastructure. Odum does not see counterparty fills, positions, or {{term:venue|venues}} — the delivery boundary is the signal itself.",
    frame:
      "Odum Signals is the output path. Odum runs strategies internally; counterparties lease the signals and execute on their own infrastructure. Direction is one-way: Odum emits, the counterparty executes on venues the counterparty controls entirely. Odum does not see counterparty fills, positions, or execution venues — no capital flows, no venue API keys leave the counterparty's side. The delivery boundary is the signal itself. This sits outside the {{term:dart|DART}} 2x3 commercial matrix as a distinct fourth path, shaped like a research subscription but priced for direct position-taking.",
    sections: [
      {
        title: "Delivery mechanics",
        body:
          "Signals emit from Odum's strategy-service through the signal-broadcast surface. The delivery design is locked end-to-end (D1-D10) and the specific engagement details — transport choice, payload depth, rate limits, retry budgets — are shaped with you during the standard three-month onboarding window so the integration lands with your engagement. Primary transport is webhook HTTP POST to a counterparty endpoint, authenticated per counterparty with an API key held in Odum's Secret Manager plus an HMAC signature over the payload. A REST pull endpoint sits alongside the webhook for counterparty-initiated reconciliation and backfill — the hybrid shape gives counterparties who prefer pull semantics (for audit-first deployments or endpoints behind restrictive networks) a symmetric path to the same emission stream. Delivery is at-least-once with an idempotency key on every emission; the counterparty's handler must be idempotent on the key, and Odum retries on transport failure until acknowledgement or the retry budget is exhausted. Per-counterparty-per-strategy rate limits apply on top so a noisy strategy never starves quiet ones on the same counterparty contract.",
      },
      {
        title: "Signal payload — full D8 schema",
        body:
          "The payload schema is the D8 locked shape from the signal-broadcast plan — negotiated depth (minimal / standard / rich), mirroring rule 10's block 5 schema-depth dimension. Every emission carries the following fields regardless of depth, then extends into the chosen depth tier:",
        bullets: [
          "strategy_id — the Odum strategy slot label the signal originated from. Stable across emissions, ties the payload back to your licensed slot set.",
          "slot_label — the canonical slot identifier (e.g. bitcoin-spot-stat-arb-pairs-fixed-v1) per the architecture-v2 catalogue.",
          "emission_timestamp — ISO-8601 UTC timestamp of the emission at Odum's strategy-service.",
          "signal_payload — the directional content. Minimal depth: target direction (long / short / flat / rebalance-to-target) and size expressed in a negotiated unit. Standard depth: plus target exposure, expected holding period, confidence or conviction metadata, timeframe and decay (when actionable, how long live). Rich depth: plus bespoke fields negotiated per licence (custom metadata, scoped factor tags, event triggers).",
          "idempotency_key — stable per emission, used for at-least-once retry de-duplication on the counterparty side.",
          "delivery_attempt — integer counter, 1 on first delivery and incremented on each retry.",
          "HMAC signature — HMAC-SHA256 over the serialised payload using the per-counterparty HMAC secret. The counterparty verifies the signature before acting.",
        ],
        bodyAfter:
          "What the payload does NOT carry: Odum's underlying features, model internals, training data references, raw data feeds, or any data the counterparty could use to reverse the signal into its source. The counterparty receives the enriched output and an audit receipt, not the reasoning behind it. This is the data-licensing boundary — no raw-data resale, no feature export.",
      },
      {
        title: "Delivery guarantees and failure isolation",
        body:
          "At-least-once delivery with idempotency key (D5): Odum guarantees the signal lands at the counterparty endpoint or the delivery attempt is logged as failed and retried under the retry budget. Exactly-once is not offered — it is over-engineered for signal delivery and the idempotency key model is equivalent from the counterparty's perspective. Per-counterparty circuit breaker (D10): a failing counterparty endpoint never blocks strategy-service's internal emission — the emission completes, the delivery layer absorbs the failure, retries under budget, and logs the final state per the shard-level-failure-isolation rule. Counterparty endpoint downtime does not degrade Odum's internal strategy operation in any way.",
      },
      {
        title: "Light observability UI — scoped and ready to shape at the second call",
        body:
          "Initial delivery is the webhook plus signed-JSON delivery log; the counterparty-side observability UI is scoped and ready for discussion at the second call, with a tight component set sized to what a counterparty actually needs — no catalogue, no execution surface, no research, no reporting beyond signal-delivery audit. Onboarding lead time (typically three months from the first call to live delivery) covers building the UI alongside the integration so the specific component set lands with your engagement. This is the data-licensing boundary applied to the UI surface.",
        bullets: [
          "SignalHistoryTable — last N emissions scoped to your entitled slots; filter by slot, date, status.",
          "BacktestComparisonPanel — Odum-held backtest performance numbers against the live signal aggregate; read-only context for the strategies you licence.",
          "DeliveryHealthPanel — webhook success rate, retry counts, average latency, last-delivery timestamp per slot.",
          "PnlAttributionPanel — OPTIONAL, only renders if the counterparty reports P&L back through the reconciliation endpoint. Lets you see alignment between Odum's signal intent and your realised fills without Odum seeing your venues.",
        ],
      },
      {
        title: "Metering and audit",
        body:
          "Every emission is logged with strategy_id, slot_label, emission_timestamp, idempotency_key, counterparty_id, delivery_attempt, and final delivery state (D6 emit and ack events, both logged). Billing reads from whichever the commercial contract specifies — per-emission, per-acknowledged-emission, per-month-usage-summary, or a hybrid with floor licence plus per-signal component plus optional counterparty-P&L share. Audit rights are symmetric: the counterparty sees their delivery log, Odum sees the same log, both sides have non-repudiation on every emission via the HMAC signature.",
      },
      {
        title: "Commercial shape — hybrid by default",
        body:
          "The standard commercial structure is Option 4 from the signal-leasing SSOT — a hybrid of a floor monthly licence, a per-signal component on top, and an optional share on the counterparty's signal-attributable P&L with audit rights. The floor covers the operational cost of the delivery channel and metering. The per-signal component scales revenue with counterparty usage. The optional P&L share aligns upside when the counterparty wants it and is always elective, with symmetric audit rights on both sides. Two alternatives remain available where the hybrid is a poor fit: Option 1 (flat monthly licence per counterparty × signal-scope, predictable revenue but capped upside) and Option 2 (pure per-signal metering, fully usage-linked but clunky for low-frequency strategies). Option 3 (pure revenue share on counterparty P&L) is not offered standalone — it is only available as the P&L-share leg of Option 4, because standalone it lacks a revenue floor to cover delivery costs. Numbers live in the second call under codex-private pricing.",
      },
      {
        title: "Which signals are licensable",
        body:
          "Only signals from strategies not reserved for Odum's own investment-management mandates are licensable — licensing a strategy Odum runs for its {{term:im|IM}} book would effectively compete against ourselves. Licensability is cell-level: a given archetype-by-category-by-instrument cell carries a lock state (PUBLIC, INVESTMENT_MANAGEMENT_RESERVED, CLIENT_EXCLUSIVE, RETIRED). Counterparty entitlements are governed by a per-counterparty allowlist of slot labels held in UAC's signal_broadcast registry (D4 locked). Default posture is narrow — one or two signal families per counterparty at launch, expanding only where explicit commercial approval is granted. Bundled multi-family and full-catalogue scopes are available where the lock matrix allows.",
      },
      {
        title: "Commitment and onboarding",
        body:
          "Twelve-month minimum engagement. Onboarding is a one-time webhook endpoint setup, authentication handshake (API key issuance plus HMAC secret provisioning into your Secret Manager on your side and Odum's), and test-signal flow against your endpoint. Custom delivery channels (Pub/Sub subscription, mTLS REST) are available as bespoke uplifts. Standard webhook and signed-JSON delivery come included in the licence.",
      },
      {
        title: "Related paths",
        body:
          "For the inverse direction — your signals delivered to Odum's execution infrastructure — see DART Signals-In at /briefings/dart-signals-in. For the full DART framing (both directions plus the full pipeline), see /briefings/platform.",
      },
    ],
    keyMessages: [
      "Odum Signals leases Odum-generated strategy signals to counterparties who execute on their own infrastructure. Odum does not see counterparty fills, venues, or positions — no capital flows, no venue API keys leave your side.",
      "Delivery is hybrid webhook HTTP POST (primary) plus REST pull (reconciliation fallback), authenticated per counterparty with API key plus HMAC signature on every payload. At-least-once delivery with idempotency key.",
      "Payload carries strategy_id, slot_label, emission_timestamp, signal_payload (minimal / standard / rich depth), idempotency_key, delivery_attempt, HMAC signature. No raw data, no model internals, no features — the output, not the reasoning.",
      "Per-counterparty-per-strategy rate limits and per-counterparty circuit breaker. Counterparty endpoint downtime never blocks Odum's internal strategy operation.",
      "Default commercial shape is hybrid — floor monthly licence plus per-signal component plus optional counterparty-P&L share with audit rights. Flat and pure-per-signal alternatives available.",
      "Only signals from strategies not reserved for Odum's own IM mandates are licensable. Per-counterparty allowlist of slot labels. Scope starts narrow and expands with explicit commercial approval.",
      "Initial delivery is the webhook plus signed-JSON delivery log. The light observability UI (SignalHistoryTable, BacktestComparisonPanel, DeliveryHealthPanel, optional PnlAttributionPanel) is scoped and shaped with you during the three-month onboarding window.",
    ],
    nextCall:
      "The 45-minute second call walks the signal families licensable against your intended flow, the payload schema depth that fits your execution infrastructure, the delivery cadence and latency expectation per strategy, authentication handshake and HMAC provisioning, and the hybrid commercial structure against your preferred balance of floor and usage-linked revenue.",
    cta: BOOK_SECOND_CALL,
  },
] as const;
