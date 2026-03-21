# Phase 2d: Run Tab — Navigation & Routing Analysis

**Audit date:** 2026-03-21
**Scope:** Tab active states, layout switching, lifecycle nav, cross-lifecycle links

---

## Architecture Overview

The Run lifecycle uses a **dual-layout model**:

```
Row 1: Lifecycle Nav (horizontal) → [Acquire] [Build] [Promote] [Run ←active] [Observe] [Manage] [Report]
                                                                   │
                                                                   ▼
Row 2: Service Tabs ─── TRADING_TABS (6 tabs) ─── trading/layout.tsx
                    └── EXECUTION_TABS (5 tabs) ─── execution/layout.tsx

Run lifecycle entry points (stageServiceMap):
  /dashboard             → Command Center (standalone, no service tabs)
  /service/trading/overview → Trading Terminal (TRADING_TABS)
  /service/execution/overview → Execution Analytics (EXECUTION_TABS)
```

---

## TRADING_TABS — Active State Analysis

**Definition:** `components/shell/service-tabs.tsx` lines 116–123

| # | Tab | href | matchPrefix | Active when pathname is... |
| - | --- | ---- | ----------- | ------------------------- |
| 1 | Terminal | `/service/trading/overview` | — | exactly `/service/trading/overview` |
| 2 | Positions | `/service/trading/positions` | — | exactly `/service/trading/positions` |
| 3 | Orders | `/service/trading/orders` | — | exactly `/service/trading/orders` |
| 4 | Execution Analytics | `/service/execution/overview` | `/service/execution` | exactly `/service/execution/overview` OR starts with `/service/execution/` |
| 5 | Accounts | `/service/trading/accounts` | — | exactly `/service/trading/accounts` |
| 6 | Markets | `/service/trading/markets` | — | exactly `/service/trading/markets` |

### Issues Found

**Tab 4 matchPrefix is unreachable:** When pathname matches `/service/execution/*`, Next.js renders `execution/layout.tsx` (which shows EXECUTION_TABS), not `trading/layout.tsx` (which shows TRADING_TABS). So the matchPrefix `/service/execution` in TRADING_TABS can never trigger — the trading layout is not rendered for those paths.

**No entitlement gating:** Zero TRADING_TABS entries have `requiredEntitlement`. A `client-data-only` user (entitlements: `["data-basic"]`) can access all trading pages via URL. The `isItemAccessible` check in lifecycle-nav.tsx requires `execution-basic` or `execution-full` for `/service/trading/*`, but this only hides the nav item — URL direct access is ungated.

---

## EXECUTION_TABS — Active State Analysis

**Definition:** `components/shell/service-tabs.tsx` lines 154–160

| # | Tab | href | Active when pathname is... |
| - | --- | ---- | ------------------------- |
| 1 | Analytics | `/service/execution/overview` | exactly `/service/execution/overview` |
| 2 | Algos | `/service/execution/algos` | exactly `/service/execution/algos` |
| 3 | Venues | `/service/execution/venues` | exactly `/service/execution/venues` |
| 4 | TCA | `/service/execution/tca` | exactly `/service/execution/tca` |
| 5 | Benchmarks | `/service/execution/benchmarks` | exactly `/service/execution/benchmarks` |

### Issues Found

**No entitlement gating:** Same as TRADING_TABS — zero entries have `requiredEntitlement`.

**Orphan pages not included:** `/service/execution/candidates` and `/service/execution/handoff` exist as pages but have no tab entries. They are only reachable via ExecutionNav (which has broken links).

---

## Layout Switching Behavior

### Trading → Execution

```
/service/trading/overview  (trading/layout.tsx → TRADING_TABS)
        │
        │  Click "Execution Analytics" tab
        ▼
/service/execution/overview  (execution/layout.tsx → EXECUTION_TABS)
```

**What changes:**
1. Row 2 tab bar: TRADING_TABS (6 tabs) → EXECUTION_TABS (5 tabs)
2. All tab labels change
3. No breadcrumb or context indicator
4. No "Back to Trading" link in EXECUTION_TABS

**What doesn't change:**
1. Row 1 lifecycle nav still shows "Run" as active (both routes map to "run")
2. Live/As-Of toggle still present (both layouts check `LIVE_ASOF_VISIBLE.run`)

### Execution → Trading

**No direct path.** EXECUTION_TABS has no entry pointing back to `/service/trading/*`. User must:
- Use browser back button
- Click "Run" in lifecycle nav dropdown and select "Trading"
- Type URL manually

---

## Lifecycle Nav (Row 1) — routeMappings Audit

### Run Lifecycle Routes

| Route | In routeMappings? | primaryStage | secondaryStage | Lifecycle nav highlights |
| ----- | ----------------- | ------------ | -------------- | ----------------------- |
| `/dashboard` | ✓ | run | — | Run ✓ |
| `/service/trading/overview` | ✓ | run | — | Run ✓ |
| `/service/trading/positions` | ✓ | run | observe | Run ✓ |
| `/service/trading/orders` | ✗ | — | — | **None** ⚠ |
| `/service/trading/accounts` | ✗ | — | — | **None** ⚠ |
| `/service/trading/markets` | ✗ | — | — | **None** ⚠ |
| `/service/execution/overview` | ✓ | run | — | Run ✓ |
| `/service/execution/algos` | ✓ | build | — | **Build** ⚠ |
| `/service/execution/venues` | ✓ | build | — | **Build** ⚠ |
| `/service/execution/tca` | ✓ | observe | — | **Observe** ⚠ |
| `/service/execution/benchmarks` | ✗ | — | — | **None** ⚠ |
| `/service/execution/candidates` | ✗ | — | — | **None** ⚠ |
| `/service/execution/handoff` | ✗ | — | — | **None** ⚠ |
| `/service/overview` | ✓ | run | observe | Run ✓ |

### getRouteMapping() Behavior for Missing Routes

```typescript
export function getRouteMapping(path: string): RouteMapping | undefined {
  const exactMatch = routeMappings.find(m => m.path === path)
  if (exactMatch) return exactMatch
  const prefixMatch = routeMappings
    .filter(m => path.startsWith(m.path + "/"))
    .sort((a, b) => b.path.length - a.path.length)[0]
  return prefixMatch
}
```

**Prefix matching attempt for missing routes:**

| Missing Route | Prefix match candidate | Result |
| ------------- | ---------------------- | ------ |
| `/service/trading/orders` | `/service/trading/overview`? No — `"/service/trading/orders".startsWith("/service/trading/overview/")` = false | **No match** |
| `/service/trading/accounts` | Same — no prefix match | **No match** |
| `/service/trading/markets` | Same — no prefix match | **No match** |
| `/service/execution/benchmarks` | `/service/execution/overview`? No — not a prefix | **No match** |

Prefix matching requires `path.startsWith(m.path + "/")` — sibling routes (trading/orders vs trading/overview) don't match.

---

## ExecutionNav — Broken Links

**Source:** `components/execution-platform/execution-nav.tsx`

| ExecutionNav href | Actual App Router path | Match? |
| ----------------- | ---------------------- | ------ |
| `/execution/overview` | `/service/execution/overview` | ✗ BROKEN |
| `/execution/algos` | `/service/execution/algos` | ✗ BROKEN |
| `/execution/venues` | `/service/execution/venues` | ✗ BROKEN |
| `/execution/tca` | `/service/execution/tca` | ✗ BROKEN |
| `/execution/benchmarks` | `/service/execution/benchmarks` | ✗ BROKEN |
| `/execution/candidates` | `/service/execution/candidates` | ✗ BROKEN |
| `/execution/handoff` | `/service/execution/handoff` | ✗ BROKEN |

All 7 ExecutionNav links are missing the `/service/` prefix. Every link navigates to a non-existent route.

---

## Cross-Lifecycle Links from Run Pages

| Source | Target | Target Stage | Link Type |
| ------ | ------ | ------------ | --------- |
| Dashboard | `/service/trading/risk` | Observe | Strategy table link |
| Dashboard | `/service/trading/alerts` | Observe | AlertsFeed item links |
| Dashboard | `/health` | Observe | HealthStatusGrid links |

No other Run lifecycle pages contain links to pages in other lifecycle stages.

---

## Recommended Fixes

### Critical (P0/P1)

1. **Fix ExecutionNav paths** — add `/service/` prefix to all 7 hrefs
2. **Add 4 missing routeMappings** — `/service/trading/orders`, `/service/trading/accounts`, `/service/trading/markets`, `/service/execution/benchmarks` with `primaryStage: "run"`
3. **Add entitlements to TRADING_TABS** — at minimum `execution-basic` on all tabs to prevent URL bypass by `client-data-only` users
4. **Resolve layout switching UX** — either add "← Trading" back-link in execution layout, or merge tab sets

### Important (P2)

5. **Add candidates/handoff to EXECUTION_TABS** — or document why they're excluded
6. **Review execution sub-page primaryStage** — consider whether `/service/execution/algos` (currently "build"), `/service/execution/venues` (currently "build"), `/service/execution/tca` (currently "observe") should be "run" when accessed via EXECUTION_TABS
7. **Remove ExecutionNav component** — it duplicates EXECUTION_TABS with different labels, different active state logic, and broken links
