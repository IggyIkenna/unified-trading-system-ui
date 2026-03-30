# 4.4 Strategies — Widget Audit & Merge Plan

> **Status:** DRAFT — awaiting user review
> **WORK_TRACKER ref:** §4.4
> **Page route:** `/services/trading/strategies`

---

## Current Widget Inventory

| widgetId | Label | Component | Lines | Singleton | Default Preset |
|----------|-------|-----------|-------|-----------|----------------|
| `strategies-kpi-strip` | Strategy Summary | `StrategiesKpiWidget` | 44 | yes | 12x2 at (0,0) |
| `strategies-catalogue` | Strategy List | `StrategiesCatalogueWidget` | 375 | yes | 12x9 at (0,2) |
| `strategies-grid-link` | Batch Grid Link | `StrategiesGridLinkWidget` | 19 | yes | 12x1 at (0,11) |

**Data provider:** `StrategiesDataProvider` (241 lines) wraps the page. Also has `StrategiesPageHeader` (36 lines) rendered outside the WidgetGrid.

**Presets:** 1 preset ("Default") — KPI strip top, catalogue below, grid link CTA at bottom.

---

## What Each Widget Does

### strategies-kpi-strip (44 lines)
- 4 KPIs via `<KpiStrip>`: Active Strategies (X/Y), Total AUM, Total P&L, MTD P&L.
- Reads from `useStrategiesData()`.

### strategies-catalogue (375 lines)
- Card grid grouped by asset class (`CollapsibleSection` per group).
- Each strategy card shows: name, archetype badge, status badge, AUM, P&L, MTD P&L, sparkline, execution mode code.
- Integrated filters: search, asset class checkboxes, archetype checkboxes, status checkboxes.
- Responsive: uses `ResizeObserver` for narrow mode.
- Links to strategy detail pages + positions/orders views.

### strategies-grid-link (19 lines)
- Single button linking to `/services/trading/strategies/grid` for DimensionalGrid batch analysis.
- Trivial — just a `<Link>` + `<Button>`.

---

## Data Flow

```
StrategiesDataProvider (page.tsx)
├── useStrategyHealth()  → API hook → strategies array
├── useGlobalScope()     → scope filtering
├── filters (search, assetClasses, archetypes, statuses)
├── filteredStrategies   → derived
├── groupedStrategies    → derived (grouped by asset class)
├── summary: activeCount, totalAUM, totalPnL, totalMTDPnL
└── provides all via React Context
    ├── StrategiesKpiWidget        reads: activeCount, totalAUM, totalPnL, totalMTDPnL
    ├── StrategiesCatalogueWidget  reads: filteredStrategies, groupedStrategies, filters
    └── StrategiesGridLinkWidget   reads: nothing (static link)
```

Note: `StrategiesPageHeader` (outside WidgetGrid) also reads from `useStrategiesData()` — it shows a "Live/Batch" mode badge.

---

## Testing Checklist

- [ ] **KPI strip:** All 4 metrics show real values (Active X/Y, AUM, P&L, MTD P&L)
- [ ] **Strategy cards:** Cards render with name, badges, metrics, sparklines
- [ ] **Grouping:** Asset class groups show with collapsible sections
- [ ] **Filters:** Search, asset class, archetype, status checkboxes all work
- [ ] **Links:** Strategy name links to detail page; positions/orders links work
- [ ] **Grid link button:** Clicking navigates to `/services/trading/strategies/grid`
- [ ] **Page header:** "Live/Batch" mode badge shows correctly

---

## Merge Proposal

**WORK_TRACKER target:** "Single Strategies panel; keep grid link as CTA or inline."

### Option A — Merge KPI + grid-link into catalogue (recommended)
- Embed KPI strip as sticky header row in the catalogue widget.
- Add the grid link button to the catalogue's filter toolbar row (right side) instead of a separate widget.
- Delete `strategies-kpi-strip` and `strategies-grid-link` registrations; preset becomes 1 widget.
- **Result:** 1 widget (`strategies-catalogue` is self-contained).

### Option B — Merge KPI into catalogue, keep grid-link separate
- Only merge the KPI strip; keep the grid link CTA as its own tiny widget for those who want to move/remove it.
- **Result:** 2 widgets.

### Option C — No merge
- Current layout works; the 3 widgets are well-scoped.

---

## Questions for User

1. **Merge scope:** Option A (all into one), B (KPI only), or C (no merge)?
2. **Grid link widget:** Is this CTA useful enough to keep, or can it just be a button in the catalogue's toolbar?
3. **StrategiesPageHeader:** This renders outside WidgetGrid. Should it stay, or should its "Live/Batch" badge be moved into the KPI strip?
4. **Any broken data?** Do strategy cards render with sparklines and metrics when you visit the page?
