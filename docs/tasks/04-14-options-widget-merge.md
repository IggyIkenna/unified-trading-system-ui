# 4.14 Options & Futures — Widget Audit & Merge Plan

> **Status:** DRAFT — awaiting user review
> **Page route:** `/services/trading/options`

---

## Current Widget Inventory

| widgetId | Label | Component | Singleton | Default Preset |
|----------|-------|-----------|-----------|----------------|
| `options-control-bar` | Options Controls | `OptionsControlBarWidget` | yes | 12x1 at (0,0) — both presets |
| `options-watchlist` | Watchlist | `OptionsWatchlistWidget` | yes | 3x10 at (0,1) |
| `options-chain` | Options Chain | `OptionsChainWidget` | yes | 6x8 at (3,1) |
| `options-trade-panel` | Options Trade Panel | `OptionsTradePanelWidget` | yes | 3x6 at (9,1) |
| `futures-table` | Futures Table | `OptionsFuturesTableWidget` | yes | 9x4 at (3,9) |
| `futures-trade-panel` | Futures Trade Panel | `OptionsFuturesTradePanelWidget` | yes | Not in default preset |
| `options-strategies` | Strategy Builder | `OptionsStrategiesWidget` | yes | In "Strategies & scenario" preset |
| `options-scenario` | Scenario Analysis | `OptionsScenarioWidget` | yes | In "Strategies & scenario" preset |
| `options-greek-surface` | Greek / Vol Surface | `OptionsGreekSurfaceWidget` | **no** | 3x4 at (9,7) |

**Total: 9 widgets.**

**Data provider:** `OptionsDataProvider` wraps the page.

**Presets:** 2 presets:
1. **"Default"** — Control bar → Watchlist (3 cols) + Chain (6 cols) + Trade Panel (3 cols) → Greek Surface + Futures Table
2. **"Strategies & scenario"** — Control bar → Strategy Builder (7 cols) + Scenario Analysis (5 cols) → Trade Panel + Chain

---

## What Each Widget Does

### options-control-bar
- Asset class (crypto/TradFi), venue, settlement type, main tab switcher, watchlist toggle.

### options-watchlist
- Saved watchlists with symbol selection for the active underlying asset.

### options-chain
- Full options chain: calls and puts per strike with Greeks, IV, open interest.
- The core options trading surface.

### options-trade-panel
- Order entry for options: spreads, combos from chain or strategy builder selection.

### futures-table
- Perpetual and dated futures with funding rate, basis, volume.

### futures-trade-panel
- Futures order entry after selecting a contract in the futures table.

### options-strategies
- Multi-leg strategy builder: calendar spreads, straddles, strangles, combos.

### options-scenario
- Spot and vol shock grid with preset scenarios for portfolio-level P&L impact.

### options-greek-surface
- Crypto: 3D Greek surface visualization. TradFi: skew-aware vol grid.
- NOT singleton — can add multiple instances.

---

## Testing Checklist

- [ ] **Control bar:** Asset class, venue, settlement toggles work
- [ ] **Watchlist:** Symbols load; selecting one updates the chain
- [ ] **Options Chain:** Strikes render with calls/puts, Greeks, IV, OI
- [ ] **Trade Panel:** Order form populates when chain row selected
- [ ] **Futures Table:** Contracts render with funding, basis, volume
- [ ] **Futures Trade Panel:** Order form populates when futures row selected
- [ ] **Strategy Builder:** Multi-leg builder renders; can add/remove legs
- [ ] **Scenario Analysis:** Shock grid renders with preset scenarios
- [ ] **Greek Surface:** Visualization renders (3D or grid)

---

## Merge Proposal

### Option A — No merge (recommended)
- This is a professional-grade derivatives trading interface.
- Each widget maps to a distinct concept in options/futures trading.
- The 2 presets serve different workflows (trading vs analysis).
- Merging would reduce flexibility — traders need to resize/rearrange these individually.
- **Result:** 9 widgets (no change).

### Option B — Merge chain + trade panel
- Embed trade form as a sidebar in the chain widget.
- Problem: reduces flexibility for wide-screen vs narrow-screen layouts.
- **Result:** 8 widgets.

### Option C — Merge futures table + futures trade panel
- These are a natural pair (select contract → enter order).
- **Result:** 8 widgets.

---

## Questions for User

1. **Merge?** A (no merge), B (chain+trade), or C (futures table+trade)?
2. **Greek Surface:** Is the 3D visualization functional with mock data?
3. **Strategy Builder + Scenario:** Are these functional or placeholder?
4. **Any broken data?** Which widgets show data when you visit the page?
