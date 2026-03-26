# Promote Lifecycle Tab — Design Document

> **Purpose:** Define the complete vision, tab structure, and implementation plan for the Strategy Promotion lifecycle stage. This is the gate between Research/Build and Live Trading — the most critical workflow in the platform.
>
> **AUM context:** $100M+ under management. Every strategy that passes through this gate touches real capital.
>
> **Aspirational benchmark:** Citadel, BlackRock Aladdin, Jane Street, Two Sigma — institutional-grade model risk management.

---

## 1. Current State

The page exists at `/services/promote` (`app/(platform)/services/promote/page.tsx`, ~1,488 lines).

**Existing tabs:**

| Tab             | What it has today                                                                                                   | Completeness                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Pipeline        | Funnel overview (5-stage counts), KPI cards (in pipeline, avg Sharpe, avg TTL, approved 30d), promotion queue table | 60% — missing velocity metrics, SLA tracking, historical success rate                  |
| Data Validation | Coverage, freshness, gaps, integrity gate checks with threshold/actual comparison                                   | 70% — solid gate checks, missing data lineage and provenance                           |
| Model & Signal  | IC, AUC, OOS ratio, Sharpe/Sortino/Calmar, profit factor, grouped gate checks                                       | 50% — missing regime analysis, walk-forward validation, feature stability              |
| Risk & Stress   | VaR, CVaR, tail ratio, worst day/week/month, stress scenarios, portfolio correlation                                | 65% — missing model drift, decay monitoring, Monte Carlo simulation                    |
| Execution       | Venue connectivity table, slippage, capacity, market impact                                                         | 70% — solid, missing paper trading results and live shadow comparison                  |
| Governance      | Sign-off matrix, audit trail, final authorization with checkbox                                                     | 60% — missing SR 11-7 compliance checklist, model inventory, regulatory classification |

**What's missing entirely (no tab at all):**

- Champion-Challenger comparison
- Paper Trading / Shadow Mode results
- Capital Allocation & Sizing
- Config diff between stages

---

## 2. Industry Research — What Top Firms Do

### 2.1 Champion-Challenger Framework

**Source:** DataRobot MLOps, Google Vertex AI Model Registry, Citadel internal MRM

Top firms never deploy a model in isolation. The challenger (new model) runs side-by-side against the currently deployed champion (production model) on identical data. Promotion happens only when the challenger demonstrably outperforms.

**Key metrics compared:**

- P&L (absolute and risk-adjusted)
- Signal accuracy / IC over identical windows
- Drawdown behavior during same market events
- Capacity utilization / slippage under same volume
- Regime-specific performance (does challenger win across regimes or only in favorable conditions?)

**Decision framework:**

- Challenger outperforms on all dimensions → auto-promote eligible (still requires governance sign-off)
- Challenger outperforms on some dimensions → manual review, justify trade-offs
- Challenger underperforms → reject with documented reason, return to Build

### 2.2 Paper Trading / Shadow Mode

**Source:** Jane Street, Two Sigma (research pipeline), SR 11-7 validation pillar

Before real capital deployment, strategies run in "shadow mode":

- Receives live market data (real prices, real order books)
- Generates hypothetical orders (signals fire, sizing computed)
- Orders are NOT sent to venues — instead tracked in a shadow book
- Fills are simulated using actual market data (would this order have filled?)
- P&L is computed as-if-live

**Why this matters (backtests miss these):**

- Latency between signal and execution
- Partial fills (illiquid instruments)
- Market impact (your own order moving the price)
- Slippage (difference between intended and actual execution price)
- Queue position in order book
- Data feed delays / stale prices
- Correlation with other strategies in the portfolio (crowding)

**Duration requirements:**

- Minimum 5 trading days for high-frequency strategies
- Minimum 20 trading days for daily/weekly strategies
- Must include at least one "stress period" if available in the window

### 2.3 Regime-Aware Validation

**Source:** BlackRock Aladdin risk models, AQR regime analysis framework

Performance must be decomposed across market regimes. A strategy that performs well in aggregate but fails during crisis periods is a ticking time bomb at $100M+ AUM.

**Regime classification:**
| Regime | Definition | What to measure |
| --- | --- | --- |
| Bull | Sustained uptrend (>20% from trough) | Does the strategy capture upside? |
| Bear | Sustained downtrend (>20% from peak) | Does the strategy protect capital? |
| Sideways / Range | <5% move over 30+ days | Does it generate alpha in low-vol? |
| Crisis / Shock | >10% move in <5 days | Does it survive tail events? |
| High Volatility | VIX > 25 (or crypto equivalent) | Performance under elevated vol |
| Low Volatility | VIX < 15 | Compressed opportunity set |
| Regime Transition | Within 10 days of regime change | Adaptation speed |

**Visualizations needed:**

- Regime-colored equity curve (shade background by regime)
- Regime performance heatmap (regime x metric matrix)
- Drawdown overlay by regime
- Regime transition scatter (how fast does strategy adapt?)

### 2.4 Walk-Forward Validation

**Source:** Quantitative research best practice (Brenndoerfer 2026, AQR, DE Shaw)

A single in-sample / out-of-sample split is not sufficient. Walk-forward analysis uses rolling windows:

```
Window 1: Train [2023-01 to 2024-06] → Test [2024-07 to 2024-12]
Window 2: Train [2023-07 to 2025-01] → Test [2025-01 to 2025-06]
Window 3: Train [2024-01 to 2025-06] → Test [2025-07 to 2025-12]
Window 4: Train [2024-07 to 2026-01] → Test [2026-01 to 2026-03]
```

**What to show:**

- Performance per window (Sharpe, return, max DD for each)
- Consistency score (standard deviation of Sharpe across windows — lower is better)
- Degradation trend (is performance declining in newer windows?)
- Statistical significance (t-stat on mean return across windows)

### 2.5 Capital Allocation & Risk Budget

**Source:** Institutional portfolio construction (Kelly criterion, risk parity, BlackRock factor allocation)

Before going live, a strategy needs explicit capital and risk budgets:

**Capital allocation:**

- Proposed allocation ($ amount and % of AUM)
- Kelly criterion optimal sizing
- Risk parity weight (based on vol contribution)
- Maximum allocation cap (governance limit)
- Ramp schedule (how quickly to scale from 0 to target — e.g., 25% per week over 4 weeks)

**Risk budget:**

- VaR budget (what share of portfolio VaR does this strategy consume?)
- Marginal VaR contribution
- Stress loss budget (max acceptable loss in worst stress scenario)
- Correlation impact on portfolio (does adding this strategy increase or decrease portfolio risk?)
- Position limits (max notional per instrument, per venue, per asset class)
- Leverage limits (max leverage allowed for this strategy)

**Margin requirements:**

- Initial margin per venue
- Maintenance margin per venue
- Total margin consumption vs available margin
- Margin call distance

### 2.6 Model Drift & Decay Monitoring

**Source:** SR 11-7 ongoing monitoring pillar, ValidMind compliance framework

Models degrade over time. The review process should show current drift indicators:

**Feature importance drift:**

- Top 10 features at training time vs current importance ranking
- Feature importance stability index (PSI or KS-test per feature)
- Features that have "died" (importance dropped below threshold)

**Signal decay:**

- IC (Information Coefficient) over rolling windows — the decay curve
- Signal half-life (how long until IC drops to 50% of initial?)
- Hit rate trend over time
- Auto-correlation of returns (increasing auto-correlation = signal crowding)

**Data drift:**

- Distribution shift in input features (KS-test, PSI)
- Missing data rate trend
- Outlier frequency trend

### 2.7 Compliance & Regulatory Documentation (SR 11-7)

**Source:** Federal Reserve SR 11-7, UK PRA SS1/23, EU AI Act (where applicable)

**Model Inventory fields:**

- Model ID (unique identifier in model registry)
- Model tier (Tier 1 = highest materiality, Tier 3 = lowest)
- Model owner (individual accountable)
- Last validation date
- Next scheduled validation
- Regulatory classification (trading model, risk model, pricing model)

**Documentation completeness:**

- [ ] Model purpose and intended use documented
- [ ] Assumptions and limitations documented
- [ ] Data sources and lineage documented
- [ ] Methodology and algorithms documented
- [ ] Validation approach and results documented
- [ ] Performance benchmarks defined
- [ ] Ongoing monitoring plan defined
- [ ] Escalation procedures defined
- [ ] Model change management process defined

**Regulatory status:**

- FCA notification required? (Yes/No)
- SEC Rule 17a-4 compliant audit trail? (Yes/No)
- FINRA Rule 4512 records retention? (Yes/No)
- Internal model risk committee reviewed? (Yes/No)

---

## 3. Proposed Tab Structure

The enhanced page will have **8 tabs** (up from current 6):

```
┌──────────┬────────────┬──────────────┬──────────────┬───────────┬──────────────┬────────────────┬─────────────┐
│ Pipeline │   Data     │  Model &     │  Risk &      │ Champion  │  Paper       │  Capital       │ Governance  │
│          │ Validation │  Signal      │  Stress      │    vs     │  Trading     │  Allocation    │ & Approval  │
│          │            │              │              │ Champion  │              │                │             │
└──────────┴────────────┴──────────────┴──────────────┴───────────┴──────────────┴────────────────┴─────────────┘
```

### Tab ordering rationale

The ordering follows the institutional review workflow:

1. **Pipeline** — see all candidates, pick one to review
2. **Data Validation** — is the data feeding this strategy reliable?
3. **Model & Signal** — is the model itself good? (IC, OOS, regime analysis, walk-forward)
4. **Risk & Stress** — what happens when things go wrong? (VaR, stress, drift, decay)
5. **Champion vs Challenger** — is this better than what we already have?
6. **Paper Trading** — does it actually work with live data in shadow mode?
7. **Capital Allocation** — how much capital, what risk budget, what position limits?
8. **Governance & Approval** — final sign-offs, compliance, deploy authorization

This mirrors the institutional workflow: data → model → risk → comparison → live validation → sizing → approval.

---

## 4. Tab-by-Tab Specification

### 4.1 Pipeline (enhanced)

**New additions to existing tab:**

- **Time-in-stage tracking:** For each candidate, show days spent in current stage with SLA indicator (green/amber/red based on expected duration)
- **Velocity metrics:** Average time through each stage (last 30d), trend arrows
- **Historical success rate:** % of candidates that made it through each stage (funnel conversion rates)
- **SLA breach alerts:** Candidates stuck longer than expected, with escalation indicator
- **Filter by:** asset class, archetype, submitter, stage, date range

### 4.2 Data Validation (enhanced)

**New additions:**

- **Data lineage:** Visual showing source → ETL → storage → model input pipeline
- **Provenance:** Which vendor, which API, what timestamp, what version of the ETL pipeline processed it
- **Cross-venue consistency:** For instruments traded on multiple venues, show price deviation statistics
- **Survivorship bias check:** Confirmation that the dataset includes delisted/dead instruments

### 4.3 Model & Signal (major enhancement)

**Existing content kept:** IC, AUC, OOS ratio, Sharpe/Sortino/Calmar, gate checks

**New sub-sections:**

#### 4.3.1 Regime Analysis Panel

- Regime-colored equity curve
- Regime performance matrix (7 regimes x 6 metrics heatmap)
- Regime breakdown table with per-regime Sharpe, return, max DD
- Worst regime identification with commentary

#### 4.3.2 Walk-Forward Validation Panel

- Rolling window results table (window dates, Sharpe, return, DD per window)
- Consistency score (std dev of Sharpe across windows)
- Degradation trend line (is performance declining?)
- Statistical significance (t-stat, p-value)

#### 4.3.3 Feature Stability Panel

- Top 10 features at training vs current importance
- Feature PSI (Population Stability Index) — colored by drift severity
- "Dead features" count (features that dropped below importance threshold)

### 4.4 Risk & Stress (enhanced)

**Existing content kept:** VaR, CVaR, stress scenarios, portfolio correlation

**New sub-sections:**

#### 4.4.1 Model Drift & Decay Panel

- IC rolling window chart (the decay curve)
- Signal half-life estimate
- Hit rate trend chart
- Feature distribution drift indicators (PSI per top feature)
- Auto-correlation analysis

#### 4.4.2 Monte Carlo Simulation Panel

- 1000-path Monte Carlo P&L distribution
- Probability of loss > X% in 30 days
- Confidence intervals for expected return
- Worst-case scenario from simulation

#### 4.4.3 Portfolio Impact Panel

- Marginal VaR contribution
- Correlation matrix impact (before and after adding this strategy)
- Diversification benefit / cost

### 4.5 Champion vs Challenger (NEW tab)

**Purpose:** Side-by-side comparison of the candidate (challenger) against the current production strategy (champion) it would replace or complement.

**Sections:**

#### 4.5.1 Head-to-Head Summary

- Two-column comparison card: Champion metrics | Challenger metrics
- Delta column showing improvement/degradation with color coding
- Overall verdict badge: "Challenger Wins", "Mixed Results", "Champion Wins"

#### 4.5.2 Performance Comparison

- Overlaid equity curves (same time period, same scale)
- Rolling Sharpe comparison (24-month rolling window)
- Drawdown comparison chart
- Monthly return heatmap side-by-side

#### 4.5.3 Regime Comparison

- For each regime: which model performed better?
- Regime transition behavior comparison

#### 4.5.4 Statistical Tests

- Paired t-test on daily returns (is the difference statistically significant?)
- Bootstrap confidence interval for Sharpe difference
- Turnover comparison (does challenger trade more/less?)

### 4.6 Paper Trading (NEW tab)

**Purpose:** Display results from shadow/paper trading — live data, simulated execution.

**Sections:**

#### 4.6.1 Shadow Period Summary

- Start date, end date, duration (days)
- Status badge: "Running", "Completed (N days)", "Failed"
- Live vs Backtest comparison (same period: how did paper trading compare to what backtest predicted?)

#### 4.6.2 Shadow P&L

- Daily P&L chart (paper trading results)
- Cumulative P&L curve
- Comparison overlay: paper P&L vs backtest prediction for same period

#### 4.6.3 Execution Simulation Quality

- Fill rate (% of signals that would have been filled)
- Simulated slippage vs actual market conditions
- Latency impact (signals that would have been stale)
- Queue position analysis (for limit orders)
- Partial fill rate

#### 4.6.4 Live-Backtest Divergence

- Ratio: Paper Trading Sharpe / Backtest Sharpe (should be > 0.7)
- Return divergence (absolute and %)
- Drawdown divergence
- Signal hit rate divergence
- Threshold gate: "Divergence within tolerance" or "Excessive divergence — investigate"

#### 4.6.5 Operational Stability

- Uptime during shadow period
- Error count / exceptions
- Data feed interruptions handled
- Recovery time from interruptions

### 4.7 Capital Allocation (NEW tab)

**Purpose:** Define how much capital to deploy and under what constraints.

**Sections:**

#### 4.7.1 Proposed Allocation

- Target allocation ($ and % of AUM)
- Kelly criterion optimal sizing
- Risk parity weight
- Conservative sizing (half-Kelly or minimum of methods)
- CIO maximum allocation cap

#### 4.7.2 Ramp Schedule

- Visual timeline: Week 1 (25%) → Week 2 (50%) → Week 3 (75%) → Week 4 (100%)
- Configurable ramp speed
- Early termination conditions (if loss exceeds X during ramp, halt)
- Ramp gate checks at each step

#### 4.7.3 Risk Budget

- VaR budget allocation (strategy VaR / portfolio VaR limit)
- Marginal VaR contribution chart
- Stress loss budget (max acceptable in worst scenario)
- What-if: portfolio risk metrics before vs after adding this strategy

#### 4.7.4 Position Limits

- Per-instrument notional limit
- Per-venue concentration limit
- Per-asset-class exposure limit
- Leverage limit
- Margin requirements per venue (initial + maintenance)
- Total margin consumption vs available

### 4.8 Governance & Approval (enhanced)

**Existing content kept:** Sign-off matrix, audit trail, final authorization

**New sub-sections:**

#### 4.8.1 SR 11-7 Compliance Checklist

- Documentation completeness checkboxes (9 items from Section 2.7)
- Each item: status, last updated date, document link
- Overall compliance score

#### 4.8.2 Model Inventory Entry

- Model ID, tier, owner, regulatory classification
- Last validation date, next scheduled validation
- Risk materiality score

#### 4.8.3 Regulatory Status

- FCA notification status
- SEC 17a-4 audit trail compliance
- FINRA 4512 records retention
- Internal MRC (Model Risk Committee) review status

#### 4.8.4 Config Diff

- Parameter comparison between current stage config and proposed production config
- Highlighted changes with old → new values
- Impact assessment for each changed parameter
- Approval checkbox per config change

#### 4.8.5 Deployment Plan

- Target environment (staging → production timeline)
- Rollback plan (automated kill switch conditions)
- Monitoring plan post-deployment (first 24h, first week, first month)
- Escalation contacts

---

## 5. Mock Data Requirements

Each new tab/section needs mock data in the `CandidateStrategy` interface. Extensions needed:

```typescript
interface CandidateStrategy {
  // ... existing fields ...

  // NEW: Regime analysis
  regimePerformance: {
    regime: string;
    sharpe: number;
    return: number;
    maxDrawdown: number;
    hitRate: number;
    tradeCount: number;
    duration: string;
  }[];

  // NEW: Walk-forward validation
  walkForward: {
    windowId: number;
    trainStart: string;
    trainEnd: string;
    testStart: string;
    testEnd: string;
    sharpe: number;
    return: number;
    maxDrawdown: number;
    tStat: number;
  }[];

  // NEW: Champion comparison
  champion?: {
    id: string;
    name: string;
    version: string;
    metrics: CandidateStrategy["metrics"];
    deployedSince: string;
    capitalDeployed: number;
  };

  // NEW: Paper trading results
  paperTrading?: {
    status: "running" | "completed" | "failed";
    startDate: string;
    endDate?: string;
    daysCompleted: number;
    daysRequired: number;
    pnl: number;
    sharpe: number;
    backtestSharpeForPeriod: number;
    fillRate: number;
    avgSlippageBps: number;
    latencyImpactBps: number;
    uptime: number;
    errorCount: number;
    divergenceRatio: number;
  };

  // NEW: Capital allocation proposal
  capitalAllocation?: {
    proposedUsd: number;
    proposedPctAum: number;
    kellyOptimal: number;
    riskParityWeight: number;
    cioMaxCap: number;
    rampWeeks: number;
    varBudgetPct: number;
    marginalVar: number;
    stressLossBudget: number;
  };

  // NEW: Feature stability
  featureStability: {
    featureName: string;
    importanceAtTraining: number;
    importanceCurrent: number;
    psi: number;
    status: "stable" | "drifting" | "dead";
  }[];

  // NEW: Model drift indicators
  modelDrift: {
    icCurrent: number;
    icAtTraining: number;
    signalHalfLifeDays: number;
    hitRateTrend: "improving" | "stable" | "declining";
    autoCorrelation: number;
  };

  // NEW: Compliance
  compliance: {
    modelTier: 1 | 2 | 3;
    modelOwner: string;
    lastValidationDate: string;
    nextValidationDate: string;
    regulatoryClassification: string;
    documentationComplete: boolean;
    mrcReviewed: boolean;
    fcaNotified: boolean;
  };
}
```

---

## 6. Implementation Order

**Decision:** Split the monolith first (Phase 0), then build/enhance each tab in its own phase. The existing page was built in a hurried state as a rough draft — we are free to reshape, remove, or replace anything that doesn't fit the target architecture.

| Phase   | What                                                                 | Status                    | Notes                                                                                                                                                                                                         |
| ------- | -------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0 | **Refactor — split monolith into components**                        | **COMPLETE** (2026-03-26) | Extracted `types.ts`, `stage-meta.tsx`, `helpers.tsx`, `mock-data.ts`, `no-strategy-selected.tsx`, tab components under `components/promote/`; routes split per §9 (layout + `(lifecycle)/` + Zustand store). |
| Phase 1 | **Expand mock data — 8-10 multi-asset strategies**                   | **COMPLETE** (2026-03-26) | 10 strategies per portfolio table; `CandidateStrategy` extended per §5; added `paper_trading` stage in `STAGE_ORDER`; shared defaults in `mock-fixtures.ts`.                                                  |
| Phase 2 | **Enhance Pipeline tab** (velocity, SLA, funnel, filters)            | **COMPLETE** (2026-03-26) | Velocity cards, funnel conversion % on stage cards, SLA column + breach banner, asset/stage/submitter filters in `pipeline-overview.tsx`.                                                                     |
| Phase 3 | **Champion vs Challenger tab** (NEW)                                 | **COMPLETE** (2026-03-26) | `champion-challenger-tab.tsx`: head-to-head with champion or benchmark + portfolio fit when no champion.                                                                                                      |
| Phase 4 | **Paper Trading tab** (NEW)                                          | **COMPLETE** (2026-03-26) | `paper-trading-tab.tsx`: shadow summary, divergence, execution sim, ops stability; empty state when no `paperTrading`.                                                                                        |
| Phase 5 | **Enhance Model & Signal** (regime + walk-forward + features)        | **COMPLETE** (2026-03-26) | `regime-analysis-panel.tsx`, `walk-forward-panel.tsx`, `feature-stability-panel.tsx` composed in `model-assessment-tab.tsx`.                                                                                  |
| Phase 6 | **Capital Allocation tab** (NEW)                                     | **COMPLETE** (2026-03-26) | `capital-allocation-tab.tsx`: sizing, ramp UI, risk budget, limits copy.                                                                                                                                      |
| Phase 7 | **Enhance Risk & Stress** (drift, decay, Monte Carlo)                | **COMPLETE** (2026-03-26) | `model-drift-panel.tsx`, `monte-carlo-panel.tsx`, `portfolio-impact-panel.tsx` in `risk-stress-tab.tsx`.                                                                                                      |
| Phase 8 | **Enhance Governance** (SR 11-7 light, config diff, deployment plan) | **COMPLETE** (2026-03-26) | `compliance-checklist.tsx`, `config-diff-panel.tsx`, `deployment-plan-panel.tsx` in `governance-tab.tsx`.                                                                                                     |
| Phase 9 | **Polish — hybrid workflow actions, navigation, responsive**         | **COMPLETE** (2026-03-26) | `promote-workflow-actions.tsx` (dialog pattern §10) on all tabs + pipeline when row selected; tab strip responsive wrap; gate-based lock on Execution/Paper/Governance triggers; breadcrumb stage dots.       |

**Post-audit (2026-03-26, `PROMOTE_AUDIT_FIXES.md`):** Approve/reject/retest/override now mutates `stages` + `currentStage` via `promote-workflow-mutate.ts` + `page.tsx`. Monte Carlo / portfolio panels use strategy metrics + `PORTFOLIO_PRE_ADD_MAX_CORRELATION`. Governance final buttons call workflow context; paper-only path uses `governancePaperOnly` (audit only, no stage advance). `configDiff` / `deploymentPlan` / `documentationChecklist` on `CandidateStrategy` / `ComplianceInfo`; walk-forward + feature set variants in `mock-fixtures.ts`; pipeline funnel + velocity derived from mock candidates; capital ramp steps follow `rampWeeks`.

**Deviations / additions (2026-03-26):**

- **`mock-fixtures.ts`** — shared `STANDARD_REGIMES`, `STANDARD_WALK_FORWARD`, `STANDARD_FEATURES`, champion presets; not listed in original §9 but keeps `mock-data.ts` maintainable.
- **`promote-workflow-actions.tsx`** — implements §10 confirmation dialog (comment, override risk checkbox); records via context; stage mutations applied in `page.tsx` (demo — no remote API).
- **`promote-workflow-mutate.ts`** — pure helper: append audit entry + update `stages` / `currentStage` per action.
- **Tab bar** — Nine primary tabs: Pipeline, Data, Model, Risk, Execution, **Champion**, **Paper**, **Capital**, Governance. Section 3 diagram showed eight columns without Execution; §9 requires **Execution** — Execution retained between Risk and Champion for venue readiness.
- **`StrategyMetrics`** — Named interface in `types.ts` for `metrics` and `champion.metrics` (equivalent to inline `CandidateStrategy["metrics"]` in §5).

---

## 7. UX Principles

- **Progressive disclosure:** Don't overwhelm. Pipeline tab shows the queue. Clicking a strategy reveals the detail tabs. Each tab shows summary cards at top, gate checks in middle, deep detail at bottom.
- **Gate-driven progression:** Tabs for stages that haven't been reached are visible but clearly locked/grayed. The user can see what's coming but can't skip ahead.
- **Hybrid workflow:** This is NOT a read-only dashboard. Every tab has action buttons (Approve, Reject, Request Retest, Override). But it's also not a fully automated engine — humans make the decisions, the system enforces the workflow and records everything. See Section 10 for the full interaction model.
- **Color language consistent across the platform:**
  - Emerald/green = passed / good
  - Amber/yellow = pending / warning / override
  - Rose/red = failed / critical
  - Slate/gray = not started / locked
  - Cyan/blue = informational / paper trading / simulation
- **Institutional feel:** Monospace numbers, clean tables, minimal decoration. This is a risk management tool, not a marketing page. Think Bloomberg Terminal meets modern design.
- **Audit trail everywhere:** Every decision, every gate check, every sign-off is timestamped with who and why. Overrides are visually distinct from approvals.
- **Multi-asset awareness:** The page handles Crypto, FX, Equities, Commodities, and Sports Betting. Some fields may be N/A for certain asset classes (e.g., "funding rate" only applies to crypto perpetuals). Handle gracefully with "N/A" or conditional display, not errors.

---

## 8. Design Decisions (Resolved)

Decisions made during design discussion on 2026-03-25:

### 8.1 Resolved Questions

| #   | Question                                                       | Decision                                                                                                                                                                                                                                                                         | Rationale                                                                                               |
| --- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Should Champion-Challenger be optional for new strategies?     | **No — always show the tab.** For new strategies (no existing champion), show BOTH benchmark comparison (BTC buy-hold, simple momentum, equal-weight index) AND portfolio fit analysis (how it complements existing strategies).                                                 | Makes the tab universally useful regardless of whether a champion exists.                               |
| 2   | Paper Trading minimum duration — configurable per asset class? | **OPEN — not yet decided.** Likely yes (HFT: 5 days, daily: 20 days, weekly: 60 days).                                                                                                                                                                                           | To be refined during Phase 4 implementation.                                                            |
| 3   | Who can override a failed gate?                                | **Hybrid workflow model.** The page is a review dashboard WITH action buttons: Approve, Reject with Comment, Request Retest, Override with Justification. Every action is logged in the audit trail. Override requires additional justification text and is recorded separately. | Balances usability (not just a read-only status board) with accountability (every action is auditable). |
| 4   | API integration timing?                                        | **Mock-first, API later.** Current build uses rich mock data. Mock data structure should match the API response schema from `lib/registry/openapi.json` when the API is ready. Not blocking.                                                                                     | Standard MSW migration path per UI .cursorrules Rule 3.3.                                               |
| 5   | Multi-strategy promotion (bundles)?                            | **OPEN — deferred to post-Phase 9.** Interesting but adds significant complexity (joint risk analysis, correlated P&L). Not in scope for initial build.                                                                                                                          | Revisit after all 8 tabs are functional.                                                                |

### 8.2 Architectural Decisions

| Decision                     | Choice                                                                                                                               | Alternatives Considered                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Refactor before building** | Split monolith into ~15 component files first (Phase 0), then build features                                                         | Build into monolith and split later; split as we go                                                                                |
| **Tab count**                | 8 tabs: Pipeline, Data Quality, Model & Signal, Champion vs Challenger, Paper Trading, Capital Allocation, Risk & Stress, Governance | 7 tabs (merge Paper Trading into Pipeline); 6 tabs (also merge Capital into Risk)                                                  |
| **Mock data breadth**        | 8-10 strategies covering Crypto, FX, Equities, Commodities, Sports Betting                                                           | 2 strategies (deepen only); 4 strategies; 6 strategies                                                                             |
| **Workflow model**           | Hybrid — review dashboard with action buttons (approve, reject, request retest, override with justification)                         | Read-only dashboard; Full workflow engine with automated gating                                                                    |
| **SR 11-7 compliance depth** | Light — documentation checklist + approval chain + model inventory. Looks institutional without deep regulatory modeling.            | Medium (full MRM framework with validation tiers); Heavy (complete SR 11-7 with independent validation tracking and exception log) |
| **Existing code treatment**  | Existing page is a rough draft — freely reshape, remove, or replace anything. Keep what's good, discard what doesn't fit.            | Treat existing code as authoritative and only add to it                                                                            |
| **Documentation approach**   | Update this design doc after each phase with status, deviations, and file paths. Living implementation log.                          | Separate IMPLEMENTATION_LOG.md; Both                                                                                               |

### 8.3 Mock Strategy Portfolio

The expanded mock data will include 10 strategies spanning all asset classes:

| #   | Name                     | Archetype           | Asset Class    | Current Stage       | Has Champion?            |
| --- | ------------------------ | ------------------- | -------------- | ------------------- | ------------------------ |
| 1   | BTC Funding Arb v3       | funding-rate-arb    | Crypto         | risk_stress         | Yes (v2 in production)   |
| 2   | ETH Basis Carry          | basis-carry         | Crypto         | model_assessment    | No (new strategy)        |
| 3   | Cross-Exchange MM        | market-making       | Crypto         | governance          | Yes (v1.2 in production) |
| 4   | GBP/USD Mean Reversion   | mean-reversion      | FX             | execution_readiness | No (new asset class)     |
| 5   | Equity Momentum L/S      | momentum-long-short | Equities       | governance          | Yes (simple momentum v1) |
| 6   | Commodity Trend Follower | trend-following     | Commodities    | data_validation     | No (new asset class)     |
| 7   | ML Regime Switcher       | regime-switching    | Multi-Asset    | model_assessment    | No (new strategy type)   |
| 8   | EPL Match Predictor      | ml-classification   | Sports Betting | risk_stress         | Yes (rule-based v1)      |
| 9   | SOL Volatility Arb       | volatility-arb      | Crypto         | paper_trading       | Yes (ETH Vol Arb v2)     |
| 10  | Tennis Live In-Play      | live-pricing        | Sports Betting | data_validation     | No (new market)          |

This gives us: 4 with champions (for Champion vs Challenger), 6 without (for benchmark + portfolio fit), coverage of all 8 promotion stages, and representation of every asset class the platform supports.

### 8.4 Still Open (Deferred)

- **Paper Trading minimum duration per asset class** — to be defined in Phase 4
- **Multi-strategy bundle promotion** — deferred to post-Phase 9
- **Real-time WebSocket updates for Paper Trading** — deferred to API integration phase

---

## 9. File Structure (Final State)

After all phases are complete, the promote feature will be organized as follows:

```
app/(platform)/services/promote/
  layout.tsx                        — Row-2 PROMOTE_TABS + EntitlementGate + ErrorBoundary + PromoteWorkflowBridge
  page.tsx                          — redirect → /services/promote/pipeline
  (lifecycle)/layout.tsx            — Row-3 PromoteLifecycleSubTabs (ServiceTabs + navDisabled for stage gating)
  (lifecycle)/pipeline/page.tsx
  (lifecycle)/data-validation/page.tsx
  (lifecycle)/model-assessment/page.tsx
  (lifecycle)/risk-stress/page.tsx
  (lifecycle)/execution-readiness/page.tsx
  (lifecycle)/champion/page.tsx
  (lifecycle)/paper-trading/page.tsx
  (lifecycle)/capital-allocation/page.tsx
  (lifecycle)/governance/page.tsx

lib/config/services/promote.config.ts — PROMOTE_PIPELINE_HREF, promoteHrefForStage, PROMOTE_LIFECYCLE_NAV
lib/stores/promote-lifecycle-store.ts — candidates, selectedId, recordWorkflow, reset (shared across promote routes)

components/promote/
  ├── promote-workflow-bridge.tsx   — Wires PromoteWorkflowProvider → store.recordWorkflow
  ├── promote-lifecycle-frame.tsx   — Page chrome (header, counts)
  ├── promote-lifecycle-sub-tabs.tsx— Dynamic sub-nav (matches prior tab lock rules)
  ├── promote-strategy-context-bar.tsx — Breadcrumb + STAGE_ORDER stepper (Links)
  ├── promote-lifecycle-stage-page.tsx — Empty / gated stage shell for route pages
  ├── promote-pipeline-page.tsx     — PipelineOverview + select → router to current stage
  ├── promote-stage-access.ts       — isPromoteStageLocked (official stages)
  ├── promote-flow-modal.tsx        — Compact promote dialog (strategy grid / detail pages only)
  ├── types.ts                      — CandidateStrategy, GateStatus, GateCheck, PromotionStage, StrategyMetrics, extensions per §5
  ├── mock-fixtures.ts              — Shared regime / walk-forward / feature rows + champion presets
  ├── mock-data.ts                  — 10 strategies composing fixtures + per-strategy overrides
  ├── helpers.tsx                   — statusColor, statusBg, StatusIcon, fmtPct, fmtNum, fmtUsd, getOverallProgress
  ├── stage-meta.tsx                — STAGE_META icons/labels (includes paper_trading)
  ├── promote-workflow-context.tsx   — Provider + buildReviewEntry for §10 audit trail (demo)
  ├── promote-workflow-mutate.ts     — Apply workflow payload to strategy clone (stages + currentStage)
  ├── promote-workflow-actions.tsx  — §10 Approve / Reject / Retest / Override / Demote
  ├── no-strategy-selected.tsx      — Empty state when no strategy is picked
  │
  │── pipeline-overview.tsx         — Enhanced Pipeline tab (velocity, SLA, funnel, filters)
  │── data-validation-tab.tsx       — Data Validation tab (existing gates + lineage, provenance)
  │
  │── model-assessment-tab.tsx      — Model & Signal tab (orchestrates sub-panels below)
  │── regime-analysis-panel.tsx     — Regime analysis sub-panel (7-regime heatmap, per-regime metrics)
  │── walk-forward-panel.tsx        — Walk-forward validation sub-panel (rolling windows, consistency)
  │── feature-stability-panel.tsx   — Feature stability sub-panel (PSI, dead features, importance drift)
  │
  │── risk-stress-tab.tsx           — Risk & Stress tab (orchestrates sub-panels below)
  │── model-drift-panel.tsx         — Model drift & decay sub-panel (IC decay, signal half-life)
  │── monte-carlo-panel.tsx         — Monte Carlo simulation sub-panel (P&L distribution, confidence intervals)
  │── portfolio-impact-panel.tsx    — Portfolio impact sub-panel (marginal VaR, diversification benefit)
  │
  │── champion-challenger-tab.tsx   — NEW: Champion vs Challenger tab (head-to-head + benchmark + portfolio fit)
  │── paper-trading-tab.tsx         — NEW: Paper Trading tab (shadow P&L, execution sim, divergence)
  │── capital-allocation-tab.tsx    — NEW: Capital Allocation tab (sizing, ramp, risk budget, limits)
  │
  │── execution-readiness-tab.tsx   — Execution Readiness tab (venue connectivity, fills, capacity)
  │
  │── governance-tab.tsx            — Governance tab (orchestrates sub-panels below)
  │── compliance-checklist.tsx      — SR 11-7 light compliance checklist sub-panel
  │── config-diff-panel.tsx         — Config diff sub-panel (current vs production params)
  └── deployment-plan-panel.tsx     — Deployment plan sub-panel (timeline, rollback, monitoring)
```

**Phase 0 creates:** types.ts, mock-data.ts, helpers.ts, no-strategy-selected.tsx, and extracts each existing tab into its own file under `components/promote/`. **Routing:** one Next.js route per lifecycle segment (above); shared state in `promote-lifecycle-store`; sub-nav uses `ServiceTabs` with `navDisabled` (same rules as before: Data/Model/Risk need selection only; Execution/Paper/Governance also respect pipeline lock).

**Phases 1-9 add:** The remaining files (new tabs, sub-panels) and extend the existing ones.

**Estimated total code:** ~4,000-5,000 lines across ~22 files (vs current 1,508 lines in 1 file).

---

## 10. UX Interaction Model (Hybrid Workflow)

Every tab includes action buttons — this is not a read-only dashboard. The interaction model:

**Per-tab actions:**

- **Approve Stage** — marks the **pipeline’s current stage** (`currentStage`) as passed and advances **one** step in `STAGE_ORDER`. Approve / reject / retest / override are **disabled** on tabs whose stage label does not match `currentStage`, so browsing an earlier tab cannot accidentally mutate the wrong gate.
- **Reject with Comment** — blocks progression on the current stage, requires a written justification, recorded in audit trail
- **Request Retest** — sends the strategy back to the current stage for re-evaluation (e.g., after data is fixed)
- **Override with Justification** — allows a senior user (CIO/PM) to bypass a failed gate with documented reasoning. Overrides are visually distinct in the audit trail (amber, not green) so they're always visible.
- **Demote** — moves the pipeline pointer **backward** to any **previous** stage (user-selected). Target stage becomes `pending`; all later stages reset to `not_started`; earlier passed stages stay as-is for audit context. Requires a mandatory reason; logged as `requires_changes` in `reviewHistory`.

**Action dialog pattern:**

Each action opens a confirmation dialog with:

- Action type (approve / reject / retest / override / demote)
- Comment field (required for reject and override, optional for approve)
- Risk acknowledgment checkbox (for override only)
- Confirmation button

**Audit trail integration:**

Every action creates a `reviewHistory` entry with: reviewer name, role, decision, comment, timestamp, stage, and whether it was an override.

---

## 11. Revision History

| Date       | Author    | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-25 | AI + User | Initial design document created from industry research                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-03-25 | AI + User | Resolved open questions, added design decisions (Section 8), expanded mock strategy portfolio (10 strategies, multi-asset + sports), updated implementation order to include Phase 0 (refactor split) and Phase 9 (polish), updated file structure to final state (~22 files), added UX interaction model (Section 10)                                                                                                                                          |
| 2026-03-26 | AI        | Phases 0–9 implemented: split monolith, 10-strategy mocks, new tabs/panels, workflow actions, design doc §6/§9 updated                                                                                                                                                                                                                                                                                                                                          |
| 2026-03-26 | AI        | Self-audit pass: champion `regimePerformance` in mocks; pipeline archetype + submitted date filters; walk-forward `pValue`; champion Δ column + regime table + illustrative stats note; data-validation cross-venue/survivorship gates + vendor/ETL from mock; paper/capital extended fields + bar chart; config-diff per-row approve checkboxes; compliance registry ID / materiality / SEC-FINRA table; governance override styling + sample override in mock |
| 2026-03-26 | AI        | **`PROMOTE_AUDIT_FIXES.md`:** workflow mutates stages/currentStage; data-driven Monte Carlo + portfolio impact; governance live/paper buttons wired; `configDiff` / `deploymentPlan` / compliance checklist + dates; pipeline metrics from candidates + `HISTORICAL_APPROVALS_30D`; dynamic capital ramp; walk-forward/feature mocks varied; champion regime bounds-safe; sign-offs from `reviewHistory`                                                        |
| 2026-03-26 | AI        | **Stage-gated workflow + Demote:** `applyPromoteWorkflowRecord` only applies approve/reject/retest/override when tab stage equals `currentStage`; **Demote** action + UI (target picker, required reason) resets downstream stages; §10 updated                                                                                                                                                                                                                 |
| 2026-03-26 | AI        | **Placement:** `components/promote/` (lifecycle domain, not `trading/`); `promote-page-client.tsx` colocated with route; removed temporary **Promote** button + modal from trading overview; `PromoteFlowModal` import path `@/components/promote/promote-flow-modal`                                                                                                                                                                                           |
| 2026-03-26 | AI        | **Service alignment:** `promote/layout.tsx` + `(lifecycle)/` route group; URL per stage; `lib/stores/promote-lifecycle-store.ts` + `promote.config.ts`; `ServiceTabs.navDisabled`; `/services/promote` redirects to `/services/promote/pipeline`; removed `promote-page-client.tsx`                                                                                                                                                                             |

---

## 12. Implementation gaps (honest)

The UI is **demo-grade** against the research spec in §4: no charting library for true equity / Sharpe curves, full Monte Carlo histograms, or production statistical tests. Workflow actions update **local React state** only until a promote API exists. Monte Carlo / portfolio panels use **parametric estimates** from VaR fields, not path simulation. Extended mock fields (`configDiff`, `deploymentPlan`, `documentationChecklist`, walk-forward / feature variants) are populated on a subset of strategies; others use shared defaults.
