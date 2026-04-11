# 4.6 Sports — Widget Audit & Merge Plan

> **Status:** DRAFT — awaiting user review
> **WORK_TRACKER ref:** §4.6
> **Page route:** `/services/trading/sports`

---

## Current Widget Inventory

| widgetId | Label | Component | Lines | Singleton | Default Preset |
|----------|-------|-----------|-------|-----------|----------------|
| `sports-fixtures` | Fixtures | `SportsFixturesWidget` | 200 | yes | 8x10 at (0,0) |
| `sports-fixture-detail` | Fixture Detail | `SportsFixtureDetailWidget` | 32 | yes | 4x10 at (8,0) |
| `sports-arb` | Arb Scanner | `SportsArbWidget` | 15 | yes | Only in "Arb focus" preset |
| `sports-my-bets` | My Bets | `SportsMyBetsWidget` | 127 | yes | 12x4 at (0,10) |
| `sports-live-scores` | Live Scores | `SportsLiveScoresWidget` | 52 | **no** | Only in "Arb focus" preset |

**Total: 5 widgets.**

**Data provider:** `SportsDataProvider` wraps the page. Manages fixtures, bets, arb threshold, selected fixture, and global filters.

**Presets:** 2 presets:
1. **"Default"** — Fixtures (8 cols) + Fixture Detail (4 cols) → My Bets (full-width)
2. **"Arb focus"** — Arb Scanner (6 cols) + Fixtures (6 cols) → Live Scores ticker → My Bets

---

## What Each Widget Does

### sports-fixtures (200 lines)
- Fixture list grouped by status: Suspended, Live, Upcoming Today, Upcoming, Completed.
- Filter bar with date range, status, search, and league badge chips.
- Clicking a fixture sets `selectedFixtureId` → drives `sports-fixture-detail`.

### sports-fixture-detail (32 lines)
- Thin wrapper around `FixtureDetailPanel` (from `components/trading/sports/`).
- Shows stats, timeline, odds movement, trade panel for selected match.
- Empty state when no fixture selected.

### sports-arb (15 lines)
- Thin wrapper around `ArbTab` (from `components/trading/sports/`).
- Shows odds grid and live arb stream. Arb threshold controls.

### sports-my-bets (127 lines)
- KPI strip: Total staked, P&L (settled), Win rate, Open bets, Open exposure.
- Open singles DataTable.
- Settled singles in CollapsibleSection.
- Accumulators in CollapsibleSection with custom card layout.

### sports-live-scores (52 lines)
- Compact horizontal ticker bar of live and suspended fixtures.
- Clicking a score opens that fixture in the detail panel.
- NOT singleton — can be added multiple times.

---

## Data Flow

```
SportsDataProvider (page.tsx)
├── fixtures + bets + arb data
├── filters (leagues, dateRange, statusFilter, search)
├── selectedFixtureId, arbThreshold
├── filteredFixtures → derived
└── provides all via React Context
    ├── SportsFixturesWidget       reads: filteredFixtures, filters; writes: selectedFixtureId
    ├── SportsFixtureDetailWidget  reads: selectedFixture
    ├── SportsArbWidget            reads: filteredFixtures, arbThreshold
    ├── SportsMyBetsWidget         reads: allBets
    └── SportsLiveScoresWidget     reads: filteredFixtures; writes: selectedFixtureId
```

---

## Testing Checklist

- [ ] **Fixtures:** Groups render (Live, Upcoming, Completed); live pulse indicators
- [ ] **Fixtures filters:** Date range, status, search, league chips all work
- [ ] **Fixture Detail:** Selecting a fixture shows stats, timeline, odds, trade panel
- [ ] **Arb Scanner:** Odds grid renders; arb threshold slider works
- [ ] **My Bets:** KPI strip shows correct aggregates; open/settled/accumulator tables populate
- [ ] **Live Scores:** Ticker shows live matches; clicking navigates to detail
- [ ] **Cross-widget:** Selecting fixture in list updates detail panel; selecting in live-scores also updates detail

---

## Merge Proposal

**WORK_TRACKER target:** "Single Sports console (fixtures + detail + my-bets)."

### Option A — Keep all 5 separate (recommended)
- This domain already has well-scoped widgets with clear roles.
- Fixtures + Detail are a master-detail pair that benefit from independent sizing.
- My Bets is a separate data concern (bet history, not fixture data).
- Arb Scanner and Live Scores are additive views for different workflows.
- The 2 presets already handle different arrangements well.
- **Result:** 5 widgets (no change).

### Option B — Merge Fixtures + Detail into one
- Combine the master list and detail panel into a split-pane widget.
- Problem: loses flexibility to resize each independently.
- **Result:** 4 widgets.

### Option C — Merge Live Scores into Fixtures header
- Embed the ticker as a sticky top row inside the Fixtures widget.
- Saves one widget registration.
- **Result:** 4 widgets.

---

## Questions for User

1. **Merge?** This domain seems well-structured already. Option A (keep), B (merge fixtures+detail), or C (merge live scores into fixtures)?
2. **Arb Scanner data:** Does the arb tab show actual odds and arb opportunities, or is it empty?
3. **My Bets data:** Do the open/settled tables have rows?
4. **Live Scores visibility:** Currently only in the "Arb focus" preset. Should it be in the default preset too?
