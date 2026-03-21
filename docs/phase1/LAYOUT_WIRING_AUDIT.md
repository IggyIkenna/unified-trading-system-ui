# Layout Wiring Audit

**Generated:** 2026-03-21 | **Source:** Phase 1 Audit

This document details the exact wiring of every layout.tsx file and which tab sets they render.

---

## Layout Hierarchy

```
app/
├── (public)/                    # No auth, no shell, no tabs
│   └── layout.tsx               # Minimal — marketing pages
│
├── (platform)/                  # Auth required, UnifiedShell + lifecycle nav
│   └── layout.tsx               # RequireAuth → UnifiedShell (orgName, userName, userRole)
│       └── service/
│           ├── data/layout.tsx          → DATA_TABS (6 tabs)
│           ├── research/layout.tsx      → BUILD_TABS (7 tabs)
│           ├── trading/layout.tsx       → TRADING_TABS (6 tabs)
│           ├── execution/layout.tsx     → EXECUTION_TABS (5 tabs)
│           ├── reports/layout.tsx       → REPORTS_TABS (5 tabs)
│           ├── observe/                 → ❌ NO layout.tsx (2 pages orphaned)
│           └── [key]/                   → No service tabs (catch-all)
│
├── (ops)/                       # Auth + role=internal/admin required
│   └── layout.tsx               # RequireAuth → role check → UnifiedShell (admin context)
│       └── manage/layout.tsx    # Metadata only, NO ServiceTabs
```

---

## Active Layouts — Detailed Wiring

### 1. Data Layout (`app/(platform)/service/data/layout.tsx`)

```
Import: ServiceTabs, DATA_TABS, LIVE_ASOF_VISIBLE from service-tabs
Import: LiveAsOfToggle from platform/live-asof-toggle
Import: useAuth from hooks/use-auth

Renders:
  <ServiceTabs
    tabs={DATA_TABS}                                    // 6 tabs, no entitlements
    entitlements={user?.entitlements}                    // from useAuth()
    rightSlot={LIVE_ASOF_VISIBLE.acquire && <LiveAsOfToggle />}  // acquire=true → shown
  />
  {children}
```

**Serves:** `/service/data/overview`, `/service/data/coverage`, `/service/data/missing`, `/service/data/venues`, `/service/data/markets`, `/service/data/logs`, `/service/data/markets/pnl`
**Live/As-Of:** Shown (acquire: true)
**Status:** ✓ Correctly wired

---

### 2. Research Layout (`app/(platform)/service/research/layout.tsx`)

```
Import: ServiceTabs, BUILD_TABS, LIVE_ASOF_VISIBLE from service-tabs
Import: LiveAsOfToggle from platform/live-asof-toggle
Import: useAuth from hooks/use-auth

Renders:
  <ServiceTabs
    tabs={BUILD_TABS}                                   // 7 tabs, 3 entitlements
    entitlements={user?.entitlements}
    rightSlot={LIVE_ASOF_VISIBLE.build && <LiveAsOfToggle />}  // build=true → shown
  />
  {children}
```

**Serves:** All 25 pages under `/service/research/*` including:
- 7 BUILD_TABS pages (highlighted tabs)
- 4 PROMOTE_TABS pages that happen to be under /service/research/ (show BUILD_TABS, not PROMOTE_TABS)
- 14 orphan pages (no tab highlighted)
**Live/As-Of:** Shown (build: true)
**Status:** ✓ Layout works, but serves PROMOTE routes with wrong tabs (see C6)

---

### 3. Trading Layout (`app/(platform)/service/trading/layout.tsx`)

```
Import: ServiceTabs, TRADING_TABS, LIVE_ASOF_VISIBLE from service-tabs
Import: LiveAsOfToggle from platform/live-asof-toggle
Import: useAuth from hooks/use-auth

Renders:
  <ServiceTabs
    tabs={TRADING_TABS}                                 // 6 tabs, no entitlements
    entitlements={user?.entitlements}
    rightSlot={LIVE_ASOF_VISIBLE.run && <LiveAsOfToggle />}  // run=true → shown
  />
  {children}
```

**Serves:** 7 pages under `/service/trading/*`:
- 6 TRADING_TABS pages (highlighted tabs)
- `/service/trading/risk` — in PROMOTE_TABS + OBSERVE_TABS but shows TRADING_TABS (no tab highlighted)
- `/service/trading/alerts` — in OBSERVE_TABS but shows TRADING_TABS (no tab highlighted)
**Live/As-Of:** Shown (run: true)
**Status:** ✓ Layout works, but serves Observe/Promote routes with wrong tabs (see C6, C7)

---

### 4. Execution Layout (`app/(platform)/service/execution/layout.tsx`)

```
Import: ServiceTabs, EXECUTION_TABS, LIVE_ASOF_VISIBLE from service-tabs
Import: LiveAsOfToggle from platform/live-asof-toggle
Import: useAuth from hooks/use-auth

Renders:
  <ServiceTabs
    tabs={EXECUTION_TABS}                               // 5 tabs, no entitlements
    entitlements={user?.entitlements}
    rightSlot={LIVE_ASOF_VISIBLE.run && <LiveAsOfToggle />}  // run=true → shown
  />
  {children}
```

**Serves:** 7 pages under `/service/execution/*`:
- 5 EXECUTION_TABS pages (highlighted tabs)
- `/service/execution/candidates` — orphan (no tab highlighted)
- `/service/execution/handoff` — orphan (no tab highlighted)
**Live/As-Of:** Shown (run: true)
**Status:** ✓ Layout works. Note: labeled "Legacy" in service-tabs.tsx but actively used.

---

### 5. Reports Layout (`app/(platform)/service/reports/layout.tsx`)

```
Import: ServiceTabs, REPORTS_TABS from service-tabs
Import: useAuth from hooks/use-auth

Renders:
  <ServiceTabs
    tabs={REPORTS_TABS}                                 // 5 tabs, no entitlements
    entitlements={user?.entitlements}
    // NO rightSlot (report: false in LIVE_ASOF_VISIBLE)
  />
  {children}
```

**Serves:** 5 pages under `/service/reports/*`
**Live/As-Of:** Not shown (report: false)
**Status:** ✓ Correctly wired. Simplest layout — no Live/As-Of toggle.

---

## Missing Layouts

### ❌ Promote Layout — Does NOT exist

**Expected:** `app/(platform)/service/promote/layout.tsx`
**Status:** No directory, no layout
**Impact:** PROMOTE_TABS (4 tabs) is never rendered

**Routes affected:**
| Route | Falls Through To | Tabs Shown |
|-------|-----------------|------------|
| `/service/research/strategy/candidates` | research layout | BUILD_TABS |
| `/service/research/execution/tca` | research layout | BUILD_TABS |
| `/service/research/strategy/handoff` | research layout | BUILD_TABS |
| `/service/trading/risk` | trading layout | TRADING_TABS |

### ❌ Observe Layout — Does NOT exist

**Expected:** `app/(platform)/service/observe/layout.tsx`
**Status:** Directory exists (has news/ and strategy-health/ subdirs), but no layout.tsx
**Impact:** OBSERVE_TABS (5 tabs) is never rendered

**Routes affected:**
| Route | Falls Through To | Tabs Shown |
|-------|-----------------|------------|
| `/service/trading/risk` | trading layout | TRADING_TABS |
| `/service/trading/alerts` | trading layout | TRADING_TABS |
| `/service/observe/news` | platform layout only | NO tabs |
| `/service/observe/strategy-health` | platform layout only | NO tabs |
| `/health` | platform layout only | NO tabs |

---

## Ops Layout

### `app/(ops)/layout.tsx`

```
Import: RequireAuth, UnifiedShell from shell components
Import: useAuth from hooks/use-auth

Logic:
  1. RequireAuth wrapper (redirects to /login if not authenticated)
  2. OpsShellInner checks: user.role === "internal" || "admin"
  3. If unauthorized → redirects to /trading + shows "Access Denied"
  4. If authorized → UnifiedShell with orgName="Odum Internal"

NO ServiceTabs rendered. NO *_TABS imported.
```

### `app/(ops)/manage/layout.tsx`

```
Import: Metadata from "next"

Renders:
  <div className="min-h-screen bg-background">
    {children}
  </div>

NO ServiceTabs. NO *_TABS. Metadata only.
```

**Impact:** MANAGE_TABS is defined but the ops layouts don't use it. Manage pages render with the base ops shell but no Row 2 tab navigation.

---

## Tab Set Usage Summary

| Tab Set | Defined In | Imported By Layout | Rendered | Status |
|---------|-----------|-------------------|----------|--------|
| DATA_TABS | service-tabs.tsx:87 | service/data/layout.tsx | ✓ | Active |
| BUILD_TABS | service-tabs.tsx:97 | service/research/layout.tsx | ✓ | Active |
| PROMOTE_TABS | service-tabs.tsx:108 | **NONE** | ✗ | Dead code |
| TRADING_TABS | service-tabs.tsx:116 | service/trading/layout.tsx | ✓ | Active |
| OBSERVE_TABS | service-tabs.tsx:126 | **NONE** | ✗ | Dead code |
| MANAGE_TABS | service-tabs.tsx:135 | **NONE** | ✗ | Dead code |
| REPORTS_TABS | service-tabs.tsx:144 | service/reports/layout.tsx | ✓ | Active |
| EXECUTION_TABS | service-tabs.tsx:154 | service/execution/layout.tsx | ✓ | Active (mislabeled "legacy") |
| RESEARCH_TABS | service-tabs.tsx:153 | **NONE** | ✗ | Dead alias for BUILD_TABS |
