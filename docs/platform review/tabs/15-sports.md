# Tab: Sports

**Route:** `/services/trading/sports`
**Page file:** `app/(platform)/services/trading/sports/page.tsx`
**Lines:** 19 | **Status:** Placeholder
**Component:** `components/trading/sports-bet-slip.tsx` — 1,431 lines (the actual implementation)

---

## Current State

Thin page rendering `SportsBetSlip`. The component title suggests it's a bet-slip-style UI.

**`SportsBetSlip` internal structure:**

- Uses `placeMockOrder` from `@/lib/api/mock-trade-ledger` — not wired to `hooks/api`
- Uses `useToast`
- UI primitives: `Card`, `Tabs`, `Select`, `Alert`, `Collapsible`
- Based on naming, likely covers: bet/back/lay placement, market browsing, active bets view

**Data sources:** `placeMockOrder` (mock only). No real sports data API hooks.

**Filtering/scoping:** None at page level. Unknown at component level.

---

## Meeting Review Items

From `trading-sports-predictions.md`:

**Fixture Browser (new):**

- Upcoming and historical fixtures with time-based filtering
- Infographic-style match cards: team logos, date/time, venue
- In-game stats: half-time, pre-game, end-of-game (corners, possession, shots)
- Football only for now — no other sports yet

**Arbitrage Sub-Tab (new):**

- Grid view: rows = fixtures/markets, columns = bookmakers
- Each cell shows odds from that bookmaker for that market
- Highlight arb opportunities across bookmakers
- Subscription-tiered: clients see only subscribed bookmakers; ODUM sees all
- Prediction markets (Polymarket) as another "venue" column via canonical IDs

**Historical Replay:**

- Time slider to replay past market states (odds, stats, results at a given time)
- Unique differentiator — Polymarket/bookmakers don't offer this

**Arb Streaming (live):**

- Fresh arbs appearing in real-time with decay logic
- Once an arb clears, remove from cache; if it returns, show again
- User-configurable threshold (1%, 2%, etc.)

---

## What the Current Component Likely Has vs What's Needed

| Feature                                 | Current `SportsBetSlip` | Needed                           |
| --------------------------------------- | ----------------------- | -------------------------------- |
| Bet slip / order placement              | Yes (mock)              | Yes (wire to real bookmaker API) |
| Fixture browser                         | Unlikely                | Yes — new section                |
| Historical stats per fixture            | No                      | Yes                              |
| Cross-bookmaker arb grid                | No                      | Yes — new sub-tab                |
| Historical replay                       | No                      | Yes                              |
| Live arb stream                         | No                      | Yes                              |
| Canonical ID crossover with Predictions | No                      | Yes                              |

---

## Improvements Needed

1. **Fixture browser:** New top-level section within this tab. Upcoming fixtures list + historical browser with time filter. Infographic-style match cards. Drill into a fixture to see stats.
2. **Arbitrage sub-tab:** New sub-tab showing the cross-bookmaker odds grid. Highlight positive EV / arb cells. Subscription-gated columns for bookmakers the client isn't subscribed to (lock icon + FOMO).
3. **Historical replay:** Date/time slider that replays past states of the arb grid and fixture stats.
4. **Arb streaming:** Live feed of fresh arb opportunities with decay. Configurable threshold. Historical arb stream (what would you have caught?).
5. **Wire to real sports data API:** Replace `placeMockOrder` with real bet placement. Wire fixture data to sports data provider.
6. **Merge with Predictions tab (canonical IDs):** Prediction market odds should appear as a column in the arb grid — treating Polymarket as just another "venue." The canonical instrument IDs already bridge this.
7. **Tab rename consideration:** "Sports" and "Predictions" are separate tabs in the current nav but share data and concepts heavily. Since the meeting decided to merge Sports + Predictions into one asset class group, consider whether these should be one tab with sub-tabs, or remain separate. See grouping summary doc.

---

## Asset-Class Relevance

**Sports + Predictions** — entirely specific to this asset-class group. Non-sports users see this tab as locked.

---

## Action

**Rebuild** — the existing `SportsBetSlip` component is a starting point for bet placement but the tab needs an entirely new architecture: fixture browser, arb grid, historical replay, live arb stream. The current component may be refactored into a "Place Bet" section within the new tab.
