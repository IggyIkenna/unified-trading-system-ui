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
