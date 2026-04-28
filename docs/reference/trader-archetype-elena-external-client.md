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
