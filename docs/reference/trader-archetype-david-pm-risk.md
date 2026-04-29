# Trader Archetype — David Reyes (Portfolio Manager / Head of Risk)

A reference profile of the senior PM / Head of Risk who sits **above** the trading desk — overseeing all traders, all strategies, all venues, and the firm's aggregate exposure. Used as a yardstick for what an ideal supervisory terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).
For shared surfaces (charting, blotters, risk, reports, etc.), see [common-tools.md](common-tools.md).
For an index of David's unique surfaces, see [unique-tools.md](unique-tools.md).
For the trader archetypes David supervises, see the other `trader-archetype-*.md` files.

---

## Who David Is

**Name:** David Reyes
**Role:** Senior Portfolio Manager / Head of Risk
**Firm:** Top-5 global trading firm
**Book size:** Aggregate firm crypto/digital-assets book — $5B – $15B notional, with $1B – $3B of risk capital at any moment.
**Style:** Does not place trades himself (rare exceptions). Allocates capital, sets risk limits, monitors the desk, makes go/no-go decisions, faces clients and the risk committee.
**Reports to:** CIO, risk committee, board.
**People who report to him:** Marcus, Julius, Mira, Sasha, Quinn (the trader archetypes), plus operations and compliance leads.

### How he thinks differently

David's job is **not** to find alpha. It's to:

- **Allocate capital** across traders and strategies based on edge, capacity, and correlation.
- **Set and enforce risk limits** at trader, strategy, and firm level.
- **Monitor the aggregate book** for hidden concentrations, correlations, and tail exposures.
- **Make intervention decisions** — pull risk, increase risk, kill a strategy, fire a trader's parameters.
- **Face stakeholders** — clients ask why returns are what they are; the risk committee asks "are we safe?"; the regulator asks "show me your records."
- **Plan capacity** — the firm has limits (capital, leverage, counterparty); David allocates them.

His edge is **judgment under aggregation**. Traders see their own books. He sees the whole.

### His cognitive load

David must hold in his head:

- Each trader's recent performance and behavioral state ("is Marcus tilted? is Sasha overconfident on this skew trade?").
- Each strategy's regime fit.
- The firm's aggregate exposure — net delta, net vega, counterparty concentration.
- Capital efficiency — is risk capital deployed where it earns the most Sharpe?
- Client-facing narratives — what story explains last week's PnL?

The terminal must **compress** this. He's pattern-matching across an enormous surface.

---

## Physical Setup

**4 monitors** — fewer than traders, because his job is overview, not micro-action.

| Position     | Surface                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------- |
| Top-left     | **Firm-wide aggregate book** — exposure, PnL, risk by underlying / venue / strategy / trader |
| Top-right    | **Risk limits dashboard** — every trader / strategy vs limit, breaches highlighted           |
| Bottom-left  | **Trader & strategy health board** — performance, behavior, recent interventions             |
| Bottom-right | **Capital allocation, capacity, correlation matrix** — meta-view                             |

Plus a private office display for client/risk-committee meetings (large screen, presentation-ready dashboards).

He moves between his desk (live monitoring) and his office (review, planning, stakeholder calls) throughout the day.

---

## Phase 1: Decide

For David, "decide" is mostly **capital allocation and limit-setting**, plus go/no-go calls on strategy promotions and client capital changes. He rarely consults a chart for trade timing; charts are context for narrative.

### Shared surfaces (firm-aggregated)

- See [Charting](common-tools.md#1-multi-timeframe-charting). **David-specific characteristics:** glanced for narrative, not entry timing; favours weekly/daily over intraday.
- See [Calendar](common-tools.md#12-catalyst--event-calendar). **David-specific:** filters to firm-material catalysts (FOMC, ETF flows, protocol upgrades) and to events that touch multiple desks.
- See [News & Research Feed](common-tools.md#13-news--research-feed). **David-specific:** macro and counterparty/venue/protocol streams are the priority; trader-shared notes surface as desk pulse.
- See [Heatmap of Own Book](common-tools.md#16-heatmap-of-own-book). **David-specific:** firm heatmap aggregated across all traders and strategies — used to spot hidden cross-desk concentrations.

### Capital allocation context (David-unique)

- **Firm-wide capital** — total, deployed, free, in-flight (bridges, settlements).
- **Per-trader / per-strategy / per-venue capital** — allocated, used, free.
- **Capital efficiency** — Sharpe per $ allocated, by trader and strategy.
- **Per-strategy expected Sharpe and capacity** (research vs. live), with diminishing-returns curves.
- **Marginal allocation** — incremental Sharpe of adding $X to strategy A.

### Risk-budget and correlation context (David-unique)

- **Total risk budget** (VaR or stress-loss target) and **risk consumed** by each trader / strategy.
- **Risk-adjusted return** and top contributors to firm VaR.
- **Correlation matrix** — trader×trader, strategy×strategy, asset×asset at firm level, with **hidden-correlation flags** for books that should be uncorrelated but are drifting.

### Macro / regime and client capital (David-unique)

- **Regime indicators** (vol / liquidity / macro) — used to set **firm posture**, with regime-fit annotations per strategy.
- **Client capital** (for firms with external capital) — AUM by client / strategy / share class; net flows today / WTD / MTD; subscription / redemption pipeline; high-water marks; fee accrual.

**Layout principle for Decide:** capital allocation and correlation matrix are most-glanced. Regime and macro are peripheral peripherals.

---

## Phase 2: Enter

David rarely enters trades. His "enter" actions are **capital allocation changes, limit changes, strategy promotion gates, authorizations, and interventions** — every one signed and audited.

### Shared surfaces (firm-scoped)

- See [Order Ticket](common-tools.md#2-order-entry-ticket-framework), [Pre-Trade Preview](common-tools.md#3-pre-trade-risk-preview), [Algos](common-tools.md#4-execution-algos-library), [SOR](common-tools.md#5-smart-order-router--multi-venue-aggregation), [Hotkeys](common-tools.md#6-hotkey-system). **David-specific:** rarely used directly; available for the rare manual override or unwind. Hotkeys are disabled by default — David's actions are deliberate, not muscle-memory.

### Capital allocation panel (David-unique)

Per trader / strategy:

- **Current allocation** with proposed change.
- **Effective immediately or scheduled** (e.g. tomorrow at session open).
- **Reason field** — mandatory, audited.
- **Approval workflow** — large changes require risk-committee co-sign.

### Risk-limit changes (David-unique)

Every limit, at every level — firm / trader / strategy / venue / counterparty — is editable from the same hierarchy view used in Hold (see Phase 3). Edits carry mandatory reason, timestamp, signature, and (for material thresholds) co-sign.

### Strategy promotion gate (David-unique)

When Quinn pushes a strategy from pilot → live, David is the final gate:

- Full promotion checklist + Quinn's notes.
- **Correlation impact** on the existing fleet.
- **Capacity and capital impact.**
- Approve / reject / send back with notes — signed and audited.

### Manual intervention ticket (David-unique)

Used to act on a trader's book — rare but real:

- **Pull risk** — instruct trader to reduce, with rationale.
- **Force flatten** — emergency override; cancels orders and flattens.
- **Pause trader / strategy** — disable entry capability for a window.
- **Change counterparty access** — revoke ability to trade a venue or protocol.

All four require a written reason and produce an immutable audit record.

### Client-facing actions (David-unique)

- Approve subscription / redemption above threshold.
- Reallocate client capital between strategies.
- Trigger client report off-schedule.
- Publish narrative — daily/weekly note attached to performance.

**Layout principle for Enter:** every action is friction-y, reasoned, and audited. David doesn't make impulsive decisions; the UI reinforces this.

---

## Phase 3: Hold / Manage — overseeing the firm

This is the bulk of David's day during market hours. The terminal is dense aggregation with drill-down: he reads dashboards, not order books.

### Shared surfaces (firm-aggregated)

- See [Positions](common-tools.md#7-positions-blotter), [Working Orders](common-tools.md#8-working-orders-blotter). **David-specific:** rolled up across all traders/strategies/venues, with drill-down to a single trader's blotter on click. Per-trader and per-strategy group-bys are first-class.
- See [Live PnL](common-tools.md#9-live-pnl-panel). **David-specific:** firm PnL with breakdown by trader / strategy / underlying / venue; intraday and session-to-date in one view.
- See [Risk Panel](common-tools.md#10-risk-panel-multi-axis). **David-specific:** firm-aggregated greeks (delta, gamma, vega, theta), net VaR (parametric / historical / Monte Carlo), gross exposure vs. leverage cap, single-name and counterparty concentration, margin utilization across venues, in-flight capital (bridges, settlements, deposits/withdrawals pending), stablecoin & cash dry powder.
- See [Stress Panel](common-tools.md#11-stress--scenario-panel). **David-specific:** firm-level stress library including BTC -20% / ETH -25% / alts -40% combo, all-IV +20v vol shock, USDC depeg to $0.95, "Binance halts withdrawals" venue shock, SPX -5% + BTC -15% cross-asset shock, plus custom scenarios. Each scenario shows firm loss + breakdown by trader / strategy / underlying.
- See [Alerts Engine](common-tools.md#14-alerts-engine). **David-specific:** firm aggregate alerts console — limit breaches at any level, concentration warnings, drawdown triggers, behavioral drift flags, fleet anomalies of high severity, external events (venue degradation, protocol exploits, depegs, oracle failures), operational (settlement failures, withdrawal delays, audit-trail gaps).
- See [Comms Panel](common-tools.md#17-communications-panel). **David-specific:** trader chat integrated; risk-committee notification rail with pre-formatted updates; desk-wide announcement broadcast.
- See [Latency / Connectivity](common-tools.md#18-latency--connectivity--infra-panel). **David-specific:** scoped to **per-venue and per-protocol health** rather than micro-latency — counterparty rating, recent incidents, bridge in-flight value, audit status of DeFi protocols, governance events.

### Per-trader tile board (David-unique)

For each trader (Marcus, Julius, Mira, Sasha, Quinn-fleet):

- PnL today / WTD / MTD / YTD in $ and Sharpe terms.
- Capital used / allocated; risk consumed / allocated.
- Behavioral health badge (see below).
- Recent interventions — was this trader recently warned or capped?
- Notes & flags.

Click a tile → drill into that trader's book.

### Behavioral health monitor (David-unique)

David watches for **trader behavioral drift**:

- **Overtrading** — sudden trade-frequency spike.
- **Position-sizing drift** — bigger sizes than recent average.
- **Hold-time drift** — shorter (revenge trading) or longer (anchored to losers).
- **Loss-cutting discipline** — % of trades hitting pre-defined stop.
- **Strategy-tag distribution shift** — drifting from mandate.

Each indicator carries history; sustained drift triggers an interventions conversation.

### Strategy fleet view (David-unique, Quinn-shared)

- Aggregate fleet PnL vs expectation.
- Strategy stages — counts in research, paper, pilot, live, retired.
- Strategy-level alerts surfaced when severe.

### Risk-limit dashboard (David-unique)

Every limit, every level — firm / trader / strategy / venue / counterparty — with current value and headroom:

- **80%+ utilization** highlighted amber, **95%+** red.
- Recent breaches with resolution status.
- Limit changes pending approval.

### Liquidity / unwind panel (David-unique)

- **Estimated unwind cost** to fully exit in 1 day, 3 days, 1 week.
- **Liquidity by venue** — which positions are illiquid.
- **Concentration vs venue daily volume.**

### Kill switches (David-unique scope on top of [common-tools.md#19-kill-switches-granular](common-tools.md#19-kill-switches-granular))

- Per-trader, per-strategy, per-venue kills (granular).
- **Firm-wide kill** — multi-key (David + CIO + risk officer) for catastrophic events.

**Layout principle for Hold:** dense aggregation, with drill-down. Color and badges drive attention; he doesn't read numbers that look fine.

---

## Phase 4: Learn

David's "learn" is institutional — reviews, post-mortems, planning, reporting. Most analytical work happens off-hours or during quiet periods.

### Shared surfaces (firm-aggregated)

- See [Replay](common-tools.md#20-replay-tool). **David-specific:** firm-wide replay — pick a date / time window and reconstruct the entire desk's state, including every trader's book and every alert that fired. Used for post-incident review (drawdown days, exploits, venue outages).
- See [Trade History](common-tools.md#21-trade-history--blotter-historical), [Attribution](common-tools.md#22-pnl-attribution-multi-axis), [Performance](common-tools.md#23-performance-metrics), [Equity Curve](common-tools.md#24-equity-curve), [TCA](common-tools.md#25-execution-quality--tca-transaction-cost-analysis). **David-specific:** firm-level rollups — PnL attribution by trader / strategy / underlying / regime; firm Sharpe / Sortino / Calmar; drawdown analysis; capital efficiency by trader; risk consumed vs return generated. Per-trader and per-strategy retrospectives are drill-downs from the firm view.
- See [Behavioral Analytics](common-tools.md#26-behavioral-analytics). **David-specific:** read across the trader fleet, not for self-review; feeds the per-trader retrospective and compensation/mandate conversations.
- See [Reports](common-tools.md#27-reports). **David-specific:** client letters (per-client, gross/net of fees, benchmark, narrative-attached); regulator/auditor pulls; **risk-committee deck auto-prepared** weekly/monthly with firm performance, risk consumed, breaches, concentration evolution, stress scenarios, lifecycle changes, forward-looking risks.
- See [Compliance & Audit Trail](common-tools.md#28-compliance--audit-trail). **David-specific:** end-to-end audit of every authorization he's signed — capital changes, limit changes, promotions, overrides, interventions — alongside the standard trade audit trail. Retention guarantees.
- See [Strategy Tagging](common-tools.md#29-strategy-tagging-framework). **David-specific:** firm-level taxonomy used to roll up attribution and to track mandate adherence across traders.
- See [Layout](common-tools.md#30-customizable-layout--workspace). **David-specific:** desk workspace + private-office presentation workspace; the office workspace is presentation-ready (large fonts, narrative panels) for client and committee meetings.

### David-unique reviews

- **Capital efficiency** — Sharpe per $ allocated over time; reallocation history with outcomes; counterfactuals (what if we'd allocated differently?).
- **Risk retrospectives** — limit breaches and root cause; stress scenarios that materialized vs. pre-computed losses; counterparty and operational incidents with lessons and remediation.

**Layout principle for Learn:** workspace + drilldowns + report generation, mostly off-hours.

---

## What Ties David's Terminal Together

1. **Aggregation is the product.** Every number is rolled up across traders, strategies, venues, underlyings — but always drillable to the source.
2. **Limits are first-class.** Every position is contextualized against a limit, every breach is auditable.
3. **Behavioral telemetry on traders.** Not just performance — patterns of behavior that predict future performance and risk.
4. **Stress scenarios are precomputed.** "What if X happens?" answered in seconds, not hours.
5. **Counterparty / venue / protocol exposure is always visible.** Concentration kills firms; he sees it before it does.
6. **Audit trails are non-negotiable.** Every change he makes is timestamped, reasoned, signed.
7. **Communications are integrated.** Pinging traders, notifying committee, broadcasting to desk — all from the terminal.
8. **Reporting is automated.** Client letters, regulator reports, committee decks generated from the same data plane that runs the desk.
9. **Replay at the firm level.** Post-incident review requires reconstructing the entire desk's state at a moment.
10. **Kill switches are layered and protected.** Granular by scope (trader / strategy / venue / firm), strongly authenticated for the largest scopes.

---

## How to Use This Document

When evaluating any supervisory / risk terminal (including our own), walk through David's four phases and ask:

- Is firm-wide exposure (delta, vega, counterparty, leverage) visible at a glance?
- Are limits first-class objects with drill-down and audit?
- Can he allocate capital, change limits, promote strategies, with full audit trail?
- Are behavioral indicators on traders surfaced, not just performance numbers?
- Are stress scenarios precomputed and updated continuously?
- Are reports (client / risk committee / regulator) generated from the same data the desk runs on?
- Can the firm's state be replayed at a historical moment for post-incident analysis?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.

# Automated Mode

This appendix describes David's terminal in the world where every trader David supervises (Marcus, Julius, Mira, Sasha, Henry, Ingrid, Yuki, Theo, Naomi, Diego, Aria, Rafael, Quinn) has an automated cousin running 50–500 strategy instances each, where Quinn runs cross-archetype firm-systematic strategies on top, and where the firm's aggregate footprint has gone from a few hundred manual positions to tens of thousands of automated ones. David's job didn't get easier; the surface area he supervises grew by two orders of magnitude. The terminal compensates.

For the underlying automation concepts, see [automation-foundation.md](automation-foundation.md). For the manual supervisory profile this extends, see the sections above. For the per-trader appendices David's automated cousin sits above, see the other `trader-archetype-*.md` files.

**Reading note.** Examples below — strategy class catalogs, dataset names, feature names, dashboard column lists, scenario libraries — are **illustrative**. The actual platform's catalogs, taxonomies, and surfaces will differ. Use these for shape and depth; expect substitution at implementation time.

David's appendix has a **different shape** from a trader appendix. He doesn't have an edge that becomes a fleet, and he doesn't compose strategies. Most sections are rewrites: section 1 becomes "what supervisory work becomes," section 8 becomes risk-limit hierarchy composition, section 9 becomes strategy-class sanctioning, section 10 expands into firm-level cross-archetype capital allocation, section 11 becomes firm-wide fleet supervision, section 12 becomes firm-level intervention, section 13 becomes firm-level post-trade. Manual trading (12.3) and strategy-state inspection (11.6) remain — David rarely trades, but keeps the override; he doesn't run strategies, but inspects any strategy in any trader's fleet.

---

## 1. What David's Supervisory Work Becomes

In manual mode, David supervised a desk of about a dozen traders, each running a few dozen positions. He could read the desk in his head: who was tilted, who was overconcentrated, who was running cold. The aggregation panel was real but human-scale; behavioral tells came from walking past desks; correlations between books were countable.

In automated mode, the desk runs **13 traders × 50–500 automated strategies each + a discretionary book per trader + Quinn's firm-systematic overlay**. That's 1,000–6,500 strategy instances continuously trading across 8–15 venues, plus discretionary positions, plus firm-systematic factor / stat-arb books on top. The aggregate state has gone from "roughly knowable" to "computationally tractable only." David's supervisory work doesn't shrink — it transforms.

Below are the workstreams that replace what was previously a single integrated supervisory role.

### Multi-Fleet Aggregation

The product David consumes most days is **firm aggregate state, decomposed**. Net firm delta, net vega, net theta, net carry, net beta-to-BTC, net beta-to-rates, net beta-to-DXY — every greek and every factor exposure rolled across every trader's automated fleet, plus discretionary book, plus Quinn's overlay. Aggregation is **always drillable to a single strategy in a single trader's fleet**. The platform precomputes the rollups continuously; David's foveal pane is the aggregate; the drill-down pane fills on click.

This is a coverage shift: previously David could ask Marcus "what's your net delta?" and get an answer. Now Marcus's net delta is the sum of ~200 strategy contributions plus discretionary; David doesn't ask Marcus, he reads the system. Marcus reads the same system for his own consistency.

### Cross-Archetype Risk Decomposition

Aggregation is necessary but not sufficient. David also needs to **decompose** firm risk along axes that cut across the trader-organizational structure. Examples:

- **Factor-tilt decomposition** — how much of firm PnL today was momentum-driven? value-driven? carry-driven? short-vol-driven? funding-harvest-driven? Across all archetypes simultaneously.
- **Asset-class decomposition** — equity / rates / FX / credit / commodity / digital-asset / event-market exposure rolled up regardless of which trader generated it.
- **Liquidity-tier decomposition** — how much firm capital is in tier-1-liquid instruments (top quartile of market depth) vs tier-2 (mid-quartile) vs tier-3 (bottom quartile). Liquidity tiers shift with regime; the decomposition tracks them.
- **Counterparty / venue / protocol decomposition** — exposure to each venue, prime broker, custodian, DeFi protocol, oracle. Concentration that traders don't see because they each individually trade their own venue mix.
- **Time-to-unwind decomposition** — what fraction of firm risk can be flattened in 1 day vs 1 week vs 1 month, accounting for venue depth and current positions.

Each decomposition is a precomputed view. David checks the ones relevant to current regime and recent moves; the platform highlights any that have shifted materially overnight.

### Model-Risk Governance

Automated mode means **models** — hundreds of trained models powering thousands of strategy instances across the firm. Model-risk governance is now a first-class workstream:

- **Model registry oversight** — David reviews newly registered models in his weekly committee-prep cadence (with Quinn). He doesn't approve every model individually (volume forbids), but he sees the firm-wide registry: count by archetype, count by stage (research / paper / pilot / live / monitor / retired), count by recent retraining, models flagged for drift.
- **Model-version policy** — what's the firm's posture on model staleness? On deployed models without recent re-validation? On models whose training data ended before a regime shift? David sets policy; the registry enforces.
- **Cross-archetype model overlap** — when two traders' models share inputs or methodologies, their outputs correlate even if the strategies look different. The platform surfaces this; David flags concentrations.
- **Model-failure incident review** — when a deployed model degrades (drift, regime miss, silent break), there's a review. David doesn't chair every review but sees the queue and reads the post-mortems.

This is **not** an alpha-discovery role; it's a governance role. Where Quinn provides quant leadership across the model landscape, David provides risk leadership. They coordinate.

### Kill-Switch Policy

Kill switches existed in manual mode as the emergency lever. In automated mode, they exist at multiple scopes (per-strategy, per-trader, per-archetype, per-venue, per-asset-class, firm-wide), each with its own authorization model and its own pre-defined trigger criteria. David's work includes:

- Defining the pre-authorized auto-kill triggers (e.g. "automatic kill of all DeFi strategies if any major bridge halts").
- Maintaining the multi-key authorization roster (who's a co-signer, who's backup, when keys rotate).
- Conducting kill-switch drills — quarterly tabletop exercises plus periodic real-time validations on staging.
- Reviewing every kill-switch invocation post-event — was it the right call? was it timely? what triggered it? did anything fail to flatten?

### Behavioral Monitoring at Scale

Manual-mode behavioral monitoring was reading the desk: noticing Marcus's voice change during a drawdown, seeing Sasha walk in late three days running. Automated mode preserves this — David still walks the floor — but adds **behavioral telemetry on each trader's interaction with their automated cousin**:

- Override frequency — how often is each trader manually overriding their automated fleet? Trending up?
- Discretionary book drift — is Henry's discretionary book growing larger or smaller relative to his systematic fleet? Is its style drifting?
- Pause-and-restart patterns — frequent pauses can indicate doubt; near-zero pauses can indicate inattention.
- Sleep / response-latency metrics on event days — is the trader available when their fleet hits red?
- Promotion-velocity drift — is the trader pushing strategies to live faster than baseline? slower? on which classes?

Behavioral monitoring now spans **13 traders × hundreds of automated strategies each + the trader's own discretionary book**. The terminal aggregates; David interprets; conversations remain human.

### What Quinn does, what David does

Quinn (the cross-archetype quant overseer) and David's automated cousin both operate at firm scope. The division:

- **Quinn** owns model quality, cross-archetype factor exposures, firm-systematic alpha strategies (factor / stat-arb / market-neutral overlays), strategy-class research, and quant-team management.
- **David** owns risk capital allocation, risk-limit policy, model-risk governance, behavioral oversight, kill-switch policy, client-facing risk narrative, and committee/regulator/board accountability.

They collaborate on promotion gates, on capacity planning, on stress design, and on cross-archetype concentration. They are not redundant; their views overlap deliberately.

### What changed numerically

- **Books overseen:** ~13 manual traders → ~13 traders × (50–500 strategy instances + discretionary book) ≈ 1,000–6,500 strategy instances + 13 discretionary books + Quinn's firm-systematic overlay.
- **Decisions per day:** ~10 manual interventions/day on the desk → ~50 alerts triaged + ~5 material decisions on a normal day; spikes to 100+ on event days.
- **Aggregation cadence:** previously updated on minutes-to-hours; now updated continuously.
- **Reports produced:** previously ~1 client letter / week + 1 risk-committee deck / week; now same letters but assembled from continuously-updated firm-aggregate data plane.
- **Behavioral surface:** previously ~13 traders to read; now 13 traders + their interaction-with-automated-cousin patterns.

### Why this matters

The cognitive shift is from **integrating-in-head** to **navigating-aggregations**. David doesn't try to hold the whole firm in his head; he trusts the aggregations, drills when the platform flags something, intervenes when judgment requires it. The terminal earns its keep by surfacing the right anomaly at the right moment without burying him in green.

---

## 2. What Stays David

The platform automates aggregation, decomposition, alerting, and reporting. It does not automate the judgments that make David David. Those are listed below; this list is **mandatory** and **scales inversely with automation tier**. David's "stays human" surface is large because his work was always largely judgmental.

### Capital allocation strategic moves

The platform computes marginal Sharpe of incremental capital at each strategy and each trader. It does **not** decide that the firm should rotate $200M from Marcus's basis-arb fleet to Henry's systematic equity fleet because David believes equity vol is mispriced for the next quarter. The platform produces inputs; David produces the move.

### Strategy-class sanctioning

Whether a new strategy class — say, MEV-aware on-chain arbitrage, or sports prediction-markets cross-venue, or a sovereign-CDS basis strategy — is permitted on the firm's books at all is David's decision (with Quinn's research input and the risk committee's sign-off). The platform tracks the sanctioning lifecycle (section 9). It does not auto-approve.

### Behavioral interventions

The platform flags behavioral drift. David has the conversation. Pulling a trader's risk, putting them on a notice period, changing their compensation parameters, recommending leave — these are human judgments about humans. The terminal surfaces; the human acts.

### Stakeholder narrative

Why did the firm earn what it earned this quarter? Why did this drawdown happen? Why are we under-allocated to a regime our peers are exploiting? The platform produces attribution and decomposition; David produces the **narrative** — to the client, to the committee, to the board, to the regulator. Narrative is judgment-and-relationship; it does not automate.

### Strategy-promotion sign-off (final gate)

Quinn's lifecycle gates handle most of the work. The final gate — David's signature — applies when a strategy hits material capital or material risk, when its archetype is sensitive, when capacity will materially shift, or when the strategy class is novel. Auto-approval is policy-bounded; everything outside the policy goes to human.

### Kill-switch invocation at the largest scopes

Per-strategy and per-trader kills can be triggered by automated criteria (with audit). Firm-wide kill, multi-archetype kill, and kills that exceed pre-defined thresholds require human invocation with multi-key authorization. The platform makes invocation fast; the decision is David's plus co-signers'.

### Counterparty / venue / protocol risk calls

The platform monitors counterparty health, venue health, protocol health (DeFi). Suspending a venue, withdrawing collateral preemptively, capping protocol exposure ahead of a governance vote — these are judgments. The platform surfaces; David decides.

### Regulator and audit relationships

Audit trails are continuous and machine-produced. The relationship with the regulator — what to disclose proactively, how to frame an incident, when to pull legal in — is David's. The terminal supports him with discoverable, exportable data; it does not substitute for the conversation.

### Client conversations on substance

The platform produces the client letter draft. Sitting with Elena (or another allocator) when she's deciding whether to subscribe more capital, or when she's processing a 3% drawdown — that's David. The platform feeds him with the data; the conversation is his.

### Strategic counterparty / venue diversification

Adding a new prime broker, signing on to a new exchange, onboarding a new DeFi protocol, vetting a new oracle — strategic decisions about firm infrastructure. The platform has data; the decisions involve commercial, legal, operational, and risk dimensions all together. David and his ops counterpart drive these.

### Crisis judgment

When something genuinely unexpected breaks — a venue-wide halt, a stablecoin depeg, a major exploit, a regulatory shock — the platform's automated responses are limited to pre-authorized envelopes. Beyond that, the firm needs a human who can make calls in incomplete information under pressure. That is the role.

### Platform stance

The platform is **opinionated about what to automate** (aggregation, decomposition, alerting, reporting, audit, replay) and **humble about what to leave human** (strategic allocation, behavioral interventions, narrative, novel strategy sanctioning, crisis calls). The default is to surface the data and request the human; the exceptions are clearly bounded and pre-authorized.

---

## 3. The Data Layer for David

David's data layer is **firm-aggregate**. He is not picking up new alt-coin perp data feeds (that's Marcus's domain) or new earnings-call transcript corpora (that's Henry's). He consumes outputs of every trader's data layer plus a layer of firm-aggregate data that exists only at his level.

For shared concepts — catalog browser, drift dashboard, lineage, procurement, gap analysis — see the foundation doc and Marcus's section 3 ([trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md)). David's section additions are **firm-aggregate** and **operational/risk-domain**.

### 3.1 The Data Catalog Browser

Same browser surface used by every trader; David's filter taxonomy emphasizes:

- **Firm-aggregate datasets** (computed by the platform from per-trader feeds; not procured externally).
- **Counterparty / venue / protocol health datasets** (cross-trader-relevant; David's primary).
- **Macro / regime datasets** (used as backdrop for cross-archetype risk reads).
- **Compliance / regulatory datasets** (audit-trail archives, regulatory filings, sanctions lists).

Layout sketch:

- **Left sidebar** — facets: domain (firm-aggregate / counterparty-health / venue-health / protocol-health / macro / compliance / external-client), source, tier, freshness SLA, owner.
- **Main panel** — dataset cards with name, description, latest snapshot timestamp, drift state, downstream consumers.
- **Right pane** — selected dataset's metadata, lineage (upstream sources + downstream consumers), schema, sample rows, alert state.

### 3.2 David's Core Datasets (Illustrative)

These are example shapes; the platform's actual catalog will differ. David rarely procures new datasets directly — when he does, it's via the firm's data ops team.

**Firm-aggregate (computed):**

- `firm.aggregate_positions` — every position across every trader, every venue, normalized to a canonical schema.
- `firm.aggregate_pnl` — every fill across every trader rolled to position-level, strategy-level, trader-level, archetype-level, firm-level.
- `firm.aggregate_greeks` — net delta, gamma, vega, theta, charm, vanna, vomma — across the firm; in $-equivalent and in instrument-native units.
- `firm.aggregate_factor_exposures` — beta-to-BTC, beta-to-SPX, beta-to-DXY, beta-to-rates, beta-to-credit, momentum tilt, value tilt, carry tilt, vol tilt, idiosyncratic-vs-systematic decomposition.
- `firm.capital_state` — total deployed, total free, total in-flight (bridges, settlements, deposits, withdrawals); per-trader allocations; per-venue collateral.
- `firm.trade_volume` — fills count and notional, by trader / archetype / venue / asset-class / strategy-class / time-bucket.
- `firm.strategy_state` — every live strategy with stage, capital allocated, recent PnL, recent drift state, recent alert count.
- `firm.intervention_log` — every kill, pause, override, capital change, limit change, with who-when-why.

**Counterparty / venue / protocol health (procured + computed):**

- `counterparty.health_scorecard` — per-counterparty (prime brokers, custodians, settlement banks): credit rating, recent CDS spread, news incidents, recent operational issues, time-to-respond on inquiries.
- `venue.health_index` — per-CeFi-venue: uptime, settlement reliability, withdrawal latency, recent halts, recent regulatory actions, audit status.
- `venue.depth_profile` — per-venue per-instrument: top-of-book and deeper-book depth statistics over the last N days; used to compute liquidity tier.
- `defi.protocol_health` — per-protocol (Aave, GMX, Curve, Lido, etc.): TVL, governance state, audit recency, oracle dependencies, recent exploits in similar protocols.
- `defi.bridge_health` — per-bridge: TVL, recent incidents, queue depth, audit status, withdrawal-dispute window state.
- `defi.oracle_health` — per-oracle (Chainlink, Pyth, etc.): heartbeat lag, deviation events, fallback-feed status.
- `defi.governance_calendar` — pending votes, parameter-change proposals, executive-pause windows.

**Macro / regime:**

- `macro.fomc_calendar` — releases, surprises, market-implied probabilities pre-event.
- `macro.economic_releases` — CPI, NFP, GDP, PMI, etc., with surprise vs consensus.
- `macro.cb_meeting_calendar` — global central-bank schedule, decision dates, dovish/hawkish narrative tags.
- `regime.firm_dashboard` — composite regime scoring (vol regime, liquidity regime, correlation regime, macro regime), updated continuously.

**Compliance / regulatory:**

- `compliance.audit_archive` — every authorization, intervention, limit change, capital change, signed and timestamped, with retention guarantees.
- `compliance.regulatory_filings` — firm filings, plus regulator-published guidance affecting the firm.
- `compliance.sanctions_lists` — OFAC, UN, EU; venue / counterparty / wallet-address screening.
- `compliance.kyc_state` — client onboarding status, periodic reviews, escalations.

**External-client (for firms with external capital):**

- `client.capital_state` — AUM by client, by share class, by mandate; recent flows; high-water marks; fee accruals.
- `client.subscription_pipeline` — pending subscriptions / redemptions / reallocations.
- `client.report_history` — every report sent to a client, with delivery confirmation.

David interacts with these by reading dashboards built on top, not by querying directly. But the catalog is searchable when he wants the underlying.

### 3.3 Data Quality Monitoring

The drift / freshness / null-rate / completeness panel covers David's datasets the same way it covers traders'. His **alert routing** prioritizes:

- Any firm-aggregate dataset stale beyond SLA — because his entire view depends on it.
- Counterparty / venue / protocol health datasets — because those drive intervention decisions.
- Compliance datasets — because audit gaps are existential.

A red on Marcus's funding-z-score feed is Marcus's problem first, David's second. A red on `firm.aggregate_greeks` is everyone's problem; David sees it immediately.

### 3.4 Lineage Navigator

Same surface as the trader lineage navigator; David's use case is **firm-aggregate provenance**:

- "What are the upstream sources behind `firm.aggregate_factor_exposures`?" → traces through every trader's per-strategy exposures, through their feature pipelines, to raw venue feeds.
- "If `binance.btcusdt.funding` goes stale, what firm-aggregate datasets degrade?" → traces forward to the rollups and surfaces the impact.

### 3.5 Procurement Dashboard

David doesn't drive procurement of trader-domain datasets; he reviews **firm-level procurement** — the firm-aggregate compute, archive storage, audit-archive retention, regulatory data subscriptions, counterparty-data feeds. Renewal-sensitive items he watches: counterparty-data subscriptions, regulatory-filing feeds, compliance-screening services, audit-archive cold storage costs.

### 3.6 Gap Analysis Surface

David's gap analysis is **firm-coverage**: are there firm-aggregate views missing? Is there a counterparty whose health he can't see? Is there a venue where the firm trades but for which the data layer doesn't carry health telemetry? Is there a regulatory regime the firm operates under whose filings aren't archived? Gaps logged here drive ops / data-team backlog.

### 3.7 Interactions David has with the data layer

- **Daily:** glance at firm-aggregate dataset freshness and counterparty / venue / protocol health alerts during the morning preview.
- **Weekly:** review counterparty / venue / protocol health trend in the risk-committee prep.
- **Monthly:** procurement review (subscriptions due, costs, gaps).
- **Ad hoc (during incident):** lineage navigator to trace a degraded firm-aggregate to its source; data-quality dashboard for the blast radius.
- **Ad hoc (during regulator pull):** compliance dataset queries to extract relevant audit slices.

### 3.8 Why this matters

- **Efficiency:** firm-aggregate datasets are precomputed, not assembled at read time. David reads dashboards; the data layer ensures the dashboards are correct, fresh, and reproducible.
- **Risk:** counterparty / venue / protocol health datasets are continuously monitored. A deteriorating counterparty is visible before the firm is exposed to the failure.
- **PnL:** firm-aggregate factor exposures let David flag concentrations the per-trader views couldn't reveal — and reallocate capital before the concentration costs PnL on a regime turn.

---

## 4. The Feature Library for David

David is not engineering features for alpha. He is a **consumer** of every trader's feature library plus a maintainer of **firm-aggregate features** that exist only at his level.

For shared concepts — feature browser, engineering surface, drift dashboard, cross-pollination — see the foundation doc and Marcus's section 4. David's adaptations are below.

### 4.1 The Feature Library Browser

Same surface; David's filter taxonomy emphasizes:

- **Firm-aggregate features** (computed at firm level, not at any single trader's).
- **Cross-archetype features** (used by multiple archetypes, often produced by Quinn's team).
- **Risk-domain features** (concentration, correlation, capacity-utilization, factor-decomposition).
- **Compliance features** (mandate-adherence checks, restricted-instrument flags).

### 4.2 David's Core Features (Illustrative)

These are example shapes; actual library will differ.

**Firm-aggregate risk features:**

- `firm.aggregate_var_parametric` — parametric VaR at 95% / 99% / 99.5%, computed continuously on firm aggregate.
- `firm.aggregate_var_historical` — historical-simulation VaR using N-year window; rolling.
- `firm.aggregate_var_montecarlo` — MC VaR with regime-conditional scenarios.
- `firm.aggregate_es_99` — expected-shortfall (CVaR) at 99%, the firm's tail-loss expectation conditional on breach.
- `firm.gross_exposure` — total long + total short in $-equivalent.
- `firm.net_exposure` — directional net.
- `firm.leverage_ratio` — gross exposure / equity.
- `firm.concentration_top_n` — top-N-instrument share of gross exposure; flagged above thresholds.
- `firm.counterparty_concentration` — exposure to the largest counterparty / venue / protocol as fraction of firm capital.

**Cross-archetype factor features:**

- `firm.factor_momentum_exposure` — net momentum tilt aggregated across archetypes.
- `firm.factor_value_exposure` — net value tilt.
- `firm.factor_carry_exposure` — net carry tilt.
- `firm.factor_short_vol_exposure` — net short-vol tilt; critical because many archetypes have this exposure latently (Sasha explicitly, Marcus via funding-harvest, Mira via inventory).
- `firm.factor_quality_exposure` — net quality tilt (equity-relevant, others by analog).
- `firm.idiosyncratic_share` — fraction of firm risk that's idiosyncratic vs systematic.

**Liquidity features:**

- `firm.liquidity_tier_1_share` — fraction of risk in tier-1-liquid instruments.
- `firm.liquidity_tier_3_share` — fraction in tier-3 (illiquid) instruments.
- `firm.unwind_horizon_1d_pct` — fraction of firm risk that can be flattened in 1 day at current depth.
- `firm.unwind_horizon_1w_pct` — fraction flattenable in 1 week.

**Behavioral features (per trader):**

- `trader.override_rate_30d` — override frequency per trader, rolling 30 days.
- `trader.discretionary_to_systematic_ratio` — per trader who has both books.
- `trader.alert_response_latency_p50` — median time to acknowledge a red alert on their fleet.
- `trader.promotion_velocity_z` — z-score of promotion frequency vs trader's own baseline.
- `trader.pause_frequency_30d` — pause-and-restart count.

**Counterparty / venue / protocol features:**

- `counterparty.health_score` — composite scorecard.
- `venue.degradation_score` — uptime + latency + fill-quality composite.
- `protocol.risk_score` — TVL + audit + governance + oracle composite.

**Mandate / compliance features:**

- `trader.mandate_adherence_score` — per trader, fraction of fills inside declared mandate.
- `firm.restricted_instrument_exposure` — exposure to instruments on internal / external restricted lists; should be zero.

These features feed David's dashboards and alerts. He rarely defines new ones; when he does (typically during an incident's post-mortem when a new flag is needed), it goes through the same publication form every trader uses.

### 4.3 Feature Engineering Surface

Same workflow as Marcus's. David uses it occasionally — usually after an incident when a new firm-aggregate feature is needed (e.g. "detect-when-multiple-traders-have-same-instrument-overconcentrated").

### 4.4 The Drift Dashboard

Drift on firm-aggregate features is high-priority. Drift on a counterparty health composite, on the firm's VaR computation methodology, on factor decompositions — any of these silently breaking would propagate widely. David's drift surface highlights these.

### 4.5 Cross-Pollination View

David sees what every desk is producing, but the cross-pollination he cares about is **risk-relevant**: are two archetypes building features that reflect the same underlying signal? If yes, their derived strategies will correlate; the firm needs to know.

### 4.6 Interactions David has with the feature library

- **Daily:** glance at drift dashboard for firm-aggregate and risk-domain features.
- **Weekly:** review with Quinn — what new features were published across archetypes? Any of them risk-domain or behavioral?
- **Monthly:** governance pass — feature library health, deprecated-feature cleanup, naming-convention audits.
- **Ad hoc (during incident):** define a new feature if needed.

### 4.7 Why this matters

- **Efficiency:** firm-aggregate features replace ad-hoc spreadsheet rollups.
- **Risk:** drift on a risk-domain feature is itself a risk event; the dashboard catches it.
- **PnL:** behavioral features feed the conversations that prevent trader-driven loss events.

---

## 5. The Research Workspace

David's research workspace is **firm-aggregate analytics**, not new alpha. He uses notebooks and the workspace surface for stress-scenario design, ensemble-correlation analysis, attribution research, capacity-planning models, and post-incident forensic work.

### 5.1 Notebook Environment

Same notebook + IDE surface every trader uses. David's typical notebook concerns:

- "If FOMC delivers a 50bp surprise, what's the firm's expected loss given current positions? Decompose by archetype."
- "Counterparty X's CDS widened 40bp this week. Simulate the impact of a Counterparty-X-failure scenario on firm capital and operations."
- "Recompute factor decomposition with this new factor model. Compare to current."
- "Reconstruct the firm's state at 14:32 UTC last Tuesday. What strategies were active? What was the aggregate exposure? What alerts had fired?"

He has full access to the firm-aggregate dataset and to per-trader data via aggregations. He has read access (not write) to per-trader strategy code for forensic work.

Compute is attached the same way; David's notebook can run heavy MC simulations on firm compute without melting his laptop.

### 5.2 Backtest Engine UI

Less central for David than for traders, but used:

- **Stress-scenario backtesting** — apply a historical or constructed scenario to the current firm state and to historical firm states.
- **Allocation-counterfactuals** — "if we'd allocated 20% more to Marcus over the last six months and 20% less to Henry, what would firm Sharpe have been?"
- **Capacity backtests** — "if Marcus's basis-arb fleet had been at $300M instead of $200M, what would the cumulative capacity drag have looked like?"

Realism dimensions matter: scenarios need correct correlation assumptions, allocation counterfactuals need correct turnover modeling, capacity backtests need realistic depth-impact functions.

### 5.3 Walk-Forward Visualization

David uses walk-forward views to assess whether allocation rules and risk-limit policies are robust over time. Standard walk-forward charts; the unit of test is policy, not strategy.

### 5.4 Strategy Template Library

David has a different kind of template library — **policy templates** rather than strategy templates:

- **Stress-scenario templates** — venue-halt, counterparty-failure, stablecoin-depeg, vol-spike, flash-crash, regulatory-shock, liquidity-crunch, correlation-breakdown, regime-shift. Each parameterizable.
- **Allocation-policy templates** — Sharpe-weighted, Kelly-fractional, risk-parity, regime-conditional. Each instantiable to firm scope.
- **Limit-hierarchy templates** — pre-built skeletons of trader-level / strategy-level / venue-level limits with sensible defaults.
- **Behavioral-rule templates** — pre-built skeletons of behavioral-drift detection rules, parameterizable per trader.
- **Kill-switch trigger templates** — pre-built skeletons of auto-trigger rules at each scope.

Templates are starting points; David customizes per the firm's actual policy.

### 5.5 Compute Management

David's compute jobs are MC simulations, attribution decompositions, allocation counterfactuals — typically heavier than per-trader research. Compute tier upgrade is one click, with cost preview.

### 5.6 Anti-Patterns the Workspace Prevents

Same anti-patterns as the trader workspace (look-ahead bias, survivorship bias, p-hacking) but with David-specific additions:

- **Allocation hindsight bias** — counterfactuals must respect that the alternative allocation would have changed market impact and thus PnL non-linearly. The platform flags hindsight-naïve counterfactuals.
- **Stress-scenario circularity** — if the same model trained on the same historical regime produces both the current strategies' positions and the stress scenario's correlation assumptions, the stress is understated. The platform prompts for cross-validation between scenario assumptions and strategy training.

### 5.7 Interactions David has with the workspace

- **Pre-market:** rare; a check on overnight stress-scenario updates.
- **In-market:** rare; ad-hoc analytics if something breaks.
- **Post-market / off-hours:** the bulk of David's workspace use — committee-prep analytics, allocation modeling, post-mortem forensics, policy work.
- **Weekly:** committee-deck preparation pulls heavily on workspace outputs.

### 5.8 Why this matters

- **Efficiency:** stress, attribution, and counterfactual analytics that previously took David's quant team a week now run interactively.
- **Risk:** scenarios are continuously refreshed; risk-committee discussions start from current state, not last quarter's snapshot.
- **PnL:** allocation policies are tested before they're applied; bad ideas are rejected in simulation rather than in the firm's actual book.

---

## 6. The Model Registry — Firm-Aggregate Governance View

David doesn't train models. He governs the firm's model landscape. The model registry surface he uses overlays the per-trader registry views with firm-level rollups and policy-enforcement views.

### 6.1 Firm-Aggregate Registry Browser

Layout sketch:

- **Left sidebar** — facets: archetype, stage (research / paper / pilot / live / monitor / retired), age (days since last retrain), drift state, capital-at-risk band, last-validated date.
- **Main panel** — model cards with archetype, owner, deployed strategies, capital served, current stage, drift state, time-to-next-retrain.
- **Right pane** — selected model's full metadata + governance state (approvals, sign-offs, recent reviews).

### 6.2 Model-Risk Policy View

David configures and reads the firm's model-risk policy:

- **Maximum age before mandatory revalidation** (per archetype, per stage, per capital-tier).
- **Minimum out-of-sample window** required for promotion at each stage.
- **Drift thresholds** that auto-flag for review.
- **Capital-at-risk thresholds** that require committee sign-off vs auto-approve.
- **Retraining-frequency policy** per model class.

The policy is editable; edits are audited and require risk-committee co-sign at material thresholds.

### 6.3 Cross-Archetype Model Overlap

The platform computes pairwise similarity between deployed models across archetypes — by feature inputs, by training data, by output correlations. Models that overlap unexpectedly get flagged. David reviews; if confirmed, the strategies they power likely correlate.

### 6.4 Model-Failure Incident Queue

When a deployed model fails (drift breach, regime miss, silent break detected by reconciliation), an incident is filed automatically. The queue lists open incidents with owner, severity, time-since-detection, blast-radius (capital affected), and current containment state.

### 6.5 Reproducibility Audit

Spot-check workflow: David picks a deployed model at random, asks "reproduce the training run," and the platform should produce the exact model. If reproducibility breaks, that's an incident.

### 6.6 Why this matters

- **Efficiency:** governance overhead per model is low; David sees the firm landscape rather than reviewing each model.
- **Risk:** model failure modes are systematized; silent breaks are caught.
- **PnL:** models that should have been retrained months ago don't keep running into a regime they don't fit.

## 7. The Experiment Tracker

David's experiment tracker concerns are **firm-level experiments** — stress-scenario design experiments, allocation-policy experiments, capacity-modeling experiments, behavioral-rule calibration experiments. Same tracker surface every trader uses; different content.

### 7.1 The Run List

Searchable / filterable list. David's filters typically:

- Owner: David / risk-team.
- Tag: stress-scenario / allocation-policy / capacity / behavioral / model-risk.
- Date range.
- Outcome (promoted-to-policy / shelved / iterating).

### 7.2 The Run Detail View

Per-run: code commit, data snapshot, parameters, outputs (loss tables, attribution breakdowns, sensitivity charts), notes.

David's runs typically produce **policy candidates** rather than strategy candidates: "this allocation policy applied historically would have produced firm Sharpe X with worst-month Y vs the actual Z."

### 7.3 Compare View

Side-by-side comparison of policy candidates. Standard tracker compare; David uses it heavily during committee-prep.

### 7.4 Reproducibility

Same guarantees the trader-side gets: any run can be reproduced from the recorded commit + data snapshot + parameters.

### 7.5 Search Across the Firm

David can search every trader's experiments (read-only) — useful when reviewing a promotion or investigating an incident: "show me every experiment that trained or evaluated the model now deployed in Marcus's strategy 47."

### 7.6 Why this matters

- **Efficiency:** policy work is iterative; the tracker keeps history.
- **Risk:** every policy decision is traceable to the analysis that motivated it.
- **PnL:** the tracker makes it cheap to revisit shelved ideas when regime changes.

---

## 8. Risk-Limit Hierarchy Composition

David doesn't compose strategies. He composes the **firm-level risk-limit hierarchy** — the layered cascade of limits (firm → archetype → trader → strategy → venue → instrument → counterparty → protocol) that constrains every automated and discretionary action.

### 8.1 The Hierarchy Editor

Layout sketch:

- **Tree view** — left pane, the full hierarchy: firm root → archetype branches → trader nodes → strategy leaves; venue / instrument / counterparty / protocol axes overlay as orthogonal trees.
- **Node detail** — right pane, the limits attached to the selected node: types (notional / VaR / gross / net / per-greek / leverage / concentration / drawdown / loss-rate / order-rate / fill-rate), values, currencies, scope (intraday / overnight / weekly / monthly), enforcement (hard / soft / advisory).
- **History** — per node, every limit change with timestamp, who, why.

Limit edits flow through an **approval workflow**:

- Below threshold: David alone signs.
- Material: David + Quinn (or designated co-signer).
- Major: David + CIO + risk officer (multi-key).
- Off-policy: requires risk-committee approval.

Thresholds are themselves limits, defined at the policy-template level.

### 8.2 The Limit Types

The platform supports a standard taxonomy:

- **Notional limits** — gross long, gross short, net, by node.
- **VaR limits** — parametric / historical / MC, at confidence levels.
- **Greek limits** — net delta, vega, gamma, theta in $-equivalent.
- **Leverage limits** — gross / equity at each scope.
- **Concentration limits** — max share of any single instrument / sector / underlying / venue / counterparty / protocol at any scope.
- **Drawdown limits** — daily / WTD / MTD / YTD; trigger states (warning / pause / kill).
- **Loss-rate limits** — max losing days in N days; trigger pause for review.
- **Order-rate limits** — max orders per minute per strategy / per trader; protective against runaway algos.
- **Fill-rate limits** — max gross trading per minute / hour / day; capacity management.
- **Behavioral limits** — per-trader override-rate ceiling, per-trader pause-rate floor; advisory only.

Each limit type has soft (warn) and hard (block) variants, and a configured action (warn / pause / kill / require-co-sign) when hit.

### 8.3 Effective-Limit Computation

The platform continuously computes the **effective limit** at each node — the minimum of the node's own limit and any inherited ancestor limit applicable. A strategy's effective notional limit is the minimum of (strategy notional cap, trader notional cap, archetype notional cap, firm notional cap), each at the matching tenor.

David reads effective limits, not paper limits — the latter can mislead because ancestor caps bind first.

### 8.4 The Headroom View

Per node, the platform shows current value vs effective limit and color-codes:

- Green: under 70%.
- Amber: 70–90%.
- Red: 90–100%.
- Crimson: breach.

David's foveal pane includes the firm-level headroom across major limit types.

### 8.5 Limit Drill Reports

Daily report: every limit hit (warn or breach) in the last 24h, who acknowledged, who acted, current state. Weekly aggregate: limits with most-frequent warns, suggesting either over-conservative limits or under-disciplined strategies.

### 8.6 Why this matters

- **Efficiency:** limit changes follow a single workflow; ad-hoc spreadsheet limits are eliminated.
- **Risk:** every action across the firm is bounded by effective limits computed continuously; nothing happens silently outside the hierarchy.
- **PnL:** capacity is allocated where it's earned, not where last year's spreadsheet defaulted it.

---

## 9. Strategy Class Sanctioning Lifecycle

David doesn't promote individual strategies (Quinn does, with David's sign-off at the final gate). He sanctions **strategy classes** — broad categories of automated activity the firm permits at all. New classes go through a formal lifecycle; existing classes get periodic review; retired classes get archived.

### 9.1 The Class Catalog

Browser of every sanctioned strategy class — illustrative entries:

- "CeFi crypto basis arbitrage" (sanctioned, owned-by Marcus archetype).
- "DeFi-CeFi cross-domain basis" (sanctioned, owned-by Julius archetype).
- "Equity systematic factor tilt" (sanctioned, owned-by Henry archetype).
- "Rates RV / curve trades" (sanctioned, owned-by Ingrid archetype).
- "Equity-vol short-strangle with delta-hedge" (sanctioned, owned-by Sasha archetype).
- "MEV-aware on-chain arbitrage" (pending sanctioning).
- "Sports prediction-markets cross-venue" (pending sanctioning).
- "Sovereign CDS basis" (under-review, capacity concerns).
- "Crypto perpetual funding harvest" (sanctioned, owned-by Marcus).

Each entry has owner, archetype, stage (proposed / under-review / sanctioned / restricted / retired), capital authorization, sample strategy instances, governance notes.

### 9.2 The Class Sanctioning Process

A new class proposal is filed (typically by Quinn or a trader's archetype lead) with:

- Definition of the class — what's in, what's out.
- Edge thesis — why this class is expected to earn.
- Capacity estimate.
- Risk profile — which limit types matter most, expected drawdowns, expected correlations.
- Stress profile — class-specific failure modes.
- Operational requirements — venues, custody, compliance.
- Behavioral requirements — what discipline does the class require from operators?

The class moves through stages:

1. **Proposed** — filed, awaiting initial review.
2. **Under-review** — risk team and Quinn's team analyze.
3. **Pilot-class** — sanctioned for limited capital and limited operators only; observed for N months.
4. **Sanctioned** — full capital authorization, available to assigned archetypes.
5. **Restricted** — sanctioned but with capped capital or operator restrictions, typically post-incident.
6. **Retired** — no longer permitted; existing instances unwound on schedule.

David's signature is the final approval at each stage transition.

### 9.3 The Periodic Class Review

Every sanctioned class is reviewed annually (more frequently if drift or incidents). The review checks:

- Current capacity utilization vs estimate.
- Realized risk profile vs proposed risk profile.
- Realized correlations to other classes.
- Operational incidents.
- Behavioral compliance.

Reviews can re-sanction, restrict, or retire the class.

### 9.4 Class Retirement and Archive

When a class is retired, instances are unwound on a schedule. The class entry stays in the catalog as "retired" with its full history; future re-proposals reference it.

### 9.5 Why this matters

- **Efficiency:** sanctioning is process, not ad-hoc memo trail. New ideas have a clear path; existing classes get reviewed regularly.
- **Risk:** strategy creep — operators expanding into adjacent activity outside their sanctioned class — gets caught at the catalog boundary.
- **PnL:** capacity decisions on classes are made deliberately, with capacity estimates that get checked against realized utilization.

---

## 10. Capital Allocation — Firm-Level Cross-Archetype

This section expands dramatically vs a trader's appendix. Capital allocation is the heart of David's job; the platform supports it as a continuous, decomposable, counterfactual-friendly surface.

### 10.1 The Allocation Engine

Layout sketch:

- **Top pane** — firm capital state: total, deployed, free, in-flight; recent flows.
- **Middle pane** — allocation tree: firm → archetype → trader → strategy-class → strategy. Each node shows current allocation, current utilization, current marginal Sharpe (estimated from recent history, with confidence band), current risk consumed.
- **Right pane** — proposed-change panel: David drafts a reallocation; the platform shows projected impact on firm Sharpe, firm VaR, firm correlations, firm capacity utilization. Save as draft, simulate, propose, approve.
- **Bottom pane** — recent-decision log.

Edits go through the same approval workflow as limits; large reallocations require multi-key.

### 10.2 Marginal-Sharpe Estimation

The engine maintains a continuously-updated estimate of marginal Sharpe at each node — "if we put another $10M into this strategy, what's the expected Sharpe-uplift on the firm?" The estimate is built from:

- Recent realized Sharpe at the node.
- Capacity model (depth-impact and capacity decay).
- Correlation with the rest of the firm (high-correlation marginal Sharpe is discounted).
- Regime conditioning (current regime fit).

David reads the estimates with their confidence bands; the engine never auto-allocates without human approval, but it provides the inputs.

### 10.3 Cross-Archetype Capital Reallocation

The use case David runs most: "I want to rotate $200M from rates carry to equity systematic, given the regime read." The engine shows:

- Source: which strategies in Ingrid's rates fleet release capital, on what schedule (auction-day timing, maturity rolls, etc.).
- Destination: which strategies in Henry's equity fleet absorb capital, with capacity-headroom check.
- Transition plan: timeline over which the rotation completes (avoiding market impact); estimated cost of transition.
- Impact on firm correlation matrix and factor exposures.
- Approval requirements: above $200M, multi-key required.

David approves the plan; the engine schedules the executions; traders' automated cousins receive the capital changes; everything is audited.

### 10.4 Per-Asset-Class Budgets

David sets and adjusts per-asset-class budgets — equity / rates / FX / credit / commodity / digital-asset / event-market. The engine enforces budgets at allocation time and flags drifts caused by PnL (a budget can creep over its cap if its book grows; the engine surfaces this).

### 10.5 Per-Strategy-Class Budgets

David also sets per-strategy-class budgets — basis-arb / curve-trade / volatility-short / factor-tilt / event-driven / etc. — orthogonal to per-trader budgets. A trader might have a $400M trader budget but a $150M cap on their basis-arb strategy class.

### 10.6 Regime-Conditional Caps

Some caps are conditional on the regime regime indicator:

- "If correlation regime = high-clustered, cap firm short-vol exposure at $X" (lower than the unconditional cap).
- "If liquidity regime = stressed, cap tier-3 illiquid exposure at $Y."
- "If macro regime = late-cycle, cap leverage at Z."

The engine applies the conditional caps when the regime indicator triggers; David is notified.

### 10.7 Counterfactual Allocation Workspace

For committee prep and policy iteration:

- "What would the firm Sharpe have been if we'd allocated 30% more to event-driven and 30% less to basis-arb over the last 6 months?"
- "Stress: if we'd had an extra $500M to deploy, where would it have earned best?"

Counterfactuals are flagged with realism limitations (the alternative allocation would itself have changed market impact and capacity utilization, which the platform tries to model but with caveats).

### 10.8 Capital In-Flight Tracking

Real-time visibility into capital that's neither deployed nor free — bridges in transit, settlements pending, deposits queued, withdrawals processing. In-flight capital can't be reallocated until it lands; the engine shows expected landing times.

### 10.9 Why this matters

- **Efficiency:** allocation decisions are first-class workflows; capital changes happen with a defined approval flow rather than ad-hoc emails.
- **Risk:** reallocations are previewed against firm risk before execution; surprises are minimized.
- **PnL:** capital sits where it earns most, conditioned on regime; the engine makes the marginal-Sharpe trade-off visible.

---

## 11. Firm-Wide Fleet Supervision

This section transforms the trader-side "live fleet supervision" into firm-wide multi-fleet supervision. David is watching every automated cousin's fleet plus every discretionary book plus Quinn's overlay simultaneously.

### 11.1 The Firm Fleet Dashboard

This is David's most-foveal surface during market hours. Layout sketch:

- **Top band** — firm aggregate: total PnL today / WTD / MTD; firm VaR vs limit headroom; firm gross / net exposure; firm leverage; firm $-delta / $-vega / $-gamma; firm cash / dry-powder.
- **Middle band** — per-trader tile board: 13 tiles, one per archetype-trader. Each tile shows trader name, fleet size (count of live strategies), capital used / allocated, PnL today, behavioral health badge, alert count, last-intervention badge.
- **Bottom band** — alert rail: firm-wide active alerts in priority order, with severity, scope, time-fired, acknowledger, status.
- **Right pane** — context: regime indicator, headline market state, active stress-scenario warnings.

Default state is **green and quiet**. Green tiles, no alerts, mild background = normal day. The dashboard earns its keep on red days.

### 11.2 The Trader-Detail Drill Page

Click a tile → drill into that trader's automated fleet (and discretionary book, if applicable). What David sees:

- Trader's full fleet table (every strategy with stage, capital, PnL, recent alerts).
- Trader's discretionary book separately.
- Trader's recent override / pause / kill activity.
- Trader's behavioral indicators (override rate, alert response latency, promotion velocity z-score).
- Trader's compliance / mandate adherence.
- Direct link to the trader's own Strategy Detail Page for any strategy.

This is David's view of what each trader sees, plus the cross-cutting behavioral telemetry.

### 11.3 Anomaly Detection Surface

Firm-wide anomaly detection runs continuously:

- A strategy's PnL diverging materially from its backtest expectation.
- A strategy's positions diverging from its declared mandate.
- A trader's intervention rate spiking.
- Cross-trader correlated drawdowns (multiple traders losing simultaneously on what should be uncorrelated books).
- Counterparty / venue / protocol degradation.
- Compliance anomaly (sanctions screen flag, KYC expiry, mandate breach).

Each anomaly routes to David's alert rail at the right severity. Anomalies that automatic systems can't classify (novel patterns) get a "human-review-needed" tag.

### 11.4 Cross-Fleet Correlation View

The view that matters most for David. Layout sketch:

- Heatmap: 13 traders × 13 traders, cells colored by recent rolling correlation of daily PnL.
- Hidden-correlation flags: cells where the realized correlation materially exceeds the modeled / expected correlation.
- Strategy-class heatmap: same shape, by strategy class.
- Factor-decomposition view: shared factor tilts driving the correlations.

Hidden correlations are existential. If three traders are supposed to be independent but their PnLs are correlating because they all have latent short-vol exposure, the firm's actual risk is higher than the parametric VaR assumes. David acts on this.

### 11.5 Firm Live Risk State

The substitute for Marcus's "Multi-Venue Capital + Balance Live State." For David:

- **Counterparty exposure live state** — every counterparty with current exposure, recent change, recent health-score change.
- **Venue exposure live state** — every venue with current exposure, recent uptime, recent halt history.
- **Protocol exposure live state** — every DeFi protocol with current TVL share, governance state, oracle dependencies.
- **Margin / collateral live state** — margin utilization across venues with venues that are nearing limits highlighted.
- **In-flight capital live state** — bridges, settlements, deposits, withdrawals.
- **Audit state live state** — audit-trail completeness, any gaps.

This is a specialized panel David checks several times a day; the platform pages him on material changes.

### 11.6 Strategy State Inspection — Across Fleets

**Mandatory.** David must be able to inspect any strategy in any trader's fleet on demand. Use case: a trader's strategy starts behaving anomalously, the trader is unavailable or unsure, David pulls up the strategy's internal state and decides whether to intervene.

What the inspector shows for a selected strategy:

- **Identity** — name, owner, version, archetype, deployed-since.
- **Configuration** — parameters, sizing rules, entry/exit rules, hedging rules, risk gates.
- **Recent state** — feature inputs at last evaluation, model outputs, signal strength, regime tag, position state, recent PnL, recent fills.
- **Mandate state** — does its current behavior match its declared mandate?
- **Backtest-vs-live comparison** — daily by default. Live PnL trajectory overlaid against backtest expectation; current divergence; flag for action.
- **Recent interventions on this strategy** — pauses, parameter overrides, kills.
- **Audit trail** — every decision the strategy made, with the inputs and the outputs.

**Engineering-pragmatism note.** The platform does NOT stream every variable of every strategy in real time — that would be infeasible at firm scope. Instead, strategies push state-snapshots at defined cadences (typically per-decision and per-fill) plus on-demand pulls when David requests. The inspector shows the most recent snapshot and offers a refresh action that requests the live state from the strategy. Refresh latency is a few seconds for in-process strategies, longer for strategies running in different compute pools. Real-time streaming is reserved for strategies under active investigation.

David rarely uses this surface. When he does, it usually means something is wrong. The inspector exists so that "I need to see what this strategy is doing right now" is a one-click operation, not a one-hour cross-team Slack thread.

### 11.7 Why this matters

- **Efficiency:** David supervises 1,000+ strategies the same way he previously supervised 100 positions — by reading aggregations and drilling on anomalies.
- **Risk:** hidden correlations and concentrations that can't be seen at trader level get caught at firm level.
- **PnL:** the supervisor catches bad situations early; preventing one large loss event pays for the surface many times over.

---

## 12. Firm-Level Intervention Console

David's intervention surfaces are different in shape from a trader's. He acts at trader / archetype / firm scope. The console exposes:

### 12.1 Per-Strategy Controls (Cross-Trader)

Same controls a trader has, but David can act on any strategy in any trader's fleet:

- Pause / unpause.
- Kill (with confirmation + reason + audit).
- Reduce capital allocation (immediate or scheduled).
- Override parameters (with reason + audit; trader notified).
- Force-flatten (with execution-policy choice — VWAP / TWAP / market / liquidity-aware).

These cross-trader controls are **rare** in normal operation and are gated by an escalation workflow: David pings the trader first; if the trader is unavailable or in disagreement and the situation is material, David acts and the trader is notified with the reason. Every cross-trader action logs the escalation chain.

### 12.2 Per-Trader Group Controls

Acting on a trader as a unit:

- **Pull a trader's risk** — instruct the automated cousin to reduce its capital usage by X% within Y minutes; selectively or wholesale.
- **Pause a trader's fleet** — block new entries; existing positions remain.
- **Restrict a trader's promotions** — block new strategies from advancing past pilot.
- **Cap a trader's discretionary book** — limit the discretionary overlay's notional or risk.
- **Place trader on review** — formal status; behavioral monitoring intensifies; weekly review with risk team.

Each action requires reason + audit + notification. Some require co-sign.

### 12.3 Per-Archetype / Per-Strategy-Class Controls

Acting on a class of activity across the firm:

- **Pause an archetype's automated activity** — e.g. pause all DeFi strategies pending a major exploit investigation.
- **Restrict a strategy class** — e.g. cap all funding-harvest strategies at 50% of their nominal allocation pending a regime read.
- **Halt a strategy class** — full stop, all instances unwound on schedule.

Multi-key authorization for the larger scopes.

### 12.4 Manual Trading & Reconciliation (David's Override Capability)

David rarely trades manually. The override capability is preserved for two narrow cases:

- **Emergency directional bets in the firm-systematic book.** When a regime shift is severe and the firm's exposure must be hedged outside any trader's mandate, David can place hedge orders directly into a firm-systematic book that he owns. Examples: a sudden BTC -20% gap forces a firm-level hedge before any single archetype responds; a venue halt forces immediate flattening of a specific exposure.
- **Reconciliation actions.** When automated reconciliation flags a position discrepancy that no trader's automated cousin can resolve (because the discrepancy is between firms, between custodians, or between data planes), David has a manual ticket to do the reconciling trade.

The manual ticket itself:

- Full pre-trade preview (impact, current effective limits, impact on firm aggregates).
- Mandatory reason field.
- Mandatory tag (emergency-hedge / reconciliation / other).
- Co-sign required for above-threshold size.
- Immediate audit log entry.
- Post-trade write-up requirement within 24 hours.

**Emergency mode** — a "panic button" surface that, when activated (multi-key), gives David direct access to fast manual flattening across the firm-systematic book with elevated rate limits but stricter auditing. Use case: real catastrophe in progress.

**Global hotkeys** — disabled by default for David (his actions are deliberate, not muscle-memory). Configurable for emergency mode only.

**Tagging-and-audit** — every manual trade by David is tagged "supervisor-override" and feeds the post-trade narrative ("on day X, supervisor placed Y as emergency hedge; outcome Z").

This section preserves the manual-trading template across all archetypes, adapted to David's actual usage pattern.

### 12.5 Kill Switches at Multiple Scopes

The full hierarchy:

- **Per-strategy kill** — David / Quinn / the strategy's owner-trader can invoke; automated triggers also possible per pre-authorized criteria.
- **Per-trader kill** — David / Quinn invoke; cancels orders + flattens fleet for that trader; co-sign required above material thresholds.
- **Per-archetype kill** — David + Quinn co-sign; halts the archetype's automated activity firm-wide.
- **Per-strategy-class kill** — David + Quinn co-sign.
- **Per-venue kill** — David + Ops co-sign; cancels orders + flattens venue exposure across the firm.
- **Per-counterparty kill** — David + Ops co-sign; reduces / unwinds exposure to the named counterparty.
- **Per-protocol kill** — David + Ops co-sign; pauses all DeFi activity in the named protocol.
- **Firm-wide kill** — David + CIO + risk officer (multi-key); cancels every order, flattens every position, suspends every strategy. Existential-level action; quarterly drilled.

Each kill, when invoked, produces:

- Immediate broadcast to all affected operators.
- Full audit record with invoker, co-signers, reason, scope, timestamp.
- Post-event review within 48h.

### 12.6 Pre-Authorized Auto-Kill Triggers

David configures triggers that auto-invoke kills under specific conditions:

- "Firm drawdown -3% intraday → auto-pause new entries firm-wide; David + CIO must explicitly resume."
- "Counterparty health-score < threshold → auto-reduce exposure to that counterparty by N% over M minutes."
- "Any major bridge halt → auto-pause all DeFi cross-chain strategies firm-wide."
- "Stablecoin depeg > 2% → auto-flatten stablecoin-pair strategies."

Auto-triggers are bounded; they cannot exceed pre-authorized envelopes. Beyond the envelope, human invocation is required.

### 12.7 Intervention Audit Log

Every intervention — David's, trader's, automated — produces an audit record. The log is searchable / filterable / exportable. Regulator pulls draw on this.

### 12.8 Why this matters

- **Efficiency:** interventions follow defined workflows with known authorization paths; ad-hoc emergencies don't require ad-hoc decision-making about who can act.
- **Risk:** kill switches at every scope mean the right scope can be invoked for the right situation; firm-wide is reserved for true existential events.
- **PnL:** preventing one badly-managed crisis preserves more PnL than years of small alpha.

---

## 13. Firm-Level Post-Trade & Decay

The trader-side post-trade tracker becomes a firm-level retrospective surface for David.

### 13.1 Firm Performance Retrospective

Per-day / per-week / per-month / per-quarter / per-year:

- Firm gross / net PnL.
- Firm Sharpe / Sortino / Calmar.
- Firm drawdown (from peak).
- Firm capital efficiency (Sharpe per $ of risk capital deployed).
- Firm allocation utilization (fraction of allocated capital actually used).

### 13.2 Cross-Trader Attribution

Decomposes firm PnL by:

- Trader (each archetype's contribution).
- Strategy class (each class's contribution across traders).
- Asset class.
- Factor (systematic factor decomposition).
- Regime (PnL conditioned on regime indicator).
- Discretionary vs systematic (per trader who runs both).

The decomposition reconciles: trader sum = firm total; class sum = firm total; etc.

### 13.3 Cross-Archetype Decay Metrics

Decay surfaces at firm aggregate:

- Strategy classes whose realized Sharpe has materially eroded vs original promotion gate.
- Archetypes with elevated drift in their feature pipelines.
- Models past their max-age policy threshold.
- Strategies with growing backtest-vs-live divergence.

David reviews the decay queue with Quinn weekly.

### 13.4 Capital Efficiency Review

Per-trader and per-strategy-class:

- Sharpe per $ allocated.
- Allocation history with outcomes.
- Counterfactual: had we under-/over-allocated, what would have changed?
- Reallocation candidates flagged.

The review feeds the next allocation cycle.

### 13.5 Behavioral Retrospective

Per-trader:

- Override-rate trend over 90 days.
- Discretionary-book vs systematic-fleet PnL contribution.
- Alert-response-latency trend.
- Promotion-velocity trend.
- Notable behavioral incidents.

David uses this for compensation and mandate conversations.

### 13.6 Risk Retrospective

- Limit breaches (severity, root cause, resolution).
- Stress scenarios that materialized vs pre-computed losses (calibration of stress library).
- Counterparty / venue / protocol incidents and lessons.
- Audit-trail gaps and remediation.

### 13.7 The Risk-Committee Auto-Deck

Weekly committee deck assembled automatically:

- Firm performance summary.
- Risk consumed vs allocated.
- Limit breaches.
- Concentration evolution.
- Stress scenarios (current state, recent updates).
- Promotion / sanctioning lifecycle changes.
- Forward-looking risks (regime-fit, capacity, concentrations).
- Open incidents.

David reviews and edits before the meeting; the platform produces the draft.

### 13.8 Why this matters

- **Efficiency:** retrospectives that previously required quant-team weeks are continuously available.
- **Risk:** decay is caught at firm scope, so small erosions across many strategies don't aggregate silently.
- **PnL:** allocation cycles are informed by realized capital efficiency, not last quarter's hopes.

## 14. The Supervisor Console — David's Daily UI

David's automated-mode console is **firm-aggregate dense** with extensive drilldown. He has fewer monitors than traders (4 + an office presentation display) because his job is overview, not action latency.

### 14.1 Layout Sketch

The 4-monitor desk layout (extending the manual layout in his existing Physical Setup section):

| Position     | Surface                                                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Top-left     | **Firm Fleet Dashboard** — section 11.1 layout: top-band aggregate, middle-band trader tiles, bottom-band alert rail, right-pane context.    |
| Top-right    | **Risk-Limit Hierarchy + Effective-Limit Headroom** — section 8 surface, foveal during market hours.                                         |
| Bottom-left  | **Firm Live Risk State** — section 11.5: counterparty / venue / protocol exposures, margin / collateral, in-flight capital, audit health.    |
| Bottom-right | **Capital Allocation Engine + Cross-Fleet Correlation View** — sections 10.1 + 11.4 alternating; allocation daytime, correlation continuous. |

Plus the **office presentation display** for committee / client / board meetings — a presentation-ready workspace with large fonts, narrative panels, and pre-formatted decks.

### 14.2 Mode-Switching

David's modes:

- **Daily-supervision mode** — default during market hours. Foveal: fleet dashboard + risk limits. Periphery: live risk state + correlation. Anomaly-driven; default green.
- **Committee-prep mode** — used pre-committee (typically Monday morning, Wednesday afternoon, monthly committee day). Foveal: post-trade retrospective + auto-deck draft. Periphery: fleet dashboard.
- **Allocation mode** — used during planned reallocation cycles. Foveal: allocation engine + counterfactual workspace. Periphery: fleet dashboard.
- **Incident mode** — activated on a material event. Foveal: incident control surface (the affected scope, the kill switches at relevant scopes, the comms panel). Periphery: replay + audit log.
- **Client-meeting mode** — used in his office. Foveal: presentation deck on the office display. Desk monitors stay on a quiet supervision summary so he can return to the desk if alerted.
- **Off-hours mode** — used overnight / weekends. Foveal: alert rail (low-volume; only material alerts survive the off-hours filter). Pager integration for critical events.

Mode-switches are explicit; the platform doesn't auto-switch unless the trigger is severe (firm-wide kill activated → incident mode).

### 14.3 Anomaly-Driven Default State

Default state is **green and quiet**. Foveal panes are summaries; everything detailed is one click away. The console doesn't bury David in numbers that look fine; it surfaces the few that don't.

The console is opinionated: David doesn't read the firm's normal state every morning, because the system says "normal" in summary. He reads the deviations.

### 14.4 Why this matters

- **Efficiency:** David's eye is drawn to the few things that need it; the rest is in green-summary form.
- **Risk:** anomaly-driven means the supervisor sees what supervisors must see, not what convenience would surface.
- **PnL:** a supervisor focused on the right anomaly catches the right risk; supervisor distraction is a real cost.

---

## 15. David's Automated-Mode Daily Rhythm

David's rhythm is **committee-cycle driven**: daily review, weekly committee-prep, monthly committee, quarterly board, annually full-firm review. The market-hours rhythm is anomaly-driven; the off-market rhythm is committee-driven.

### 15.1 Pre-Market

Office or desk, 60–90 minutes pre-open in primary regime (varies for global firms; David's home regime is the dominant cycle).

- **Overnight summary check.** What fired overnight? Did any auto-trigger kick in? Did any trader respond to overnight alerts? Are any strategies currently paused or in a non-normal state?
- **Counterparty / venue / protocol health glance.** Any deterioration overnight?
- **Macro / regime check.** Has the regime indicator shifted? Are any conditional caps newly active?
- **Behavioral telemetry glance.** Any trader showing drift?
- **Committee-prep glance** (on committee-prep days only): the auto-deck draft, edits queued.
- **Floor walkaround** (if in office): five minutes of physical presence with the desk.

### 15.2 In-Market (Market-Hours)

Default mode: daily-supervision. Foveal: fleet dashboard + risk limits.

- **Anomaly triage.** Alerts that fire get triaged: route to trader, route to ops, route to legal, escalate to committee, or absorb (acknowledged, no action).
- **Cross-fleet correlation glance.** Periodic — typically 2–3 times per session — does the heatmap show any new hidden correlation?
- **Trader check-ins.** When behavioral telemetry flags drift or when a trader's fleet hits red, David pings the trader. Most of these resolve in a brief chat.
- **Allocation queue.** When proposed reallocations exist (drafted by David, awaiting co-sign), they sit in the queue for the right window.
- **Office work.** David spends material time in his office — committee prep, client calls, ad-hoc analytics. The desk is the physical center; the office is the planning center. Pager integration ensures he doesn't miss desk-level alerts.

24/7 nuance: for firms with crypto / FX / global rates exposure, the firm's automated cousins run all hours but David doesn't. Off-hours are pager-only; the platform has clear escalation rules for what escalates to the supervisor at night vs what waits.

### 15.3 Post-Market (Close-of-Primary-Region)

- **Daily post-trade.** Quick read of firm PnL attribution; any surprise contributors? Any divergence from expected behavior?
- **Limit-breach review.** Any breaches today? Resolution status?
- **Intervention review.** Any cross-trader interventions today? Ensure each has its post-trade write-up scheduled.
- **Behavioral triage.** Any conversations to schedule for tomorrow?
- **Tomorrow's agenda set.** Reallocations to propose, committee items to advance, traders to follow up with.

### 15.4 Weekly / Monthly / Quarterly / Annual

- **Weekly:** risk-committee deck (auto-prep + David edit + meeting); cross-fleet decay review with Quinn; behavioral round-up.
- **Monthly:** full risk committee; client letters; allocation review (planned reallocations actioned); strategy-class periodic reviews; counterparty-health full review.
- **Quarterly:** board risk-committee deck; kill-switch drill; full audit-trail spot-check; annual capacity and capital plan progress check; client review.
- **Annually:** firm-wide policy review; strategy-class catalog audit; counterparty / venue / protocol panel review; compensation cycle.

### 15.5 Committee-Cycle Driven Rhythm

David's calendar is structured around committees. Mondays and Wednesdays are typically committee-prep heavy. Thursdays / Fridays are planning days. Off-hours and weekends are pager-only with planned analytical windows on quiet weekends.

### 15.6 Why this matters

- **Efficiency:** rhythm is predictable and optimized for the committee cycle that drives institutional accountability.
- **Risk:** every cycle (daily / weekly / monthly / quarterly / annual) catches things at the right cadence.
- **PnL:** allocation cycles, sanctioning cycles, and decay cycles all run on disciplined schedules.

---

## 16. Differences from Manual Mode

| Dimension                      | Manual Mode                                                                    | Automated Mode                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Books overseen                 | ~13 traders, ~hundreds of positions aggregated                                 | ~13 traders × (50–500 strategies each) + 13 discretionary books + Quinn's overlay = 1,000–6,500 strategy instances + overlay  |
| Trades per day at firm         | hundreds                                                                       | tens of thousands                                                                                                             |
| Phase 1 (Decide)               | Capital allocation in spreadsheets + memos                                     | Allocation engine with marginal Sharpe, counterfactuals, regime-conditional caps                                              |
| Phase 2 (Enter)                | Rare manual override; capital changes via memo                                 | Allocation changes via engine workflow; overrides via cross-trader controls; emergency manual ticket preserved                |
| Phase 3 (Hold)                 | Read aggregation panels; walk floor; trader chats                              | Firm fleet dashboard with anomaly-driven alerts; trader tiles; cross-fleet correlation; live risk state; behavioral telemetry |
| Phase 4 (Learn)                | Weekly committee deck assembled by quant team; client letters drafted manually | Auto-prepared committee deck David edits; client letters auto-drafted; continuous post-trade retrospective                    |
| Time on charting               | Glanced for narrative; ~5%                                                     | Approximately the same (~5%) — narrative-only                                                                                 |
| Time on aggregation            | High — assembling the firm view from per-trader inputs                         | Low — aggregations precomputed; David reads, doesn't assemble                                                                 |
| Time on intervention           | Low — rare formal interventions                                                | Moderate — more interventions at smaller scope; behavioral conversations more frequent                                        |
| Time on committee / governance | Significant — committee prep, decks, meetings                                  | Significant but more efficient — auto-decks, structured workflows                                                             |
| Time on client / regulator     | Significant                                                                    | Same external time; less prep time                                                                                            |
| Latency criticality            | Low — supervisor decisions are deliberate                                      | Low — same; the platform is fast but the human is deliberate                                                                  |
| Risk units                     | Per-position notional and VaR aggregated                                       | Firm aggregate VaR, ES, factor exposures, concentration, unwind horizon, hidden-correlation flags                             |
| Edge metric                    | Firm Sharpe; capital efficiency                                                | Firm Sharpe; capital efficiency; cross-archetype factor balance; behavioral health                                            |
| Cognitive load                 | High — integrating in-head                                                     | High — different shape: navigating aggregations, interpreting anomalies, holding policy state                                 |
| Failure modes                  | Missed concentration; missed behavioral drift; ad-hoc interventions            | Missed hidden correlation; mis-tuned auto-triggers; over-reliance on alerts; under-questioning the aggregations               |
| Tools mastered                 | Spreadsheets, position dashboards, charting, comms                             | Allocation engine, firm fleet dashboard, limit hierarchy editor, model-risk views, kill-switch console, replay, auto-deck     |
| Compensation driver            | Firm Sharpe + risk-adjusted return                                             | Same; plus behavioral-health-of-fleet metrics; plus governance metrics (sanctioning velocity, audit completeness)             |
| Authorization workflow         | Sign-off on memos                                                              | Multi-key approvals; audited workflows; pre-authorized envelopes for auto-actions                                             |
| Audit trail                    | Standard trade audit + memo archive                                            | Continuous, machine-produced, regulator-ready; every intervention / change / approval signed and retained                     |
| Reporting cadence              | Weekly / monthly / quarterly                                                   | Same external cadence; continuously-prepared internal materials                                                               |

The fundamental change: **David's role is the same; his cognitive interface is different.** He still allocates, supervises, intervenes, and represents the firm. But aggregation is precomputed, anomalies are surfaced, interventions are workflowed, and audits are continuous. The supervisor's job becomes navigating the right surface at the right cadence rather than building the surface in his own head.

---

## 17. Coordination with Other Roles

David coordinates with **every** trader archetype, plus Elena (external client), plus the CIO / risk committee / board. His coordination surface is the largest in the firm.

### 17.1 Coordination with Each Trader Archetype

For each archetype, David's coordination shape is broadly similar:

- **Daily / weekly:** behavioral telemetry + fleet performance review + intervention follow-up.
- **Monthly:** allocation review; mandate-adherence review.
- **Quarterly:** strategy-class periodic review; capacity check; compensation cycle.

Archetype-specific notes:

- **Marcus (CeFi crypto)** — heavy on counterparty / venue concentration and 24/7 coverage handoffs; David's pager rules account for crypto-overnight events.
- **Julius (CeFi+DeFi hybrid)** — heavy on protocol risk, bridge state, governance event coordination; David co-owns kill triggers tied to bridge / oracle / governance state.
- **Mira (market making)** — heavy on inventory / venue-toxicity coordination; the surface that matters most is venue health and inventory headroom rather than alpha.
- **Sasha (vol)** — heavy on event-day coordination (FOMC, expiry); David and Sasha discuss event-window posture in advance.
- **Henry (equity L/S)** — heavy on factor-tilt coordination and discretionary-vs-systematic allocation balance; David monitors the discretionary book size deliberately.
- **Ingrid (rates)** — heavy on auction-day coordination; David and Ingrid discuss auction-day risk envelopes.
- **Yuki (FX)** — session-handoff coordination; David's pager rules account for Asia / EU / NY overlap windows.
- **Theo (energy)** — heavy on OPEC-headline coordination; David defines the human-override envelope vs the automated scope.
- **Naomi (event-driven)** — heavy on legal / compliance overlap; deal-pipeline-state reviewed monthly.
- **Diego (sports)** — match-day coordination; cluster capital allocation reviewed weekly.
- **Aria (prediction-markets)** — resolution-window coordination; cross-venue arb capacity reviewed.
- **Rafael (macro)** — theme-formation coordination; David is a sounding board for theme conviction at firm-relevant size.

### 17.2 Coordination with Quinn

Quinn is David's most-frequent peer. Their coordination:

- **Daily:** alert triage on flagged strategies; behavioral / drift queue review.
- **Weekly:** decay-queue review; promotion-gate decisions; cross-fleet correlation review.
- **Monthly:** strategy-class periodic reviews; allocation committee.
- **Quarterly:** strategy-class sanctioning lifecycle; capacity plan; firm-systematic overlay review.
- **Ad hoc:** any incident affecting multiple archetypes.

The division of labor: Quinn provides quant leadership; David provides risk leadership. They overlap deliberately on promotion gates, capacity, stress design, and cross-archetype concentration.

### 17.3 Coordination with Elena and Other External Clients

- **Quarterly meeting** — David presents firm performance, risk consumed, governance disclosures, model-risk policy status, capacity updates.
- **Off-cycle:** when Elena considers material subscriptions / redemptions / reallocations, David is on the call.
- **Reporting:** monthly client letter, quarterly governance disclosures, annual full review.
- **Transparency surfaces** — the platform exposes (with appropriate access controls) model-risk-policy posture, kill-switch policy summary, registered-model count and stage distribution. Elena can verify what David tells her.

### 17.4 Coordination with CIO / Risk Committee / Board

- **Daily ping** to CIO on material events.
- **Weekly risk committee** — formal meeting; auto-deck-driven.
- **Monthly committee** — broader scope; quarterly performance, allocation, capacity, lifecycle.
- **Quarterly board risk committee** — top-of-firm risk; existential scenarios; governance posture.
- **Annual board review** — full firm risk picture; capital plan; counterparty / venue / protocol panel; compensation policy.

David's role at these forums is advocate-of-risk-discipline-AND-translator-of-the-platform. The committee doesn't run the platform; David explains what it shows them.

### 17.5 Coordination with Compliance, Legal, Ops

- **Compliance daily** — sanctions screening, KYC state, mandate breaches, regulatory filings.
- **Legal as-needed** — any material counterparty / venue / protocol issue with legal dimension.
- **Ops daily** — settlement state, withdrawal queues, audit-trail completeness, incident response.

### 17.6 Coordination with Regulators

Not daily but important:

- **Scheduled examinations / audits** — David is the firm's primary regulator-facing voice on risk; the platform's audit trail and replay capability are key tools.
- **Material-incident reports** — any firm-wide kill, any counterparty failure, any major compliance event triggers regulator notification per applicable rules.
- **Voluntary disclosures** — strategic decisions about what to share proactively.

### 17.7 Why this matters

- **Efficiency:** structured coordination across many peers using shared platform views eliminates re-explanation.
- **Risk:** every relevant party gets the same source-of-truth; misalignments get caught.
- **PnL:** healthy cross-functional relationships keep the firm operating smoothly through stress; the platform makes them legible to all sides.

---

## 18. How to Use This Appendix

Use this appendix as the yardstick when evaluating a supervisory / firm-aggregate / model-risk / governance terminal for the David archetype. Walk each surface and ask:

### Data layer (firm-aggregate)

- Are firm-aggregate datasets (positions, PnL, greeks, factor exposures, capital state, intervention log) precomputed and continuously available?
- Is counterparty / venue / protocol health a first-class data domain with continuous monitoring?
- Are macro / regime indicators available with cross-archetype scope?
- Is the compliance / audit dataset continuous, complete, and exportable?
- Is data quality (drift / freshness / nulls) monitored on firm-aggregate datasets with alert routing to David?
- Can David trace any firm-aggregate number to its source via lineage in seconds?

### Feature library (firm-aggregate)

- Are firm-aggregate risk features (VaR, ES, gross / net / leverage / concentration) maintained?
- Are cross-archetype factor-tilt features computed?
- Are behavioral features per trader maintained (override rate, alert latency, promotion velocity)?
- Are counterparty / venue / protocol composite features maintained?
- Is mandate adherence a first-class feature?
- Can drift on firm-aggregate features trigger David's rail?

### Research workspace (firm-analytics)

- Can David run stress scenarios, allocation counterfactuals, capacity backtests interactively?
- Does the workspace prevent allocation-hindsight and stress-circularity anti-patterns?
- Are policy templates (stress / allocation / limit / behavioral / kill-trigger) provided?
- Is compute attached to the kernel without local-machine bottlenecks?
- Is reproducibility of David's analyses guaranteed (commit + data snapshot + parameters)?

### Model registry & experiment tracker (governance)

- Is there a firm-aggregate model registry view with stage / age / drift / capital-at-risk facets?
- Are model-risk policy parameters editable with audit and co-sign?
- Is cross-archetype model overlap detected and surfaced?
- Is model-failure incident queue maintained?
- Is reproducibility audit a routine spot-check the platform supports?

### Risk-limit hierarchy composition

- Is the full hierarchy editable with approval workflow?
- Are limit types comprehensive (notional / VaR / greek / leverage / concentration / drawdown / loss-rate / order-rate / behavioral)?
- Are effective limits computed continuously (minimum of node + ancestors)?
- Is headroom visualized with green / amber / red / crimson?
- Are limit changes audited with reason / signature / co-sign per threshold?

### Strategy class sanctioning lifecycle

- Is the strategy class catalog browsable with stage / archetype / capital authorization facets?
- Is the proposal-through-sanctioned workflow defined and enforced?
- Are periodic reviews scheduled and tracked?
- Is class retirement a defined process with archive?

### Capital allocation (firm-level)

- Does the allocation engine show marginal-Sharpe estimates with confidence bands?
- Can David draft, simulate, propose, and approve cross-archetype reallocations?
- Are per-asset-class and per-strategy-class budgets enforced?
- Are regime-conditional caps applied automatically when regime indicators trigger?
- Is counterfactual workspace flagged for realism limitations?
- Is in-flight capital tracked separately from deployed and free?

### Firm-wide fleet supervision

- Does the firm fleet dashboard surface aggregate, per-trader tiles, alert rail, and context in one screen?
- Can David drill from any tile to a trader's full fleet detail?
- Is anomaly detection running continuously across all dimensions (PnL divergence, mandate drift, intervention rate, cross-trader correlation, counterparty / venue / protocol degradation, compliance)?
- Is the cross-fleet correlation view maintained with hidden-correlation flags?
- Is firm live risk state (counterparty / venue / protocol exposure, margin, in-flight, audit) continuously available?
- Can David inspect any strategy in any trader's fleet on-demand with internal state and backtest-vs-live comparison?

### Firm-level intervention console & manual trading

- Can David act per-strategy / per-trader / per-archetype / per-strategy-class / per-venue / per-counterparty / per-protocol / firm-wide?
- Does each scope have its required authorization (single / co-sign / multi-key)?
- Does David have a manual ticket for emergency-hedge and reconciliation use cases with full pre-trade preview, mandatory reason, post-trade write-up?
- Is emergency mode available with multi-key activation?
- Are pre-authorized auto-kill triggers configurable and bounded?
- Is every intervention logged in a searchable / exportable audit?

### Post-trade & decay (firm-level)

- Is firm performance retrospective continuously available at all cadences?
- Is cross-trader / cross-class attribution reconcilable to firm total?
- Is decay tracked at archetype and class level?
- Is capital efficiency reviewed against allocation history with counterfactuals?
- Is behavioral retrospective per trader maintained?
- Is the risk-committee deck auto-prepared and editable?

### Supervisor console

- Is the layout 4-monitor friendly with foveal-aggregate and drilldown?
- Are mode-switches (daily / committee / allocation / incident / client / off-hours) explicit and supportive?
- Does the default state stay green and quiet?
- Is the office presentation display integrated with the desk console?

### Daily rhythm

- Does the platform support David's committee-cycle calendar without reinventing his calendar?
- Are off-hours / pager rules clearly defined?
- Are weekly / monthly / quarterly / annual cycles each supported with auto-prep?

### Coordination

- Are coordination surfaces with each trader archetype defined and shared?
- Is Quinn coordination a first-class set of recurring views?
- Are external-client transparency surfaces (Elena and equivalents) controlled and audit-logged?
- Are committee / board / regulator surfaces presentation-ready?
- Are compliance / legal / ops integrations operational?

### Cross-cutting

- Audit trail completeness across every action.
- Reproducibility across every analysis.
- Multi-key authorization where required.
- Pre-authorized envelopes for auto-actions clearly bounded.
- Manual override capability preserved and exercised in drill.

---

Gaps in any of the above may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones. The supervisor / risk terminal sits above the trading floor; its quality determines how well the firm absorbs surprise.
