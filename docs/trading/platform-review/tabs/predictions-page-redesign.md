# Predictions Page — Redesign Plan

**Route:** `/services/trading/predictions` **Current state:** 18-line placeholder wrapping
`prediction-markets-panel.tsx` (1,276 lines, all mock) **Target:** 5-tab page with proper component structure

---

## What Already Exists (Reuse)

### From `components/trading/sports/`

| Asset              | What it provides                                                                                                      | Reused in                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `types.ts`         | `ArbOpportunity`, `ArbLeg`, `Bookmaker`, `OddsMarket`, `Fixture`, `ProgressiveOddsSnapshot`, `BookmakerOdds`          | All tabs                                 |
| `helpers.ts`       | `calcArbPct`, `calcArbStakes`, `fmtOdds`, `fmtImpliedProb`, `fmtCurrency`, `fmtRelativeTime`, `isLive`, `isCompleted` | All tabs                                 |
| `shared.tsx`       | `StatusPill`, `ArbBadge`, `LeagueBadge`, `OddsMovementBadge`, `TeamStatBar`                                           | Tab 3, Tab 4                             |
| `arb-stream.tsx`   | `ArbStream` component with `DecayBar`, live/historical toggle, `ActiveArbCard`, `DecayedArbCard`                      | Tab 4 (Arb Stream) — **import directly** |
| `mock-data.ts`     | `generateProgressiveSnapshots`, fixture generators                                                                    | Tab 3 mock data                          |
| `mock-fixtures.ts` | `SUBSCRIBED_BOOKMAKERS`, `TOTAL_BANKROLL`, `KELLY_HALF_FRACTION`                                                      | Tab 4, Tab 5                             |

### From `components/trading/prediction-markets-panel.tsx`

| Asset                                          | What it provides  | Reused in                                 |
| ---------------------------------------------- | ----------------- | ----------------------------------------- |
| `PredictionMarket` interface                   | Market data shape | Tab 1 types                               |
| `MarketCategory`                               | Category union    | Tab 1                                     |
| Market browser + search/sort/bookmark          | UI                | Tab 1 (keep mostly as-is)                 |
| Market detail drawer (trade panel, order book) | Trade UI          | Tab 5 (extract as `PredictionTradePanel`) |

---

## Target File Structure

```
app/(platform)/services/trading/predictions/
  page.tsx                              — thin orchestrator, 5-tab shell

components/trading/predictions/
  types.ts                              — PredictionMarket, PredictionPosition, PredictionArb,
                                          OdumInstrument — extends sports/types.ts
  mock-data.ts                          — seeded mock for all 5 tabs
  helpers.ts                            — re-exports sports helpers + prediction-specific utils
  shared.tsx                            — ProbabilityBar, VenueChip, PriceTile, OddsChart

  markets-tab.tsx                       — Tab 1: general market browser
  portfolio-tab.tsx                     — Tab 2: open + settled positions
  odum-focus-tab.tsx                    — Tab 3: football + crypto + TradFi enriched view
  arb-stream-tab.tsx                    — Tab 4: cross-venue arb (wraps sports/arb-stream.tsx)
  trade-tab.tsx                         — Tab 5: dedicated trade entry
```

---

## Tab 1 — Markets

**Source:** Extract and clean up the existing `PredictionMarketsPanel`. Keep the market browser, fix the empty chart
placeholder.

**What changes from today:**

- Remove irrelevant categories: Weather, Culture, Esports — keep: **Trending, Sports, Crypto, Finance, Geopolitics,
  Elections, Breaking**
- Add proper football markets to mock data (see §Mock Data below)
- Replace the empty "Price History" placeholder in the detail drawer with a real mock `OddsChart` (Recharts area chart,
  seeded data)
- Keep: search, sort (trending / newest / highest volume / closing soon), bookmark, venue filter (Polymarket / Kalshi /
  Both)
- Keep: trade panel (Buy YES / Buy NO) — this stays inline in the detail drawer here AND is replicated in Tab 5 as a
  standalone panel

**Component:** `markets-tab.tsx` — mostly extracted from existing `prediction-markets-panel.tsx`, cleaned up.

---

## Tab 2 — Portfolio

**Purpose:** Prediction-specific positions. Separate from the main Positions tab to show prediction-native fields
(shares held, YES/NO, resolution date, probability movement since entry).

**Layout:**

```
KPI row: Open positions | Total staked | Unrealised P&L | Win rate (settled)

[Open Positions table]
  Market | Venue | Side | Shares | Entry price | Current price | Unrealised P&L | Resolution | Actions

[Settled Positions table]  (collapsible)
  Market | Venue | Side | Outcome | Entry | Exit | P&L | Settled
```

**Types needed (`types.ts`):**

```typescript
interface PredictionPosition {
  id: string;
  marketId: string;
  marketQuestion: string;
  category: MarketCategory;
  venue: MarketVenue;
  outcome: string; // "YES" | "NO" | outcome name for multi
  side: "yes" | "no";
  sharesHeld: number;
  entryPricePerShare: number; // cents, 0-100
  currentPricePerShare: number;
  totalStaked: number;
  potentialReturn: number;
  unrealisedPnl: number;
  resolutionDate: string | null;
  status: "open" | "settled";
  settledAt?: string;
  settlementOutcome?: "won" | "lost" | "void";
  realisedPnl?: number;
  openedAt: string;
}
```

**Component:** `portfolio-tab.tsx` — new, no existing equivalent.

---

## Tab 3 — ODUM Focus

**Purpose:** Markets relevant to ODUM's trading focus — football (all major leagues), crypto price markets, TradFi
markets. Enriched beyond what Polymarket shows.

### Instrument groups

**Football** — match-winner markets for active EPL, UCL, La Liga, Bundesliga, Serie A, Ligue 1, UEL fixtures. Reuses
`Fixture` and `ProgressiveOddsSnapshot` from `sports/types.ts`. Shows:

- Match card with live score (if in progress) and status using `StatusPill` from `sports/shared.tsx`
- Prediction odds (Polymarket YES price for Home/Draw/Away outcomes) alongside bookmaker odds
- In-play stats bar (possession, xG, shots) using `TeamStatBar` from `sports/shared.tsx`
- Historical replay: time slider on completed matches scrubs through `progressiveOdds` snapshots

**Crypto** — BTC and ETH up/down markets at 5m, 15m, 1h, 4h, 24h timeframes. Each shows:

- Live price chart (underlying) with YES probability overlaid on the same chart (dual axis)
- **Options delta enrichment:** for BTC/ETH, show the delta of the nearest options strike (from mock
  `closestStrikeDelta`). If delta trend and odds trend diverge (one rising while other falling), show an amber
  `⚡ Divergence` badge
- Resolution countdown timer
- Volume and recent trade activity

**TradFi** — SPY up/down (same timeframes as crypto) + selected macro markets (Fed rate decision, S&P 500 above
threshold). Shows:

- SPY price chart with YES probability overlay (same dual-axis pattern as crypto)
- Options delta enrichment for SPY (same as BTC/ETH)
- No special stats beyond the price chart

### As-Of / Historical Replay

The existing `BatchLiveRail` at the top of the trading layout already provides Live/Simulated toggle with date range.
When in Simulated mode:

- Football: time slider scrubs through `progressiveOdds` array (already in `Fixture` type)
- Crypto/TradFi: price series and odds series scrub to the selected date range endpoint

**No new toggle needed** — just consume `useGlobalScope().scope.mode` and `scope.asOf`.

### New types needed

```typescript
interface OdumInstrument {
  id: string; // "btc-up-1h", "epl-arsenal-chelsea-home"
  type: "crypto" | "tradfi" | "football";
  label: string;
  timeframe?: "5m" | "15m" | "1h" | "4h" | "24h"; // crypto/tradfi only
  fixtureId?: string; // football only — links to Fixture from sports/types
  polymarketMarketId: string;
  currentOddsYes: number; // 0-100 cents
  underlyingPrice?: number; // BTC/SPY price
  underlyingSeries: { t: number; price: number; oddsYes: number }[]; // time series for chart
  closestStrikeDelta?: number; // options delta, BTC/SPY only
  deltaSeriesSlope?: "up" | "down" | "flat";
  oddsSlopeVsDelta?: "aligned" | "diverging"; // "diverging" triggers amber badge
  resolutionAt: string;
  volume: number;
  venue: "polymarket" | "kalshi";
}
```

**Component:** `odum-focus-tab.tsx` — new, reuses sports `shared.tsx` for football cards, custom dual-axis chart for
crypto/TradFi.

---

## Tab 4 — Arb Stream

**Purpose:** Cross-venue arb feed for prediction markets. All arb combos: Polymarket/Kalshi, Polymarket/bookmaker,
bookmaker/bookmaker.

**Implementation:** Import `ArbStream` directly from `components/trading/sports/arb-stream.tsx`. The component already
handles:

- Live stream with decay timers (`DecayBar`)
- `NEW` / `ACTIVE` / `GONE` states from `ArbOpportunity.isActive` + `detectedAt` + `decayedAt`
- Historical toggle
- Configurable threshold

**Prediction-specific additions:**

- Venue filter chips: Polymarket, Kalshi, Bet365, Pinnacle, Betfair Exchange (all already in `Bookmaker` type in
  `sports/types.ts`)
- Market-type filter: Football / Crypto / TradFi / All
- The `ArbOpportunity.market` field currently uses `OddsMarket` (football markets like "FT Result"). For crypto/TradFi
  prediction arbs, we need `"BTC Up/Down"`, `"SPY Up/Down"` — extend `OddsMarket` type or use a string literal union

**Component:** `arb-stream-tab.tsx` — thin wrapper around `sports/arb-stream.tsx` with prediction-specific filters and
extended mock data.

---

## Tab 5 — Trade

**Purpose:** Standalone trade entry without needing to find a market first. Three workflows:

1. **Quick trade:** Select a market from a searchable dropdown → see current prices → enter stake → submit
2. **Active markets shortlist:** Top markets by volume shown as cards with inline trade buttons
3. **Recent trades:** Own fills from prediction markets (last 20)

**Layout:**

```
[Search: find a market...]      [Recent Trades ▼]
[Top Markets by Volume — 6 cards with Buy YES / Buy NO inline]
─────────────────────────────────────
[Trade Panel when market selected]
  Market: Arsenal to win EPL 2025/26
  Venue: Polymarket
  YES: 62¢  |  NO: 38¢
  [Buy YES] [Buy NO]
  Stake: [___]  [10] [50] [100] [500]
  Potential return: $XX.XX
  Kelly suggestion: $XX
  [Place Trade]
```

**Trade execution:** Still uses `placeMockOrder` until API is ready. Wires to `useToast` for confirmation.

**Component:** `trade-tab.tsx` — extracted from `PredictionMarketsPanel`'s detail drawer trade panel + new market
selector.

---

## Mock Data (`mock-data.ts`)

Seeded with a `SEED` constant (default `42`, changeable) so the same seed always produces the same random data.

### Football markets (ODUM Focus)

Add to existing sports mock fixtures — 6 active matches covering EPL, UCL, La Liga:

- Man City vs Arsenal (EPL, live, 67')
- Liverpool vs Real Madrid (UCL, upcoming)
- Barcelona vs Atletico (La Liga, FT — has `progressiveOdds` for replay)
- Bayern vs Dortmund (Bundesliga, live, HT)
- PSG vs Nice (Ligue 1, upcoming)
- Arsenal vs Leverkusen (UEL, upcoming)

Each has Polymarket YES odds for Home/Draw/Away that move with the match state.

### Crypto markets

```typescript
const CRYPTO_INSTRUMENTS: OdumInstrument[] = [
  { id: "btc-up-5m",  label: "BTC > $92,500 in 5m",  timeframe: "5m",  ... },
  { id: "btc-up-1h",  label: "BTC > $93,000 in 1h",  timeframe: "1h",  ... },
  { id: "btc-up-4h",  label: "BTC > $94,000 in 4h",  timeframe: "4h",  ... },
  { id: "btc-up-24h", label: "BTC > $96,000 in 24h", timeframe: "24h", ... },
  { id: "eth-up-1h",  label: "ETH > $3,200 in 1h",   timeframe: "1h",  ... },
  { id: "eth-up-24h", label: "ETH > $3,400 in 24h",  timeframe: "24h", ... },
]
```

Each has a 100-point seeded time series for `underlyingSeries` (price + oddsYes) and a `closestStrikeDelta`.

### TradFi markets

```typescript
const TRADFI_INSTRUMENTS: OdumInstrument[] = [
  { id: "spy-up-1h",  label: "SPY > 580 in 1h",  ... },
  { id: "spy-up-24h", label: "SPY > 585 in 24h", ... },
]
```

### Portfolio positions (mock)

10 open positions + 8 settled:

- Mix of football, crypto, TradFi
- Mix of YES/NO, won/lost
- Cover all leagues in the football set

### Arb opportunities (mock)

Extend `MOCK_ARB_STREAM` from `sports/mock-data.ts` with prediction market arbs:

- BTC Up/Down: Polymarket 68¢ vs Kalshi 64¢ → 3.2% arb
- Arsenal to win UCL: Polymarket 62¢ vs Bet365 1.55 → 2.8% arb
- SPY Up/Down: Polymarket 58¢ vs Kalshi 55¢ → 1.9% arb
- Man City win: Betfair 1.72 vs Pinnacle 1.70 → 1.1% arb (below 2% threshold)

---

## Implementation Phases

| Phase | What                                                                                                        | Notes                                                                            |
| ----- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 0     | Create `components/trading/predictions/` folder with `types.ts`, `mock-data.ts`, `helpers.ts`, `shared.tsx` | Types extend `sports/types.ts`; helpers re-export from `sports/helpers.ts`       |
| 1     | `markets-tab.tsx` — extract + clean existing `PredictionMarketsPanel`                                       | Remove irrelevant categories, fix chart placeholder with real `OddsChart`        |
| 2     | `portfolio-tab.tsx` — new                                                                                   | Open positions table + settled positions table, KPI row                          |
| 3     | `odum-focus-tab.tsx` — new                                                                                  | Football cards (reuse sports shared), crypto/TradFi dual-axis chart, delta badge |
| 4     | `arb-stream-tab.tsx` — thin wrapper around `sports/arb-stream.tsx`                                          | Add market-type filter, extend mock arbs with prediction market entries          |
| 5     | `trade-tab.tsx` — extract + enhance trade panel                                                             | Market selector, Kelly suggestion, recent fills                                  |
| 6     | Wire `page.tsx` — replace placeholder with 5-tab shell                                                      | Delete `PredictionMarketsPanel` import; render new tab components                |

---

## What Gets Deleted

- `components/trading/prediction-markets-panel.tsx` — the 1,276-line monolith is replaced by the component folder. The
  Markets tab extracts and keeps the good parts; the rest is rebuilt.

---

## Open Questions (non-blocking)

- [ ] Options delta for crypto: is there a delta series in any existing hook/mock, or do we generate it as
      `closestStrikeDelta = seeded random 0.3–0.7`?
- [ ] Currency: sports helpers use GBP (`fmtCurrency`). Prediction markets use USD/USDC. Should we add a USD formatter
      or just inline it?
- [ ] Arb stream for predictions: should it be a separate stream from sports arbs, or a unified arb stream filtered by
      market type? (Tab 4 in Sports already exists — could they be the same component with a global filter.)
