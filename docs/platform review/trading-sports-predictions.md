# Trading Terminal — Sports & Predictions Enhancements

> **Source:** Platform review meeting 2026-03-25
> **Lifecycle stage:** Trading (`/services/trading/`)
> **Current tabs:** `/services/trading/sports`, `/services/trading/predictions`
> **Status:** Not started (Promote tab in progress first)

---

## 1. Sports Tab Enhancements

**From meeting:**

> "The main additions are around enhancements around sports and predictions. For both it's trying to figure out what the high-level information is that's nice."

### 1.1 Fixture Browser

> "There's nothing wrong with seeing all of the prediction market predictions that exist. There's nothing wrong with being able to drop down and see in a nice visual way that Arsenal are playing Chelsea so you can see your latest fixtures or your up-and-coming fixtures."

> "It would be nice if you're able to then filter through on a time basis to see your historical fixtures as well since we have the information. We might as well showcase it so you can easily see historical games."

**What to build:**

- Upcoming fixtures list with visual match cards (team logos, date/time, venue)
- Historical fixtures browser with time-based filtering
- For each fixture:
  - Results (for completed matches)
  - In-game stats: half-time stats, pre-game stats, end-of-game stats (corners, possession, shots, etc.)
  - Stats are more visually friendly than raw data tables — think infographic-style presentation
- Focus on football (soccer) for now — no other sports until needed

> "For predictions it's fine to focus on football right now because we're not doing anything else anytime soon so no point overboasting on that side."

### 1.2 Arbitrage Tab (New Sub-Tab within Sports)

> "You probably need another tab, which is more like an arbitrage tab, and that's just showing you, for sports, a nice grid of your different bookmakers, all of the bookmakers that you're subscribed to."

**What to build:**

- Grid view: rows = fixtures/markets, columns = bookmakers
- Each cell shows the odds from that bookmaker for that market
- Highlight arbitrage opportunities (where odds across bookmakers create a guaranteed profit)
- Subscription-tiered: clients see only bookmakers they're subscribed to; ODUM internally sees all
- Revenue model: more bookmakers subscribed = higher fee

**Client use cases:**

- Manual arb hunting via the portal
- Building strategies using the research environment (higher tier)
- Giving signals to ODUM to trade on their behalf (managed service)

### 1.3 Canonical ID Crossover (Sports ↔ Predictions)

> "We've got crossover with sports so naturally, market fixtures should just match and results and odds are not market-specific; they're generic, hence the canonical IDs. But market odds should be just another venue in sports."

**What this means:**

- Prediction market odds (e.g., Polymarket) should appear as just another "venue" column in the sports arb grid
- Fixtures, results, and canonical IDs are shared between Sports and Predictions tabs
- The data model already supports this via canonical instrument IDs

---

## 2. Predictions Tab Enhancements

### 2.1 High-Level Overview (Streaming from Polymarket)

> "For predictions we can have one tab which is a little bit like what we have now, very high level, covering everything, streaming straight from polymarket; that's easy enough."

**What to keep/build:**

- Current high-level overview of all prediction markets — keep this
- Live streaming from Polymarket

### 2.2 Detailed Historical + Live View (Filtered to ODUM Instruments)

> "Historically, the one where we can look at historical and live and everything, when it comes to arbitrage, when we can actually trade, needs to be filtered to our instrument ID."

**ODUM's instruments on prediction markets:**

- Bitcoin up/down: 5 minutes, all the way up to 24 hours
- SPY up/down: 5 minutes, all the way up to 24 hours
- Sports predictions (crosses over with Sports tab)

### 2.3 Enriched Visualisation for Predictions

> "The same way Polymarket shows you a live version of Bitcoin going up and down on a chart as they're showing the Bitcoin up/down market. Same thing for SPY and sports, live results."

> "For SPY and Bitcoin we can probably enrich it beyond Polymarket because Polymarket doesn't show us things like options implied deltas."

**What to build for each prediction instrument:**

- Live chart of the underlying (BTC price, SPY price, live match stats)
- Prediction market odds overlaid
- **Enrichment beyond Polymarket (for BTC/SPY):**
  - Options implied delta for the closest strike to when the up/down market started
  - Visual comparison: if delta is rising while odds are falling (or vice versa), highlight the divergence
  - This is a unique value-add that Polymarket doesn't offer
- Trade list (Polymarket already has trade lists — we should show them too)

### 2.4 Historical Replay (Our Differentiator)

> "All of this stuff for sports and predictions, the key is going to be we can see it live and we can also see it in the past. You can't do that on Polymarket's website. We can go back and see how these things looked at a certain time, given a certain state of the world."

**What to build:**

- Time slider / date picker to replay historical states
- Show: odds at that time, underlying price at that time, stats at that time
- Use case: "Did we miss an arb?" — retrospective analysis

### 2.5 Arb Streaming (Sports + Predictions)

> "If you're looking at it flat you see the arbs now. If you have an arb stream you're like 'okay these arbs.' Arb streaming."

> "Fresh arbs. You want to see incrementally fresh arbs and then you need some sort of decay."

**Arb stream logic:**

1. Show fresh arbs as they appear in real-time
2. If an arb persists across multiple views, don't keep re-showing the same one
3. Once an arb crosses to the no-arb zone, clear it from cache
4. If it becomes an arb again (crosses threshold again), show it as a new arb
5. User-configurable threshold (1%, 2%, etc.)
6. **Historical arb stream:** show what arbs would have existed historically given the user's threshold — "what could you have done?"

**Two views:**

- **Live arb stream:** real-time fresh arbs appearing
- **Historical arb stream:** synthetic historical arbs given a configurable threshold

---

## Shared Concepts (Sports + Predictions)

| Concept           | Sports                                | Predictions                                        |
| ----------------- | ------------------------------------- | -------------------------------------------------- |
| Live data         | Live match stats, live odds           | Live Polymarket odds, live underlying prices       |
| Historical replay | Past fixtures, results, in-game stats | Past market states, odds history                   |
| Arb detection     | Cross-bookmaker odds comparison       | Cross-venue (bookmaker + prediction market)        |
| Canonical IDs     | Shared fixture/instrument IDs         | Same canonical IDs, prediction market as a "venue" |

---

## Open Questions

- [ ] What does the arb threshold default look like? (1%? 2%? Configurable range?)
- [ ] For historical arb streaming — how far back do we have reliable odds data?
- [ ] Options delta enrichment — do we have real-time options data flowing already, or is this a new data source?
- [ ] Sports stats (corners, possession, etc.) — which provider supplies these and in what granularity?
