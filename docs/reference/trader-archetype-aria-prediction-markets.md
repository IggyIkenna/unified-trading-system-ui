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
