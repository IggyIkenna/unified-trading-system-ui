# Phase 2b: Build Tab — Navigation & Routing Audit

**Generated:** 2026-03-21 | **Source:** Phase 2b Audit

---

## Navigation Architecture (3 layers)

```
Row 0: Lifecycle Nav (lifecycle-nav.tsx) — stage-level: Acquire → Build → Promote → ...
Row 1: Service Tabs (service-tabs.tsx → BUILD_TABS) — domain-level: Research Hub | Features | ML Models | ...
Row 2: Sub-Nav (MLNav / StrategyPlatformNav / ExecutionNav) — page-level: Overview | Experiments | Training | ...
```

---

## CRITICAL BUG: Sub-Nav Components Use Wrong Href Prefixes

All three sub-navigation components link to routes that don't exist in the `app/(platform)/service/research/` directory.

### MLNav (`components/ml/ml-nav.tsx`)

| MLNav href | Correct href | Page Exists At |
| ---------- | ------------ | -------------- |
| `/ml/overview` | `/service/research/ml/overview` | ✓ research |
| `/ml/experiments` | `/service/research/ml/experiments` | ✓ research |
| `/ml/training` | `/service/research/ml/training` | ✓ research |
| `/ml/registry` | `/service/research/ml/registry` | ✓ research |
| `/ml/validation` | `/service/research/ml/validation` | ✓ research |
| `/ml/deploy` | `/service/research/ml/deploy` | ✓ research |
| `/ml/monitoring` | `/service/research/ml/monitoring` | ✓ research |
| `/ml/features` | `/service/research/ml/features` | ✓ research |
| `/ml/governance` | `/service/research/ml/governance` | ✓ research |

**Impact:** All 9 MLNav links navigate to non-existent `/ml/*` routes → user gets a 404 or blank page. MLNav is used on `ml/overview` page.

### StrategyPlatformNav (`components/strategy-platform/strategy-nav.tsx`)

| StrategyPlatformNav href | Correct href |
| ------------------------ | ------------ |
| `/strategy-platform/overview` | `/service/research/strategy/overview` |
| `/strategy-platform/backtests` | `/service/research/strategy/backtests` |
| `/strategy-platform/compare` | `/service/research/strategy/compare` |
| `/strategy-platform/results` | `/service/research/strategy/results` |
| `/strategy-platform/heatmap` | `/service/research/strategy/heatmap` |
| `/strategy-platform/candidates` | `/service/research/strategy/candidates` |
| `/strategy-platform/handoff` | `/service/research/strategy/handoff` |

**Impact:** All 7 StrategyPlatformNav links broken. Used on `strategy/heatmap` and `strategy/handoff`.

### ExecutionNav (`components/execution-platform/execution-nav.tsx`)

| ExecutionNav href | Correct href (research context) | Also valid at (execution context) |
| ----------------- | ------------------------------- | ---------------------------------- |
| `/execution/overview` | `/service/research/execution/overview` (N/A — no page) | `/service/execution/overview` |
| `/execution/algos` | `/service/research/execution/algos` | `/service/execution/algos` |
| `/execution/venues` | `/service/research/execution/venues` | `/service/execution/venues` |
| `/execution/tca` | `/service/research/execution/tca` | `/service/execution/tca` |
| `/execution/benchmarks` | `/service/research/execution/benchmarks` | `/service/execution/benchmarks` |
| `/execution/candidates` | N/A | `/service/execution/candidates` |
| `/execution/handoff` | N/A | `/service/execution/handoff` |

**Impact:** ExecutionNav links broken in research context. Note: ExecutionNav is also used in `service/execution/*` pages where it should link to `/service/execution/*` — so this component needs **context-aware prefixing**, not a simple find-and-replace.

---

## Tab Active State Analysis

### matchPrefix Overlap (C2)

When the user is on `/service/research/ml/features`:

```
Tab iteration:
1. Research Hub → href="/service/research/overview" → match? NO
2. Features → href="/service/research/ml/features" → EXACT MATCH → isActive = true ✓
3. ML Models → matchPrefix="/service/research/ml" → "/service/research/ml/features".startsWith("/service/research/ml/") → true → isActive = true ✗ (dual highlight!)
4-7. Others → NO
```

**Result:** Both Features AND ML Models tabs appear active (both have `border-primary text-primary`).

Same issue for `/service/research/ml/validation` (Signals tab):
- Signals: exact match → active ✓
- ML Models: prefix match → also active ✗

**On orphan ML pages** (e.g., `/service/research/ml/training`):
- ML Models: prefix match → active ✓ (correct — this is the parent tab)
- No other tab matches → single highlight ✓

### Fix Options

| Option | Description | Effort | Risk |
| ------ | ----------- | ------ | ---- |
| A | Add `matchPrefix` to Features and Signals that is more specific (e.g., Features: `/service/research/ml/features`, Signals: `/service/research/ml/validation`) — but these are already exact matches. The issue is ML Models also matching. | — | Doesn't fix it |
| B | Change algorithm: check exact `href` match first across ALL tabs; only fall back to prefix if no exact match found. | Low | Need to verify all tab sets |
| C | Add `excludePrefix` array to ML Models tab to explicitly exclude Features and Signals paths. | Medium | More complex API |
| **D (recommended)** | Change ML Models `matchPrefix` to exclude known sub-paths: use a custom matcher function instead of simple prefix. Or remove matchPrefix from ML Models and add it only to the tabs that need it. | Low | Clean solution |

---

## Lifecycle Navigation Highlight

### getRouteMapping() for Build Routes

| Route | getRouteMapping() | primaryStage | secondaryStage | Lifecycle Highlight |
| ----- | ----------------- | ------------ | -------------- | ------------------- |
| `/service/research/overview` | ✓ exact | build | — | Build ✓ |
| `/service/research/ml` | ✓ exact | build | — | Build ✓ |
| `/service/research/ml/features` | ✓ exact | build | — | Build ✓ |
| `/service/research/ml/validation` | ✓ exact | build | promote | Build ✓ |
| `/service/research/strategy/backtests` | ✓ exact | build | — | Build ✓ |
| `/service/research/strategy/compare` | ✓ exact | build | — | Build ✓ |
| `/service/research/execution/algos` | ✓ exact | build | — | Build ✓ |
| `/service/research/ml/overview` | ✓ exact | build | — | Build ✓ |
| `/service/research/ml/experiments` | ✓ exact | build | — | Build ✓ |
| `/service/research/ml/experiments/[id]` | ✓ prefix (→ ml/experiments) | build | — | Build ✓ |
| `/service/research/ml/training` | ✓ exact | build | — | Build ✓ |
| `/service/research/ml/registry` | ✓ exact | build | promote | Build ✓ |
| `/service/research/ml/monitoring` | ✓ exact | **observe** | — | **Observe** ✗ |
| `/service/research/ml/deploy` | ✓ exact | **promote** | — | **Promote** ✗ |
| `/service/research/ml/governance` | ✓ exact | **manage** | — | **Manage** ✗ |
| `/service/research/ml/config` | ✗ MISSING | — | — | **None** ✗ |
| `/service/research/strategy/overview` | ✗ MISSING | — | — | **None** ✗ |
| `/service/research/strategy/results` | ✓ exact | build | — | Build ✓ |
| `/service/research/strategy/heatmap` | ✓ exact | build | — | Build ✓ |
| `/service/research/execution/venues` | ✓ exact | build | acquire | Build ✓ |
| `/service/research/execution/benchmarks` | ✓ exact | build | — | Build ✓ |
| `/service/research/quant` | ✗ MISSING | — | — | **None** ✗ |

---

## Internal Navigation Flow

### Research Hub as Entry Point

The Research Hub (`/service/research/overview`) provides the primary navigation hub for all research pages:

```
Research Hub
├── ML tab
│   ├── WorkflowPipeline: Select→Features→Train→Validate→Deploy→Monitor (6 links)
│   ├── "Open ML Dashboard" button → /service/research/ml/overview
│   └── "View Experiments" button → /service/research/ml/experiments
│
├── Strategy tab
│   ├── WorkflowPipeline: Configure→Backtest→Compare→Candidates→Handoff (5 links)
│   ├── "Open Backtests" button → /service/research/strategy/backtests
│   └── "View Candidates" button → /service/research/strategy/candidates
│
└── Execution tab
    ├── WorkflowPipeline: Algos→Venues→TCA→Benchmarks (4 links)
    ├── "Open Algo Comparison" button → /service/research/execution/algos
    └── "View TCA" button → /service/research/execution/tca
```

### Pages NOT Reachable from Research Hub

| Route | Reachable From |
| ----- | -------------- |
| `/service/research/ml/experiments/[id]` | ml/experiments row click |
| `/service/research/ml/registry` | MLNav only (broken) |
| `/service/research/ml/governance` | MLNav only (broken) |
| `/service/research/ml/config` | URL only |
| `/service/research/strategy/overview` | URL only |
| `/service/research/strategy/results` | Potentially from backtest row click |
| `/service/research/strategy/heatmap` | Research Hub "Backtest" step link |
| `/service/research/quant` | URL only |

---

## EntityLink Route Mapping

`EntityLink` component (`components/trading/entity-link.tsx`) provides cross-domain linking:

| Entity Type | Link Target | Used By Research Pages |
| ----------- | ----------- | ---------------------- |
| experiment | `/ml/experiments/{id}` | ml/overview, ml/training | **BROKEN** — should be `/service/research/ml/experiments/{id}` |
| model | `/ml/registry?model={id}` | ml/overview | **BROKEN** — should be `/service/research/ml/registry?model={id}` |
| strategy | `/strategies/{id}` | — | N/A for research |

---

## Recommendations

1. **Fix sub-nav prefixes (P1):** Make MLNav, StrategyPlatformNav, and ExecutionNav context-aware — accept a `basePath` prop that defaults to the correct prefix for the current layout context.

2. **Fix matchPrefix overlap (P1):** Change ServiceTabs active-state algorithm to prefer exact href match before falling back to prefix matching.

3. **Add missing routeMappings (P1):** Add entries for `/service/research/ml/config`, `/service/research/strategy/overview`, `/service/research/quant`.

4. **Fix EntityLink targets (P2):** Update experiment and model entity links to use `/service/research/` prefix.

5. **Add breadcrumbs (P2):** Research pages deeper than 2 levels should show breadcrumbs for orientation.
