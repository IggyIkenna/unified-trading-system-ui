# Tab: Predictions

**Route:** `/services/trading/predictions`
**Page file:** `app/(platform)/services/trading/predictions/page.tsx`
**Lines:** 18 | **Status:** Placeholder
**Component:** `components/trading/prediction-markets-panel.tsx` — 1,276 lines (the actual implementation)

---

## Current State

Thin page rendering `PredictionMarketsPanel`. The component covers prediction market browsing and trading.

**`PredictionMarketsPanel` internal structure:**

- Uses `placeMockOrder` from `@/lib/api/mock-trade-ledger` — not wired to `hooks/api`
- Uses `useToast`
- `MarketCategory` union type — categories of prediction markets
- `ScrollArea` with search/bookmark UI
- Based on naming, likely covers: market listing, category filter, position/trade entry

**Data sources:** `placeMockOrder` (mock only). No real Polymarket/Kalshi API hooks.

**Filtering/scoping:** None at page level. Search and bookmark UI at component level.

---

## Meeting Review Items

From `trading-sports-predictions.md`:

**High-level overview (keep what exists):**

- Current panel likely resembles Polymarket's market listing — keep this
- Stream live odds directly from Polymarket

**Detailed view — ODUM instrument IDs only:**

- Filtered to instruments ODUM actively trades on prediction markets:
  - Bitcoin up/down: 5 min to 24 hours
  - SPY up/down: 5 min to 24 hours
  - Sports event outcomes (crossover with Sports tab)

**Enriched visualisation (beyond what Polymarket offers):**

- For BTC/SPY instruments: show options implied delta for the closest strike
- Visual divergence: if delta is rising while prediction odds are falling (or vice versa), highlight this signal
- Live price chart of the underlying alongside the prediction market odds

**Historical replay (key differentiator):**

- Time slider to see how odds and underlying looked at any past point
- "Did we miss an arb at 3pm on date X?" — full historical state replay
- Polymarket doesn't offer this

**Trade list:**

- Polymarket exposes trade lists — show them
- Our own prediction market fills in the orders tab, but Polymarket market trade activity should be visible here for context

**Arb streaming (cross-venue):**

- Show prediction market arbs across Polymarket, Kalshi, and bookmakers for the same event
- Live stream + historical stream with decay logic
- User-configurable threshold

---

## What the Current Component Likely Has vs What's Needed

| Feature                           | Current `PredictionMarketsPanel` | Needed                       |
| --------------------------------- | -------------------------------- | ---------------------------- |
| Market browsing / listing         | Yes (mock)                       | Yes (wire to Polymarket API) |
| Category filter                   | Yes (basic)                      | Yes (enhanced)               |
| Trade entry                       | Yes (mock)                       | Yes (wire to real)           |
| Instrument-filtered detailed view | No                               | Yes — ODUM instruments only  |
| Underlying chart alongside odds   | No                               | Yes                          |
| Options delta enrichment          | No                               | Yes (for BTC/SPY)            |
| Historical replay                 | No                               | Yes                          |
| Polymarket trade list             | No                               | Yes                          |
| Cross-venue arb stream            | No                               | Yes                          |

---

## Improvements Needed

1. **Two-view structure:**
   - **View 1 (All Markets):** High-level Polymarket-style listing, live streaming, all categories. Keep close to what exists.
   - **View 2 (ODUM Instruments):** Filtered to instruments ODUM trades — richer charts, underlying data, options delta enrichment, historical replay.
2. **Wire to Polymarket/Kalshi API:** Replace `placeMockOrder` with real prediction market order placement. Pull live market data from provider.
3. **Underlying chart + odds overlay:** For each ODUM instrument, show the underlying (BTC price, SPY price, live match stats) alongside the prediction market odds on the same chart.
4. **Options delta enrichment (BTC/SPY):** Find the closest options strike at the time the up/down market started. Show that strike's delta alongside the prediction odds. Signal: if delta and odds diverge, highlight it.
5. **Historical replay:** Time slider for full historical state of any prediction market. Show odds history + underlying history at any past point.
6. **Trade list:** Show recent market activity (trades from Polymarket public data) for context alongside our own fills.
7. **Arb stream:** Cross-venue arb between Polymarket and other prediction venues. Same decay logic as in Sports arb stream.
8. **Crossover with Sports:** Sports event prediction markets should appear here too (canonical IDs bridge Sports tab and Predictions tab). An EPL match outcome on Polymarket should link to the fixture on Sports tab.

---

## Asset-Class Relevance

**Sports + Predictions** — closely linked with Sports tab. Together they form the Sports+Predictions asset-class group. Consider whether these should be two sub-tabs within a merged tab, or remain separate (with better cross-linking). See grouping summary doc.

---

## Action

**Rebuild** — the existing panel is a placeholder for browsing/trading. Needs real API wiring, the two-view structure (all markets vs ODUM instruments), options delta enrichment, historical replay, and arb streaming.
