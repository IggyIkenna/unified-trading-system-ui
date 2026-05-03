# Persona — Elena Costa (External Client / Allocator)

A reference profile of an external client who allocates capital to the firm and consumes the **client-facing** side of the platform. She is not a trader. She is an investor. Her experience is the opposite end of the platform from Marcus, Julius, Mira, Sasha, and Quinn.

This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).
For the trader archetypes whose work Elena consumes, see the other `trader-archetype-*.md` files.
For the supervisor whose decisions surface to her, see [trader-archetype-david-pm-risk.md](trader-archetype-david-pm-risk.md).
For the 30 surfaces shared across the platform, see [common-tools.md](common-tools.md). Most of those surfaces do **not** apply to Elena — she has no order ticket, no positions blotter, no algos, no hotkeys, no kill switches. Where a shared surface does apply, it is consumed in a fundamentally different mode (read-only, scheduled, narrative-attached, tiered).

---

## Who Elena Is

**Name:** Elena Costa
**Role:** Senior Allocator / Investment Lead
**Organization:** Family office or institutional allocator (pension, endowment, sovereign wealth fund) with $5B – $50B AUM
**Capital invested with our firm:** $50M – $500M, in one or several share classes / strategies
**Style:** Long-horizon allocator. Reviews quarterly, attends manager meetings, oversees a portfolio of ~20 external managers.
**Sophistication:** High. She understands Sharpe, drawdowns, factor exposures, regime, attribution. She is not retail.

### How she thinks differently from a trader

Elena does **not** make trading decisions. She:

- **Selects and monitors managers** — chooses which firms to allocate to.
- **Allocates and rebalances** across managers based on performance, correlation, capacity.
- **Reports upward** — to her own CIO, board, beneficiaries.
- **Oversees risk** — but at the manager level, not position level.
- **Makes redemption / subscription decisions** — increase, decrease, or pull capital.

Her time horizon is **quarters and years**, not seconds. Her tolerance for poor data is **zero** — wrong numbers in a client report are a fireable offense, on either side.

### What she values

In rough order:

1. **Trust** — accuracy, transparency, predictability of communication.
2. **Performance** — net of fees, vs benchmark, vs peers.
3. **Risk discipline** — drawdowns within stated bounds, no surprises.
4. **Operational integrity** — funds where they should be, reporting on time, NAV correct.
5. **Narrative** — she has to explain to her board why returns are what they are.
6. **Access** — she can ask questions and get clear answers.

She does **not** value:

- Real-time tick data.
- Flashy charts or animation.
- Trader-side jargon (alpha, gamma scalping, vega).
- Granular position detail beyond what's relevant for risk discussion.

---

## Physical Setup

See [#30 Customizable Layout](common-tools.md#30-customizable-layout--workspace). **Elena-specific characteristics:** her "layout" is **multi-modal device adaptation**, not multi-monitor — desktop browser (primary), tablet (board meetings), mobile (NAV / alerts / recent comms glance), and email / PDF attachments she forwards to her own committee. She uses the platform **occasionally, not continuously** — once a day to glance at NAV, weekly for performance, monthly/quarterly for deeper review. Sessions are short. Information must be **front-loaded** so a 90-second glance is sufficient.

---

## Phase 1: "Decide" — allocate / rebalance / subscribe / redeem

For Elena, the decisions are: invest more, hold, reduce, redeem, switch share class.

### Performance summary view (her landing page)

When she logs in, the first screen is engineered for a **90-second glance**:

- **NAV today, change vs prior day, MTD, QTD, YTD, ITD (since inception).** Net of fees.
- **Capital invested today** — current balance.
- **Recent activity ribbon** — last subscription, last redemption, last fee accrual, last distribution.
- **Equity curve since inception** — see [#24 Equity Curve](common-tools.md#24-equity-curve). **Elena-specific characteristics:** fund-level only (never trader- or strategy-level unless contractually disclosed), benchmark overlay (BTC buy-and-hold, BTC perp funding, custom index, peer median — whichever is contractually agreed), windowing toggle, drawdown shading, no intraday resolution.
- **Benchmark comparison** — current period and ITD, with peer-median where data services provide it.

### Performance metrics (institutional-allocator detail)

Elena needs metrics that survive a board meeting, not trader-edge metrics:

- **Annualized return** (1y, 3y, 5y, ITD).
- **Volatility** (annualized).
- **Sharpe / Sortino.**
- **Max drawdown, current drawdown, time underwater.**
- **Worst month, worst quarter.**
- **Up-capture / down-capture vs benchmark.**
- **Hit rate** of positive months.
- **Correlation** to benchmarks and to her other holdings (if she has uploaded her portfolio).

These are **fund-level** numbers. There is no per-trade attribution and no per-trader breakdown.

### Strategy-level attribution (not trade-level)

Elena does **not** want trader-level attribution (vega vs theta). She wants:

- **By strategy** (e.g. "directional," "basis arb," "vol short," "yield strategies").
- **By underlying asset class** (BTC, ETH, alts, stables).
- **By regime** (bull / bear / chop) — explanatory narrative more than scientific.
- **Gross vs fees vs net.**

Each attribution row carries a **plain-language explanation** generated by the firm's PM team, not a raw factor decomposition.

### Risk overview (allocator-grade)

This is **not** the trader risk panel. It is the slice an external allocator is entitled to see:

- **Current exposure summary** — gross, net, leverage, vol target.
- **Risk capacity vs deployed.**
- **Stress test results** — "in a 2022-style drawdown, fund expected to lose X%."
- **Counterparty list** — anonymized or named per agreement; she wants to know "this fund deals with these CEXs and these protocols."
- **Liquidity profile** — how fast can the fund return capital if she redeemed.

Position-level granularity is **never** shown unless explicitly contracted.

### Manager information

- **Strategy description** — written, updated quarterly.
- **Team** — key personnel, recent changes.
- **Capacity status** — fund open / soft-closed / hard-closed.
- **Manager commentary feed** — letters, market notes, regime view, in the PM's voice; stamped with publication date and author.

### Subscription / redemption interface

A first-class capital-action surface, not buried in a settings page:

- **Submit subscription / redemption** with required documentation flow.
- **Share class selector** — and the implications of each (fee, lockup, gate).
- **Schedule** — next subscription / redemption windows, lockups, gates.
- **Pending requests** with status.
- **Capital call notifications** if applicable.
- **Documents** — subscription docs, redemption forms, KYC refresh requests.
- **Confirmation** at submission with reference number, expected effective NAV date, wire timeline, and SLA.

### Fee transparency

- **Management fee accrual** — running.
- **Performance fee accrual** — with high-water mark visible.
- **Fee schedule** by share class.
- **Fee paid YTD / ITD.**

**Layout principle for Decide:** front-load the most important numbers (NAV, performance, drawdown). Everything else is a click away. Mobile-friendly.

---

## Phase 2: "Enter" — placing capital actions

Her "enter" actions are entirely capital movements, not trades.

### Subscription / redemption / switch flows

Each is its own explicit, infrequent, high-stakes flow:

- **Subscription** — pick share class, specify amount, wire instructions (bank-integrated for institutions on the same network), KYC document upload if required, confirmation with reference number and expected effective NAV date.
- **Redemption** — pick amount and share class, acknowledge gates / lockups / fees, confirm wire destination, submit, receive confirmation and timeline.
- **Switch between share classes / strategies** — for multi-strategy firms, move capital between sleeves with appropriate fees and effective dates.

### Communication actions (schedule-a-call, ask-a-question, custom report)

- **Schedule a call** with investor relations or the PM, with calendar integration and agenda field.
- **Submit a question** with expected response-time SLA.
- **Request a custom report** for a CIO meeting — structured fields (period, metrics, format) and a tracked ticket.

### Audit trail of her own actions

Every subscription, redemption, switch, document uploaded, question submitted, call scheduled — visible with date, amount, status, and immutable history. This is **her** audit trail, separate from the firm's compliance trail (see Phase 4); she must be able to prove what she did, when, and why, to her own auditor.

**Layout principle for Enter:** infrequent, important actions. Every step is explicit, with confirmations and a clear paper trail.

---

## Phase 3: "Hold" — monitoring her allocation

Elena does not manage her allocation continuously. She glances at it.

### Cadenced views

- **Daily glance (mobile-friendly)** — NAV today and change, drawdown if any, any alerts (operational / performance / risk), any pending actions (documents to sign, calls scheduled).
- **Weekly** — week-to-date performance vs benchmark, letter / commentary if published, risk and exposure summary updated.
- **Monthly** — formal downloadable monthly statement (auditor-grade PDF), full performance report, strategy commentary (what worked / what didn't), notable events (strategy launches, retirements, personnel changes, capacity status).
- **Quarterly** — long-form quarterly letter (market and strategy outlook), published risk committee summary, calendared manager meeting, regulatory / compliance disclosures.

### Alerts (sparingly)

Elena does **not** want noisy alerts. She wants only:

- **NAV alerts** — large daily move.
- **Drawdown alerts** — fund crosses a stated threshold.
- **Operational alerts** — wire received, redemption processed, document required.
- **Strategic alerts** — capacity changes, fee changes, key personnel changes, fund-level events.
- **Personalized** — only what she's opted into. No marketing noise, no trader-grade tick alerts.

### Document vault

Every statement, K-1, 1099, sub-agreement, NDA, audit confirmation, commentary letter, signed wire instruction — searchable, downloadable, **retained forever**, with full access history (who viewed, when). This is the single source of truth for any document she has ever received from the firm.

### Communications log

See [#17 Communications](common-tools.md#17-communications-panel). **Elena-specific characteristics:** scheduled and asynchronous — not the trader's real-time comms. Every email, call note, meeting summary with the firm is logged, searchable, and retained forever, useful for "what did the PM say about Q3 vol exposure?". No live chat, no presence indicators. Recipients and viewership are recorded for audit. Marketing or unsolicited messages are excluded by design.

**Layout principle for Hold:** quiet by default. The platform should not feel like a trading screen. She should feel **informed without being overwhelmed**.

---

## Phase 4: "Learn" — review and reporting

Elena needs to **explain** to her own organization what's happening with this allocation.

### Reporting suite

See [#27 Reports](common-tools.md#27-reports). **Elena-specific characteristics:** she is a **client-tier consumer** of the firm's report engine — she receives the slice of output her share class entitles her to, never the firm's internal versions. Cadence is daily NAV / position summary (where contractually entitled), weekly performance update, monthly full report (performance, risk, attribution, exposures, narrative), quarterly letter (long-form, board-suitable), annual audited report, plus custom reports on request with SLA. Every report is delivered **multi-modally** — interactive web view, branded PDF (forwardable), Excel / CSV (for her own systems), and email digest on schedule. Reports must be print-ready and rework-free.

### Performance attribution narrative

Critically important: numbers without narrative are useless to her board. The reports must include:

- **What went right and why** in plain language.
- **What went wrong and why** in plain language.
- **What is being done about it.**
- **What to expect in current conditions.**

This is generated by the firm's PM team but surfaced through the platform.

### Custom dashboards & peer / benchmark comparison

- She can build views relevant to her CIO meetings, save them, share with her own team.
- Custom report request workflow tied through to delivery (structured ticket, SLA, format).
- Comparison vs contractual benchmarks, vs peer median where data services provide it, and vs her own portfolio of managers if she has uploaded it.

### Compliance, tax, and tiered access

See [#28 Compliance & Audit Trail](common-tools.md#28-compliance--audit-trail). **Elena-specific characteristics:** the entire platform applies **tiered access control to her data** — share class, sub-agreement, and entity scope determine every number she sees, every document delivered, every disclosure. Tax document delivery (K-1s, 1099s, equivalent international forms) is a first-class workflow with status tracking and audit confirmation. Regulatory filings (Form PF, AIFMD, etc.) are copied where applicable. Independent administrator's NAV sign-off is surfaced. Her view of compliance is **outcomes** — what she received, when, and that it is correct — never the firm's internal compliance machinery.

### Manager evaluation & prior-period comparison

- **Style consistency** — has the manager drifted from stated mandate?
- **Trade transparency** where contractually agreed; **operational due diligence** materials (recent audits, SOC reports, BCP).
- **YoY performance comparison** and **same-period regime fit** — "this fund has historically struggled in conditions like Q3."

**Layout principle for Learn:** print-ready, narrative-rich, integrated with her own systems. The fund's reporting is part of _her_ reporting.

---

## What Ties Elena's Experience Together

1. **Trust over flash.** Accurate, predictable, explained — not flashy.
2. **Front-loaded summaries.** Most important info first; she has 90 seconds.
3. **Multi-modal access.** Web, mobile, PDF, email digests, Excel exports.
4. **Quiet by default.** Alerts only for what truly matters; no marketing noise.
5. **Narrative attached to numbers.** Explanations in the manager's voice, not just metrics.
6. **Document-vault discipline.** Every statement, contract, communication is retrievable forever.
7. **Audit trail of her own actions.** She must be able to prove what she did, when, and why.
8. **Regulatory and tax integration.** Reports she can hand to her auditor without rework.
9. **Tiered access.** Granular control over what data she sees per share class / agreement — non-negotiable.
10. **Operational excellence is the product.** Late wires, wrong numbers, missed reports — these end relationships. The platform must make these impossible.

---

## What She Should Never See

Important inverse list — things the platform must **hide** from her:

- Other clients' positions, capital, or identities.
- Trader names or trader-level PnL (unless agreed).
- Position-level granularity beyond what's contractually agreed.
- Internal risk discussions she's not entitled to.
- Other share classes' fee terms.
- Pre-public commentary, drafts, or internal notes.
- Operational dashboards (latency, infra, etc.) — her concern is outcomes, not plumbing.
- The trader-facing surfaces themselves: order ticket, working orders, hotkeys, algos, kill switches, replay, TCA, behavioral analytics, heatmap of own book. None of these belong on a client screen.

Tiered access and data segregation are non-negotiable.

---

## How to Use This Document

When evaluating any client-facing surface (including our own), walk through Elena's four phases and ask:

- Does the landing page front-load the right summary numbers in <90 seconds of glance?
- Is performance reporting (web + PDF + Excel + email) at institutional quality?
- Is the subscription/redemption flow auditable, with confirmations and SLA?
- Are alerts scoped tightly to what an allocator needs?
- Is narrative — written explanation in the manager's voice — attached to performance numbers?
- Is access tiered correctly so she sees only her own data, scoped to her agreement?
- Is everything retrievable forever (statements, documents, communications)?
- Is the experience usable on mobile and exportable into her own workflow?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.

---

# Automated Mode (Short Note)

This is intentionally a **short note**, not a full appendix. Elena is not a trader; she does not run strategies, does not operate a research workspace, does not promote models, does not size a fleet, does not intervene on running strategies, and does not place manual orders. The 18-section automated-mode appendix that other archetypes carry — see Marcus as the worked example in [trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md) — almost entirely does not apply to her.

What changes for Elena when the firm she allocates to runs more of its book systematically is **what she can be told about how that systematic side is governed**, plus a small set of new line items inside reports she already receives. Her four phases (Decide / Enter / Hold / Learn) keep their existing shape from the manual sections above.

For the universal automated-platform concepts that her firm now operates against, see [automation-foundation.md](automation-foundation.md). The relevant part for Elena is not the trader's research workspace or model registry — it is the **governance surface that wraps them**.

> _Throughout this note, examples are illustrative — actual disclosure shapes, committee cadences, and report fields will differ per share class, jurisdiction, and contract. The platform's real client-tier catalog will differ._

## What Elena's Experience Becomes

The four phases do not change. The content inside them changes only in narrow, specific ways.

- **Decide stays Decide.** She still allocates, rebalances, subscribes, redeems. Her decisions are still about managers and share classes, not strategies. The performance-summary view, the institutional metrics, the strategy-level (not trade-level) attribution, and the risk-overview slice from her existing Phase 1 sections remain the surfaces she lives in.
- **Enter stays Enter.** Subscription / redemption / share-class switch flows are unchanged. Capital actions are still the only "orders" she places.
- **Hold stays Hold.** Daily-glance, weekly, monthly, quarterly cadence is unchanged. She is still summoned by NAV / drawdown / operational alerts, never by strategy-level events.
- **Learn stays Learn.** The reporting suite is the same multi-modal product (web view + branded PDF + Excel + email digest), with the same tiered access controls and the same audit trail of her own actions.

What is genuinely **new** in the automated world fits into Hold and Learn as additional content, not as new phases or new surfaces.

## What Stays Human for Elena

Automation on the firm side does not move any of her judgment surfaces.

- **Every redemption / subscription decision** — still hers. The platform never proposes a capital action on her behalf.
- **Every manager-evaluation call** — still hers. Style-consistency reads, regime-fit interpretation, "do we still believe in this manager" — these are not delegated to a model on her end.
- **Her own portfolio construction across 20+ external managers** — still hers. The platform shows her this firm's slice; her cross-manager allocation is her CIO's process, not the firm's.
- **Board narrative.** Translating "the systematic book had a 4% drawdown in Q3" into a board-suitable explanation is her work. The platform supplies the narrative inputs (see below); the framing for her own committee stays her.

## What's Added: Transparency Into Systematic Governance

The new content Elena gets, on top of her existing reports, is **disclosure into the governance machinery the firm now runs internally**. This is a client-tier slice, not the firm's internal version.

- **Model-risk governance summary.** A periodic disclosure (typically quarterly, attached to her quarterly letter) describing how the firm sanctions strategy classes, gates promotion from paper → pilot → live, monitors decay, and retires strategies. Plain-language; no model code, no feature names, no per-strategy detail. Names the committee, the cadence, and the firm officers accountable.
- **Kill-switch and circuit-breaker policy.** A written description of what kill-switches exist, at what scope (strategy / class / venue / fleet / firm), who can pull them, and under what conditions they are pulled automatically. She wants to know: in a Binance-style incident or a stablecoin depeg, what does the firm do, in what order, and who decides. Operational outcomes, not implementation.
- **Model-version registry disclosure.** Not the registry itself — she does not browse models. A periodic summary: "this share class's capital is exposed to N strategy classes across M model versions; in Q3, K models were retrained, J were retired, P new classes were sanctioned, Q sanctioning votes were declined." Aggregate counts with narrative. Tied to her share-class entitlement.
- **Fail-over and recovery policy.** Disclosure of what happens when the firm loses a venue connection, a market-data feed, or a co-located process. What is the recovery time objective; what is the policy if recovery exceeds it; how does the firm communicate to clients during an incident.

Every disclosure is **outcomes and policy**, never implementation detail. Elena does not see model code, feature definitions, strategy parameters, training data, experiment-tracker entries, or live fleet state. Her view of governance is the same shape as her view of compliance (see Phase 4 above): she sees that it is happening and that it is correct, never the firm's internal machinery.

## What's Added: Reports Describing How Her Capital Is Risk-Managed

Inside her existing monthly and quarterly reports, the systematic side gets new line items.

- **Systematic-side risk decomposition.** Within her existing risk overview, the systematic book is broken out as its own column: gross / net / leverage / vol target / max drawdown contribution / stress-test result. Comparable shape to the discretionary side, so a board member can read both at a glance.
- **Strategy-class-level attribution.** Her existing strategy-level attribution (directional / basis arb / vol short / yield) gains a row for each systematic strategy class her share class is exposed to, with the same plain-language explanation generated by the firm's PM team. Not per-strategy-instance — per-class.
- **Counterparty / venue / protocol risk reporting (expanded).** Her existing counterparty list expands. The firm now interacts with more venues (each automated execution adapter is a counterparty), more data providers (each licensed feed is a vendor relationship), and — for hybrid funds — more on-chain protocols (each DeFi integration is a smart-contract counterparty). The expanded report names the venues, anonymizes or names per agreement, and surfaces venue-health indicators (custody concerns, regulatory state, recent incidents) as the firm sees them.
- **Backtest-vs-live divergence at fund level.** The firm tracks whether deployed strategies are tracking their backtested expectations (see Marcus's section 11.6 for the trader-side surface). At fund level, this becomes a simple disclosure: "% of deployed strategies tracking within tolerance of their backtest." A leading indicator of regime drift, written in narrative form.

These additions are inside her existing reports. They do not create new screens, new alerts, or new cadences for her.

## Periodic Model-Risk Committee Deliverables

A new artifact in Elena's document vault: the firm's **model-risk committee summary**, typically quarterly, signed by the committee chair.

- **Cadence:** quarterly by default; ad hoc after material incidents.
- **Contents:** sanctioning decisions made in the period, retirements executed, material model changes, incidents and root-cause summaries, policy changes adopted, forward-looking watchpoints.
- **Format:** branded PDF in her vault, summarized in her quarterly letter, with the full document accessible per her share-class entitlement. Multi-modal delivery (web view + PDF + email digest) on the same channel as her existing letters.
- **Audit posture:** treated like her audited annual report — once published, immutable in her vault, full access history recorded.

She will rarely read it cover-to-cover. She needs to be able to **hand it to her own auditor or board on demand**, and she needs to know it exists. That is the bar.

## What Does Not Change

Reiterating, because the negative space is the point.

- **Same multi-modal report delivery.** Web + PDF + Excel + email digest. See Phase 4.
- **Same tiered access controls.** Share class, sub-agreement, and entity scope determine every number she sees, including every governance disclosure listed above. See [#28 Compliance & Audit Trail](common-tools.md#28-compliance--audit-trail).
- **Same audit trail of her own actions.** Every disclosure she views, every report she downloads, every committee summary she opens — recorded, with her existing audit trail (Phase 2) extended over the new content.
- **Same alert discipline.** No new alert categories. Governance disclosures are scheduled artifacts, not paged events. If a firm-wide kill-switch fires in a way that affects her share class, that is an **operational alert** under her existing policy — not a new "model-risk alert."
- **Manual trading section: does not apply.** Elena has no order ticket. The trader-side intervention console (see Marcus's section 12) is invisible to her by design.
- **Strategy state inspection: does not apply.** The trader-side internal-state surface (see Marcus's section 11.6) is invisible to her by design. Her view of strategies stops at strategy-class attribution.

## Daily Rhythm

Unchanged from her existing manual sections (Phase 3 — daily glance, weekly, monthly, quarterly). The new governance content surfaces in the **monthly** and **quarterly** ribbons, not in the daily-glance ribbon. A quarter end is when the model-risk-committee summary lands; a month end is when systematic-side decomposition is refreshed inside her standard report. Daily is still NAV / change / drawdown / operational alerts.

## Coordination

- **With David's office.** Transparency disclosures originate from David's firm-level supervisor surfaces (see [trader-archetype-david-pm-risk.md](trader-archetype-david-pm-risk.md), section 17 of his appendix where applicable). Elena's quarterly model-risk-committee summary is, in effect, a client-tier projection of David's committee deck. The platform must enforce that the projection is **outcomes only** — names of strategy classes, aggregate counts, incident summaries — never the firm's internal risk decompositions, internal attribution splits, or other clients' exposures.
- **With investor relations.** IR is still her primary point of contact. The schedule-a-call / submit-a-question / request-a-custom-report flows from her existing Phase 2 absorb the new content (she may now ask: "walk me through the model-risk summary" or "explain the Q3 backtest-vs-live number"). IR coordinates with the PM and David's office on the response; Elena sees a single contact surface.
- **With her own CIO and board.** Outside the platform. The platform's job is to make the governance content **forwardable** (PDF, Excel, email digest) into her own committee process. Same principle as her existing reporting: the fund's reporting is part of _her_ reporting.

## Why This Matters

- **Trust.** The single most important currency in Elena's relationship with the firm. Disclosing the governance surface — even at a coarse, outcomes-level grain — converts "trust the manager" into "trust the manager and verify the policy." Allocators with serious internal risk processes increasingly require this.
- **Risk discipline she can defend.** Her board will ask "how is the firm preventing a runaway algo?" once they know the firm runs algorithms. The kill-switch policy disclosure and model-risk committee summary are her board answer. Without them, she has only the PM's voice.
- **Operational integrity at the new attack surface.** The systematic side has more counterparties (venues, data vendors, protocols). Her counterparty / venue / protocol risk report expanding is not cosmetic — it tracks the actual surface area of the operation she has capital in.
- **No new operational burden.** None of this adds a new screen, a new alert, a new cadence, or a new login step for her. The principle that the platform should feel **quiet by default** is preserved. The new content rides inside the existing reports and the existing vault.
