# Tab: Sports

**Route:** `/services/trading/sports`
**Page file:** `app/(platform)/services/trading/sports/page.tsx`
**Lines:** 19 | **Status:** Placeholder
**Component:** `components/trading/sports-bet-slip.tsx` — 1,431 lines

---

## Current State

Thin page rendering `SportsBetSlip`. The component is more complete than the placeholder suggests:

**What `SportsBetSlip` already has:**

- `Fixture` type with phase: `PRE_GAME | HALFTIME | LIVE | FULL_TIME`
- `OddsLine` type: outcome, decimal odds, implied probability, movement (UP/DOWN/STABLE)
- `ExchangeOdds` type: back/lay price + size (Betfair exchange style)
- `ArbOpportunity` type: two-venue comparison with `arbPct`
- Kelly criterion sizing: bankroll, half-Kelly, edge threshold, drawdown limit
- Suspension detection: goal, VAR, red card, injury
- Mock fixtures: EPL, La Liga, NBA, NFL, MLB, ATP Tennis

**What it does NOT have:**

- Cross-bookmaker arb grid (only two-venue pair detection, no full grid)
- Historical fixture browser
- In-game stats (corners, shots, possession, xG)
- Live arb stream with decay
- Historical replay
- Global scope integration
- Any real API hook (all mock via `placeMockOrder`)

**Decision:** Football only for now — strip non-football sports from mock data.

---

## Backend Data Available

The sports database (`new-sports-batting-services/footballbets/core/models.py`) provides rich data that directly maps to every UI section.

### Fixture & Match Data

From `Fixture` (API-Football), `SFMatch` (Soccer Football Info), `FTMatch` (FootyStats):

- Home/away teams, league, date, kickoff time, venue, referee
- Score: final, half-time, full-time, extra time, penalties
- Status: NS (not started), LIVE, HT (halftime), FT (full time), AET, PEN

### In-Game Stats (per fixture)

From `FixtureStats` (API-Football) and `SFMatch` / `FTMatch`:

- Shots on/off goal, total shots, blocked shots, shots inside/outside box
- Ball possession (%)
- Corner kicks (total, FH, 2H)
- Fouls, offsides
- Yellow cards, red cards
- Goalkeeper saves
- Total passes, accurate passes, pass accuracy %
- **xG** (expected goals) — from `SFMatch.home_xg_live`, `USMatch.home_xg`
- Dangerous attacks, normal attacks (`SFMatch`)
- **Dominance index** every 30 seconds (`SFMatchDominance`) — unique differentiator

### Progressive / In-Play Data (every 30 seconds)

From `SFMatchProgressiveStats` and `SFMatchProgressiveOdds`:

- Stats at every 30-second interval: goals, possession, attacks, shots, corners, cards
- Odds at every 30-second interval: 1X2, Asian Handicap, Over/Under, corner markets
- **This is the historical replay data source** — full time-series of any match

### Key Events

From `FixtureEvent` (API-Football) and `SFMatchEvent` (Soccer Football Info):

- Goals, yellow cards, red cards, substitutions, VAR reviews
- Minute of event + player

### Lineups

From `FixtureLineup`, `FixturePlayerStats`, `FTLineups`, `FTLineupEvents`:

- Starting XI and bench
- Player positions on pitch (grid)
- Substitution details (who came on/off, at what minute)

### Odds (Multi-Bookmaker)

From `FTOdds` (FootyStats):

- `market_type`: FT Result, Over/Under, BTTS, Double Chance, Corners, HT Result, DNB, etc.
- `bookmaker`: bet365, Unibet, Marathon, etc.
- `odds_value` per bookmaker per market

From `ODOdds` (The Odds API, parquet files):

- Historical odds time series: `time_bucket` field (T-60m, T-24h, etc.)
- Markets: h2h, spreads, totals, h2h_lay
- Multiple `bookmaker_key` values: pinnacle, bet365, etc.
- **This is the arb grid and historical replay odds source**

From `SFMatchProgressiveOdds`:

- Live odds every 30 seconds during match: 1X2, AH, O/U, corners, first half markets
- **Best source for in-play odds history and live arb stream**

### Injuries

From `Injury`: player, team, reason — per fixture

### Weather

From `FTWeather`: wind speed, temp, humidity, pressure, weather type — per match

---

## Proposed Tab Structure

Three sub-tabs within Sports:

```
Sports
├── Fixtures          ← overview of all matches with stats
├── Arb              ← cross-bookmaker odds grid + live arb stream
└── My Bets          ← open bets, orders, P&L (documented below)
```

### Global Filters (persistent across all sub-tabs)

```
[League ▼]  [Date Range: Today | This Week | Custom]  [Status: All | Live | Upcoming | Completed]  [Search fixtures]
```

- **League:** EPL, La Liga, Bundesliga, Serie A, Ligue 1, Champions League, Europa League (football only)
- **Date Range:** Today (default) / This Week / Next 7 days / Custom range / Historical
- **Status:** All / Live (LIVE, HT) / Upcoming (NS) / Completed (FT, AET, PEN)
- **Search:** Team name or fixture search

---

## Sub-Tab 1: Fixtures

Central fixture browser. Combines upcoming, live, and historical matches.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [League ▼] [Date Range ▼] [Status ▼] [Search]   [Live | As-Of]│
├─────────────────────────────────────────────────────────────────┤
│  LIVE NOW                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ EPL · Matchday 28           ● LIVE  67'                 │    │
│  │  Man City  [1] ────────── [1]  Liverpool                │    │
│  │  xG: 1.8                              xG: 0.9           │    │
│  │  Shots: 8 (4 on)             Shots: 4 (2 on)            │    │
│  │  Possession: 58%             Possession: 42%            │    │
│  │  Corners: 5                  Corners: 2                 │    │
│  │  67' ⚽ Haaland (pen)  45' ⚽ Salah                      │    │
│  │                              [View Arb] [Place Bet]     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  UPCOMING TODAY                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ EPL · Matchday 28            ○ 20:00 KO                 │    │
│  │  Tottenham ─────────────────── Man United               │    │
│  │  Best odds: 2.10 / 3.40 / 3.80  Arb available? No      │    │
│  │  xG model: 1.4 vs 1.1   Weather: 12°C, Light rain      │    │
│  │                              [View Arb] [Place Bet]     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  RECENTLY COMPLETED                                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ La Liga · Matchday 27                 ✓ FT              │    │
│  │  Barcelona  [2] ────────── [1]  Real Madrid             │    │
│  │  xG: 2.1 vs 1.4  Corners: 7-3  Cards: 2Y-1R vs 1Y-0R  │    │
│  │                              [View Stats] [Replay]      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Match Card — What to Show

**Live match card:**

- League badge, round/matchday
- Phase badge: `● LIVE 67'` / `○ HT` / `○ 45+2'`
- Score (large, centred)
- Side-by-side stats: xG, shots (total/on target), possession %, corners
- Key events timeline: goals, red cards, substitutions with minute + player name
- "Arb available?" indicator with best arb % (pulls from Arb sub-tab data)
- Actions: `View Arb` → jumps to Arb sub-tab filtered to this fixture; `Place Bet` → opens bet slip drawer

**Pre-match card:**

- Same as above but no live stats
- Best available odds (1X2) from across bookmakers
- xG model prediction (pre-match from `SFMatch.home_xg_kickoff`, `USMatch.forecast_win/draw/loss`)
- Weather: temperature + condition from `FTWeather`
- Injury list for both teams (from `Injury` table)

**Completed match card:**

- Final score, full-time badge
- Summary stats: xG, corners, cards
- Actions: `View Stats` → expands full stats; `Replay` → opens historical replay drawer (see below)

### Fixture Detail Drawer / Expanded View

Clicking "View Stats" or the fixture card itself expands a detail panel:

**Stats tab:**

- Dual-bar infographic for each stat: shots, corners, fouls, cards, possession
- Goal timing chart: minute-by-minute xG progression (from `SFMatchProgressiveStats`)
- Shots map: shot locations plotted on pitch SVG (x/y coordinates from `USMatchShot`)
- Event timeline: vertical timeline of goals, cards, subs with minute stamps
- Lineups: starting XI formation layout for both teams (from `FixtureLineup`)

**Odds History tab:**

- Line chart: 1X2 odds over time for this fixture (from `ODOdds` time_bucket series)
- Markets selector: FT Result / Over 2.5 / BTTS / AH / Corners
- Bookmaker selector: see individual bookmaker's odds movement
- **This is the historical replay** for a specific fixture — how odds changed from T-24h through kickoff through FT

**Historical Replay (Live matches in As-Of mode):**

- Time slider: 00:00 → 90:00 (every 30 seconds from `SFMatchProgressiveStats`)
- At each slider position: show stats at that moment + odds at that moment (from `SFMatchProgressiveOdds`)
- "Play" button: auto-advances the slider (replay at 5x speed)
- Shows what the arb grid would have looked like at any point during the match

---

## Sub-Tab 2: Arb

Cross-bookmaker odds scanner and live arb stream.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [League ▼] [Market ▼] [Status: Live | Upcoming]  Threshold: [2%▼]│
├──────────────────────┬──────────────────────────────────────────┤
│  ARB GRID            │  ARB STREAM                              │
│                      │  ┌────────────────────────────────────┐ │
│  Fixture        B365  │  │ ⚡ NEW ARB  +3.2%  Live           │ │
│                 Uni   │  │  Man City vs Liverpool · Over 2.5  │ │
│                 Pin   │  │  Pinnacle: 1.92 | Bet365: 2.18    │ │
│                 ...   │  │  Stake £100 → Profit £12.40       │ │
│  Arsenal vs          │  │  [Place Arb]          2s ago       │ │
│  Chelsea             │  └────────────────────────────────────┘ │
│  FT Result:          │  ┌────────────────────────────────────┐ │
│  Home   1.65 1.62 1.58│  │ ⚡ NEW ARB  +1.8%  Pre-match      │ │
│  Draw   3.40 3.50 3.55│  │  Barcelona vs Real Madrid · 1X2  │ │
│  Away   5.20 5.30 5.10│  │  Unibet: 5.30 | Marathon: 5.50  │ │
│                      │  │  [Place Arb]          18s ago     │ │
│  O/U 2.5:           │  └────────────────────────────────────┘ │
│  Over   1.85 1.88 1.92│                                        │
│  Under  1.95 2.00 1.92│  ── Decayed (cleared) ──              │
│                ⚡+3.2%│  ┌────────────────────────────────────┐ │
│  ...                 │  │ ✓ CLOSED  Arsenal vs Chelsea       │ │
└──────────────────────┴──────────────────────────────────────────┘
```

### Arb Grid (left panel)

- **Rows:** fixtures (filtered by league, status, date)
- **Columns:** subscribed bookmakers — each column = one bookmaker. Lock icon with bookmaker name for unsubscribed ones (FOMO)
- **Market selector:** FT Result (1X2) / Over 2.5 goals / BTTS / Asian Handicap / Corners O9.5 / HT Result
- **Cells:** decimal odds from that bookmaker for that market/outcome
- **Arb highlighting:** when a profitable arb exists across the row, highlight the relevant cells in green and show the arb % in the last column
- **Polymarket as a column:** for fixtures that are also on Polymarket (crossover with Predictions tab), show Polymarket as another "venue" column using canonical IDs
- **Data source:** `FTOdds` for historical/pre-match; `SFMatchProgressiveOdds` for live

### Arb Stream (right panel)

Live feed of fresh arb opportunities with decay logic:

**Display per arb:**

- Fixture + market (e.g., "Over 2.5 goals")
- The two venues and their odds
- Arb percentage (profit guarantee %)
- Suggested stakes for each side (to lock in the guaranteed profit)
- "Place Arb" button → opens bet slip drawer pre-filled for both legs
- Timestamp (relative: "2s ago", "18s ago")

**Decay logic:**

1. Arb appears in stream when it crosses the configurable threshold
2. If the same arb persists (same fixture + market + venues), do NOT re-show it
3. Once arb closes (drops below threshold), remove from active list, move to "Decayed" section
4. If the same arb re-opens later, show it again as a fresh arb
5. **Configurable threshold:** dropdown — 0.5% / 1% / 2% / 3% / custom

**Historical arb stream (As-Of mode):**

- When the Live/As-Of toggle is set to As-Of + a date/time range selected
- Show arbs that would have existed during that window
- Same decay logic applied historically
- Use case: "What arbs would I have caught on match day X with a 2% threshold?"

---

## Sub-Tab 3: My Bets

Placeholder for now — documents what we expect to build here eventually.

**Note from meeting (2026-03-25):** Orders, positions, and P&L for sports bets may be best served by the common Positions and Orders tabs (pre-filtered to sports instruments) rather than duplicating them here. Decision not yet made.

**Likely content:**

- Open bets (unresolved — event not yet played)
- Settled bets (won / lost / void)
- Running P&L for sports book
- Accumulator bets (multi-leg) with per-leg status
- Link to common Orders and Positions tabs pre-filtered to sports instruments

**Action:** Document only — implement after common tabs are reviewed.

---

## Mock Data Strategy

The existing `SportsBetSlip` mock data (6 EPL/La Liga/NBA fixtures) needs to be replaced with football-only mock data that reflects the actual backend models:

**New mock fixtures (EPL + UCL):**

```typescript
const MOCK_FIXTURES = [
  // Live match — full in-game data
  { id: "fix-001", league: "EPL", home: "Man City", away: "Liverpool",
    status: "LIVE", minute: 67, score: "1-1",
    stats: { home_xg: 1.8, away_xg: 0.9, home_shots: 8, away_shots: 4,
             home_possession: 58, away_corners: 2, home_corners: 5,
             home_yellow: 1, away_yellow: 0 },
    events: [{ minute: 45, type: "goal", team: "away", player: "Salah" },
             { minute: 67, type: "goal", team: "home", player: "Haaland", detail: "pen" }]
  },
  // Pre-match — pre-match odds + xG model + weather + injuries
  { id: "fix-002", league: "EPL", home: "Tottenham", away: "Man United",
    status: "NS", kickoff: "20:00", date: "2026-03-26",
    pre_match_xg: { home: 1.4, away: 1.1 },
    weather: { temp: 12, condition: "Light rain" },
    injuries: ["Wilson (hamstring)", "Rashford (knock)"]
  },
  // Completed — final stats
  { id: "fix-003", league: "La Liga", home: "Barcelona", away: "Real Madrid",
    status: "FT", score: "2-1", ...full stats
  },
  // UCL — upcoming
  { id: "fix-004", league: "UCL", home: "Liverpool", away: "PSG",
    status: "NS", kickoff: "20:45", date: "2026-04-02"
  }
]
```

**New mock odds (multi-bookmaker for arb grid):**

```typescript
// Structure: fixture_id → market → bookmaker → odds_value
// Mirrors FTOdds schema: ft_match_id, market_type, market_option, bookmaker, odds_value
const MOCK_ODDS = {
  "fix-001": {
    "FT Result": {
      Home: { bet365: 2.1, pinnacle: 2.08, unibet: 2.12, marathon: 2.15 },
      Draw: { bet365: 3.4, pinnacle: 3.55, unibet: 3.45, marathon: 3.4 },
      Away: { bet365: 3.5, pinnacle: 3.45, unibet: 3.4, marathon: 3.55 },
    },
    "Over/Under 2.5": {
      Over: { bet365: 1.85, pinnacle: 1.92, unibet: 1.88, marathon: 1.9 },
      Under: { bet365: 1.95, pinnacle: 1.92, unibet: 2.0, marathon: 1.95 }, // arb here
    },
  },
};
```

---

## Key Stats to Show on Match Card (Priority Order)

Based on the backend models, these are the most betting-relevant stats to surface on the match card:

| Stat                | Source                            | Why it matters for betting               |
| ------------------- | --------------------------------- | ---------------------------------------- |
| xG (home/away)      | `SFMatch.home_xg_live`, `USMatch` | Best predictor of expected goals         |
| Shots on target     | `FixtureStats`, `SFMatch`         | Pressure indicator, chance quality       |
| Possession %        | `FixtureStats`, `SFMatch`         | Game control                             |
| Corners             | `FixtureStats`, `SFMatch`         | Corners markets are heavily traded       |
| Goals (with timing) | `FixtureEvent`, `SFMatchEvent`    | Score state drives in-play odds          |
| Cards               | `FixtureStats`, `SFMatch`         | Cards markets, suspension risk           |
| Dangerous attacks   | `SFMatch.home_attacks_d`          | Better pressure proxy than total attacks |
| Dominance index     | `SFMatchDominance`                | 30-sec rolling momentum — unique         |

Stats to show in detailed view only (not on card):

- Player-level stats (shots, rating, xG per player) — from `FixturePlayerStats`, `USMatchRoster`
- Fouls, offsides, goalkeeper saves — secondary metrics
- Shot map (x/y coordinates) — from `USMatchShot`

---

## What Changes to the Existing Component

The existing `SportsBetSlip` (1,431 lines) is NOT simply extended — the page is rebuilt with the new three-tab structure. The existing component's useful parts are kept as:

| Keep                  | Becomes                                         |
| --------------------- | ----------------------------------------------- |
| `Fixture` type        | Extended with full stats fields                 |
| `OddsLine` type       | Used within per-bookmaker odds structure        |
| `ExchangeOdds` type   | Used for exchange (Betfair) columns in arb grid |
| `ArbOpportunity` type | Extended to multi-venue                         |
| Kelly criterion logic | Moved to a `useKellyCriterion` hook             |
| Bet slip UI           | Extracted to `SportsBetSlipDrawer` component    |
| Suspension detection  | Kept as part of live match status               |

**Removed:** NBA, NFL, MLB, ATP Tennis fixtures and related logic.

---

## Asset-Class Relevance

**Sports + Predictions** — Sports and Predictions are the same asset-class group. The canonical IDs and arb grid already bridge them (Polymarket as a venue column). The two tabs share fixture data.

---

## Action

**Rebuild** — restructure into three sub-tabs (Fixtures, Arb, My Bets). Retain useful types and logic from existing component. Wire to real backend when API is ready; mock with realistic football-only data in the meantime.

---

## Open Questions

- [ ] Arb threshold default: 1%? 2%? (Configurable — start with 1% as default)
- [ ] How far back does the odds history go in GCS parquet files? (ODOdds note says "data from 2020-06-17")
- [ ] Live odds WebSocket: does the backend push live `SFMatchProgressiveOdds` updates via WebSocket, or do we poll?
- [ ] Polymarket crossover: which football fixtures are also listed on Polymarket? Only specific tournaments?
- [ ] My Bets: use common Positions/Orders tabs pre-filtered, or build dedicated sports bet management here?
