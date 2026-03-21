# Phase 1: Lifecycle ↔ Service Tab Cross-Reference Audit — Results

**Audit date:** 2026-03-21
**Auditor:** Claude Code (automated)
**Repo:** unified-trading-system-ui
**Plan:** `unified-trading-pm/plans/active/ui_lifecycle_service_tab_cross_reference_2026_03_21.plan.md`

---

## Executive Summary

| Category | Total Checks | PASS | ISSUE | INFO |
|----------|-------------|------|-------|------|
| A. Relevance | 7 | 5 | 1 | 1 |
| B. Cross-Reference | 5 | 1 | 3 | 1 |
| C. Layout Wiring | 7 | 5 | 2 | 0 |
| D. Orphan Detection | 4 | 0 | 3 | 1 |
| E. Entitlements | 3 | 1 | 2 | 0 |
| F. Legacy | 2 | 0 | 1 | 1 |
| **Total** | **28** | **12** | **12** | **4** |

**Severity breakdown:**

| Severity | Count | Description |
|----------|-------|-------------|
| P0-blocking | 0 | No blocking issues |
| P1-fix | 6 | Must fix — broken UX, wrong tab bars, dead code |
| P2-improve | 4 | Should fix — orphan pages, access gaps |
| P3-cosmetic | 2 | Nice to fix — naming, cleanup |

---

## Section A: Relevance — Are service tabs relevant to their lifecycle stage?

### A1. Acquire ↔ DATA_TABS

```
Status: PASS
Severity: —
```

All 6 DATA_TABS entries are relevant to the Acquire lifecycle:

| Tab | Relevance |
|-----|-----------|
| Pipeline Status | ✓ Core — ETL pipeline monitoring |
| Coverage Matrix | ✓ Core — venue/instrument coverage |
| Missing Data | ✓ Core — data gap detection |
| Venue Health | ✓ Core — venue connectivity status |
| Markets | ✓ Core — market data exploration |
| ETL Logs | ✓ Core — pipeline debugging |

**Finding:** Clean alignment. No tabs out of place.

---

### A2. Build ↔ BUILD_TABS

```
Status: INFO
Severity: P3-cosmetic
```

6 of 7 BUILD_TABS are well-aligned:

| Tab | Relevance | Notes |
|-----|-----------|-------|
| Research Hub | ✓ Core | Entry point |
| Features | ✓ Core | ML feature engineering |
| ML Models | ✓ Core | Model development |
| Strategies | ✓ Core | Strategy development |
| Backtests | ✓ Core | Strategy backtesting |
| Signals | ✓ Core | Signal validation |
| Execution Research | ⚠ Borderline | Execution algo comparison — could belong in Run |

**Finding:** "Execution Research" is defensible in Build (researching which algos to use) but could also fit in Run. Current placement is acceptable but warrants a naming review — consider "Algo Research" to distinguish from live execution.

---

### A3. Promote ↔ PROMOTE_TABS

```
Status: PASS
Severity: —
```

All 4 PROMOTE_TABS entries are relevant to the Promote lifecycle:

| Tab | Relevance | Notes |
|-----|-----------|-------|
| Review Queue | ✓ Core | Strategy candidate review |
| Execution Analysis | ✓ Core | TCA for strategy approval |
| Risk Review | ✓ Core | Risk assessment before going live |
| Approval Status | ✓ Core | Handoff tracking |

**Finding:** Tabs are well-chosen for the promote workflow. The structural issue (no layout renders these) is covered in Section C.

---

### A4. Run ↔ TRADING_TABS

```
Status: PASS
Severity: —
```

All 6 TRADING_TABS entries are relevant:

| Tab | Relevance | Notes |
|-----|-----------|-------|
| Terminal | ✓ Core | Live trading interface |
| Positions | ✓ Core | Position management |
| Orders | ✓ Core | Order management |
| Execution Analytics | ✓ Core | Live execution monitoring |
| Accounts | ✓ Core | Account management |
| Markets | ✓ Core | Market overview for trading |

**Finding:** Clean alignment. "Execution Analytics" cross-references into the execution layout (matchPrefix: `/service/execution`) — structural implications covered in Section B.

---

### A5. Observe ↔ OBSERVE_TABS

```
Status: PASS
Severity: —
```

All 5 OBSERVE_TABS entries are relevant:

| Tab | Relevance | Notes |
|-----|-----------|-------|
| Risk Dashboard | ✓ Core | Real-time risk monitoring |
| Alerts | ✓ Core | Alert management |
| News | ✓ Core | Market news for situational awareness |
| Strategy Health | ✓ Core | Strategy performance monitoring |
| System Health | ✓ Core | Infrastructure health |

**Finding:** Tabs are well-chosen. Structural issue (no layout) covered in Section C.

---

### A6. Manage ↔ MANAGE_TABS

```
Status: ISSUE
Severity: P1-fix
Affected routes: /manage/clients, /manage/mandates, /manage/fees, /manage/users, /compliance
```

Tabs are relevant to the Manage lifecycle, but there is a **route group mismatch**:

| Tab | Relevance | Page Location | Issue |
|-----|-----------|---------------|-------|
| Clients | ✓ Core | app/(ops)/manage/clients/ | ⚠ (ops) not (platform) |
| Mandates | ✓ Core | app/(ops)/manage/mandates/ | ⚠ (ops) not (platform) |
| Fees | ✓ Core | app/(ops)/manage/fees/ | ⚠ (ops) not (platform) |
| Users | ✓ Core | app/(ops)/manage/users/ | ⚠ (ops) not (platform) |
| Compliance | ✓ Core | app/(ops)/compliance/ | ⚠ (ops) not (platform) |

**Finding:** All 5 Manage pages live in the (ops) route group, which requires `role === "internal" || "admin"`. MANAGE_TABS is defined as a platform component but pages are ops-only. This means:
1. External clients (client-full, client-premium, client-data-only) can NEVER access Manage pages
2. The lifecycle nav shows Manage as a stage but clicking entries redirects to /trading (ops layout rejects non-internal users)
3. MANAGE_TABS is never rendered — (ops) layout has no ServiceTabs component

**Recommendation:** Decide whether Manage is internal-only (move MANAGE_TABS to ops-specific navigation) or client-facing (move pages to (platform) with entitlement gating).

---

### A7. Report ↔ REPORTS_TABS

```
Status: PASS
Severity: —
```

All 5 REPORTS_TABS entries are relevant:

| Tab | Relevance |
|-----|-----------|
| P&L | ✓ Core |
| Executive | ✓ Core |
| Settlement | ✓ Core |
| Reconciliation | ✓ Core |
| Regulatory | ✓ Core |

**Finding:** Clean alignment. Layout is wired correctly.

---

## Section B: Cross-Reference — Shared routes across lifecycle tabs

### B1. Map all shared routes

```
Status: ISSUE
Severity: P1-fix
```

| Route | Tab Set 1 | Tab Set 2 | Label 1 | Label 2 |
|-------|-----------|-----------|---------|---------|
| `/service/trading/risk` | PROMOTE_TABS | OBSERVE_TABS | "Risk Review" | "Risk Dashboard" |
| `/service/execution/overview` | TRADING_TABS | EXECUTION_TABS | "Execution Analytics" | "Analytics" |
| `/service/trading/alerts` | OBSERVE_TABS | — | "Alerts" | (not in TRADING_TABS but uses trading layout) |
| `/service/research/execution/tca` | PROMOTE_TABS | — | "Execution Analysis" | (also at /service/execution/tca in EXECUTION_TABS) |

**Finding:** 2 routes are explicitly shared across tab sets. 2 additional routes have implicit cross-references due to layout inheritance. The shared routes create tab bar confusion (see B2).

---

### B2. Validate shared route context

```
Status: ISSUE
Severity: P1-fix
Affected routes: /service/trading/risk, /service/execution/overview
```

**`/service/trading/risk`:**
- Accessed via Promote → shows BUILD_TABS or TRADING_TABS (NOT PROMOTE_TABS, which is never rendered)
- Accessed via Observe → shows TRADING_TABS (NOT OBSERVE_TABS, which is never rendered)
- In both cases, the page renders identically — no context-aware behavior
- Lifecycle nav highlight depends on `getRouteMapping()` which returns primaryStage: "observe" — so lifecycle always highlights Observe regardless of navigation source

**`/service/execution/overview`:**
- Accessed via TRADING_TABS "Execution Analytics" → navigates to /service/execution/overview → **layout switches from trading to execution** → Row 2 tabs change from TRADING_TABS to EXECUTION_TABS
- User loses context of the Run lifecycle tab set
- No breadcrumb or back-link to return to trading tab context

**Recommendation:** Either make pages context-aware (render different content based on referrer lifecycle stage) or use a single canonical location and reference it consistently.

---

### B3. Check lifecycle-mapping.ts primaryStage for shared routes

```
Status: INFO
Severity: —
```

| Route | primaryStage | secondaryStage | In Tab Sets |
|-------|-------------|----------------|-------------|
| `/service/trading/risk` | observe | — | PROMOTE, OBSERVE |
| `/service/trading/positions` | run | observe | TRADING |
| `/service/trading/alerts` | observe | — | OBSERVE |
| `/service/execution/overview` | run | — | TRADING, EXECUTION |
| `/service/research/execution/tca` | observe | — | PROMOTE |
| `/service/research/ml/validation` | build | (secondary: promote) | BUILD |
| `/service/research/ml/registry` | build | (secondary: promote) | BUILD |
| `/service/reports/executive` | report | (secondary: observe) | REPORTS |

**Finding:** primaryStage determines which lifecycle tab highlights. For shared routes, the lifecycle nav will ALWAYS show the primaryStage regardless of which tab set the user navigated from. This is technically correct but can confuse users who clicked through a different lifecycle tab's dropdown.

---

### B4. Check stageServiceMap vs *_TABS alignment

```
Status: ISSUE
Severity: P2-improve
```

| Stage | stageServiceMap Entries | Exist in Corresponding *_TABS? |
|-------|------------------------|-------------------------------|
| acquire | `/service/data/overview` | ✓ In DATA_TABS |
| acquire | `/service/data/markets` | ✓ In DATA_TABS |
| build | `/service/research/overview` | ✓ In BUILD_TABS |
| promote | `/service/research/strategy/candidates` | ✓ In PROMOTE_TABS (but PROMOTE_TABS never renders) |
| run | `/dashboard` | ✗ NOT in any *_TABS (standalone page) |
| run | `/service/trading/overview` | ✓ In TRADING_TABS |
| run | `/service/execution/overview` | ✓ In TRADING_TABS + EXECUTION_TABS |
| observe | `/service/trading/risk` | ✓ In OBSERVE_TABS (never renders) |
| observe | `/service/trading/alerts` | ✓ In OBSERVE_TABS (never renders) |
| observe | `/health` | ✓ In OBSERVE_TABS (never renders) |
| manage | `/admin` | ✗ NOT in MANAGE_TABS |
| manage | `/manage/clients` | ✓ In MANAGE_TABS (never renders) |
| manage | `/compliance` | ✓ In MANAGE_TABS (never renders) |
| report | `/service/reports/overview` | ✓ In REPORTS_TABS |
| report | `/service/reports/executive` | ✓ In REPORTS_TABS |

**Finding:** 2 mismatches:
1. `/dashboard` is a stageServiceMap entry for "run" but has no tab set — it's a standalone page
2. `/admin` is a stageServiceMap entry for "manage" but not in MANAGE_TABS

---

### B5. Verify routeMappings coverage

```
Status: ISSUE
Severity: P2-improve
```

**Tab hrefs NOT in routeMappings:**

| Tab Set | Tab href | Status |
|---------|----------|--------|
| DATA_TABS | `/service/data/coverage` | ✗ MISSING from routeMappings |
| DATA_TABS | `/service/data/missing` | ✗ MISSING from routeMappings |
| DATA_TABS | `/service/data/venues` | ✗ MISSING from routeMappings |
| DATA_TABS | `/service/data/logs` | ✗ MISSING from routeMappings |
| TRADING_TABS | `/service/trading/orders` | ✗ MISSING from routeMappings |
| TRADING_TABS | `/service/trading/accounts` | ✗ MISSING from routeMappings |
| TRADING_TABS | `/service/trading/markets` | ✗ MISSING from routeMappings |
| OBSERVE_TABS | `/service/observe/news` | ✗ MISSING from routeMappings |
| OBSERVE_TABS | `/service/observe/strategy-health` | ✗ MISSING from routeMappings |
| REPORTS_TABS | `/service/reports/settlement` | ✗ MISSING from routeMappings |
| REPORTS_TABS | `/service/reports/reconciliation` | ✗ MISSING from routeMappings |
| REPORTS_TABS | `/service/reports/regulatory` | ✗ MISSING from routeMappings |
| EXECUTION_TABS | `/service/execution/benchmarks` | ✗ MISSING from routeMappings (but duplicated at /service/research/execution/benchmarks which IS mapped) |

**Impact:** 13 tab hrefs have no routeMappings entry. These routes will fail `getRouteMapping()` lookup, meaning:
- Lifecycle nav won't highlight the correct stage when on these pages
- Domain lane badges won't display
- The route is effectively "unmapped" in the lifecycle model

**routeMappings entries NOT reachable from any *_TABS:**
See Section D for the full orphan list.

---

## Section C: Layout Wiring Audit

### C1–C5. Active layouts

| Layout | File | Tab Set | Entitlements | Live/As-Of | Status |
|--------|------|---------|-------------|------------|--------|
| Data | `service/data/layout.tsx` | DATA_TABS | `user?.entitlements` | `LIVE_ASOF_VISIBLE.acquire` (true) | ✓ PASS |
| Research | `service/research/layout.tsx` | BUILD_TABS | `user?.entitlements` | `LIVE_ASOF_VISIBLE.build` (true) | ✓ PASS |
| Trading | `service/trading/layout.tsx` | TRADING_TABS | `user?.entitlements` | `LIVE_ASOF_VISIBLE.run` (true) | ✓ PASS |
| Execution | `service/execution/layout.tsx` | EXECUTION_TABS | `user?.entitlements` | `LIVE_ASOF_VISIBLE.run` (true) | ✓ PASS |
| Reports | `service/reports/layout.tsx` | REPORTS_TABS | `user?.entitlements` | none (report: false) | ✓ PASS |

All 5 active layouts follow the same pattern and pass entitlements correctly.

---

### C6. PROMOTE_TABS — missing layout

```
Status: ISSUE
Severity: P1-fix
Affected routes: /service/research/strategy/candidates, /service/research/execution/tca,
                 /service/trading/risk, /service/research/strategy/handoff
```

**Confirmed:** No `app/(platform)/service/promote/layout.tsx` exists. No file in the codebase imports `PROMOTE_TABS`.

**User experience:**
1. User clicks "Promote" in lifecycle nav → dropdown shows "Strategy Candidates" link
2. User clicks → navigates to `/service/research/strategy/candidates`
3. Page renders under `service/research/layout.tsx` → **BUILD_TABS appear in Row 2**
4. User sees: Research Hub | Features | ML Models | Strategies | Backtests | Signals | Execution Research
5. User does NOT see: Review Queue | Execution Analysis | Risk Review | Approval Status
6. The Promote lifecycle tab highlights correctly in Row 1 (routeMappings primaryStage: promote) but Row 2 shows the wrong tabs

**Recommendation:** Create an observe/promote-aware layout or implement contextual tab switching based on the current lifecycle stage.

---

### C7. OBSERVE_TABS — missing layout

```
Status: ISSUE
Severity: P1-fix
Affected routes: /service/trading/risk, /service/trading/alerts, /service/observe/news,
                 /service/observe/strategy-health, /health
```

**Confirmed:** No `app/(platform)/service/observe/layout.tsx` exists. No file imports `OBSERVE_TABS`.

**User experience by route:**

| Route | Layout Used | Tabs Shown | Issue |
|-------|------------|------------|-------|
| `/service/trading/risk` | trading layout | TRADING_TABS | Wrong tabs — should show OBSERVE_TABS |
| `/service/trading/alerts` | trading layout | TRADING_TABS | Wrong tabs — should show OBSERVE_TABS |
| `/service/observe/news` | NO layout | NO tabs | No Row 2 navigation at all |
| `/service/observe/strategy-health` | NO layout | NO tabs | No Row 2 navigation at all |
| `/health` | NO layout | NO tabs | No Row 2 navigation at all |

**Recommendation:** Same as C6 — either create a dedicated observe layout or implement contextual tab switching.

---

## Section D: Orphan & Missing Route Detection

### D1. Pages without tab entries (ORPHANS)

```
Status: ISSUE
Severity: P2-improve
```

**Platform orphan pages (pages that exist but are NOT referenced by any *_TABS href):**

| # | Route | routeMappings? | Category |
|---|-------|---------------|----------|
| 1 | `/service/data/markets/pnl` | ✗ No | Sub-page — likely linked from Markets |
| 2 | `/service/research/ml/overview` | ✓ build | ML sub-page |
| 3 | `/service/research/ml/experiments` | ✓ build | ML sub-page |
| 4 | `/service/research/ml/experiments/[id]` | ✗ No | Dynamic route |
| 5 | `/service/research/ml/training` | ✓ build | ML sub-page |
| 6 | `/service/research/ml/registry` | ✓ build (secondary: promote) | ML sub-page |
| 7 | `/service/research/ml/monitoring` | ✓ observe | ML sub-page (wrong lifecycle?) |
| 8 | `/service/research/ml/deploy` | ✓ promote | ML sub-page |
| 9 | `/service/research/ml/governance` | ✓ manage | ML sub-page (wrong lifecycle?) |
| 10 | `/service/research/ml/config` | ✗ No | ML sub-page |
| 11 | `/service/research/strategy/overview` | ✗ No | Strategy sub-page |
| 12 | `/service/research/strategy/results` | ✓ build | Strategy sub-page |
| 13 | `/service/research/strategy/heatmap` | ✓ build | Strategy sub-page |
| 14 | `/service/research/execution/venues` | ✓ build (secondary: acquire) | Execution sub-page |
| 15 | `/service/research/execution/benchmarks` | ✓ build | Execution sub-page |
| 16 | `/service/research/quant` | ✗ No | Standalone quant page |
| 17 | `/service/execution/candidates` | ✗ No | Execution orphan |
| 18 | `/service/execution/handoff` | ✗ No | Execution orphan |
| 19 | `/dashboard` | ✓ run | Standalone Command Center |
| 20 | `/service/overview` | ✓ run (secondary: observe) | Service Hub |
| 21 | `/service/[key]` | ✗ No | Dynamic catch-all |
| 22 | `/data` | ✗ No | Legacy redirect? |
| 23 | `/health` | ✓ observe | In OBSERVE_TABS (never rendered) |
| 24 | `/settings` | ✗ No | User settings |
| 25 | `/strategies` | ✗ No | Strategies overview |
| 26 | `/strategies/grid` | ✗ No | Strategy grid view |
| 27 | `/strategies/[id]` | ✗ No | Strategy detail |
| 28 | `/client-portal/[org]` | ✗ No | Client portal |
| 29-36 | `/portal/*` (8 pages) | ✗ No | Portal pages |

**Total platform orphans: 36 pages** (of 72 total platform pages = 50% are orphans from tab navigation)

**Categorization:**
- **15 ML/Strategy/Execution sub-pages** — legitimate deep-linked content, need in-page navigation to be discoverable
- **8 portal pages** — separate navigation model, not part of lifecycle tabs
- **5 standalone pages** (/dashboard, /service/overview, /settings, /health, /data) — entry points or utilities
- **4 strategy pages** — /strategies/* appears to be a separate browsing model
- **4 misc** (/client-portal, /service/[key], execution orphans)

---

### D2. Tab entries without pages

```
Status: PASS
Severity: —
```

**All 43 unique tab hrefs across all 8 tab sets have corresponding page.tsx files.** Zero missing pages.

---

### D3. routeMappings without pages

```
Status: INFO
Severity: P3-cosmetic
```

All routeMappings entries that reference authenticated routes have corresponding pages. No broken route mappings found. The 7 public commercial routes (`/services/data`, `/services/backtesting`, etc.) were not checked — they are in `app/(public)/`.

---

### D4. Pages without routeMappings

```
Status: ISSUE
Severity: P2-improve
```

**Pages with NO routeMappings entry (lifecycle stage unknown):**

| Route | Impact |
|-------|--------|
| `/service/data/coverage` | Lifecycle nav won't detect Acquire stage |
| `/service/data/missing` | Same |
| `/service/data/venues` | Same |
| `/service/data/logs` | Same |
| `/service/data/markets/pnl` | Same |
| `/service/trading/orders` | Lifecycle nav won't detect Run stage |
| `/service/trading/accounts` | Same |
| `/service/trading/markets` | Same |
| `/service/observe/news` | Lifecycle nav won't detect Observe stage |
| `/service/observe/strategy-health` | Same |
| `/service/reports/settlement` | Lifecycle nav won't detect Report stage |
| `/service/reports/reconciliation` | Same |
| `/service/reports/regulatory` | Same |
| `/service/research/ml/config` | No lifecycle detection |
| `/service/research/strategy/overview` | No lifecycle detection |
| `/service/research/quant` | No lifecycle detection |
| `/service/execution/candidates` | No lifecycle detection |
| `/service/execution/handoff` | No lifecycle detection |
| `/settings` | No lifecycle detection |
| `/data` | No lifecycle detection |

**Impact:** `getRouteMapping()` returns undefined for these routes. The lifecycle nav may not highlight the correct stage, and domain lane badges won't appear. However, most of these are sub-pages under a mapped prefix, so prefix matching in `getRouteMapping()` may partially compensate — e.g., `/service/data/coverage` matches the `/service/data/overview` prefix? No — it requires `path.startsWith(m.path + "/")`, so `/service/data/coverage` would NOT match `/service/data/overview/...`.

**Recommendation:** Add routeMappings entries for all 20 unmapped routes, especially the 13 that correspond to tab hrefs.

---

## Section E: Entitlement Consistency

### E1. Tab-level entitlements audit

```
Status: PASS
Severity: —
```

| Tab Set | Tab | requiredEntitlement | Exists in ENTITLEMENTS? |
|---------|-----|---------------------|------------------------|
| BUILD_TABS | Features | `ml-full` | ✓ |
| BUILD_TABS | ML Models | `ml-full` | ✓ |
| BUILD_TABS | Signals | `ml-full` | ✓ |
| BUILD_TABS | Strategies | `strategy-full` | ✓ |
| BUILD_TABS | Backtests | `strategy-full` | ✓ |
| BUILD_TABS | Execution Research | `execution-basic` | ✓ |

All entitlement names are valid. Only BUILD_TABS has entitlement-gated tabs. All other tab sets have no entitlement requirements.

---

### E2. Cross-tab entitlement consistency

```
Status: ISSUE
Severity: P2-improve
Affected routes: /service/trading/risk, /service/research/strategy/candidates,
                 /service/research/execution/tca, /service/research/strategy/handoff
```

**Shared routes with inconsistent entitlement gating:**

| Route | In Tab Set | requiredEntitlement | Notes |
|-------|-----------|---------------------|-------|
| `/service/trading/risk` | PROMOTE_TABS | none | ← no gate |
| `/service/trading/risk` | OBSERVE_TABS | none | ← consistent, both no gate |
| `/service/research/strategy/candidates` | PROMOTE_TABS | none | ← no gate |
| `/service/research/strategy/candidates` | (same route in research layout context) | — | Strategy content but no `strategy-full` gate |
| `/service/research/execution/tca` | PROMOTE_TABS | none | ← no gate |
| `/service/research/execution/tca` | (same route in research layout context) | — | Execution content but no `execution-basic` gate |

**Finding:** PROMOTE_TABS and OBSERVE_TABS have NO entitlement gating, even though their routes contain strategy and execution content that BUILD_TABS gates behind `strategy-full` and `execution-basic`. A user with only `data-basic` could access strategy candidates and execution TCA via the Promote lifecycle dropdown without the entitlements required by the Build tab set.

**Recommendation:** Add `requiredEntitlement` to PROMOTE_TABS and OBSERVE_TABS entries that reference strategy/execution content.

---

### E3. lifecycle-nav.tsx isItemAccessible vs tab entitlements

```
Status: ISSUE
Severity: P1-fix
```

**isItemAccessible logic:**
```typescript
if (path.startsWith("/service/research")) → requires strategy-full OR ml-full
if (path.startsWith("/service/trading") || path.startsWith("/service/execution")) → requires execution-basic OR execution-full
if (path.startsWith("/service/reports")) → requires reporting
// Everything else → true (always accessible)
```

**Gaps identified:**

| Route | isItemAccessible check | Tab entitlement | Gap |
|-------|----------------------|-----------------|-----|
| `/service/data/*` | Always accessible | None | ✓ Consistent |
| `/service/research/overview` | strategy-full OR ml-full | None | ⚠ Nav locks it, but tab shows no lock — user with `data-basic` can't reach it via nav but might via URL |
| `/service/research/execution/algos` | strategy-full OR ml-full | `execution-basic` | ⚠ Nav requires strategy/ML entitlement, tab requires execution entitlement — different gates |
| `/service/trading/risk` | execution-basic OR execution-full | None | ⚠ Nav locks for data-only users, but PROMOTE/OBSERVE tabs (if rendered) wouldn't lock it |
| `/service/observe/news` | Always accessible (no prefix match) | None | ✓ But `isItemAccessible` doesn't check /service/observe/* at all |
| `/service/observe/strategy-health` | Always accessible | None | ⚠ Strategy health data shown to users without strategy-full |
| `/health` | Always accessible | None | ✓ Intentional — infrastructure health |
| `/manage/*` | opsRoutes check → isInternal() | None | ✓ Internal-only via role check |

**Key issue:** The nav-level check (`isItemAccessible`) uses broad prefix matching that doesn't align with tab-level granular entitlements. This creates two problems:
1. Some routes are locked at nav level but unlocked at tab level (or vice versa)
2. `/service/observe/*` and `/service/data/*` have no nav-level access restrictions — any authenticated user can access them

**Recommendation:** Align isItemAccessible with tab-level entitlements, or move all access control to one layer (tab-level is more granular and preferred).

---

## Section F: Legacy & Cleanup

### F1. RESEARCH_TABS alias

```
Status: INFO
Severity: P3-cosmetic
```

```typescript
// service-tabs.tsx line 153
export const RESEARCH_TABS = BUILD_TABS
```

**Search result:** `RESEARCH_TABS` is exported but NOT imported anywhere in production code (only appears in .next build artifacts).

**Recommendation:** Safe to remove. No consumers. Add a comment to BUILD_TABS noting it was formerly called RESEARCH_TABS if needed for git blame context.

---

### F2. EXECUTION_TABS status

```
Status: ISSUE
Severity: P1-fix
```

```typescript
// service-tabs.tsx lines 154-160 — labeled "Legacy aliases" in comment
export const EXECUTION_TABS: ServiceTab[] = [
  { label: "Analytics", href: "/service/execution/overview" },
  { label: "Algos", href: "/service/execution/algos" },
  { label: "Venues", href: "/service/execution/venues" },
  { label: "TCA", href: "/service/execution/tca" },
  { label: "Benchmarks", href: "/service/execution/benchmarks" },
]
```

**Status:** EXECUTION_TABS is NOT legacy — it is actively imported and used by `app/(platform)/service/execution/layout.tsx`. The "Legacy aliases" comment in service-tabs.tsx is misleading.

**Relationship with TRADING_TABS:**
- TRADING_TABS has "Execution Analytics" tab with `matchPrefix: "/service/execution"` → navigates to `/service/execution/overview`
- This navigation takes the user OUT of the trading layout INTO the execution layout, switching the entire tab bar
- The two tab sets overlap on `/service/execution/overview` but with different labels ("Execution Analytics" vs "Analytics")

**Finding:** EXECUTION_TABS is an actively used, non-legacy tab set with its own layout. The "Legacy aliases" comment should be updated. The tab bar switching behavior when navigating between trading and execution is a UX issue that should be explicitly documented and potentially redesigned.

**Recommendation:**
1. Remove "Legacy aliases" comment — EXECUTION_TABS is active
2. Consider whether execution should be a sub-section of trading (merged tab bar) or a genuinely separate service (current behavior, but needs UX polish for the transition)

---

## Priority Summary

### P1-fix (Must fix — 6 items)

| ID | Finding | Recommendation |
|----|---------|----------------|
| A6 | MANAGE_TABS pages in (ops), never rendered to users | Decide: internal-only → move to ops nav; client-facing → move to (platform) |
| B2 | Shared routes show wrong tab bars | Implement contextual tab switching or deduplicate routes |
| C6 | PROMOTE_TABS defined but never rendered | Create promote layout or implement stage-aware tab switching |
| C7 | OBSERVE_TABS defined but never rendered | Create observe layout or implement stage-aware tab switching |
| E3 | isItemAccessible doesn't align with tab entitlements | Align access control to a single layer |
| F2 | EXECUTION_TABS mislabeled as "legacy" + tab bar switching UX | Update comments; decide on trading↔execution navigation model |

### P2-improve (Should fix — 4 items)

| ID | Finding | Recommendation |
|----|---------|----------------|
| B4 | stageServiceMap has entries not in *_TABS (/dashboard, /admin) | Add to tab sets or document as intentional standalone |
| B5 | 13 tab hrefs missing from routeMappings | Add routeMappings for all tab hrefs |
| D1 | 36 orphan pages (50% of platform) with no tab entry | Add tab entries for discoverable pages; document intentional standalone pages |
| E2 | PROMOTE/OBSERVE tabs lack entitlement gating for strategy/execution content | Add requiredEntitlement to sensitive tabs |

### P3-cosmetic (Nice to fix — 2 items)

| ID | Finding | Recommendation |
|----|---------|----------------|
| A2 | "Execution Research" tab naming could be clearer | Consider "Algo Research" |
| F1 | RESEARCH_TABS unused alias | Remove export |
