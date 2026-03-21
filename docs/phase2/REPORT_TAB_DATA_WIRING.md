# Report Tab — Data Wiring Audit (Phase 2g)

**Date:** 2026-03-21
**Scope:** Data sources, hooks, mocks, and export capabilities for Report lifecycle pages

---

## Data Architecture Summary

| Page             | React Query | Inline Mocks | lib/trading-data | MSW Handlers | API Endpoints |
| ---------------- | ----------- | ------------ | ---------------- | ------------ | ------------- |
| P&L (overview)   | None        | 6 arrays     | ✓ (filters)      | None         | None          |
| Executive        | None        | 6 arrays     | None              | None         | None          |
| Settlement       | None        | None         | None              | None         | None          |
| Reconciliation   | None        | None         | None              | None         | None          |
| Regulatory       | None        | None         | None              | None         | None          |

**Current state:** 100% inline mocks. Zero React Query hooks. Zero API integration. Zero MSW coverage.

---

## C1: React Query Hooks

**Finding:** No React Query hooks exist for any report page.

| Expected Hook       | Page        | Endpoint (future)           | Current State |
| ------------------- | ----------- | --------------------------- | ------------- |
| usePortfolioSummary | P&L         | GET /api/reports/portfolio   | Inline mock   |
| useReports          | P&L         | GET /api/reports/generated   | Inline mock   |
| useSettlements      | P&L + Settlement | GET /api/reports/settlements | Inline mock |
| useInvoices         | P&L         | GET /api/reports/invoices    | Inline mock   |
| useAccountBalances  | P&L         | GET /api/treasury/balances   | Inline mock   |
| useRecentTransfers  | P&L         | GET /api/treasury/transfers  | Inline mock   |
| useNAVHistory       | Executive   | GET /api/reports/nav-history | Inline mock   |
| useStrategyPerf     | Executive   | GET /api/strategies/performance | Inline mock |
| useMonthlyPnL       | Executive   | GET /api/reports/monthly-pnl | Inline mock   |
| useClientSummary    | Executive   | GET /api/clients/summary     | Inline mock   |
| useNLQuery          | Executive   | POST /api/query/natural-language | Simulated delay |

---

## C2: Flat Mock Usage

### P&L Page Mocks (overview/page.tsx)

| Variable             | Lines   | Items | Mock Lines | Schema Fields                              |
| -------------------- | ------- | ----- | ---------- | ------------------------------------------ |
| allReports           | 48-119  | 7     | 71         | id, name, client, clientId, date, status, format, generated |
| allSettlements       | 122-173 | 5     | 51         | id, client, clientId, date, amount, status, type, dueDate |
| allPortfolioSummary  | 176-184 | 7     | 8          | client, clientId, orgId, aum, mtdReturn, ytdReturn, sharpe |
| allInvoices          | 187-193 | 5     | 6          | id, client, clientId, amount, status, date |
| accountBalances      | 196-204 | 7     | 8          | venue, free, locked, total                 |
| recentTransfers      | 206-212 | 5     | 6          | time, from, to, amount, status, confirmations?, txHash? |

**Total P&L mock lines:** ~150

### Executive Dashboard Mocks (executive-dashboard.tsx)

| Variable             | Lines   | Items | Mock Lines | Schema Fields                              |
| -------------------- | ------- | ----- | ---------- | ------------------------------------------ |
| navHistory           | 59-66   | 6     | 7          | date, nav, benchmark                       |
| availableStrategies  | 69-75   | 5     | 6          | id, name, aum, pnl, pnlPct, sharpe, allocation, color |
| monthlyPnL           | 77-84   | 6     | 7          | month, pnl, target                         |
| clientSummary        | 86-91   | 4     | 5          | name, aum, pnl, pnlPct, status            |
| nlDemoQuestions       | 94-98   | 3     | 4          | string                                     |
| nlDemoResponse       | 100-123 | 1     | 23         | question, answer, chartData                |

**Total Executive mock lines:** ~52

### External Data Import

| Import                       | Source               | Used By | Purpose          |
| ---------------------------- | -------------------- | ------- | ---------------- |
| CLIENTS                      | `@/lib/trading-data` | P&L     | Filter: client list |
| ORGANIZATIONS                | `@/lib/trading-data` | P&L     | Filter: org list |
| STRATEGIES                   | `@/lib/trading-data` | P&L     | Filter: strategy list |
| getFilteredStrategies        | `@/lib/trading-data` | P&L     | Filter: strategy filter |

---

## C3: Report Generation / Export

### Buttons Inventory

| Page      | Button              | Location           | onClick | Wired |
| --------- | ------------------- | ------------------ | ------- | ----- |
| P&L       | Generate Report     | Header             | None    | ✗     |
| P&L       | New Report          | Reports sub-tab    | None    | ✗     |
| P&L       | Download (per report) | Reports sub-tab  | None    | ✗     |
| P&L       | Send (per report)   | Reports sub-tab    | None    | ✗     |
| P&L       | Confirm (settlement)| Settlements sub-tab | None   | ✗     |
| P&L       | New Invoice         | Invoices sub-tab   | None    | ✗     |
| P&L       | Download (invoice)  | Invoices sub-tab   | None    | ✗     |
| Executive | Export Report       | Header             | None    | ✗     |
| Executive | Generate Report (per client) | Clients tab | None    | ✗     |
| Executive | New Document        | Documents tab      | None    | ✗     |
| Executive | Download (per doc)  | Documents tab      | None    | ✗     |

**Total unwired action buttons:** 11

### Export Format Support

| Format | Supported | Notes                                |
| ------ | --------- | ------------------------------------ |
| PDF    | No        | Download buttons exist but no handler |
| CSV    | No        | No CSV export functionality           |
| Excel  | No        | No Excel export                       |
| Print  | No        | No print stylesheet                   |

---

## MSW Migration Target

When migrating from inline mocks to MSW, the target structure:

```
lib/mocks/
├── handlers/
│   └── reports.ts          ← New: MSW handlers for all report endpoints
├── fixtures/
│   ├── reports.json        ← New: allReports data
│   ├── settlements.json    ← New: allSettlements data
│   ├── portfolio.json      ← New: allPortfolioSummary data
│   ├── invoices.json       ← New: allInvoices data
│   ├── treasury.json       ← New: accountBalances + recentTransfers
│   ├── executive.json      ← New: navHistory, strategies, monthlyPnL, clientSummary
│   └── nl-queries.json     ← New: NL demo questions and responses
```

**Lines to extract:** ~202 lines of inline mock data → JSON fixtures
**Handlers to create:** 11 GET/POST handlers matching the future API surface
