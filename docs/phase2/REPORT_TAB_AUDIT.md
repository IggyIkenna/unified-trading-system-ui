# Phase 2g: Report Lifecycle Tab — Deep Audit Results

**Date:** 2026-03-21
**Scope:** All 5 routes under `/service/reports/*` (REPORTS_TABS)
**Branch:** `feat/service-centric-navigation`
**Plan:** `ui_phase2_report_tab_audit_2026_03_21.plan.md`

---

## Summary

| Category               | Tasks | PASS | ISSUE | INFO | Blocking |
| ---------------------- | ----- | ---- | ----- | ---- | -------- |
| A. Component Inventory | 5     | 2    | 0     | 3    | 0        |
| B. Navigation          | 4     | 2    | 2     | 0    | 0        |
| C. Data Wiring         | 3     | 0    | 0     | 3    | 0        |
| D. UX Audit            | 4     | 1    | 2     | 1    | 0        |
| E. Entitlement         | 2     | 0    | 2     | 0    | 0        |
| F. Cross-Reference     | 2     | 0    | 0     | 2    | 0        |
| **Technical Total**    | **20** | **5** | **6** | **9** | **0**   |
| Business Alignment     | 7     | —    | 5 (P2) | —  | 0        |

**Highest severity:** P1-fix (2 issues — E1 URL bypass, D1 missing loading/error states on P&L page)
**Business alignment:** Overall well-aligned to back-office purpose. Treasury tab misplacement and P&L/Settlement duplication are the main structural concerns. See `REPORT_TAB_BUSINESS_ALIGNMENT.md` for full analysis.

---

## A. Component Inventory

### A1. P&L Page (`/service/reports/overview`)

```
Task: A1
Status: INFO
Severity: —
Finding: Fully built page (553 lines). Rich component set with 5 in-page tabs
         (Portfolio, Reports, Settlements, Invoices, Treasury). Uses context-bar
         filters, EntityLink for drill-down, PnLValue/PnLChange for formatting.
         All data from inline mock arrays (allReports, allSettlements,
         allPortfolioSummary, allInvoices, accountBalances, recentTransfers).
Recommendation: Largest report page — candidate for component extraction
                (Treasury table, Settlements list) to reduce file size.
```

**Component inventory:**

| Component    | Import Path                           | Props Used                         | Data Source     |
| ------------ | ------------------------------------- | ---------------------------------- | --------------- |
| Card/\*      | `@/components/ui/card`                | —                                  | —               |
| Button       | `@/components/ui/button`              | variant, size, className           | —               |
| Tabs/\*      | `@/components/ui/tabs`                | defaultValue="portfolio"           | —               |
| Badge        | `@/components/ui/badge`               | variant, className                 | —               |
| EntityLink   | `@/components/trading/entity-link`    | type, id, label, className         | —               |
| PnLValue     | `@/components/trading/pnl-value`      | value, size, showSign              | —               |
| PnLChange    | `@/components/trading/pnl-value`      | value, size                        | —               |
| useContextState | `@/components/trading/context-bar` | —                                  | Context filters |
| Progress     | `@/components/ui/progress`            | value, className                   | —               |
| Table/\*     | `@/components/ui/table`               | —                                  | —               |
| 16 icons     | `lucide-react`                        | className, style                   | —               |

**Data sources:** `@/lib/trading-data` (CLIENTS, ORGANIZATIONS, STRATEGIES, getFilteredStrategies) for filter context. All report data from inline const arrays.

**In-page tabs:** Portfolio | Reports | Settlements | Invoices | Treasury

---

### A2. Executive Page (`/service/reports/executive`)

```
Task: A2
Status: INFO
Severity: —
Finding: Thin wrapper (9 lines) delegating to ExecutiveDashboard component
         (511 lines in components/dashboards/executive-dashboard.tsx). Uses
         recharts (AreaChart, BarChart, PieChart). Has NL query demo with
         simulated 1.5s delay. Strategy multi-select drives dynamic KPI
         recalculation. routeMappings gives secondaryStage "observe".
Recommendation: None — clean delegation pattern.
```

**Component inventory (ExecutiveDashboard):**

| Component        | Import Path                           | Notes                                   |
| ---------------- | ------------------------------------- | --------------------------------------- |
| Card/\*          | `@/components/ui/card`                | KPI cards, chart containers             |
| Badge            | `@/components/ui/badge`               | Strategy count, client status           |
| Button           | `@/components/ui/button`              | Export Report, Generate Report          |
| Tabs/\*          | `@/components/ui/tabs`                | Overview/Clients/Allocation/Documents   |
| Select/\*        | `@/components/ui/select`              | Report period (MTD/QTD/YTD/1Y)         |
| Checkbox         | `@/components/ui/checkbox`            | Strategy multi-select                   |
| DropdownMenu/\*  | `@/components/ui/dropdown-menu`       | Strategy filter dropdown                |
| Input            | `@/components/ui/input`               | NL query input                          |
| AreaChart/\*     | `recharts`                            | NAV vs Benchmark                        |
| PieChart/\*      | `recharts`                            | Strategy Allocation                     |
| BarChart/\*      | `recharts`                            | Monthly P&L vs Target, NL response      |

**Data sources:** All inline mock consts (navHistory, availableStrategies, monthlyPnL, clientSummary, nlDemoQuestions, nlDemoResponse).

---

### A3. Settlement Page (`/service/reports/settlement`)

```
Task: A3
Status: INFO
Severity: —
Finding: Placeholder page (25 lines). Shows "Coming Soon" badge with
         description of planned functionality. Server component (no "use client").
         Uses Card, Badge, Receipt icon only.
Recommendation: No action needed until feature is implemented.
```

**Planned features (from placeholder text):** Settlement dashboard by venue, pending vs completed settlements, settlement breaks, fee reconciliation, funding rate history.

---

### A4. Reconciliation Page (`/service/reports/reconciliation`)

```
Task: A4
Status: INFO
Severity: —
Finding: Placeholder page (24 lines). Shows "Coming Soon" badge. Server
         component. Uses Card, Badge, Scale icon only.
Recommendation: No action needed until feature is implemented.
```

**Planned features:** Reconciliation dashboard with break counts by venue, auto-resolution status, manual review queue, historical break trends.

---

### A5. Regulatory Page (`/service/reports/regulatory`)

```
Task: A5
Status: INFO
Severity: —
Finding: Placeholder page (24 lines). Shows "Coming Soon" badge. Server
         component. Uses Card, Badge, Shield icon only.
Recommendation: No action needed until feature is implemented.
```

**Planned features:** Report generation dashboard, compliance calendar, EMIR/MiFID II submission status, best execution metrics, SAR tracking.

---

## B. Navigation & Routing

### B1. Tab Active State

```
Task: B1
Status: PASS
Severity: —
Finding: ServiceTabs uses pathname === tab.href || pathname.startsWith(matchPath + "/")
         for active state. All 5 REPORTS_TABS use simple href with no matchPrefix.
         Active state correctly highlights the current tab on each page:
         - /service/reports/overview → P&L active ✓
         - /service/reports/executive → Executive active ✓
         - /service/reports/settlement → Settlement active ✓
         - /service/reports/reconciliation → Reconciliation active ✓
         - /service/reports/regulatory → Regulatory active ✓
Recommendation: None.
```

### B2. Lifecycle Nav Highlight

```
Task: B2
Status: ISSUE
Severity: P2-improve
Finding: Lifecycle nav uses getRouteMapping(pathname)?.primaryStage to determine
         active stage. routeMappings only has entries for:
         - /service/reports/overview → primaryStage: "report" ✓
         - /service/reports/executive → primaryStage: "report" ✓

         3 routes MISSING from routeMappings:
         - /service/reports/settlement → getRouteMapping returns undefined → no stage highlighted
         - /service/reports/reconciliation → same
         - /service/reports/regulatory → same

         getRouteMapping does exact match then prefix match (path.startsWith(m.path + "/")),
         but /service/reports/settlement does NOT start with "/service/reports/overview/" or
         "/service/reports/executive/", so no fallback match.

         Result: When user navigates to Settlement, Reconciliation, or Regulatory,
         the Report lifecycle tab is NOT highlighted in the left nav.
Recommendation: Add routeMappings entries for all 3 missing routes:
  { path: "/service/reports/settlement", primaryStage: "report" }
  { path: "/service/reports/reconciliation", primaryStage: "report" }
  { path: "/service/reports/regulatory", primaryStage: "report" }
```

### B3. Internal Navigation

```
Task: B3
Status: PASS
Severity: —
Finding: All 5 tabs are rendered as <Link> components in ServiceTabs.
         Users can navigate between all 5 report pages via the tab bar.
         No dead links — all href values match existing page files.
         Tab overflow handled via overflow-x-auto on the nav container.
Recommendation: None.
```

### B4. Cross-Lifecycle Links

```
Task: B4
Status: ISSUE
Severity: P2-improve
Finding: P&L page (overview) has EntityLink components:
         - type="client" → links to client detail pages (outside /service/reports/*)
         - type="settlement" → links to settlement detail pages
         These are cross-lifecycle links to potential Manage or future pages.

         Executive page has no cross-lifecycle links.
         Settlement/Reconciliation/Regulatory are placeholders with no links.

         The P&L page also has a "Generate Report" button but it has no onClick handler.
         The Reports sub-tab has a "New Report" button — also no handler.
         Download/Send buttons on individual reports — no handlers.
Recommendation: Track unwired buttons (Generate Report, New Report, Download, Send)
  as part of future implementation. EntityLink cross-lifecycle navigation is
  correctly implemented.
```

---

## C. Data Wiring

### C1. React Query Hooks

```
Task: C1
Status: INFO
Severity: —
Finding: NO React Query hooks are used on any report page.
         - P&L page: uses inline mock arrays + useContextState (context-bar hook)
         - Executive page: uses inline mock consts inside executive-dashboard.tsx
         - Settlement/Reconciliation/Regulatory: static placeholders, no data

         Hook → Page → Endpoint mapping: NONE EXISTS

         useContextState is the only stateful hook used (P&L page only),
         and it provides filter state, not API data.
Recommendation: When API integration begins, create hooks/api/useReportsAPI.ts
  with React Query hooks for reports, settlements, portfolio summary, invoices.
```

### C2. Flat Mock Usage

```
Task: C2
Status: INFO
Severity: —
Finding: All report page data comes from flat inline mocks:

  P&L page (overview/page.tsx):
    - allReports (7 items) — inline const
    - allSettlements (5 items) — inline const
    - allPortfolioSummary (7 items) — inline const
    - allInvoices (5 items) — inline const
    - accountBalances (7 items) — inline const
    - recentTransfers (5 items) — inline const
    - CLIENTS, ORGANIZATIONS, STRATEGIES from @/lib/trading-data (filter context)

  Executive page (executive-dashboard.tsx):
    - navHistory (6 items) — inline const
    - availableStrategies (5 items) — inline const
    - monthlyPnL (6 items) — inline const
    - clientSummary (4 items) — inline const
    - nlDemoQuestions (3 items) — inline const
    - nlDemoResponse (1 item) — inline const

  Settlement/Reconciliation/Regulatory: no mock data (placeholders)

  Total inline mock lines: ~165 (overview) + ~65 (executive) = ~230 lines
Recommendation: Phase 2 target: migrate to MSW handlers in lib/mocks/handlers/reports.ts
  with fixtures in lib/mocks/fixtures/reports.json. Mock data should be
  schema-compliant with lib/registry/openapi.json.
```

### C3. Report Generation / Export

```
Task: C3
Status: INFO
Severity: —
Finding: Export/download buttons exist but NONE are wired:

  P&L page:
    - "Generate Report" button (header) — no onClick
    - "New Report" button (Reports sub-tab) — no onClick
    - Download buttons per report item — no onClick
    - Send buttons per report item — no onClick
    - "New Invoice" button — no onClick
    - "Confirm" button on pending settlements — no onClick
    - Download buttons per invoice — no onClick

  Executive page:
    - "Export Report" button (header) — no onClick
    - "Generate Report" buttons per client — no onClick
    - "New Document" button — no onClick
    - Download buttons per document — no onClick

  Total unwired action buttons: 11+ (7 on P&L, 4+ on Executive)
Recommendation: Track as future implementation items. No PDF/CSV generation
  currently exists. Consider a centralized report generation service hook
  when API integration begins.
```

---

## D. UX Audit

### D1. Loading / Error / Empty States

```
Task: D1
Status: ISSUE
Severity: P1-fix
Finding:
  P&L page:
    - Loading state: NO — renders immediately from inline mocks
    - Error state: NO — no error handling
    - Empty state: PARTIAL — filters can produce empty arrays but no
      "No results" message is shown (empty space rendered)

  Executive page:
    - Loading state: YES (NL query spinner + "Analyzing..." text)
    - Error state: NO
    - Empty state: YES (Strategy Allocation: "Select strategies to view allocation")
    - Allocation tab: shows placeholder text "Detailed allocation breakdown..."

  Settlement/Reconciliation/Regulatory:
    - All show "Coming Soon" badge — appropriate for placeholders
    - No loading/error/empty needed on placeholders

  ISSUE: When P&L page transitions to API data (React Query), it will need
  loading skeletons, error boundaries, and empty state messages. Currently
  no infrastructure for this exists on the page.
Recommendation: Add skeleton loading states and error boundaries to P&L page
  before API integration. Add empty state messages for filtered-to-zero scenarios
  (e.g., "No reports match the current filters").
```

### D2. Report Workflow

```
Task: D2
Status: INFO
Severity: —
Finding: The 5 report pages are ISOLATED — no workflow flow between them.

  - P&L page is a self-contained dashboard with 5 sub-tabs
  - Executive page is a self-contained dashboard with 4 sub-tabs
  - Settlement/Reconciliation/Regulatory are placeholders

  No drill-down paths exist:
  - P&L → Executive (no link)
  - Executive → Settlement (no link)
  - Settlement → Reconciliation (no link)
  - P&L settlements sub-tab → Settlement page (no link)

  The P&L page has an internal "Settlements" sub-tab that duplicates content
  that should arguably live on the Settlement page. Same for the "Invoices"
  sub-tab vs a potential dedicated invoices page.

  The P&L page's "Treasury" sub-tab (capital allocation, transfers) may
  belong under a separate lifecycle stage (Manage or a Treasury tab).
Recommendation: Consider workflow connections between report pages:
  - P&L overview "View Details" → Executive for that client
  - Settlement summary on P&L → Settlement page for full view
  - Treasury sub-tab may be better placed under Manage lifecycle
  Track as Phase 3 architecture decision.
```

### D3. Responsive Behavior

```
Task: D3
Status: ISSUE
Severity: P2-improve
Finding:
  P&L page:
    - Summary cards: grid-cols-4 — NO responsive breakpoints (will overflow on mobile)
    - Tab bar: horizontal scroll (overflow-x-auto) — OK for mobile
    - Portfolio list: flex layout — wraps acceptably
    - Treasury table: fixed-width Table component — horizontal overflow on mobile
    - Transfer list: flex with gap — wraps on small screens

  Executive page:
    - KPI cards: grid-cols-4 — NO responsive breakpoints
    - Charts: ResponsiveContainer — auto-resizes ✓
    - Strategy dropdown: fixed w-48 — may clip on mobile
    - NL query section: flex gap-2 — input shrinks, button stays fixed ✓
    - Client list: flex layout — wraps

  Settlement/Reconciliation/Regulatory:
    - Single card with text — responsive by default ✓

  ISSUE: Both P&L and Executive pages use grid-cols-4 for summary cards
  without responsive variants (e.g., grid-cols-2 md:grid-cols-4).
  Tables on P&L Treasury tab will overflow horizontally on mobile.
Recommendation: Add responsive breakpoints:
  - grid-cols-4 → grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
  - Wrap Treasury table in overflow-x-auto container
  - Test at 375px, 768px, 1024px, 1440px breakpoints
```

### D4. Live/As-Of Toggle

```
Task: D4
Status: PASS
Severity: —
Finding: LIVE_ASOF_VISIBLE in service-tabs.tsx:
         report: false

         Reports layout does NOT pass a rightSlot to ServiceTabs.
         Confirmed: no Live/As-Of toggle is rendered on any report page.
         This is correct — reports are historical snapshots, not live data.
Recommendation: None.
```

---

## E. Entitlement & Access

### E1. No Tab-Level Entitlements

```
Task: E1
Status: ISSUE
Severity: P1-fix
Finding: REPORTS_TABS definition (service-tabs.tsx:144-150) has NO
         requiredEntitlement on any of the 5 tabs:

           { label: "P&L", href: "/service/reports/overview" }
           { label: "Executive", href: "/service/reports/executive" }
           { label: "Settlement", href: "/service/reports/settlement" }
           { label: "Reconciliation", href: "/service/reports/reconciliation" }
           { label: "Regulatory", href: "/service/reports/regulatory" }

         Meanwhile, isItemAccessible in lifecycle-nav.tsx (line 97):
           if (path.startsWith("/service/reports")) return hasEntitlement("reporting")

         This creates a gap:
         L2 (lifecycle nav): Report nav item locked for users without "reporting"
         L3 (tabs): All tabs always accessible
         Layout: No entitlement check or redirect

         Result: A user without "reporting" can access /service/reports/* by
         typing the URL directly. The nav hides it, but the page loads.

         Phase 1 confirmed this exact gap (Gap1).
Recommendation: Two options (pick one):
  A. Add layout-level gate: In reports/layout.tsx, check for "reporting"
     entitlement and redirect to /overview if missing. This is the
     recommended approach as it protects ALL report routes at once.
  B. Add requiredEntitlement to all REPORTS_TABS:
     { label: "P&L", href: "...", requiredEntitlement: "reporting" }
     This adds FOMO lock icons but doesn't prevent URL bypass.
  Option A + B together is the most robust solution.
```

### E2. Persona Access Test

```
Task: E2
Status: ISSUE
Severity: P1-fix
Finding: client-data-only persona (lib/mocks/fixtures/personas.ts:56-65):
         - entitlements: ["data-basic"]
         - Does NOT have "reporting"

         Access test (manual code trace):
         1. client-data-only logs in → RequireAuth passes (authenticated) ✓
         2. Platform layout renders → no entitlement check ✓
         3. Lifecycle nav renders → isItemAccessible("/service/reports") returns false
            → Report nav item is locked (Lock icon shown) ✓
         4. User types /service/reports/overview in URL bar
         5. Reports layout renders → no entitlement check → page loads ✗
         6. P&L page renders with all mock data visible ✗

         CONFIRMED: client-data-only CAN access all 5 report pages via direct URL.
         No server-side middleware enforces entitlements either.

         Other personas:
         - client-full: has "reporting" → full access ✓ (expected)
         - client-premium: check entitlements (may or may not have "reporting")
         - internal-trader: has "*" wildcard → full access ✓ (expected)
Recommendation: Same fix as E1 — add layout-level entitlement gate.
  Additionally, when real API exists, server-side should enforce
  entitlements on /api/reports/* endpoints.
```

---

## F. Cross-Reference Markers

### F1. Executive Page Dual Stage

```
Task: F1
Status: INFO
Severity: —
Finding: routeMappings gives /service/reports/executive:
         - primaryStage: "report"
         - secondaryStage: "observe"
         - lanes: ["capital", "strategy"]

         ExecutiveDashboard (components/dashboards/executive-dashboard.tsx) is
         imported ONLY by the executive page (1 consumer). No Observe pages
         import ExecutiveDashboard.

         The component does NOT share any sub-components with Observe pages.
         It uses standard UI primitives (Card, Badge, Tabs, recharts) that
         are used across the entire app, but no domain-specific Observe
         components.

         The "observe" secondaryStage reflects that executives also observe
         performance, but the implementation is separate from the Observe
         lifecycle tab's pages.
Recommendation: The dual-stage mapping is informational only. No component
  sharing exists currently. If future Observe pages need executive-style
  charts, consider extracting recharts chart components (NAV chart, P&L
  bar chart) into shared components/charts/ directory.
```

### F2. Shared Components

```
Task: F2
Status: INFO
Severity: —
Finding: Components used on Report pages that also appear on other lifecycle pages:

  SHARED (used on Report pages AND other lifecycle pages):
  | Component      | Report Page  | Also Used On                                      |
  |----------------|-------------|---------------------------------------------------|
  | EntityLink     | P&L         | strategies, trading/markets, data/markets,         |
  |                |             | research/ml/*, ops, config (11 total consumers)    |
  | PnLValue       | P&L         | strategies/*, trading/risk, trading/markets,       |
  |                |             | data/markets/* (7 total consumers)                 |
  | PnLChange      | P&L         | Same as PnLValue (7 total consumers)               |
  | useContextState| P&L         | Only used on P&L page (1 consumer in app/)         |
  | Card/*         | All 5 pages | Used across entire app                             |
  | Badge          | All 5 pages | Used across entire app                             |
  | Button         | P&L, Exec   | Used across entire app                             |
  | Tabs/*         | P&L, Exec   | Used across entire app                             |
  | Table/*        | P&L         | Used across entire app                             |

  UNIQUE TO REPORTS:
  | Component           | Report Page | Notes                              |
  |---------------------|------------|-------------------------------------|
  | ExecutiveDashboard  | Executive  | Only consumer is executive/page.tsx |
  | Progress            | P&L        | Used in Treasury utilization bars   |
  | recharts (all)      | Executive  | Also used on ML, strategy pages     |

  EntityLink and PnLValue/PnLChange are the key shared domain components.
  They are well-established shared patterns used across 7-11 pages each.
Recommendation: EntityLink and PnLValue patterns are correctly centralized
  in components/trading/. No duplication issues found. When implementing
  Settlement/Reconciliation/Regulatory pages, reuse these shared components.
```

---

## Issue Summary

### Technical Issues

| ID | Severity    | Category    | Issue                                                | Fix Complexity |
| -- | ----------- | ----------- | ---------------------------------------------------- | -------------- |
| E1 | P1-fix      | Entitlement | URL bypass: tabs have no requiredEntitlement, layout has no gate | Medium |
| E2 | P1-fix      | Entitlement | client-data-only can access all report pages via URL | Same fix as E1 |
| D1 | P1-fix      | UX          | P&L page has no loading/error/empty states           | Medium         |
| B2 | P2-improve  | Navigation  | 3 routes missing from routeMappings (no lifecycle highlight) | Low     |
| B4 | P2-improve  | Navigation  | 11+ action buttons unwired (Download, Export, Generate) | Low per button |
| D3 | P2-improve  | UX          | grid-cols-4 not responsive; Treasury table overflows mobile | Low     |

### Business Alignment Issues (see REPORT_TAB_BUSINESS_ALIGNMENT.md)

| ID  | Severity   | Category   | Issue                                                 | Fix Complexity |
| --- | ---------- | ---------- | ----------------------------------------------------- | -------------- |
| BA1 | P2-improve | Placement  | Treasury in-page tab on P&L is a trading/risk concern, not reporting | Medium |
| BA2 | P2-improve | Duplication| P&L settlements tab will duplicate Settlement page when built | Low |
| BA3 | P2-improve | Data       | Executive + P&L mock data use different client names — inconsistent demo | Low |
| BA4 | P2-improve | UX         | No report preview before sending to investors         | Medium         |
| BA5 | P2-improve | Compliance | No audit trail on settlement confirmations            | Low            |
| BA6 | P3-cosmetic| UX         | No scheduled reports or payment reminders             | Medium         |
| BA7 | P3-cosmetic| Data       | Executive docs have 2024 dates; allocation tab mislabeled | Low        |

---

## Business Alignment Assessment

See **`REPORT_TAB_BUSINESS_ALIGNMENT.md`** for the full analysis of whether components, data, and navigation serve the Report tab's back-office purpose (invoice generation, settlement tracking, investor report distribution, regulatory submissions).

**Key business-alignment findings:**

| ID | Severity | Finding |
|----|----------|---------|
| BA1 | P2 | Treasury in-page tab on P&L is misplaced — capital allocation/transfers are trading concerns, not back-office reporting |
| BA2 | P2 | P&L "Settlements" in-page tab will duplicate the dedicated Settlement page — make it a summary with link |
| BA3 | P2 | Executive and P&L mock data use different client names/figures — demo walk-through shows inconsistent data |
| BA4 | P2 | No report preview before sending to investors |
| BA5 | P2 | No audit trail on settlement confirmations (compliance requirement) |
| BA6 | P3 | No scheduled/recurring reports concept, no payment reminders on overdue invoices |
| BA7 | P3 | Executive documents tab has stale 2024 dates, allocation tab mislabeled as "rebalancing tools" |

**Things confirmed as correct:** Client filter scoping, EntityLink drill-downs, report status lifecycle (generating→ready→sent), settlement confirm action, invoice tracking, NL query for investor questions, strategy multi-select, period selector, per-client report generation, documents library.

---

## Feeds Into Phase 3

- **F1** (Executive dual stage) → Phase 3 cross-reference audit
- **F2** (Shared components) → Phase 3 cross-reference audit
- **B4** (Cross-lifecycle links) → Phase 3 cross-reference audit
- **D2** (Report workflow) → Phase 3 architecture decision (P&L sub-tabs vs dedicated pages)
- **BA1** (Treasury misplacement) → Phase 3 cross-reference with Run/Observe tabs
- **BA2** (Settlement duplication) → Phase 3 when Settlement page is built
