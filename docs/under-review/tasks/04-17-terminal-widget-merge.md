# 4.17 Terminal — Widget Audit & Merge Plan

> **Status:** LANDED 2026-04-22 (WU-4). `instrument-bar` was archived. Instrument selection migrated to `terminal-watchlist` (shared `WatchlistPanel`); account picker moved into `order-entry`. Dropped live-price, %Δ, LIVE/BATCH mode badge, and the dead stub buttons (Refresh / Settings / Maximize). See `docs/audits/live-review-findings.md` rows #4 and #17.
>
> **Page route:** `/services/trading/terminal`

---

## Current Widget Inventory

| widgetId | Label | Component | Singleton | Default Preset |
|----------|-------|-----------|-----------|----------------|
| `instrument-bar` | Instrument & Account | `InstrumentBarWidget` | yes | 12x1 at (0,0) |
| `order-book` | Order Book | `OrderBookWidget` | **no** | 3x8 at (0,1) |
| `price-chart` | Price Chart | `PriceChartWidget` | **no** | 6x8 at (3,1) |
| `order-entry` | Order Entry | `OrderEntryWidget` | yes | 3x8 at (9,1) |
| `market-trades` | Market Trades | `MarketTradesWidget` | yes | 6x3 at (0,9) |
| `calendar-events` | Calendar Events | `CalendarEventsWidget` | yes | 6x3 at (6,9) |

**Total: 6 widgets.**

**Data provider:** Page (639 lines) wraps with a `TerminalDataProvider`.

**Presets:** 1 preset ("Default") — classic trading terminal layout: Instrument bar (top) → Order Book (left) + Price Chart (center) + Order Entry (right) → Market Trades + Calendar Events (bottom row).

**Notable:** `order-book` and `price-chart` are NOT singletons — users can add multiple instances (e.g. two charts for different timeframes, or order book for two venues).

---

## What Each Widget Does

### instrument-bar
- Instrument selector, account picker, live price ticker, and quick actions.
- Acts as global context bar for the terminal.

### order-book
- Live bid/ask ladder with depth visualization.
- Multi-instance capable — can show multiple instruments side by side.

### price-chart
- Candlestick, line, depth, or options chain chart with indicators.
- Multi-instance capable — different timeframes or chart types.

### order-entry
- Buy/sell order form with strategy linking and constraint validation.
- Limit, market, stop orders.

### market-trades
- Real-time market trades feed and own trade history.

### calendar-events
- Economic calendar and corporate actions feed.
- **Cross-page:** Available on both `terminal` and `overview` tabs.

---

## Testing Checklist

- [ ] **Instrument bar:** Instrument search/selector works; live price updates
- [ ] **Order Book:** Bid/ask levels render with depth bars
- [ ] **Price Chart:** Candlestick chart renders with real data; timeframe selector works
- [ ] **Price Chart:** Chart type switching (candlestick, line, depth)
- [ ] **Order Entry:** Buy/sell form works; order types (market, limit, stop) switch
- [ ] **Market Trades:** Feed shows trades with timestamps and side colours
- [ ] **Calendar Events:** Events list renders with dates and types
- [ ] **Multi-instance:** Can add a second order-book or price-chart widget

---

## Merge Proposal

### Option A — No merge (recommended)
- This is the classic exchange terminal layout (Binance/Bybit/Deribit style).
- Each widget maps directly to a standard terminal component.
- Multi-instance support for chart and order book is essential for power users.
- No merge makes sense — this is an industry-standard layout.
- **Result:** 6 widgets (no change).

### Option B — Merge instrument-bar into price-chart header
- Embed instrument selector as a header in the price chart.
- Problem: loses ability to show instrument selector when chart is hidden.
- **Result:** 5 widgets.

---

## Questions for User

1. **Merge?** A (no merge) or B (instrument into chart)? This is a standard terminal — probably keep as-is.
2. **Calendar Events:** Currently also available on Overview. Should it stay terminal-only or remain cross-page?
3. **Any broken data?** Is the price chart rendering with real candle data, or is it placeholder?
4. **Order Entry:** Does the buy/sell form work with mock execution?
