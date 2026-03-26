# Tab: Terminal

**Route:** `/services/trading/terminal`
**Page file:** `app/(platform)/services/trading/terminal/page.tsx`
**Lines:** 1,847 | **Status:** Full implementation

---

## Current State

Full multi-panel trading workspace. The most feature-rich page in the UI.

**What it renders:**

- Resizable panel layout (`ResizablePanelGroup`): order book | chart | order entry
- `OrderBook` — live bid/ask depth
- `CandlestickChart` / line chart / `DepthChart` (chart type toggle)
- Dynamic `OptionsChain` + `VolSurfaceChart` (lazy-loaded for options instruments)
- Order entry: buy/sell side, limit/market type, size input, strategy link, constraints collapsible
- `ManualTradingPanel` — secondary order management
- `CalendarEventFeed` — upcoming economic events relevant to selected instrument
- Instrument selector: grouped by `category` from API (closest to asset-class grouping today)
- Account/org/client selectors guard order submission (`isContextComplete`)
- Strategy linkage from `STRATEGIES` registry with position/constraints awareness

**Data sources:** `useGlobalScope`, `useTickers`, `usePositions`, `useAlerts`, `useStrategyPerformance`, `useInstruments`, `useBalances`, `useCandles`, `useOrderBook`, `useWebSocket` (live ticks), `useTickingNowMs`

**Filtering/scoping:** Global scope (live vs batch, org/client/strategy). Strategy IDs can remap instrument selection via `strategyInstruments`. Org + client + account required for order submission. Instrument list grouped by category.

---

## Meeting Review Items

- Terminal should have the **Quick View panel** accessible — user should always be able to see key alerts and metrics without leaving the terminal.
- Sports/predictions instruments should appear in the terminal's instrument list under the right category groups (fixtures, prediction markets).
- As-of mode should disable order placement (viewing only) — the terminal already has live/batch concept via `modeParam` but order submission guards need to be explicitly tied to live-only.

---

## Improvements Needed

1. **Quick View integration:** Shell-level quick view panel should overlay or attach to the terminal without disrupting the resizable panel layout. Consider a collapsible top banner.
2. **Asset-class filtering in instrument selector:** The current category grouping in the instrument selector (`instrumentsByCategory`) is a good start. Needs to include sports fixtures and prediction market instruments as their own categories.
3. **Live-only order placement guard:** Make it explicit that order submission is disabled in as-of/batch mode, with a clear UI message (not just a disabled button with no explanation).
4. **Options vol surface:** Already implemented with dynamic import. Ensure it shows when switching to an options instrument without requiring manual chart-type selection.
5. **Strategy constraints:** The strategy link + constraints collapsible is useful but buried. Consider surfacing key constraints (max notional, allowed venues) more visibly before submission.
6. **Sports/predictions order types:** When a sports or prediction market instrument is selected, the order entry should adapt (back/lay terminology, fractional odds display, accumulator toggle) rather than showing a generic limit/market form.

---

## Asset-Class Relevance

**Common** — the terminal is the primary interaction point for all asset classes. The instrument selector and order entry adapt per instrument type. Chart types adapt (candle for price, implied vol for options, odds chart for sports/predictions).

---

## Action

**Enhance** — solid foundation, needs instrument-type-aware order entry adaptations and Quick View integration.
