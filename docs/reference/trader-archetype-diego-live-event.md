# Trader Archetype — Diego Moreno (Senior Live Event Trader, Sports + Horse Racing)

A reference profile of a top-performing live event trader at a top-5 firm — the "sports trading" desk. Used as a yardstick for what an ideal **in-play sports / horse-racing** terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).
For the prediction-market sister archetype, see [trader-archetype-aria-prediction-markets.md](trader-archetype-aria-prediction-markets.md).

---

## Who Diego Is

**Name:** Diego Moreno
**Role:** Senior Live Event Trader (Sports In-Play + Horse Racing)
**Firm:** Top-5 global trading firm with a sports/event sleeve (or a specialist sports-trading firm — Smarkets / Pinnacle-adjacent / sharp syndicate)
**Book size:** $20M – $200M turnover per match-day, with $1M – $10M peak position size on a single market
**Style:** Discretionary + semi-systematic. Microstructure-driven in-play, model-driven pre-event. Sub-second to multi-hour horizons.
**Coverage:** Football (English Premier League, La Liga, Champions League, World Cup), tennis (ATP/WTA, Grand Slams), basketball (NBA, EuroLeague), American football, cricket, horse racing (UK, Ireland, US, Hong Kong, Australia)
**Primary venues:** Betfair Exchange (deepest liquidity for in-play exchange trading), Smarkets, Matchbook, Pinnacle (sportsbook, sharp prices, no in-play depth but pre-game benchmark), regional sportsbooks for arb, Polymarket sports markets where applicable

### How he thinks differently

Diego operates in markets that are structurally simpler than equities/derivatives — every position resolves to **0 or 100** at event end — but with **information dynamics that are alien to financial trading**:

- **Settlement is event-determined.** No mark-to-market ambiguity, no close-price disputes. The match ends and your position is binary.
- **In-play is the hardest mode.** Odds move on every play, every shot, every red card. Latency to information is the edge.
- **Information edges are radically diverse:** team news, lineups, weather, referee tendencies, court speed (tennis), pitch conditions, jockey form, tactical analysis, in-running form-reading.
- **Books vs Exchanges.** Pinnacle (low margin, sharp, restricts winners) sets benchmark; Betfair Exchange has the deepest liquidity but commission. Trading the basis is a real edge.
- **Live latency is microstructure latency.** Goal scored → odds reprice in milliseconds. Whoever sees and reacts first wins.
- **Every market closes at event end.** No carry, no overnight, no roll. But pre-event positions held for days/weeks have liquidity-evaporation risk.
- **Stake is bounded by liquidity.** A $500k position in Champions League final has depth; $5k position in Lithuanian basketball does not.

### His cognitive load

Diego runs **multiple events simultaneously** during peak windows (Saturday afternoon football: 6 EPL matches at 3pm UK; Cheltenham Festival: 7 races in one afternoon). The terminal must support **parallel attention across markets** with shared infrastructure (cash, exposure, alerts).

Mode-switching is constant:

- **Pre-event:** model-driven, calmer, multi-hour horizon.
- **At kick-off / off:** transition to in-play, latency mode.
- **In-play:** sub-second reaction, hedging, scalping, momentum riding.
- **Post-event:** settle out, review, prepare for next event.

---

## Physical Setup

**6 monitors** + **video** + **audio**, with a different emphasis from any financial trader.

| Position      | Surface                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Top-left      | **Live event grid** — every active market, current prices, my positions                               |
| Top-center    | **Primary event ladder / book** — the event in foveal focus right now (Betfair-style ladder)          |
| Top-right     | **Multi-event video wall** — live feeds of running matches/races (low-latency feed)                   |
| Middle-left   | **Cross-book pricing** — same market across Betfair / Smarkets / Pinnacle / Matchbook with arb spread |
| Middle-center | **Positions, exposures, P/L per event + aggregate**                                                   |
| Middle-right  | **Order entry — back/lay ticket, hedge calculator, multi-bet builder**                                |
| Bottom-left   | **Stats & data feeds** — live xG, possession, shots, in-running tracker, sectional times for racing   |
| Bottom-right  | **News, team news, injury updates, weather, market alerts**                                           |
| Audio         | **Match commentary** (Sky / BBC / Racing TV) — often a leading information source                     |
| Tablet        | Twitter/X (team-news leaks), Telegram syndicate chat, Discord communities                             |

**Critical infrastructure note:** Diego's video feed must be **low-latency**. Standard broadcast TV is 5–60 seconds delayed — useless for in-play. Pro setups use **direct stadium feeds** (1–3 second latency) or **scout-relayed pure data** (sub-second). Latency to truth is the trader's #1 edge.

---

## Phase 1: Decide

### Pre-event research (model-driven)

For each upcoming event Diego trades:

- **Team / player form data** — historical results, head-to-head, recent matches.
- **xG (expected goals) models** — predictive performance models for football.
- **Elo / power ratings** for teams or horses.
- **Surface / venue dependence** — clay vs grass for tennis; track bias for racing; home/away splits.
- **Lineups & team news** — confirmed lineups release ~1 hour pre-kickoff; massive market mover.
- **Weather forecast** — wind, rain, temperature; affects scoring environments.
- **Referee/umpire assignment** — referee penalty rates for football; umpire strike-zone size for baseball.
- **Injury reports & insider info** — sometimes leaked on social before official release.
- **Travel / fatigue** — back-to-back games, time zones, long flights.
- **Motivational context** — already qualified, dead rubber, derby, tournament pressure.

### Horse-racing-specific research

- **Form book** — last 6 starts per horse, distance/going/class.
- **Sectional times** — pace analysis, will the race be fast or slow paced?
- **Jockey & trainer form** — recent strike rates, course-and-distance specialists.
- **Going & weather** — soft / good / firm; wet ground favors stamina.
- **Draw bias** — for flat racing, stall position affects probability.
- **Breeding / pedigree** — for big-day races, stamina indicators.
- **Market signals** — late support (money for a horse just before off), drift (price lengthening) is informative.

### Pre-event price comparison

- **Pinnacle vs Betfair** — sharps reference Pinnacle as fair price; Betfair midpoints.
- **Closing line value (CLV)** — was my entry beating the closing price? CLV is the truest measure of edge in sports.
- **Cross-book arb scanner** — when one book's price differs enough from others to lock arb (rare, fast-disappearing).
- **Liquidity preview** — depth at top 3 ticks per book; how much can I get on at this price?

### Calendar & event flow

- **Match-day schedule** — every event Diego will trade today, with kickoff times, expected liquidity profile, and importance.
- **Pre-event windows** — when team news drops, when betting markets really thicken (~1h pre-event).
- **Cluster awareness** — Saturday 3pm UK has 6 EPL matches simultaneously; Cheltenham has 7 races over an afternoon. Capacity-planning matters.
- **Major tournament context** — World Cup, Wimbledon, Cheltenham Festival, Breeders' Cup: extreme liquidity + extreme volatility.

### Models & strategy library

- **Pre-game model fair-prices** — model output per market vs current market price.
- **In-play model archetypes** — "lay-the-draw" (back home, lay draw on a goal), "trade the favorite at 0–0," "back the leading horse pre-final-furlong," "scalp tennis serve probabilities."
- **Saved bet templates** — pre-configured for common in-play scenarios.

### Sentiment & flow

- **Public bias indicators** — favored teams, popular horses; sportsbook overlay tells which side public is on.
- **Sharp money signals** — late, sustained price moves are sharps; early big bets often public.
- **Twitter / Telegram chatter** — late team news leaks, insider intel; verified sources only.

**Layout principle for Decide:** model dashboards + form study during quiet windows. Lineup-release windows are the daily attention spike. Cross-book pricing always visible.

---

## Phase 2: Enter

Sports/event entry differs from financial entry in important ways:

- **Back vs Lay** instead of buy/sell — back = bet for, lay = bet against. On exchanges, you can do either side.
- **Stake** = how much you're risking; **payout** = stake × decimal odds.
- **Liability** for a lay = (odds – 1) × stake — what you lose if the outcome happens.
- **Commission** — exchanges take 2–5% of net winnings, not per trade.
- **Latency arbitrage prevention** — exchanges may impose **bet delays** (1–8 seconds in-play) to protect liquidity providers.

### Order entry ticket

- **Back or Lay** toggle (or split-button).
- **Stake / liability** input — UI shows the other automatically.
- **Odds input** in selected format (decimal, fractional, American, probability %).
- **Pre-trade preview:**
  - Liability if losing.
  - Profit if winning (after commission).
  - Position impact on this event.
  - Aggregate exposure across events.
  - Cash impact.
- **Persistence flag** — Keep / Take SP / Cancel — what to do at off (for racing) or in-play moments.
- **Time-in-force** — until cancelled, until off, immediate-or-cancel.

### Ladder ticket (Betfair-style)

The defining UI for in-play exchange trading:

- **Vertical price ladder** — odds in fixed ticks, with bid/ask depth at each level.
- **Click-to-back** at offer / **Click-to-lay** at bid.
- **One-click pre-fill stake** from saved presets (£100, £500, £2k, etc.).
- **Hotkeys** — H1/H2/H3 stakes; "back at offer," "lay at bid," "cancel level," "cancel all."
- **Order book display** — my orders shown inline at their price levels.
- **Recent trades tape** — every match, with size, side inferred.
- **Volume traded at price** — total matched volume per level (Betfair-native).
- **WOM (weight of money)** — bid stack vs offer stack, real-time.

### Hedge / green-up calculator

The single most-used post-entry tool. After a position moves, **green up** = take a counter-position to lock in profit equally across all outcomes.

- **Auto-calc green-up amount** at current bid/ask.
- **Show post-hedge P/L per outcome** before submitting.
- **One-click execute** the hedging order.
- **Partial green-up** — lock 50%, let 50% run.
- **Asymmetric hedge** — keep more on the favored outcome.

### Multi-bet / accumulator builder

For pre-event longer-horizon plays:

- **Single bet, multiple bet, accumulator (parlay), system bet.**
- **Combined odds calculation.**
- **Max payout warning** (some books cap).

### In-play scratch / scalp templates

- **"Tick-scalp"** — back at 2.10, lay at 2.08 = locked tick profit if both fill.
- **"Lay the draw"** — back home pre-game, lay draw at lower odds after a goal.
- **"Tennis serve scalp"** — server's price drifts during return game, snaps back on serve hold.
- **Saved as one-click templates** with auto-stake.

### Cross-book / arb ticket

- **Detect arb opportunity** — same outcome priced differently across books.
- **Calculate stakes per book** to lock guaranteed profit regardless of outcome.
- **Sequenced execution** — fastest leg first to lock the price.
- **Bookie-account-aware** — many sportsbooks limit / ban arb-takers; the system tracks account health.

### Pre-trade compliance / account state

- **Account balances per book.**
- **Per-book limits** — some sportsbooks ration winning customers; UI shows current effective stake limit.
- **Geo-restrictions** — venue accessible from current jurisdiction?
- **Bet-delay awareness** — for in-play, the delay can mean a stale price by the time you're matched.

### Hotkeys

- **One-touch back/lay** at top of book.
- **Cancel all on event.**
- **Green-up to flat.**
- **Lock 50% / lock 100%.**
- **Emergency lay-off** — close at market, eat the spread.
- **Switch ladder to next event** in queue.

**Layout principle for Enter:** the ladder is central. Hedge calculator is one click. Saved templates for scalp / scratch / lay-the-draw are hotkey-bound. Cross-book arb is a separate workflow because it involves multiple accounts.

---

## Phase 3: Hold / Manage — running events live

Diego's "Hold" mode is **mid-event trading**, often across multiple events simultaneously. This is where his terminal differs most from any financial-market trader.

### Multi-event dashboard

The single most-watched view. A row per active event:

- **Event** (with score, time elapsed, key situation: corner, red card, set point).
- **My current position** per market (match odds, over/under, correct score, etc.).
- **Current odds** vs my entry.
- **Unrealized P/L per outcome** — if home wins / draw / away wins.
- **Liability per outcome.**
- **Liquidity remaining** — depth at top of book.
- **Alert badges** — goal scored, red card, injury, market suspension.
- **Suspension status** — exchange suspended (during goals/disputes); orders frozen.

Click any row → ladder + video for that event.

### Live event view (foveal)

- **Ladder** with live depth.
- **Live video feed** (low-latency).
- **Live stats** — possession, shots, xG live, expected outcomes.
- **In-play model output** — "model fair price for over 2.5: 1.45; market: 1.65 → buy."
- **Position summary** — my P/L per outcome, liability, hedge to flat.

### Per-event greeks-equivalents

Sports doesn't have greeks but has equivalents:

- **Position delta** — sensitivity to outcome probability (analog of equity delta).
- **Time-decay equivalent** — as the match progresses without a goal, the over-2.5 line decays toward "no" probability mathematically. UI surfaces this.
- **Implied probability per outcome** from current odds.

### Live PnL — sports-decomposed

- **Realized today** — closed positions.
- **Unrealized per event** — broken into per-outcome.
- **Per-event hedged P/L** if I greened up now.
- **By sport / league / strategy.**

### Risk panel

- **Aggregate liability** if all current positions resolve worst-case.
- **Per-event liability vs limit.**
- **Per-sport, per-strategy concentration.**
- **Cash / margin impact** across exchanges.
- **Stress scenarios** — "what if all my away teams win" / "what if all my favorites lose."
- **Drawdown today** vs daily-loss limit.

### News & info feeds (event-attached)

- **Team news / injury news** filtered to active events.
- **Weather updates** for outdoor events.
- **Referee statements / VAR decisions.**
- **Twitter/X verified sources** filtered.

### Latency / connectivity panel

Critical for in-play:

- **Round-trip latency to each exchange** in ms.
- **Video feed latency** vs benchmark.
- **Bet-delay window** for current event.
- **Connection health** — feed lag, dropped messages.
- **Account / API rate-limit headroom.**

### Alerts

- **Goal / score alerts** — sound + visual + auto-pause if pre-configured.
- **Red card / penalty / VAR review.**
- **Market suspension / resumption.**
- **Liquidity collapse** — top-of-book depth dropping.
- **Cross-book arb opportunity** appearing.
- **Stat threshold alerts** — possession >70%, xG > opponent, shots >15.
- **Team news late drop** — lineup changes.
- **Position alerts** — P/L thresholds.
- **Risk limit alerts.**

### Trade journal

- Per event: pre-game thesis, key in-play decisions and rationale.
- Reviewed post-event.

### Communications

- **Syndicate chat / Telegram** — sharp groups share signals.
- **Inhouse desk chat.**
- **Verified-source social media** filtered to active events.

### Heatmap / sport view

- Active markets grouped by sport, sized by exposure, colored by P/L.

### Kill switches

- **Flatten event** — green-up to zero P/L exposure.
- **Cancel all working orders on event.**
- **Pause new entries on event.**
- **Aggregate flatten** — green-up across all events.
- **Account-level lock** — stop new orders to a specific exchange.

**Layout principle for Hold:** multi-event dashboard + foveal live event view. Video and audio are continuously consumed. Latency / suspension / liquidity always visible.

---

## Phase 4: Learn

Sports post-trade emphasizes **closing line value (CLV)**, **strategy/template performance**, **per-sport skill**.

### Trade history

- Every bet: event, market, side (back/lay), stake, odds, matched odds, fill venue, fill time, settlement, P/L.
- Tagged by strategy / template (lay-the-draw, scalp, model bet, in-play momentum, etc.).
- Linked to live-state context at decision (score, time elapsed, statistics).

### CLV (closing line value) attribution

The truest sports edge metric:

- **My entry odds vs closing odds** — if I consistently beat the closing line, I have edge. P/L can be noise; CLV is the signal.
- **CLV by sport, league, market, strategy.**
- **CLV trend over time.**
- Single most important post-trade metric.

### PnL attribution

- **By sport** (football vs tennis vs racing vs basketball).
- **By league / tournament.**
- **By market type** (match odds, over/under, correct score, handicap, in-play).
- **By strategy / template.**
- **By time window** (pre-event vs in-play; sport-specific phases).
- **Pre-event vs in-play** — different skill, different markets.

### Performance metrics

- **ROI per stake** — total profit / total turnover.
- **Yield by sport / league / strategy.**
- **Hit rate** for binary bets.
- **Sharpe of daily P/L.**
- **Max drawdown.**
- **Bankroll growth curve.**

### Strategy / template analytics

- For each saved template (lay-the-draw, etc.):
  - Sample size.
  - Win rate.
  - Avg win / avg loss.
  - ROI.
  - Conditions where it works (home favorite vs away dog; high-scoring leagues vs low-scoring; specific minute windows).
- Drives template refinement and retirement.

### In-play decision review

- **Replay** — pick an event, see ladder + video + my orders + my P/L over time, scrub through.
- Identify decision points: did I scratch too early? Hold too long?
- Compare what I did vs what model said optimal would be.

### Model performance

- **Pre-game model fair-prices vs realized closing prices** — calibration.
- **In-play model output vs realized outcomes.**
- **Model drift alerts** — feature distribution changes.

### Bookmaker / exchange analytics

- **CLV by venue.**
- **Account health** per book — stake limits, restrictions imposed, ban risk.
- **Commission paid YTD** by exchange.
- **Liquidity availability** by event/sport — am I getting matched at the price I want?

### Behavioral analytics

- **Tilt indicators** — increased stake size after losses; chasing.
- **Strategy drift** — am I deviating from template into discretion?
- **Time-of-day fatigue** — late-night decisions worse than morning?
- **Sport bleed** — do I lose more in sports I love than ones I don't follow?

### Reports

- Daily P/L commentary (sport-tagged).
- Weekly portfolio review.
- Monthly attribution by sport / strategy / venue / CLV.
- Account-management reports — book-by-book health.

**Layout principle for Learn:** CLV dashboard is foveal. Replay tool with video + ladder + orders is the highest-value review surface. Sport / strategy / template slicing.

---

## What Ties Diego's Terminal Together

1. **Markets are binary outcomes that resolve at event end.** No mark-to-market noise; settlement is deterministic.
2. **Live event mode is microstructure trading.** Latency, ladder, depth, hedging — like a market-maker terminal applied to events.
3. **Video and audio are first-class data feeds.** Low-latency stadium feed beats broadcast TV; commentary often leads market moves.
4. **The ladder is the central UI.** Back/lay at price levels, hotkey execution, depth visible.
5. **Hedge / green-up is one click.** The most-used post-entry action.
6. **Multi-event parallelism is mandatory.** Saturday afternoons run 6+ events simultaneously.
7. **Cross-book pricing surfaces arb and benchmark.** Pinnacle is the truth-teller; Betfair is the liquidity.
8. **CLV (closing line value) is the truest edge metric.** P/L can be noise; CLV is signal.
9. **Suspension / latency / connection state is always visible.** Markets pause during goals; latency to truth is the edge.
10. **Strategy templates are first-class.** Lay-the-draw, tennis serve scalp, racing pre-final-furlong — saved, hotkey-bound, performance-tracked.

---

## How to Use This Document

When evaluating any sports / live-event trading terminal (including our own), walk through Diego's four phases and ask:

- Is the ladder a foveal trading surface, with hotkey back/lay at price levels?
- Is hedge / green-up a one-click post-entry action?
- Is multi-event parallel attention supported (grid of active events)?
- Are video and audio feeds integrated at low latency?
- Are cross-book prices (Pinnacle / Betfair / Smarkets) surfaced for arb and benchmark?
- Is CLV measured and reported as the primary edge metric?
- Is suspension / latency / liquidity state always visible?
- Are strategy templates saved, hotkey-bound, and performance-tracked?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.
