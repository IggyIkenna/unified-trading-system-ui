# Trader Archetype — Aria Kapoor (Senior Prediction Markets / Event-Research Trader)

A reference profile of a top-performing prediction-markets and event-research trader at a top-5 firm. Used as a yardstick for what an ideal **prediction-market / event-research** terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For shared platform surfaces (charting, tickets, blotters, risk, journal, alerts, layout, etc.) see [common-tools.md](common-tools.md). For Aria's unique surfaces, see [unique-tools.md](unique-tools.md). For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md). For the live-event sister archetype, see [trader-archetype-diego-live-event.md](trader-archetype-diego-live-event.md).

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

- **Every contract resolves at 0 or 100.** Her job is to estimate probability and trade the edge.
- **The hardest part isn't pricing — it's resolution.** Did the contract criteria actually trigger? Resolution disputes can dwarf market risk.
- **Edge sources are radically diverse:** polling models (politics), satellite imagery (commodities, conflict), expert networks, structural biases (most markets are retail-leaning), cross-venue mispricings.
- **Markets are highly fragmented** across venues with regulatory differences (Polymarket = on-chain, Kalshi = CFTC-regulated, Smarkets = UK-regulated, Betfair = UK exchange). Same event, different prices.
- **Liquidity is event-shaped.** Major events (US Presidential, Super Bowl, FOMC) have deep books; long-tail markets have $5k depth.
- **Time decay is informational.** The closer to resolution, the more information is in the price; her edge typically shrinks as event approaches unless she has private info.
- **Market design matters.** Resolution mechanism (oracle, regulated body, contract committee), tie-breakers, ambiguity-handling — these determine whether a "right" thesis pays.

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

Each market is a first-class object. The pipeline shows every market she's tracking, with one row per market:

| Field               | Detail                                                                          |
| ------------------- | ------------------------------------------------------------------------------- |
| Market title        | e.g. "Will Fed cut rates at June 2026 FOMC?"                                    |
| Venue(s)            | Polymarket, Kalshi, both, etc.                                                  |
| Current YES price   | Probability ($0.01 – $0.99)                                                     |
| Fair-price estimate | Aria's model output                                                             |
| Edge                | Fair vs market in basis points / probability points                             |
| Position            | Current size, side, average entry                                               |
| P/L                 | Realized + unrealized                                                           |
| Resolution date     | Days remaining countdown                                                        |
| Resolution source   | UMA oracle, Kalshi committee, BLS API, AP election results, exchange settlement |
| Confidence tier     | high / medium / speculative                                                     |
| Status              | researching / sized / scaling / monitoring / scaling-back / resolved            |

Pipeline supports filter-by-cluster (politics, econ, geopolitics, tech, weather, sports, crypto-native), filter-by-venue, filter-by-resolution-window (this week / month / quarter / year), and sort-by-edge / sort-by-conviction / sort-by-capital-deployed.

### Active market deep-dive

When she focuses on one market, the surface fans out:

- **Market description** — full criteria, exact resolution wording, tiebreakers, edge cases (what if criteria is ambiguous?).
- **Resolution mechanism** — oracle (UMA for Polymarket, with stake size + dispute window), CFTC contract committee (Kalshi, with adjudication history), exchange settlement (Smarkets, Betfair), government API (BLS, Fed FRED, AP election feed).
- **Resolution edge cases** — Aria's notes on ambiguity, related-contract disputes, prior precedent.
- **Price chart** of the YES contract since listing, with volume + open-interest time series and recent trades tape.
- **Fair-price model output** with full breakdown: which inputs (poll, model, expert estimate, base rate) contributed how many probability points, and current vs prior estimate.
- **Cross-venue price** for the same event with depth per venue.
- **Linked research workspace** for the market's domain (see below).
- **Position state** — current size, average entry, unrealized P/L, max-payout-if-right.

### Cross-venue pricing dashboard

For events listed on multiple venues, a dedicated dashboard:

- **Same event, multiple prices** — Polymarket, Kalshi, Smarkets, Betfair side-by-side, with timestamps.
- **Spread in probability points** between best venues, with historical spread chart.
- **Liquidity per venue** — depth at top of book, depth at $5k / $25k / $100k notional, and decay rate.
- **Account / regulatory access** — can Aria trade this venue from her jurisdiction? (geo, KYC, position limit state)
- **Implementation cost** — bridging stables, gas, account funding, regulatory friction, time to settle each leg.
- **Net edge after costs** — flag whether the spread is genuinely tradeable.
- **Historical convergence** — for prior similar events, how did multi-venue spreads behave into resolution?

### Resolution-source monitor

The most prediction-market-specific surface. For every active market:

- **Resolver identity** — UMA oracle, Kalshi contract committee, exchange settlement, government API, election-night feed (AP, Edison Research), committee decision (FOMC, Nobel committee, IOC).
- **Live source feed** — BLS API for CPI / NFP, Fed FRED for FOMC dot-plot, government APIs for legislative status, AP election feed on election nights, oracle on-chain state for Polymarket UMA proposals + dispute windows.
- **Resolution criteria specificity** — exact wording stored verbatim; a single ambiguous word can flip a market.
- **Recent disputes on similar contracts** — UMA dispute history, Kalshi adjudication precedent.
- **Resolution timing** — same-day, T+1, T+5? Capital lock-up matters.
- **Oracle staking / dispute mechanism** — for on-chain markets, who challenges, what's the cost, current proposal state (proposed / disputed / resolved).
- **Pre-resolution window alerts** — final 24–72h before resolution often see crystallization.

### Resolution-dispute tracker

Distinct surface, since disputes can dwarf market risk:

- **Active disputes** — UMA challenges in flight on her positions, Kalshi adjudications pending.
- **Dispute outcome history** for similar criteria.
- **Capital-at-risk per dispute** — her position size × probability of unfavorable adjudication.
- **Time-to-resolution-of-dispute** — how long until capital is freed.

### Domain research workspaces per market type

Aria has the most-diverse research surface set on the floor — each market type opens a workspace tuned to its information shape:

**Politics / elections:**

- **Polling aggregators** — Nate Silver / Silver Bulletin, FiveThirtyEight legacy, Cook Political Report ratings, Sabato's Crystal Ball, RealClearPolitics averages, Economist model.
- **Polling history per race** — bias-adjusted by pollster (house effects), trend lines, dispersion bands, recency-weighted averages.
- **Demographic / district analysis** — partisan-lean (Cook PVI), turnout history, registration shifts, redistricting changes.
- **FEC fundraising data** — quarterly totals, burn rate, cash-on-hand, ad-buy disclosures.
- **Endorsement tracker** — newspapers, party leaders, key constituencies, prediction-market reaction.
- **Election models** — multiple ensemble (538, Economist, custom), with input weightings and update cadence.
- **Historical base rates** — incumbent re-elect rates, generic-ballot to seat-share translation, primary outcomes by polling-lead, convention bumps.
- **Live election-night view** — county-by-county results vs expected, with implied probability shifts as bellwethers report.

**Economic data (CPI, NFP, GDP, FOMC):**

- **Consensus + dispersion of forecasts** — Bloomberg / Reuters survey median, range, top vs bottom forecasters' track records.
- **Nowcasting models** — Atlanta Fed GDPNow, NY Fed Nowcast, Cleveland Fed inflation nowcast, St. Louis Fed indicators, with revision history.
- **High-frequency indicators** — credit-card spending (Chase, BAC), mobility (Apple, Google), shipping (Cass, Drewry), job postings (Indeed), gasoline demand.
- **Recent surprise pattern** — Citi Economic Surprise Index, surprise consistency by data series, asymmetric reaction sizes.
- **Implied probability from rates / equities** — Fed funds futures, OIS curve, equity reaction-function residuals — vs prediction-market price (the cross-asset arb).
- **Release calendar** with embargoed-window protocol and source-feed health checks.

**Geopolitical (war, sanctions, treaties):**

- **Conflict tracker** — ACLED event database, Stratfor-style situation reports, Council on Foreign Relations Global Conflict Tracker.
- **Open-source intelligence (OSINT) feeds** — curated X / Twitter accounts, Bellingcat reports, satellite imagery providers (Planet, Maxar) for troop movement / damage assessment.
- **Diplomatic calendar** — UN Security Council votes, EU Council summits, G7 / G20 meetings, NATO ministerials, bilateral state visits.
- **Expert opinion** — think-tank publications (Brookings, RAND, IISS, Carnegie, ECFR), academic Twitter, scholar-led Substacks.
- **Historical base rates** — ceasefire durability, regime-change frequency by region/decade, coup outcome distributions, sanctions efficacy.
- **Sanctions / treaty trackers** — OFAC SDN updates, EU sanctions lists, treaty ratification status by country.

**Tech / AI:**

- **Model release tracker** — lab announcements (OpenAI, Anthropic, Google, Meta, xAI, DeepSeek), leaks, training-compute estimates, release-date-shift history.
- **Benchmark scorecards** — HumanEval, MMLU, ARC-AGI, SWE-bench, GPQA, MATH, with leaderboard movement and contamination-flag history.
- **Patent / lawsuit databases** — USPTO filings, PACER docket monitoring (NYT v OpenAI, Authors Guild, etc.), settlement vs trial expectation.
- **Research preprints** — arxiv (cs.LG, cs.CL), Hugging Face papers, Semantic Scholar alerts on tracked research questions.
- **Insider sources** — Discord communities, X lists, Substack subscriptions (Stratechery, Interconnects, Import AI), curated researcher accounts.
- **Compute / supply-chain context** — TSMC / SK Hynix / Nvidia earnings, datacenter announcements, power-grid constraints in tracked regions.

**Weather / climate:**

- **Forecast aggregators** — multiple weather models (GFS, ECMWF, ICON, UKMET) with ensemble spread and skill scores by lead time.
- **Historical climatology** — 30-year normals, percentile bands, analog years.
- **Satellite data** — NOAA GOES, EUMETSAT, polar orbiter snapshots; cloud-cover, sea-surface temperature, snow-cover anomaly.
- **ENSO indicators** — ONI, MEI, SOI, with phase classification and historical-analog impact on tracked contracts.
- **Climate / disaster trackers** — hurricane (NHC), wildfire (NIFC), flood (USGS) status feeds for resolution-relevant events.
- **Energy-weather crossover** — HDD / CDD forecasts vs prediction-market temperature contracts, with utility-load implications.

**Sports (pre-event prediction-market form):**

- Crossover with Diego's research — form data, advanced statistics, models.
- For tournament outcomes (World Cup winner, NBA Finals MVP), team-level Monte Carlo with bracket simulation and per-leg implied odds.

**Crypto-native (token launches, forks, governance):**

- On-chain governance dashboards (Snapshot, Tally), token unlock calendars, protocol roadmap commitments, foundation treasury state.

### Calibration curve & Brier score (live preview)

Even in Decide phase, Aria checks her calibration before sizing — see [#23 Performance Metrics](common-tools.md#23-performance-metrics). **Aria-specific:** Brier score is the primary edge metric (not P/L); calibration curve is segmented by edge source (model, polling, expert, structural, arb), and current-quarter calibration is shown live so over-confidence in a hot streak is visible at sizing time.

### Capital-lockup profile

A heat-map by week/month of capital-locked-until-resolution across the entire portfolio. Aria uses this to avoid concentrating expiry dates and to keep dry powder for high-edge late-listed markets.

### Catalyst calendar

See [#12 Catalyst / Event Calendar](common-tools.md#12-catalyst--event-calendar). **Aria-specific characteristics:**

- Pre-resolution windows surfaced as primary objects (T-7, T-72h, T-24h, T-1h, T-0).
- Polling release schedule (politics) and data release schedule (econ) embedded.
- Expected resolution-source feed times (BLS 8:30 ET, FOMC 14:00 ET, AP race calls rolling on election nights).

### News & domain feeds

See [#13 News & Research Feed](common-tools.md#13-news--research-feed). **Aria-specific characteristics:**

- Cluster-attached filtering (news routes to clusters / markets, not just symbols).
- Domain-expert feeds first-class (analysts, academics, journalists, OSINT).
- Crypto Twitter / Polymarket Telegram / Kalshi Discord channels for community color.
- "Sharp" vs retail-bias indicators — markets that skew retail-optimistic on hometown teams or popular candidates.
- Whale-wallet alerts (on-chain) — public addresses with large prediction-market positions.

### Charting

See [#1 Multi-Timeframe Charting](common-tools.md#1-multi-timeframe-charting). **Aria-specific characteristics:** YES-probability plotted on $0.01–$0.99 axis (not log price); volume + OI overlays; cross-venue price overlay for the same event; calendar markers for resolution date and pre-resolution windows.

### Macro context

Embedded reference panel: Fed expectations (rates markets), equity / commodity markets, DXY / risk-on-off — for adjacent and FOMC-related contracts.

**Layout principle for Decide:** markets pipeline + active research workspace are foveal. Cross-venue dashboard always visible. Calendar of resolutions structures attention.

---

## Phase 2: Enter

Prediction-market entry is **probability-quoted**, **multi-venue native**, and **resolution-aware**.

### Probability-quoted single-market ticket

Order-ticket framing differs enough from price-quoted instruments to be a unique surface (see [unique-tools.md](unique-tools.md)):

- **Side: YES / NO.**
- **Stake / size** — most venues quote "shares" worth $1 if right; price is probability ($0.01–$0.99).
- **Limit price (probability)** or market.
- **Pre-trade preview** (extends [#3 Pre-Trade Risk Preview](common-tools.md#3-pre-trade-risk-preview)):
  - Cost (stake).
  - Max payout (if right).
  - Implied edge (fair price vs entry, in probability points).
  - Days to resolution + capital lock-up duration.
  - Venue fees / gas / bridging cost.
  - Position-after-fill against per-cluster + per-venue limits.

### Cross-venue execution router

When the same event is listed on multiple venues, a dedicated router (extends [#5 SOR](common-tools.md#5-smart-order-router--multi-venue-aggregation)):

- **Best price aggregation** — top bid/ask per venue, combined depth.
- **Smart routing** — split order across venues to minimize impact.
- **Atomic legs** for arbitrage: buy YES on Venue A at $0.45, buy NO on Venue B at $0.50 → guaranteed $0.05 profit.
- **Bridging awareness** — capital may need to move between venues; preview bridge cost + time.
- **Account-state checks** per venue (KYC, geo, position limits, USDC approval state).
- **Leg-out risk** — for sequenced cross-chain arbs, max-loss if one leg fills and the other moves.

### Triangular-arb detector

Continuously scans for 3+ venue mispricings that imply guaranteed profit:

- **Detected opportunity feed** with implied $-edge and required capital per leg.
- **Proposed execution path** with sequenced legs and atomic-where-possible flags.
- **One-click stage** → manual confirm → execute, with leg-status live.
- **Realized vs proposed edge** post-execution.

### Basket / cluster ticket

For event clusters (e.g. all 50 US Senate races, every CPI print this year, every FOMC meeting):

- **Build a basket** of related markets.
- **Size by conviction or by model edge** — auto-suggest weights from model output.
- **Cross-correlation aware** — these markets are not independent; UI shows portfolio-level scenario P/L (national-environment shift, single-pollster-bias scenario).
- **Rebalance triggers** — model output update → suggested basket rebalance with diff view.
- **Cluster execution** — sequenced or parallel orders with leg-status tracking.

### Hedge ticket

For positions she wants to hedge:

- **Buy NO of the same market** at later date if YES-direction has moved.
- **Cross-venue hedge** — long YES on Polymarket (cheaper), short YES on Kalshi (more expensive).
- **Cross-market hedge** — if "Will Trump win nomination?" YES is in book, hedge with "Will Trump be Republican nominee?" NO on another venue (similar but not identical contracts) with linkage notes.

### Algos

See [#4 Execution Algos Library](common-tools.md#4-execution-algos-library). **Aria-specific characteristics:**

- TWAP / scaled entry tuned for thin prediction-market depth (default child-order $5k–$25k notional).
- Liquidity-seeking — sit passive, cross only when price reaches level.
- Limit-spread orders — bid/offer placement to capture spread on long-tail markets.
- Resolution-window algos — accelerate or defer trades as resolution approaches.

### Position sizing — Kelly / fractional-Kelly calculator

Inline sizing tool, distinct from generic risk previews:

- **Kelly criterion calculator** — optimal stake given edge and bankroll.
- **Fractional Kelly preset** — 1/4 Kelly default for risk management; 1/2 Kelly for high-confidence; 1/8 Kelly for speculative.
- **Conviction-adjusted sizing** — high-conviction multiplier; speculative cap.
- **Capital-lockup-adjusted sizing** — penalize positions with long lockup against opportunity-cost shadow rate.
- **Cluster-correlation discount** — if 6 markets in the cluster already sized, mark down marginal Kelly for the 7th.

### On-chain wallet management (Polymarket and similar)

Distinct surface, since on-chain UX has structural risks regulated venues don't:

- **Wallet selector** — multiple wallets for diversified counterparty + tax-lot segregation.
- **Gas strategy** — base fee + priority tip with congestion estimate.
- **Slippage tolerance** for AMM-based markets.
- **Approval management** — USDC approvals tracked, scoped, and time-limited; revoke flow surfaced.
- **Simulation pre-send** — fork simulation showing exact outcome before broadcast.
- **Bridge state** — stablecoin balances per chain, in-flight bridges, expected settlement times.

### Regulated-venue-specific (Kalshi, PredictIt)

- **Geo / KYC checks** — residency status determines access.
- **Position limits** — Kalshi imposes per-contract caps; per-aggregate caps tracked.
- **Margin / cash requirements.**
- **Settlement workflow** — cleared via DCO.

### Hotkeys

See [#6 Hotkey System](common-tools.md#6-hotkey-system). **Aria-specific characteristics:** Buy YES at offer / Buy NO at offer (focused market), cancel-all-on-market, hedge-to-flat, switch-focus-to-next-market-in-queue.

**Layout principle for Enter:** ticket is venue-aware (on-chain UX vs regulated UX adapt automatically). Cross-venue routing is a first-class workflow. Sizing tools (Kelly, conviction) are inline.

---

## Phase 3: Hold / Manage

Aria's positions move with information arrival, not by mark-to-market noise. Her Hold surface emphasizes **information events**, **resolution proximity**, and **cross-venue price tracking**.

### Markets dashboard — by cluster

Primary view groups markets by event cluster. See [#7 Positions Blotter](common-tools.md#7-positions-blotter). **Aria-specific characteristics:**

- Cluster-level aggregation (e.g. 2026 US Midterms cluster, 2026 FOMC path cluster, AGI-by-2027 cluster, Atlantic hurricane cluster).
- Per-row: market title, entry, mark, days-to-resolve, P/L, conviction.
- Cluster aggregate P/L + cluster correlation note (shared common factor — national environment, Fed path, etc.).
- Secondary view: group by resolution-date window for capital planning.

### Per-market live state

For each active position: current price + depth, entry vs current, days-to-resolve countdown, recent volume / OI changes, news attached, resolution-source state.

### Live PnL — prediction-market decomposition

See [#9 Live PnL Panel](common-tools.md#9-live-pnl-panel). **Aria-specific characteristics:**

- Per-outcome scenario (YES vs NO) unrealized.
- By cluster / theme / venue.
- Capital deployed vs available.
- Days-locked-up profile — how much capital tied up for how long.

### Risk panel

See [#10 Risk Panel](common-tools.md#10-risk-panel-multi-axis). **Aria-specific characteristics:**

- Aggregate exposure if YES events occur vs if NO events occur (basket scenario P/L).
- Per-cluster scenario P/L — "if Trump wins nomination, all Trump-related markets resolve YES."
- Correlation cluster risk — markets that should be uncorrelated drifting toward correlation.
- Concentration risk — top markets by capital, top venues, top resolvers.
- Capital-lockup profile — liquidity-of-account over time.

### Counterparty / venue risk dashboard

Distinct surface, since prediction-market counterparty failure modes are unusual:

- **Polymarket smart-contract risk** — contract version, audit status, TVL, recent governance actions, oracle integration health.
- **Kalshi DCO risk** — clearing house status, regulatory posture, recent CFTC filings.
- **Exchange custodial risk** — Smarkets, Betfair balance state, withdrawal latency, recent operational incidents.
- **Resolution-source concentration** — too many markets resolved by the same UMA proposer or Kalshi committee.
- **Stress scenarios** — Polymarket exploit, Kalshi regulatory action, oracle manipulation, exchange operational halt.

### Stress

See [#11 Stress / Scenario Panel](common-tools.md#11-stress--scenario-panel). **Aria-specific characteristics:** election-night cascade, FOMC surprise, geopolitical-shock spillover across clusters, single-oracle-failure scenario.

### Resolution-source monitor (live)

The Phase-1 resolver inventory becomes live in Phase 3:

- Live feeds from BLS / Fed / FRED / AP / Edison / oracle on-chain state.
- Final-window crystallization alerts (T-72h, T-24h, T-1h).
- Resolution-dispute monitor — UMA challenges in flight, Kalshi adjudications pending, with capital-at-risk per dispute.

### News / information feeds — cluster-attached

See [#13 News & Research Feed](common-tools.md#13-news--research-feed). **Aria-specific characteristics:** filtered to active markets / clusters; domain-expert feeds; polling release schedule; data release calendar.

### Cross-venue price monitor

For multi-venue markets, the spread between venues over time, with arb-opportunity flags when spread > cost.

### Alerts

See [#14 Alerts Engine](common-tools.md#14-alerts-engine). **Aria-specific characteristics:**

- Price-cross alerts per market (probability levels, not $ levels).
- Information-arrival alerts — major news on a name / cluster.
- Resolution-proximity alerts — T-7, T-1, T-0.
- Cross-venue arb alerts.
- Resolution-dispute alerts — UMA challenge on an active market.
- Venue / regulatory alerts — Polymarket contract incident, Kalshi regulatory news.
- Polling release alerts — new poll matters more than market price for politics.
- Whale movement alerts — large on-chain positions opened/closed.

### Trade journal — market journal

See [#15 Trade Journal](common-tools.md#15-trade-journal). **Aria-specific characteristics:**

- Per-market and per-cluster threads.
- Thesis at entry, probability estimate with sources, key inputs (poll, model, expert call).
- Updates as info arrives; decision points (add / trim / hedge / exit).
- Reviewed weekly + post-resolution; resolved-market entries become the calibration corpus.

### Communications

See [#17 Communications Panel](common-tools.md#17-communications-panel). **Aria-specific characteristics:** domain-expert chat (politics analysts, AI researchers, weather forecasters), venue-specific Telegram / Discord, internal research team notes attached to clusters.

### Heatmap

See [#16 Heatmap of Own Book](common-tools.md#16-heatmap-of-own-book). **Aria-specific characteristics:** markets sized by capital deployed × today's P/L move, grouped by cluster.

### Kill switches

See [#19 Kill Switches](common-tools.md#19-kill-switches-granular). **Aria-specific characteristics:** reduce cluster exposure (algo unwind), close venue exposure (flatten on Polymarket or Kalshi), pause new entries, cancel-all-working-orders.

**Layout principle for Hold:** cluster-grouped positions + resolution-source monitor + information feeds. Cross-venue prices peripheral but always present.

---

## Phase 4: Learn

Prediction-market post-trade emphasizes **probability calibration**, **edge-source attribution**, **resolution outcomes vs estimates**.

### Resolution outcomes log

Every resolved market gets a record:

- Aria's pre-resolution probability estimate vs market price vs realized outcome.
- Confidence at entry (high / medium / speculative).
- P/L on the position.
- Edge source — which input drove the thesis (model, poll, expert call, structural bias, arb).
- Lessons — what worked, what didn't, what would she change.

This log is the running corpus that feeds the calibration curve and edge-source attribution.

### Calibration curve & Brier score (post-trade)

Aria's primary edge metric:

- **Calibration curve** — of all positions where she said "70% YES," did 70% resolve YES? Bucketed at 5 / 10 / 25 / 50 / 75 / 90 / 95% bins.
- **Decomposed by edge source** — model calibration vs polling calibration vs expert-network calibration vs structural-bias calibration vs arb.
- **Drift over time** — improving or degrading calibration? Rolling-window vs full-history.
- **Brier score** — proper scoring rule; tracked by quarter, by cluster, by venue, by confidence tier.
- **Comparison to market-implied calibration** — did she beat the market's own implied calibration on the days she traded?

### PnL attribution

See [#22 PnL Attribution](common-tools.md#22-pnl-attribution-multi-axis). **Aria-specific characteristics:**

- By cluster / theme — politics, economics, geopolitics, tech, sports, weather.
- By edge source — model edge vs polling edge vs expert-network edge vs arb vs structural bias.
- By venue.
- By time horizon — short-resolution markets vs long-resolution.
- By confidence tier — did high-confidence trades pay more than low?

### Edge-source analytics

- **Model edge** — when Aria followed model output, what was the realized edge?
- **Polling edge** — for political markets, polling-aggregator-derived edge; pollster-house-effect attribution.
- **Expert-network edge** — when did expert calls add alpha?
- **Structural-bias edge** — markets where retail systematically over/under-priced.
- **Arb edge** — cross-venue mispricings captured.

### Cross-venue analytics

- Per-venue P/L.
- Per-venue execution quality (fill vs mid).
- Bridge cost paid YTD for cross-chain trades.
- Account health per venue — limits, restrictions, stake caps.

### Resolution-quality analytics

- Resolution disputes encountered — how many, what outcome.
- Ambiguous resolutions — where Aria's interpretation differed from oracle/committee.
- Resolution delays — capital locked beyond expected.

### TCA

See [#25 Execution Quality / TCA](common-tools.md#25-execution-quality--tca-transaction-cost-analysis). **Aria-specific characteristics:** fill quality vs mid in probability points (not bps); bridge / gas cost as part of TCA; cross-venue best-execution comparison.

### Behavioral analytics

See [#26 Behavioral Analytics](common-tools.md#26-behavioral-analytics). **Aria-specific characteristics:**

- Conviction inflation — does confidence rise too quickly with confirming evidence?
- Recency bias — over-weighting recent polls / news.
- Over-trading thin markets — chasing signal in low-liquidity markets where slippage eats edge.
- Resolution-window discipline — did she trim before resolution or hold to settle?

### Performance metrics

See [#23 Performance Metrics](common-tools.md#23-performance-metrics). **Aria-specific characteristics:** ROI per stake (turnover-based), Sharpe of daily mark-to-market, hit rate by confidence tier, yield by cluster, Brier score over time as the headline metric.

### Equity curve

See [#24 Equity Curve](common-tools.md#24-equity-curve). **Aria-specific characteristics:** segmented by cluster and by venue; resolution events marked on the curve; drawdowns annotated with the cluster that caused them.

### Reports

See [#27 Reports](common-tools.md#27-reports). **Aria-specific characteristics:** daily P/L commentary (cluster-tagged), weekly portfolio review, monthly attribution by cluster / venue / edge-source, quarterly investor / committee letter (theme + cluster narratives), compliance per venue / jurisdiction.

### Compliance & tagging

See [#28 Compliance & Audit Trail](common-tools.md#28-compliance--audit-trail) and [#29 Strategy Tagging Framework](common-tools.md#29-strategy-tagging-framework). **Aria-specific characteristics:** jurisdiction tagging (US-resident vs non-US contracts), per-venue regulatory regime (CFTC, FCA, on-chain), market-type and edge-source tags.

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
- Is research workspace (models, polls, expert notes) integrated, with per-market-type depth (politics / econ / geopolitics / tech / weather)?
- Is capital-lockup tracked alongside P/L?
- Is calibration / Brier-score reported as the truest edge metric?
- Is cluster-level risk visible (correlation across related markets)?
- Are Kelly / fractional-Kelly sizing tools inline at ticket time?
- Is on-chain wallet management (gas, approvals, simulation, bridge state) treated as first-class?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.

# Automated Mode

This appendix describes Aria's terminal and daily workflow once her edge is encoded into models, monitors, and rules running across hundreds of prediction-market contracts simultaneously — what she does, what she sees, and what stays human. The manual sections above describe Aria at her desk hand-modeling a few dozen high-conviction markets at a time. This appendix describes the same Aria running cross-venue arb scanners across thousands of contracts, polling-vs-market models for every congressional and gubernatorial race, calibration trackers per edge source, and resolution-source monitors on every official feed she touches — while resolution-criteria interpretation and edge-source weighting remain hers.

The strategy logic itself (which polling adjustments, which forecasting models, which resolution-precedent calls — the actual alpha) is out of scope. This appendix is about **the terminal she works in**: every surface she sees, every panel, every decision she makes, every workflow that supports her.

For the universal automated-trading platform concepts this builds on, see [automation-foundation.md](automation-foundation.md). For the structural template every appendix follows, see [automation-archetype-template.md](automation-archetype-template.md). For the worked example demonstrating depth and voice, see [trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md).

Aria sits in the **mostly-judgment-but-heavily-modeled** tier. Her edge — cross-venue arb, polling-vs-market mispricings, calibration-driven sizing, basket-by-confidence allocation, resolution-window momentum — translates into rules and models cleanly when the **resolution criteria are unambiguous**. When criteria are ambiguous, when an oracle dispute is pending, when a polling aggregator pivots its house-effect model mid-cycle, when a Kalshi committee precedent is being set — the model is a scaffold and the trader is the alpha. The platform's job is to make the scaffold rich enough that her judgment compounds across hundreds of markets instead of dozens.

> _Throughout this appendix, examples are illustrative — actual venue lists, model IDs, dataset names, feature names, polling-aggregator references, and metrics shown are sample shapes to make the surfaces concrete. The platform's real catalog will differ._

## 1. What Aria's Edge Becomes

Her manual edge encoded as automated **strategy classes** plus **support tools**. Unlike Marcus, where the strategy classes are themselves alpha generators, several of Aria's classes are scaffolds — they surface opportunities, monitor resolution sources, track calibration — and Aria pulls the trigger. Other classes are pure-mechanical (cross-venue arb when costs are below spread, basket-rebalance against a model output) and run unattended within risk caps. The mix is the point.

- **Cross-venue arb scanners.** Continuous Polymarket / Kalshi / Smarkets / Betfair scan for the same event listed on multiple venues at meaningful spread (after gas, bridging, fees, KYC friction, regulatory access). Auto-stage atomic-where-possible legs; for sequential legs, leg-out-risk computed and surfaced. Hundreds of instances across event domains × venue pairs × contract pairs (including near-equivalent contracts where the wording difference matters). Aria approves each high-stakes execution; below a threshold, the scanner executes within risk caps and notifies.
- **Polling-vs-market models (politics).** For every active political race with a market, an ensemble model (538-style, Economist-style, plus internal house-effect-adjusted) emits a fair-probability estimate. The model rebuilds when a new poll lands; market-vs-fair edge is z-scored against the per-race historical distribution. Hundreds of races (US House × 435, Senate, governorships, primaries, plus international: UK, Canada, India, Brazil, France, Germany). Aria tunes the per-pollster house-effect priors and approves the per-race recalibration when a structural change happens (redistricting, mid-cycle scandal).
- **Forecast-model-vs-market models (economics).** For every CPI / NFP / GDP / FOMC contract, a nowcast ensemble (Atlanta Fed GDPNow, NY Fed Nowcast, Cleveland Fed inflation nowcast, internal high-frequency-indicator composite) produces a fair-probability distribution over the contract's resolution bins. Comparison to the Kalshi / Polymarket implied probability surfaces the edge. Dozens of instances per release cycle.
- **Calibration-driven sizing strategies.** Per-edge-source and per-cluster Kelly fractions auto-computed from rolling Brier-score performance. A polling-edge bet on a House race is sized by the polling-edge calibration tier, not a flat Kelly. As calibration drifts, sizing adapts. Aria sets the floor and ceiling Kelly fractions per tier; the engine scales between them.
- **Basket-by-confidence strategies.** For event clusters (all 435 House races, every CPI print, the FOMC path through year-end), a basket is constructed from the polling-or-forecast-model output, sized by per-market conviction and cluster-correlation discount, executed across venues to minimize impact. Rebalances trigger when the model output materially shifts. Dozens of basket strategies; each holds dozens to hundreds of constituent positions.
- **Resolution-window momentum strategies.** In the final 72h / 24h / 1h before resolution, prices crystallize as information arrives. Strategies trade the directional drift on contracts whose resolution-source data is releasing into the window (BLS at T-0, AP race calls at T-3h to T+12h, FOMC at T-0, oracle proposal-vs-dispute window at T+24h). Per-domain calibrated; auto-flatten at T-0 unless flagged as hold-to-settle.
- **Structural-bias detection strategies.** Markets where retail systematically over- or under-prices (hometown sports teams, partisan-favored outcomes, popularity-biased award shows). The platform mines historical mispricings per-market-type and per-venue, and flags candidate bets when the structural-bias edge exceeds the per-class threshold. Aria approves each new structural-bias model variant; deployed instances run within caps.
- **Oracle-dispute arbitrage.** When a UMA proposal is challenged or a Kalshi adjudication is pending, the contract often re-prices wider than the dispute's expected outcome distribution. Strategy enters when the dispute outcome is statistically clear from precedent and the market's fear premium exceeds the precedent-derived probability. Speculative tier; small allocations; Aria sign-off mandatory because dispute reading is judgment.
- **Whale-tape signal strategies.** On-chain (Polymarket, smaller protocols) wallet attribution flags large directional flow from public addresses with track records. Strategy weights signals by historical whale-track-record calibration. Speculative tier; small instances.
- **Cross-asset arb (rates / equities → prediction-markets).** For econ contracts, the implied probability from Fed funds futures, OIS curve, equity reaction-function residuals is compared to the prediction-market price. When divergence is meaningful and persistent, the strategy enters the prediction-market side. Speculative because the implied-probability mapping is itself modeled. Aria reviews mapping periodically.
- **Resolution-source-feed-driven exit strategies.** When the official resolution feed prints (BLS 8:30 ET, FOMC 14:00 ET, AP race calls), pre-staged exit logic flattens or holds-to-settle based on per-contract policy. Reduces capital lock-up; reduces resolution-dispute exposure when held-to-settle isn't necessary.
- **Capital-lockup-aware sizing strategies.** For long-resolution markets (12-month-out elections, multi-year geopolitical contracts), the sizing engine applies an opportunity-cost shadow rate against expected dry-powder demand. Heavily long-dated markets need extra edge to justify capital lock-up.

Each strategy class has 3–80 live instances at any time (different markets, venues, clusters, tier-of-confidence, resolution-window stage). Total fleet: ~150–250 active monitors and strategies, scaling to ~500+ during election years and major-data-release weeks.

Aria's day is no longer "research three high-conviction races and size positions across them." It is "make sure the firm's capital is deployed across the calibrated tier of opportunity at correctly-sized scale, supervise for resolution risk and source-feed health, intervene when the resolution criteria interpretation is ambiguous, push new alpha as new contract types list." The terminal must support this scale-up without forcing her to manually touch each market — while preserving her ability to deeply read any single contract's resolution criteria when it matters.

## 2. What Stays Aria

The platform automates execution, signal-generation, calibration tracking, cross-venue scanning, and most monitoring. What stays her — explicitly, by design — is the long list, because Aria's archetype is judgment-heavy:

- **Resolution-criteria interpretation.** "Will the Fed cut rates at the June 2026 FOMC?" reads simple. The actual contract wording on Polymarket vs Kalshi may differ in subtle ways — does an unscheduled inter-meeting cut count? Does a 12.5bp cut count as "a cut"? Does a hawkish hold with a dovish dot-plot trigger any resolution? The platform shows the wording verbatim; Aria reads it and decides whether the market is what she thinks it is. Misreading wording is the most expensive error in this domain; the platform helps but does not substitute.
- **Ambiguity calls on resolved markets.** When a market resolves and the outcome is contested, Aria reads the resolution-source data, compares to the contract criteria, and decides whether the platform's recorded resolution should be trusted, disputed, or escalated. UMA disputes, Kalshi adjudications, exchange-settlement disagreements — judgment.
- **Edge-source weighting.** Should this race lean more on the FiveThirtyEight ensemble or the Cook PVI baseline plus polling? Should this CPI contract lean more on the Atlanta Fed nowcast or on credit-card spending high-frequency indicators? Aria sets the weights per market type and per regime; the platform rebalances within her bands.
- **House-effect priors per pollster.** Pollster house effects are not stable. A pollster shifts methodology, and the historical bias estimate becomes stale. Aria reads the methodology change and updates the prior; the platform's auto-house-effect-estimator is a first guess, not a verdict.
- **Resolution-source-feed trust calls.** A BLS revision; an AP race call rescinded; a UMA proposer with a poor track record submits a contested proposal. Aria reads the source's history and the specific incident and decides whether to trust the print. Misplaced trust in an automated resolution-source pipeline is catastrophic.
- **Counterparty / venue / oracle risk decisions.** Polymarket smart-contract upgrade, Kalshi regulatory event, Smarkets withdrawal latency anomaly, oracle proposer concentration drift — the platform flags state changes; Aria interprets second-order implications and decides on capital reduction or redistribution.
- **Domain-expert weighting.** Politics analysts, AI researchers, weather forecasters, geopolitical analysts have track records but also blind spots. Aria reads their content and decides which to over- or under-weight relative to the model. The platform tracks expert-call calibration per analyst; she chooses the prior.
- **Ambiguous-event regime calls.** Is this election cycle "normal" or is structural realignment under way? Is the Fed in a "data-dependent" or "data-anchored" regime? Are AI benchmarks contaminated this quarter? These regime calls cascade into which models the platform should be running and how aggressively to size.
- **Catastrophe response.** Polymarket exploit, mass-oracle dispute, Kalshi regulatory action, multi-venue capital lockup — the first 60 seconds of judgment beat any pre-coded response. Aria's role is rapid triage; the platform's role is to make triage actionable (one-click reduce-cluster, one-click pull-from-venue, one-click pause-new-entries-globally).
- **New contract type evaluation.** A new prediction-market venue lists a contract type Aria has never traded (a multi-tier outcome with non-standard tie-breaking; a recurring rolling-horizon contract; a binary-options-style structured product). She reads the resolution mechanism, evaluates whether it fits her edge sources, and decides whether to onboard the contract type. The platform supports the evaluation; she decides.
- **Cross-domain coordination on overlapping markets.** Diego's sports prediction-market overlap (tournament outcomes, MVP awards) requires negotiation: who owns which leg, attribution split, capacity sharing. Cross-venue overlap with macro / commodity desks (when a prediction-market contract and a rates / equity / commodity contract resolve on the same data print) requires similar coordination.
- **Strategic capital allocation across her own clusters.** The allocation engine proposes a per-cluster (politics / econ / geopolitical / tech / weather / sports / crypto-native) split based on calibrated edge-per-cluster; Aria approves or modifies. Material reallocations (moving meaningful capital from the politics cluster to the econ cluster ahead of an election year vs a Fed-pivot year) are decisions, not optimizations.

The platform is opinionated about what to automate (cross-venue scanning, polling-update-triggered model recalibration, calibration tracking, resolution-window exit policies, basket rebalancing) and humble about what cannot be (resolution wording, ambiguity, edge-source weighting, regime calls). Aria's judgment surfaces are made higher-leverage by automation — not bypassed.

This list is long on purpose. Even in the most-modeled prediction-market workflow, the trader's domain reading dominates the alpha. The platform amplifies; it does not replace.

## 3. The Data Layer for Aria

The data layer is the substrate of every model and every monitor. Aria interacts with the data layer constantly — when researching a new race, when diagnosing a polling-aggregator anomaly, when evaluating a new geopolitical-event database, when proposing a procurement of a high-frequency indicator feed.

### 3.1 The Data Catalog Browser

Aria's home page when she opens the data layer is the catalog browser. A searchable, filterable list of every dataset the firm has, scoped to what's relevant for prediction-market and event-research work.

**Layout (sketch):**

- **Left sidebar** — taxonomy filters: data domain (polling / election-results / macro-data / forecasting-models / OSINT / conflict / weather / patent-and-lawsuit / token-and-protocol / venue-pricing / oracle-state); cadence (real-time / sub-hourly / EOD / weekly / static); license tier (premium / standard / public); cost band; coverage geography (US / global / regional); jurisdiction (CFTC-regulated / FCA-regulated / on-chain / Manifold-style); resolution-source-relevant (yes / no — does this feed feed an active contract's resolution).
- **Main panel** — table of datasets matching filters. Columns: name, source / vendor, coverage summary (e.g. "FiveThirtyEight aggregator + raw polls, US federal+state 1998–present, ~50 active races"), cadence, freshness indicator (green / amber / red — staleness vs SLA), license terms (e.g. "redistributable: no; client-report-safe: yes"), annual cost, owner, resolution-source-flag (does any active contract resolve from this feed), last-updated.
- **Right pane** — when a dataset is selected: full description, schema, sample rows, lineage graph (which features and contracts depend on it), quality history, license document link, procurement notes, "click to add to a notebook" button, "show me contracts whose resolution depends on this feed" button (Aria-specific — a prediction-market-essential cross-link).

**Search** — free-text across names + descriptions + schema fields + contract-resolution wording. "BLS CPI" jumps to BLS feeds and to every active contract that resolves from a BLS print. "538 House" finds polling aggregator outputs and the active US House race contracts. "Polymarket UMA" shows on-chain oracle proposal histories.

**Quick actions** — bookmark a dataset, request access to a restricted dataset, propose a procurement evaluation, flag a quality issue, mark as resolution-source for a manually-onboarded contract.

### 3.2 Aria's Core Datasets (Illustrative)

A senior prediction-market trader's data footprint is unusually diverse — politics, economics, geopolitics, tech, weather, sports, crypto-native — with each domain bringing its own data-vendor ecosystem. Examples of what Aria's catalog tier likely contains:

**Polling and elections:**

- **Polling aggregator histories** — FiveThirtyEight legacy database (2008–2024), Silver Bulletin (Nate Silver post-538), Cook Political Report ratings archive, Sabato's Crystal Ball, RealClearPolitics averages, Economist model, internal house-effect-adjusted aggregator. Per pollster: methodology, sample size, weighting, partisan-lean, recency.
- **Raw poll-level data** — every individual poll with cross-tabs, MoE, sample frame, dates, mode (live phone / IVR / online / mixed).
- **Election-result archives** — federal (1976–present), state (varies by state), gubernatorial, primary, ballot-measure, international (UK / Canada / India / Australia / Brazil / France / Germany). With certified vote counts, recount histories, contested-result histories.
- **FEC fundraising data** — quarterly totals, burn rate, cash-on-hand, ad-buy disclosures.
- **Demographic / district analysis** — Cook PVI, partisan-lean indices, turnout history, registration shifts, redistricting changes (Dave's Redistricting App, public state-legislative maps).
- **Endorsement databases** — newspapers, party leaders, key constituencies.
- **Election-night feeds** — AP election results (the standard), Edison Research (network-shared), state SoS official feeds (where available real-time).

**Macroeconomic data and forecasts:**

- **Government data APIs** — BLS (CPI, NFP, employment cost index, productivity, consumer expenditure surveys), Federal Reserve FRED (rates, dot-plot, balance-sheet), Treasury (auctions, debt-issuance, TIC flows), BEA (GDP, personal income, trade balance), Census (housing, retail), EIA (oil / natgas inventories, supply-disposition), USDA (crop reports), Fed regional banks (Beige Book, district indices).
- **Forecasting-model outputs** — Atlanta Fed GDPNow with revision history, NY Fed Nowcast, Cleveland Fed inflation nowcast, St. Louis Fed indicators, Bloomberg Survey median + dispersion, Reuters Survey, Citi Economic Surprise Index, Bloomberg Economic Surprise, individual high-track-record forecasters' estimates (selected sell-side).
- **High-frequency indicators** — credit-card spending (Chase Consumer Pulse, BAC, Cardlytics), mobility (Apple, Google, Replica), shipping (Cass freight, Drewry container rates, port-throughput dashboards), job postings (Indeed Hiring Lab, LinkUp), gasoline demand (GasBuddy, EIA weekly), restaurant traffic (OpenTable), construction (Dodge), housing-listing flow (Zillow / Redfin / Realtor.com).
- **Implied probability from rates and equities** — Fed funds futures (CME), OIS curve, equity-implied earnings reaction-function residuals, options-implied moves at calendar dates. For cross-asset arb feature inputs.

**Geopolitical and conflict:**

- **Conflict event databases** — ACLED (Armed Conflict Location & Event Data), Uppsala Conflict Data Program, Council on Foreign Relations Global Conflict Tracker, Stratfor / Janes situation reports.
- **OSINT feeds** — curated X / Twitter accounts (geolocators, military analysts, regional experts), Bellingcat reports, satellite imagery providers (Planet Labs, Maxar) for damage assessment / troop-movement detection.
- **Diplomatic calendars** — UN Security Council voting records, EU Council summits, G7 / G20 meetings, NATO ministerials, bilateral state-visit calendars, ratification trackers per treaty.
- **Sanctions databases** — OFAC SDN updates, EU sanctions consolidated list, UK HMT, UN Security Council, World-Check, Sayari.
- **Think-tank and academic publications** — Brookings, RAND, IISS, Carnegie, ECFR, Council on Foreign Relations, Atlantic Council, academic journals (Journal of Conflict Resolution, International Organization), tracked-Substack content.

**Tech and AI:**

- **Model-release trackers** — public lab announcements (OpenAI / Anthropic / Google / Meta / xAI / DeepSeek / Mistral), training-compute estimates (Epoch AI), benchmark contamination flags, release-date-shift histories.
- **Benchmark scorecards** — HumanEval, MMLU, ARC-AGI, SWE-bench, GPQA, MATH, with leaderboard movement and contamination-flag history.
- **Patent and lawsuit databases** — USPTO patent filings, PACER docket monitoring (NYT v OpenAI, Authors Guild, copyright suits, antitrust), settlement-vs-trial expectation databases.
- **Research preprints** — arXiv (cs.LG, cs.CL, stat.ML), Hugging Face papers, Semantic Scholar alerts on tracked research questions.
- **Tracked Substacks / Discord / X lists** — Stratechery, Interconnects, Import AI, curated-researcher accounts; community Discord scrapes for compute-leak rumors (where compliance permits).

**Weather and climate:**

- **Forecast aggregators** — GFS, ECMWF, ICON, UKMET ensembles, NHC tropical forecasts, NIFC wildfire status, USGS flood gauges; ensemble-spread plus skill-score-by-lead-time histories.
- **Historical climatology** — 30-year normals, percentile bands, analog-year matching, ENSO indicators (ONI, MEI, SOI).
- **Satellite data** — NOAA GOES, EUMETSAT, polar orbiter snapshots, sea-surface-temperature anomaly, snow-cover anomaly, soil-moisture.
- **Energy-weather crossover** — HDD / CDD forecasts vs prediction-market temperature contracts.

**Crypto-native and on-chain:**

- **Polymarket UMA proposal-and-dispute history** — full archive of every proposal, challenge, dispute outcome.
- **Kalshi adjudication archive** — every contract's settlement and any contested cases.
- **On-chain governance dashboards** — Snapshot, Tally, token-unlock calendars (TokenUnlocks), foundation-treasury state.
- **On-chain whale-wallet attribution** — Nansen, Arkham, on-chain entity mapping for prediction-market positions.

**Venue pricing and depth:**

- **Polymarket / Kalshi / Smarkets / Betfair price archives** — full historical L1/L2 where exposed; per-venue trade tape; per-contract OI history.
- **Cross-venue mid / mark price archives** — for arb-history backtesting and convergence analysis.
- **Per-venue fee schedules and historical changes.**

**Sports (pre-event prediction-market form):**

- Crossover with Diego's catalog — form data, advanced statistics (xG, EPA), Monte Carlo bracket-simulation tools.

Each dataset's record in the catalog shows: license terms, cost, coverage, freshness, lineage, used-by (which features and contracts depend on it), incident history, **resolution-source-relevance flag** (does any active contract resolve from this feed — Aria-specific surface).

### 3.3 Data Quality Monitoring

Every live dataset has continuous quality monitoring. Aria sees this as a heatmap on her catalog, with a dedicated **Quality Console** for deeper investigation, and an **escalation path for resolution-source feeds** — Aria-specific because a degraded BLS feed during a CPI release window is a market-moving event.

**Per-dataset quality dimensions:**

- **Freshness** — time since last update vs SLA. Color-coded. For resolution-source feeds, the SLA is different — pre-release windows have different freshness expectations than the release moment itself.
- **Completeness** — null rate per field, gap detection across time series.
- **Schema stability** — has the source's schema changed? Field added / removed / typed differently? Polling aggregators occasionally rewrite their methodology JSON; the catalog catches the schema diff.
- **Distribution drift** — has the statistical distribution shifted recently? A polling aggregator flipping from a pre-election aggregation to a post-election results table flips every distribution.
- **Cross-source consistency** — when multiple aggregators report on the same race, do their fair-probability estimates agree within the historical disagreement distribution? Wide divergence flags.
- **Resolution-source health** — for feeds that resolve contracts, a separate monitor: BLS API latency, FRED publication state, AP race-call latency, UMA on-chain proposal-state confirmation latency, oracle proposer-history score.
- **Cost / volume** — query volume against quota, $ spent month-to-date.

When something degrades, the dataset's owner is paged (the data-engineering team, not Aria directly). Aria sees the impact: which of her contracts depend on this dataset, what's their state, should she intervene. **Resolution-source-feed degradation during a release window** auto-promotes to critical and pings Aria directly — not waiting for the data-engineering team to triage.

### 3.4 Lineage Navigator

Every dataset has an upstream lineage and a downstream lineage. Aria opens the lineage navigator when:

- A polling-vs-market model is misbehaving and she wants to trace back to which poll or which aggregator caused the prediction shift.
- A vendor announces a feed change and she wants to see scope.
- A feature is being deprecated and she wants to confirm no monitor or model depends on it.
- An oracle or committee precedent ruling references a specific data source — she wants to trace which contracts now depend on that resolution-source variant.

**The graph:** nodes are datasets, features, models, monitors, contracts; edges are dependencies. Color-coded by health. Click any node for detail; right-click for "show all downstream" or "show all upstream."

A power-user tool used during diagnostic work and during procurement-evaluation impact analysis, not constantly.

### 3.5 Procurement Dashboard

Data licenses are a major operating-cost line item; a senior trader is expected to be sharp on cost-vs-attribution. The procurement dashboard:

- **Active licenses** — every paid feed with annual cost, renewal date, contract terms, owner of the renewal decision. Polling subscriptions, government-data redistribution licenses, OSINT vendors, satellite imagery, conflict-database access, climate-data premium, on-chain analytics.
- **Trial / evaluation feeds** — currently being POC'd, with deadlines and evaluation criteria.
- **Wishlist** — feeds Aria has flagged as "want," with rationale (e.g. "a cleaner Indian-state-election polling feed because Bihar markets are listing on Kalshi and our internal aggregator is thin"; "a high-frequency reservoir-level feed for water-resource contracts").
- **Cost attribution** — for each licensed feed, a rough P/L attribution: which monitors and models depend on it, and how much P/L they generated.
- **Renewal calendar** — what's coming up for renegotiation, with auto-prompt to review usage + attribution.
- **Decision log** — past procurement decisions with rationale.

Aria contributes especially around per-domain feeds (a new geopolitical-event database, an alternative pollster aggregator, a satellite-imagery-for-conflict-tracking provider). Major procurements (>$200k/year) escalate to David / firm-level.

### 3.6 Gap Analysis Surface

The platform identifies gaps tied to concrete strategies that can't be deployed:

- **Universe coverage** — Aria's contracts span hundreds of resolution sources; the catalog tells her which are not yet ingested as structured data (e.g. a state SoS that publishes results only as PDF; a regional UN body whose votes aren't in any database).
- **Feature gaps** — features in the library that depend on missing or stale data.
- **New-venue coverage** — when Polymarket / Kalshi list a new contract type, does the catalog cover its resolution source? If not, the contract type is blocked from automated trading until the feed is onboarded.
- **Backfill gaps** — historical data missing for certain periods, blocking walk-forward backtesting.
- **Polling-aggregator coverage gaps** — international races where US-style aggregators don't cover; the platform flags candidate procurements (e.g. local pollsters aggregated by a regional vendor).

Closing a gap is a procurement decision with a defined ROI estimate.

### 3.7 Interactions Aria has with the data layer

- **Daily (background):** quality monitor in peripheral; auto-alerts for degradation. Aria glances at the catalog occasionally during research.
- **Daily (release-day):** on CPI / NFP / FOMC days, the resolution-source-feed health monitor is foveal during the release window.
- **Weekly:** procurement / wishlist review; reading data-team release notes.
- **Per-cycle (election cycles):** intensive polling-feed coverage review; gap analysis for the cycle's races.
- **Monthly:** cost / attribution review; renewal-decision triage; gap-analysis review with the data team.
- **Ad hoc (during research):** querying the catalog when starting a new event-research thesis.
- **Ad hoc (during a model issue):** lineage navigator from a misbehaving polling-vs-market model back to source data.
- **Ad hoc (during an incident):** when a vendor degrades during a release window, the impact-scope view tells Aria exactly which contracts are at risk.

### 3.8 Why this matters for efficiency, risk, and PnL

- **Efficiency:** Aria does not waste hours figuring out where polling data lives or how to query a state SoS feed. The catalog is one click. Every feature she builds is reusable.
- **Risk:** quality monitoring catches feed degradation before P/L does. **Resolution-source-feed degradation during a release window** is the highest-stakes data-quality event in her domain; the platform escalates accordingly. License compliance enforcement (redistribution restrictions on polling data, jurisdictional restrictions on certain government feeds) is automatic.
- **PnL:** procurement decisions are evidence-driven. A $50k/year polling-aggregator subscription pays for itself if it informs a cycle's worth of House-race calibration. Gap analysis surfaces uncaptured alpha (e.g. an international-elections cluster that isn't being modeled because a feed isn't licensed yet).

## 4. The Feature Library for Aria

A feature is the unit of model-vocabulary. For Aria, features are engineered transformations of polling, forecasting, OSINT, weather, and venue-pricing data — polling-aggregator-derived race-fair-probabilities, polling-trend velocities, nowcast-vs-consensus deltas, conflict-event-rate z-scores, model-release-cadence indicators, ensemble-weather-spread features, cross-venue spread features, calibration-tier indicators per market — that models and monitors consume. The feature library is where Aria spends much of her research time.

The library is shared across the firm; features Aria builds are visible to Diego (sister archetype, sports overlap), Quinn (cross-archetype), and others. Likewise, Aria consumes features built by other desks where they apply — Rafael's macro-regime indicators inform Aria's economic-data calibration; Theo's weather features inform her temperature contracts.

### 4.1 The Feature Library Browser

Aria's home page when she opens the feature layer.

**Layout (sketch):**

- **Left sidebar** — taxonomy filters: domain (polling / forecasting-model / OSINT / weather / patent-and-lawsuit / oracle-state / venue-pricing / cross-asset / calibration); cadence (real-time / 5-min / hourly / EOD / per-poll-release / per-data-print); compute cost; used-by-monitor (which features feed a live monitor I care about); owner / desk; quality tier (production-grade / beta / experimental); freshness; **resolution-source-derived flag** (does this feature compute from data that resolves a contract).
- **Main panel** — table of features. Columns: name, version, owner, description, inputs (upstream features and datasets, summarized), distribution-state indicator (in-distribution / drifting / failed), used-by count, last-modified, performance proxy (rolling-Brier-improvement of monitors using it).
- **Right pane** — when a feature is selected: full description, code link, lineage graph, distribution monitor (rolling histogram + comparison to training distribution + drift score), incident history, "show me monitors using this feature" link, "test this feature in a notebook" button.

**Search** — free-text across names, descriptions, code. "polling z-score house-effect" finds variants; "nowcast delta CPI" finds the macro nowcast features.

**Quick actions** — bookmark, fork into a personal experimental version, propose a new feature, flag drift.

### 4.2 Aria's Core Features (Illustrative)

Examples of features Aria has built or consumes — actual library will differ.

**Polling-derived (politics):**

- `polling_aggregator_fair_prob_race_X` — per-race fair probability from the firm's house-effect-adjusted ensemble (538 / Silver Bulletin / Cook PVI / Economist as inputs).
- `polling_trend_velocity_7d / 14d / 30d` — rate-of-change of fair probability over multiple windows.
- `polling_dispersion_zscore` — standard deviation across pollsters' point estimates, z-scored against the historical race-stage distribution.
- `pollster_house_effect_residual` — residual between a pollster's estimate and the ensemble's, with rolling history.
- `pollster_house_effect_drift_score` — has a pollster's house-effect been changing recently (methodology-shift detector).
- `endorsement_delta_score` — recent endorsements weighted by historical-predictive-power.
- `fundraising_gap_zscore` — incumbent-vs-challenger fundraising gap z-scored against partisan-control-of-seat history.
- `district_partisan_lean_PVI` — Cook PVI; baseline for fair-probability priors.
- `incumbent_advantage_factor` — historical-base-rate adjustment.
- `convention_bump_decay_residual` — primary / convention-induced bumps' decay vs historical base rate.

**Forecasting-model-derived (economics):**

- `nowcast_consensus_delta_CPI / NFP / GDP` — Atlanta-Fed / NY-Fed / Cleveland-Fed nowcast minus Bloomberg-survey consensus.
- `nowcast_revision_velocity` — how rapidly the nowcast has been revising recently.
- `surprise_consistency_zscore` — Citi Surprise Index z-scored against rolling distribution.
- `high_freq_indicator_composite` — internal weighted composite of credit-card / mobility / freight / hiring / fuel-demand — at multiple lead times.
- `implied_prob_from_rates_FOMC` — Fed-funds-futures-implied probability mapped to the Kalshi contract's resolution bins.
- `implied_prob_from_equities_earnings` — equity-vol-implied move at calendar date mapped to a corresponding prediction-market contract.

**OSINT and geopolitical:**

- `acled_event_rate_zscore_region_X` — recent conflict-event rate per region, z-scored.
- `osint_credibility_weighted_signal` — curated-source signal weighted by historical track record.
- `diplomatic_calendar_proximity_factor` — days to next relevant diplomatic event.
- `sanctions_list_change_indicator` — recent OFAC / EU / UN sanctions deltas.
- `ceasefire_durability_base_rate` — historical ceasefire-by-region-and-decade decay rate.

**Tech and AI:**

- `model_release_announcement_cadence_zscore` — cadence of major lab announcements vs rolling distribution.
- `benchmark_leaderboard_movement_velocity` — recent leaderboard delta on tracked benchmarks.
- `patent_filing_velocity_topic_X` — USPTO filing rate on a tracked topic.
- `lawsuit_docket_event_rate_case_X` — PACER docket-event rate on a tracked case.
- `arxiv_topic_research_velocity` — recent paper-rate on tracked topics.

**Weather and climate:**

- `ensemble_forecast_spread_zscore` — model disagreement (GFS / ECMWF / ICON / UKMET) z-scored.
- `analog_year_match_score` — current state's similarity to historical analog years.
- `enso_phase_indicator` — ONI / MEI / SOI composite phase.
- `hurricane_track_uncertainty_band` — NHC track-cone width as feature.
- `hdd_cdd_delta_normal` — heating / cooling degree day delta vs 30-year normal.

**Venue-pricing-derived:**

- `cross_venue_spread_bps_event_X` — best Polymarket vs best Kalshi vs best Smarkets vs best Betfair, in probability points.
- `cross_venue_spread_after_cost` — same with gas / bridging / fees / KYC-friction subtracted.
- `historical_convergence_residual` — for similar prior events, how the spread behaved into resolution.
- `venue_depth_at_5k_25k_100k_event_X` — depth at notional levels per venue.
- `venue_account_state` — KYC, geo, position-limit-utilization, USDC-approval state — combined into a tradability flag.

**Resolution-source-state:**

- `resolution_source_health_score` — composite of feed latency, recent revision history, and SLA adherence for the resolution feed.
- `oracle_proposer_track_record_score` — UMA proposer's historical accuracy; lower score = higher dispute-risk premium.
- `kalshi_committee_precedent_match_score` — for ambiguous contracts, similarity score to past adjudicated cases.
- `dispute_risk_zscore` — composite of contract wording ambiguity, source-data revision history, oracle/committee history.
- `time_to_resolution_days` — countdown.
- `pre_resolution_window_indicator` — categorical: T-7 / T-72h / T-24h / T-1h / T-0.

**Whale-tape and on-chain:**

- `whale_wallet_directional_flow_event_X` — net directional flow from tracked addresses on a Polymarket contract.
- `whale_track_record_calibrated_signal` — whale signal weighted by historical calibration.

**Cross-pollination (consumed from other desks):**

- `rafael_macro_regime` — Rafael's macro regime indicator, useful for econ-contract calibration.
- `theo_weather_composite` — Theo's weather features for temperature contracts.
- `henry_corporate_event_velocity` — Henry's earnings / corporate-event signal where tech-corporate-event prediction-markets exist.
- `diego_sport_xG_market_residual` — Diego's market-vs-model residual on tournament-outcome contracts.

**Calibration and post-trade-derived:**

- `per_edge_source_calibration_brier_rolling_30d / 90d / 365d` — Aria's calibration per edge source (model / polling / expert / structural / arb), rolling.
- `per_cluster_calibration_score` — Aria's calibration per event cluster.
- `per_market_type_hit_rate_by_confidence_tier` — performance per tier per market type.
- `recency_bias_indicator` — has Aria's recent decision-pattern shifted toward over-weighting recent information (behavioral feature feeding the behavioral-monitoring panel).

These features form Aria's reusable vocabulary. A new model or monitor she builds picks from this library and combines them. She builds new features when the existing vocabulary doesn't capture an idea (e.g. when a new contract type lists with a novel resolution-source she hasn't modeled before).

### 4.3 Feature Engineering Surface

Building a new feature is itself a workflow. The platform supports it inline in the research workspace but also exposes a structured form for the publication step.

**The workflow:**

1. **Idea phase (notebook):** Aria writes the feature in Python in her notebook, tests on real historical data, inspects shape / distribution / sample values.
2. **Quality gates:** before publishing, automated checks — null rate within threshold, outlier rate, schema validation, computability across the universe of contracts the feature claims to cover.
3. **Metadata extraction:** auto-generated lineage, distribution baseline, compute cost, update cadence, **resolution-source-derived flag** (Aria-specific — does the feature compute from a resolution-source feed; if yes, additional governance applies).
4. **Code review:** required for production-grade features. Peer or Quinn's team reviews; suggestions inline.
5. **Publication:** canonical name, version (semantic + content hash), registered.
6. **Backfill:** computed across history for retraining old models.
7. **Live deployment:** computable on demand; live monitors and models can subscribe.

**The form (schema-style UI):**

- Name, description, owner.
- Inputs (selected from existing features / datasets, or declared as new dependencies).
- Code (link to repository commit; review status).
- Cadence and freshness SLA.
- Universe (which contracts / clusters it applies to; can be parametric).
- Tags (taxonomy).
- **Resolution-source-derived flag** (Aria-specific; triggers extra review if true).
- Documentation notes (regimes where it's known to break, expected lifecycle).

### 4.4 The Drift Dashboard

Live features drift. Aria's drift dashboard surfaces the worst offenders, with prediction-market-specific framing.

**Layout:**

- **Top panel** — feature drift heatmap: features (rows) × time (columns), cells colored by drift score. Sortable by current drift, by trend, by impact (downstream calibration at risk).
- **Triage queue** — top features needing action: drifted significantly, with their downstream monitors and contracts listed.
- **Detail pane** — for a selected feature, the time series of distribution drift, the downstream models / monitors / contracts affected, and suggested actions (retrain affected models, recalibrate the feature, deprecate it).
- **Polling-aggregator-shift detector** — a class of drift unique to politics: when a polling aggregator releases a methodology change mid-cycle, the feature's distribution is supposed to shift. The platform detects "expected shifts" (announced methodology changes) vs "unexpected drifts" (silent vendor changes) and routes them differently.
- **Acknowledgments log** — drifts Aria has reviewed and explicitly accepted, with reason logged.

This is one of the most-checked surfaces during diagnostic work. A misbehaving polling-vs-market model → drift dashboard for its features → identify the broken upstream → decide on retrain / recalibrate / pause.

### 4.5 Cross-Pollination View

Features built by other desks that might apply to Aria's domain.

**Suggested-similar widget** — when Aria opens a feature, a sidebar shows features built by other desks with similar inputs or tags. "Theo's weather composite uses ensemble-spread analysis you might apply to weather-contract pricing." "Henry's corporate-event-velocity feature could feed your AI-lab-announcement contracts."

**Trending features across desks** — what's being built / used most across the firm. Often a leading indicator of where alpha is being found.

**Feature-of-the-week** — a curated highlight from another desk; cheap way to keep current.

This surface is light-touch; not foveal but useful background. Particularly valuable for Aria because her domain spans more sub-domains than most archetypes — politics / econ / geopolitics / tech / weather / sports / crypto-native — and cross-pollination across desks is naturally high.

### 4.6 Interactions Aria has with the feature library

- **Daily (background):** drift dashboard glance during morning fleet review; alerts route to her for features feeding her amber/red monitors.
- **Weekly:** browse cross-pollination view; identify candidate cross-desk features to evaluate.
- **Per-cycle (election / data-release cycles):** intensive feature-engineering bursts ahead of new cycles (e.g. building cycle-specific polling-aggregator features at the start of an election year; building data-release-specific nowcast features ahead of a new CPI methodology).
- **Ad hoc (during research):** browse + search for features matching a thesis.
- **Ad hoc (during feature engineering):** the engineering surface, primarily in the notebook.
- **Ad hoc (during retire):** when a feature is being deprecated, Aria reviews downstream impact.

### 4.7 Why this matters

- **Efficiency:** Aria does not rebuild "house-effect-adjusted polling fair-probability" 14 times in 14 different notebooks. She picks it from the library, parameterizes for the race in question, builds on it. Time-to-monitor-prototype drops from days to hours.
- **Risk:** drift is monitored continuously. A polling-aggregator's methodology pivot, a nowcast-source's revision, a venue's pricing-feed change — all surface as feature drift before they distort live monitoring. Per-feature versioning means recalibration doesn't accidentally use a different feature definition than the original training.
- **PnL:** features are reused across monitors and basket strategies. A high-quality feature (calibration-improving across many contracts) generates compounding return. Cross-pollination across desks accelerates discovery.

## 5. The Research Workspace

The research workspace is where Aria turns raw data and features into validated monitors, polling-vs-market models, basket strategies, and arb-detection rules. It is her primary working surface during research-heavy hours — which, in automated mode, is most of the day.

Aria's research workspace is **multi-domain**. Politics research draws different tools (polling-aggregator interfaces, district-mapping, fundraising-data viewers) than economics research (nowcast comparison, high-frequency-indicator dashboards) than geopolitics (OSINT readers, conflict-database queries) than tech (benchmark trackers, patent-search) than weather (ensemble visualizers, climatology-comparison). The platform surfaces a **per-domain workspace** — discussed below in 5.4 (Strategy Template Library) and 5.7 (Interactions).

### 5.1 Notebook Environment

The workspace is notebook-first (Jupyter-style) with a full IDE option for traders who prefer that mode.

**Layout (sketch):**

- **Left sidebar** — file tree (Aria's notebooks per domain, shared workspaces, scratch); platform integrations (data layer search, feature library search, model registry browse, experiment tracker, monitor templates); kernel state.
- **Main panel** — the active notebook (cells: code, markdown, output). Standard Jupyter UX with platform extensions.
- **Right sidebar** — context panel (depends on what the cell is doing): for a polling-aggregator query, shows the aggregator's methodology + current race coverage; for a feature reference, shows feature metadata + drift state; for a backtest run, shows results streaming in.
- **Bottom panel** — terminal / cell output / experiment-tracker auto-log of this notebook's runs.

**Critical platform integrations:**

- **One-line data access.** `df = data.load("polling.house.IL-12.2026", aggregator="silver_bulletin", since="2025-01-01")`. No SQL fumbling.
- **One-line feature retrieval.** `fair_p = features.get("polling_aggregator_fair_prob", race="2026.US.House.IL-12", since="2025-09-01")`.
- **One-line model loading.** `model = models.get("aria.polling_vs_market_house_v3", version="2.4.1")`.
- **One-line backtest.** `result = backtest(strategy=my_basket, data=hist, period="2022-01-01:2024-12-30", venues=["polymarket","kalshi"])`.
- **One-line cross-venue spread query.** `spread = venues.spread("event:fomc.2026.06.cut.25bps", venues="all", since="2026-04-01")`.
- **One-line resolution-source query.** `state = resolution.state("contract_id_X")` returns oracle state, dispute window, official-feed expected-print-time, recent revision history.
- **One-line plotting.** Platform helpers for calibration curves, equity curves, cross-venue spread overlays, polling-vs-market divergence charts.
- **One-line experiment registration.** Backtests and training runs auto-register in the experiment tracker.

**Compute attached to the kernel:**

- The kernel runs on research compute, not Aria's laptop. Polling-aggregator backfill is fine; multi-decade geopolitical-event-database queries are fine; her machine doesn't melt under a hyperparameter sweep.
- CPU / RAM / GPU allocation visible inline.

**Persistence and collaboration:**

- Notebooks persist per user.
- Shared workspaces for desk collaboration (Aria + Diego working on a tournament-outcome contract).
- Real-time collaboration for paired research.
- Version control native: every save is committed.

### 5.2 Backtest Engine UI

Aria's backtest engine differs from Marcus's in three meaningful ways:

1. **Resolution-aware.** Every backtest runs against the actual historical resolution outcomes. A market that resolved "YES" actually paid $1; a market that resolved "NO" paid $0; a disputed market is run in two scenarios (resolved-as-recorded and resolved-as-disputed) for sensitivity.
2. **Capital-lockup aware.** The simulation accounts for capital tied up between entry and resolution. Long-resolution markets in a backtest impose opportunity-cost shadow rates against same-period dry-powder demand.
3. **Cross-venue execution-realistic.** Slippage curves derived from historical depth per venue; gas / bridging cost on on-chain venues; KYC / position-limit constraints per regulated venue; venue-fee schedules with VIP-tier applied; partial-fills based on queue-position estimation; bridging settlement times for cross-chain arb.

**Layout when running a backtest:**

- **Form panel** — strategy or monitor selector, data window, contract universe (per cluster, per venue, per resolution-window-bucket), parameter overrides, execution model parameters (per-venue slippage, fees, latency, gas, bridging), capital constraints (max-deployed at any time, lockup-shadow-rate).
- **Live progress** — "1.2 of 5.0 years simulated, 32% complete, ETA 3 min." Cancel button.
- **Streaming results** — calibration curve building bin by bin, equity curve, recent simulated fills tape.
- **Final results page (when complete):**
  - Summary metrics — Brier score (the headline metric for Aria), calibration RMSE, hit rate by confidence tier, ROI per stake, Sharpe of daily mark-to-market, max drawdown, capacity estimate.
  - Calibration curve with confidence bands.
  - Equity curve with drawdown shading; benchmark overlay (vs market-implied calibration on the same set of trades).
  - Per-cluster attribution histogram.
  - Per-edge-source attribution (model / polling / expert / structural / arb).
  - Slippage breakdown — assumed vs realized, by venue, by size bucket, by liquidity tier.
  - Capital-lockup profile — how much capital was tied up for how long.
  - Resolution-outcome scenario sensitivity — how performance changes if X% of disputed markets had resolved the other way.
  - Auto-flagged warnings — lookahead detected; in-sample tuning detected; resolution-source data leak (a feature using resolution-source data after the contract was supposedly trading).

**Realistic execution simulation is mandatory.** The same execution code runs in live trading as in backtest — divergence between paper and live is rare and investigated. Cross-venue arb backtests in particular must reflect real bridging cost and time, real gas at the period's gas-price distribution, and real KYC / position-limit state at the period.

### 5.3 Walk-Forward Visualization

Walk-forward backtest is the default; the visualization is critical for honest evaluation. **Especially critical for Aria** because polling, nowcast, and OSINT models drift across cycles — a model that works in one election cycle may be overfit and fail in the next.

**Layout:**

- **Top:** equity curve broken into training-window and test-window segments, color-coded.
- **Middle:** per-test-window Brier score with confidence-interval bars.
- **Bottom:** parameter-stability check — were the parameters consistent across rolling windows, or did they jitter (overfitting to training).
- **Side:** out-of-sample Brier summary, in-sample Brier summary, generalization gap.
- **Cycle-aware view (Aria-specific):** for political-model backtests, segments aligned to election cycles (2018 / 2020 / 2022 / 2024 / 2026) — performance per cycle, with the explicit caveat that a model trained on 2008–2016 data may break in the post-2016 polarization regime.

If the in-sample Brier is 0.05 and the out-of-sample is 0.18, the model is overfit; the visualization makes this stark.

### 5.4 Strategy Template Library

A library of pre-built monitor and strategy compositions Aria starts from. Reduces time-to-first-monitor from days to hours. **Aria's template library is per-domain** — politics templates differ from econ templates differ from geopolitics templates.

**Politics templates (illustrative):**

- **Polling-vs-market House race monitor.** Per-race fair-probability ensemble vs Polymarket / Kalshi quote, edge alert when divergence exceeds per-race-stage threshold. Parameterized by polling-aggregator weights, house-effect priors, race-stage (primary / general / runoff), confidence tier.
- **Senate-race basket strategy.** Basket of all Senate races with per-race conviction-weighted sizing, cluster-correlation discount on overlapping party-control bets, rebalance trigger on aggregator-update.
- **Gubernatorial-race monitor.** Same shape as House but with Cook-PVI heavier prior weight (state-level partisan-lean is more stable than district-level).
- **Election-night-resolution strategy.** Per-state results-feed-driven exit logic; pre-defined exit policy per race tier.

**Economics templates (illustrative):**

- **CPI-print-vs-market basket.** Pre-print: nowcast-vs-survey-vs-market triangulation; bin-bucketed sizing. Post-print: auto-flatten on resolution.
- **NFP-print-vs-market basket.** Same shape; different nowcast inputs and high-frequency-indicator weights.
- **FOMC-decision-vs-market.** Fed-funds-futures-implied prob mapped to contract bins; Aria-tunable weights on Fed-speak interpretation.
- **GDP-print-vs-market.** GDPNow-driven, with quarterly Atlanta-Fed-revision-history priors.

**Geopolitical templates (illustrative):**

- **Conflict-event-rate monitor.** ACLED-derived event-rate z-score vs ceasefire-or-escalation contracts.
- **Sanctions-action probability monitor.** OFAC / EU / UN listing-event rate + diplomatic-calendar proximity vs sanctions-action contracts.
- **Treaty-ratification monitor.** Ratification-state per country vs binary treaty-ratification contracts.

**Tech / AI templates (illustrative):**

- **AI-benchmark-leaderboard contract monitor.** Leaderboard-velocity + lab-announcement-cadence + arXiv-velocity inputs.
- **AI-lab-release-by-date contract monitor.** Lab-announcement-cadence + leaked-rumor-credibility-weighted feature.
- **PACER-docket-event-resolution contract.** Lawsuit-state-machine modeling of settlement-vs-trial.

**Weather templates (illustrative):**

- **Hurricane-strike-region monitor.** NHC track-cone + ensemble-spread + analog-year inputs; pre-resolution-window-aware.
- **Atlantic-hurricane-count cluster.** Seasonal forecast + ENSO-phase + sea-surface-temp anomaly inputs.
- **Temperature-by-date monitor.** Ensemble forecast vs prediction-market temperature contract.

**Cross-venue arb templates (cluster-agnostic):**

- **Polymarket-vs-Kalshi arb scanner.** Per-event spread monitor with per-leg cost subtraction; auto-stage atomic legs; leg-out risk.
- **Polymarket-vs-Smarkets arb scanner.** Cross-jurisdiction; bridging cost.
- **Triangular arb scanner.** 3+ venue mispricing detection.

**Resolution-window templates (cluster-agnostic):**

- **T-72h crystallization monitor.** Final-72h directional-drift strategy.
- **T-1h pre-print strategy.** Final-hour-before-resolution policy execution.
- **Held-to-settle decision logger.** Records held-to-settle decisions and their realized outcomes for retrospective.

Aria's day starts at a template and customizes. Many of her ~150–250 active monitors are instances of one of ~25 templates with parameter profiles tuned per market type.

### 5.5 Compute Management

Senior researchers run compute-heavy work — polling-aggregator-ensemble retraining, multi-cycle walk-forward backtests, geopolitical-event-database joins, OSINT NLP classification. Compute management is a real surface.

- **Active jobs panel** — Aria's running jobs with progress, ETA, cost-so-far, cancel buttons.
- **Queued jobs panel** — submitted but waiting (e.g. overnight runs).
- **Cost dashboard** — month-to-date compute spend, by job type, with budget guardrails.
- **GPU/cluster availability** — when can a big training job run.
- **Result archive** — completed jobs with their experiment-tracker entries.

Long-running jobs require explicit confirmation. Cost is always visible.

### 5.6 Anti-Patterns the Workspace Prevents

- **Untracked data pulls.** Every query logs lineage.
- **Untracked feature definitions.** A feature defined in a notebook and never published is suspect.
- **Lookahead bias.** The backtest engine refuses to use future data; warnings on attempts. **Resolution-source-data lookahead is its own class** — using a BLS print's actual value at a time before the print was published is a specific failure mode the platform catches.
- **Survivorship bias.** Backtests run on the as-of universe (delisted contracts preserved), not today's roster. Particularly important for Aria because her contract universe turns over rapidly.
- **In-sample tuning masquerading as out-of-sample.** Walk-forward forces honest splits; the cycle-aware view is mandatory for political models.
- **Reproducibility gaps.** A notebook that can't be re-run from scratch is flagged.
- **Resolution-outcome leakage.** Using a market's resolved outcome as a feature is the most dangerous leak in this domain; the platform refuses by default.
- **Polling-aggregator-update leakage.** Using a polling aggregator's revised estimate (revised after the race resolved) instead of the as-of estimate at decision time is a subtle leak the platform catches.

### 5.7 Interactions Aria has with the workspace

- **Pre-market:** review overnight backtest / training results; pick winners for further work; check which monitors fired alerts overnight.
- **In-market (research-heavy hours):** active in the workspace; new monitor ideas, feature engineering, model retraining, polling-aggregator weight tuning.
- **Per-domain bursts:** intensive politics work in the run-up to election cycles; intensive macro work in the run-up to FOMC weeks; intensive geopolitics work during active conflicts; intensive tech work around major AI lab releases.
- **Diagnostic (when alerted):** pull a misbehaving monitor into the workspace, replicate the issue, diagnose, fix, redeploy.
- **Post-market:** queue overnight jobs.

### 5.8 Why this matters

- **Efficiency:** time-to-validated-monitor compresses from weeks to hours. A new contract type listing on Kalshi can be modeled and a calibrated monitor deployed within a single research day.
- **Risk:** anti-patterns (lookahead, survivorship, p-hacking, resolution-outcome leakage) are caught by the platform, not by Aria's discipline. Silent overfit shipping to live monitors is the platform's most expensive failure mode.
- **PnL:** more validated monitors per quarter means more contracts traded with calibrated edge — across politics / econ / geopolitics / tech / weather / sports / crypto-native, the firm's combined coverage compounds.

## 6. The Model Registry

Models are the executable form of Aria's polling-vs-market estimates, nowcast-vs-market estimates, OSINT-derived signals, basket-rebalancing rules, and arb-detection logic. The registry catalogs every model the firm has trained, with full reproducibility guarantees.

For Aria the registry is **less central than for Marcus** — many of her "strategies" are scaffolds (monitors that surface opportunities for her to size by judgment) rather than autonomous alpha generators. But for the autonomous classes (cross-venue arb, basket-by-confidence rebalance, resolution-window momentum), reproducibility and versioning are non-negotiable.

### 6.1 The Model Registry Browser

Aria's view when she opens the model registry.

**Layout:**

- **Left sidebar** — taxonomy filters: model class (polling-ensemble / nowcast-ensemble / OSINT-classifier / arb-detector / basket-rebalancer / regime-classifier); domain (politics / econ / geopolitics / tech / weather); owner; deployment status (research / paper / pilot / live / monitor / retired); performance band (Brier-rolling); drift state.
- **Main panel** — table of models. Columns: name, version, owner, model class, training date, OOS Brier (with CI), deployment count, drift status, last-modified.
- **Right pane** — when a model is selected: the model record (next subsection).

### 6.2 The Model Record Page

Per model, the canonical record:

- **Identity:** model ID, version (semantic + content hash), name, description, owner, code commit of training pipeline.
- **Lineage:** training data hash, feature set with versions, hyperparameters, label definition (resolved-outcome of contracts, with explicit handling of disputed cases), training command.
- **Training metadata:** training date, duration, compute used, $ cost, hardware.
- **Performance — multiple regimes:**
  - In-sample Brier score / hit rate / RMSE.
  - Out-of-sample on hold-out.
  - Walk-forward Brier with confidence interval.
  - Per-cycle conditional performance (for political models).
  - Per-regime conditional performance (for econ models — high-vol vs low-vol macro, hawkish-vs-dovish Fed).
  - Capacity estimate.
- **Lineage graph:** parent (if fine-tuned / retrained), children, siblings.
- **Deployment state:** which monitors / strategies use which version, in which environments.
- **Drift state:** input-distribution drift, prediction-distribution drift, **calibration drift** (Aria-specific — is the model's predicted-probability calibration still well-calibrated?), performance vs expectation.
- **Documentation:** explainability cards (feature importance, SHAP-style attribution), known failure modes, regime fit notes (e.g. "this polling-vs-market model assumes pollster-house-effects are stable; degrades when major pollsters change methodology mid-cycle").
- **Action panel:** "retrain with new data," "deploy to paper," "deprecate," "fork into a new variant."

### 6.3 Versioning & Immutability

- **Semantic versioning** for trader-meaningful changes.
- **Content hash** for guaranteed reproducibility.
- **Old versions never deleted.** A retired model is still in the registry, retrievable, redeployable.
- **Promotion path:** registered (research) → validated (paper) → deployed (live).
- **Rollback:** any prior version can be re-deployed in one click.

### 6.4 Drift Surface for Models

Distinct from feature drift. Model drift focuses on the model's _outputs_.

- **Prediction-distribution drift** — has the model's prediction distribution shifted vs. training-time?
- **Performance drift** — is the model's realized Brier diverging from backtest expectation?
- **Calibration drift** — for probabilistic models (most of Aria's), are the predicted probabilities still well-calibrated against realized outcomes? This is the single most important model-drift metric in her domain.

Drift triage queue: top models by drift score, with their downstream monitors and contracts. Click a row → suggested actions (retrain, recalibrate, replace, retire).

### 6.5 Lineage Graph

Per model, a visual graph: upstream training data → features → model; downstream model → monitors → contracts → P/L. Sister versions: prior versions with deltas.

### 6.6 Why this matters

- **Efficiency:** Aria does not waste hours reconstructing what a monitor is running on. The registry says: this monitor uses model X v2.4.1, trained on data hash Y.
- **Risk:** without the registry, the firm cannot answer regulator / auditor questions about what's deployed. Reproducibility is non-negotiable.
- **PnL:** retraining cadence is data-driven. Calibration-drift-driven retrains are scheduled when the metric crosses threshold, not when Aria notices anecdotally.

## 7. The Experiment Tracker

Most research is failed experiments. The experiment tracker is the firm's institutional memory.

For Aria the tracker also captures **theme-evolution experiments and resolution-precedent-match experiments** — research questions that aren't pure ML model trainings but are first-class research artifacts in her domain. ("Does adding the 2024-cycle's mid-cycle scandal-residual feature improve the per-state senate model?" "Does the Kalshi committee's 2025 ruling on contract-X-class adjudication change the precedent-match score for similar contracts?")

### 7.1 The Experiment Browser

Layout:

- **Left sidebar** — filters: researcher, time period, model class, feature set, strategy class, status (running / complete / failed), domain (politics / econ / etc.).
- **Main panel** — table of runs. Columns: run ID, name, researcher, started, duration, status, OOS Brier (or relevant metric), feature set, parameter summary, annotations.
- **Sortable, multi-select for comparison.**

### 7.2 Per-Experiment Record

Each experiment captures:

- **Trigger:** notebook + cell, scheduled run, hyperparameter sweep, scripted pipeline.
- **Config:** full hyperparameters, feature set, period (with cycle-awareness for political experiments), splits, seed, hardware.
- **Inputs:** feature versions, data snapshot, code commit.
- **Output:** performance metrics (Brier the headline; calibration RMSE; hit rate by tier; equity curve; per-cluster attribution).
- **Diagnostics:** runtime, peak memory, errors, warnings.
- **Annotations:** Aria's notes ("tried this because hypothesis X; didn't work because polling-aggregator methodology shifted mid-period").
- **Tags:** category, hypothesis, market type, edge source.

### 7.3 Run Comparison Views

The most-used surface for research velocity.

**Side-by-side comparison (2-way):** two experiments → side-by-side. Diffs: feature-set delta, hyperparameter delta, performance delta, calibration-curve overlay, attribution comparison.

**N-way comparison:** multiple experiments in a table; sort / filter on metrics.

**Pareto-frontier views:** across many experiments, which configurations dominate (Brier vs capacity / complexity vs lockup-shadow-rate).

**Hyperparameter sensitivity:** vary one parameter, hold others; response curve.

**Ablation views:** "Which features matter most?" — permutation importance or SHAP. Per-experiment context, plus aggregate.

**Cycle-aware view (Aria-specific):** for political experiments, the same experiment scored across each historical cycle. A model that works on 2008–2016 but fails on 2018–2024 is overfit to a specific polarization regime.

### 7.4 Anti-Patterns Prevented

- **P-hacking by re-running.** Every run logged.
- **Cherry-picking periods.** Each experiment's period recorded.
- **Hidden in-sample tuning.** Walk-forward + adjustment-log.
- **Resolution-outcome leakage in experiment design.** A specific Aria-domain anti-pattern: a researcher inadvertently using the resolved outcome as a feature, or filtering experiments to only the cycles where the model worked. Both caught.

### 7.5 Interactions Aria has with the experiment tracker

- **During research bursts:** runs experiments, watches them stream in, picks winners.
- **Between bursts:** browses past experiments to avoid reinventing.
- **In retrospect:** "we shipped this polling-ensemble model; what alternatives did we evaluate; could we have shipped a better one?"
- **For team handoff:** a researcher leaving the desk hands their successor a tagged set of experiment runs.
- **When David asks:** "show me the evidence behind this monitor promotion."

### 7.6 Why this matters

- **Efficiency:** failed experiments are data, not waste. Avoiding the same dead-end twice is real productivity.
- **Risk:** p-hacking is the silent killer. The tracker makes Aria's process honest and defensible.
- **PnL:** the firm's accumulated experiment knowledge compounds. New researchers stand on the shoulders of every prior run.

## 8. Strategy Composition

A model alone is not a tradable strategy. A strategy wraps a model (or rule set) with sizing logic, entry/exit, hedging, risk gating, regime conditioning, capacity, execution policy.

For Aria, **composition has two flavors**: monitor compositions (scaffolds that surface opportunities for human sizing) and autonomous compositions (cross-venue arb, basket rebalances, resolution-window exits — that run within risk caps without per-trade approval). The composition surface handles both.

### 8.1 The Strategy Composition Surface

A structured form-plus-code UI.

**Layout (sketch):**

- **Top bar** — strategy ID, name, version, owner, current stage, action buttons.
- **Left graph view** — the strategy as a directed graph: data sources → features → model(s) → signal → entry/exit logic → sizing → execution. Click any node to configure.
- **Right panel** — properties of the selected node:
  - **Data source** — catalog reference, contracts, venues, period.
  - **Feature** — feature library reference, parameters.
  - **Model** — model registry reference, version pin.
  - **Signal** — threshold, confirmation conditions.
  - **Entry logic** — when to take a position (signal threshold + blackout windows: e.g. don't enter within T-1h of resolution unless explicitly resolution-window-momentum-tagged).
  - **Exit logic** — target / stop / time-based / signal-flip / **resolution-window-trigger** (Aria-specific) / hold-to-settle.
  - **Sizing** — Kelly fraction, fractional-Kelly preset (1/4 default), per-edge-source-calibrated multiplier, conviction tier multiplier, capital-lockup-shadow-rate, per-cluster cap, per-venue cap, cluster-correlation discount.
  - **Hedging policy** — auto-hedge across venues yes/no, hedge ratio, hedge venue, hedge cadence.
  - **Risk gates** — daily loss limit, drawdown limit, position-size limit, cluster concentration, venue concentration, **resolution-source concentration** (Aria-specific — too many positions resolving from the same UMA proposer or Kalshi committee triggers a gate). Kill-on-breach.
  - **Execution policy** — algo class (TWAP / liquidity-seeker / limit-spread / direct), per-venue routing rules, fee preferences, **on-chain execution parameters** (gas strategy, slippage tolerance, approval state) for Polymarket-style venues.
  - **Schedule** — active windows, blackout windows around resolution events where applicable.
  - **Mode** — live / paper / shadow.
  - **Tags** — market type, cluster, edge source, jurisdiction, confidence tier.
  - **Approval mode (Aria-specific):** autonomous (runs within caps without per-trade approval), semi-autonomous (runs within caps but high-stakes trades require approval), approval-required (every trade routes to Aria).
- **Bottom panel** — validation feedback, backtest results, deployment state.

**Code drop-in:** for any node, "convert to custom code" opens a Python editor. Useful for novel signal-combiners, exotic exit logic, custom-resolution-precedent logic.

### 8.2 Pre-Deployment Validation

Before promotion past research, the platform checks:

- **Lookahead leak detection.** Static analysis of signal logic. **Resolution-source data leak** is its own class — the platform checks every feature dependency to confirm no resolution-print value is referenced before its publish-time.
- **Infinite-loop entry.** Strategies that re-enter immediately after a stop.
- **Unbounded position size.** Sizing logic that doesn't cap.
- **Missing kill-switch wiring.** Every strategy must have automated risk gates.
- **Schedule conflicts.** Strategies marked active during venue maintenance windows.
- **Compliance flags.** Restricted-list exposure, jurisdictional access (Aria's CFTC-regulated contracts have geo restrictions; the platform enforces).
- **Capacity sanity.** The strategy's claimed capacity matches the platform's slippage-curve estimate.
- **Resolution-source-concentration.** A strategy that loads up too many positions resolving from the same source is flagged.
- **Capital-lockup-policy compliance.** A strategy whose positions would lock up >X% of allocated capital across a date range is flagged.

### 8.3 Strategy Versioning

Standard semantic versioning. Old versions never deleted. Any deployed strategy can be rolled back in one click.

### 8.4 Aria's Strategy Templates (Illustrative)

The strategy templates from section 5.4 above also live here as composition templates. A template is a starting point; Aria customizes parameters per market and deploys per cluster.

In addition, Aria-specific composition templates:

- **Approval-required-monitor template.** Surfaces opportunities to Aria for approval; no autonomous execution.
- **Autonomous-arb-within-caps template.** Cross-venue arb with strict cost-vs-spread thresholds; runs without approval up to a configured trade-size cap.
- **Held-to-settle-decision-logger template.** A composition that records the decision-state at resolution but does not execute; used as a research scaffold.

### 8.5 Why this matters

- **Efficiency:** composition is structured; Aria does not build the same per-trade-size-cap logic 200 times. The template encodes it.
- **Risk:** every strategy has explicit risk gates. **Resolution-source concentration** as a first-class gate is unique to her domain and material — too many positions resolving from one oracle proposer is a single-point-of-failure that the platform refuses to allow silently.
- **PnL:** the approval-mode flexibility (autonomous / semi-autonomous / approval-required) lets Aria run the high-volume mechanical strategies (arb scanners) hands-off while preserving human judgment on the ambiguous ones.

## 9. Promotion Gates & Lifecycle

Research → Paper → Pilot → Live → Monitor → Retired. Each stage has explicit gates.

For Aria, lifecycle is **per-monitoring-system, not per-alpha-strategy** for the scaffold classes — the cadence is slower than Marcus's because polling-vs-market models aren't retrained daily; they retrain when a polling aggregator releases a methodology update or when a cycle ends. For the autonomous classes (arb scanners, basket rebalancers), cadence is faster.

### 9.1 The Lifecycle Pipeline View

A kanban-style view of every strategy by stage.

**Layout:**

- Columns: Research / Paper / Pilot / Live / Monitor / Retired.
- Cards: strategy name, owner, OOS Brier (with CI), days-in-stage, gate-evidence-summary, next-action.
- Drag-and-drop to propose a stage transition (gate kicks in).
- Filters by domain (politics / econ / etc.), by cluster, by autonomous-vs-monitor.

### 9.2 The Gate UI per Transition

Each transition has a checklist. The platform pre-fills evidence; Aria reviews and signs off.

**Research → Paper:**

- Walk-forward backtest passed (OOS Brier within target).
- Calibration curve within tolerance.
- Capacity estimate computed.
- Anti-pattern checks passed.
- Code review completed for production-grade.

**Paper → Pilot:**

- N days of paper-trading with realized Brier within OOS-backtest CI.
- Cross-venue execution-quality-realized matches simulation.
- No critical incidents during paper period.

**Pilot → Live:**

- N days of pilot at small capital with realized Brier within paper-tracking CI.
- Resolution-outcomes from pilot positions match the strategy's calibration claim.
- Risk gates have not fired anomalously.
- Aria sign-off; for material strategies, David sign-off.

**Live → Monitor:**

- Performance materially below expectation OR drift triggered OR external regime change identified.
- Capital reduced; strategy remains running for diagnostic purposes.

**Monitor → Retired:**

- Recovery deemed unlikely OR replacement strategy candidate ready.
- Capital fully freed; strategy archived (registry preserves it).

### 9.3 Gate Evidence Auto-Population

The platform auto-fills gates with evidence: backtest result IDs, paper-trading metrics, pilot performance, drift reports, intervention history, anti-pattern check results.

Aria reads the evidence and signs off (or sends back with notes); she does not assemble the evidence by hand.

### 9.4 Canary Deploys for Calibration-Drift-Triggered Retrains

When a polling-vs-market model is flagged for retrain due to calibration drift, the canary-deploy flow:

- New version trained.
- Deploys at small allocation alongside the incumbent.
- Both run on the same contract universe; their predictions logged.
- After N days (typically 7–14 for a polling model; longer for econ models that have rarer release events), the canary's performance is compared against incumbent.
- Promotion or rollback decision.

Reduces retrain risk; the new model proves itself before replacing the incumbent.

### 9.5 Retirement Workflow

When a strategy is retired:

- Capital fully freed.
- Strategy archived in registry (never deleted).
- Replacement candidate, if any, promoted to fill the niche.
- Retirement reason logged (decay confirmed / regime change / replaced by better candidate / niche dissolved due to contract delisting).

### 9.6 Why this matters

- **Efficiency:** the kanban view is Aria's daily entry point on lifecycle. She doesn't hunt for status; the platform shows it.
- **Risk:** gates with auto-populated evidence prevent ad-hoc promotions. Live capital is only deployed against strategies that pass the gates.
- **PnL:** canary deploys for retrains catch retraining mistakes early. A retrained model that's accidentally worse than the incumbent doesn't get full capital before its quality is confirmed.

## 10. Capital Allocation

Sizing across the fleet.

For Aria, capital allocation is **per-cluster + per-confidence-tier + per-venue + capital-lockup-aware**. The allocation engine proposes; Aria approves or modifies. Material reallocations (moving capital from politics to econ ahead of a non-election year, for instance) are decisions, not optimizations.

### 10.1 The Allocation Engine

A nightly process that proposes a portfolio.

**Inputs:**

- Per-cluster expected-edge (rolling Brier-improvement and rolling P/L per edge source).
- Per-cluster capacity (how much capital can the cluster absorb at current edge).
- Cross-cluster correlation (politics and econ are partially correlated when both depend on Fed-path expectations; the platform models the joint distribution).
- Per-venue tradability (KYC, geo, position limits, on-chain operational state).
- Capital-lockup demand profile (expected calendar of resolution dates and the capital tied up against them).
- Risk caps per cluster, per venue, per confidence tier.
- Aria's approved priors (cluster preferences, venue preferences for the cycle).

**Outputs:**

- Per-cluster allocation proposal in $.
- Per-confidence-tier sub-allocation within each cluster.
- Per-venue distribution within each cluster.
- Marginal-Brier-improvement curve per cluster (diminishing-returns visualization).
- Risk-decomposition (per-cluster contribution to total fleet risk, per-resolver-source concentration).
- Suggested rebalances vs current state.

**Aria's review:**

- Approve as proposed.
- Modify (reduce politics, increase econ; cap geopolitics due to current ambiguity in conflict-event-database coverage).
- Defer (run on yesterday's allocation for one more day).
- Escalate (material change → David sign-off).

### 10.2 Per-Cluster Allocation View

Per-cluster: total $, deployed-vs-free, per-monitor breakdown, marginal-Brier curve, recent-cycle attribution.

Aria looks here when deciding between "scale up the politics cluster ahead of midterms" vs "rotate capital into econ during the FOMC cycle."

### 10.3 Per-Confidence-Tier Sub-Allocation

Within each cluster, capital allocates across high / medium / speculative tiers per per-tier-rolling-Brier:

- High-confidence tier: ~50% of cluster (depending on cluster); larger Kelly fractions; longer-horizon positions tolerated.
- Medium tier: ~35%; standard Kelly.
- Speculative tier: ~15%; capped position sizes; faster exit policy.

The split is per-cluster — politics may run higher-conviction-skewed; geopolitics may be more speculative-skewed; econ may be more medium-skewed.

### 10.4 Per-Venue Allocation

Per-venue caps because:

- **Counterparty / venue risk** — too much capital on Polymarket if Polymarket has a smart-contract risk, on Kalshi if regulatory action is plausible.
- **Position-limit utilization** — Kalshi's per-contract caps mean exceeding them is impossible; the engine respects caps.
- **Bridging cost** — moving capital between venues is non-zero cost and time; the engine avoids unnecessary churn.
- **On-chain operational state** — Polymarket gas-spike windows, bridge-congestion windows.

### 10.5 Capital-Lockup Heatmap

A heatmap by week / month of capital-locked-until-resolution across the entire portfolio.

Aria uses this to:

- Avoid concentrating expiry dates (e.g. don't have 80% of capital resolving in one week).
- Keep dry powder for high-edge late-listed markets (a major news event lists a contract with thin initial liquidity; want capital available).
- Manage opportunity cost (long-lockup positions need extra edge to justify the lockup).

### 10.6 Why this matters

- **Efficiency:** Aria reviews a proposal; she doesn't compose an allocation from scratch.
- **Risk:** per-resolver-source concentration is enforced; per-venue caps are enforced; capital-lockup is bounded.
- **PnL:** marginal-Brier-improvement curves let Aria spot diminishing-returns clusters and rotate capital where edge is freshest. Cycle rotation (politics during election years, econ between cycles, weather seasonally) is data-driven.

## 11. Live Fleet Supervision Console

The supervisor console where Aria watches her fleet, anomaly-driven, default green.

### 11.1 The Fleet Dashboard

Layout (illustrative):

- **Top filter bar** — cluster filter, venue filter, confidence-tier filter, approval-mode filter, alert-state filter (green / amber / red).
- **Main table** — one row per monitor / strategy. Columns:
  - Monitor name.
  - Cluster.
  - Approval mode (autonomous / semi / approval-required).
  - Active markets (count).
  - Capital deployed ($).
  - Today's P/L; rolling 7d / 30d / 90d.
  - **Calibration tier (Brier)** — Aria's primary edge metric, color-coded by drift.
  - **Days to next resolution** — countdown to nearest-resolving contract under the monitor.
  - **Resolution-source-state** — composite color: green (sources healthy), amber (one source flagged), red (active dispute or feed degraded).
  - **Edge-source weights** — current weights (pollster ensemble, expert, structural, arb).
  - **Drift indicators** — feature drift, prediction drift, calibration drift.
  - Status (running / paused / monitor / retired).
  - Last alert.

**Default filter: amber + red.** Aria sees the strategies needing attention; the green ones are background.

**Cluster aggregation row.** Per cluster, the aggregate row shows total active markets, total capital, aggregate calibration, aggregate next-resolution-cluster, aggregate alert state.

### 11.2 The Strategy Detail Page

When Aria clicks a strategy or monitor, a drill-in page:

- **Top section: identity and config**
  - Name, version, owner, lifecycle stage, deployment date, approval mode.
  - Configuration summary — model version, feature set, sizing policy, risk gates, schedule.
- **Top-right section: performance + calibration**
  - Calibration curve (Aria's primary metric) — predicted vs realized, with confidence bands.
  - Brier score: rolling 7d / 30d / 90d / since-deployment.
  - Equity curve.
  - Per-resolved-market log (predicted prob vs market price vs realized outcome).
- **Middle section: signal feed**
  - Recent signals generated, executed vs skipped, with reasons.
  - Last N decisions with full context (input feature values, model output, signal threshold, sizing decision).
  - "Why this monitor entered / didn't enter" diagnostic.
- **Middle section: active markets**
  - Every market the monitor is currently positioned in: contract, venue, position size, entry price, current price, days to resolution, resolution-source state.
- **Bottom section: diagnostic depth**
  - Feature health — which features are drifting, with click-through to feature drift dashboard.
  - Slippage realized vs assumed by venue.
  - Capacity utilization curve.
  - Recent retraining history.
  - Linked alerts.
  - Linked experiments.

This page is where Aria does diagnostics. From here: pause, cap, retrain, leave alone, retire.

### 11.3 Anomaly Detection Surface

Categories:

- **Calibration anomalies** — calibration drift exceeding tolerance (Aria-specific primary metric).
- **Performance anomalies** — Brier underperforming rolling distribution at 2σ / 3σ.
- **Behavior anomalies** — trade frequency, position size, hit rate outside historical bounds.
- **Feature drift** — input distribution shifted vs training.
- **Prediction drift** — output distribution shifted.
- **Execution anomalies** — slippage spike, rejection rate spike, fill rate drop.
- **Capacity warnings** — strategy hitting cap.
- **Correlation anomaly** — strategy correlating with another it should not.
- **Resolution-source anomaly (Aria-specific)** — feed degraded / dispute initiated / oracle proposer track record degraded / committee precedent contested.
- **Venue anomaly** — Polymarket gas spike, Kalshi regulatory event, Smarkets withdrawal latency.
- **Pollster-aggregator anomaly (Aria-specific)** — methodology shift detected; downstream models flagged.
- **Infrastructure** — node down, data lag, RPC degraded.

Each anomaly has severity (info / warn / critical), routing rules, and (for critical) auto-actions (auto-pause the strategy by default, configurable per strategy).

**The anomaly console:**

- Active anomalies, sorted by severity then recency.
- Per-anomaly: which strategy, what triggered, suggested action, "investigate" button → strategy detail, "acknowledge with reason" button.
- Acknowledged-anomalies log for review.

### 11.4 Cross-Strategy Correlation View

The fleet is supposed to be diversified across clusters; correlation drift erodes diversification.

**Layout:**

- **Heatmap** — strategy × strategy correlation matrix, color-coded.
- **Drift indicators** — pairs that should be uncorrelated drifting toward correlation.
- **Cluster visualization** — strategies clustered by behavior; outliers flagged.
- **Aggregate exposure decomposition** — fleet-level exposure to common factors (national-political-environment, Fed-path, geopolitical-risk-premium, AI-progress-velocity). Ensures supposedly-diversified strategies aren't quietly stacking on a single factor.
- **Resolution-source concentration view (Aria-specific)** — distribution of capital across resolution sources (UMA proposer X, Kalshi committee Y, BLS, AP race calls, etc.). Concentration above threshold flagged.

### 11.5 Active-Resolution-Window Live State

Distinct from the allocation engine's nightly proposal — this is the live, intra-cycle state.

**Layout:**

- **Top panel: resolution-window queue** — markets resolving within T-7d / T-72h / T-24h / T-1h / T-0, ordered by time-to-resolution. Per-row: contract, venue, position size, current price vs entry, Aria's predicted-prob, resolution source, resolution-source-feed health, hold-to-settle vs flatten policy.
- **Middle panel: resolution-source health monitor** — every active resolution source with:
  - Source identity (UMA proposer ID, Kalshi committee, BLS API, FRED, AP, oracle on-chain state).
  - Feed health (green / amber / red — staleness, recent revisions, dispute state).
  - Number of active contracts depending on it.
  - Aggregate capital depending on it.
  - For oracle sources: proposer track record, dispute window state, recent challenges.
  - For committee sources: recent adjudication history, precedent-match score for active cases.
- **Bottom-left panel: active disputes** — UMA challenges in flight on Aria's positions, Kalshi adjudications pending, with per-dispute capital-at-risk and time-to-resolution-of-dispute.
- **Bottom-right panel: pre-resolution alerts** — T-72h, T-24h, T-1h alerts with the relevant contracts highlighted.

This panel is foveal during pre-resolution windows on major contracts (election nights, FOMC days, CPI prints). Most days it's peripheral.

### 11.6 Strategy State Inspection

A diagnostic surface that lets Aria inspect the **internal state of a running monitor or strategy** — its current variables, signal evaluation, model output, regime classifier, sizing intermediates, **arb-detection state** for arb scanners — and compare live behavior against backtest expectation.

This is a verification surface, not a continuously-streamed real-time view. It is implemented per strategy; the strategy declares which variables it exposes, and the platform renders them on demand. Engineering pragmatism: the platform does not stream all variables of all 250 monitors in real time.

**Two layers of inspection:**

#### 11.6.1 Internal-state view (per strategy)

A panel inside the strategy detail page (section 11.2) that Aria opens on demand.

**What it shows (illustrative, varies per strategy):**

- **Current state variables** — the strategy's internal counters / flags / regime classifications / running averages / accumulators. Displayed in a structured table with field name, current value, last-updated timestamp.
- **Current feature snapshot** — the input feature values the strategy is currently seeing (the feature-vector that would feed the next signal evaluation). Useful for "is the polling-fair-prob feature returning what I'd expect right now?"
- **Last N signal evaluations** — for the last decisions: input features, model output (signal value, predicted probability, classifier label), entry / exit / no-action decision, reason. Scrollable / searchable history.
- **Current position state** — what the monitor is holding; what it intends to do next; pending orders.
- **Risk-gate state** — daily-loss accumulator, drawdown-since-go-live, capacity utilization, distance-to-each-risk-limit, **resolution-source-concentration utilization** (Aria-specific).
- **Calibration state (Aria-specific)** — rolling Brier, recent-resolved-markets log, current calibration tier, sizing-multiplier-from-calibration.
- **Regime classifier output** — strategy's view of the current regime (e.g. "election-cycle: midterm; polling-stability: high; major-aggregator-methodology: stable"); strategies with regime gating expose which gates are open / closed.
- **Strategy-specific custom state** — examples per strategy class:

  **Cross-venue arb scanner state:**
  - Current spread per detected opportunity (Polymarket vs Kalshi spreads, sorted by size after costs).
  - Per-leg cost estimates (gas, bridging, fee, KYC-friction, slippage).
  - Current bridging state (in-flight transfers, expected settlement).
  - Per-venue depth at the size the scanner would trade.
  - Leg-out-risk per opportunity.
  - Recent staged-and-executed opportunities log.
  - Reasons for opportunities staged-but-not-executed (e.g. "leg-out risk exceeded threshold").

  **Polling-vs-market model state:**
  - Per-race fair-prob estimate; previous-day estimate; delta.
  - Per-race ensemble inputs (538 / Silver Bulletin / Cook PVI / Economist) and current weights.
  - Per-pollster house-effect priors and recent residuals.
  - Per-race confidence tier and reasoning.

  **Basket-by-confidence state:**
  - Current basket constituents and weights.
  - Last rebalance trigger and reason.
  - Cluster correlation discount currently applied.
  - Capital deployed vs target.

  **Resolution-window momentum state:**
  - Per-active-contract: resolution-source state, time-to-resolution, current position direction, exit policy state, hold-to-settle flag.

  **Calibration-driven sizing state:**
  - Per-edge-source rolling Brier, current Kelly fraction multiplier.
  - Per-cluster calibration tier.
  - Recent sizing decisions and the calibration inputs that drove them.

**Refresh model:**

- **Refresh button** for on-demand snapshot. Most common interaction.
- **Auto-refresh toggle** for selected strategies (e.g. when actively diagnosing). Configurable cadence: 1s / 5s / 30s / 1min / off.
- **Schedule push** for selected strategies — the platform pushes state updates only when the strategy actually changes state (entered a position, evaluated a signal, hit a gate). Lightweight, event-driven.
- **Engineering pragmatic:** the platform does not stream all variables of all 250 monitors in real time — that's heavy on backend and wasteful. Streaming is opt-in per strategy when Aria is actively inspecting; default is on-demand refresh.

**Per-strategy implementation:**

- The strategy declares its exposed state via a contract (a list of variables, types, descriptions). The platform renders whatever the strategy declares.
- Some strategies expose comprehensive state (cross-venue arb scanners and polling-vs-market models tend to be richer because their internal logic is more complex).
- Some expose minimal state (a simple T-72h crystallization monitor may just expose its current position and current signal). Pragmatic — engineering cost should match diagnostic value.
- Aria is not blocked if a strategy is light on exposed state; the supervision dashboard, model registry, and execution log give independent diagnostic angles.

#### 11.6.2 Backtest-vs-live comparison

For any live strategy, a side-by-side view comparing live behavior against backtest expectation. Critical for catching configuration drift early.

**Layout:**

- **Top:** equity curve, live (last N days) overlaid on backtest counterfactual (had the strategy run with the same parameters and same regime over the same period). Divergence flagged.
- **Calibration overlay (Aria-specific):** live calibration curve overlaid on backtest calibration curve. Even if equity curves track, calibration drift indicates sizing-versus-edge mismatch worth investigating.
- **Per-trade comparison:** recent live trades, what the backtest would have done at the same moment. Mismatches: live entered when backtest didn't (or vice versa); live size differed; live execution-quality differed.
- **Per-feature drift:** input features the strategy saw live vs the same features in the backtest's training distribution. Distribution-shift score per feature.
- **Per-resolved-market diagnostic (Aria-specific):** for resolved markets in the live period, the model's predicted-prob vs the backtest's predicted-prob (when re-run on the same period). Configuration drift between live and backtest is the leading cause of divergence.
- **Diagnosis hints:** the platform suggests likely root causes — feature drift, execution-quality degradation, model drift, configuration mismatch, data-pipeline issue, **resolution-outcome-recorded-differently** (rare but possible — a market the platform recorded as resolved-YES but that the strategy's per-trade-log indicates resolved-NO indicates a recording bug).

**Use cases:**

- After Aria deploys a new monitor to live: confirm the first weeks match the backtest. If not, diagnose before scaling capital.
- When a strategy enters monitor stage: was the divergence caused by the deployment or by the regime?
- When validating a candidate retrain: how does the new model's first weeks compare to its backtest?

**Refresh model:**

- Computed daily by default (not real-time). The comparison is slow-moving; daily granularity is sufficient.
- On-demand refresh available.

#### 11.6.3 Why this matters

- **Efficiency:** when a monitor is misbehaving, Aria can see exactly what it's "thinking" without running a fresh backtest or opening the code repo. The diagnostic loop closes in minutes rather than hours.
- **Risk:** silent configuration drift between backtest and live is a major failure mode — particularly for cross-venue arb scanners where a subtle mismatch in fee schedule between backtest and live can quietly turn an arb-positive strategy arb-negative. The comparison surface catches it early.
- **PnL:** strategies whose live matches backtest can be scaled with confidence. Strategies whose live diverges are caught early and either fixed or capped.
- **Engineering verification:** as a side effect, this surface is one of the cleanest end-to-end tests of the platform — if Aria can see the right state for a cross-venue arb scanner (current spreads, leg-out risks, bridging state, recent staged opportunities), the data plumbing, model registration, strategy composition, multi-venue execution layer, and reporting layer are all working end-to-end. The diagnostic surface doubles as platform validation.

### 11.7 Why this matters

- **Efficiency:** anomaly-driven attention compresses 250 monitors into ~5–25 to investigate. Aria does not stare at 250 calibration curves.
- **Risk:** anomalies are caught before P/L damage compounds. Auto-pause on critical alerts (resolution-source dispute initiated; calibration-drift past threshold; venue regulatory event) limits blast radius.
- **PnL:** time saved on supervision is reinvested in research and in the high-value ambiguous-resolution calls only she can make.

## 12. Intervention Console

When Aria decides to act, the intervention console is the surface. Distinct from automatic actions (kill-on-breach, auto-flatten-on-resolution, auto-rebalance) — this is _Aria's_ interventions.

### 12.1 Per-Strategy Controls

For any monitor or strategy, controls Aria can apply:

- **Start / pause / stop** — with confirmation + audit trail.
- **Cap change** — increase / decrease capital cap. Modest changes auto-apply; large changes route to allocation-engine sign-off.
- **Risk-limit change** — daily loss limit, drawdown limit, position-size limit, **resolution-source-concentration limit** (Aria-specific).
- **Approval-mode change** — switch a strategy from autonomous to semi or to approval-required (e.g. when calibration is degraded, route to approval until restored).
- **Market whitelist / blacklist** — temporarily exclude a contract or a cluster (e.g. blacklist all geopolitical contracts during a major conflict-database-degradation incident).
- **Schedule modification** — pause active windows, add a blackout (e.g. "no entries on this contract from now through resolution because the resolution criteria are now ambiguous").
- **Mode change** — live / paper / shadow. Shadow mode runs the code without sending orders; useful for diagnosing without further P/L exposure.
- **Force-flatten** — close all positions on this monitor now. Reason field mandatory.
- **Hold-to-settle override** — for resolution-window-momentum strategies, override the auto-flatten policy on a per-contract basis.
- **Demote to monitor** — move to monitor stage with reason.

Every intervention is logged: timestamp, actor, action, reason, pre-state, post-state.

### 12.2 Group Controls

- **Pause all in cluster** (e.g. pause all geopolitical monitors during an active multi-front conflict where data-source health is uncertain).
- **Pause all on venue** (Polymarket smart-contract incident; Kalshi regulatory event).
- **Pause all in lifecycle stage** (e.g. pause all pilots ahead of a major election to avoid noise contaminating their evaluation).
- **Cap all by tag** — multiplicative cap reduction across a tagged set (e.g. cap all "speculative-tier" by 50% during high-uncertainty period).
- **Cap all per-edge-source** (e.g. cap all polling-edge strategies by 75% when a major polling aggregator is undergoing methodology shift).
- **Pause-by-resolution-source** (e.g. pause every strategy with positions resolving from UMA proposer-X when that proposer's track record is being investigated).

### 12.3 Manual Trading & Reconciliation

**Even in fully automated mode, Aria must retain the ability to place, adjust, and close trades manually from the UI.** This is non-negotiable. Aria's manual trading is most often invoked for **ambiguous-resolution events** — a contract whose criteria interpretation is contested, where the auto-strategies cannot make the call and Aria's domain reading drives the decision. Three primary scenarios:

**1. Ambiguous-resolution-event intervention.**
A contract's resolution criteria are being interpreted differently by the venue and by Aria's reading. Or an unscheduled event has occurred that the auto-strategies' regime-classifiers haven't updated to handle (an unscheduled FOMC meeting; an oracle proposer rescinding a previously-proposed resolution; a Kalshi adjudication reversing precedent). Aria needs to enter, exit, or adjust positions by hand based on her reading right now. The auto-strategy is paused; Aria's discretionary trade is logged and tagged.

**2. Reconciliation between platform state and venue state.**
The platform's view of what's open and the venue's view should always match. In practice they occasionally diverge (a Polymarket trade the strategy didn't register; a Kalshi cancel the strategy thinks succeeded but didn't; a Smarkets balance reported wrong and corrected; a UMA-proposed-resolution that the platform recorded but the on-chain state shows disputed). Aria needs to manually align the two.

**3. Discretionary override on top of the automated book.**
A high-conviction read (a major political-debate moment that materially shifts a race; a CPI print whose composition Aria reads differently than the headline; a geopolitical headline whose implications Aria reads ahead of the OSINT model's update; a UMA-proposed resolution that Aria reads differently than the proposer). Aria layers a directional position on top of what the strategies are doing — explicitly tagged as such.

The platform must support all three with **full manual-trading capability identical to the manual mode** described in Phase 2 above. Aria retains every surface from her manual workflow: probability-quoted single-market ticket, cross-venue execution router, triangular-arb staging, basket / cluster ticket, hedge ticket, Kelly / fractional-Kelly calculator inline, on-chain wallet management, regulated-venue-specific controls, hotkeys. The manual surfaces don't disappear in automated mode; they are present and reachable but not the primary surface most of the day.

#### 12.3.1 The Full Manual Order Ticket

The complete order entry tooling from manual mode (see Phase 2 above and [unique-tools.md](unique-tools.md)).

- **Probability-quoted single-market ticket** with side (YES / NO), stake, limit price (probability) or market, full pre-trade preview (cost / max-payout / implied-edge / days-to-resolve / venue fees / gas / bridging / position-after-fill against per-cluster + per-venue limits).
- **Cross-venue execution router** with best-price aggregation, smart-routing across venues, atomic legs for arb, bridging awareness, account-state checks, leg-out-risk surfaced.
- **Triangular-arb stager** — detected opportunity feed + proposed execution path + one-click stage → manual confirm → execute.
- **Basket / cluster ticket** — build a basket of related markets, size by conviction, cross-correlation aware, rebalance triggers, cluster execution with leg-status.
- **Hedge ticket** — buy NO of same market; cross-venue hedge; cross-market hedge with linkage notes.
- **On-chain wallet management** — wallet selector, gas strategy, slippage tolerance, approval management, simulation pre-send, bridge state.
- **Regulated-venue-specific controls** — geo / KYC checks, position-limit utilization, margin / cash requirements, settlement workflow.
- **Kelly / fractional-Kelly calculator inline** — optimal stake given edge and bankroll; conviction-adjusted; capital-lockup-adjusted; cluster-correlation discount.
- **Hotkeys preserved** — Buy YES at offer / Buy NO at offer (focused market), cancel-all-on-market, hedge-to-flat, switch-focus-to-next-market-in-queue.

Practically: the manual terminal is a tab in the supervisor console, not a separate application. Aria presses a hotkey or clicks an icon → manual ticket comes up over the current view → she places the trade → the ticket closes back to the supervisor view.

#### 12.3.2 Trade Tagging & Attribution

Every manually-placed trade gets a mandatory tag:

- **Ambiguous-resolution intervention** — flagged for post-incident review; auto-included in the day's incident log; resolution-criteria interpretation logged with the trade.
- **Reconciliation** — paired with the algo state being reconciled (which monitor thought it had this position; what the venue showed). Reconciliation tickets generate an audit pair.
- **Discretionary override** — explicit override; tagged with the macro / domain thesis or reason.
- **Speculative experimentation** — for new contract types or new venues being onboarded by hand; tagged so attribution is separate from the automated book.

Attribution carries the tag through P/L, performance metrics, reports. David's behavioral monitoring tracks the frequency of each tag class — sustained increase in ambiguous-resolution interventions or overrides is a leading indicator David investigates.

#### 12.3.3 Reconciliation Workflow

A specific surface for the reconciliation case.

**The reconciliation page:**

- **Left panel:** the platform's view — every position the monitors / strategies _think_ they have, per venue, per contract.
- **Right panel:** the venue's view — every position the venue _actually_ shows, per venue, per contract.
- **Diff highlighted:** rows where the two disagree. Discrepancy size in $ and as % of position.
- **Per-row actions:**
  - "Trust venue" — the platform updates its internal state to match. Strategy state corrected; audit logged.
  - "Trust platform" — the venue is incorrect (rare); manual reconciliation order placed at the venue. Audit logged.
  - "Investigate" — opens a diagnostic with the relevant fills, cancels, modifies, oracle-proposal-states that should explain divergence.
- **Bulk actions** — "trust venue for all Polymarket-USDC discrepancies during the gas-spike window."
- **On-chain-specific reconciliation** — for Polymarket, the platform queries on-chain state directly (token balance, contract position state, oracle proposal state) and compares to the platform's recorded state. On-chain reconciliation is the most reliable check.
- **Oracle-proposal-state reconciliation (Aria-specific)** — for Polymarket positions in the dispute window, the platform's recorded resolution should match the on-chain proposer-and-dispute state. Mismatch is rare but catastrophic if undetected.

**Auto-trigger:**

- The platform runs continuous reconciliation in the background; minor discrepancies that resolve within seconds do not surface.
- Discrepancies above a threshold ($ size or duration) escalate to alerts.
- Aria can run a manual full reconciliation on demand — typically end-of-day or after an incident.

#### 12.3.4 Emergency Modes

A specific UI mode Aria can switch into during a crisis (see supervisor console mode-switching, section 14.2).

**Emergency mode reorganizes the screen:**

- **Manual ticket pinned** — large, foveal.
- **Cross-venue execution router foveal** — with current per-venue depth, account state, bridging state.
- **Live position state across all venues** — second-largest panel, showing what's open and where.
- **Working orders across all venues** — what's resting that Aria might need to cancel.
- **Resolution-source-state monitor foveal** — feed health, disputes-in-flight, oracle proposer states.
- **Strategy intervention console** — pause / kill controls visible.
- **Alert console** — relevant alerts streaming.
- **On-chain operational state** — gas-price tracker, bridge-congestion tracker, recent on-chain incidents.

Hotkeys preserved; muscle memory from manual mode is the trader's most valuable asset during a real emergency.

**Switching into emergency mode** is a single keystroke. Switching back is one keystroke. Work-in-flight (research notebooks, etc.) preserved; nothing lost.

**Emergencies in Aria's domain (illustrative):**

- Polymarket smart-contract exploit; flatten on-chain positions; bridge to safety.
- Kalshi regulatory action freezing settlement; manual reconciliation; capital-egress decisions.
- Major oracle dispute on a high-capital contract; manual intervention; rebid / withdraw decisions.
- Resolution-source feed corrupted during release window (BLS print delayed/revised); manual halt of resolution-window-momentum strategies; reconciliation post-print.
- Major polling aggregator publishes corrected data hours before resolution; affected monitors paused; manual review of affected positions.

#### 12.3.5 Manual Trading Hotkeys (Always Available)

Even in default research mode, certain manual-trading hotkeys are global:

- **Open manual ticket** for currently-focused contract.
- **Flatten focused contract** across all venues (combined position).
- **Cancel-all-on-focused-contract.**
- **Hedge-to-flat focused contract** (auto-pair against optimal hedge venue).
- **Buy YES at offer / Buy NO at offer** (focused contract).
- **Switch to next contract in pre-resolution queue.**
- **Switch to emergency mode** (keystroke chord; less easily triggered to avoid accidents).

These remain bound regardless of which mode the supervisor console is in. Aria's reflex to react manually is preserved.

#### 12.3.6 Audit & Friction

Manual trading is auditable but not friction-free for non-emergency cases:

- **Ambiguous-resolution intervention** — moderate friction. Confirmation gate; resolution-criteria interpretation field mandatory; tag mandatory.
- **Reconciliation** — friction matched to size; small reconciliations one-click; large ones require reason.
- **Discretionary override** — full friction: reason field, confirmation gate, override tag mandatory. The friction reflects the consequence — directional override outside the systematic framework should be a deliberate decision.
- **Speculative experimentation** — moderate friction; tag mandatory.

Every manual trade enters the same audit trail as algo trades. Searchable, reviewable, exportable.

#### 12.3.7 Why this matters

- **Efficiency:** in an emergency, seconds to a working manual ticket = real PnL preservation. The platform's manual surfaces are first-class even when not the primary surface.
- **Risk:** reconciliation is a real operational risk, especially with on-chain venues where the venue state is the on-chain state (no support team to correct). A designed reconciliation workflow prevents chronic state-divergence.
- **PnL:** ambiguous-resolution events are where Aria's edge concentrates — these are the moments when domain reading creates the largest gaps from market price. Manual capability is not a fallback; it's a primary alpha-capture tool for the highest-leverage moments of her quarter.
- **Platform validation:** if Aria can place every trade her strategies make from the manual UI — including cross-venue arb legs, basket execution, on-chain Polymarket trades with full wallet management, regulated-venue Kalshi trades with position-limit checks — the platform's execution layer is verified end-to-end. This is the cleanest integration test of the entire trading stack.

### 12.4 Kill Switches at Multiple Scopes

Layered kill switches per [#19 Kill Switches](common-tools.md#19-kill-switches-granular):

- **Per-strategy kill** — cancel all working orders + flatten positions on this strategy.
- **Per-cluster kill** — flatten the politics cluster; flatten the geopolitical cluster.
- **Per-venue kill** — pull all firm activity from this venue (Polymarket / Kalshi / Smarkets / Betfair).
- **Per-resolver-source kill (Aria-specific)** — flatten every position resolving from a compromised UMA proposer or contested Kalshi committee adjudication.
- **Per-edge-source kill (Aria-specific)** — pause all polling-edge strategies during major aggregator-methodology shifts; pause all OSINT-edge strategies during conflict-database degradation.
- **Fleet-wide kill** — Aria's entire automated cousin (all her ~250 monitors and strategies). Multi-confirmation.
- **Firm-wide kill** — David + CIO + risk-officer; multi-key authentication for catastrophic events.

Each scope's kill is a designed action: cancel-or-flatten configurable, audit-trail mandatory, reversal procedure documented.

### 12.5 Intervention Audit Log

Append-only log of every intervention. Searchable / filterable / exportable.

- Per-row: timestamp, scope, actor, action, reason, pre-state, post-state, downstream effect (positions closed, P/L impact, working orders canceled).
- Used in post-incident review, regulator request, behavioral self-review (was I over-intervening this quarter?).

### 12.6 Why this matters

- **Efficiency:** intervention scoping (per-strategy / cluster / venue / resolver-source / fleet) lets Aria respond proportionately to incidents.
- **Risk:** every intervention is auditable. Catastrophe response (Polymarket exploit, major oracle dispute) is designed; the platform has practiced it.
- **PnL:** the cost of over-intervention is missed PnL; the cost of under-intervention is realized loss. Granular controls plus disciplined auditing balance both.

## 13. Post-Trade & Decay Tracking

The feedback loop from yesterday's resolutions into tomorrow's research. For Aria, post-trade is **calibration-driven first, P/L second** — Brier score is the truer signal because P/L can be path-dependent on which markets happened to resolve in the window.

### 13.1 Per-Strategy Retrospectives

Auto-generated per strategy on a configurable cadence (weekly + monthly).

**Layout:**

- **Header** — strategy name, period covered, current stage.
- **Calibration vs expectation panel:**
  - Realized Brier in the period vs research-time expected distribution.
  - Calibration curve overlay: realized vs backtest counterfactual.
- **Resolved-markets log:**
  - Every market that resolved during the period: predicted prob, market price at entry, realized outcome, P/L.
  - Per-edge-source attribution.
- **Drawdown decomposition:**
  - Recent drawdown periods.
  - Per-drawdown: which markets contributed, what features / regime drove it.
- **Regime fit:**
  - % of period in each regime (election cycle stage / Fed regime / conflict-event-rate regime).
  - Per-regime calibration.
- **Capacity realized vs assumed:**
  - Slippage, fill rate, partial fills per venue.
- **Recent interventions and effect:**
  - What was paused, capped, retrained; observed effect.
- **Drift state:**
  - Feature, prediction, calibration drift snapshot.
- **Recommended action:**
  - Continue / retrain / cap / monitor / retire — with rationale.

Aria reads these end-of-week, on the strategies needing attention.

### 13.2 Fleet-Level Review

Auto-generated weekly + monthly.

**Layout:**

- **Total Brier and P/L decomposition:**
  - By cluster (politics / econ / geopolitics / tech / weather / sports / crypto-native).
  - By edge source (model / polling / expert / structural / arb).
  - By venue.
  - By time horizon (short-resolution vs long-resolution).
  - By confidence tier.
- **Calibration-adjusted contribution:**
  - Per strategy: Brier contribution to fleet, marginal Brier (if removed, what would fleet calibration be).
- **Marginal contribution analysis:**
  - "If I added $X to monitor A, expected incremental calibrated edge is Y."
  - Diminishing-returns curves per cluster.
- **Correlation evolution:**
  - Strategies that should be uncorrelated drifting together.
  - Cluster shifts.
- **Capacity utilization across the fleet.**
- **Cycle-aware view (Aria-specific):** for political models, performance segmented by election-cycle stage (primary / general / runoff); for econ models, by Fed-regime; for geopolitical, by conflict-rate regime.

Aria reads this Sunday evening; informs Monday capital-allocation decisions.

### 13.3 Calibration-and-Decay Metrics Surface

A dedicated dashboard for catching decay early. **Aria-specific: calibration is the headline.**

**Layout:**

- **Calibration-over-time per strategy** — rolling Brier with confidence bands. Statistical-significance flag on declining trend.
- **Per-edge-source calibration evolution** — has polling edge held up? Has expert-network edge degraded? Has structural-bias edge become arbed away?
- **Half-life estimates** — how long does this alpha persist before halving. Strategies in the bottom quartile (fastest decay) flagged.
- **Feature-importance drift** — features whose importance is shifting per model.
- **Backtest vs live divergence** — point estimate + distribution.
- **Cross-cycle decay (Aria-specific):** for political and econ models, did the model's edge degrade from one cycle to the next? Cycle-over-cycle Brier deltas.

Decisions: queue retrain, cap, demote to monitor, retire.

### 13.4 Retrain Queue UI

When the platform proposes retraining (calibration-drift triggered, schedule triggered, performance triggered, methodology-shift triggered), the proposal queues here.

**Layout:**

- **Queue table** — strategy, model version, retrain reason (calibration drift / scheduled / pollster methodology shift / cycle ended), proposed training data window, estimated compute cost, estimated improvement.
- **Per-row actions:** approve, defer, customize, reject.
- **Auto-approval thresholds** — strategies in monitor / pilot can have auto-approve enabled for routine retrains; live strategies require explicit approval.
- **Retrain history** — past retrains and their outcomes (did the new version actually improve calibration?).

### 13.5 Retire Decisions

Retirement proposed by the platform; approved by Aria.

**The proposal:**

- Calibration decay confirmed (statistical evidence linked).
- Better strategy in the same niche (replacement candidate).
- Path to recalibration / retraining exhausted.
- Capital freed by retirement.
- **Niche dissolved (Aria-specific):** sometimes a contract type stops listing (e.g. a venue delists a category) and the strategies covering it are retired by attrition.

**The approval workflow:**

- Aria reviews.
- Approves: strategy moves to retired, capital freed, audit logged.
- Rejects: strategy stays, with reason ("regime change might reverse; give 30 more days").
- Modifies: e.g. "retire the polling-vs-market House model but keep the Senate variant; the Senate calibration is still positive."

### 13.6 Why this matters

- **Efficiency:** retrospectives are auto-generated. Aria reads, she doesn't compose.
- **Risk:** decaying strategies are caught by calibration metrics, not by Aria's anecdotal sense. Calibration drift is a faster signal than P/L drift.
- **PnL:** retraining cadence is data-driven. Capital trapped in dying strategies is recycled into fresher edge. The Learn → Decide loop closes — and for Aria, the loop closes around resolved-markets-log entries which become the running corpus that feeds calibration tracking and the next quarter's research priorities.

## 14. The Supervisor Console — Aria's Daily UI

The supervisor console integrates all the surfaces above into one workspace. It's the layout / mode-switching / spatial organization of everything described.

### 14.1 Aria's Monitor Layout (Illustrative)

Aria runs 6 monitors. Her automated-mode layout adapts the manual layout (Phase-1 markets pipeline + research workspace + cross-venue dashboard prominent) to the automation surfaces:

| Position      | Surface                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Top-left      | **Fleet supervision dashboard** (default amber + red filter, cluster-aggregation rows visible)                                |
| Top-center    | **Research workspace** (notebook environment) — primary working surface                                                       |
| Top-right     | **Anomaly / alerts console + calibration-and-decay surface**                                                                  |
| Middle-left   | **Strategy detail page** (drill-down when investigating) OR **per-domain research workspace** (politics / econ / etc.)        |
| Middle-center | **Active-resolution-window live state + capital-lockup heatmap** — peripheral most days, foveal during pre-resolution windows |
| Middle-right  | **Promotion gate queue + experiment tracker + retrain queue**                                                                 |
| Bottom-left   | **Macro / regime context** — Fed expectations, equity / commodity / DXY, key political news, election calendar                |
| Bottom-right  | **Resolution-source health monitor + cross-venue spread monitor + news / domain feeds**                                       |
| Tablet        | Substack / X / Discord / domain-expert feeds; venue-specific Telegram / Discord                                               |

The console's center of gravity is **research workspace + fleet supervision**. The manual terminal's center of gravity (markets pipeline + active research workspace + cross-venue dashboard) is now distributed: the markets pipeline is subsumed by the fleet dashboard; the active-market research workspace is now per-domain research; the cross-venue dashboard is now the cross-venue spread monitor. Manual surfaces (probability-quoted ticket, cross-venue router, on-chain wallet management) are hotkey-summonable but not foveal in default mode.

### 14.2 Mode-Switching

The console has modes; switching reconfigures the layout:

- **Research mode (default during quiet hours):** notebook environment foveal; per-domain research workspace foveal; supervisor + alerts in periphery.
- **Supervision mode (alert-driven):** fleet dashboard + strategy detail in foveal positions; research workspace minimized.
- **Resolution-window mode (active during pre-resolution windows on major contracts):** active-resolution-window live state + resolution-source-health monitor foveal; manual ticket pinned for hold-to-settle decisions; cross-venue spread monitor foveal.
- **Election-night mode (election-cycle-specific):** state-by-state results-feed integration foveal; per-state-call-vs-prediction comparison foveal; resolution-window-momentum strategies' state foveal; manual ticket and cross-venue router pinned.
- **Data-release mode (CPI / NFP / FOMC days):** nowcast-vs-market panel foveal; resolution-source-feed health (BLS / FRED) foveal; data-release-window monitors' state foveal.
- **Event mode (Polymarket exploit, Kalshi regulatory event, oracle dispute, polling aggregator methodology shift):** anomaly console + intervention console + cross-venue capital state + reconciliation surface foveal; research minimized.
- **Pre-market mode:** fleet review + alerts + macro context dominant.
- **Post-market mode:** decay + retrospectives + capital allocation + experiment-priority-queue dominant.

Switching is one keystroke. Work-in-flight (open notebooks, pending interventions) preserved.

### 14.3 Anomaly-Driven Default State

The console is **green-by-default**. Most of the day, Aria is heads-down in research; the supervisor surface is quiet. When something goes off, alerts route to her via:

- Banner on screen (auditable).
- Audio (configurable per severity).
- Mobile push (when away from desk).
- Phone page (for catastrophe-tier alerts only — Polymarket exploit, oracle dispute on a high-capital contract, fleet-wide kill recommended, BLS feed corrupted during release window).

Aria trusts the platform's silence. False-positive alerts erode this trust quickly; the platform's tuning of severity / thresholds / suppression is critical to her productivity.

### 14.4 Why this matters

- **Efficiency:** time-on-research is Aria's primary leverage. The console design ensures research is foveal-by-default, supervision is peripheral-by-default. This is the inverse of the manual terminal.
- **Risk:** mode-switching to event mode in seconds during a Polymarket exploit or major oracle dispute is the difference between contained damage and runaway loss.
- **PnL:** the cognitive shift from foveal-on-positions to peripheral-on-fleet is what makes 250 monitors tractable. Without it, scale is impossible — and scale is where the firm's prediction-market alpha lives, given how diverse the contract universe is.

## 15. Aria's Automated-Mode Daily Rhythm

Prediction markets are a global, multi-venue, multi-jurisdiction market. Aria's "day" is bounded by her shift; the strategies run continuously. Overnight supervision is split (a colleague covers Asia-night for major-contract resolution windows that occur then) or handled by the automated supervisor with escalation rules.

The cadence is **release-and-resolution-driven** — election nights, data-release windows, FOMC weeks, major-event resolution-windows are the structuring features of the calendar. Quiet weeks are research-dominated.

### 15.1 Pre-Market (60–90 min)

The day starts with **fleet triage and research-priority setting**, not with reading a polling aggregator update.

**Fleet review (15–25 min):**

- Glance at supervisor console. Default: most strategies green; investigate amber + red.
- Read overnight session attribution: which monitors generated alerts, which positions resolved, which behaved out-of-distribution.
- Read alerts queue from overnight — calibration drift, feature drift, resolution-source feed degradations, venue events.
- Make morning decisions: pause this monitor whose calibration drift exceeded threshold; promote that pilot to live; cap this one whose capacity is exhausted.
- Verify all positions are at intended state — no overnight surprises.
- For nights when major contracts resolved: review resolved-markets log; per-contract: predicted-prob vs market-price vs realized-outcome; lessons.

**Research catch-up (15–25 min):**

- Skim experiment-tracker results from overnight runs.
- Promote winners; archive losers with notes.
- Review canary-deployment results from yesterday's promotions.

**Macro / regime / cycle read (15–20 min):**

- Read morning notes — sell-side macro, internal research, polling-aggregator updates, geopolitical situation reports — through the news / domain feeds.
- Identify regime-shift signals (FOMC week, CPI day, election-cycle stage transition, major polling aggregator methodology change, major geopolitical event imminent).
- Consider: are any of my strategies fragile to today's regime? Cap them, hedge them, or leave alone.
- Quick check on venue / oracle health (Polymarket on-chain state, Kalshi system status, UMA proposal queue, recent disputes).

**Resolution-window check (10–15 min):**

- Markets resolving today / this week — review per-contract policy (hold-to-settle vs flatten); confirm positions are at intended state.
- Resolution-source feed health for the day's expected-resolving contracts.

**Promotion-gate decisions (5–10 min):**

- Strategies waiting for promotion sign-off: review the gate evidence, sign off or send back with notes.
- Coordinate with David on any promotions material to firm risk.
- Coordinate with Diego on cross-domain monitors (sports prediction-market overlap).

**Coffee / clear head:**

- Step away. Cognitive load of the day is research-heavy plus per-domain reading-heavy; preserve focus.

### 15.2 In-Market (continuous, anomaly-driven)

This is the radical shift from manual trading. Most of the day is **research and per-domain reading, not supervision**.

**Default state:** Aria is in the research workspace or in per-domain reading. Notebooks open, domain feeds streaming. Working on:

- A new monitor idea (from yesterday's review).
- Feature engineering (e.g. "does adding fundraising-velocity-residual improve House race calibration").
- Polling-aggregator methodology review (rare but high-stakes).
- Per-domain reading — political analysts, AI researchers, weather forecasters, geopolitical analysts, OSINT.
- Model retraining for a strategy showing calibration drift.
- Hyperparameter sweep on a candidate model.
- Diagnosing a monitor that underperformed yesterday.
- Evaluating a new contract type listing on Kalshi or Polymarket.
- Reading new sell-side / academic / Substack research and prototyping ideas.

**Background:** supervisor console is open in another monitor; default green. Alerts route to mobile when she's heads-down.

**Alert response (5–10% of the day):** when an alert fires:

- Drill into the strategy detail page.
- Diagnose: is this a true anomaly (intervene) or a known transient (acknowledge)?
- If intervene: pause / cap / replace. Document the decision.
- If known transient: acknowledge with reason; system learns the pattern over time.

**Pre-resolution-window response (rare but real):** as a major contract approaches resolution (T-72h, T-24h, T-1h), Aria switches to resolution-window mode briefly. Monitors firing in the window are reviewed; hold-to-settle vs flatten decisions confirmed for high-stakes positions; resolution-source feed health verified.

**Liquid-event override (rare):** major polling aggregator publishes corrected mid-cycle data, surprise data revision, geopolitical headline, oracle dispute. Aria switches to event mode:

- Pause sensitive strategies (or let them ride if confident in regime-handling).
- Use manual ticket for any high-conviction directional bet (with override tagging).
- Return to default mode when event normalizes.

**Mid-day capital-allocation review:** glance at allocation engine drift indicators. Material drift triggers a rebalance proposal; she approves or defers.

**Cross-trader coordination:** brief desk-chat exchanges with adjacent peers (Diego on cross-domain sports markets; Quinn on cross-archetype factor overlap; Rafael on cross-asset macro reads informing econ contracts; Theo on weather features for temperature contracts).

### 15.3 Post-Market (60–90 min)

End-of-day review and tomorrow's research priorities.

**End-of-day attribution (15–20 min):**

- Today's calibration delta and P/L decomposition — by cluster, by venue, by underlying, by edge source.
- Identify outliers — monitors that significantly outperformed or underperformed expectation.
- Verify all positions are at intended state.
- For days with resolved markets: resolved-markets log entries reviewed; calibration corpus updated.

**Calibration-and-decay check (10–15 min):**

- Run the calibration surface: any strategies whose Brier trend is concerning?
- Any strategies needing retraining? Approve the retrain queue or queue for overnight.
- Any features whose drift is growing?

**Capital allocation (10–15 min):**

- Review nightly allocation proposal.
- Approve, modify, or escalate to David.

**Research-priority setting (15–25 min):**

- Based on the day's findings: what's tomorrow's research priority?
- Queue overnight backtests / training runs.
- Update experiment-tracker priorities.
- Note any features to add to the library.

**Per-domain reading (variable):**

- On quiet evenings, deep reading in the day's most-relevant domain. Election-cycle weeks: politics-heavy. FOMC weeks: macro-heavy. Conflict-active weeks: geopolitics-heavy.

**Promotion-gate triage (5–10 min):**

- Strategies ready for promotion review tomorrow morning.

**Sign-off:**

- Confirm all alerts are acknowledged or resolved.
- Confirm fleet is in expected state.
- Hand-off to Asia-night colleague (if a major contract resolves overnight) or rely on automated supervision with escalation rules.

### 15.4 Cadence Variations

Aria's calendar is dominated by event-driven structure:

- **Election-cycle weeks** (primary days, runoff days, general election week, election night) — supervision-heavy; resolution-window mode; election-night mode; manual override-ready; sleep-skipping for major US election nights.
- **FOMC / CPI / NFP weeks** — pre-print preparation; data-release mode during the print; post-print attribution.
- **Major-event resolution windows** (Supreme Court ruling expected, treaty ratification vote, AI lab major announcement window, hurricane landfall window) — pre-resolution-window mode; manual override readiness.
- **Quiet weeks** — research-dominated; the strategies run themselves; Aria invests in alpha-generation and per-domain reading.
- **Quarter-end** — cross-fleet review, retire decisions, capital reallocation, committee report contribution.
- **Cycle-end / year-end** — multi-cycle backtest reviews; cross-cycle calibration analysis; strategic capital rebalances ahead of next cycle.

## 16. Differences from Manual Mode

| Dimension                       | Manual Aria                                             | Automated Aria                                                                                                                 |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Coverage                        | Dozens of high-conviction markets hand-modeled          | Hundreds of markets across politics / econ / geopolitics / tech / weather / sports / crypto-native × 4+ venues                 |
| Trades per day                  | 5–30 across the portfolio                               | Hundreds across the fleet (most arb scanner / basket-rebalance; some monitor-driven manual)                                    |
| Phase 1 (Decide)                | Reading polling aggregators + dossier review            | Supervising hundreds of monitors; choosing per-domain research priorities; managing portfolio of clusters                      |
| Phase 2 (Enter)                 | Probability-quoted ticket / cross-venue router          | Promote monitor through lifecycle gates; manual ticket retained for ambiguous-resolution events                                |
| Phase 3 (Hold)                  | Watching positions per cluster                          | Anomaly-driven supervision of fleet; resolution-window-mode during pre-resolution                                              |
| Phase 4 (Learn)                 | Resolved-markets log + calibration check                | Auto-generated retrospectives; calibration-and-decay surface; cross-cycle review                                               |
| Time on charts                  | Less central than for trading-instrument archetypes     | Even less; calibration curves replace price charts as primary metric surface                                                   |
| Time on research                | 40–50%                                                  | 60–70%                                                                                                                         |
| Time on per-domain reading      | 30–40%                                                  | 20–30% (more leverage per hour because monitors have summarized + classified)                                                  |
| Time on supervision             | 5–10%                                                   | 5–10%                                                                                                                          |
| Time on intervention            | (continuous on active markets)                          | 5–10%                                                                                                                          |
| Time on data / procurement      | Minimal                                                 | 5–10%                                                                                                                          |
| Time on capital allocation      | Per-position sizing                                     | 5–10% (cluster-level + tier-level)                                                                                             |
| Latency criticality             | Modest (most contracts move on info, not micro)         | Moderate for arb scanners (cross-venue execution timing matters); modest for everything else                                   |
| Risk units                      | $-stake + max-payout                                    | Same + per-cluster Brier-contribution + per-resolver-source concentration + capital-lockup-shadow                              |
| Edge metric                     | Brier score, calibration curve, hit rate                | Same + decay rate, capacity utilization, per-edge-source calibration evolution                                                 |
| Cognitive load                  | Foveal-on-active-research-markets                       | Peripheral-on-fleet; foveal-on-research-or-anomaly                                                                             |
| Failure modes                   | Tilt, recency bias, conviction inflation, missed window | Silent calibration drift, polling-aggregator-pivot blindness, oracle-dispute concentration, resolution-source-feed lookup-leak |
| Tools mastered                  | Markets pipeline, research workspace, ticket            | Notebook, feature library, model registry, lifecycle gates, allocation engine, calibration tracker, arb scanner                |
| Compensation driver             | Brier + ROI per stake                                   | Same + research velocity + fleet calibration + cross-cycle improvement                                                         |
| Resolution-criteria reading     | Aria does it for every active contract                  | Aria does it for every new contract type and for ambiguous-resolution events; the platform tracks wording verbatim             |
| Cross-venue arb                 | Aria spots and executes by hand                         | Continuous scanners + auto-stage-and-execute within caps; Aria approves high-stakes                                            |
| Calibration tracking            | Per-edge-source by hand from the resolved-markets log   | Per-edge-source per-cluster auto-tracked with rolling Brier; sizing engine auto-adjusts                                        |
| Coverage of long-tail contracts | Skipped due to attention-cost                           | Covered by autonomous monitors within risk caps; long-tail edge no longer left on the table                                    |

The fundamental change: **Aria stops being the analyst-trader and becomes the principal investor in her own event-research fund — with calibration-driven sizing, cross-venue automation, and per-domain monitoring at scale, while preserving her judgment for what only she can do: resolution-criteria interpretation, ambiguity calls, and edge-source weighting.**

## 17. Coordination with Other Roles

### 17.1 Coordination with Diego

Diego is Aria's sister archetype on the event-markets desk. Diego runs in-running sports markets in real time; Aria runs prediction markets across all event domains. **Sports overlap** is the primary coordination surface:

- **Tournament-outcome contracts (pre-event).** World Cup winner, NBA Finals champion, Super Bowl winner — these are pre-event prediction markets that fit Aria's framework but where Diego's domain expertise (team form, stat models, injury reads, lineup impact) is the primary edge source.
- **MVP / award-style contracts.** Contract resolves on a season-end committee vote; Diego's domain reading drives the model.
- **Domain ownership conventions** — who owns which leg of an overlapping market. Default: Aria owns multi-day-out tournament-outcome markets; Diego owns same-day match outcomes and in-running.
- **Attribution split rules** — when both desks contribute (Aria's calibration + Diego's domain feature), attribution is shared per pre-agreed weights.
- **Operational handoff** — when a tournament-outcome market enters its same-day final stage, Diego's in-running engine takes over; Aria's monitor exits or transitions.
- **Cross-venue overlap** — sports prediction markets list on Polymarket / Kalshi (where allowed) plus Diego's bookmaker venues; cross-venue arb opportunities require coordination on capital and execution.
- **Joint experiments** — joint research on cross-domain alpha (e.g. tournament outcomes informed by both Aria's polling-style aggregation and Diego's xG-based model).

### 17.2 Coordination with Quinn

Quinn runs cross-archetype factor / stat-arb / market-neutral systematic strategies. Some overlap exists for Aria — particularly when prediction-market contracts correlate with cross-asset factors (a Fed-cut contract on Kalshi correlates with rate-market positions on Quinn's fleet; a tech-AI contract correlates with semiconductor-equity factors). They coordinate to avoid double-up:

- **Correlation matrix shared** — Quinn's cross-archetype fleet vs Aria's fleet pairwise correlations visible to both.
- **Promotion-gate awareness** — Quinn promoting a new stat-arb strategy that touches Aria's domain alerts Aria; if Aria's existing monitors would correlate, they negotiate (split capacity, kill one, etc.).
- **Feature sharing** — features Aria builds (per-edge-source calibration, per-cluster correlation, polling-aggregator-derived) are useful to Quinn (and vice versa); the library is the connector.
- **Research collaboration** — joint research on cross-archetype topics (e.g. macro-regime indicators that affect both Aria's econ contracts and Quinn's macro factor strategies).

### 17.3 Coordination with David

David is the firm-level supervisor. Aria's automated cousin is a $-allocated fleet within David's purview.

- **Fleet-level reporting** — David sees Aria's ~250 monitors aggregated, with calibration / P/L / risk-consumed visible.
- **Capital allocation gates** — material allocation changes (Aria's slice of firm capital expanding or contracting; cross-cycle rotations between politics and econ) route to David.
- **Behavioral monitoring** — David watches Aria's intervention frequency, override frequency, ambiguous-resolution-call frequency. Drift in these is a leading indicator.
- **Promotion-gate sign-off for material strategies** — strategies above a capital-cap threshold require David's sign-off in addition to Aria's.
- **Catastrophe response** — firm-wide kill switches require David + CIO + risk officer; Aria has fleet-level kill autonomy.
- **Risk-committee deliverables** — Aria's monthly attribution + calibration decomposition + lifecycle decisions are inputs to David's committee deck.
- **Cross-jurisdiction risk** — David coordinates the firm's posture across CFTC-regulated (Kalshi), FCA-regulated (Smarkets, Betfair), on-chain (Polymarket), and offshore venues; Aria's per-venue allocation reflects David's per-jurisdiction caps.
- **Resolution-source-concentration risk** — David has firm-level visibility on resolution-source concentration across all desks (not just Aria's) and may impose firm-level caps.

### 17.4 Coordination with Cross-Domain Experts and Adjacent Desks

Aria's domain spans more sub-domains than most archetypes; coordination with adjacent desks is meaningful:

- **Rafael (macro PM).** When Aria runs econ / FOMC / Fed-path contracts, Rafael's macro-regime reads and theme-monitoring feed her edge. When Rafael wants to express a macro theme through a prediction-market contract (e.g. "will GDP exceed X by year-end" as a policy-implication contract), Aria's domain expertise on the contract's resolution mechanics is the constraint. Joint research on cross-asset arb (rates / equities → prediction-markets implied prob) where the implied-probability mapping is non-trivial.
- **Ingrid (rates) / Yuki (FX).** When Fed-path or central-bank-cut contracts list, the rates-market-implied probability is a direct input to Aria's fair-prob estimate. They coordinate on trade structure when both desks have positions implied by the same cut.
- **Theo (energy).** Weather / temperature contracts and energy-related prediction markets (oil-price-by-year-end, OPEC-decision contracts) share data sources; weather feature library is shared.
- **Henry (equity L/S).** Tech / AI prediction-market contracts (lab-release dates, lawsuit outcomes) sometimes correlate with semiconductor-equity / AI-equity positions. They coordinate on capacity and attribution.
- **Naomi (event-driven / merger arb).** Some prediction markets list on regulatory outcomes (M&A-approval, antitrust-decisions); Naomi's regulatory-precedent expertise is the primary edge source. Aria's contract-mechanics expertise is the constraint. Joint deal coverage.
- **Compliance and legal (firm-level).** Per-jurisdiction access (CFTC vs FCA vs on-chain vs offshore), per-contract permissibility, redistribution licensing of polling and government data, on-chain wallet KYC posture. All venue-onboarding decisions go through legal / compliance before Aria operates.
- **Internal research team / external domain experts.** Aria coordinates with internal research analysts (politics, AI, geopolitics, weather) and external paid experts (election analysts, academics, sell-side strategists). Their notes attach to clusters and contracts; their calibration is tracked over time.

### 17.5 Why this matters

- **Efficiency:** without coordination, the firm builds the same monitor twice across desks, doubles up on capacity, dilutes attribution. Coordination layered on visibility tools (shared correlation matrix, promotion alerts, feature library) is cheap.
- **Risk:** correlated bets across desks compound risk; resolution-source-concentration across desks compounds resolution-risk. Visibility prevents accidental over-exposure.
- **PnL:** cross-desk research collaboration produces alpha that no single desk could find alone. Aria's prediction-market expertise plus Rafael's macro plus Ingrid's rates is a stronger fair-prob estimate on FOMC contracts than any one desk produces in isolation.

## 18. How to Use This Appendix

When evaluating Aria's automated terminal (against any platform — including our own):

**Data layer:**

- Are all the prediction-market data sources cataloged with quality / lineage / cost / freshness / used-by tracking?
- Are polling aggregators (538 / Silver Bulletin / Cook PVI / Sabato / RCP / Economist / internal house-effect-adjusted) first-class with raw-poll-level + aggregated-output preserved?
- Are government-data APIs (BLS / Fed FRED / Treasury / BEA / Census / EIA / USDA) cataloged with **resolution-source-relevance flag** for active contracts?
- Are forecasting-model outputs (GDPNow / NY Fed / Cleveland Fed nowcasts) preserved with revision history?
- Are geopolitical-event databases (ACLED / CFR Conflict Tracker), sanctions databases (OFAC / EU / UN), tech / AI release trackers, weather model archives all cataloged?
- Are venue pricing archives (Polymarket / Kalshi / Smarkets / Betfair) preserved with full L1/L2 + trade tape + OI history?
- Is the procurement dashboard a serious tool with attribution-vs-cost evidence?
- Is gap analysis tied to concrete contracts that can't be modeled?
- Is **resolution-source-feed health monitoring** during release windows escalated correctly (BLS / FRED / AP / oracle-on-chain-state)?

**Feature library:**

- Are Aria's features (polling-aggregator-fair-prob, polling-trend-velocity, pollster-house-effect-residual, nowcast-consensus-delta, cross-venue-spread, oracle-proposer-track-record, dispute-risk-zscore, per-edge-source-calibration) first-class with drift monitoring?
- Is the **resolution-source-derived flag** on features triggering extra governance review?
- Is the polling-aggregator-shift detector distinguishing expected (announced methodology) vs unexpected (silent vendor) drift?
- Is cross-pollination across desks (Theo's weather, Rafael's macro-regime, Henry's corporate-event, Diego's xG) supported?

**Research workspace:**

- Can Aria go from idea to validated monitor in hours, not weeks?
- Is the backtest engine **resolution-aware** (resolves contracts at their actual historical outcomes; runs disputed-case sensitivity)?
- Is the backtest engine **capital-lockup-aware** (opportunity-cost shadow rate against same-period dry-powder demand)?
- Is the backtest engine **cross-venue execution-realistic** (per-venue slippage, gas, bridging, KYC, position-limit constraints, fee schedules with VIP applied)?
- Is **resolution-outcome leakage detection** (using resolved outcome as feature; using polling-aggregator-revised-after-resolution data) caught by the platform?
- Are anti-patterns (lookahead, survivorship, p-hacking, resolution-data lookup-leak) caught?
- Is the strategy-template library populated with per-domain templates (politics / econ / geopolitics / tech / weather / sports / crypto-native) plus cross-venue arb templates plus resolution-window templates?
- Does the cycle-aware walk-forward view force honest evaluation across election cycles?

**Model registry & experiment tracker:**

- Can any model be re-trained from registered inputs and produce a bit-identical result?
- Are old versions never deleted?
- Is **calibration drift** tracked per model (Aria's primary metric)?
- Does the experiment tracker capture theme-evolution and resolution-precedent-match experiments, not just ML model trainings?
- Is the cycle-aware view available for political-model experiments?

**Strategy composition:**

- Is the composition surface visual + code-droppable?
- Does pre-deployment validation catch lookahead, **resolution-source data leak** (using resolution-print before publish-time), unbounded sizing, missing kill-switches, **resolution-source-concentration**?
- Are the **approval modes** (autonomous / semi-autonomous / approval-required) configurable per strategy?
- Are per-domain templates (politics / econ / geopolitics / tech / weather / arb / resolution-window) provided?
- Is **on-chain execution** (gas strategy, slippage tolerance, approval state) first-class in the composition?

**Lifecycle:**

- Is the pipeline visualization (research → paper → pilot → live → monitor → retired) usable as a daily kanban board?
- Are gates checklists with evidence, not chat conversations?
- Are canary deploys for **calibration-drift-triggered retrains** standard?
- Is rollback one-click?

**Capital allocation:**

- Does the allocation engine propose a nightly portfolio with **per-cluster + per-tier + per-venue** decomposition?
- Is the **capital-lockup heatmap** a primary planning tool?
- Are per-resolver-source concentration caps enforced?
- Are cycle-rotation moves (politics during election years; econ between cycles) supported?

**Live fleet supervision:**

- Can Aria supervise 250+ monitors anomaly-driven, default green, with prediction-market-specific columns (calibration tier, resolution-source-state, days-to-resolution, edge-source weights, drift indicators)?
- Is **calibration tier** (Aria's primary metric) the sort-default for the fleet?
- Is the strategy detail page a complete diagnostic surface?
- Are anomalies severity-routed with auto-actions on critical?
- Is **strategy state inspection** (internal variables, current feature snapshot, recent signal evaluations, regime classifier output, **arb-detection state with current spreads / leg-out risk / bridging state**, **calibration state**) available on demand per strategy?
- Is **backtest-vs-live comparison** computed (daily by default, on-demand available) for divergence catching, **including calibration-curve overlay**?
- Is the platform pragmatic about state-streaming load (refresh-on-demand and event-pushed, not constant streaming for all 250 strategies)?
- Is the **active-resolution-window live state** panel (with resolution-source health, active-disputes, pre-resolution alerts) foveal during pre-resolution windows on major contracts?

**Intervention console & manual trading:**

- Are kill switches granular (strategy / cluster / venue / **resolver-source / edge-source** / fleet / firm) with multi-key authentication for the largest scopes?
- Is **the full manual order ticket** (probability-quoted, cross-venue router, triangular-arb stager, basket / cluster ticket, hedge ticket, on-chain wallet management, regulated-venue controls, Kelly calculator inline, hotkeys) preserved and one-keystroke-reachable?
- Is **emergency mode** a designed UI mode with manual ticket + cross-venue router + position state + resolution-source monitor + on-chain-operational state foveal?
- Is **reconciliation** a designed workflow (algo state vs venue state, with diff highlighting and per-row actions, including **on-chain reconciliation** for Polymarket and **oracle-proposal-state reconciliation**)?
- Is every manual trade tagged (**ambiguous-resolution-intervention** / reconciliation / discretionary-override / speculative-experimentation) and auditable, with attribution flowing through?
- Are global manual-trading hotkeys (flatten, cancel-all, hedge-to-flat, open-manual-ticket, switch-to-next-pre-resolution-contract) bound regardless of supervisor mode?
- Is every intervention logged with timestamp / actor / action / reason / pre-state / post-state?

**Post-trade & decay:**

- Are retrospectives auto-generated, not composed?
- Is decay caught by **calibration metrics** (Brier, calibration-curve), not gut?
- Is the resolved-markets log the running corpus that updates calibration and feeds Phase-4 reviews?
- Is per-edge-source calibration evolution tracked (model / polling / expert / structural / arb)?
- Is cross-cycle decay (political models, econ models) flagged at cycle transitions?
- Is the retrain queue actionable, with auto-approval for routine retrains and explicit approval for live strategies?

**Supervisor console:**

- Is research foveal-by-default and supervision peripheral-by-default?
- Is mode-switching (research / supervision / resolution-window / election-night / data-release / event / pre-market / post-market) one keystroke?
- Is the platform green-by-default and trustworthy in its silence?

**Daily rhythm:**

- Can Aria actually spend 60–70% of her time on research and per-domain reading while the fleet runs supervised in the periphery?
- Are pre-market / in-market / post-market workflows supported by the right surfaces in the right modes?
- Are election-night / data-release / pre-resolution-window cadences supported by mode-switches?

**Coordination:**

- Is Aria's fleet visible to Diego (sister archetype, sports overlap), Quinn (cross-archetype), David (firm-level), and adjacent peers (Rafael / Ingrid / Yuki / Theo / Henry / Naomi) at the right level of detail?
- Are cross-desk correlation, promotion alerts, feature sharing first-class?
- Is **cross-jurisdiction venue posture** (CFTC / FCA / on-chain / offshore) coordinated firm-level?

**Cross-cutting:**

- Is lineage end-to-end (data → feature → model → monitor → strategy → trade → resolved-outcome → calibration)?
- Is reproducibility guaranteed?
- Are audit trails non-negotiable?
- Is **resolution-criteria wording stored verbatim** for every contract, with diffs highlighted on contract amendments?
- Is **per-edge-source attribution** flowing all the way through to compensation drivers?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones. For Aria's archetype in particular, gaps in **resolution-source monitoring**, **calibration tracking**, **cross-venue arb infrastructure**, and **on-chain wallet management** translate directly to alpha left on the table or risk silently absorbed. The terminal that makes Aria a principal investor in her own event-research fund is the terminal that automates the mechanics of cross-venue scanning, calibration-driven sizing, and resolution-source health — while preserving every surface she needs to read a contract, interpret an ambiguous resolution, or weight an edge source by domain judgment.
