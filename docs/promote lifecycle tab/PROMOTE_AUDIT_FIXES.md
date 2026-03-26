# Promote Lifecycle Tab — Audit Fixes & Improvements

> **Context:** The initial 10-phase build of the Promote Lifecycle Tab is complete. This document contains the audit findings and required fixes. Complete all items in order of priority.
>
> **Design doc:** `docs/promote lifecycle tab/PROMOTE_LIFECYCLE_DESIGN.md` — update Section 6 and Section 12 after completing these fixes.
>
> **Workspace root:** `/home/hk/unified-trading-system-repos`
> **UI repo:** `/home/hk/unified-trading-system-repos/unified-trading-system-ui`

---

## Rules

1. After completing each section, update `PROMOTE_LIFECYCLE_DESIGN.md` Section 11 (Revision History) with what you changed.
2. Run `npm run build` after each section to verify no TypeScript errors.
3. Run the dev server (`npm run dev`) and visually verify the page at `http://localhost:3100/services/promote` after completing all sections.
4. Do NOT create summary documents or status files. Update the design doc only.
5. Use existing Shadcn/ui components. Icons from `lucide-react`.
6. Follow the existing code patterns in `components/promote/` — same styling conventions (monospace numbers, emerald/amber/rose color language, `text-[10px]` for labels).

---

## Section 1: HIGH PRIORITY — Must Fix

### 1.1 Workflow Actions Must Mutate Strategy State

**File:** `app/(platform)/services/promote/page.tsx`

**Problem:** Clicking "Approve Stage" appends an audit trail entry via `onRecord` but does NOT advance `currentStage` or update `stages[x].status`. The approve action is cosmetic only.

**Fix:** In the `onRecord` callback, when the action is `approve`:

- Set `stages[currentStage].status = "passed"` and `stages[currentStage].completedAt = new Date().toISOString()`
- Advance `currentStage` to the next stage in `STAGE_ORDER`
- Set `stages[nextStage].status = "pending"` (if it was `"not_started"`)

When the action is `reject`:

- Set `stages[currentStage].status = "failed"`

When the action is `retest`:

- Set `stages[currentStage].status = "pending"` (reset to pending for re-evaluation)

When the action is `override`:

- Same as approve (advance to next stage), but the `isOverride: true` flag is already set on the audit entry

This makes the demo interactive — approving a strategy in Data Validation moves it to Model & Signal, unlocking the next tab.

### 1.2 Monte Carlo Panel — Data-Driven Estimates

**File:** `components/promote/monte-carlo-panel.tsx`

**Problem:** All values are hardcoded constants (`pLoss5 = 0.12`, `pLoss10 = 0.04`). The "1000 paths" label is decorative. This is the weakest panel.

**Fix:** Derive values from the strategy's actual risk metrics:

- Use `strategy.metrics.dailyVaR` and `strategy.metrics.cvar` to compute approximate loss probabilities
- Formula: `pLoss5 ≈ normal CDF at (-0.05 / (dailyVaR * sqrt(21)))` (rough 30-day scaling)
- Add a visible disclaimer: "Estimates derived from parametric VaR assumptions — not a full simulation" as a muted text note below the cards
- Pass `strategy` as a prop instead of (or in addition to) just `riskProfile` and `metrics`

### 1.3 Portfolio Impact Panel — Data-Driven Estimates

**File:** `components/promote/portfolio-impact-panel.tsx`

**Problem:** `marginal = r.correlationToPortfolio * 0.012 + 0.004` is an arbitrary formula. `0.58` for pre-addition max correlation is hardcoded.

**Fix:**

- Use `strategy.capitalAllocation?.marginalVar` when available (already in the type and mock data)
- For pre-addition portfolio metrics, derive from the strategy count in `MOCK_CANDIDATES` or add a `portfolioMetrics` constant in `mock-fixtures.ts`
- Add the same "illustrative" disclaimer as monte-carlo-panel

### 1.4 Governance Final Buttons — Wire to Workflow

**File:** `components/promote/governance-tab.tsx`

**Problem:** "Approve for Live Trading" and "Approve for Paper Trading" buttons (around lines 266-278) have no onClick handlers. They are disabled-gated but non-functional even when all conditions are met.

**Fix:** Wire these buttons to the workflow context:

- "Approve for Live Trading" should call `record(strategyId, "governance", { action: "approve", comment: "Approved for live production" })` and advance the strategy
- "Approve for Paper Trading" should call `record(strategyId, "governance", { action: "approve", comment: "Approved for paper trading only" })` but NOT advance beyond governance (paper trading approval is a softer gate)
- Both should show a brief success state (e.g., button text changes to "Approved" with a checkmark for 2 seconds)

---

## Section 2: MEDIUM PRIORITY — Should Improve

### 2.1 Config Diff Panel — Strategy-Specific Parameters

**File:** `components/promote/config-diff-panel.tsx`

**Problem:** The `ROWS` constant (4 rows) is identical for every strategy regardless of archetype or asset class.

**Fix:** Add a `configDiff` field to `CandidateStrategy` in `types.ts`:

```typescript
configDiff?: {
  parameter: string;
  currentValue: string;
  proposedValue: string;
  impact: string;
}[];
```

Populate it in `mock-data.ts` with strategy-specific parameters. Examples:

- Crypto funding arb: `max_leverage`, `funding_threshold_bps`, `rebalance_interval_sec`, `venue_allocation_pct`
- FX mean reversion: `lookback_window_hours`, `z_score_entry`, `z_score_exit`, `max_position_size`
- Sports betting: `min_odds_value`, `max_stake_pct`, `model_confidence_threshold`, `closing_line_offset`
- Equities: `universe_size`, `rebalance_frequency`, `sector_neutral`, `beta_hedge`

Fall back to the existing hardcoded rows if `configDiff` is undefined.

### 2.2 Deployment Plan Panel — Dynamic Content

**File:** `components/promote/deployment-plan-panel.tsx`

**Problem:** Entire panel is hardcoded prose. Only `strategy.id` is dynamic.

**Fix:** Add a `deploymentPlan` field to `CandidateStrategy` in `types.ts`:

```typescript
deploymentPlan?: {
  targetEnv: string;
  rollbackConditions: string[];
  monitoringPlan: { period: string; checks: string[] }[];
  escalationContacts: string[];
};
```

Populate for at least 3-4 strategies in `mock-data.ts`. Render dynamically. Fall back to generic defaults if undefined.

### 2.3 Pipeline Magic Number

**File:** `components/promote/pipeline-overview.tsx`

**Problem:** `totalPassed + 2` on approximately line 165 adds a magic number with no explanation.

**Fix:** Remove the `+2`. If the intent was to show historical approvals beyond the current pipeline, add a `historicalApprovals30d` constant in `mock-fixtures.ts` and use it explicitly.

### 2.4 Compliance Checklist Date Hack

**File:** `components/promote/compliance-checklist.tsx`

**Problem:** `2026-03-0${1 + (i % 9)}` generates dates via string concatenation, which produces invalid dates for indices > 8 (e.g., `2026-03-010`).

**Fix:** Use a proper date array or compute from the strategy's compliance data:

```typescript
const baseDate = new Date(strategy.compliance.lastValidationDate);
const itemDate = new Date(baseDate);
itemDate.setDate(baseDate.getDate() - (items.length - i));
const dateStr = itemDate.toISOString().slice(0, 10);
```

### 2.5 Compliance Checklist Completion Logic

**File:** `components/promote/compliance-checklist.tsx`

**Problem:** `comp.documentationComplete || i < 6` is a hack — first 6 items always show as complete regardless of actual state.

**Fix:** Add a `documentationChecklist` field to `ComplianceInfo` in `types.ts`:

```typescript
documentationChecklist?: {
  label: string;
  complete: boolean;
  lastUpdated?: string;
}[];
```

Populate for each strategy in mock data. When undefined, fall back to the current logic but change the condition to derive from `documentationComplete` only (all items match the flag).

### 2.6 Governance Sign-Off Names — Data-Driven

**File:** `components/promote/governance-tab.tsx`

**Problem:** The 5 required sign-off roles have hardcoded reviewer names (`"Dr. Sarah Chen"`, `"Marcus Williams"`, `"James Liu"`, `"Pending"`, `"Pending"`).

**Fix:** Derive the signed status AND reviewer name from `strategy.reviewHistory`. For each required role, check if a matching `reviewHistory` entry exists with `decision: "approved"`. If yes, show the reviewer name from that entry. If no, show "Awaiting review". The role list itself can remain as a constant (it's organizational, not per-strategy).

### 2.7 Capital Allocation Ramp Schedule — Respect rampWeeks

**File:** `components/promote/capital-allocation-tab.tsx`

**Problem:** `ramp = [25, 50, 75, 100]` is hardcoded as 4 steps regardless of `capitalAllocation.rampWeeks`. Strategies strat-006 (rampWeeks: 6) and strat-010 (rampWeeks: 8) show incorrect ramp schedules.

**Fix:** Generate the ramp array dynamically from `capitalAllocation.rampWeeks`:

```typescript
const weeks = ca.rampWeeks;
const ramp = Array.from({ length: weeks }, (_, i) =>
  Math.round(((i + 1) / weeks) * 100),
);
```

This produces `[17, 33, 50, 67, 83, 100]` for 6 weeks and `[13, 25, 38, 50, 63, 75, 88, 100]` for 8 weeks.

---

## Section 3: LOW PRIORITY — Nice to Have

### 3.1 Champion-Challenger Non-Null Assertion Safety

**File:** `components/promote/champion-challenger-tab.tsx`

**Problem:** `champRegs[i]!` non-null assertion could crash if champion regime data has fewer entries than challenger.

**Fix:** Add a bounds check: `const champRow = champRegs?.[i]; if (!champRow) return null;`

### 3.2 Walk-Forward Data Variation

**File:** `components/promote/mock-fixtures.ts` and `mock-data.ts`

**Problem:** All 10 strategies share `STANDARD_WALK_FORWARD` with identical window dates and values (some with a multiplier). Walk-forward windows should differ based on each strategy's training period.

**Fix:** Create 2-3 variants of walk-forward data in `mock-fixtures.ts`:

- `WALK_FORWARD_SHORT` (2 years of data, 3 windows)
- `WALK_FORWARD_MEDIUM` (3 years, 4 windows) — current `STANDARD_WALK_FORWARD`
- `WALK_FORWARD_LONG` (5+ years, 6 windows) — for strategies with longer history like Equities and FX

Assign the appropriate variant per strategy based on their `trainingPeriod` length.

### 3.3 Feature Stability Data Variation

**File:** `components/promote/mock-data.ts`

**Problem:** Most strategies share `STANDARD_FEATURES` directly. Only Tennis Live In-Play has a modification (status flip). Feature names and importances should vary by strategy archetype.

**Fix:** Create at least 2 additional feature sets in `mock-fixtures.ts`:

- `CRYPTO_FEATURES` (funding_rate_24h, basis_spread, oi_change, etc.)
- `SPORTS_FEATURES` (elo_delta, injury_impact, h2h_form, market_overround, etc.)
- `TRADFI_FEATURES` (factor_momentum, earnings_surprise, sector_rotation, etc.)

Assign per strategy based on `assetClass`.

### 3.4 Pipeline Velocity/Conversion — Derive from Data

**File:** `components/promote/pipeline-overview.tsx`

**Problem:** `VELOCITY_DAYS` and `CONVERSION` are hardcoded constants, not computed from mock candidates.

**Fix:** Compute velocity from `daysInCurrentStage` across candidates. Compute conversion rates from the stage status distribution across all candidates. This makes the pipeline tab truly data-driven.

---

## Section 4: Future Enhancement — Charts (Not Blocking)

> This section is NOT required in this pass. It documents the charting gap for a future session.

The design doc (Section 2) called for several chart-based visualizations that are currently rendered as cards and tables:

- **Regime-colored equity curve** (Model & Signal tab)
- **Rolling Sharpe comparison chart** (Champion vs Challenger tab)
- **Drawdown comparison chart** (Champion vs Challenger tab)
- **IC rolling window decay curve** (Risk & Stress → Model Drift panel)
- **Monte Carlo P&L distribution histogram** (Risk & Stress → Monte Carlo panel)
- **Daily Shadow P&L bar chart** (Paper Trading tab — currently rendered as div bars)

When charts are added, use Recharts (already compatible with Next.js / React). Install via `npm install recharts` and add to `package.json`.

---

## Verification

After completing all sections:

1. `npm run build` — must pass with zero errors
2. Start dev server, navigate to `http://localhost:3100/services/promote`
3. Select "BTC Funding Arb v3" → click "Approve Stage" on Data Validation tab → verify it advances to Model & Signal (tab unlocks, stage dot turns green)
4. Select "Cross-Exchange MM" (governance stage) → verify all tabs are accessible → verify Governance final approval buttons work
5. Select "SOL Volatility Arb" (paper trading) → verify Paper Trading tab shows running state
6. Select "Tennis Live In-Play" (data validation, weakest strategy) → verify realistic weak metrics display correctly
7. Check Champion tab on a strategy WITH champion (strat-001) and one WITHOUT (strat-002) — both views should render
8. Update `PROMOTE_LIFECYCLE_DESIGN.md` Section 11 (Revision History) with a single entry summarizing all audit fixes applied
