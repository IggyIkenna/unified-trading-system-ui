# Shared Routes Analysis

**Generated:** 2026-03-21 | **Source:** Phase 1 Audit

This document details every route that appears in multiple tab sets or serves multiple lifecycle contexts.

---

## Shared Route #1: `/service/trading/risk`

### Appearances

| Tab Set | Label | Rendered? | Lifecycle Stage |
|---------|-------|-----------|-----------------|
| PROMOTE_TABS | "Risk Review" | ✗ (no layout) | promote |
| OBSERVE_TABS | "Risk Dashboard" | ✗ (no layout) | observe |
| (neither, but uses trading layout) | — | TRADING_TABS shown | run |

### routeMappings Entry

```typescript
{ path: "/service/trading/risk", label: "Risk", primaryStage: "observe",
  lanes: ["strategy", "execution", "capital"], requiresAuth: true }
```

### Navigation Flows

**Flow 1: Via Observe lifecycle dropdown**
1. User clicks Observe → dropdown shows "Risk" entry
2. User clicks → navigates to `/service/trading/risk`
3. **Lifecycle nav:** Highlights Observe (correct — primaryStage is observe)
4. **Row 2 tabs:** Shows TRADING_TABS (Terminal, Positions, Orders, Execution Analytics, Accounts, Markets)
5. **Issue:** User is in "Observe" context but sees "Run/Trading" tabs. No "Risk Dashboard" tab is highlighted.

**Flow 2: Via Promote lifecycle dropdown**
1. User clicks Promote → dropdown shows "Strategy Candidates" (primary entry)
2. User navigates to `/service/research/strategy/candidates` (under research layout)
3. To reach Risk Review, user must navigate via lifecycle dropdown again — there's no in-page link
4. Clicking Risk Review → navigates to `/service/trading/risk`
5. **Layout switches** from research to trading — jarring transition
6. **Lifecycle nav:** Highlights Observe (NOT Promote — because primaryStage is observe)

**Flow 3: Direct URL**
1. User types `/service/trading/risk` in address bar
2. Lifecycle nav highlights Observe
3. Row 2 shows TRADING_TABS
4. No indication this is also a Promote-related page

### Impact

- **Tab bar mismatch:** Risk page shows TRADING_TABS, but user expects Observe or Promote tabs
- **Lifecycle highlight wrong for Promote:** primaryStage is observe, so Promote is never highlighted even when user came from Promote dropdown
- **No context-aware rendering:** Page is identical regardless of navigation source

### Recommendation

Option A: Create `/service/observe/risk` and `/service/promote/risk-review` as separate routes pointing to the same component but with different layouts
Option B: Implement a query parameter (`?context=promote`) that the page reads to adjust its header/context
Option C: Create observe and promote layouts that render their respective tab sets

---

## Shared Route #2: `/service/execution/overview`

### Appearances

| Tab Set | Label | matchPrefix | Rendered? |
|---------|-------|-------------|-----------|
| TRADING_TABS | "Execution Analytics" | `/service/execution` | ✓ (trading layout) |
| EXECUTION_TABS | "Analytics" | — | ✓ (execution layout) |

### Navigation Flow

**Flow: Trading → Execution switch**
1. User is on `/service/trading/overview` → sees TRADING_TABS
2. User clicks "Execution Analytics" tab → navigates to `/service/execution/overview`
3. **Layout switches** from `service/trading/layout.tsx` to `service/execution/layout.tsx`
4. **Row 2 tabs change** from TRADING_TABS (Terminal, Positions, Orders, ...) to EXECUTION_TABS (Analytics, Algos, Venues, TCA, Benchmarks)
5. User is now in execution context — no easy way back to trading tabs
6. Browser back button returns to trading context (correct)

### Impact

- **Tab bar switch is abrupt:** User clicks a tab expecting to stay in the same navigation context, but the entire tab bar changes
- **Navigation asymmetry:** Trading tabs include an "Execution Analytics" entry, but execution tabs do NOT include a "Back to Trading" entry
- **matchPrefix confusion:** TRADING_TABS "Execution Analytics" has `matchPrefix: "/service/execution"` — this means when user is on ANY /service/execution/* page, the "Execution Analytics" tab would be active IF the trading layout were shown. But since the execution layout takes over, EXECUTION_TABS are shown instead.

### Recommendation

Option A: Merge EXECUTION_TABS into TRADING_TABS as a sub-group
Option B: Keep separate but add a "← Trading" breadcrumb/link in the execution layout
Option C: Remove "Execution Analytics" from TRADING_TABS and make execution only accessible via lifecycle nav

---

## Shared Route #3: `/service/trading/alerts`

### Appearances

| Tab Set | Label | Rendered? |
|---------|-------|-----------|
| OBSERVE_TABS | "Alerts" | ✗ (no layout) |
| (not in TRADING_TABS) | — | TRADING_TABS shown (trading layout) |

### Impact

- Alerts page renders under trading layout → shows TRADING_TABS
- "Alerts" is NOT a TRADING_TAB entry → no tab is highlighted when on this page
- User navigating here from Observe lifecycle dropdown sees trading context with no active tab
- routeMappings primaryStage is "observe" but layout is trading

### Recommendation

Add "Alerts" to TRADING_TABS, or create observe layout, or both.

---

## Shared Route #4: `/service/research/execution/tca`

### Appearances

| Tab Set | Label | Rendered? |
|---------|-------|-----------|
| PROMOTE_TABS | "Execution Analysis" | ✗ (no layout) |
| (also exists as /service/execution/tca in EXECUTION_TABS) | "TCA" | ✓ (execution layout) |

### Impact

- Two different URLs for the same concept (TCA): `/service/research/execution/tca` and `/service/execution/tca`
- PROMOTE_TABS references the research version; EXECUTION_TABS references the execution version
- routeMappings maps research TCA to primaryStage "observe" (not "promote" as PROMOTE_TABS implies)
- Are these the same component or different implementations? **Requires Phase 2 verification.**

### Recommendation

Consolidate to a single TCA route, or clearly differentiate (e.g., "Research TCA" vs "Live TCA").

---

## Cross-Reference Summary

| Route | Used By | primaryStage | Layout Shown | Correct Tabs? | Correct Stage Highlight? |
|-------|---------|-------------|-------------|---------------|------------------------|
| `/service/trading/risk` | PROMOTE, OBSERVE | observe | TRADING | ✗ | Partial (observe correct, promote wrong) |
| `/service/execution/overview` | TRADING, EXECUTION | run | EXECUTION (after switch) | ✗ (switches) | ✓ |
| `/service/trading/alerts` | OBSERVE | observe | TRADING | ✗ | ✓ |
| `/service/research/execution/tca` | PROMOTE | observe | RESEARCH (BUILD_TABS) | ✗ | ✗ (shows observe, not promote) |

**Pattern:** Every shared route shows the WRONG tab set in Row 2, because tab sets are determined by the URL-based layout hierarchy, not by the lifecycle stage the user navigated from.
