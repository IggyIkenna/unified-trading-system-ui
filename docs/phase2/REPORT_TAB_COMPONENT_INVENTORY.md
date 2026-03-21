# Report Tab — Component Inventory (Phase 2g)

**Date:** 2026-03-21
**Scope:** All components used across the 5 Report lifecycle pages

---

## Page Summary

| # | Route                              | File                                        | Lines | State       | Components |
| - | ---------------------------------- | ------------------------------------------- | ----- | ----------- | ---------- |
| 1 | `/service/reports/overview`        | `app/(platform)/service/reports/overview/page.tsx` | 553   | Built       | 16         |
| 2 | `/service/reports/executive`       | `app/(platform)/service/reports/executive/page.tsx` | 9     | Wrapper     | 1          |
| 2b| (delegate)                         | `components/dashboards/executive-dashboard.tsx`     | 511   | Built       | 14         |
| 3 | `/service/reports/settlement`      | `app/(platform)/service/reports/settlement/page.tsx` | 25   | Placeholder | 3          |
| 4 | `/service/reports/reconciliation`  | `app/(platform)/service/reports/reconciliation/page.tsx` | 24 | Placeholder | 3          |
| 5 | `/service/reports/regulatory`      | `app/(platform)/service/reports/regulatory/page.tsx` | 24   | Placeholder | 3          |
| L | (layout)                           | `app/(platform)/service/reports/layout.tsx`         | 16    | Built       | 2          |

---

## 1. P&L Page (`/service/reports/overview`)

### Imports

| Import                | Source                                | Category       |
| --------------------- | ------------------------------------- | -------------- |
| Card, CardContent, CardHeader, CardTitle | `@/components/ui/card`    | UI primitive   |
| Button                | `@/components/ui/button`              | UI primitive   |
| Tabs, TabsContent, TabsList, TabsTrigger | `@/components/ui/tabs`  | UI primitive   |
| Badge                 | `@/components/ui/badge`               | UI primitive   |
| EntityLink            | `@/components/trading/entity-link`    | Domain shared  |
| PnLValue, PnLChange  | `@/components/trading/pnl-value`      | Domain shared  |
| useContextState       | `@/components/trading/context-bar`    | State hook     |
| Progress              | `@/components/ui/progress`            | UI primitive   |
| Table, TableBody, TableCell, TableHead, TableHeader, TableRow | `@/components/ui/table` | UI primitive |
| CLIENTS, ORGANIZATIONS, STRATEGIES, getFilteredStrategies | `@/lib/trading-data` | Filter data |
| 16 icons              | `lucide-react`                        | Icons          |

### In-Page Tabs

| Tab       | Content                                              |
| --------- | ---------------------------------------------------- |
| Portfolio | Client portfolio summary with AUM, MTD/YTD returns, Sharpe ratio |
| Reports   | Generated reports list with status, download, send   |
| Settlements | Settlement records with status badges, confirm button |
| Invoices  | Invoice list with status, download                   |
| Treasury  | Capital allocation table by venue + recent transfers  |

### Data Arrays (Inline Mocks)

| Variable             | Items | Fields                                         |
| -------------------- | ----- | ---------------------------------------------- |
| allReports           | 7     | id, name, client, clientId, date, status, format, generated |
| allSettlements       | 5     | id, client, clientId, date, amount, status, type, dueDate |
| allPortfolioSummary  | 7     | client, clientId, orgId, aum, mtdReturn, ytdReturn, sharpe |
| allInvoices          | 5     | id, client, clientId, amount, status, date     |
| accountBalances      | 7     | venue, free, locked, total                     |
| recentTransfers      | 5     | time, from, to, amount, status, confirmations?, txHash? |

---

## 2. Executive Page (`/service/reports/executive`)

### Page Wrapper (9 lines)

| Import               | Source                                         |
| -------------------- | ---------------------------------------------- |
| ExecutiveDashboard   | `@/components/dashboards/executive-dashboard`  |

### ExecutiveDashboard (511 lines)

| Import                | Source                                | Category       |
| --------------------- | ------------------------------------- | -------------- |
| Card, CardContent, CardHeader, CardTitle | `@/components/ui/card`    | UI primitive   |
| Badge                 | `@/components/ui/badge`               | UI primitive   |
| Button                | `@/components/ui/button`              | UI primitive   |
| Tabs, TabsContent, TabsList, TabsTrigger | `@/components/ui/tabs`  | UI primitive   |
| Select, SelectContent, SelectItem, SelectTrigger, SelectValue | `@/components/ui/select` | UI primitive |
| Checkbox              | `@/components/ui/checkbox`            | UI primitive   |
| DropdownMenu/\*       | `@/components/ui/dropdown-menu`       | UI primitive   |
| Input                 | `@/components/ui/input`               | UI primitive   |
| AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer | `recharts` | Chart library |
| PieChart, Pie, Cell   | `recharts`                            | Chart library  |
| BarChart, Bar, Legend  | `recharts`                            | Chart library  |
| 13 icons              | `lucide-react`                        | Icons          |

### Data Arrays (Inline Mocks)

| Variable             | Items | Fields                                         |
| -------------------- | ----- | ---------------------------------------------- |
| navHistory           | 6     | date, nav, benchmark                           |
| availableStrategies  | 5     | id, name, aum, pnl, pnlPct, sharpe, allocation, color |
| monthlyPnL           | 6     | month, pnl, target                             |
| clientSummary        | 4     | name, aum, pnl, pnlPct, status                |
| nlDemoQuestions       | 3     | string                                         |
| nlDemoResponse       | 1     | question, answer, chartData                    |

---

## 3. Settlement Page (`/service/reports/settlement`) — Placeholder

| Import               | Source                  | Category     |
| -------------------- | ----------------------- | ------------ |
| Card, CardContent, CardHeader, CardTitle | `@/components/ui/card` | UI primitive |
| Badge                | `@/components/ui/badge` | UI primitive |
| Receipt              | `lucide-react`          | Icon         |

---

## 4. Reconciliation Page (`/service/reports/reconciliation`) — Placeholder

| Import               | Source                  | Category     |
| -------------------- | ----------------------- | ------------ |
| Card, CardContent, CardHeader, CardTitle | `@/components/ui/card` | UI primitive |
| Badge                | `@/components/ui/badge` | UI primitive |
| Scale                | `lucide-react`          | Icon         |

---

## 5. Regulatory Page (`/service/reports/regulatory`) — Placeholder

| Import               | Source                  | Category     |
| -------------------- | ----------------------- | ------------ |
| Card, CardContent, CardHeader, CardTitle | `@/components/ui/card` | UI primitive |
| Badge                | `@/components/ui/badge` | UI primitive |
| Shield               | `lucide-react`          | Icon         |

---

## Layout (`app/(platform)/service/reports/layout.tsx`)

| Import               | Source                                  | Category    |
| -------------------- | --------------------------------------- | ----------- |
| ServiceTabs          | `@/components/shell/service-tabs`       | Shell       |
| REPORTS_TABS         | `@/components/shell/service-tabs`       | Config      |
| useAuth              | `@/hooks/use-auth`                      | Auth hook   |

**Renders:** `<ServiceTabs tabs={REPORTS_TABS} entitlements={user?.entitlements} />`
**No rightSlot** (report: false in LIVE_ASOF_VISIBLE — no Live/As-Of toggle)

---

## Cross-Page Component Usage Matrix

| Component / Hook     | P&L | Executive | Settlement | Reconciliation | Regulatory | Other Pages |
| -------------------- | --- | --------- | ---------- | -------------- | ---------- | ----------- |
| Card/\*              | ✓   | ✓         | ✓          | ✓              | ✓          | All         |
| Badge                | ✓   | ✓         | ✓          | ✓              | ✓          | All         |
| Button               | ✓   | ✓         | —          | —              | —          | All         |
| Tabs/\*              | ✓   | ✓         | —          | —              | —          | Many        |
| Table/\*             | ✓   | —         | —          | —              | —          | Many        |
| EntityLink           | ✓   | —         | —          | —              | —          | 10 others   |
| PnLValue/PnLChange   | ✓   | —         | —          | —              | —          | 6 others    |
| useContextState      | ✓   | —         | —          | —              | —          | 0 others    |
| Progress             | ✓   | —         | —          | —              | —          | Few         |
| ExecutiveDashboard   | —   | ✓         | —          | —              | —          | 0 others    |
| Select/\*            | —   | ✓         | —          | —              | —          | Many        |
| DropdownMenu/\*      | —   | ✓         | —          | —              | —          | Many        |
| recharts             | —   | ✓         | —          | —              | —          | ML, Strategy|
| Input                | —   | ✓         | —          | —              | —          | Many        |
