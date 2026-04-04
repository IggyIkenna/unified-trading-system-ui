# 4.3 Alerts — Widget Audit & Merge Plan

> **Status:** DRAFT — awaiting user review
> **WORK_TRACKER ref:** §4.3
> **Page route:** `/services/trading/alerts`

---

## Current Widget Inventory

| widgetId | Label | Component | Lines | Singleton | Default Preset |
|----------|-------|-----------|-------|-----------|----------------|
| `alerts-kpi-strip` | Alert Summary | `AlertsKpiStripWidget` | 38 | yes | 12x2 at (0,0) |
| `alerts-table` | Alert Feed | `AlertsTableWidget` | 477 | yes | 9x9 at (0,2) |
| `alerts-kill-switch` | Kill Switch | `AlertsKillSwitchWidget` | 125 | yes | 3x9 at (9,2) |

**Data provider:** `AlertsDataProvider` (306 lines) wraps the page.

**Presets:** 1 preset ("Default") — KPI full-width top, Alert Feed (9 cols) + Kill Switch (3 cols) side-by-side below.

---

## What Each Widget Does

### alerts-kpi-strip (38 lines)
- 4 KPIs via `<KpiStrip>`: Active Alerts, Critical, Avg Resolution (hardcoded "12m"), Last 24h (hardcoded "23").
- Note: Avg Resolution and Last 24h are **hardcoded placeholder values**, not from API.

### alerts-table (477 lines)
- Full DataTable with filter bar (search, severity, status, entity type).
- Columns: Severity icon, Alert Type, Entity, Status, Details, Actions (acknowledge/resolve/dismiss), Created.
- Has a Sheet detail view (SlideOver) for each alert showing full details.
- Export (CSV/XLSX), refresh, data freshness.

### alerts-kill-switch (125 lines)
- Emergency intervention panel inside a CollapsibleSection (collapsed by default).
- Scope selector (Firm/Client/Strategy/Venue) → Entity selector (strategies list).
- Action buttons: Pause Strategy, Cancel Orders, Flatten, Disable Venue.
- Rationale text field + Impact Preview card + Confirm button.
- Currently the actions are UI-only (no API wiring); impact preview shows alert count only.

---

## Data Flow

```
AlertsDataProvider (page.tsx)
├── useAlerts()          → API hook → alerts array
├── useGlobalScope()     → scope filtering
├── filters (search, severity, status, entityType)
├── filteredAlerts       → derived
├── activeCount, criticalCount → derived
└── provides all via React Context
    ├── AlertsKpiStripWidget   reads: activeCount, criticalCount, isLoading
    ├── AlertsTableWidget      reads: filteredAlerts, filters, actions
    └── AlertsKillSwitchWidget reads: filteredAlerts (+ useStrategyHealth separately)
```

---

## Testing Checklist

- [ ] **KPI strip:** Active Alerts and Critical show real counts (not all zeros)
- [ ] **KPI strip hardcoded values:** Avg Resolution "12m" and Last 24h "23" — are these expected placeholders or bugs?
- [ ] **Alert Feed:** Rows render with severity icons, correct status badges
- [ ] **Filters:** Search, severity, status, entity type all filter the table
- [ ] **Alert detail sheet:** Clicking an alert opens the SlideOver detail panel
- [ ] **Actions:** Acknowledge/Resolve/Dismiss buttons work (or are acceptable as mock no-ops)
- [ ] **Kill Switch:** Scope + entity selectors populate correctly from strategy data
- [ ] **Kill Switch actions:** Buttons are present; Confirm Action button works (or expected as wired later)
- [ ] **Export:** CSV/XLSX download

---

## Merge Proposal

**WORK_TRACKER target:** "Single Alerts console (summary strip + feed + action column)."

### Option A — Merge KPI into table, keep kill-switch separate (recommended)
- Embed the 4 KPIs as a sticky header in `AlertsTableWidget`.
- Kill Switch stays separate — it's a distinct functional panel (emergency controls) that makes sense as its own draggable widget in the sidebar position.
- Delete `alerts-kpi-strip` registration; update preset to 2 widgets.
- **Result:** 2 widgets (alerts-table-with-kpi + kill-switch).

### Option B — Merge all three into one
- Single console widget with: KPI strip (top) → two columns: Feed (left), Kill Switch (right).
- Problem: this forces the Kill Switch to always be visible and positioned, removing user flexibility.
- **Result:** 1 widget.

### Option C — No merge
- The layout already works well with KPI on top, table + kill-switch side-by-side.
- Skip merge, focus on fixing the hardcoded KPI values and data issues.

---

## Questions for User

1. **Merge scope:** Option A (KPI into table, kill-switch separate), B (all-in-one), or C (no merge)?
2. **Hardcoded KPIs:** "Avg Resolution: 12m" and "Last 24h: 23" are placeholder constants. Should they be removed, kept as-is, or wired to actual data?
3. **Kill Switch functionality:** The action buttons (Pause, Cancel, Flatten, Disable) are UI-only. Is that acceptable for now, or should they be wired to mock handlers?
4. **Any broken data?** Do alerts show up in the table when you visit the page?
