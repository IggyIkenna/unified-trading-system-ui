# Phase 2c: Promote Tab — Workflow & UX Fitness Assessment

**Audit date:** 2026-03-21
**Repo:** unified-trading-system-ui
**Companion to:** `PROMOTE_TAB_AUDIT.md` (structural/navigation audit)

---

## Business Context

The Promote tab facilitates a multi-stage process where the trading team:

1. Reviews strategies/models/executions developed during Build
2. Decides which candidates meet requirements
3. Promotes passing candidates to testnet with smaller amounts
4. Monitors testnet results over several days (execution, drawdowns, slippage)
5. Compares backtest results vs live testnet results
6. If aligned, promotes to full live trading

The UI must make this process easy, visible, and auditable. Mock data mirrors real backend schemas — the assessment is whether the components on each page and the connections between them facilitate this workflow.

---

## Promote Workflow Stages vs Page Coverage

The real-world promote process has these stages. Each needs to be supported somewhere in the 4 Promote pages:

| Stage | What happens | Supported? | Where | Quality |
|-------|-------------|:---------:|-------|---------|
| 1. Queue candidates | Strategies/models from Build enter the review queue | **Yes** | Candidates page | Good — pending/resolved split, rationale shown |
| 2. Team reviews metrics | Reviewer looks at backtest Sharpe, returns, drawdown, etc. | **Yes** | Candidates page — metrics grid | Good — 6 key metrics per candidate |
| 3. Review comments/discussion | Team discusses, adds notes | **Yes** | Candidates page — comment dialog | Adequate — comment thread exists but is basic (no @mentions, no threads) |
| 4. Analyze execution quality | Check slippage, market impact, timing cost from backtests | **Yes** | TCA page | Good content, but disconnected from candidates (no link from candidate → its TCA) |
| 5. Risk assessment | VaR, drawdown limits, position concentration, correlation | **Partial** | Risk page (portfolio-wide) + Handoff page (5 pre-baked checks) | Risk page is portfolio-level, not candidate-specific. Handoff has candidate-specific risk checks but they're hardcoded |
| 6. Promote to paper/testnet | User clicks promote, strategy goes to paper trading | **Yes** | Candidates page — "Promote to Paper" button | Action exists, workflow stages visualized |
| 7. Monitor testnet performance | Compare testnet execution vs backtest expectations over days | **No** | Not covered by any page | **Gap** — no testnet monitoring dashboard |
| 8. Compare backtest vs testnet | Side-by-side: expected drawdown vs actual, expected slippage vs actual | **No** | Not covered by any page | **Gap** — the core validation step has no UI |
| 9. Final approval chain | Quant Lead, Risk Manager, CTO sign off | **Yes** | Handoff page — approval chain | Good — multi-role approval chain with status |
| 10. Promote to live | Final action with deployment options | **Yes** | Handoff page — promote button + deployment switches | Good — shadow trading, auto-rollback, gradual rollout |

---

## Page-by-Page Workflow Fitness

### Page 1: Candidates (Review Queue) — GOOD FIT

**What it does well for the workflow:**

- Pending vs Resolved split clearly shows queue state
- Workflow stage visualization (Pending → In Review → Approved → Promoted) directly maps the promote lifecycle
- 6 metrics per candidate (Sharpe, Return, Max DD, Sortino, Hit Rate, Profit Factor) are exactly the right metrics for a promote decision
- "Promote to Paper" and "Promote to Live" are distinct actions reflecting the real two-stage promote process
- Reject with the option to comment provides audit trail
- Review comments create a discussion record
- Rationale field shows why the candidate was selected
- Version tracking (`v{configVersion}`) tracks which config iteration is being promoted
- "Selected by" + date gives attribution
- Empty state guides the user ("Add candidates from the Backtests page") — correct upstream link

**What's missing or could be better:**

| Gap | Impact | Severity |
|-----|--------|----------|
| No link from candidate to its TCA data | User can't click a candidate to see its execution quality analysis. Must navigate manually. | P2 |
| No link from candidate to its risk profile | Same — risk review for a specific candidate requires a separate manual step | P2 |
| No "testnet monitoring" status for promoted candidates | Once a candidate is promoted to paper, there's no way to see its testnet results from this page. The "Promoted" stage in the workflow viz is terminal — no further tracking. | P1-gap |
| Promote to Paper immediately sets state to "approved" | The `promoteCandidate` function sets `reviewState: "approved"` regardless of target. Promoting to paper should keep it in a "testing" state, not "approved". | P2 |
| No allocation size input for testnet promotion | When promoting to testnet with "smaller amounts", there's no UI to specify the allocation size or the test duration | P2 |
| Comment dialog uses a single-line Input, not Textarea | Review comments can be substantial. A single Input field is limiting for real review discussion. | P3 |
| No filter/sort on candidates | With many candidates, users can't filter by status, strategy type, or sort by Sharpe/return | P3 |

---

### Page 2: Execution Analysis (TCA) — GOOD FIT, WRONG CONTEXT

**What it does well for the workflow:**

- Transaction cost breakdown (Spread, Market Impact, Timing Cost, Fees) shows exactly what affects execution quality
- Execution timeline chart (Price vs VWAP vs TWAP) visualizes execution path
- Benchmark comparison (vs Arrival Price, VWAP, TWAP, Implementation Shortfall) quantifies execution quality
- Slippage distribution histogram shows historical pattern
- Per-order drill-down allows examining individual executions
- Time range selector (1D, 1W, 1M) allows different analysis windows

**What's missing or could be better:**

| Gap | Impact | Severity |
|-----|--------|----------|
| Not scoped to a specific candidate/strategy | TCA shows general execution data, not the execution quality of the specific strategy being promoted. In the promote context, you'd want TCA filtered to the candidate's backtest executions. | P1-gap |
| `ExecutionNav` sub-nav is wrong context | Shows execution platform navigation (Algos, Venues, etc.) which is Build/Observe context. In Promote context, should show Promote workflow navigation. | P2 |
| No backtest-vs-live comparison | The page shows TCA for past executions but doesn't compare backtest expected costs vs actual testnet costs — which is the core promote validation. | P1-gap |
| `EXECUTION_TIMELINE` uses Math.random() | Values change every render — misleading during demos. Should use deterministic mock data. | P3 |

---

### Page 3: Risk Review — PARTIAL FIT

**What it does well:**

- 7-tab layout covers comprehensive risk dimensions (VaR, Limits, Exposure, Greeks, HF Monitoring, Stress, Heatmap)
- Strategy risk heatmap shows risk across multiple strategies — useful for comparing candidate vs existing book
- Stress scenarios show how strategies perform under extreme conditions
- Limits hierarchy shows if the candidate would breach any risk limits
- Exposure analysis shows the impact of adding this candidate to the portfolio

**What's missing or could be better for the Promote context:**

| Gap | Impact | Severity |
|-----|--------|----------|
| Not scoped to a promote candidate | Risk page shows full portfolio risk, not risk impact of promoting a specific candidate. A promote reviewer wants to see "what happens to portfolio risk if we add this strategy?" | P1-gap |
| No "what-if" analysis | Can't simulate "if we promote ETH_BASIS_v3.2 with $75K allocation, what's the new portfolio VaR?" | P2 |
| No marginal risk contribution | Doesn't show the incremental risk of the candidate strategy | P2 |
| No backtest-vs-testnet risk comparison | Once promoted to testnet, should compare realized risk metrics vs backtest projections | P1-gap |
| 1071 lines is too much for a focused promote review | The full risk dashboard has 7 tabs — a promote reviewer likely only needs Heatmap, Stress, and Limits. The page could default to a focused view in promote context. | P3 |

---

### Page 4: Approval Status (Handoff) — STRONG FIT

**What it does well for the workflow:**

- Strategy summary with clear identification (ID, version, backtest, experiment)
- Metrics display with comparison to champion strategy (Sharpe, Returns, Max DD, Win Rate) — exactly what approvers need
- Config diff table showing parameter changes vs champion — critical for understanding what changed
- Risk validation checks with value vs limit format — clear pass/fail for each gate
- Multi-role approval chain (Quant Lead → Risk Manager → CTO) models the real sign-off process
- Conditional alert ("Ready for Promotion" vs "Pending Items") gives clear status
- Deployment options (Shadow Trading, Auto-Rollback, Gradual Rollout) are exactly the controls needed for safe promotion
- Promotion notes textarea for audit trail
- "Promote to Live" disabled until all approvals complete — correct gate

**What's missing or could be better:**

| Gap | Impact | Severity |
|-----|--------|----------|
| No testnet results summary | Approval page should show testnet performance (days run, P&L, drawdown, slippage) so approvers can see real results before signing off. This is the most critical missing piece. | P0-gap |
| "Return to Candidates" button not wired | No onClick handler — button renders but does nothing | P2 |
| No link to candidate's TCA or Risk data | Approver can't easily check execution quality or risk assessment from this page | P2 |
| Only 1 candidate shown (hardcoded) | Should be selectable — approver may need to review multiple candidates | P3 |
| Risk checks are pre-baked values | 5 risk checks all pass. Should reflect actual candidate metrics so approvers see real risk evaluation. | (known — mock data, will be real from backend) |
| No "reject with reason" flow | Can only approve or leave pending. No reject action on this page (only on candidates page). Approver should be able to reject from here with a reason. | P2 |

---

## Workflow Gaps Summary

### Critical Gaps (stages not covered by any page)

| Gap ID | Missing Stage | Description | Recommendation |
|--------|-------------|-------------|----------------|
| **WF-1** | Testnet monitoring | After "Promote to Paper", there's no dashboard to monitor testnet performance over the multi-day test period. Users can't see daily P&L, drawdowns, slippage, or fill rates from the testnet run. | New section on Candidates page (for promoted candidates) or dedicated testnet monitor page |
| **WF-2** | Backtest vs testnet comparison | The core validation — comparing backtest predictions to testnet reality — has no UI. "Are drawdowns aligned? Is slippage within expected range? Are returns tracking?" | Key component needed on Handoff page (for approvers) and/or Candidates page (for promoters) |
| **WF-3** | Testnet results on Handoff | Approvers see strategy metrics, config diff, and risk checks — but no actual testnet performance. They're approving based on backtest metrics alone, not testnet reality. | Add testnet performance card to Handoff page: days run, P&L, realized vs expected drawdown/slippage |

### Page Connectivity Gaps

| Gap ID | Description | Impact |
|--------|-------------|--------|
| **WF-4** | Candidates page → TCA: no link | User reviewing a candidate can't one-click to see its execution quality |
| **WF-5** | Candidates page → Risk: no link | User reviewing a candidate can't one-click to see its risk profile |
| **WF-6** | Candidates page → Handoff: no link | No way to go from "approved candidate" to "initiate handoff" |
| **WF-7** | TCA not scoped to candidate | TCA shows general execution data, not candidate-specific. Should filter by strategy when navigated from a specific candidate. |
| **WF-8** | Risk not scoped to candidate | Risk shows full portfolio, not marginal risk of the candidate being promoted |

---

## What's Already Good

The components that ARE present are well-designed for the promote workflow:

| Component | On page | Assessment |
|-----------|---------|------------|
| Workflow stage visualization (Pending → In Review → Approved → Promoted) | Candidates | Directly models the promote lifecycle stages |
| Promote to Paper / Promote to Live buttons | Candidates | Correctly separates testnet from live — matches the two-stage process |
| Metrics grid (Sharpe, Return, Max DD, Sortino, Hit Rate, Profit Factor) | Candidates | Right metrics for a promote decision |
| Config diff vs champion | Handoff | Critical for understanding what's changing in the promoted version |
| Risk validation checks with limits | Handoff | Clear pass/fail gates before promotion |
| Multi-role approval chain | Handoff | Models the real sign-off process |
| Deployment options (Shadow, Rollback, Gradual) | Handoff | Real-world safety controls for the promotion |
| TCA breakdown (Spread, Impact, Timing, Fees) | TCA | Right cost categories for execution quality assessment |
| Benchmark comparison (VWAP, TWAP, Arrival) | TCA | Standard TCA benchmarks |
| Stress scenarios | Risk | Important for pre-promotion risk assessment |
| Strategy risk heatmap | Risk | Useful for comparing candidate risk vs existing book |

---

## Recommendations Ranked by Workflow Impact

### Must-have for workflow completeness

1. **WF-1: Add testnet monitoring section** — When a candidate's state is "promoted" (to paper), show its testnet performance: daily P&L curve, realized drawdown, slippage vs expected, fill rate. This is the monitoring dashboard for the multi-day testnet period.

2. **WF-2: Add backtest vs testnet comparison** — Side-by-side or overlay chart: backtest expected returns/drawdown vs testnet actual. This is the validation that determines whether to proceed to live. Could be a new section on the Candidates page for promoted candidates, or a new tab.

3. **WF-3: Add testnet results to Handoff** — Before an approver signs off, they need to see testnet results. Add a card showing: test period, P&L, max drawdown (actual vs expected), slippage (actual vs expected), number of trades. This is the evidence that supports the approval decision.

### Should-have for workflow usability

4. **WF-4/5/6: Link candidates to TCA, Risk, Handoff** — On each candidate card, add action buttons or links: "View TCA" (scoped to this strategy), "View Risk" (marginal risk), "Start Handoff" (when approved). These turn the isolated pages into a connected workflow.

5. **WF-7: Scope TCA to candidate** — When navigating from a candidate to TCA, pass the strategy ID so TCA filters to that strategy's execution data. (When real API integration happens, this would be `?strategyId=ETH_BASIS_v3.2`.)

6. **Testnet allocation inputs on Candidates page** — When clicking "Promote to Paper", show a dialog with: allocation amount, test duration (days), and risk limits for the testnet run. These are the parameters that define the testnet experiment.

7. **Promote to Paper should set state to "testing", not "approved"** — The workflow stage visualization has 4 stages (Pending → In Review → Approved → Promoted). There should be a 5th: "Testing" (between Approved and Promoted). Promote to Paper = Testing. Promote to Live = Promoted.

### Nice-to-have for polish

8. Wire "Return to Candidates" button on Handoff page
9. Add reject-with-reason flow on Handoff page
10. Use Textarea instead of Input for review comments
11. Add candidate filter/sort on Candidates page
12. Fix `Math.random()` in TCA execution timeline mock data
