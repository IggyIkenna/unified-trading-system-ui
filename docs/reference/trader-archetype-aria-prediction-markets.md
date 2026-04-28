# Trader Archetype — Aria Kapoor (Senior Prediction Markets / Event-Research Trader)

A reference profile of a top-performing prediction-markets and event-research trader at a top-5 firm. Used as a yardstick for what an ideal **prediction-market / event-research** terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).
For the live-event sister archetype, see [trader-archetype-diego-live-event.md](trader-archetype-diego-live-event.md).

---

## Who Aria Is

**Name:** Aria Kapoor
**Role:** Senior Prediction Markets & Event-Research Trader
**Firm:** Top-5 global trading firm (event-driven sleeve, with a prediction-market specialism), or specialist event-markets fund
**Book size:** $20M – $200M deployed across hundreds of markets simultaneously, with concentrated bets up to $5M – $20M on highest-conviction events
**Style:** Research-driven, model-driven, multi-day to multi-quarter horizons. Cross-venue arbitrage when available.
**Coverage:** Polymarket (Polygon), Kalshi (CFTC-regulated), Manifold, PredictIt (within US-resident limits), Smarkets political markets, Betfair political markets, on-chain prediction markets (Augur successors, smaller protocols)
**Event types:** Political (US/global elections, legislation, FOMC outcomes), economic (CPI prints, GDP, unemployment), geopolitical (war outcomes, sanctions decisions, treaties), tech / AI (benchmarks, releases, lawsuits), entertainment (Oscars, sports tournament outcomes pre-event), weather / climate, crypto-native events (token launches, hard forks, governance outcomes)

### How she thinks differently

Aria operates in markets where the "underlying" is a future fact, not a price:

- **Every contract resolves at 0 or 100.** Her job is to estimate the probability and trade the edge.
- **The hardest part isn't pricing — it's resolution.** Did the contract criteria actually trigger? Resolution disputes are real and can dwarf market risk.
- **Edge sources are radically diverse:** polling models (politics), satellite imagery (commodities, conflict), expert networks, structural biases (most markets are retail-leaning), cross-venue mispricings.
- **Markets are highly fragmented** across venues with regulatory differences (Polymarket = on-chain, Kalshi = CFTC-regulated, Smarkets = UK-regulated, Betfair = UK exchange). Same event, different prices.
- **Liquidity is event-shaped.** Major events (US Presidential election, Super Bowl, FOMC) have deep books; long-tail markets have $5k depth.
- **Time decay is informational.** The closer to resolution, the more information is in the market price; her edge in a market often shrinks as event approaches unless she has private info.
- **Market design matters.** Resolution mechanism (oracle, regulated body, contract committee), tie-breaker rules, ambiguity-handling — these determine whether a "right" thesis pays.

### Her cognitive load

Aria runs **hundreds of markets simultaneously** across venues, with vastly different time horizons (some resolve tomorrow, some in 12 months) and information shapes (model-driven politics vs. domain-expertise tech vs. arb vs. weather). The terminal must support:

- **Portfolio of bets** with widely-different time horizons and resolution mechanisms.
- **Cross-venue price discovery** in real time.
- **Research depth per market** — she has dossiers on US House races, FOMC paths, AI model release dates.
- **Resolution-source monitoring** — the official body / oracle / committee that will determine outcome.

---

## Physical Setup

**6 monitors**, with research workspaces and cross-venue dashboards prominent.

| Position      | Surface                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------- |
| Top-left      | **Markets pipeline / portfolio** — every active market, position, P/L, days-to-resolve      |
| Top-center    | **Active market deep-dive** — the market in foveal focus, with full context                 |
| Top-right     | **Cross-venue pricing** — same event across Polymarket / Kalshi / Smarkets / Betfair        |
| Middle-left   | **Research workspace** — models, polling aggregators, expert-network notes, source tracking |
| Middle-center | **Positions, exposures, P/L by event-cluster + by venue**                                   |
| Middle-right  | **Order entry — single, basket, multi-venue, hedge tickets**                                |
| Bottom-left   | **Macro / news / political feeds** — filtered to active markets                             |
| Bottom-right  | **Resolution-source monitor** — official feeds (BLS, Fed, government APIs, oracle states)   |
| Tablet        | Substack / X / Discord (domain-expertise feeds), academic preprints                         |

Aria spends substantial time **reading and modeling** — far more than executing. The terminal supports a research-heavy day with executions punctuating it.

---

## Phase 1: Decide

### Markets pipeline (the spine of her terminal)

Each market is a first-class object. The pipeline shows every market she's tracking:

- **Market title** (e.g. "Will Fed cut rates at June 2026 FOMC?").
- **Venue(s)** — Polymarket, Kalshi, both, etc.
- **Current YES price (probability).**
- **Her fair-price estimate.**
- **Edge** — fair vs market in basis points or probability points.
- **Position** — current size, side, average entry.
- **P/L** — realized + unrealized.
- **Resolves on** — date, days remaining.
- **Resolution source** — who decides; how.
- **Confidence** — her conviction in the fair-price estimate (high / medium / speculative).
- **Status** — researching / sized / scaling / monitoring / scaling-back / resolved.

### Active market deep-dive

When she focuses on one market:

- **Market description** — full criteria, resolution rules, tiebreakers.
- **Resolution mechanism** — oracle (UMA for Polymarket), CFTC contract committee (Kalshi), exchange settlement.
- **Resolution edge cases** — what if the criteria is ambiguous?
- **Price chart** of the YES contract since listing.
- **Volume + open interest** time series.
- **Recent trades tape** with size.
- **Cross-venue price** for the same event.
- **Aria's fair-price model output** with breakdown.
- **Key inputs** — polling aggregator, model probability, expert estimates.

### Research workspace per market type

**Politics / elections:**

- Polling aggregator (Nate Silver / 538, Cook Political Report, Sabato's Crystal Ball, RCP).
- Polling history per race with bias adjustments by pollster.
- Demographic / district-level analysis.
- Fundraising data (FEC).
- Endorsement tracker.
- Election-model output (multiple models, ensemble).
- Historical base rates (incumbent re-elect rates, generic-ballot translation).

**Economic data (CPI, NFP, GDP, FOMC):**

- Consensus + dispersion of forecasts.
- Nowcasting models (Atlanta Fed GDPNow, Cleveland Fed inflation nowcast).
- High-frequency indicators (credit-card spending, mobility, shipping).
- Recent surprise pattern.
- Implied probability from rates / equity markets vs prediction-market price.

**Geopolitical (war, sanctions, treaties):**

- Conflict tracker (ACLED, Stratfor-style).
- Open-source intelligence feeds (OSINT Twitter accounts, Bellingcat).
- Diplomatic calendar (UN votes, EU summits, G7 meetings).
- Expert opinion (think tanks).
- Historical base rates for ceasefires, regime changes, coups.

**Tech / AI:**

- Model release tracker (lab announcements, leaks).
- Benchmark scorecards (HumanEval, MMLU, ARC).
- Patent / lawsuit databases.
- Research preprints (arxiv).
- Insider sources (Discord, X).

**Sports (pre-event prediction-market form):**

- Crossover with Diego's research — form data, statistics, models.
- For tournament outcomes (World Cup winner, NBA Finals MVP), team-level models with bracket simulation.

**Weather / climate:**

- Forecast aggregators (multiple weather models).
- Historical climatology.
- Satellite data.
- ENSO indicators.

### Resolution-source intelligence

Critical for prediction markets:

- **Who resolves this contract?** — UMA oracle, Kalshi contract committee, exchange settlement, government API.
- **Resolution criteria specificity** — exact wording. A single ambiguous word can flip a market.
- **Recent disputes on similar contracts.**
- **Resolution timing** — same-day, T+1, T+5? Capital lock-up matters.
- **Oracle staking / dispute mechanism** — for on-chain markets, who challenges, what's the cost.

### Cross-venue dashboard

For events listed on multiple venues:

- **Same event, multiple prices** — Polymarket vs Kalshi vs Smarkets vs Betfair.
- **Spread** in probability points.
- **Liquidity per venue** — depth at top of book.
- **Account/regulatory access** — can Aria trade this venue from her jurisdiction?
- **Implementation cost** — bridging stables, gas, account funding, regulatory friction.
- **Net edge after costs.**

### Calendar of resolutions

- **Upcoming resolution dates** across her portfolio.
- **Heat-map by week/month** of capital-locked-until-resolution.
- **Pre-resolution windows** — last 24–72h often see price action as info crystallizes.

### Sentiment & flow

- **Crypto Twitter / Polymarket Telegram** — active community for crypto-native markets.
- **Polling discourse** — political markets are influenced by media narrative.
- **"Sharp" vs retail bias** indicators — many prediction markets skew retail-optimistic on hometown teams, popular candidates.
- **Whale wallets** (on-chain) — public addresses with large prediction-market positions.

### Macro context

- **Fed expectations** (rates markets) — for FOMC-related contracts.
- **Equity / commodity markets** — for adjacent prediction markets.
- **DXY / risk-on-off** — for geopolitically-sensitive markets.

**Layout principle for Decide:** markets pipeline + active research workspace are foveal. Cross-venue dashboard always visible. Calendar of resolutions structures attention.

---

## Phase 2: Enter

Prediction-market entry is **probability-quoted**, **multi-venue native**, and **resolution-aware**.

### Single-market ticket

- **Side: YES / NO.**
- **Stake / size** — most venues quote "shares" worth $1 if right; price is probability ($0.01–$0.99).
- **Limit price (probability) or market.**
- **Pre-trade preview:**
  - Cost (stake).
  - Max payout (if right).
  - Implied edge (fair price vs entry).
  - Days to resolution.
  - Capital lock-up duration.
  - Venue fees / gas / bridging cost.

### Cross-venue execution

When the same event is listed on multiple venues:

- **Best price aggregation** — show top bid/ask per venue, combined depth.
- **Smart routing** — split order across venues to minimize impact.
- **Atomic legs** for arbitrage: buy YES on Venue A at $0.45, buy NO on Venue B at $0.50 → guaranteed $0.05 profit.
- **Bridging awareness** — capital may need to move between venues; preview bridge cost + time.
- **Account-state checks** per venue.

### Basket / cluster ticket

For event clusters (e.g. all 50 US Senate races, or every CPI print this year):

- **Build a basket** of related markets.
- **Size by conviction or by model edge.**
- **Cross-correlation aware** — these markets are not independent; UI shows portfolio-level risk.
- **Rebalance triggers** — model output update → suggested basket rebalance.

### Hedge ticket

For positions she wants to hedge:

- **Buy NO of the same market** at later date if YES-direction has moved.
- **Cross-venue hedge** — long YES on Polymarket (cheaper), short YES on Kalshi (more expensive).
- **Cross-market hedge** — if "Will Trump win nomination?" YES is in book, hedge with "Will Trump be Republican nominee?" NO on another venue (similar but not identical contracts).

### Auto-arbitrage / triangular ticket

- **Triangular arb** — across 3+ venues where prices imply guaranteed profit.
- **System detects, proposes execution path** with sequenced legs.
- **Atomic-where-possible** — on-chain venues allow some atomicity; cross-venue typically sequenced with leg-out risk.

### Algos

- **TWAP / scaled entry** for size in thinner markets.
- **Liquidity-seeking** — sit passive, cross only when price reaches level.
- **Limit-spread orders** — bid/offer placement to capture spread.
- **Resolution-window algos** — accelerate or defer trades as resolution approaches.

### Position sizing tools

- **Kelly criterion calculator** — optimal stake given edge and bankroll.
- **Fractional Kelly** preset (1/4 Kelly default for risk management).
- **Conviction-adjusted sizing** — high-conviction = larger; speculative = capped.
- **Capital-lockup-adjusted sizing** — penalize positions with long lockup.

### On-chain-specific (Polymarket and similar)

- **Wallet selector** — multiple wallets for diversified counterparty.
- **Gas strategy** — base fee + priority tip.
- **Slippage tolerance** for AMM-based markets.
- **Approval management** — USDC approvals limited and tracked.
- **Simulation pre-send** — fork simulation showing exact outcome.

### Regulated-venue-specific (Kalshi, PredictIt)

- **Geo / KYC checks** — Aria's residency status determines access.
- **Position limits** — Kalshi imposes per-contract caps.
- **Margin / cash requirements.**
- **Settlement workflow** — cleared via DCO.

### Hotkeys

- Buy YES at offer / Buy NO at offer (for a focused market).
- Cancel all on market.
- Hedge to flat.
- Switch focus to next market in queue.

**Layout principle for Enter:** ticket is venue-aware (on-chain UX vs regulated UX adapt automatically). Cross-venue routing is a first-class workflow. Sizing tools (Kelly, conviction) are inline.

---

## Phase 3: Hold / Manage

Aria's positions move with information arrival, not by mark-to-market noise. Her Hold surface emphasizes **information events**, **resolution proximity**, and **cross-venue price tracking**.

### Markets dashboard — by cluster

Primary view groups markets by event cluster:

- **Cluster: 2026 US Midterms**
  - Senate AZ — long DEM at 0.42, mark 0.46, +$X.
  - Senate OH — short DEM at 0.55, mark 0.51, +$Y.
  - House CA-22 — long REP at 0.48, mark 0.45, –$Z.
  - Cluster aggregate P/L.
  - Cluster correlation note — these markets share a common factor (national environment).

A secondary view groups by resolution-date window for capital-planning.

### Per-market live state

For each active position:

- **Current price** with depth.
- **My entry** vs current.
- **Days to resolve** countdown.
- **Recent volume / OI changes** — informational.
- **News attached** to this market.
- **Resolution-source state** — for data prints, the official source is being monitored.

### Live PnL — prediction-market decomposition

- **Realized today** (positions closed).
- **Unrealized per market** — per outcome scenario.
- **By cluster / theme.**
- **By venue.**
- **Capital deployed vs available.**
- **Days-locked-up profile** — how much capital is tied up for how long.

### Risk panel

- **Aggregate exposure if YES events occur** vs **if NO events occur** — basket scenario PnL.
- **Per-cluster scenario PnL** — "if Trump wins nomination, all Trump-related markets resolve YES."
- **Correlation cluster risk** — markets that should be uncorrelated drifting toward correlation.
- **Concentration risk** — top markets by capital deployed.
- **Venue concentration** — too much on Polymarket?
- **Resolution-risk concentration** — too many markets resolved by same oracle/committee?
- **Liquidity profile** — % of book in deep markets vs thin.
- **Capital-lockup profile** — liquidity-of-account over time.
- **Counterparty risk** — Polymarket smart contract, Kalshi DCO, exchange custodial risk.
- **Stress scenarios** — Polymarket exploit, Kalshi regulatory action, oracle manipulation.

### Resolution-source monitor

The most prediction-market-specific surface:

- **Live feeds from official sources** — BLS API for CPI, Fed for FOMC, election-night results from AP, government APIs for legislation.
- **Pre-resolution window alerts** — final 24–72h before resolution often see crystallization.
- **Resolution-dispute monitor** — for on-chain markets, ongoing UMA disputes flagged.

### News / information feeds — cluster-attached

- News filtered to active markets / clusters.
- Domain-expert feeds (analysts, academics, journalists, OSINT).
- Polling release schedule for political markets.
- Data release calendar for econ markets.

### Cross-venue price monitor

- For multi-venue markets, the spread between venues over time.
- Arb-opportunity flags when spread > cost.

### Alerts

- **Price-cross alerts** per market.
- **Information-arrival alerts** — major news on a name / cluster.
- **Resolution-proximity alerts** — T-7, T-1, T-0.
- **Cross-venue arb alerts.**
- **Resolution-dispute alerts** — UMA challenge on an active market.
- **Venue / regulatory alerts** — Polymarket contract incident, Kalshi regulatory news.
- **Polling release alerts** — new poll matters more than market price for politics.
- **Whale movement alerts** — large on-chain positions opened/closed.
- **Risk limit alerts.**

### Trade journal — market journal

Per market / cluster:

- Thesis at entry.
- Probability estimate with sources.
- Key inputs (poll, model, expert call).
- Updates as info arrives.
- Decision points (add / trim / hedge / exit).
- Reviewed weekly + post-resolution.

### Communications

- **Domain-expert chat** (politics analysts, AI researchers, weather forecasters).
- **Venue-specific Telegram / Discord** for community color.
- **Internal research team** notes attached to clusters.

### Heatmap

- Markets sized by capital deployed × today's P/L move, grouped by cluster.

### Kill switches

- **Reduce cluster exposure** — algo unwind.
- **Close venue exposure** — flatten on Polymarket or Kalshi.
- **Pause new entries.**
- **Cancel all working orders.**

**Layout principle for Hold:** cluster-grouped positions + resolution-source monitor + information feeds. Cross-venue prices peripheral but always present.

---

## Phase 4: Learn

Prediction-market post-trade emphasizes **probability calibration**, **edge-source attribution**, **resolution outcomes vs estimates**.

### Resolution outcomes log

Every resolved market gets a record:

- **Aria's pre-resolution probability estimate** vs market price vs realized outcome.
- **Confidence at entry** (high / medium / speculative).
- **P/L on the position.**
- **Edge source** — which input drove the thesis (model, poll, expert call, structural bias, arb).
- **Lessons** — what worked, what didn't, what would she change.

### PnL attribution

- **By cluster / theme** — politics, economics, geopolitics, tech, sports, weather.
- **By edge source** — model edge vs polling edge vs expert-network edge vs arb vs structural bias.
- **By venue.**
- **By time horizon** — short-resolution markets vs long-resolution.
- **By confidence tier** — did high-confidence trades pay more than low?

### Probability calibration

The most important post-trade metric:

- **Calibration curve:** of all positions where Aria said "70% YES," did 70% resolve YES?
- **Decomposed by edge source** — model calibration, polling calibration, expert-network calibration.
- **Drift over time** — improving or degrading calibration?
- **Brier score** — proper scoring rule for probability forecasts.

### Edge-source analytics

- **Model edge** — when Aria followed model output, what was the realized edge?
- **Polling edge** — for political markets, polling-aggregator-derived edge.
- **Expert-network edge** — when did expert calls add alpha?
- **Structural-bias edge** — markets where retail systematically over/under-priced.
- **Arb edge** — cross-venue mispricings captured.

### Cross-venue analytics

- **Per-venue P/L.**
- **Per-venue execution quality** — fill vs mid.
- **Bridge cost paid YTD** for cross-chain trades.
- **Account health per venue** — limits, restrictions, stake caps.

### Resolution-quality analytics

- **Resolution disputes encountered** — how many, what outcome.
- **Ambiguous resolutions** — where Aria's interpretation differed from oracle/committee.
- **Resolution delays** — capital locked beyond expected.

### Behavioral analytics

- **Conviction inflation** — does Aria's confidence rise too quickly with confirming evidence?
- **Recency bias** — over-weighting recent polls / news.
- **Over-trading thin markets** — chasing signal in low-liquidity markets where slippage eats edge.
- **Resolution-window discipline** — did she trim before resolution or hold to settle?

### Performance metrics

- ROI per stake (turnover-based).
- Sharpe of daily mark-to-market.
- Hit rate by confidence tier.
- **Yield by cluster.**
- **Brier score over time.**

### Reports

- Daily P/L commentary (cluster-tagged).
- Weekly portfolio review.
- Monthly attribution by cluster / venue / edge-source.
- Quarterly investor / committee letter (theme + cluster narratives).
- Compliance per venue / jurisdiction.

**Layout principle for Learn:** calibration curves + edge-source attribution are foveal. Resolution-outcome log is the running corpus she returns to. Pattern-recognition across clusters drives next quarter's allocation.

---

## What Ties Aria's Terminal Together

1. **Markets are first-class objects.** Every position attached to a specific market, with resolution criteria, source, and date.
2. **Probability is the price.** Quotes, charts, and analytics are probability-quoted; $ value is derived.
3. **Cross-venue price discovery is mandatory.** Same event listed on multiple venues = different prices = trade structure.
4. **Resolution-source monitoring is foveal.** The official body / oracle / API that decides outcome must be live-watched, not assumed.
5. **Research workspace is part of the trading terminal.** Models, polls, expert-network notes, source tracking — all in-platform.
6. **Resolution risk is first-class.** Resolution disputes, ambiguous criteria, oracle health are tracked alongside market risk.
7. **Capital-lockup awareness.** Capital tied up for weeks or months has opportunity cost; the terminal tracks this.
8. **Calibration is the truest edge metric.** P/L can be noise; Brier score / calibration curve is the signal.
9. **Cluster thinking, not market-by-market.** Markets that share a common factor are managed as a cluster.
10. **Multi-venue + multi-jurisdiction native.** On-chain and regulated venues operate with different UX, different settlement, different risk.

---

## How to Use This Document

When evaluating any prediction-market terminal (including our own), walk through Aria's four phases and ask:

- Are markets first-class objects with criteria, source, date, and live state?
- Is probability the primary quoting unit?
- Is cross-venue price discovery surfaced for multi-venue events?
- Is resolution-source state monitored (oracle health, official feed, dispute status)?
- Is research workspace (models, polls, expert notes) integrated?
- Is capital-lockup tracked alongside P/L?
- Is calibration / Brier-score reported as the truest edge metric?
- Is cluster-level risk visible (correlation across related markets)?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.
