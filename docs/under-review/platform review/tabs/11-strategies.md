# Tab: Strategies

**Route:** `/services/trading/strategies`
**Page file:** `app/(platform)/services/trading/strategies/page.tsx`
**Lines:** 669 | **Status:** Full implementation
**Note:** This tab does not appear in the `TRADING_TABS` constant in `service-tabs.tsx` — it exists as a page but is not in the current tab bar. It is linked from the Overview page strategy table.

---

## Current State

Strategy catalogue within the trading context — shows all live and graduated strategies with performance summary.

**What it renders:**

- KPI cards: total AUM (`getTotalAUM`), total P&L (`getTotalPnL`), month-to-date P&L (`getTotalMTDPnL`) — sourced from `REGISTRY_STRATEGIES`, potentially stale if API shape differs
- Strategy cards grouped by org/client (or ungrouped): `EntityLink`, `StatusBadge`, `SparklineCell`
- Per-card details: strategy name, archetype, asset class, status, performance fields, last updated
- Links per strategy: positions, detail page (`/services/trading/strategies/[id]`), config
- Multi-select filters: search, asset class, archetype, status
- Link to `strategies/grid` (grid/table alternative view)

**Data sources:** `useStrategyPerformance` (falls back to `DEFAULT_STRATEGIES` from registry), `useExecutionMode`

**Filtering/scoping:** Search + asset class + archetype + status multi-selects. Not wired to `useGlobalScope` — local filtering only.

---

## Meeting Review Items

From `trading-asset-class-navigation.md` / meeting:

- **Strategy graduation / investment management:** Clients should only see strategies that have graduated (minimum 1 month live track record). ODUM internal users see all including early-stage testing strategies. This is a data-scoping / entitlement concern — the page structure can stay the same, the API filters based on who's requesting.
- **Strategy family vs internal categories:** Clients see "strategy family" (commercial label). Internal users see full archetype/category taxonomy. The page should show the right label based on the user's role.

---

## Improvements Needed

1. **Add to tab bar:** This page exists but is not in `TRADING_TABS`. Decision needed: add it as a tab, or keep it as a page linked only from Overview. Given it's the strategy catalogue for the running system, it arguably belongs in the tab bar.
2. **Wire KPI cards to API:** `getTotalAUM`, `getTotalPnL`, `getTotalMTDPnL` use registry constants, not live API data. Should use `useStrategyPerformance` aggregated values.
3. **Wire to `useGlobalScope`:** Currently ignores global scope. Should filter strategies to scoped org/client when a global scope is set.
4. **Graduation filter:** Add a "Graduated only" toggle for clients. ODUM internal users see a "Show all including testing" toggle.
5. **Strategy family label:** When `role !== "internal"`, show strategy family label instead of internal archetype. Map via a config.
6. **Inline intervention controls:** From Overview page, intervention controls exist. Should be available on strategy cards here too (pause, kill switch shortcut).
7. **Performance sparklines:** `SparklineCell` exists — make sure it's using real rolling data, not static registry values.

---

## Asset-Class Relevance

**Common** — all asset classes have strategies. The asset-class filter already exists on the page. Strategy cards should visually distinguish asset-class context (icon or colour coding).

---

## Action

**Enhance** — add to tab bar, wire KPIs and global scope, add graduation filter, strategy family label for clients.
