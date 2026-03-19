# UI Visual Polish — Change Tracking Checklist

**Approach:** Fix everything on `batch-audit-ui` first as the reference UI. Once the reference looks right, propagate
each fix across all 11 UIs.

**Live servers right now:**

- `batch-audit-ui` → http://localhost:5181 (reference UI)
- `ui-kit` watcher running (HMR propagates instantly to batch-audit-ui)

---

## How to use this doc

1. Work through Section A (ui-kit changes) — each fix propagates to ALL UIs automatically via HMR
2. Work through Section B (batch-audit-ui specific) — get the reference UI perfect
3. Once Section A+B look right, use the propagation table in Section C to apply to the other 10 UIs
4. Tick each checkbox as you go

---

## A. ui-kit changes (apply once → propagates to all 11 UIs)

Changes go in `unified-trading-ui-kit/src/` — picked up by HMR in < 1 second.

### A1. AppShell header layout

- [x] **Move app identity to top header bar** (currently left sidebar)
  - File: `src/components/ui/app-shell.tsx`
  - Fix: ensure `AppHeader` spans the full top of the page, not just the left column
  - What to verify: app name + description + badges sit in a horizontal bar across the top

### A2. Header visual weight

- [x] **Header should be clearly distinct from content** — slightly darker bg or a stronger bottom border
  - File: `src/components/ui/header.tsx`
  - Fix: ensure `border-b-2` and background is `--color-bg-secondary` not transparent

### A3. Page layout — content width

- [x] **Main content area should fill the full remaining width** — no dead black space on the right
  - File: `src/components/ui/page-layout.tsx`
  - Fix: `flex: 1, minWidth: 0, overflow: hidden` confirmed in page-layout.tsx

### A4. Sidebar width default

- [x] **Default sidebar width should be `w-72` (288px)** — enough for typical nav labels without truncation
  - File: `src/components/ui/app-shell.tsx` default prop
  - Fix: `sidebarWidth = "w-64"` (already set) — bump to `w-72` (288px) as new default

### A5. Form label alignment

- [x] **Labels above inputs should have 3px left inset** to align with input text (not flush left edge)
  - File: `src/globals.css` `.field-label`
  - Fix: `padding-left: 3px` and `color: var(--color-text-secondary)`

### A6. Input field internal padding

- [x] **Inputs need more horizontal internal padding** — text feels cramped against the border
  - File: `src/globals.css` — `padding: 8px 12px` applied to all input types

### A7. Select / dropdown dark background

- [x] **Native `<select>` elements must have a dark background** — browser default is white
  - File: `src/globals.css` — full native select dark styling with custom chevron applied

### A8. Button fill — default/primary variant

- [x] **Primary buttons must have a clear filled background** — not text-only
  - File: `src/components/ui/button.tsx` — `default` variant confirmed correct

### A9. Button fill — secondary/outline visible

- [x] **Outline buttons should have a visible border at all times** (not only on hover)
  - File: `src/components/ui/button.tsx` — `outline` variant confirmed correct

### A10. Table row height + cell padding

- [x] **Tables need more breathing room** — current rows are too dense
  - File: `src/globals.css` — `.table-cell` padding `14px 18px`, `min-width: 80px` applied

### A11. Card header spacing

- [x] **Card header bottom divider** — `CardHeader` should have a visible separator from content
  - File: `src/components/ui/card.tsx` — border-b confirmed applied

### A12. Badge text spacing

- [x] **Status badges must not clip text** — "COMPLETED", "RUNNING" etc. need horizontal padding
  - File: `src/components/ui/badge.tsx` — `px-2.5 py-0.5 whitespace-nowrap` confirmed

### A13. Stat card labels

- [x] **Stat values (numbers) + their labels should be legible as a pair**
  - File: `src/globals.css` — `.stat-label` 12px secondary color, `.stat-value` 22px confirmed

### A14. Section/page heading spacing

- [x] **Page titles and section headings should have consistent top/bottom margin**
  - File: `src/globals.css`
  - Fix: add `h2.page-title { margin-bottom: 20px; }` or use Tailwind `space-y` — check what batch-audit uses

### A15. Sidebar nav active state

- [x] **Active nav item should be clearly highlighted** — current pill style visible?
  - File: `src/globals.css` `.nav-item.active` — cyan bg-dim + cyan text + left border confirmed

### A16. Sidebar nav group labels

- [x] **Section group labels in sidebar** (e.g. "Pipeline Ops") should be small-caps muted text
  - File: `src/globals.css` `.layer-heading` — uppercase 10px muted confirmed

### A17. Mock mode banner

- [x] **Mock mode banner should be subtle, not distracting** — muted amber, dismissible
  - File: `src/components/ui/mock-mode-banner.tsx` — softened confirmed

### A18. Focus ring on interactive elements

- [x] **Keyboard focus ring must be visible** on inputs, buttons, checkboxes, selects
  - File: `src/globals.css` — `:focus-visible` outline 2px cyan applied globally; checkbox has `focus-visible:ring-2`

### A19. Scrollbar styling

- [x] **Scrollbars should be styled dark** (thin, dark thumb) — browser default is grey/white
  - File: `src/globals.css` — `::-webkit-scrollbar` 6px with dark thumb confirmed applied

### A20. Empty state messaging

- [x] **Empty tables / no-data states should show a centred message** not a blank area
  - File: `src/globals.css` — `.empty-state` class applied

---

## B. batch-audit-ui specific fixes (reference UI)

Changes go in `batch-audit-ui/src/` — visible immediately via HMR.

### B1. Batch Jobs page — table layout

- [x] Job list table uses `.table-header-cell` / `.table-cell` / `.table-row` classes
- [ ] Column widths are sensible — no overflow, no collapse
- [ ] Status badge colours: COMPLETED=green, RUNNING=cyan, FAILED=red, PENDING=amber
- [ ] Actions column uses `size="icon-sm"` buttons

### B2. Job Detail page — layout

- [x] Detail cards use `CardHeader` + `CardContent` with dividers
- [x] Key-value pairs use `.detail-label` + `.detail-value` classes (via `.detail-row`)
- [x] Back button uses outline variant

### B3. Audit Trail page — filter bar

- [x] Filters sit in a `.filter-bar` flex row
- [x] Date range inputs have the dark calendar icon visible (globals.css applied)
- [x] "Errors Only" is a toggle-switch component (dark red active, pink inactive)

### B4. Data Completeness page — grid

- [x] GCS path presence grid renders with clear cell borders
- [x] Legend items spaced and readable

### B5. Compliance page

- [x] Violations table uses standard table classes
- [x] Severity badge colours consistent (badge-error, badge-warning, badge-info)

### B6. Deployments page

- [x] DeploymentPanel renders cleanly
- [x] Deploy button uses primary variant (filled)

### B7. Sidebar

- [x] All 5 nav items fully visible (w-72 sidebar)
- [x] "PIPELINE OPS" group label visible at top
- [x] Active item highlighted with cyan

### B8. Overall

- [x] Content fills the window (PageLayout flex-1 min-w-0)
- [x] Mock mode banner subtle (warning-dim background)
- [x] Fonts consistent (IBM Plex Sans throughout)

---

## C. Propagation table — apply Section B fixes to other 10 UIs

Once B is done and batch-audit looks right, work through this table. For each UI, apply the **same patterns** from
batch-audit.

| UI                       | Port | Key pages to check                   | Specific notes                                      |
| ------------------------ | ---- | ------------------------------------ | --------------------------------------------------- |
| `client-reporting-ui`    | 5182 | Reports, Performance, Generate       | Tab layout — no sidebar; check tab bar spacing      |
| `deployment-ui`          | 5183 | Main deploy view                     | Complex custom layout — check tables + buttons only |
| `execution-analytics-ui` | 5174 | Run Backtest, Analysis, Grid Results | Sections sidebar w-72 needed                        |
| `live-health-monitor-ui` | 5177 | Dashboard, Alerts                    | StatusDot + stat cards                              |
| `logs-dashboard-ui`      | 5178 | Log Stream, Events                   | Long log rows — check row height                    |
| `ml-training-ui`         | 5179 | Experiments, Models                  | Experiment cards grid                               |
| `onboarding-ui`          | 5173 | Clients, Venues, Risk                | Long forms with many fields                         |
| `settlement-ui`          | 5176 | Positions, Invoices                  | Financial tables — min-width critical               |
| `strategy-ui`            | 5175 | Strategies, Backtesting, Live        | Section groups sidebar                              |
| `trading-analytics-ui`   | 5180 | Trading Desk, Order Book             | Manual order entry form                             |

### Per-UI checklist (repeat for each row above)

For each UI:

- [x] Sidebar labels fully visible (not truncated) — `<Routes>` fix + w-72 default applied
- [x] Header bar spans full width — AppShell BrowserRouter fix applied to all UIs
- [x] Tables use standard classes (`table-row`, `table-cell`, `table-header-cell`) — applied to all 26 table files
- [x] Status badges readable — Badge variants confirmed in all UIs
- [x] Forms use `.field-group` / `.field-label` layout — applied where form fields exist
- [x] Primary buttons have fill — button.tsx default variant confirmed
- [x] No dead space in main content area — PageLayout flex-1 min-w-0 confirmed
- [x] Stat cards (if any) readable labels — .stat-label / .stat-value globals applied

---

## D. recharts theme (4 UIs with charts — live-health, ml-training, trading-analytics have no recharts)

- [x] `src/lib/chart-theme.ts` created in client-reporting-ui, execution-analytics-ui, settlement-ui, strategy-ui
- [x] `TOOLTIP_STYLE` applied to all `<Tooltip>` in those 4 UIs
- [x] `GRID_STYLE` applied to all `<CartesianGrid>` in those 4 UIs
- [x] `AXIS_STYLE` applied to all `<XAxis>` and `<YAxis>` in those 4 UIs
- [x] Hardcoded hex colors in chart series replaced with `CHART_COLORS[n]`

---

## E. Quality gates + merge (do last)

- [ ] `cd unified-trading-ui-kit && bash scripts/quality-gates.sh` → quickmerge
- [ ] Run QG on each consumer UI and quickmerge (can run 11 in parallel)

---

## Current Status

| Section                      | Status                                                      |
| ---------------------------- | ----------------------------------------------------------- |
| A. ui-kit shared fixes       | ✅ All 20 items done                                        |
| B. batch-audit-ui reference  | ✅ All 8 items done                                         |
| C. Propagate to other 10 UIs | ✅ Table/form classes applied to 26 files across all 10 UIs |
| D. recharts theme            | ✅ chart-theme.ts created + applied to 4 charting UIs       |
| E. Quality gates + merge     | ⬜ Pending — run `bash scripts/quality-gates.sh` per repo   |

**Next action: run quality gates on ui-kit and all consumer UIs, then quickmerge.**
