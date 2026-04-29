# Trader Archetype — Diego Moreno (Senior Live Event Trader, Sports + Horse Racing)

A reference profile of a top-performing live event trader at a top-5 firm — the "sports trading" desk. Used as a yardstick for what an ideal **in-play sports / horse-racing** terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For shared surfaces every archetype uses, see [common-tools.md](common-tools.md).
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

Inputs per upcoming event: team / player form, xG and Elo models, surface dependence (clay vs grass; track bias; home/away splits), lineups & team news (confirmed ~1h pre-kickoff, the day's biggest market-mover), weather forecast, referee / umpire assignment (penalty rates, strike-zone size), injury reports and insider leaks, travel and fatigue, motivational context (already qualified, dead rubber, derby, tournament pressure).

### Horse-racing form-book (UNIQUE)

A dedicated form-book surface per race-card — pre-race form study is its own discipline:

- **Last 6 starts per horse** — finishing position, distance, going, class, beaten lengths, in-running comments.
- **Sectional times** — pace analysis (fast vs slow paced); front-runners vs hold-up horses sized accordingly.
- **Jockey & trainer form** — recent strike rates, course-and-distance specialists, jockey-trainer combinations.
- **Going & draw bias** — soft / good / firm; stall position for flat racing (e.g. Chester low-numbers).
- **Breeding** — sire's average winning distance for stamina indicators on big-day races.
- **Market signals** — late support (steamers) vs drift, cross-checked against tipster/syndicate flow.

### Cross-book pricing & Pinnacle benchmark (UNIQUE)

The single most-glanced research surface alongside the form-book:

- **Same market across Betfair / Smarkets / Pinnacle / Matchbook** with spread in odds and implied probability points.
- **Pinnacle as fair-price benchmark** — Pinnacle accepts sharp action and doesn't restrict winners; entries are evaluated against Pinnacle at entry and at close (CLV).
- **Liquidity per venue** — depth at top 3 ticks per book.
- **Cross-book arb scanner** — flagged when spread > cost; filtered by account-health (skip venues where Diego is restricted).

### Models & strategy templates (UNIQUE)

- **Pre-game model fair-prices** — model output per market vs current market price; edge in probability points.
- **In-play strategy templates** — saved, hotkey-bound, performance-tracked: lay-the-draw, trade-favourite-at-0-0, back-leader-pre-final-furlong, tennis-serve-scalp, tick-scalp. Per-template hit-rate, ROI, and conditioning details live in Phase 4 analytics.

### Calendar & event flow

See [#12 Catalyst Calendar](common-tools.md#12-catalyst--event-calendar). **Diego-specific characteristics:**

- Match-day schedule with kickoff / off times, expected liquidity profile, importance.
- **Lineup-release windows** marked — confirmed lineups (~1h pre-kickoff) are the daily attention spike for football.
- **Cluster awareness** — Saturday 3pm UK has 6 EPL matches simultaneously; Cheltenham 7 races over an afternoon. Capacity-planning matters: which events foveal vs which on the multi-event grid.
- **Major tournament context** — World Cup, Wimbledon, Cheltenham Festival, Breeders' Cup: extreme liquidity + extreme volatility, distinct preset layouts.

### News & sentiment

See [#13 News & Research](common-tools.md#13-news--research-feed). **Diego-specific feeds:** team-news drop monitors, verified-source social (Fabrizio Romano-class for football, Racing Post for racing), Telegram syndicate chat with private signals, public-bias indicators (favored teams, popular horses), sharp-money signals (late sustained moves vs early big bets).

**Layout principle for Decide:** model dashboards + form-book during quiet windows. Lineup-release windows are the daily attention spike. Cross-book pricing always visible.

---

## Phase 2: Enter

Sports/event entry differs from financial entry: **back vs lay** instead of buy/sell (on exchanges either side); **stake** = risked, **liability** for a lay = (odds – 1) × stake; exchanges take **2–5% commission** on net winnings, not per trade; in-play exchanges impose a **bet-delay** (1–8s) to protect liquidity providers.

### Order entry ticket — back/lay native (UNIQUE)

The order ticket is mode-aware: a back/lay binary is the primary axis, not buy/sell.

- **Back or Lay** toggle (or split-button).
- **Stake / liability** input — UI shows the other automatically (lay-side liability = (odds – 1) × stake).
- **Odds input** in selected format (decimal, fractional, American, probability %).
- **Pre-trade preview:**
  - Liability if losing.
  - Profit if winning (after commission).
  - Position impact on this event.
  - Aggregate exposure across events.
  - Cash impact.
  - **Bet-delay window** for the venue/market (in-play exchanges typically 1–8s; pre-event 0s).
- **Persistence flag** — Keep / Take SP / Cancel — what to do at off (for racing) or in-play moments.
- **Time-in-force** — until cancelled, until off, immediate-or-cancel.

### Betfair-style ladder (UNIQUE — the defining UI)

The central in-play exchange-trading surface; the ladder is foveal, everything else supports it.

- **Vertical price ladder** — odds in fixed Betfair ticks (finer at short prices, coarser at long), bid/ask depth at each level.
- **Click-to-back** at offer / **click-to-lay** at bid; one-click at the ladder's current stake preset.
- **Stake presets** F1–F4 (£100 / £500 / £2k / £10k typical).
- **My orders shown inline** as coloured chips on the ladder; drag to modify, click to cancel.
- **Recent trades tape** with size, side inferred from ladder context.
- **Volume traded at price** — total matched volume per level (Betfair-native; shows where liquidity has clustered).
- **WOM (weight of money)** — bid-stack vs offer-stack imbalance, one of the strongest short-horizon in-play signals.
- **Multi-ladder layout** — parallel ladders for correlated selections (tennis server vs receiver, horse-by-horse on a race).

### Hedge / green-up calculator (UNIQUE — the most-used post-entry tool)

**Green up** = take a counter-position to lock P/L equally across all outcomes. One click from any open position.

- **Auto-calc green-up amount** at current bid/ask; **post-hedge P/L per outcome** previewed before submit.
- **One-click execute** at the auto-calc amount.
- **Partial green-up** — lock 50% (or any %), let the rest run.
- **Asymmetric hedge** — lock loss-side fully, keep upside on the favoured outcome.

### Multi-bet / accumulator builder

Single, multiple, accumulator (parlay), system bet; combined-odds calc; max-payout warning where books cap.

### In-play strategy templates (UNIQUE)

Saved, hotkey-bound, one-click entries with auto-stake, market-state preconditions, and post-fill green-up rules:

- **Tick-scalp** — back at 2.10, lay at 2.08 (locked tick profit if both fill).
- **Lay-the-draw** — back home pre-game, lay draw at lower odds after a goal.
- **Tennis serve scalp** — server's price drifts during return game, snaps back on serve hold.
- **Pre-final-furlong** — lay leader on the turn, back closer.

Each template's CLV and ROI are tracked (see Phase 4) — templates demote out of the hotkey rotation when CLV decays.

### Cross-book / arb ticket (UNIQUE)

Same outcome priced differently across Betfair / Smarkets / Pinnacle / Matchbook locks guaranteed profit.

- Stakes-per-book auto-calculated (Dutching) to flat regardless of outcome.
- **Sequenced execution** — fastest leg first; leg-out risk warned.
- **Bookie-account-aware** — downsizes the leg to within current stake-factor, or skips banned venues entirely (see Account-Health below).

### Bookmaker account-health tracker (UNIQUE — sports-specific)

Sportsbooks (Pinnacle aside) systematically restrict winning customers — "stake factoring." A banned account is dead capital regardless of edge, so account health is a first-class operational metric.

- **Per-book stake limit** — the actual size each book will accept on a typical market, with declining trend visible.
- **Restriction history** — every limit cut logged with date, market, suspected trigger (size, edge, frequency).
- **Ban-risk score** — derived from limit-cut velocity and time since last unrestricted bet.
- **Effective book-of-books per market** — which books will actually take Diego's intended size; dictates execution feasibility before edge.
- **Concentration warning** — capital concentrated at a book about to ban is operational risk.

### Bet-delay awareness (UNIQUE — sports-specific)

Exchanges impose a 1–8 second delay on in-play bet acceptance to protect liquidity providers — turning sub-second price moves into stale-quote risk.

- **Delay window** surfaced on the ladder header and ticket preview (e.g. "Betfair in-play delay: 5s").
- **Stale-quote badge** — when match probability is moving fast (ball in box, set point), the ladder flashes a "delay-active" warning; back-at-offer in this state is high-variance.
- **Delay-aware order types** where supported ("match only if price still ≥ X"); client-side cancel-on-stale otherwise.
- **Suspension is distinct from delay** — during a goal / red card / VAR review the market is suspended (no fills); during normal play only the bet-delay applies. Both states surface explicitly.

### Pre-trade compliance / account state

See [#3 Pre-Trade Preview](common-tools.md#3-pre-trade-risk-preview) and [#28 Compliance](common-tools.md#28-compliance--audit-trail). **Diego-specific checks:** account balance per book, per-book effective stake limit (from the account-health tracker), geo-jurisdiction accessibility, in-play bet-delay window for the focused market.

### Hotkeys

See [#6 Hotkey System](common-tools.md#6-hotkey-system). **Diego-specific bindings:** one-touch back/lay at top of book per ladder, cancel all on event, green-up to flat, lock 50% / lock 100%, emergency lay-off (close at market, eat the spread), switch ladder to next event in queue, F1–F4 stake-preset cycle, strategy-template hotkeys (lay-the-draw, tick-scalp, serve-scalp).

**Layout principle for Enter:** the ladder is central. Hedge calculator is one click. Saved templates for scalp / scratch / lay-the-draw are hotkey-bound. Cross-book arb is a separate workflow because it involves multiple accounts.

---

## Phase 3: Hold / Manage — running events live

Diego's "Hold" mode is **mid-event trading**, often across multiple events simultaneously. This is where his terminal differs most from any financial-market trader.

### Multi-event grid (UNIQUE — the master view)

A row per active event with score, time elapsed, key situation (corner, red card, set point, furlongs remaining), my position, current odds vs entry, unrealized P/L and liability per outcome, top-of-book liquidity, alert badges, suspension status, bet-delay window. Click any row → ladder + video for that event becomes foveal.

### Live event view (foveal, UNIQUE)

When an event is in foveal focus: ladder with live depth, low-latency video, live stats (possession / shots / xG for football; break points / serve % for tennis; sectional times / race-position for racing), in-play model output ("over 2.5 fair 1.45, market 1.65 → buy"), position summary with hedge-to-flat one-click.

### Sports-equivalent greeks (UNIQUE)

Rendered explicitly per event:

- **Position delta** — P/L sensitivity to outcome probability.
- **Implicit time-decay** — over-2.5 lines mathematically decay toward "no" as scoreless time elapses; UI surfaces this.
- **Implied probability per outcome** from current odds (commission stripped).
- **In-play model fair-prob** evolving as the match unfolds.

### Live PnL

See [#9 Live PnL](common-tools.md#9-live-pnl-panel). **Diego-specific decomposition:** realized today (closed / settled / greened-up), unrealized per event broken to per-outcome scenario P/L, per-event hedged-P/L (what if I greened up now), sliced by sport / league / strategy template.

### Risk panel

See [#10 Risk](common-tools.md#10-risk-panel-multi-axis) and [#11 Stress](common-tools.md#11-stress--scenario-panel). **Diego-specific axes:** aggregate worst-case liability, per-event liability vs limit, per-sport / per-strategy concentration, cash held per book / exchange, bookmaker concentration (escalated when concentrated at a book at ban risk), stress scenarios ("all favourites lose," "Cheltenham card SPs 20% off market"), drawdown today vs daily-loss limit.

### News & info feeds (event-attached)

See [#13 News](common-tools.md#13-news--research-feed). **Diego-specific filters:** team news / injury news filtered to active events, weather updates for outdoor events, referee statements / VAR decisions, verified-source social filtered to active markets.

### Latency / connectivity panel

See [#18 Latency / Infra](common-tools.md#18-latency--connectivity--infra-panel). **Diego-specific dimensions:** round-trip ms to each exchange (Betfair / Smarkets / Matchbook), video-feed latency vs benchmark (stadium vs scout-relay vs broadcast), **bet-delay window** for the current event as structural latency separate from network latency, feed-health (lag, dropped messages, sequence gaps), per-book API rate-limit headroom.

### Alerts

See [#14 Alerts](common-tools.md#14-alerts-engine). **Diego-specific categories:** goal / score alerts (sound + visual + configurable auto-pause), red card / penalty / VAR review, market suspension / resumption, liquidity collapse (top-of-book depth dropping), cross-book arb opportunity, stat-threshold (possession, xG vs opponent, shots), late team-news drop (lineup change after the 1h release), position P/L thresholds, **bookmaker restriction alert** (limit cut imposed mid-session).

### Trade journal

See [#15 Trade Journal](common-tools.md#15-trade-journal). **Diego-specific:** per-event entry with pre-game thesis, key in-play decisions and rationale, scrubable to event timeline. Reviewed post-event in Phase 4.

### Communications

See [#17 Communications](common-tools.md#17-communications-panel). **Diego-specific channels:** syndicate Telegram (sharp groups share signals), inhouse desk chat, verified-source social filtered to active events, Racing Post / Sporting Life for racing, on-track scout chat for big-meeting days.

### Heatmap / sport view

See [#16 Heatmap](common-tools.md#16-heatmap-of-own-book). **Diego-specific:** active markets grouped by sport, sized by exposure (or liability), colored by P/L; useful for end-of-half scan across many events.

### Kill switches

See [#19 Kill Switches](common-tools.md#19-kill-switches-granular). **Diego-specific levels:** flatten-event (green-up to zero on one event), cancel-all on event, pause-new-entries on event, aggregate flatten (green-up across all events), account-level lock (stop new orders to a specific exchange when a book is restricting or feed unreliable).

**Layout principle for Hold:** multi-event grid + foveal live event view. Video and audio are continuously consumed. Latency / suspension / liquidity always visible.

---

## Phase 4: Learn

Sports post-trade emphasizes **CLV (closing line value)**, **strategy/template performance**, and **per-sport / per-book skill**.

### Trade history

See [#21 Trade History](common-tools.md#21-trade-history--blotter-historical). **Diego-specific fields:** event, market, side (back/lay), stake, odds at entry, matched odds, fill venue, fill time, settlement outcome, P/L, commission paid, strategy-template tag (lay-the-draw, scalp, model-bet, in-play momentum). Linked to live-state context at decision (score, time elapsed, statistics).

### CLV (closing line value) tracker (UNIQUE — the truest sports edge metric)

In sports, **P/L is noise; CLV is signal**. CLV measures whether Diego's entry beat the closing price (Pinnacle's close as benchmark).

- **Per-bet CLV** — entry odds vs Pinnacle close in probability points.
- **Aggregate CLV** sliced by sport, league, market, strategy template, time horizon (pre-event vs in-play), book.
- **CLV trend** — rolling 30 / 90 / 365-day; the truest leading indicator of long-run profitability.
- **CLV vs realized P/L divergence** flagged (noise, mis-tagging, or edge decay).
- **CLV-weighted sizing** — CLV-positive areas grow, CLV-negative areas cut.

### PnL attribution

See [#22 PnL Attribution](common-tools.md#22-pnl-attribution-multi-axis). **Diego-specific axes:** sport (football / tennis / racing / basketball), league / tournament, market type (match odds, over/under, correct score, handicap, in-play), strategy template, time window (pre-event vs in-play; sport-specific phases — half-by-half football, set-by-set tennis), book / exchange (cross-checked against account-health).

### Performance metrics

See [#23 Performance Metrics](common-tools.md#23-performance-metrics). **Diego-specific metrics:**

- **ROI per stake** — total profit / total turnover (the standard sports yield metric).
- **Yield by sport / league / strategy.**
- **Hit rate** for binary bets (with CLV-adjusted expected hit rate as benchmark).
- **Sharpe of daily P/L.**
- **Max drawdown.**
- **Bankroll growth curve** (see [#24 Equity Curve](common-tools.md#24-equity-curve)).

### Strategy / template analytics (UNIQUE)

Per saved template (lay-the-draw, tennis-serve-scalp, pre-final-furlong, tick-scalp):

- Sample size, win rate, avg win/loss, ROI, CLV.
- **Conditioning** — home-favourite vs away-dog, high- vs low-scoring leagues, minute windows, soft vs firm going. Templates that work in EPL fail in League Two.
- **Drift** — is the edge decaying as markets sharpen? When CLV turns negative for 90+ days, the template is demoted out of hotkey rotation.

### Replay tool (UNIQUE — synchronized video + ladder + orders + P/L)

See [#20 Replay](common-tools.md#20-replay-tool). **Diego-specific extension** — sports replay is genuinely unique because the source-of-truth is video, not just price data:

- **Synchronized timeline** — DVR'd video feed, ladder with depth at every tick, my orders (entered / modified / cancelled), match stats, realized P/L curve, suspension intervals.
- **Scrub bar** with chapter markers — kickoff, first-goal, half-time, key incidents, my entry/exit points.
- **Decision-point review** — pause at each entry; see ladder, stats, model output. "Did I scratch too early? Hold too long?"
- **Counterfactual P/L** — what if I'd held instead of greened up at minute 65? Computed from realized outcome + ladder history.
- Requires tick-level ladder store, DVR'd video, execution history aligned to event-clock.

### Model performance

Calibration curves on pre-game fair-prices vs realized closing prices and in-play minute-by-minute output vs realized outcomes; model-drift alerts on feature-distribution shifts (new league, rule change, scoring-rate trend).

### Bookmaker / exchange analytics

Phase 4 view on the account-health tracker: CLV by venue, stake-limit and restriction history per book, ban-risk evolution, commission paid YTD by exchange, fill-quality (am I being matched at the price I want or pushed up the ladder?).

### Behavioral analytics

See [#26 Behavioral](common-tools.md#26-behavioral-analytics). **Diego-specific patterns:** tilt indicators (stake-size up after losses, late-card chasing), strategy drift (template → discretion, with CLV-sign of the discretion tracked), time-of-day fatigue, sport-bleed (do I lose more in sports I follow?), in-play-vs-pre-event mode mismatch (taking pre-event-style positions during in-play).

### Reports

See [#27 Reports](common-tools.md#27-reports). **Diego-specific:** daily P/L commentary (sport-tagged), weekly portfolio review, monthly attribution by sport / strategy / venue / CLV, account-management reports (book-by-book health, restriction movements), syndicate/desk distribution if applicable.

**Layout principle for Learn:** CLV dashboard is foveal. Replay tool with video + ladder + orders is the highest-value review surface. Sport / strategy / template slicing.

---

## What Ties Diego's Terminal Together

1. **Markets are binary outcomes that resolve at event end.** No mark-to-market noise; settlement is deterministic.
2. **Live event mode is microstructure trading.** Latency, ladder, depth, hedging — like a market-maker terminal applied to events.
3. **Video and audio are first-class data feeds.** Low-latency stadium feed beats broadcast TV; commentary often leads market moves.
4. **The ladder is the central UI.** Back/lay at price levels, hotkey execution, depth visible.
5. **Hedge / green-up is one click.** The most-used post-entry action.
6. **Multi-event parallelism is mandatory.** Saturday afternoons run 6+ events simultaneously; the grid + foveal-event pattern scales attention.
7. **Cross-book pricing surfaces arb and benchmark.** Pinnacle is the truth-teller; Betfair is the liquidity.
8. **CLV (closing line value) is the truest edge metric.** P/L can be noise; CLV is signal.
9. **Bookmaker account health is operational risk.** A banned account is dead capital; the tracker is first-class.
10. **Bet-delay and suspension are explicit states.** Stale-quote and frozen-market are different and must not be conflated.
11. **Strategy templates are first-class.** Saved, hotkey-bound, performance-tracked, retired when CLV decays.
12. **Replay synchronizes video + ladder + orders + P/L.** Sports review without video is incomplete.

---

## How to Use This Document

When evaluating any sports / live-event trading terminal (including our own), walk through Diego's four phases and ask:

- Is the ladder a foveal trading surface, with hotkey back/lay at price levels and inline orders?
- Is hedge / green-up a one-click post-entry action with per-outcome P/L preview?
- Is multi-event parallel attention supported (grid of active events with one-click foveal switch)?
- Are video and audio feeds integrated at low latency (stadium-feed or scout-relay, not broadcast)?
- Are cross-book prices (Pinnacle / Betfair / Smarkets / Matchbook) surfaced for arb and benchmark?
- Is CLV measured and reported as the primary edge metric?
- Is suspension / bet-delay / liquidity state always visible and distinct?
- Is bookmaker account-health tracked per book (limits, restrictions, ban-risk)?
- Are strategy templates saved, hotkey-bound, and CLV-tracked?
- Is the replay tool video-synchronized to ladder, orders, stats, and P/L?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.

---

# Automated Mode

This appendix extends Diego's manual archetype into the automated-trading world. The manual sections above describe Diego at his terminal — six monitors, ladders, video, hotkeys, syndicate chat. This appendix describes what happens when Diego's edge is encoded into a fleet of strategies that run on his behalf, what new surfaces he interacts with, and — explicitly — what stays Diego.

The structural template is in [automation-archetype-template.md](automation-archetype-template.md). The worked example for depth and voice is Marcus's appendix in [trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md) — but Marcus is crypto-CeFi; none of his content is repeated here. The shared automated-trading concepts (data layer, feature library, research workspace, model registry, experiment tracker, strategy composition, promotion gates, capital allocation, supervisor console, intervention console, post-trade decay) are described once in [automation-foundation.md](automation-foundation.md). The shared platform surfaces every archetype carries are in [common-tools.md](common-tools.md). This appendix expands what is **Diego-specific**.

Diego is a **partially-automatable** archetype — pre-event modelling, in-play stat-driven scalps, lay-the-draw detection, racing form models, and cross-book arb scanners are all encodable. **In-play match-feel**, **late team-news interpretation**, **race-day going calls**, and **video-feed reading** stay human. The appendix targets ~1000 lines and is written to that mix.

---

## 1. What Diego's Edge Becomes

In manual mode Diego trades roughly 30–80 markets across 6–10 events per match-day, with peak attention narrowed to one foveal event at a time. In automated mode Diego's edge is decomposed into **strategy classes** — each class an encoded pattern that runs on every event in its scope, in parallel, with Diego in the supervisor seat.

> Strategy classes below are **illustrative** of the shape; the actual platform's catalog will differ by season, venue access, and model maturity.

- **Pre-event xG-derived market-edge.** Class consumes pre-match xG and Elo distributions, lineup-confirmed strengths, weather, referee tendencies, and travel/fatigue features. It outputs a fair-probability per market (1X2, over/under 2.5, AH 0, BTTS, correct-score, first-half markets) and enters when market price is ≥ N probability points away from the fair, sized by edge × Kelly-fraction × liquidity. Roughly 1 instance per league × per market-type; ~120 instances live across the EPL, La Liga, Champions League, Serie A, Bundesliga, Ligue 1, MLS, Liga MX, and the second tiers Diego can model. Manual coverage was 30 EPL games per week and a handful of others; automated coverage spans every fixture the data layer supports.

- **In-play stat-driven scalp.** Class subscribes to event-tape stats (xG-per-minute, dangerous-attacks, shots-on-target, possession-zone) and a fitted in-play model. When realized stats run hotter or colder than the market-implied path by a configured threshold, it scalps with hard tick-targets and stop-on-trend-break. One instance per market-type per league — over/under 2.5, BTTS, next-team-to-score, Asian-handicap. ~80 instances. Manual scalp templates (the F-key bound ones in Phase 2) become the seed; the class generalises them.

- **Lay-the-draw detector.** Class watches every match where pre-match draw odds, league scoring rate, lineup attacking-strength, and minute-zero in-running model agree on a positive lay-the-draw expected value. Enters back-home (or back-away) pre-match, lays draw at the configured trigger after the first goal, sized by liquidity. Single class with ~30 candidate matches per match-day; fires on the subset that clears its joint precondition.

- **Racing form-derived fair-price.** Class consumes form-book features (last-6 finishing positions, distance, going, class, sectional times, jockey-trainer combos, draw bias, breeding, market-signal flow) per runner and outputs a fair-win-probability per horse on each card. Enters where the exchange price is wide of fair beyond a noise threshold, with race-time ladder hooks for staggered entry vs taking SP. ~7 races per UK card × ~12 runners × ~5 main markets (win, place, top-finish, match-bets, AH) — Diego covers UK, Ireland, US, Hong Kong, Australia. Class handles the fixture volume manual mode could never touch.

- **Cross-book / cross-exchange arb scanner.** Class continuously prices every active market across Betfair, Smarkets, Matchbook, and Pinnacle (and selected regional sportsbooks where account-health permits), surfaces same-outcome spreads ≥ commission + slippage budget, sequences legs fastest-first, and respects per-book stake-factoring. Distinct from a manual arb workflow because the class watches **every market always**; manual mode caught a fraction of the opportunities. ~1 instance, scanning thousands of markets per match-day.

- **Late-money / steamer-following mover.** Class watches pre-event price drift across the cross-book panel, identifies sharp-money moves (sustained one-direction-flow that beats Pinnacle's move) and either follows on the exchange or refuses to enter against the move on a previously planned bet. Risk-management overlay rather than a standalone alpha — but quantified.

- **Tennis serve / break-point microstructure.** Class trades the rhythmic lay-server-during-return-game, back-server-on-hold pattern, conditioned on tournament, surface, server quality, and break-point urgency. ~6 instances per ATP/WTA tournament week.

- **Football minute-band trade.** Class trades systematic minute-band biases — late-goal premium in over/under markets, half-time-leader-carry-through patterns, last-15-minute desperation-attack patterns — tuned per league. Templates that worked manually but were too tedious to execute across 10 simultaneous matches.

- **Pre-final-furlong leader-fade.** Racing class that lays the in-running leader on the home-turn when sectional pace and historical hold-up-vs-front-runner data suggest collapse risk; backs the closer or favourite-of-the-pack. Diego's hand-traded template, generalised.

- **Cheltenham / Royal-Ascot / Breeders'-Cup specialist class.** Tournament-specific class with hand-tuned pre-race priors and tighter capacity caps, gated to wake up only during the festival window. Distinct from the everyday-racing class because liquidity is 5–20× normal but volatility is also extreme.

- **Liquidity-evaporation hedger.** Class tracks pre-event positions held for days/weeks and auto-hedges when top-of-book depth drops below a configured floor. Risk-management class only — never opens initial exposure.

- **Resolution-window / settlement watcher.** Class watches markets in the final minutes of an event for settlement-risk signals (delayed VAR, late penalty, abandoned-match risk), and pulls quotes / pre-emptively hedges where the platform's tolerance for settlement ambiguity is exceeded. Risk-only.

- **Stat-vs-market gap mean-reversion.** Class watches markets that have over- or under-reacted to a transient stats event (a single big chance, a temporary numerical advantage from a yellow-card-pending VAR) and fades the move once the stats path normalises. Distinct from the in-play scalp because the trigger is a market overreaction, not a model edge.

- **Account-health-aware order router.** Class is not an alpha generator — it sits between every other class and the venues, distributing stake across books and exchanges to maximise fill while respecting per-book stake-factor caps and ban-risk concentration limits. Its existence is what lets the alpha classes ignore venue politics.

A typical match-Saturday fleet at steady state: ~10 strategy classes × 200–600 instances = ~3500 active strategies running concurrently across the 80–120 fixtures Diego's data layer covers. The cognitive shift is profound. Manual Diego made roughly 200–400 trade decisions per match-day (each a hand-bound scalp, hedge, or pre-event entry); automated Diego makes roughly 10–30 supervisory decisions per match-day (which classes are running, which are paused, which markets are temporarily out-of-scope, which manual overrides must run during a specific event), while the fleet generates 5,000–20,000 fills per match-day. Trades-per-decision drops by orders of magnitude; decisions-per-class rises.

---

## 2. What Stays Diego

Encoding xG models and ladder microstructure does not encode the live-event judgment surfaces Diego built over a decade. The platform is opinionated about what to automate and humble about what cannot be — yet.

- **In-play match-feel.** Diego watches a football match and reads things the stats feed cannot reach for several minutes — that the home side has lost shape after a substitution, that the away keeper looks shaken from an early collision, that the referee is conditioning the game towards yellow cards. The model sees the same xG path that the market does; Diego sees the cause. He intervenes — pause classes on the match, hand-trade a directional position, override the lay-the-draw template for this one game — when the read is strong enough to justify it.

- **Late team-news interpretation.** Lineups confirm ~1h pre-kickoff. The bare fact "Player X is out" is data, but the **interpretation** — does the replacement change the press intensity? does this cluster of absentees reveal a tactical reshape? — is judgment. Diego reads team news through tactical familiarity the platform does not have. He pre-positions or kills classes on this match before the model fully reprices.

- **Race-day going calls.** The official going stick reads a number, but trainers at the track talk about whether the ground rides true, whether the back-straight is faster than the home-straight today, whether the sun has dried the inside rail. Diego either has a scout on-track, a syndicate channel feeding him reads, or a learned ear for stable-jockey body language in the parade ring. None of this enters the form-book features the racing-form class consumes. Diego applies a per-card going-overlay before he allows the racing class to size up on a meeting.

- **Video-feed reading.** The platform consumes event tape (passes, shots, fouls) and stats feeds. It does not consume video. Diego watches a low-latency stadium feed and sees a player limping, a defender holding a hamstring after a sprint, a goalkeeper spilling routine catches — minutes before the stats feed reflects the consequences. Diego pauses or trades on this read.

- **Refereeing-context interpretation.** The model has prior probabilities for referee tendencies (penalty rate, card rate). It does not read whether _this_ referee is having a bad day, whether the home crowd has unsettled him, whether the fourth official has just contradicted his last call. Diego does, and adjusts.

- **Major-event narrative trading.** World Cup quarter-final, Cheltenham Gold Cup, Wimbledon final — extreme liquidity, extreme variance, narrative-driven flow. The classes run, but Diego sits foveal on the event and overrides freely. The platform's role during these events is execution, not autonomy.

- **Suspended-market judgment.** When the market suspends — VAR review, possible red card, controversial penalty — the class withdraws from the market and waits. Diego's job is to read the video feed and the wires, decide what the resumption price _should_ be, and either pre-stage a manual order at the desired re-entry tick or instruct classes to stand down on the market for the rest of the event. The platform does not interpret VAR.

- **Counterparty / book-political reads.** Pinnacle is sharp; some regional books are square. Diego knows which books are quietly tightening, which are about to ban a syndicate, which are reverting to a soft-line policy. This intelligence informs how aggressively the account-health-aware router can lean on a venue in the next 30 days.

- **Syndicate signal interpretation.** Diego's Telegram syndicate sometimes drops a signal he has to weigh — is this their conviction or their information? Is the originator a sharp or a tout? Trust is reputational and human.

- **Class sanctioning and de-sanctioning.** The decision to take a strategy class live for a new tournament, to pause an entire class for a season, to retire a template that has decayed — Diego owns these. The platform prepares the evidence; the decision is his.

- **Manual override of the racing-form class on big-day cards.** On a Cheltenham Festival or Royal Ascot day, Diego may run reduced class size and trade more by hand, because the read-through-the-day is too rich to defer to a class that doesn't see the parade ring or the going-stick chatter.

The platform commits to automating what is encodable and to staying out of Diego's way on what is not. The judgment list above is _not_ a roadmap to automate later; several items will stay human as long as the firm operates.

---

## 3. The Data Layer for Diego

Diego's automated cousin is fed by a data layer that is **event-domain-specific**: every match's full event tape, in-running stats feeds, weather, referee assignments, lineup-confirmation timestamps, racing form data, sectional times, video archive, cross-book odds streams. The shape of the data layer surfaces is described in [automation-foundation.md](automation-foundation.md); Diego's specific catalog and idiosyncrasies follow.

### 3.1 The Data Catalog Browser

Layout: left sidebar with sport / league-tournament / data-type / vendor / venue / quality-tier filters; main panel as a sortable list of dataset rows (name, sport, vendor, time-coverage, latency, quality score, last-validated, owner); right pane on row-click with schema, sample rows, lineage graph, dependent features, dependent strategies, freshness telemetry. The structure mirrors the foundation doc; Diego's filter taxonomy adds **sport** (football / tennis / racing / basketball / NFL / cricket / baseball), **competition tier** (top-flight / second-tier / lower / amateur), **in-play vs pre-event**, **video / non-video**, **stadium-feed / scout-relay / broadcast**, **on-track / off-track** for racing, and **regional jurisdiction** (some books are not accessible from all regions).

### 3.2 Diego's Core Datasets (Illustrative)

> Names are illustrative of the _shape_ of the catalog — the actual platform's contracts and vendor list will differ.

- **Football event tape (live + archive)** — every event in a match (kickoff, pass, shot, foul, card, substitution, set-piece, goal, half-time, full-time, VAR review) with timestamps, coordinates, players, and outcomes. Multiple vendors (Opta-class, StatsPerform-class, Sportradar-class) cross-referenced for quality and latency.
- **Football in-running stats feed** — minute-by-minute possession, dangerous attacks, shots on target, xG-per-minute, expected-threat (xT), pressing-intensity, average position lines.
- **Tennis point-by-point feed** — every point with serve/return outcome, serve speed, rally length, error type, break-point flag, set/match score state.
- **Basketball play-by-play** — every possession with shot type, location, outcome, foul state, time remaining.
- **NFL play-by-play** — down-and-distance, formation, play call, yards gained, penalty state, time-of-possession.
- **Cricket ball-by-ball** — every delivery with runs, dismissal, bowler/batter state, run-rate, required-rate.
- **Lineup confirmation timestamps** — the moment a confirmed XI is published per match, with player metadata. Timestamps to the second matter — entries before vs after lineup-release are different regimes.
- **Team injury / availability database** — current squad health per club, with reporter-source-quality scoring (verified national-team beat reporters > tabloid > social-media leak).
- **Weather feed** — real-time and forecast wind / temperature / precipitation / humidity per stadium, with hourly resolution out 7 days.
- **Referee / umpire assignments and tendencies** — per match, with historical card-rate, penalty-rate, home-bias, VAR-call rate, foul-call distribution.
- **Tournament / fixture calendar** — every fixture with kickoff time, importance flags (derby, dead-rubber, cup-final), last-update timestamp.
- **Racing form database** — last-N starts per horse with finishing position, distance, class, going, beaten lengths, sectional times, in-running comments, equipment, jockey, trainer.
- **Racing sectional times** — split times per furlong / per pole, used for pace-shape analysis.
- **Racing card metadata** — runners, declared scratchings, draw, weight, age, trainer-jockey combo, owner, breeding (sire / dam / sire-of-dam).
- **Racing market-flow feed** — pre-race late-money moves and steamers, cross-book.
- **Going / track-condition feed** — official going stick and TPD-class on-track measurements.
- **Cross-book odds stream** — same market priced across Betfair, Smarkets, Matchbook, Pinnacle, and selected regional sportsbooks; tick-level.
- **Exchange depth archive** — historical bid / offer ladder per market per second, for backtest realism.
- **Match video archive** — DVR'd low-latency feeds (where the rights and infrastructure permit), used in replay and class-decision retrospective.
- **Referee statement / VAR-decision log** — official-sources record of contested decisions per match.
- **News / wire feed** — verified-source social filtered to football / racing beat reporters; Racing Post / Sporting Life racing news; tournament-specific feeds.
- **Tipster / syndicate signal archive** — the chat-history corpus from Diego's syndicate channels, structured for back-test (with strict reputational weighting; this dataset is read-only).
- **Stadium / track metadata** — capacity, surface, altitude, pitch dimensions, track configuration, climate.
- **Player-level performance database** — career stats, per-surface splits, head-to-head, fitness flags.
- **Historical settlement database** — every event Diego's domain covers with the official outcome and any post-event amendment (race objections, void games, abandoned matches), with timestamps.

### 3.3 Data Quality Monitoring

Mostly archetype-agnostic — the catalog browser surfaces freshness, latency-vs-SLA, schema-shift detection, missing-symbol detection, vendor-disagreement detection per dataset. Diego-specific rows worth highlighting:

- **Event-tape latency per match** — vendors disagree by hundreds of milliseconds; the dashboard shows real-time latency-vs-fastest-vendor per match, and the platform routes the in-play classes to the fastest healthy feed.
- **Stats-feed gap detection** — a 20-second silence on the stats feed during a contested attack is a probable feed health issue; the dashboard surfaces gaps within the active match clock so Diego sees them as they happen.
- **Lineup-feed fan-out** — confirmed-XI publication does not always reach all vendors simultaneously; the dashboard tracks fan-out latency and Diego can see _which_ vendor confirmed first this match-day.
- **Going-feed cross-check** — official going vs on-track measurement vs trainer chatter; divergences are flagged for human read.
- **Cross-book odds-feed stale-quote detection** — if Pinnacle stops moving while Betfair runs on a goal, one of the two is stale; the cross-book spread detector treats the stale quote as a do-not-arb-against signal.
- **Video-feed health** — per-match stadium-feed connectivity, latency-vs-broadcast benchmark, frame-drop count. Manual override from video assumes the feed is alive.

### 3.4 Lineage Navigator

Archetype-agnostic surface — feature-built-from, model-trained-on, strategy-using-feature graphs. Diego's lineage queries are mostly: _which strategy classes depend on this vendor's event tape? if I switch to a backup feed for the next 30 minutes, what classes are affected?_

### 3.5 Procurement Dashboard

Archetype-agnostic shape; archetype-specific in _which_ feeds are renewal-sensitive. Diego's renewal-sensitive feeds: low-latency event tape (the first-tier vendors are expensive and dominant; switching is disruptive), scout-relay video (rights are negotiated per-tournament and per-territory), Racing Post premium content, on-track measurement feeds. The dashboard tracks renewal date, cost, alternative providers, and class-impact-if-cancelled per feed.

### 3.6 Gap Analysis Surface

Gaps are catalog deficiencies that block strategy classes from going live. Diego's representative gaps:

- **Tier-2 European football coverage** — the in-running stats feed has Premier League, top-5 leagues, Champions League, Europa League. Polish Ekstraklasa, Belgian Pro League, Greek Super League are spotty. The pre-event xG class can run; the in-play stat-driven scalp cannot.
- **Lower-grade racing** — sectional times and reliable in-running comments don't exist for every meeting; the racing form class is restricted to UK / Ireland / US / HK / AUS premier and feature meetings.
- **Asian football night-window tape latency** — vendor latency is meaningfully worse during the Asian session for top European derby competitions hosted as Asian-tournament friendlies.
- **Cricket short-format reliability** — T20 and the Hundred have rich data; first-class cricket is patchier.
- **NFL pre-snap formation tagging** — needed for advanced live-state classes; available only from the premium vendor tier and only after a 30-day delay.

The gap surface lets Diego file a procurement request with the impacted-class list attached, to be triaged in the next data-procurement window.

### 3.7 Interactions Diego has with the data layer

- **Pre-match-day (T-2 to T-1):** review feed-health for the upcoming match-day. Confirm that the matches the classes will run on have green feeds. Note any vendor-down events likely to bleed into match-day.
- **Match-day pre-window (~90 minutes before kickoff):** lineup-confirmation latency monitor is foveal; this is the daily attention spike. Diego watches for late team-news that the in-running stats feed has not yet absorbed.
- **In-play:** data layer is in periphery — any feed-health alert that touches the foveal event lands on the alert rail; cross-book odds-stream stale-quote warnings light up the cross-book panel.
- **Post-match-day:** review event-tape vs settlement reconciliation per match. Anomalies (a class entered on a stats reading the official feed later corrected) feed the decay-tracking surface.
- **Weekly:** the gap-analysis review and the procurement review.
- **Monthly:** a dataset-quality scorecard per vendor, used for renewal negotiations.

### 3.8 Why this matters

Sports markets repriced milliseconds after a goal pay the trader who saw the goal first. The data layer, treated as the source of truth, is a direct edge multiplier: a 200ms latency advantage on the event tape is worth more than most pre-event model improvements, because the in-play scalp class fires on whichever feed sees the stat first. Conversely, a single dirty fixture (mistagged kickoff time, mismatched player IDs, misclassified shot type) can poison hundreds of class instances; Diego trades better when the data layer surfaces these in seconds, not after the fact. The catalog, lineage, and quality dashboards turn the platform's feed engineering into supervisable infrastructure — Diego doesn't write code into vendor SDKs; he reads the dashboards and files actions.

---

## 4. The Feature Library for Diego

The data layer is raw; the feature library is the engineered representations every class consumes. The library shape is described in [automation-foundation.md](automation-foundation.md); Diego's features and idiosyncrasies follow.

### 4.1 The Feature Library Browser

Layout: left sidebar with domain / sport / event-class / horizon / freshness filters; main panel as a sortable list of features (name, owner, description, refresh cadence, used-by, drift status); right pane on row-click with computation logic, dependencies, sample distributions per league or per surface, dependent strategies, drift trace. Same shape as the foundation doc.

### 4.2 Diego's Core Features (Illustrative)

> Names are illustrative of the _shape_ of the library — actual feature catalog will differ.

**Pre-event football features:**

- **xG-derived-fair-prob** per market — model output transformed into market-quoted fair probability across 1X2, over/under, BTTS, AH, correct-score, first-half markets.
- **Lineup-strength delta** — the per-match strength difference vs Diego's pre-confirmed XI prior, decomposed into attack / defence / midfield / press-intensity.
- **Set-piece edge** — corners and free-kicks per match per side, from set-piece-specialist priors.
- **Referee bias** — penalty-rate-z, card-rate-z, home-bias-z per official, per league, with fixture-specific adjustments.
- **Travel / fatigue index** — kilometres in last N days, days since last match, time-zone shift since last match, per side.
- **Motivational context** — already-qualified / dead-rubber / derby / cup-tie / relegation-pressure scoring.
- **Surface / weather adjuster** — pitch hardness from recent rainfall, wind-strength corner-trajectory adjuster, temperature-stamina adjuster.
- **Closing-line drift estimate** — predicted move from current price to closing line, conditioned on liquidity profile and time to off.

**In-play football features:**

- **In-running fair-prob trajectory** — minute-by-minute model output per market, conditioned on live state.
- **xG-per-minute deltas** — realized xG flow vs expected-by-minute, per side.
- **Possession-zone heat** — share of possession in the attacking third per minute window.
- **Press-intensity** — distance-covered-in-opposition-half per minute window.
- **Big-chance counter** — big chances created per side, from the event-tape.
- **Set-piece-pending state** — corner won, free-kick in dangerous area; transient feature with sub-30s window.
- **Card-pending state** — yellow / red imminent based on foul-frequency and referee mood.
- **VAR-pending state** — a probable review in flight; transient feature flag.
- **Substitution-impact estimator** — short-window impact per made substitution.

**Tennis features:**

- **Serve-quality-z per set** — serve speed and percentage vs surface and tournament baseline.
- **Break-point conversion** per side, rolling.
- **Rally-length distribution shift** — court-speed proxy.
- **Set-momentum** — rolling break / hold balance over the last N games.
- **Tiebreak-imminent state** — flag.

**Racing features (UNIQUE — racing has its own feature family):**

- **Form-rating** — strength derivative of last-6 finishing positions, beaten lengths, class, distance.
- **Sectional-pace-bias** — the race's expected pace shape (front-running / hold-up).
- **Going-fitness** — per horse, per going-tier (heavy / soft / good / firm) historic strike rate.
- **Course-and-distance specialist** — boolean from past-form against the exact course-and-distance.
- **Jockey-trainer combo strike rate.**
- **Draw-bias** — for flat racing, stall-position-vs-course-history adjustment.
- **Stamina indicator** — sire's average winning distance for staying-race priors.
- **Late-money / steamer** — flagged from market-flow feed.
- **In-running-position model fair-prob** — given current race position and sectional times, fair win-probability for the leader, the closer, the ridden-out front-runner.

**Cross-book / microstructure features (apply to all sports):**

- **Cross-book spread to Pinnacle** — every market priced as bps-to-Pinnacle-fair, with directional sign.
- **Implied-probability fair-line** — Pinnacle close-shifted to a no-vig fair, used for CLV calculation.
- **Top-of-book depth per side per book** — per-second snapshot.
- **WOM (weight-of-money)** — bid-stack-vs-offer-stack imbalance on Betfair ladder.
- **Volume-traded-at-price** — total matched volume per Betfair tick, normalised by recent average.
- **Stale-quote flag** — when one book hasn't moved while another has, the suspected-stale book is flagged.
- **Bet-delay window** — current per-market bet-delay seconds, surfaced as a feature so size-decision rules can condition on it.
- **Suspension-state** — boolean, with reason-code (goal / red-card / VAR / system / unknown).
- **Liquidity-evaporation rate** — top-of-book depth-decay over the last N minutes.

**Account-health features:**

- **Per-book stake limit** — current effective limit per market type, per book.
- **Limit-cut velocity** — frequency-and-magnitude of limit cuts in the last 30 / 90 days.
- **Ban-risk score** — composite from limit-cut velocity, time-since-unrestricted, total-stake-this-week.
- **Account-balance-per-book** — cash position per venue, with low-balance flagging.

**Behavioural / regime features:**

- **Public-bias indicator** — favoured-team / popular-horse skew on the moneyline, rolling.
- **Sharp-money signal** — late, sustained, one-direction flow that beats Pinnacle's move.
- **Tournament-week regime** — World Cup / Wimbledon / Cheltenham / Breeders' Cup / Royal Ascot active-flag.

The feature library has roughly 250–600 distinct features across sport / horizon / class. Each feature carries owner, refresh cadence, dependent classes, and a drift trace.

### 4.3 Feature Engineering Surface

Same shape as the foundation doc — a notebook-attached form for new feature definition (name, dependencies, computation, refresh cadence, expected distribution, owning team), with backfill on submit and automatic registration in the catalog. Diego's contributions tend to be racing-specific (a new sectional-pace bias for a particular course) or tournament-specific (a Cheltenham-festival-day fitness weighting). Football and tennis features are more often contributed by the broader research team and reviewed by Diego.

### 4.4 The Drift Dashboard

Per-feature drift trace; per-class feature-impact view. Sports drift hotspots Diego watches:

- **Refereeing-rule changes** — VAR protocol updates, handball-rule revisions invalidate referee-bias features overnight.
- **Format changes** — schedule expansion (Champions League re-format, World Cup expansion), competition format changes that perturb motivational-context priors.
- **Surface changes** — Wimbledon grass-treatment changes, Australian Open court-speed adjustments, AW track replacements.
- **League sharpness drift** — a previously soft-line league turning sharp as more syndicates enter.

When a feature trips the drift threshold, the dashboard surfaces dependent classes and routes a triage to Diego.

### 4.5 Cross-Pollination View

Sport-cross-pollination is real but bounded. Tennis serve-microstructure features have no equivalent in football. But cross-book microstructure features (WOM, depth, stale-quote, bet-delay) generalise across all sports' exchange markets. Diego's view of "which other desks' features would I borrow" is dominated by Aria's prediction-markets desk — both work on event-resolved binary markets, both consume liquidity-and-depth features, both deal with cross-venue arb.

### 4.6 Interactions Diego has with the feature library

- **Daily:** scan the drift dashboard for any feature whose distribution has shifted enough to trigger triage. Most days are uneventful; the noticing matters when it hits.
- **Weekly:** review the feature-impact panel for the strategy classes that have been newly promoted, to confirm the dependence shape is what was modelled.
- **Ad-hoc:** propose new features (a per-stadium wind-corner-trajectory feature; a Cheltenham-festival-day fitness weighting), prototype in the workspace, register through the engineering surface.

### 4.7 Why this matters

Sports edge decays fast as markets sharpen; the feature library is where decay shows up first. Diego watching the drift dashboard and the feature-impact view is what keeps the fleet honest — a feature that has stopped predicting kills its dependent classes' edges silently if no one is looking. The library also makes the fleet _teachable_: a new tournament's class is composed from existing features in days, not invented from scratch. This is the lever that takes Diego from 6 EPL games per week to ~120 fixtures per week without a proportional increase in research time.

---

## 5. The Research Workspace

The research workspace is where Diego — and the broader sports-research team — designs, prototypes, backtests, and walk-forward-validates new strategy classes and feature ideas. Shape described in [automation-foundation.md](automation-foundation.md); Diego-specific notes follow.

### 5.1 Notebook Environment

Notebook server attached to the data layer (event tape, stats feeds, racing form, cross-book odds archive, exchange depth archive, video archive metadata) and the feature library; cells run against the same compute pool as backtests. Typical Diego notebook flows:

- Pull two seasons of EPL event tape and the in-running model output, score the in-play stat-driven scalp class on a held-out slice, compare CLV vs realised P/L by minute-band.
- Pull every Cheltenham Festival card from the past five years, recompute the racing-form class with a candidate sectional-pace feature, walk-forward-validate the form-rating-vs-sectional weighting.
- Pull a season of cross-book pre-event price tracks, fit a closing-line-drift model conditioned on liquidity profile, evaluate vs realised Pinnacle close.
- Sample a thousand goal events, time-align video frames with event-tape entries to evaluate stat-feed-vs-video latency by vendor.
- Pull a quarter of restricted-account history, build a ban-risk classifier and evaluate against ground truth.

### 5.2 Backtest Engine UI

Sports backtesting is realism-sensitive in ways unique to the domain. The engine UI lets Diego configure:

- **Bet-delay model** — per-venue, per-market-type, with stochastic actuator slippage (the 1–8s in-play delay is a primary realism axis).
- **Suspension model** — per-event-class historical suspension distributions (frequency, duration, post-resumption price-jump), so the backtest does not pretend a fill happened during a suspended interval.
- **Commission model** — per-venue commission rate, applied to net winnings on exchanges; per-book vig adjustment for sportsbook benchmarks.
- **Stake-factor model** — per-book historical stake-factor distribution, so the backtest's fills are constrained by the same caps the live system would face.
- **Liquidity-realism replay** — historical exchange-depth ladder replayed tick-by-tick, so the backtest fills against actual offers rather than mid.
- **Cross-book fan-out latency** — leg-out risk for arb classes is modelled with realistic per-book leg latency.
- **Settlement-ambiguity injection** — random void / abandoned / adjusted-result events drawn from the historical settlement database; the class's settlement-watcher behaviour is part of the backtest.
- **Account-health gating** — backtest can be run with a configured account-health profile (which books will accept which size at which moment) to evaluate execution feasibility.
- **Video-blackout option** — for in-play classes that depend on Diego's manual-override on video reads, the backtest can either assume no override (pure class P/L) or replay Diego's historical override pattern.

The output is a per-class P/L curve, a CLV trace, a cumulative-stake curve, an account-balance-per-book trace, and a fill-quality histogram. Multiple configurations comparable side-by-side.

### 5.3 Walk-Forward Visualization

Per-class walk-forward results visualised as: per-window P/L, per-window CLV, per-window hit-rate, per-window fill-quality, with held-out periods clearly demarcated. A "decay envelope" shows whether class edge is steady, rising, or fading across the walk-forward windows. Sports walk-forward is typically tournament- or season-windowed (one season trains, the next out-of-sample) rather than calendar-day windowed.

### 5.4 Strategy Template Library

Diego's strategy templates correspond to the strategy classes in section 1 — each is a parameterisable, backtestable, walk-forward-validatable scaffold. Examples:

- **Pre-event-fair-price-edge template** — generic scaffold parameterised by sport, league, market type, model, edge threshold, sizing rule, time-to-off entry profile.
- **In-play stat-driven scalp template** — sport / market-type / trigger-stat / threshold / tick-target / stop-on-trend-break.
- **Lay-the-draw template** — league filter, draw-odds threshold, scoring-rate threshold, lineup-strength gate, post-goal-trigger lay logic.
- **Racing-form-fair-price template** — meeting class filter, going filter, distance bucket, market type, edge threshold, sizing-vs-liquidity rule.
- **Cross-book arb template** — venues, leg-sequencing, commission-and-slippage budget, stake-factor gating.
- **Tennis-serve-microstructure template** — tournament filter, surface filter, server-quality filter, break-point urgency rule.
- **Pre-final-furlong leader-fade template** — going filter, race-class, sectional-pace condition, leader-vs-closer logic.
- **Steamer-following / counter-trend template** — pre-event drift detection, follow-or-fade rule.
- **Stat-vs-market-gap mean-reversion template** — overreaction window, fade trigger, stop-on-confirmation logic.
- **Settlement-watcher template** — risk-only; window-from-resolution, hedge logic.

Templates are versioned. Cloning a template opens a parameterised class definition the researcher fills in for the specific case.

### 5.5 Compute Management

Same as the foundation doc — a compute dashboard shows running jobs (notebook kernels, backtests, walk-forwards, training runs), queued jobs, idle pool capacity, GPU vs CPU split, and per-job cost. Diego's heavier jobs are large cross-book replay backtests over multi-season ladder archives.

### 5.6 Anti-Patterns the Workspace Prevents

- **No live-data-leak in backtests** — the backtest engine treats lineup-confirmation timestamps as point-in-time facts; pre-confirmation lineups are not visible to the class for that match.
- **No CLV-without-Pinnacle-baseline** — CLV calculation is gated on the Pinnacle-close availability for that market.
- **No assumed liquidity** — the engine fills against historical depth; orders that would have moved the book reflect the move.
- **No survivorship bias** — meetings and matches that were abandoned, postponed, or had adjusted settlements are present in the backtest universe.
- **No silent stake-factor cheating** — the engine respects per-book caps from the account-health database in force at the historical date.

### 5.7 Interactions Diego has with the workspace

- **Pre-season:** big set-piece research effort. New tournament priors, refresh of feature distributions on the previous season's data, walk-forward of any class where the underlying league has changed format.
- **Quiet-day (Monday / Tuesday non-fixture):** the high-density research day. New feature prototyping, backtest of tournament-specific parameter sets (Cheltenham, Royal Ascot, Wimbledon), retraining queue.
- **Match-day:** workspace is largely closed; Diego is on the live console. Notebook is open only for ad-hoc reads.
- **Post-event:** quick replay-driven retrospective in the workspace, especially after an unexpected result or a class drawdown.

### 5.8 Why this matters

The classes are only as good as the realism of the research that produced them. Sports backtesting has historically been littered with traps — overlooked bet-delay, fictitious liquidity, stake-factor optimism, lineup-leakage. The workspace's job is to make those traps loud, so that Diego's research time produces classes that survive contact with the live ladder. The walk-forward and strategy-template-library together compress months of trial-and-error into a deliberate iteration loop.

---

## 6. The Model Registry

Versioned catalog of every trained model — pre-event xG-derived model, in-running fair-prob model, racing form-rating model, ban-risk classifier, closing-line drift estimator, stat-vs-market-gap reverter — with reproducibility guarantees.

### 6.1 The Model Registry Browser

Layout: model name, sport / domain, version, owner, training-data fingerprint, training-feature fingerprint, hyperparameters, metric scores (CLV, log-loss, Brier, ROI on held-out, calibration), drift status, dependent strategies, deploy state, last-trained, last-promoted. Filterable by sport, owner, deploy-state, drift status.

### 6.2 The Model Record Page

Per-model: training run lineage, feature dependencies (linked to feature library), data-snapshot fingerprint, evaluation curves on held-out (calibration plot, CLV histogram, Brier-score-vs-baseline), per-league or per-tournament breakdown, drift trace, dependent strategy classes with their last-N-day edge against the model.

### 6.3 Versioning & Immutability

Every model has a content-addressable version. A class's deployed model version is pinned; promotion is an explicit lifecycle event (section 9). Re-running yesterday's class with yesterday's pinned model and yesterday's pinned feature snapshot reproduces yesterday's signals exactly.

### 6.4 Drift Surface for Models

Per-model drift trace: input-feature-distribution shift, output-distribution shift vs the deployment-time baseline, calibration drift, CLV-realised vs CLV-expected, by sport / league / tournament. Sports calibration shifts in clusters — a new VAR protocol shifts referee-mediated probabilities across an entire league overnight; a tournament expansion shifts motivation priors. The dashboard surfaces these.

### 6.5 Lineage Graph

Model → training-data → features → backtest results → promoted version → deployed strategies. Click any node, see the dependents. Useful when a feature is retired (which models retrain?) or a model is retrained (which classes are affected?).

### 6.6 Why this matters

Sports models compound — one year's xG model trains the next year's strength priors which feed the next year's fair-price class. Versioning is what keeps the chain reproducible. Reproducibility is what makes a class drawdown investigable rather than mysterious.

---

## 7. The Experiment Tracker

Log of every backtest, every walk-forward, every training run, searchable, comparable, reproducible.

### 7.1 The Experiment Browser

Filterable by author, date, sport, class, model, parameter set; sortable by CLV, ROI, hit-rate, drawdown. Each row links to a full record.

### 7.2 Per-Experiment Record

Inputs (data snapshot, feature snapshot, model snapshot, parameter set, backtest configuration), outputs (P/L curve, CLV trace, fill-quality histogram, account-health-trace, equity curve), notes, tags, lineage forward (was this experiment's output promoted?).

### 7.3 Run Comparison Views

Side-by-side comparison of N experiments — same class, different parameter sets; same parameter set, different feature sets; same feature set, different bet-delay models. CLV-vs-ROI scatter, equity-curve overlay, conditioning analysis. Diego's most-used comparison: "the same in-play scalp class, with and without the new pressing-intensity feature, on the same season."

### 7.4 Anti-Patterns Prevented

No silent re-runs that overwrite an experiment record; no parameter changes after results are recorded; every run is a new record. Cherry-picking is discouraged because the registry holds the population, not just the winner.

### 7.5 Interactions Diego has with the experiment tracker

- **Weekly:** scan recent experiments by the research team, comment on results.
- **Ad-hoc:** during a class drawdown, open the lineage forward from the deployed-version's promotion experiment to see what was claimed at the time.
- **Pre-promotion:** every promotion-gate review opens the candidate's experiment record as supporting evidence (section 9).

### 7.6 Why this matters

Sports research is high-volume and high-noise; the experiment tracker forces discipline. A class that was promoted because of a fluky fold is detectable in retrospect when the experiment record makes the population visible. The tracker is the platform's institutional memory.

---

## 8. Strategy Composition

A strategy class is a composition of model output + sizing rule + entry/exit logic + hedging + risk gating + regime conditioning + execution policy + lifecycle metadata. Shape described in [automation-foundation.md](automation-foundation.md); Diego-specific composition notes follow.

### 8.1 The Strategy Composition Surface

A form-driven editor with sections:

- **Identity** — class name, sport, league filter, market-type filter, version.
- **Signal** — model version, edge-threshold rule, conditioning gates (lineup-confirmed, going-acceptable, account-health-acceptable).
- **Sizing** — per-unit stake or Kelly-fraction × edge × liquidity-cap; per-event cap; per-cluster cap (e.g. all 6 EPL 3pm games together); per-market-type cap.
- **Entry policy** — when to enter (time-to-off windows, post-event triggers, on-suspension-resume), how to enter (passive on the ladder, sweeping, staggered), how aggressively to chase the price.
- **Exit policy** — green-up trigger, tick-target, stop-on-trend-break, time-stop, settle-at-event-end.
- **Hedging** — auto-green-up rules (full / partial / asymmetric), liability-cap-driven hedges.
- **Risk gating** — bet-delay caps (don't enter if delay > N seconds), suspension behaviour (pause / cancel / hold-position), liquidity-floor (don't enter if top-of-book depth < threshold), account-health gating (downsize or skip per book).
- **Regime conditioning** — tournament-active flag, surface filter, weather filter, derby-flag, dead-rubber-flag, public-bias-z filter.
- **Execution policy** — venue priority, order routing rules, leg-sequencing for arb classes.
- **Lifecycle** — current state (research / paper / pilot / live / monitor / retired).
- **Coordination** — class dependencies, mutex flags (only one of these classes may run per event), shared-capital pools.

### 8.2 Pre-Deployment Validation

Before a class can reach pilot, the composition surface enforces:

- Signal output is within model's calibration range.
- Sizing rule respects per-market-type caps and per-cluster caps.
- Bet-delay and liquidity-floor gates exist (a class with no liquidity-floor on in-play markets is rejected).
- Settlement-ambiguity behaviour is defined.
- Account-health gating is configured.
- Backtest CLV is positive over the configured walk-forward windows.

### 8.3 Strategy Versioning

Same content-addressable versioning as models. Composition changes spawn a new version; live class can be canary-deployed alongside the incumbent for an evaluation window before the cutover.

### 8.4 Diego's Strategy Templates (Illustrative)

Section 1 lists the class catalog; the composition surface holds the template scaffolds in section 5.4. Each scaffold is a partially-bound composition that the researcher fills out for a specific case.

### 8.5 Why this matters

A class that does not respect bet-delay, suspension state, or account-health gating is a P/L bomb in waiting. The composition surface is the contract that says: every class on this platform has these gates, configured on purpose, reviewable in one place. The composition surface is also where Diego's sizing principles (per-event caps, per-cluster caps for Saturday-3pm, tournament-specific multipliers) become enforced rather than aspirational.

---

## 9. Promotion Gates & Lifecycle

Every strategy class moves through Research → Paper → Pilot → Live → Monitor → Retired. Diego is the sign-off owner; the platform supplies evidence at every gate.

### 9.1 The Lifecycle Pipeline View

A board with a column per state and a card per class. Click a card to see history (entry to each state, with timestamps, evidence, sign-off). At any moment Diego can see how many classes are in pilot, how many are live, how many are in monitor (degraded), how many are queued for retirement.

### 9.2 The Gate UI per Transition

- **Research → Paper:** backtest CLV positive over walk-forward; no anti-pattern flags from section 5.6; sizing and risk gating populated; lineage clean. Sign-off: research lead.
- **Paper → Pilot:** N days of paper-trading with positive CLV; no execution anomalies; account-health profile validated. Sign-off: Diego.
- **Pilot → Live:** N additional days at pilot size; CLV remains positive in production; fill-quality matches backtest expectations; no surprise drawdowns. Sign-off: Diego, with David sign-off for size or risk-class above firm threshold.
- **Live → Monitor:** automatic on drift trigger (CLV-realised vs CLV-expected falls below threshold for N days, or feature-distribution drift exceeds threshold). Class size reduced; investigation triaged.
- **Monitor → Live:** drift resolved or model retrained; CLV recovered; sign-off Diego.
- **Monitor → Retired:** drift not resolvable, or class supplanted; class taken offline. Sign-off Diego, archived in registry. The retire decision is irreversible without a fresh promotion cycle.

Sport-specific gate notes:

- **Tournament-specific classes** (Cheltenham, Royal Ascot, Wimbledon) wake up only inside their festival window. The lifecycle treats these as "live during window, hibernating off-window"; promotion at season-start respects the festival-specific walk-forward.
- **Seasonal classes** (winter natgas equivalents in sports — late-season relegation pressure, US college football bowl-week, Asian preseason fixtures) have hibernation states; promotion gate considers cross-season freshness.

### 9.3 Lifecycle Decision Log

Every transition records evidence and reasoning: who signed, what backtest evidence supported it, what the candidate's CLV trace looked like at the time. The log is immutable and auditable.

### 9.4 Cross-class consistency

The lifecycle view is also where Diego enforces fleet-shape decisions: maximum simultaneously-live classes per sport, maximum simultaneously-live classes consuming the same model version, maximum capital-at-risk across all live in-play classes for the same event-cluster (Saturday-3pm-EPL).

### 9.5 Why this matters

Sports edge decays under market-sharpening pressure; classes overstay their welcome silently if no one is enforcing the gate. The lifecycle view is what makes "this class is no longer profitable" a visible, decision-driving fact rather than a slow leak. It is also what protects Diego from his own sentimental attachment to a template that worked for years.

---

## 10. Capital Allocation

Diego's capital-allocation surface differs from financial archetypes in a load-bearing way — capital is not allocated per-instrument or per-strategy on a continuous basis, but **per event-cluster**, with sharp temporal concentration.

### 10.1 The Allocation Surface

A surface that shows:

- **Total turnover budget per match-day** — the firm's gross liability cap for the day, given the current bankroll.
- **Per-event-cluster allocation** — Saturday-3pm-EPL is a cluster; Wednesday-Champions-League is a cluster; Cheltenham-Festival-Day-1 is a cluster; Royal-Ascot-Tuesday is a cluster. Each cluster has its own cap, with intra-cluster sub-caps per event.
- **Per-class allocation within cluster** — pre-event xG class consumes X of cluster cap; in-play scalp consumes Y; lay-the-draw consumes Z.
- **Per-book allocation** — capital held at Betfair vs Smarkets vs Matchbook vs Pinnacle vs each regional sportsbook; rebalanced on a schedule and constrained by ban-risk.
- **Tournament-window multipliers** — caps scale up for major tournaments (World Cup, Grand Slams, Cheltenham, Royal Ascot, Breeders' Cup) where edge and liquidity both rise.
- **Reserve cash per book** — kept untouched for cross-book arb leg-out and emergency hedges.

### 10.2 Per-Event-Cluster Sizing Logic

The cluster cap is the load-bearing concept. Saturday 3pm UK in football: 6 EPL matches simultaneously, all classes live on all matches, hundreds of in-play instances firing inside a 90-minute window. Without a cluster cap, fully-correlated cluster losses (all favourites lose, or a wave of red cards across the slate) could exceed the daily loss limit before any single per-event check triggers.

The cluster cap converts this into: "the maximum aggregate liability across all active strategies for all events in the 3pm Saturday cluster is N." Each class within the cluster gets a slice; sub-caps per event prevent any single match consuming the cluster.

Cluster definitions are sport-and-calendar specific:

- **Saturday 3pm EPL** — the canonical cluster.
- **Wednesday/Tuesday Champions League** — split first-leg/second-leg awareness.
- **Sunday NFL early window / late window / Sunday-night.**
- **Cheltenham-Festival-Day** — 7 races over an afternoon, with Gold Cup and Champion Hurdle as the foveal events.
- **Royal Ascot day** — similar shape.
- **Wimbledon-finals weekend.**
- **World Cup match-day** — particularly the simultaneous-final-group-game window.

### 10.3 Per-Book Allocation

Capital sits at multiple books. The allocation surface shows current position vs target position per book, drift since last rebalance, ban-risk-adjusted target. When a book's ban-risk crosses the warning threshold, the surface flags reduction-of-target as the recommended action — concentration at a book about to ban is operational risk regardless of edge.

### 10.4 Capacity & Liquidity Gating

Classes are allocation-capped by liquidity: a class will not size up beyond the depth profile of its market. Cup-ties and lower-league fixtures with thin top-of-book depth carry per-event caps a fraction of the EPL cap. The allocation surface visualises capacity utilisation per class per cluster; under-utilised capacity is reviewed in the post-trade-and-decay surface.

### 10.5 Tournament & Festival Multipliers

For major events, allocations scale up — but with explicit human sign-off. Cheltenham Festival Day 1's allocation is loaded the day before, reviewed by Diego and David, and signed off. Royal Ascot, Wimbledon finals, Champions League finals, World Cup knockouts each have a pre-event allocation review.

### 10.6 Why this matters

Sports markets correlate inside event-clusters in ways equities do not. Six 3pm EPL matches all losing together, or a Cheltenham card where all favourites get beaten, or a Sunday NFL slate where every dog covers, can produce a worst-case loss that no per-event cap captures. The cluster-cap construct explicitly bounds these tail outcomes. The per-book allocation construct keeps operational risk (a book ban) from becoming a capital event. The platform turns Diego's hand-managed allocation discipline into enforced infrastructure.

---

## 11. Live Fleet Supervision Console

The supervisor console is where Diego watches his fleet during live operation. Default-green; anomaly-driven attention; foveal event view always one click away; multi-event parallelism preserved from the manual archetype.

### 11.1 The Fleet Dashboard

Layout: a row per active strategy class instance (one line per class × event), with columns:

- **Class name** | **Event** | **Sport / League** | **Market-type** | **State (green / warn / paused / suspended-by-platform)**
- **Edge vs fair** | **Position size** | **Liability** | **Realised P/L** | **Unrealised P/L** | **Per-outcome scenario P/L**
- **Top-of-book depth** | **Bet-delay window** | **Suspension state** | **Account-health flag**
- **CLV-to-date** (where settled) or **CLV-projected** (vs current Pinnacle)

Sortable, filterable by sport, league, cluster, class, state. Group-collapse by event so the foveal event can be expanded inline.

### 11.2 The Strategy Detail Page

Click a class instance, see: composition snapshot, model version, recent fills (with venue and price), per-fill CLV, per-fill fill-quality, internal-state snapshot (model output, gate states, last-evaluation timestamp), correlation to other classes on the same event, recent intervention history.

### 11.3 Anomaly Detection Surface

Default-green; surfaces:

- **Class state-change** (paused / resumed by platform).
- **Edge-vs-fair excursion** beyond expected range.
- **Fill-quality degradation** vs backtest expectation.
- **CLV-projection turning negative** mid-session.
- **Suspension storm** (multiple events suspended simultaneously, suggests a feed issue rather than coincidence).
- **Bet-delay spike** beyond venue norm.
- **Account-health alert** (a book has cut limits in-session).
- **Cluster-cap-utilisation high** (close to per-cluster liability cap).

### 11.4 Cross-Strategy Correlation View

Per-event correlation: which classes are exposed to the same outcome on the same event? Same outcome on different events but same scenario (all favourites win, all unders, all home-teams)? Cluster-level correlation: what is the maximum correlated loss across the cluster if a tail scenario fires?

### 11.5 Active-Event Live State (Diego-specific)

The most distinctive supervisor surface for Diego. Every event in an active state has a line in the Active-Event Live State panel:

- **Event identity** — fixture / race name, kickoff/off time, league/meeting.
- **Current score** (or race position) — with goal / try / break / position-change events flagged.
- **Time elapsed / time-to-off** — in match-clock or pre-race minutes.
- **Liquidity profile** — top-of-book depth on the primary market, with peak / current / floor over the event so far.
- **Suspension state** — clear green / suspended / resumed-recently. Reason-code surfaced where known (goal / red-card / VAR / system / unknown).
- **Bet-delay** — current per-market delay window in seconds.
- **Video-feed health** — green / degraded / lost; latency-vs-benchmark visible. The platform does not interpret video; it does monitor whether the feed is alive.
- **Classes active on this event** — the count; click expands to the class list with per-class state.
- **Diego's manual position** — any positions Diego entered by hand outside of class flow, separated visibly from class-flow positions (section 12.3).
- **Video / event clock skew** — milliseconds of lag between the event-tape clock and the video clock; rises during feed congestion.
- **Reconciliation flag** (rare but real) — when the algo's view of the event state and the exchange's view of the event state diverge (section 11.6 below). Loud surfacing; Diego acts.

The Active-Event Live State panel is the supervisor's compressed answer to "what is the fleet actually doing right now, across all the live events." Click any row, the foveal-event view expands into the centre monitor: ladder, video, stats, in-running model output, position summary — exactly the manual archetype's foveal layout, except the positions and the class flow are visible.

### 11.6 Strategy State Inspection

**Mandatory across all archetypes.** Diego's variant of the inspection surface:

- **Per-class internal state** — current model output, gate states (signal, sizing, entry-policy, exit-policy, hedging, risk-gating, regime-conditioning), last-evaluation timestamp, time-since-last-evaluation, recent reasons-not-fired.
- **Backtest-vs-live comparison** — daily by default; per-class CLV / ROI / hit-rate / fill-quality compared to backtest expectation, with a divergence trace.
- **Refresh-on-demand** — internal state is not streamed continuously for every class (engineering pragmatism — sustained streaming of every internal variable for ~3500 active strategies would be wasteful and noisy). Diego triggers a refresh on the class he wants to inspect; the surface fetches and renders. Event-pushed refreshes happen on state-change (entry, exit, gate trip, drift trigger).
- **Reconciliation between algo state and exchange state** — sports books occasionally desync. The exchange thinks the market is suspended; the algo thinks it's open. The exchange has a fill the algo missed. The algo thinks it has a working order; the exchange shows it cancelled. The reconciliation surface catches these:
  - Per-class working-order vs exchange-working-order diff.
  - Per-class settled-position vs exchange-settled-position diff.
  - Per-event suspension-state algo-view vs exchange-view diff.
  - Per-fill price-and-size algo-record vs exchange-record diff.

  Disagreements are loud — they are a real risk for sports books that desync more than financial venues do, and Diego needs to know inside seconds, not after the event ends. The reconciliation surface does the comparison continuously and surfaces deltas. Resolution paths from the surface are: reconcile-from-exchange (trust the venue), reconcile-from-algo (trust the platform — rarely the right call), pause-class-on-event (stop trading until investigated), manual-trade-to-fix.

### 11.7 Why this matters

Diego watches a fleet, not a chart. The fleet dashboard is the daily state-of-the-world; the active-event live state is the situational awareness layer; the strategy state inspection is the deep-dive when something is off. The reconciliation surface is the platform's confession that sports infrastructure is imperfect — and the platform's commitment to surfacing those imperfections rather than hiding them. Without these surfaces, a $200M-turnover match-day with thousands of fills is unsupervisable; with them, Diego can drive it.

---

## 12. Intervention Console

When Diego intervenes, the actions are granular, scoped, fast, audited. Manual trading is preserved end-to-end.

### 12.1 Per-Strategy Controls

Per class instance, with hotkeys:

- **Pause new entries** — class continues to manage existing positions but enters no new trades.
- **Pause all** — class is fully halted; positions held.
- **Flatten and pause** — green-up to flat, then halt.
- **Override sizing** — apply a multiplier (down only, up only with sign-off) for the rest of the session.
- **Override regime gate** — force the class to treat the regime as X for the next N minutes (e.g. force "tournament-active" off if the tournament has been paused).
- **Override entry-policy** — restrict to passive-only, or permit aggressive sweep, etc.
- **Resume** — return the class to its composition default.

### 12.2 Group Controls

Sports-natural grouping axes — class actions can be applied to a group rather than instance-by-instance:

- **Per-event** — pause all classes on this fixture (typically when the video-feed read suggests the model is mispricing; Diego standing the algo down on this event).
- **Per-cluster** — pause all classes on the Saturday-3pm-EPL cluster (rare; reserved for systemic concerns — feed outage, market manipulation suspicion, public-bias storm).
- **Per-class-type** — pause every instance of the in-play stat-driven scalp class (across all matches) — typically when a feature drift alert is global rather than per-league.
- **Per-book** — stop new orders to a specific exchange (when a book is restricting in-session, when a venue's API is degraded, when account-health hits a hard limit).
- **Per-tournament** — pause all classes operating within the Cheltenham Festival window — typically when a track condition has changed enough mid-day that pre-prepared priors are stale.

### 12.3 Manual Trading & Reconciliation

**Mandatory across all trader archetypes.** The manual trading surface — the same Betfair-style ladder, back/lay ticket, hedge / green-up calculator, multi-bet builder, cross-book arb ticket, and bookmaker-account-aware execution — is preserved in full. Diego retains every manual capability described in his Phase 2 sections.

The composition is layered:

- **The ladder** — exactly the Phase 2 ladder. Vertical price ladder, click-to-back / click-to-lay, F1–F4 stake presets, my orders inline, recent-trades tape, volume-traded-at-price, WOM. In automated mode, the ladder also shows class-flow orders (visibly distinct from manual orders) — Diego sees what his algo is doing on the same ladder he uses to manually trade.
- **Hedge / green-up calculator** — one-click counter-position to lock P/L; partial / asymmetric variants; preview-before-submit. Identical to Phase 2.
- **Cross-book arb ticket** — preserved. Diego hand-arbs occasionally even when classes are active.
- **Multi-bet builder** — single, double, accumulator, system bet; preserved.
- **Hotkey bindings** — manual hotkeys preserved end-to-end. The keys Diego built muscle memory for over a decade do not move when the platform automates around him.
- **Strategy template invocation hotkeys** — F-key bound manual templates (lay-the-draw, tick-scalp, serve-scalp) are still executable by hand; firing one tags the resulting position as manual-template, distinct from class-flow.

**Tagging and audit.** Every manual trade is tagged on entry — by reason code (override / reconciliation / emergency-hedge / discretionary / video-read), by sport, by event. Tags feed Phase 4 attribution; the post-trade surface compares manual vs class-flow performance.

**Emergency mode.** A dedicated key combination puts Diego's terminal in emergency mode: classes on the focused event freeze; a clean ladder appears; hedge calculator is foveal; one-click flatten is a hotkey; cross-book arb is one keystroke away. Used during in-play crises (red card, VAR review with major directional implication, abandoned match).

**Reconciliation workflow.** Tied to section 11.6 — when the reconciliation surface flags a delta, the manual ticket lights up with the proposed correction (a manual order to bring algo state to exchange state), Diego reviews the proposed correction with a one-click confirm or rejects to investigate first. Every reconciliation action is tagged, reasoned, audited.

### 12.4 Kill Switches at Multiple Scopes

Hierarchical:

- **Single class instance** — kill on one class on one event.
- **Class type** — kill all instances of a class across all events.
- **Event** — kill all classes on an event.
- **Cluster** — kill all classes on a cluster.
- **Per-book** — close all working orders to a venue, prevent new orders.
- **Per-sport** — kill all classes within a sport.
- **All-in-play** — kill every in-play class while preserving pre-event positions (the daily soft-stop).
- **Total fleet kill** — every class halted; positions held; manual-only mode active.

Each scope has its own hotkey or button; each kill is reasoned and logged. Multi-key authorisation is required for cluster-or-larger kills outside of normal operating windows.

### 12.5 Intervention Audit Log

Every intervention — pause, override, kill, manual trade, reconciliation action — recorded with timestamp, scope, reason, who-authorised. Searchable per class, per event, per session. Diego's Phase 4 review surfaces interventions per session; David's firm-level supervision (section 17.3) reviews them across traders.

### 12.6 Why this matters

Diego retains agency over the fleet. Granular controls let him intervene on the unit that matters (this class instance on this event) without disturbing the rest. Manual trading preserved means a decade of muscle memory still works. The reconciliation workflow turns sports-infra desyncs from invisible bugs into supervisable events. The audit log turns interventions into reviewable decisions, which is how Diego improves.

---

## 13. Post-Trade & Decay Tracking

CLV is the primary metric. Decay is seasonal. Retire decisions are explicit.

### 13.1 Per-Strategy Retrospective

Per class instance per event, post-settlement:

- **Realised P/L** — including commission and any settlement adjustments.
- **CLV trace** — entry-vs-Pinnacle-close per fill, aggregated for the class on this event.
- **Fill-quality** — spread paid, slippage vs intended price.
- **Bet-delay impact** — fraction of fills that suffered stale-quote effects.
- **Suspension impact** — fraction of intended fills that did not execute due to suspension.
- **Counterfactual** — what if the class had been larger / smaller / not run; what if the manual override had / had not been applied.

### 13.2 Fleet-Level Review

End-of-day, end-of-week, end-of-month: aggregate fleet P/L, CLV, ROI, hit-rate, drawdown, sliced by sport / league / cluster / class / book. Cluster-level review is particularly load-bearing — Saturday-3pm-EPL is reviewed as a unit.

### 13.3 Decay Metrics

Per class:

- **CLV-trend** — rolling 30 / 90 / 365-day; the truest leading indicator.
- **Edge-realised vs edge-expected** — divergence trace.
- **Fill-quality drift** — is the class being matched at progressively worse prices as the market sharpens?
- **Hit-rate-vs-CLV-implied-hit-rate** — when these diverge, either the class has tagged its bets wrongly or the calibration has drifted.

Sports decay is **seasonal**. Pre-event models for a league refresh between seasons, not within a season — feature distributions stabilise during a season and then shift in the close-season as transfers, rule changes, and tactical evolutions accumulate. Retrain windows align with off-season; promotion gates are tighter for the first N matches of a new season; a class that was strong last season may need recalibration before going live for the new one.

Tournament-specific classes (Cheltenham, Royal Ascot, Wimbledon, World Cup) have an even longer cycle — they decay between annual occurrences and need a deliberate refresh cycle the week before the festival.

### 13.4 Retrain Queue

Drift triggers route classes into a retrain queue with priority by class-importance. Retrain runs in the workspace, walk-forward-validates, surfaces the candidate as a new model version, promotion-gates back to live.

### 13.5 Retire Decisions

When CLV-trend turns negative for 90+ days and retrain has not recovered it, the class is queued for retirement. Diego signs the retire decision in the lifecycle view (section 9). Retired classes are archived in the registry, not deleted.

### 13.6 Why this matters

Sports markets sharpen. Edge that worked five years ago now lives in a smaller corner of the market. Without a CLV-trend-driven decay surface, retired-but-still-running classes bleed money silently. With it, decay is detected, retrain is automatic, retire is deliberate. The fleet stays honest.

---

## 14. The Supervisor Console — Diego's Daily UI

The console adapts the manual six-monitor setup into a supervisor layout that preserves what Diego cannot give up (ladder, video, audio, hedge calculator) and adds the surfaces automation requires (fleet dashboard, active-event live state, anomaly rail, intervention controls).

### 14.1 Monitor Layout (Mode-Aware)

| Position      | Surface                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Top-left      | **Active-Event Live State** (section 11.5) — every active event with score / time / liquidity / suspension / video health                              |
| Top-center    | **Foveal event** — ladder + in-running stats + class-flow orders inline + Diego's manual orders inline                                                 |
| Top-right     | **Multi-event video wall** — low-latency feeds, foveal feed enlarged by configuration                                                                  |
| Middle-left   | **Cross-book pricing panel** — Betfair / Smarkets / Pinnacle / Matchbook + arb spreads + per-book account-health                                       |
| Middle-center | **Fleet dashboard** (section 11.1) — class instances with state, edge, position, CLV-projected                                                         |
| Middle-right  | **Order entry / hedge calculator / intervention console** — manual ladder ticket + green-up + per-class intervention controls + emergency mode trigger |
| Bottom-left   | **Stats & data feeds** — live xG, possession, shots, in-running tracker, racing sectionals; data-quality alerts                                        |
| Bottom-right  | **Anomaly rail / alerts / news** — drift alerts, account-health alerts, lineup-confirmation drops, syndicate chat, news feed                           |
| Audio         | **Match commentary** (Sky / BBC / Racing TV) — preserved end-to-end; commentary still leads the market                                                 |
| Tablet        | **Twitter/X, Telegram syndicate, Discord** — verified-source social and private signal channels                                                        |

**Video as a foveal element is mandatory.** The platform cannot interpret video; Diego's video-read remains the basis for many of his manual overrides. The video wall is therefore not a periphery surface — it is foveal infrastructure.

**Manual ladder + green-up calculator preserved.** The middle-right surface is the manual trading ticket exactly as Phase 2 specifies. Class-flow orders appear on the ladder visibly distinct from manual orders, but the ladder itself is the same instrument.

### 14.2 Mode-Switching

Diego has explicit modes; switching between them rearranges which surfaces are foveal:

- **Off-day / Quiet day** — research workspace foveal; fleet dashboard in periphery; minimal in-play; lifecycle review and feature-library work.
- **Pre-event window** — model dashboards and lineup-confirmation monitor foveal; cross-book panel in periphery; order entry stand-by.
- **In-play (single foveal event)** — ladder + video + stats foveal; fleet dashboard secondary; multi-event grid showing other active events.
- **Multi-event peak (Saturday 3pm, Cheltenham afternoon, World Cup match-day)** — multi-event grid foveal; fastest-toggle between foveal events; fleet dashboard inline; cluster-cap utilisation visible at all times.
- **Post-event** — replay tool foveal; CLV / attribution / decay views; settle-out reconciliation; trade journal review.
- **Festival mode** (Cheltenham / Royal Ascot / Wimbledon-finals / World Cup-knockouts) — dedicated layout with tournament-specific classes' state foveal, larger video real-estate, festival-specific allocation visible.
- **Emergency mode** — focused-event clean ladder, hedge calculator, one-click flatten, classes-on-event paused, audit-tagging on every action.

Each mode is a saved layout. Mode-switch hotkey re-arranges surfaces in milliseconds. Audio source per mode is configurable (commentary on for in-play; off-by-default during research).

### 14.3 Defaults & Anomaly-Driven Attention

The console is default-green. Diego is not staring at every class; the active-event live state, the anomaly rail, and the alert categories from section 11.3 surface the things worth looking at. The fleet dashboard fades to small unless something is excursion. The platform deliberately quiets — silence is the goal during normal operation.

### 14.4 Hotkeys & Muscle Memory

Manual trading hotkeys (Phase 2) preserved. Intervention hotkeys added: pause-class-on-foveal-event, flatten-event, kill-cluster, emergency-mode-on, emergency-mode-off, mode-switch, foveal-event-cycle. Strategy template manual invocations (lay-the-draw, tick-scalp, serve-scalp F-keys) preserved. Audio-mute and video-foveal-cycle preserved.

---

## 15. Diego's Automated-Mode Daily Rhythm

Diego's day is **match-day-driven**. Off-days are research and lifecycle work; match-days are supervision and intervention. Festival weeks compress everything.

### 15.1 Off-Day Cadence (Mon / Tue / sometimes Wed during quiet weeks)

- **Morning:** drift dashboard scan, decay-metrics review on classes that flagged at the end of last match-day, retrain queue triage.
- **Midday:** workspace research — feature prototyping, class-parameter tuning, pre-season backfill on the next league about to start, walk-forward of candidate classes.
- **Afternoon:** lifecycle pipeline review, class-promotion sign-offs, allocation-review for the upcoming match-day cluster, cross-book account-health scan, procurement / data-quality scorecards.
- **Evening:** lighter work; possible coverage of a single low-volume midweek event.

### 15.2 Match-Day Cadence (Sat / Sun / midweek with Champions League / festival)

- **Pre-window (~2 hours before kickoff/off):** allocation confirmed; classes ready to wake at their configured pre-event windows; data-feed health green-checked; account-health green-checked; cluster-cap configured.
- **Lineup-confirmation window (~1 hour before kickoff):** the daily attention spike. Diego watches the lineup-feed; classes that condition on confirmed lineups wake up post-confirmation; manual overrides applied for any team-news interpretation that beats the model.
- **Pre-event in the final 30 minutes:** pre-event xG class active; cross-book arb scanner active; closing-line drift estimator running.
- **Kick-off / off:** in-play classes wake. Bet-delay activates. The active-event live-state panel populates. Multi-event grid populates. Foveal-event view focuses on the highest-attention event in the slate.
- **In-play (90+ minutes for football, longer for tennis, 3–5 minutes for racing):** Diego supervises across events; intervenes on class-state anomalies, video-reads, and reconciliation flags; fires manual-template hotkeys when a setup is too event-specific for the class to size into; uses emergency mode during VAR / red-card / abandonment moments.
- **Cluster moments (Saturday 3pm, Cheltenham afternoon):** maximum cognitive load; mode is multi-event peak. Cluster-cap monitor visible; foveal-event cycle is active.
- **Post-event:** classes settle out; reconciliation surface confirms algo-vs-exchange match; hand-trade any open positions; trade journal entries.
- **End-of-day:** fleet review, CLV trace, anomaly summary, prepare retrospective for the morning.

### 15.3 Festival / Major-Tournament Cadence

For Cheltenham Festival (4 days), Royal Ascot (5 days), Wimbledon finals weekend, World Cup knockout fortnight:

- **Pre-tournament week:** dedicated workspace work; festival-specific class refresh; allocation review with David; festival-mode console layout pre-tested.
- **Each tournament day:** Diego is foveal. Festival-mode layout active; festival-specific classes live with tournament multipliers; manual overrides expected to be heavier than ordinary match-days; account-health monitored intensely (festival-week stake volumes attract bookmaker attention).
- **End-of-festival:** decay review; festival-specific class CLV reviewed; lessons-learned for next year's festival cycle.

### 15.4 Rhythm differences from manual mode

Manual Diego split his time across decide / enter / hold / learn within an event-window. Automated Diego splits across **research-windows (off-days)** and **supervision-windows (match-days)**, with research dominating his time inside off-days and supervision dominating his match-day attention. Trade entry is mostly the algo's job; Diego enters by hand when he is overriding (video-read, reconciliation) or hand-trading a setup the classes can't size into.

---

## 16. Differences from Manual Mode

| Dimension                  | Manual Diego                                      | Automated Diego                                                                                    |
| -------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Coverage                   | 6–10 events per match-day, foveal one at a time   | 80–120 fixtures per match-day, ~3500 active class instances                                        |
| Trades per match-day       | 200–400                                           | 5,000–20,000 fills (algo-driven); 5–30 manual overrides                                            |
| Phase 1 (Decide)           | Pre-event research + form-book + cross-book panel | Research-workspace + feature library + lifecycle pipeline; classes do per-event decide             |
| Phase 2 (Enter)            | Hand-fired ladder back/lay + scalp templates      | Classes fire entries; manual ticket reserved for override / reconciliation / discretionary         |
| Phase 3 (Hold)             | Foveal one event, hedge by hand                   | Fleet dashboard + active-event live state; per-class intervention; emergency mode                  |
| Phase 4 (Learn)            | Replay + CLV + per-strategy review                | Fleet decay surface + per-class lifecycle decisions + cluster-level review + festival-cycle review |
| Time on charts / video     | Most of in-play                                   | Less, but video remains foveal — still primary read for video-only judgment                        |
| Time on research           | Mon / Tue and pre-event                           | Off-days dominantly research; pre-tournament weeks heavy                                           |
| Time on supervision        | Foveal-event focus                                | Multi-event fleet focus; foveal-event one click away                                               |
| Time on intervention       | Hand-trade is the default                         | Intervention is reasoned; manual ticket is the override path                                       |
| Latency criticality        | Personal reaction speed                           | Class-execution latency + venue-routing latency; Diego's personal latency matters in overrides     |
| Risk units                 | Per-event liability + daily P/L                   | Cluster-cap + per-event-cap + per-class-cap + per-book account-health                              |
| Edge metric                | CLV (primary), realised P/L (noisy)               | Fleet-level CLV-trend per class per league, plus cluster-level realised P/L                        |
| Cognitive load             | Sub-second reaction across one foveal event       | Pattern-recognition across a dashboard; deep-attention on anomalies and video-reads                |
| Failure modes              | Late on a goal; mistagged hedge                   | Class drift; feed desync; reconciliation gaps; account-health concentration; tail-cluster loss     |
| Tools mastered             | Ladder, hedge calculator, hotkeys                 | Above plus fleet dashboard, lifecycle pipeline, allocation surface, reconciliation, replay         |
| Compensation driver        | Realised P/L                                      | Realised P/L + fleet-CLV + class-promotion judgment + capital-efficiency                           |
| Match-day attention spikes | Lineup window, kick-off, in-play crises           | Lineup window, cluster cluster-cap, reconciliation flags, video-read overrides, festival peaks     |
| Information edge           | Personal speed + video-read + syndicate           | Class-execution speed + Diego's video-read on overrides + syndicate (still human)                  |

The fundamental change: Diego runs a **fleet of strategy classes with retained discretion at the override layer**, instead of hand-firing every position himself.

---

## 17. Coordination with Other Roles

Diego's automated cousin coordinates with Aria (sister archetype on the event-markets desk), Quinn (cross-archetype overseer), David (firm-level supervisor), and the data / research / engineering teams.

### 17.1 Coordination with Aria (Prediction-Markets / Event-Research)

Aria runs prediction-markets on Polymarket / Kalshi / Smarkets / Betfair political and event-research markets. Overlap with Diego is real:

- **Sports markets on prediction venues** — Polymarket and Kalshi list World Cup / Super Bowl / Wimbledon outcome markets. Aria trades these as resolution-research; Diego trades the underlying sports books. Cross-venue arb between a Polymarket sports market and a Betfair sports market is in scope; the platform must coordinate so that a single Polymarket-Betfair arb opportunity is taken by one class, not double-allocated by both desks.
- **Shared cross-venue arb scanner** — the same scanner serves both desks. Diego's filter is sports-market-only; Aria's filter is everything; the scanner emits opportunities tagged by which desk owns them.
- **Shared resolution-source live monitor** — when a Polymarket sports market resolves on a Sportradar feed and a Betfair market resolves on a different official source, divergent settlement is a real coordination event. Aria and Diego watch the same monitor.
- **Shared microstructure features** — WOM, depth, stale-quote, bet-delay generalise across both desks' venues.
- **Distinct edges** — Aria's edge is resolution-criteria interpretation and polling-vs-market models; Diego's is in-play microstructure and form-book. Each respects the other's surface.

A shared-positions view shows where Diego and Aria are exposed to the same outcome (e.g. both holding World-Cup-winner positions across venues). This is a coordination matter, not a violation; David's firm-level review monitors the aggregate.

### 17.2 Coordination with Quinn (Quant Overseer)

Quinn is the cross-archetype meta-overseer; coordination with Diego covers:

- **Cross-archetype factor exposure** — sports markets are largely uncorrelated to financial factors, but festival-week capital concentrations register at the firm level; Quinn watches.
- **Shared feature library use** — features Diego authors that have utility in Aria's domain (and vice versa) are surfaced in Quinn's cross-pollination view.
- **Promotion-gate awareness** — Quinn reviews class-promotion decisions for cross-archetype implications; for Diego mostly a light-touch review (sports has limited cross-archetype implication).
- **Correlation matrix** — the firm's daily P/L correlation matrix; Diego's contribution is mostly idiosyncratic but Saturday-3pm-EPL and Cheltenham-day are visible cluster events at firm level.

### 17.3 Coordination with David (Firm-Level Supervisor)

David coordinates firm-level supervision across all archetypes:

- **Firm-level capital allocation** — David sets Diego's bankroll and the festival-week multipliers; promotion to firm-level capital is signed by David.
- **Class-sanctioning** — new strategy classes for new sports / new tournaments require David's sanctioning, especially when class-type or risk-class is novel (a lay-the-draw class for a new league is incremental; an entire new sport coverage is sanctioned).
- **Behavioural monitoring** — David's office reviews Diego's intervention log for tilt patterns (manual override frequency rising during drawdowns; discretionary hand-trades after a class loss).
- **Catastrophe response** — firm-wide kill switches authorised by David; multi-key authorisation for cluster-or-larger kills.
- **Account-health concentration** — David is alerted when capital-at-book concentration crosses firm thresholds; sometimes the response is firm-level diversification of book relationships rather than a Diego-only action.
- **Daily / weekly / monthly review cycles** — Diego's fleet performance feeds David's committee deliverables.

### 17.4 Coordination with Data / Research / Engineering

- **Data team** — vendor evaluations, low-latency feed engineering, video-feed provisioning, racing-form data-vendor management, cross-book odds-feed engineering.
- **Research team** — feature authoring, model retraining, walk-forward validation, festival-specific class refresh.
- **Engineering team** — bet-delay-aware order routing, suspension-handling, reconciliation infrastructure, multi-venue execution.
- **Compliance** — venue licensing, jurisdictional access, tax-reporting per book, KYC across venues, account-management policy.

### 17.5 Why this matters

A modern sports-trading desk is a multi-skilled operation. Diego's edge depends on the data team's feed engineering, the research team's feature authoring, the engineering team's infrastructure reliability, Aria's prediction-market cousin work, Quinn's cross-archetype oversight, and David's firm-level capital and class-sanctioning authority. Coordination surfaces — shared scanners, shared resolution monitors, shared feature library, shared promotion gates, shared committee reviews — make the multi-skilled team coherent. Diego's role is to be the operator at the centre of all of them on match-day.

---

## 18. How to Use This Appendix

This appendix supplies evaluation questions for any platform implementation aimed at Diego's archetype. Walk through each surface and ask whether the platform answers Yes, in detail, with the right shape.

**Data layer**

- Is sports event tape catalogued per-vendor with per-match latency telemetry?
- Is video-feed health monitored per-match and surfaced to the supervisor?
- Are lineup-confirmation timestamps point-in-time facts in the catalog?
- Are racing form, sectional times, going / track-condition, and on-track measurement feeds catalogued?
- Are cross-book odds-streams catalogued with stale-quote detection?
- Is there a procurement dashboard with renewal-impact-by-class visible?
- Does the gap-analysis surface tie missing data to specific classes that can't go live?

**Feature library**

- Are pre-event xG features, in-running stats features, racing form features, cross-book microstructure features, and account-health features all catalogued with owner / cadence / drift?
- Is bet-delay surfaced as a feature usable by sizing rules?
- Is suspension-state surfaced as a feature usable by sizing and exit rules?
- Is the drift dashboard surfacing rule-change-driven feature shifts (VAR protocol, format changes)?
- Does cross-pollination view link Diego's features to Aria's domain where useful?

**Research workspace**

- Does the backtest engine model bet-delay, suspension, commission, stake-factor, leg-out latency, settlement-ambiguity?
- Is liquidity-realism replayed against historical depth ladder?
- Are the strategy templates (pre-event-edge, in-play scalp, lay-the-draw, racing form, cross-book arb, tennis serve, pre-final-furlong) first-class scaffolds?
- Is walk-forward windowed by tournament / season rather than calendar day?

**Model registry & experiment tracker**

- Is every model (xG, in-running fair-prob, racing form-rating, ban-risk, closing-line drift) versioned and reproducible?
- Is calibration drift surfaced per-league per-tournament?
- Are experiments comparable side-by-side with CLV-vs-ROI?
- Are promotion-decisions traceable to specific experiment records?

**Strategy composition**

- Does composition enforce bet-delay caps, liquidity-floors, suspension-behaviour, account-health gating?
- Does composition support cluster-aware sizing caps?
- Are festival-specific class definitions versioned as first-class artifacts?
- Are mutex flags between classes (only-one-of-these-runs-per-event) supported?

**Lifecycle**

- Are tournament-specific classes hibernation-aware?
- Is seasonal decay handled with off-season retrain windows?
- Is retire decision irreversible without a fresh promotion cycle?
- Is the lifecycle pipeline visible as a board with state, evidence, and sign-offs per transition?

**Capital allocation**

- Are per-event-cluster caps (Saturday-3pm-EPL, Cheltenham-Festival-Day, Royal-Ascot-Day, World-Cup-knockout) configurable and enforced?
- Is per-book allocation visible with ban-risk-adjusted targets?
- Are tournament-week multipliers signed off by Diego and David?
- Is reserve-cash-per-book preserved for arb leg-out and emergency hedge?

**Live fleet supervision**

- Does the active-event live state panel show every active event with score / time / liquidity / suspension / video-feed health?
- Is reconciliation between algo state and exchange state continuously monitored and loudly surfaced?
- Is strategy state inspection refresh-on-demand with backtest-vs-live comparison?
- Is the fleet dashboard sortable and filterable by sport / league / cluster / class / state?
- Are anomaly categories appropriate for sports (bet-delay spike, suspension storm, account-health alert, cluster-cap utilisation)?

**Intervention console & manual trading**

- Is the manual ladder + back/lay ticket + green-up calculator + cross-book arb ticket + multi-bet builder preserved end-to-end?
- Are class-flow orders visibly distinct from manual orders on the same ladder?
- Are manual hotkeys preserved (Phase 2 muscle memory)?
- Are intervention scopes (per-class-instance, per-event, per-cluster, per-class-type, per-book, per-tournament) all exposed?
- Is emergency mode a one-keystroke action with clean ladder / hedge calculator / one-click flatten?
- Is reconciliation a workflow with proposed-correction preview and one-click confirm or reject?

**Post-trade & decay**

- Is CLV the primary edge metric, with rolling 30 / 90 / 365-day trend?
- Are cluster-level retrospectives a first-class review artifact (not just per-class)?
- Are tournament-cycle retrain windows explicit?
- Are retire decisions audit-trailed and reversible only via fresh promotion?

**Supervisor console**

- Is video a foveal element, not periphery?
- Is mode-switching (off-day, pre-event, in-play, multi-event-peak, post-event, festival, emergency) configured as saved layouts with hotkey switch?
- Is audio (commentary) preserved?
- Is the layout default-green and anomaly-driven?

**Daily rhythm**

- Is off-day cadence research-heavy (workspace, drift dashboard, lifecycle pipeline)?
- Is match-day cadence supervision-heavy with foveal-event cycle in cluster moments?
- Is pre-tournament-week cadence festival-specific?
- Is end-of-day reconciliation a hard gate (algo state matches exchange state before close)?

**Coordination**

- Is the cross-venue arb scanner shared between Diego and Aria with desk-tagging?
- Is the resolution-source live monitor shared?
- Are shared feature library entries flagged across desks?
- Are firm-level capital allocation, class-sanctioning, and catastrophe response gated through David?
- Is festival-week capital concentration visible to Quinn at the cross-archetype level?

**Cross-cutting**

- Is every action audit-tagged with who / when / why?
- Is account-health a first-class operational metric rather than buried in a sub-page?
- Are CLV, fill-quality, and bet-delay-impact reported alongside realised P/L for every class?
- Is the platform default-quiet (silence on green; surface only excursion)?
- Is the platform humble about what cannot be automated (video-read, late team-news interpretation, going calls, syndicate-trust judgement, emergency-narrative trades)?

Gaps may be deliberate scope decisions — the platform may explicitly decline to automate, e.g. video-feed interpretation, in-play match-feel, late team-news interpretation, race-day going calls — but should be **known** gaps, not accidental ones.
