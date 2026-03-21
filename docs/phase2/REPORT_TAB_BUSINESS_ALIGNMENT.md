# Report Tab — Business Alignment Assessment (Phase 2g Addendum)

**Date:** 2026-03-21
**Context:** The Report tab exists to serve **back-office staff and admins** who need to: generate invoices, produce settlement reports, share performance data with stakeholders/investors, and handle regulatory reporting. Mock data shapes mirror the real API responses.

---

## Business Purpose vs Current UI — Verdict by Page

### 1. P&L Page (`/service/reports/overview`) — MOSTLY ALIGNED, some misplacement

**Who uses this:** Back-office admin preparing client performance summaries, generating reports for investors, tracking settlements and invoices, and monitoring treasury/capital.

**What the page has today (5 in-page tabs):**

| In-Page Tab | Content | Aligned to Report Purpose? | Notes |
|-------------|---------|---------------------------|-------|
| **Portfolio** | Client portfolio summary — AUM, MTD, YTD, Sharpe per client | **YES** — Back-office needs this to prepare investor reports. EntityLink drill-down to client detail is correct. | Good: org/client filter from context-bar scopes data correctly. |
| **Reports** | Generated report list — status (ready/generating/sent), download, send | **YES** — Core back-office workflow: generate → review → download → send to investor. Status lifecycle (generating → ready → sent) is exactly right. | The most directly aligned tab for report distribution. |
| **Settlements** | Settlement records — pending/confirmed/settled, amounts, due dates | **YES** — Back-office tracks profit-share settlements per client. The "Confirm" button on pending settlements is correct back-office action. | Good data shape. Missing: batch confirm, settlement period selector. |
| **Invoices** | Invoice list — paid/pending status, amounts, download | **YES** — Invoice generation and tracking is core back-office. "New Invoice" button is correct. | Missing: invoice template selection, line-item breakdown, payment reminder action. |
| **Treasury** | Capital allocation by venue (free/locked/total), recent inter-venue transfers | **PARTIALLY** — Treasury visibility is useful context for back-office (explains cash positions for settlement). But capital allocation and inter-venue transfers are more of a **trader/risk** concern. | Consider: treasury view belongs under Run (trading) or Observe (risk) lifecycle. Back-office needs to see cash available for settlements, not manage inter-venue transfers. |

**Summary KPI cards:**

| KPI | Purpose | Aligned? |
|-----|---------|----------|
| Total AUM | Headline for investor reports | YES |
| Avg MTD Return | Performance summary for stakeholders | YES |
| Pending Settlement | Back-office action needed — money to collect/distribute | **YES — best KPI here** |
| Reports This Month | Activity volume | YES |

**Assessment:** The P&L page is well-designed as a back-office reporting hub. The Portfolio, Reports, Settlements, and Invoices tabs directly serve the reporting workflow. The Treasury tab is the one area where content drifts from the reporting purpose — capital allocation and inter-venue transfers are operational/trading concerns, not reporting/invoicing.

---

### 2. Executive Page (`/service/reports/executive`) — ALIGNED, different audience

**Who uses this:** Principals, CIOs, investors receiving reports, or back-office staff preparing the executive-level summary.

**What the page has today:**

| Component | Content | Aligned? | Notes |
|-----------|---------|----------|-------|
| NL Query ("Ask Your Portfolio") | Natural language questions about strategy performance | **YES — standout feature** | Investors and executives love this. "What was the Sharpe of my DeFi basis strategy in Q4?" is exactly the kind of question an LP would ask. |
| KPI Cards (AUM, P&L, Strategies, Sharpe) | High-level portfolio metrics | **YES** | These are the numbers that go into quarterly investor letters. Strategy multi-select lets you slice by strategy. |
| NAV vs Benchmark chart | Performance attribution | **YES** | Standard investor reporting chart. |
| Strategy Allocation pie | Where capital is deployed | **YES** | Investors want to know allocation. |
| Monthly P&L vs Target | Are we hitting targets? | **YES** | Board/exec reporting metric. |
| Client Reports tab | Per-client AUM + P&L + "Generate Report" | **YES** | Back-office generates per-client reports from here. |
| Allocation tab | Placeholder | TBD | Needs: detailed allocation breakdown for investor deck. |
| Documents tab | Recent docs (investor letter, presentations, memos) | **YES** | Document library for sharing with stakeholders. |

**Assessment:** The Executive page is correctly positioned as the investor/stakeholder-facing reporting surface. The NL query feature is a genuine differentiator. The period selector (MTD/QTD/YTD/1Y/Inception) and strategy multi-select are the right controls for this audience. The "Export Report" button in the header is exactly what back-office needs to produce PDF investor reports.

**One gap:** The Executive page uses its own mock data set (navHistory, availableStrategies, clientSummary) that is completely separate from the P&L page's mock data (allPortfolioSummary, allReports). When APIs are connected, these should pull from the same backend — an investor viewing the Executive dashboard and back-office viewing the P&L page should see consistent numbers for the same client/period.

---

### 3. Settlement Page (`/service/reports/settlement`) — PLACEHOLDER, plan is aligned

**Planned content:** Settlement dashboard by venue, pending vs completed, settlement breaks, fee reconciliation, funding rate history.

**Business alignment assessment of PLANNED content:**

| Planned Feature | Back-Office Need | Aligned? |
|-----------------|-----------------|----------|
| Settlement dashboard by venue | Track which venues have pending settlements | YES |
| Pending vs completed | Core workflow: action pending, archive completed | YES |
| Settlement breaks | Discrepancies that need manual resolution | YES |
| Fee reconciliation | Verify fee charges match mandate terms | YES |
| Funding rate history | Context for DeFi funding settlements | PARTIAL — more trading context than back-office |

**Note:** The P&L page already has a "Settlements" in-page tab with settlement data (5 records, pending/confirmed/settled). When the Settlement page is built, the P&L page's settlements tab should become a summary view that links to this full page for detail. Don't duplicate settlement management across two places.

---

### 4. Reconciliation Page (`/service/reports/reconciliation`) — PLACEHOLDER, plan is aligned

**Planned content:** Position & P&L reconciliation between internal records and venue-reported data — break counts, auto-resolution, manual review queue, historical trends.

**Business alignment:** Directly serves back-office. Reconciliation is a daily back-office task: compare what our system says vs what the exchange says, resolve breaks. This is correctly placed under Report.

---

### 5. Regulatory Page (`/service/reports/regulatory`) — PLACEHOLDER, plan is aligned

**Planned content:** FCA reports, transaction reporting (EMIR/MiFID II), best execution analysis, SAR tracking.

**Business alignment:** Regulatory reporting is clearly a back-office/compliance responsibility. This belongs here. The Manage tab has a "Compliance" link — need to clarify: Compliance under Manage = FCA info page (static), Regulatory under Report = actual report generation and submission tracking. They serve different purposes.

---

## Cross-Page Workflow Assessment

### Does the tab order make sense for back-office daily work?

Current tab order: **P&L → Executive → Settlement → Reconciliation → Regulatory**

**Back-office daily workflow:**

1. Morning: Check P&L (overview) — what happened overnight, any pending settlements
2. Review pending settlements → confirm or escalate
3. Run reconciliation — compare positions/P&L vs venue data
4. Generate/send client reports
5. Executive dashboard — prepare for investor calls
6. Regulatory — periodic (monthly/quarterly) compliance submissions

**Assessment:** The tab order roughly follows frequency of use:
- P&L (daily) → Executive (weekly/monthly) → Settlement (daily) → Reconciliation (daily) → Regulatory (periodic)

**Recommendation:** Consider reordering to match daily workflow priority:

| Current Order | Suggested Order | Rationale |
|---------------|----------------|-----------|
| 1. P&L | 1. P&L | Same — daily landing page, correct |
| 2. Executive | 2. Settlement | Daily task — confirm pending settlements |
| 3. Settlement | 3. Reconciliation | Daily task — resolve breaks |
| 4. Reconciliation | 4. Executive | Weekly/monthly — investor reporting |
| 5. Regulatory | 5. Regulatory | Periodic — no change |

This puts the two daily action-oriented tasks (Settlement, Reconciliation) immediately after the overview, and pushes the more periodic/presentation tasks (Executive, Regulatory) further right. However, this is a preference — the current order is also defensible since it groups "viewing" (P&L, Executive) before "processing" (Settlement, Reconciliation, Regulatory).

---

## Component-Level Alignment Findings

### Things that ARE correct for back-office:

| Component / Pattern | Where | Why It Works |
|---------------------|-------|-------------|
| Client filter (useContextState) | P&L page | Back-office filters by org/client to scope reports — this is exactly how they work |
| EntityLink (type="client") | P&L portfolio tab | Click client name → drill into client detail for reporting |
| EntityLink (type="settlement") | P&L settlements tab | Click settlement → view detail (when settlement detail page exists) |
| Report status lifecycle (generating → ready → sent) | P&L reports tab | Matches the real workflow: system generates report, admin reviews, admin sends to investor |
| Download + Send buttons per report | P&L reports tab | Core actions: download PDF locally, send to investor via email |
| "Confirm" button on pending settlements | P&L settlements tab | Back-office action: approve settlement for processing |
| Invoice status (paid/pending) | P&L invoices tab | AR tracking is back-office core |
| Period selector (MTD/QTD/YTD/1Y) | Executive page | Investors ask about different periods |
| Strategy multi-select | Executive page | "Show me just Crypto Arbitrage and DeFi Yield performance" |
| NL query | Executive page | Differentiator — answer ad-hoc investor questions without building custom reports |
| "Generate Report" per client | Executive clients tab | Produce per-client investor report on demand |
| Documents library | Executive documents tab | Share investor letters, presentations, memos |

### Things that need attention:

| Issue | Where | What's Wrong | Severity | Recommendation |
|-------|-------|-------------|----------|---------------|
| **Treasury tab misplacement** | P&L page, Treasury in-page tab | Capital allocation by venue and inter-venue transfers are operational/trading concerns, not back-office reporting. Back-office needs to see "is there enough cash to settle?" not "what's locked on Aave V3" | P2 | Move treasury to Run (trading) or Observe lifecycle. Replace with a simpler "Cash Available for Settlement" summary if cash context is needed on the Report tab. |
| **P&L settlements tab duplicates Settlement page** | P&L page "Settlements" in-page tab vs Settlement page tab | When Settlement page is built, there will be two places showing settlement data. Confusing for back-office: "which one do I use?" | P2 | P&L settlements tab should become a summary (top 5 pending, total pending amount) with a "View All →" link to the full Settlement page. Same for Invoices if an Invoicing page is ever added. |
| **Executive page data disconnected from P&L** | Executive dashboard mocks vs P&L mocks | Executive has its own clientSummary (Odum Capital, Meridian Fund...) while P&L has allPortfolioSummary (Delta One Desk, Quant Fund...). Different client names, different data. | P2 | When APIs connect, both must pull from the same backend. For mock data, align the client names and figures so a demo walk-through from P&L → Executive shows consistent data. |
| **No "scheduled reports" concept** | P&L reports tab | Back-office typically schedules recurring reports (daily performance at 7am, weekly P&L every Monday, monthly report on 1st). Current UI only shows ad-hoc generation. | P3 | Add a "Scheduled" sub-section or filter to the Reports tab showing recurring report schedules with next-run time. |
| **No audit trail on settlements** | P&L settlements tab | When back-office clicks "Confirm" on a settlement, there's no visible audit trail (who confirmed, when, from which IP). Compliance requires this. | P2 | Settlement items should show confirmation timestamp and confirmer when status = "confirmed" or "settled". |
| **No payment reminder on invoices** | P&L invoices tab | Pending invoices just show status. Back-office needs a "Send Reminder" action for overdue invoices. | P3 | Add "Send Reminder" button for pending invoices, similar to how reports have a "Send" button. |
| **Allocation tab is empty placeholder** | Executive page "Allocation" tab | The text says "Detailed allocation breakdown and rebalancing tools" but rebalancing is a trading action, not a reporting action. | P3 | Rename to "Allocation Report" and make it generate a downloadable allocation breakdown (PDF/Excel) for investor distribution, not a rebalancing tool. |
| **Document dates are stale** | Executive documents tab | Documents show dates from 2024 (Jun 30, 2024, Jul 5, 2024). Mock data should show current period (2026) to match the rest of the UI. | P3 | Update mock dates to 2026 for consistency. |
| **No report preview** | P&L reports tab | Download/Send buttons exist but no way to preview a report before sending to an investor. Back-office wants to review content before distribution. | P2 | Add a preview action (eye icon) that opens a dialog or side panel with the report content. |

---

## Placeholder Pages — Are the Plans Sensible?

| Page | Planned Content | Verdict |
|------|----------------|---------|
| **Settlement** | Dashboard by venue, pending/completed, breaks, fee recon | **Good.** Covers the core settlement workflow. Add: batch operations (confirm multiple), settlement period selector, export to CSV for bank reconciliation. |
| **Reconciliation** | Break counts by venue, auto-resolution, manual review queue, trends | **Good.** This is exactly what back-office reconciliation looks like. Add: priority sorting (highest $ break first), assignment (assign break to team member), SLA timer (break open for >24hrs gets flagged). |
| **Regulatory** | FCA reports, EMIR/MiFID II, best execution, SAR tracking | **Good.** Regulatory reporting is correctly scoped. Add: submission calendar (deadlines), submission status (submitted/acknowledged/rejected), template management. Distinguish from Compliance page under Manage tab (that's the static FCA info, this is active submission tracking). |

---

## Manage Tab vs Report Tab — Boundary Clarity

| Responsibility | Where It Should Live | Current State |
|---------------|---------------------|---------------|
| Client CRM (add/edit clients, contact info) | Manage → Clients | Correct |
| Mandate terms (fee structure, investment limits) | Manage → Mandates | Correct |
| Fee configuration (rate, tiering) | Manage → Fees | Correct |
| Fee CALCULATION and invoicing | Report → Invoices | Correct — Report generates invoices based on Manage's fee config |
| Compliance rules (static FCA requirements) | Manage → Compliance | Correct |
| Compliance REPORTING (file submissions) | Report → Regulatory | Correct — Report submits based on Manage's compliance config |
| Client performance for INTERNAL tracking | Manage → Clients (mandate performance) | OK |
| Client performance for INVESTOR distribution | Report → P&L / Executive | Correct |

**The boundary is clean:** Manage = configure (clients, mandates, fees, rules). Report = produce and distribute (reports, invoices, settlements, regulatory filings). No major overlap.

---

## Final Verdict

The Report tab is **well-aligned** to its back-office purpose. The two built pages (P&L and Executive) have the right components for report generation, settlement tracking, invoicing, and investor communication. The three placeholder pages have sensible plans.

**Priority fixes:**

1. **P2 — Treasury tab misplacement:** Move to Run/Observe or simplify to "cash for settlement"
2. **P2 — Prevent P&L/Settlement duplication:** Make P&L settlements tab a summary linking to full Settlement page
3. **P2 — Mock data consistency:** Align Executive and P&L client names/figures for demo coherence
4. **P2 — No report preview:** Add preview before sending to investors
5. **P2 — No settlement audit trail:** Show who confirmed and when
6. **P3 — No scheduled reports, no payment reminders, stale document dates, allocation tab misnaming**
