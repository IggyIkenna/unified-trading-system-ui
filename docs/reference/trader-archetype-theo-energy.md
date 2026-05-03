# Trader Archetype — Theo Rasmussen (Senior Energy Trader)

A reference profile of a top-performing energy trader at a top-5 firm. Used as a yardstick for what an ideal **energy / commodities** terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For shared platform surfaces, see [common-tools.md](common-tools.md). For Theo's unique surfaces indexed alongside other archetypes, see [unique-tools.md](unique-tools.md). For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md). For sister archetypes on the same desk, see the other `trader-archetype-*.md` files in this folder.

---

## Who Theo Is

**Name:** Theo Rasmussen
**Role:** Senior Energy Trader
**Firm:** Top-5 global trading firm (commodities desk within multi-strat platform, or a specialist energy fund)
**Book size:** $500M – $2B notional, with $30M – $150M VaR
**Style:** Discretionary, fundamentals-driven, multi-week to multi-quarter horizons. Calendar spreads dominate.
**Coverage:** Crude (WTI, Brent, Dubai), refined products (RBOB gasoline, ULSD heating oil, jet fuel, gasoil), natural gas (Henry Hub, TTF, JKM), power (PJM, ERCOT, German), some adjacent (carbon EUAs, biofuels)
**Instrument types:** Futures (front month + curve), calendar spreads, crack spreads, location spreads, time spreads, options (futures options + OTC), swaps, physical exposure (rare for a financial desk, but understood)

### How he thinks differently

Energy is **physical-aware finance**. Theo's mental model:

- The price of oil reflects **supply, demand, storage, and logistics** — not just sentiment. A pipeline outage matters more than a chart pattern.
- Almost every trade is **calendar-shaped** — long Dec, short Mar, betting on the spread. Outright direction is hard; relative-value is the bread and butter.
- **Seasonality is real.** Winter heating drives natgas; summer driving drives gasoline; cold snaps blow out heating-oil cracks; hurricane season disrupts Gulf production.
- **Locations matter.** WTI (Cushing) ≠ Brent (North Sea) ≠ Dubai. Same product, different geography, different dynamics. Inter-location spreads are first-class trades.
- **Cracks and crushes** — oil into gasoline + diesel — relate inputs to outputs. Refiner economics are tradable.
- **Inventories are the price.** Weekly EIA petroleum / DOE natgas reports move markets. Storage vs 5-year average is the central indicator.
- **OPEC and geopolitics** drive crude. Wars in producing regions, sanctions, OPEC+ decisions, SPR actions.
- **Weather drives natgas and power.** HDD/CDD, hurricane forecasts, polar vortex.

### His cognitive load

Theo holds in his head:

- **Forward curves** for every product — typically 12–60 months out.
- **Spread structures** — calendar, location, crack — each its own market.
- **Storage levels** vs seasonal norms.
- **Fundamental drivers** — production rates (rigs, OPEC quotas, US shale productivity), demand indicators (refining utilization, miles driven, jet demand), inventory flows.
- **Weather forecasts** at multiple horizons (1–14 days, monthly, seasonal).
- **Geopolitical flashpoints** — Middle East, Russia sanctions, Venezuela, Libya, Iran, Houthi shipping.

The terminal must surface **physical reality** alongside financial pricing.

---

## Physical Setup

**6 monitors**, with forward curves and spread tables prominent.

| Position      | Surface                                                                             |
| ------------- | ----------------------------------------------------------------------------------- |
| Top-left      | **Forward curves** — WTI, Brent, HH natgas, products; current vs historical         |
| Top-center    | **Spread dashboard** — calendar, location, crack, crush spreads with z-scores       |
| Top-right     | **Inventory & fundamentals** — EIA / DOE / IEA / OPEC reports, storage levels       |
| Middle-left   | **Charts** — outright + spread charts, multi-TF, with seasonal overlays             |
| Middle-center | **Positions, exposures, P/L by product / by spread**                                |
| Middle-right  | **Order entry — outright, calendar spread, crack, options tickets**                 |
| Bottom-left   | **Weather + geopolitics + news** — forecasts, conflict tracking, OPEC headlines     |
| Bottom-right  | **Macro tickers, related markets** — DXY, equities, freight rates, refining margins |
| Tablet        | Bloomberg / Reuters chat, IB commodity strategist notes, weather services           |

Theo's days are **calendar-driven**: weekly EIA report (Wed 10:30am ET for petroleum, Thu 10:30am for natgas), monthly OPEC report, monthly IEA report. These structure his week.

---

## Phase 1: Decide

### Forward curves (the primary thinking surface) — UNIQUE

For each product (WTI, Brent, Dubai, HH natgas, RBOB, ULSD, gasoil):

- **Current curve** — futures prices by month, out 12–60 months.
- **Curve overlay** — current vs 1d / 1w / 1m / 1y / 5y-avg.
- **Curve shape labeling** — backwardation (front > back) vs contango (back > front), with magnitude badge.
- **Spread breakdown** — adjacent calendar spreads (Mar-Apr, Apr-May, …) as a sub-curve.
- **Implied storage cost** in contango — the curve premium for holding.
- **Term structure of vol** — IV by tenor on options.

### Spread dashboard — UNIQUE

The trader's bread and butter. Spreads are first-class instruments, not derived views:

- **Calendar spreads** — every adjacent and non-adjacent pair (M1-M2, M1-M3, M1-M6, M1-M12) with z-score vs historical.
- **Location spreads** — WTI-Brent, Brent-Dubai, WTI-WCS (Canadian), WTI-LLS (Light Louisiana Sweet), HH-TTF (US-Europe natgas), TTF-JKM (Europe-Asia LNG).
- **Crack spreads** — 3:2:1 crack (3 oil → 2 gasoline + 1 distillate), gasoline crack, distillate crack, by region.
- **Spark spread** — natgas vs power (refining-equivalent for power generation).
- **Dark spread** — coal vs power.
- **Crush spreads** for ags (soybean → meal + oil) — adjacent commodity.
- **z-scores** on each spread vs 1m / 6m / 1y / 5y history.
- **Seasonal overlays** — current spread vs 5-year seasonal average band.

### Inventory & fundamentals dashboard — UNIQUE

The single most important data layer in energy:

- **EIA Weekly Petroleum Status** — crude, gasoline, distillate, jet fuel inventories. Total + by PADD region. Vs prior week, vs 5y avg, vs 5y range.
- **EIA Weekly Natural Gas Storage** — total + by region (East, Midwest, Mountain, Pacific, South Central). Working gas.
- **OPEC Monthly Oil Market Report** — production, demand forecasts, OECD inventory.
- **IEA Monthly Oil Market Report** — global supply/demand balance.
- **Strategic Petroleum Reserve** — US SPR levels, recent actions.
- **Floating storage** — ships at sea with crude (Vortexa-style data).
- **Refining utilization rates** — % of capacity running.
- **Rig counts** — Baker Hughes, US oil + gas rigs.
- **Production data** — US weekly, OPEC monthly, Russia (where reported).

### Weather & seasonality tracker — UNIQUE

Energy is a weather market:

- **Heating / Cooling Degree Days (HDD/CDD)** forecasts — 1–14 day, 30-day, 90-day. Vs normal, vs prior year.
- **Population-weighted temperature forecasts** — actual demand-relevant.
- **Storm tracker** — Atlantic / Pacific hurricanes during season; threats to Gulf production / refining.
- **Polar vortex / arctic blast** indicators.
- **El Niño / La Niña (ENSO)** seasonal context.
- **Snowfall, drought** — affecting natgas demand, hydropower.

### Geopolitical & supply tracker — UNIQUE

- **Conflict / sanctions tracker** — Russia, Iran, Venezuela, Libya, Iraq.
- **Houthi shipping attacks** — Red Sea / Suez impact on flows.
- **OPEC+ meeting calendar** — JMMC, ministerial meetings, with countdown.
- **OPEC+ production targets** vs realized (per-member compliance).
- **US shale productivity** — DUC (drilled uncompleted) wells, well completions, production per rig.
- **LNG export terminals** — US capacity additions, outages.
- **Pipeline outages** — Colonial, TC Energy, Druzhba, etc.
- **Refinery outages** — turnarounds, fires, planned maintenance.

### Carbon & adjacent markets — UNIQUE

- **EUA (EU carbon allowances)** — increasingly correlated with European energy.
- **California carbon (CCA), RGGI** — US.
- **Renewable fuel credits (RINs).**

### Charting

See [#1 Multi-Timeframe Charting](common-tools.md#1-multi-timeframe-charting). **Theo-specific characteristics:**

- Outright **and** spread charts (calendar / location / crack as first-class chartable series).
- 5-year **seasonal overlay** band on every series.
- Inventory release annotations (EIA / DOE / OPEC / IEA dates marked).
- Multi-TF; longer horizons (weekly/monthly) more useful than for short-term traders.

### Refining margin board — UNIQUE

Gasoline crack, distillate crack, jet crack by region (USGC, NWE, Singapore). Refiner economics tradable.

### Macro & positioning inputs

- **DXY, US 10y yield, equities, freight rates** (Baltic Dry, VLCC, Suezmax — physical demand proxy), global PMIs, China refinery throughput.
- **CFTC Commitments of Traders** — managed money positioning by contract; ICE for Brent.
- Sell-side strategist morning notes; physical desk color (refining margins, blender economics, where physical traders see flows).

**Layout principle for Decide:** forward curves and spread dashboards are foveal. Inventory release dates structure the week. Weather and geopolitics are continuous peripherals.

---

## Phase 2: Enter

Energy execution is **calendar-spread native**, **location-aware**, and **product-fragmented** (futures vs options vs swaps vs cleared OTC).

### Tickets — outright, calendar spread, crack, options, swaps

**Outright futures ticket** — see [#2 Order Entry Ticket](common-tools.md#2-order-entry-ticket-framework). Tick-size aware (NYMEX WTI $0.01 = $10/contract; HH natgas $0.001 = $10/contract); last-trade-date flagged; contract-month selector front-and-center.

**Calendar spread ticket — UNIQUE (first-class):** two contract months (long Dec24, short Jun25), spread quoted as a single price differential, atomic execution via exchange-recognized spread combos (e.g. CME calendar combos), z-score history vs entry shown inline, carry / storage implication called out.

**Crack / location spread ticket — UNIQUE:** multi-leg multi-product (long crude, short gasoline, short heating oil for 3:2:1 crack), standard ratio templates (3:2:1, 2:1:1, gasoline-only, distillate-only), quoted in $/bbl of refining margin.

**Options ticket** — see [#2](common-tools.md#2-order-entry-ticket-framework). Futures options (American, expire ~1 month before futures); templated multi-leg structures (straddle, strangle, calendars, ratios); vol-quoted entry; greeks displayed.

**Swaps / OTC ticket:** basis differentials (e.g. WTI Midland vs Cushing), index-on-a-month, OTC options for non-listed strikes, RFQ workflow to broker-dealer panel, cleared-vs-bilateral awareness.

### Roll workflow — UNIQUE

Energy futures expire monthly; rolling is constant. **Roll calendar** flags first-notice-day and last-trade-day per position; **roll algos** are calendar-spread-aware (TWAP through roll window watching the spread); **cost-of-roll tracker** accumulates vs theoretical mid.

### Pre-trade preview, algos, hotkeys

- **Pre-trade preview** — see [#3](common-tools.md#3-pre-trade-risk-preview). Adds DV01-equivalent by tenor, spread P/L per scenario for multi-leg, basis-risk flag for cross-hedges, margin (initial + maintenance + variation).
- **Algos** — see [#4](common-tools.md#4-execution-algos-library). Adds calendar-spread-aware outright execution, inventory-release-aware (pause / accelerate around EIA Wednesday), settlement-window algos for trade-at-settlement (TAS).
- **Hotkeys** — see [#6](common-tools.md#6-hotkey-system). Buy/sell at top of book per contract month; cancel-all on contract month; **roll position forward** (single key); flatten product across all months.

**Layout principle for Enter:** the calendar spread ticket is first-class, not buried. Crack spreads are templated. Options structures are templated. Roll is a designed workflow, not an ad-hoc action.

---

## Phase 3: Hold / Manage

Energy positions evolve through the curve as time passes (roll), as fundamentals shift (inventory, weather), and as events erupt (geopolitics).

### Positions, working orders, PnL, risk

- **Positions blotter** — see [#7](common-tools.md#7-positions-blotter). Outright positions by product × month; spread positions (calendar / location / crack) as composite objects with drill-down to legs; **forward exposure ladder** showing net position and DV01-equivalent per tenor; greek-equivalents (price sensitivity per $1 move; vega for options).
- **Working orders** — see [#8](common-tools.md#8-working-orders-blotter). Grouped by contract month within product; calendar-spread orders shown as one composite, not two legs.
- **Live PnL** — see [#9](common-tools.md#9-live-pnl-panel). Energy-style decomposition: outright price PnL, curve-change PnL, spread P/L, roll cost (accumulated), vol PnL (options); per-product / per-spread breakdown.
- **Risk panel** — see [#10](common-tools.md#10-risk-panel-multi-axis). Axes: position by product & month vs limits, spread exposure (calendar / location / crack) vs limits, DV01-equivalent total, vega for options, liquidity profile (most-traded vs back-month illiquidity), margin & collateral consumption.

### Stress / scenarios — physical-aware library — UNIQUE

See [#11 Stress / Scenario Panel](common-tools.md#11-stress--scenario-panel). **Theo-specific scenarios:**

- **Outright shocks** — WTI ±$10, HH natgas ±$1.
- **Curve shocks** — front contango → backwardation, parallel shifts.
- **Crack widening / narrowing.**
- **Hurricane scenario** — Gulf production -20%, refinery outages.
- **OPEC surprise** — 1mb/d cut or release.
- **SPR release** — 30M barrels.
- **Cold snap / heat wave** scenarios for natgas.
- **Geopolitical** — Iran-Israel conflict, $100 → $130 oil.

### Inventory release countdown — UNIQUE

- **EIA Wednesday countdown** — minutes-to-release.
- **Pre-release positioning** by product.
- **Consensus expectation** — survey of analysts.
- **Whisper number** — desk consensus.
- **Recent surprises** — pattern of how surprises move price.

### Calendar, news, alerts, journal, heatmap, comms, kill switches

- **Calendar** — see [#12](common-tools.md#12-catalyst--event-calendar). EIA weekly (Wed 10:30am ET petroleum, Thu 10:30am natgas), DOE weekly, OPEC monthly, IEA monthly, OPEC+ JMMC / ministerial meetings, contract roll dates (first-notice / last-trade-day), hurricane season window, winter heating season.
- **News & research** — see [#13](common-tools.md#13-news--research-feed). Product-tagged (crude / gasoline / distillate / natgas / power / carbon); always-on geopolitical conflict feed; OPEC headlines and SPR actions surfaced; weather-service integration.
- **Alerts** — see [#14](common-tools.md#14-alerts-engine). Theo-specific types: spread z-score, inventory release (pre + post-surprise), HDD/CDD forecast divergence, geopolitical keyword (war / sanctions / pipeline / refinery), roll (contract approaching expiry).
- **Trade journal** — see [#15](common-tools.md#15-trade-journal). Thesis links a fundamental driver (inventory build, weather event, OPEC decision, geopolitical premium); updated around inventory and OPEC events.
- **Heatmap** — see [#16](common-tools.md#16-heatmap-of-own-book). Products / spreads sized by exposure × today's move, colored by intraday PnL %.
- **Communications** — see [#17](common-tools.md#17-communications-panel). Bloomberg / Reuters broker chat, sell-side desk color, physical desk chat (if firm has one), weather service, geopolitical analyst feed.
- **Kill switches** — see [#19](common-tools.md#19-kill-switches-granular). Reduce by product (flatten gasoline, keep crude); reduce all energy; **hedge to neutral** (buy front-month to offset back-month); cancel all working orders.

**Layout principle for Hold:** spread positions and forward exposure are foveal. Inventory countdown and weather/geopolitics are critical peripherals. Roll workflow is always pending in the background.

---

## Phase 4: Learn

Energy post-trade emphasizes **fundamentals fit**, **spread vs outright skill**, **seasonal pattern recognition**.

### Trade history, attribution, performance, equity curve

- **Trade history** — see [#21](common-tools.md#21-trade-history--blotter-historical). Tagged by trade type (outright / calendar / location / crack) × theme (inventory build, weather event, OPEC, geopolitics).
- **PnL attribution** — see [#22](common-tools.md#22-pnl-attribution-multi-axis). Axes: outright vs spread vs cracks (different skills); by product (crude vs natgas vs power); by tenor (front vs back-month); by season (winter natgas vs summer gasoline); by event type.
- **Performance metrics** — see [#23](common-tools.md#23-performance-metrics). Adds hit rate by trade type / event type; **DV01-equivalent return** (risk-adjusted); **carry capture** (earned roll yield in backwardated curves).
- **Equity curve** — see [#24](common-tools.md#24-equity-curve). Event markers for EIA surprises, OPEC decisions, hurricane landfalls, geopolitical breaks.

### Spread / inventory / weather / geopolitical analytics — UNIQUE slicing

- **Spread mean-reversion** — when did the spread converge? Half-life of dislocations by product. Stop-out vs target-hit ratio.
- **Inventory trade analytics** — pre-release positioning vs result; surprise direction skill; surprise magnitude calibration.
- **Weather trade analytics** — forecast-driven outcomes vs realized weather.
- **Geopolitical trade analytics** — event response speed; persistence of geopolitical risk premia (when did they fade?).
- **Seasonal pattern fit** — multi-year backtest of recurring seasonal trades; was the entry timely within the seasonal pattern?

### TCA, behavioral, reports, compliance

- **TCA** — see [#25](common-tools.md#25-execution-quality--tca-transaction-cost-analysis). Roll cost vs theoretical (calendar spread mid); block / RFQ best-quote frequency by counterparty; per-leg slippage on multi-leg structures.
- **Behavioral analytics** — see [#26](common-tools.md#26-behavioral-analytics). Inventory-week discipline (held through release or exited?); weather-forecast trust (over- or under-reacted?); geopolitical reaction (chased news or faded it?).
- **Reports** — see [#27](common-tools.md#27-reports). Daily P/L commentary (especially around inventory days); weekly portfolio review; monthly attribution by product / spread / event; quarterly investor / committee letter.
- **Compliance** — see [#28](common-tools.md#28-compliance--audit-trail). CFTC large trader reports; position limits per contract.

**Layout principle for Learn:** spread / event / seasonal slicing. Pattern-matching across years is the key learning loop.

---

## What Ties Theo's Terminal Together

1. **Forward curves are first-class.** Every product is a curve, not a price.
2. **Spreads are first-class instruments.** Calendar / location / crack with z-scores and dedicated tickets.
3. **Physical reality is surfaced.** Inventories, production, refining utilization, pipeline / refinery outages.
4. **Weather is a market input.** HDD/CDD, hurricanes, polar vortex, droughts.
5. **Inventory release calendar dominates the week.** EIA Wednesday, DOE Thursday, OPEC monthly.
6. **Geopolitics drives crude.** Conflict tracking, sanctions, OPEC+ meetings.
7. **Seasonality is explicit.** Charts and dashboards overlay 5-year seasonal averages.
8. **Roll workflow is designed.** Energy futures roll constantly; the terminal supports it as a first-class action.
9. **Multiple products, unified surface.** Crude, products, natgas, power, carbon — all comparable, all sliceable.
10. **Stress scenarios are physical-aware.** Hurricane, OPEC surprise, SPR release, cold snap — energy-specific shocks.

---

## How to Use This Document

When evaluating any energy / commodities terminal (including our own), walk through Theo's four phases and ask:

- Are forward curves and spread dashboards foveal visualizations?
- Are calendar / location / crack spreads first-class order tickets?
- Are inventory releases and weather forecasts integrated as live data?
- Is the inventory release calendar a planning spine?
- Are stress scenarios physical-aware (hurricane, OPEC, SPR, weather)?
- Is roll workflow designed (calendar, algos, cost tracking)?
- Are seasonal overlays available on charts and spreads?
- Is geopolitical news integrated and product-tagged?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.

# Automated Mode

This appendix describes Theo's terminal and daily workflow once his energy edge is encoded into models, rules, and scaffolds running at scale — what he does, what he sees, and what stays human. The manual sections above describe Theo at his desk hand-watching forward curves, spread tables, and weather forecasts across crude, products, natgas, power, and carbon. This appendix describes the same Theo running a fleet of automated strategies and decision-support scaffolds across the same product universe — while the most consequential energy judgment calls (OPEC headlines, hurricane tracks, refinery outage interpretation, geopolitical premium reads) remain his.

The strategy logic itself (what models, what features, what rules — the actual alpha) is out of scope. This appendix is about **the terminal he works in**: every surface he sees, every panel, every decision he makes, every workflow that supports him.

For the universal automated-trading platform concepts this builds on, see [automation-foundation.md](automation-foundation.md). For the structural template that defines section shape and adaptation rules, see [automation-archetype-template.md](automation-archetype-template.md). For the depth-and-voice reference (crypto-specific content; do not import that domain content here), see [trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md).

Theo sits in the **partially-automatable** tier. Calendar spreads, crack-spread mean-reversion, inventory-window setups, weather-driven natgas patterns, and seasonal cycles encode well into rules and models. OPEC headline trading, hurricane-track judgment, refinery-outage interpretation, and geopolitical premium reads do not — and in this appendix the platform is opinionated about that line. Automation gives Theo coverage from a handful of hand-watched products to a fleet running across crude (WTI, Brent, Dubai), refined products (RBOB, ULSD, jet, gasoil), natural gas (Henry Hub, TTF, JKM), power (PJM, ERCOT, German), and adjacent (EUAs, biofuels) — with seasonal lifecycles wired into the deployment cadence.

> _Throughout this appendix, examples are illustrative — actual venue lists, strategy IDs, dataset names, feature names, and metrics shown are sample shapes to make the surfaces concrete. The platform's real catalog will differ._

## 1. What Theo's Edge Becomes

His manual energy edge encoded as automated **strategy classes**, each spawning many **strategy instances** across products, locations, tenors, seasonal regimes, and parameter profiles. Energy markets are physical-aware: every class below carries a fundamental thesis (storage, weather, refinery economics, OPEC supply discipline) that the strategy mechanically expresses.

- **Calendar-spread strategies (M1-M2, M1-M3, M1-M6, M1-M12).** Adjacent and non-adjacent calendar spreads on every actively-traded curve point, mean-reverting to z-scored bands when seasonality and inventory regime support it. Hundreds of instances across (product × spread tenor × venue). Specialized variants for the Dec-Jan winter natgas spread, the May-Jun summer-driving gasoline spread, and the Cushing-bearish front-vs-back WTI roll window.
- **Weather-driven natgas strategies.** When HDD or CDD forecasts diverge significantly from population-weighted norms — and when the divergence persists across multiple weather model providers (GFS, ECMWF, ICON, UKMET) — directional or curve-shape positions on Henry Hub and TTF, sized by the divergence z-score and the storage-deficit-vs-5y-band gate. Wakes up in autumn (October), most active during winter peak demand, sleeps in spring (April).
- **Inventory-setup strategies (pre/post EIA Wednesday, DOE Thursday).** Pre-release positioning when desk-survey vs whisper-number divergence exceeds threshold; post-release continuation strategies that ride the directional surprise for N hours; mean-reversion strategies that fade the overshoot on extreme prints. Fully inactive in the 5-minute pre-release blackout window (configurable). Distinct strategy instances per product (crude, gasoline, distillate, natgas).
- **Crack-spread mean-reversion (3:2:1, 2:1:1, gasoline crack, distillate crack).** Crack spreads compress and widen on refining-margin economics; mean-reversion bands by region (USGC, NWE, Singapore) with refinery-outage and turnaround-calendar gates. Sized down or paused when planned outages overlap the holding horizon.
- **OPEC-event scaffolding (pre-positioned for sentiment, scoped for human override on the actual headline).** Around scheduled JMMC and OPEC+ ministerial meetings, the platform pre-positions modest sentiment scaffolds based on prior-meeting reaction templates and current production-vs-quota compliance. **The strategy explicitly does not trade the headline itself.** When the headline crosses the wire, the strategy auto-pauses, kills its working orders, and surfaces the position to Theo for an explicit override / unwind / hold decision. The scaffolding is the dry-powder; Theo is the fire.
- **Location-spread strategies (WTI-Brent, Brent-Dubai, WTI-WCS, WTI-LLS, HH-TTF, TTF-JKM).** Inter-location spreads with pipeline-flow, shipping-rate, and arbitrage-window inputs. Vortexa-style floating-storage and tanker-tracking data feeds the WTI-Brent and TTF-JKM models. Sized down when sanctions or shipping-disruption events make the spread regime structurally different.
- **Seasonal cycle strategies (winter heating, summer driving, hurricane season, shoulder seasons).** Multi-year backtested seasonal patterns (e.g. distillate strength into Q4, gasoline crack widening into Memorial Day, natgas storage-injection-season spreads). Lifecycle-aware: automatically wake up at the season's standard start window, sleep at season-end. The fleet's seasonal calendar is visible on the supervisor console.
- **Rig-count and US-shale-productivity setups.** Baker Hughes weekly rig-count surprises; DUC drawdown signals; production-per-rig regression-residual signals. Slow-cadence (weekly), longer-horizon strategies on WTI front-month and front-end of the curve.
- **Spark-spread and dark-spread strategies.** Natgas-vs-power and coal-vs-power for European and US power markets. Generation-economics-driven; correlated with EUA carbon levels in Europe.
- **Sanctions-regime monitoring strategies.** Scaffolds (not headline-traders) for Russia, Iran, Venezuela, Libya. Track sanctioned-flow data (tanker-tracking + ship-and-bunker registries) and pre-position when flow indicators move beyond threshold. The actual sanction-announcement headline-trade stays Theo's.
- **Refinery-outage strategies.** Ingest planned-turnaround calendars and unplanned-outage news; trade the affected crack spreads when the outage window meaningfully shifts the regional balance. The "is this outage real / how long will it last" interpretation stays human.
- **Carbon (EUA) and adjacent strategies.** EUA-vs-European-power, EUA seasonality, RGGI / CCA mean-reversion, RIN-credit-driven biofuel basis. Smaller fleet, increasingly correlated with European energy.

Each strategy class has 5–30 live instances at any time (product × location × tenor × parameter profile). Total fleet: ~120–180 strategies, smaller than Marcus's because energy product and venue counts are smaller, and many sub-product spreads share parameter profiles. The fleet expands during winter (winter natgas + heating-distillate strategies wake up) and contracts during shoulder seasons.

Theo's day is no longer "watch the EIA print and trade the surprise." It is "make sure the inventory-window fleet is correctly configured and within risk for this Wednesday; review the weather-divergence triage; supervise the calendar-spread book; and stay free to interpret the OPEC and geopolitical signals that the platform deliberately won't trade." The terminal must support this scale-up without forcing him to manually touch each instance.

## 2. What Stays Theo

The platform automates execution, mean-reversion, calendar-spread structures, and most of the inventory / weather-driven setups. What stays him:

- **OPEC headline interpretation.** When OPEC+ announces a production cut, extension, or compliance change, the headline alone is not the trade — the trade is what the cartel _means_ by it (signal of further cuts? signal of cohesion fracture? signal of sanctions-evasion product flow?), and how the market will price discipline credibility. Theo's read on cartel politics, member-state economics, and historical reaction asymmetry is the trade. The platform pauses the OPEC scaffolding fleet on a confirmed headline; Theo decides what to do.
- **Hurricane-track judgment.** Forecast cones widen as a storm develops; the difference between "Cat 3 landfall in Houston" and "Cat 3 landfall in Tampa" is the difference between a major Gulf-of-Mexico production-and-refining disruption and a relatively contained East-Coast power event. Theo reads NHC discussion text, comparing model forecast skill at the current basin and time of year. The platform surfaces multi-model forecasts; Theo interprets the convergence (or divergence).
- **Refinery-outage interpretation.** A refinery fire makes the wires; whether it's a 48-hour electrical issue, a 4-week hydrocracker rebuild, or a 6-month compliance-driven shutdown determines the trade. Theo reads operator commentary, photos, satellite imagery, and historical-base-rate patterns for that refinery. The platform tracks the outage; Theo interprets it.
- **Geopolitical premium reads.** A Houthi missile strike, an Israel-Iran exchange, a Russian pipeline incident — when does the premium fade, when does it persist, when does the market over-price escalation, when does it under-price? These calls draw on regional knowledge, historical-base-rate intuition, and judgment about response asymmetry. The platform surfaces the events and tracks shipping flows; Theo prices the premium.
- **OPEC+ compliance interpretation.** Per-member compliance with quota varies by month; Theo reads which members are over-producing because of fiscal stress, which are under-producing because of capacity issues, and which are signaling discipline ahead of the next meeting. The platform shows production-vs-quota; Theo interprets it.
- **Sanctions evasion and grey-fleet flow reads.** Sanctioned crude flows through obscured channels (ship-to-ship transfers, dark fleet AIS-disabling, third-country re-blending). Identifying the structural shifts in these flows is forensic, narrative-laden judgment. The platform tracks anomalies in flow data; Theo reads them.
- **Refinery turnaround season interpretation.** Spring and fall turnaround seasons compress refinery utilization; Theo's call on whether this season will be heavy or light, on which refiners are pulling forward maintenance, and on which products will see margin compression vs widening, is judgment-heavy. The platform tracks the calendar; Theo interprets it.
- **Cross-asset-with-energy regime calls.** When DXY rallies sharply, when global PMIs roll over, when freight rates compress (signaling slowing physical demand), Theo decides whether the energy book should reduce, hedge, or hold. The platform surfaces the cross-asset state; Theo decides.
- **New-instrument and new-venue judgment.** When a new LNG hub launches, when an exchange lists a new product (Murban futures, Asian sour-crude products, regional power contracts), when a new pipeline goes online — the call to add the product to the universe and how to onboard it is human.
- **Seasonal cycle endpoint judgment.** The platform's seasonal lifecycles wake up and sleep on standard windows (winter starts October 1, ends March 31, etc.). Theo overrides when an unusual season is in evidence (a cold autumn, a mild winter, a hurricane-disrupted summer). The platform proposes; Theo modifies.
- **Catastrophe response.** Major refinery explosion, gulf-region hurricane landfall, OPEC-meeting walkout, oil-export-terminal attack, sudden sanctions package: the first 60 seconds of judgment beat any pre-coded response. Theo's role is rapid triage; the platform's role is to make triage actionable (one-click pause-OPEC-fleet, one-click flatten-all-Gulf-exposure, one-click pull-all-orders-at-distressed-venue).
- **Strategic capital allocation across his own desk.** The allocation engine proposes; Theo approves or modifies. Material reallocations (more to natgas at expense of crude, or more to calendar spreads at expense of outright) are decisions, not optimizations.

The platform is opinionated about what to automate and humble about what cannot be. Theo's judgment surfaces are made higher-leverage by automation — not bypassed. The OPEC-scaffolding pattern is the canonical example: the platform handles the boring pre-positioning so Theo's attention is unspent and ready when the headline crosses.

## 3. The Data Layer for Theo

The data layer is the substrate of energy automation. Without it, no inventory-setup strategy is reliable, no weather-divergence model is honest, no refinery-outage scaffold is auditable. Theo interacts with the data layer constantly — when researching new alpha, when diagnosing a misbehaving strategy, when evaluating a new licensable feed (a new tanker-tracking provider, a new weather-model archive, an upgraded EIA-archive product), or when proposing a procurement.

### 3.1 The Data Catalog Browser

Theo's home page when he opens the data layer is the catalog browser. A searchable, filterable list of every dataset the firm has, scoped to what's relevant for energy / commodities work.

**Layout (sketch):**

- **Left sidebar** — taxonomy filters: data type (curves / spreads / inventory / production / weather / shipping / refinery / OPEC / news / fundamentals); cadence (real-time / 5-min / 1h / weekly / monthly / static); license tier (premium / standard / public); cost band (free / sub-$50k / $50k–$250k / $250k–$1M / $1M+); coverage (per product family — crude / products / natgas / power / carbon).
- **Main panel** — table of datasets matching filters. Columns: name, source / vendor, coverage summary (e.g. "EIA Weekly Petroleum Status, 1990–present, all PADDs"), cadence, freshness indicator (green / amber / red — staleness vs SLA), license terms, annual cost, owner, last-updated.
- **Right pane** — when a dataset is selected: full description, schema, sample rows, lineage graph, quality history, license document link, procurement notes, "click to add to a notebook" button.

**Search** — free-text across names + descriptions + schema fields. "EIA petroleum" jumps to the EIA Weekly archive; "ECMWF HDD population-weighted" finds the right derived weather feed.

**Quick actions** — bookmark a dataset, request access to a restricted dataset, propose a procurement evaluation, flag an issue.

### 3.2 Theo's Core Datasets (Illustrative)

A senior energy trader's data footprint at a top-5 firm spans dozens of feeds across fundamentals, weather, shipping, news, and pricing. Examples of what Theo's catalog tier likely contains — actual catalog will differ:

- **EIA / DOE archives.** EIA Weekly Petroleum Status Report archive (crude, gasoline, distillate, jet fuel by PADD, 1990–present); EIA Weekly Natural Gas Storage archive (working gas by region, 1994–present); EIA Short-Term Energy Outlook (monthly forecasts); DOE production data; EIA refinery utilization series.
- **IEA archives.** IEA Monthly Oil Market Report archive; IEA World Energy Outlook annual data; IEA medium-term gas / oil reports.
- **OPEC data.** OPEC Monthly Oil Market Report archive; OPEC+ production data per member (with historical revisions preserved); OPEC+ quota / compliance series; JMMC / ministerial meeting outcomes log.
- **Weather model outputs (multiple providers).** GFS (NOAA, 6-hour cadence, 16-day horizon); ECMWF (4-times-daily, 10-day deterministic + 15-day ensemble); ICON (DWD German model); UKMET (UK Met Office). Population-weighted HDD / CDD derived from each model, archived for backtest. Multi-model consensus and divergence metrics.
- **Hurricane-track archives.** NHC / NOAA forecast cones and discussion text archive; historical landfall + impact-on-Gulf-production data; energy-relevant storm classification (Cat 3+ in basin, expected GoM production / refining disruption).
- **Shipping and floating-storage data.** Vortexa-style floating-storage time series; tanker-tracking with origin / destination / cargo / sanctioned-fleet flags; Suez / Bab-el-Mandeb / Hormuz transit counts; Baltic Dry Index, VLCC / Suezmax / Aframax rates; LNG-carrier tracking (with destination flexibility).
- **Refinery operations data.** Refinery-utilization weekly archives (by region); planned-turnaround calendars (Genscape-style or sourced from operators); unplanned-outage incident logs; refinery capacity additions / retirements.
- **OPEC production data and per-member compliance.** Monthly production per OPEC member; quota / target series; per-member compliance % rolling history.
- **Sanctioned-flow tracking.** Russian crude / products flows by destination (with grey-fleet / dark-fleet flags); Iranian crude flows; Venezuelan crude flows. Reconciled across vendors where possible.
- **Pipeline flow data.** Colonial flows (US East Coast products); Druzhba flows (Russia-Europe); TC Energy / Enbridge flows (Canadian crude); LNG export terminal feedgas (US LNG).
- **Curve / spread / settlement data.** ICE / CME futures settlements (front + curve); calendar-spread and crack-spread settlement data; OTC swap quotes (basis differentials); options-volatility surfaces by tenor.
- **Macro tickers.** DXY, US 10Y yield, SPX futures, gold, VIX, freight rates, China refinery throughput indicators — minute-level via standard market-data vendors.
- **CFTC / ICE positioning data.** Commitments of Traders weekly archive; ICE positioning for Brent / gasoil; managed-money long / short / spreading per contract.
- **News and research.** Reuters / Bloomberg energy desks; trade press (Argus, Platts, S&P Global Commodity Insights); sell-side energy research; specialist newsletters (Energy Aspects, ESAI, Rapidan).
- **OPEC-headline + venue-announcement feeds.** Native OPEC Secretariat communications; CME / ICE rule-change announcements; pipeline-operator status pages (Colonial, TC Energy).
- **EUA / carbon and biofuels.** EU ETS auction results and price archive; CCA / RGGI auction data; RIN credit price series; biofuel mandate updates.
- **El Niño / La Niña and seasonal climate indicators.** ENSO state archive; NAO / AO indices; seasonal-forecast output (NOAA CPC, ECMWF SEAS).

Each dataset's record in the catalog shows: license terms, cost, coverage, freshness, lineage, used-by (which features and strategies depend on it), incident history.

### 3.3 Data Quality Monitoring

Every live dataset has continuous quality monitoring. Theo sees this as a heatmap on his catalog, with a dedicated **Quality Console** for deeper investigation.

**Per-dataset quality dimensions:**

- **Freshness** — time since last update vs SLA. Color-coded. Critical for the EIA petroleum and natural-gas releases — release-time-window-aware.
- **Completeness** — null rate per field, gap detection across time series. Particularly for shipping data, where AIS gaps in sanctioned regions are themselves signals (and are tagged as "expected gap").
- **Schema stability** — has the source's schema changed? Field added / removed / typed differently? EIA occasionally restructures PADD definitions; IEA revises history.
- **Distribution drift** — has the statistical distribution of values shifted recently? Useful for catching a broken weather model run, a stale tanker-tracking feed, or a refinery-utilization series that suddenly publishes pre-revision values.
- **Cross-source consistency** — when multiple sources report on the same underlying (e.g. Vortexa vs Kpler-style alternative for tanker-tracking; multiple weather-model vendors for the same domain), do they agree? Disagreement flags.
- **Cost / volume** — query volume against quota, $ spent month-to-date, projected cost for queued workloads.

When something degrades, the dataset's owner is paged. Theo sees the impact: which of his strategies depend on this dataset, what's their state, should he intervene. Special handling for the **EIA release window**: any data quality issue affecting the petroleum or natural-gas series within ±60 minutes of a release escalates instantly — strategies in the inventory-setup class auto-pause.

### 3.4 Lineage Navigator

Every dataset has an upstream lineage and a downstream lineage. The lineage navigator is a graph view Theo opens when:

- A strategy is misbehaving and he wants to trace back to the source data (a calendar-spread strategy skipping signals — is the curve-data feed dropping back-month settlements?).
- A vendor announces a feed change and he wants to see impact scope (Vortexa restructures their floating-storage methodology — which strategies are exposed?).
- A feature is being deprecated and he wants to confirm no strategy depends on it transitively.

**The graph:**

- Nodes are datasets, features, models, strategies.
- Edges are dependencies.
- Color-coded by health (live / degraded / failed).
- Click any node to open its detail page; right-click for "show all downstream" or "show all upstream."

This is a power-user tool used during diagnostic work, not constantly.

### 3.5 Procurement Dashboard

Energy data licenses are a major P&L line item — premium tanker-tracking, premium weather-model archives, and specialist refining databases are six-to-seven-figure annual subscriptions. The procurement dashboard:

- **Active licenses** — every paid feed with annual cost, renewal date, contract terms, owner of the renewal decision.
- **Trial / evaluation feeds** — currently being POC'd, with deadlines and evaluation criteria.
- **Wishlist** — feeds Theo or his peers have flagged as "want," with rationale and expected uplift (e.g. "alternative tanker-tracking provider with better Russia-export classification").
- **Cost attribution** — for each licensed feed, a P/L attribution: which strategies depend on it, and how much P/L those strategies have generated. Crude but useful.
- **Renewal calendar** — what's coming up for renegotiation, with auto-prompt to review usage + attribution before signing.
- **Decision log** — past procurement decisions with rationale, useful for institutional memory.

Theo contributes to procurement decisions especially around **renewal-sensitive feeds**: weather-model providers (ECMWF licenses are notoriously expensive and renewal-cliff-shaped), tanker-tracking, refinery-outage databases, and OPEC-data specialists. Major procurements (>$500k/year) escalate to David / firm-level.

### 3.6 Gap Analysis Surface

The platform identifies gaps:

- **Universe coverage** — Theo's strategies trade WTI, Brent, Dubai, HH, TTF, JKM, RBOB, ULSD, gasoil, jet fuel, PJM / ERCOT / German power, EUAs, RGGI, CCA, RINs, biofuels. The catalog tells him which ones are _not_ fully covered (e.g. an Asian sour-crude product where the firm has no historical curve archive yet).
- **Feature gaps** — features in the library that depend on missing or stale data, blocked from production deployment.
- **Competitor signals** — based on industry intel and feature-attribution gaps, the platform suggests "feeds your competitors likely have that we don't" (e.g. specialist East-Asia LNG nomination data; a rival tanker-tracking provider known to classify grey-fleet flows more accurately).
- **Backfill gaps** — historical data missing for certain periods, blocking walk-forward backtesting.

Gap analysis is not aspirational — it's tied to concrete strategies that can't be deployed. Closing a gap is a procurement decision with a defined ROI estimate.

### 3.7 Interactions Theo has with the data layer

Concrete daily / weekly / monthly:

- **Daily (background):** quality monitor in peripheral; auto-alerts for degradation. Theo glances at the catalog occasionally during research. EIA-release-window monitoring is foveal Tuesday evening through Wednesday afternoon.
- **Weekly:** procurement / wishlist review; reading data-team release notes (new datasets onboarded, schema changes); reviewing weekly EIA / DOE release ingestion confirmation.
- **Monthly:** cost / attribution review; renewal-decision triage; gap-analysis review with the data team. Monthly OPEC and IEA release ingestion confirmation.
- **Ad hoc (during research):** querying the catalog when starting a new strategy idea — "what historical hurricane-impact data do we have at the basin level, going back how far?"
- **Ad hoc (during a strategy issue):** lineage navigator from the misbehaving strategy back to source data.
- **Ad hoc (during an event):** when a vendor degrades during a hurricane / OPEC-meeting / refinery-outage event, the impact-scope view tells Theo exactly which strategies are at risk and what to pause.

### 3.8 Why this matters for efficiency, risk, and PnL

- **Efficiency:** Theo does not waste hours figuring out what data exists or where to query it. The catalog is one click. Every feature he builds is reusable; the next strategy starts ahead of where the last one ended. Inventory-release-window data plumbing is hardened, not improvised.
- **Risk:** quality monitoring catches feed degradation before P/L does. A weather-model archive serving stale population-weighted HDDs into the natgas fleet is the kind of silent error that the quality dashboard surfaces in minutes instead of days. Lineage navigation makes incident triage minutes-fast instead of hours-slow.
- **PnL:** procurement decisions are evidence-driven. Theo does not pay $1M/year for a tanker-tracking feed his strategies don't use; he does aggressively license a $400k/year alternative weather-model archive that opens a multi-model-divergence alpha class worth $5M/year. Gap analysis surfaces uncaptured alpha in licensable form.

## 4. The Feature Library for Theo

A feature is the unit of alpha-vocabulary. Features are engineered transformations of raw data — HDD/CDD divergences, inventory-vs-5y-range z-scores, calendar-spread curvature, refinery-margin compression scores, OPEC-compliance residuals — that models and rules consume. The feature library is where Theo spends much of his research time, because feature engineering is where domain expertise meets quantitative shape.

The library is shared across the firm; features Theo builds are visible to Rafael (macro), to Henry (energy-sector equity), and to Quinn (cross-archetype factors), with appropriate permissions. Likewise, Theo consumes features built by other desks where they apply — Rafael's USD-regime classifier, Henry's energy-equity-momentum factor, Quinn's cross-asset volatility regime indicator. Cross-pollination is a real value.

### 4.1 The Feature Library Browser

Theo's home page when he opens the feature layer.

**Layout (sketch):**

- **Left sidebar** — taxonomy filters: domain (curve / spread / inventory / weather / shipping / refinery / OPEC / sanctions / macro-cross-energy / carbon); cadence (tick / 1m / 1h / EOD / weekly); compute cost (cheap / moderate / expensive); used-by-strategy filter; owner / desk; quality tier (production-grade / beta / experimental); freshness (live / stale / failed).
- **Main panel** — table of features matching filters. Columns: name, version, owner, description, inputs, distribution-state indicator, used-by count, last-modified, performance proxy (median Sharpe of strategies using it).
- **Right pane** — when a feature is selected: full description, code link, lineage graph, distribution monitor, incident history, "show me strategies using this feature" link, "test this feature in a notebook" button.

**Search** — free-text across names, descriptions, code. "HDD population-weighted" finds variants across providers; "calendar spread z-score" finds Theo's and any cross-desk equivalents.

**Quick actions** — bookmark, fork into a personal experimental version, propose a new feature, flag drift.

### 4.2 Theo's Core Features (Illustrative)

Examples of features Theo has built or consumes — actual library will differ.

**Curve and spread:**

- `calendar_spread_zscore_M1_M2_per_product` — front-month vs second-month spread, z-scored against rolling 1y / 5y distribution.
- `calendar_spread_zscore_M1_M6 / M1_M12` — wider tenor calendar spreads.
- `curve_curvature_butterfly` — three-point curve curvature measure (e.g. M1, M3, M6 butterfly).
- `contango_backwardation_label` — categorical regime indicator for current curve shape.
- `implied_storage_cost_bps` — implied storage premium from contango.
- `term_structure_of_iv` — IV curvature across tenors on options.

**Spread (location and crack):**

- `wti_brent_spread_zscore` — Brent-WTI differential, z-scored.
- `brent_dubai_spread_zscore` — Brent-Dubai (light-vs-medium sour) differential, z-scored.
- `wti_wcs_spread_zscore` — Canadian heavy discount.
- `hh_ttf_spread_zscore` — US-vs-European natgas, with shipping-rate-and-LNG-arb adjustment.
- `ttf_jkm_spread_zscore` — Europe-vs-Asia LNG.
- `crack_321_zscore_per_region` — 3:2:1 crack spread, z-scored per region (USGC, NWE, Singapore).
- `gasoline_crack_zscore`, `distillate_crack_zscore` — single-product crack spreads.
- `spark_spread_zscore_per_market` — natgas-vs-power spread, by market.
- `dark_spread_zscore_per_market` — coal-vs-power.

**Inventory:**

- `crude_inventory_vs_5y_zscore` — EIA crude inventory level vs 5-year band.
- `gasoline_inventory_vs_5y_zscore`, `distillate_inventory_vs_5y_zscore` — same for refined products.
- `natgas_storage_vs_5y_zscore` — EIA storage vs 5-year band.
- `inventory_surprise_signed` — actual minus consensus, signed magnitude.
- `inventory_whisper_vs_consensus_divergence` — desk whisper vs official consensus.
- `padd_inventory_imbalance` — regional inventory shifts (PADD 2 vs PADD 3, etc.).
- `floating_storage_change_24h` — Vortexa-style floating-crude delta.
- `refinery_utilization_change_wow` — week-over-week change in refining utilization.

**Weather:**

- `hdd_zscore_population_weighted_consensus` — multi-model consensus HDD divergence from 30y norm.
- `cdd_zscore_population_weighted_consensus` — same for CDD.
- `weather_model_divergence_score` — magnitude of disagreement among GFS / ECMWF / ICON / UKMET.
- `tropical_storm_threat_score` — composite of NHC cone position, storm category, energy-sector exposure.
- `polar_vortex_intensity` — winter cold-snap regime indicator.
- `enso_state_categorical` — El Niño / La Niña / neutral.

**Refinery and outages:**

- `refinery_outage_capacity_at_risk` — barrels-per-day of capacity offline now (planned + unplanned).
- `turnaround_season_intensity` — current vs historical turnaround calendar density.
- `refinery_margin_compression_zscore` — 3:2:1 margin vs 1y rolling distribution.

**OPEC and sanctions:**

- `opec_compliance_per_member` — production vs quota per member, monthly.
- `opec_aggregate_compliance_zscore` — group-level compliance vs target.
- `meeting_proximity_days` — days until next OPEC+ JMMC / ministerial meeting.
- `sanctioned_flow_anomaly` — Russian / Iranian / Venezuelan flow z-score vs trailing.
- `grey_fleet_activity_score` — AIS-disabled / dark-fleet tanker count.

**Macro-cross-energy:**

- `dxy_regime_categorical` — USD regime classifier (consumed from macro desk).
- `china_refinery_throughput_zscore` — China physical-demand proxy.
- `freight_rate_regime_categorical` — VLCC / Suezmax rate regime, physical-demand proxy.
- `cftc_managed_money_position_zscore` — CFTC positioning per contract.

**Seasonality:**

- `seasonal_position_in_cycle` — categorical (early-winter / mid-winter / late-winter / shoulder / etc.).
- `seasonal_5y_average_band` — current vs 5y seasonal band per series.
- `historical_seasonal_pattern_match_score` — pattern-match against multi-year history.

**Carbon:**

- `eua_zscore` — EUA price vs trailing distribution.
- `eua_eu_power_correlation_30d` — rolling correlation indicator.
- `rin_credit_zscore` — biofuel mandate proxy.

These features form Theo's reusable vocabulary. A new strategy he builds picks from this library and combines them. He builds new features when the existing vocabulary doesn't capture an idea (e.g. when he wants to encode a new sanctions-classification methodology).

### 4.3 Feature Engineering Surface

Building a new feature is itself a workflow. The platform supports it inline in the research workspace but also exposes a structured form for the publication step.

**The workflow:**

1. **Idea phase (notebook):** Theo writes the feature definition in Python, tests it on real historical data, inspects shape / distribution / sample values.
2. **Quality gates:** before publishing, the platform runs automated checks — null rate within threshold, outlier rate within threshold, schema validation, computability across the universe of products / regions the feature claims to cover. Particular attention to seasonal robustness — does the feature compute correctly across all months of history including the unusual 2020 / 2022 regimes?
3. **Metadata extraction:** the platform auto-generates lineage, distribution baseline, compute cost, update cadence.
4. **Code review:** required for live-trading features. A peer or Quinn's team reviews.
5. **Publication:** canonical name, version (semantic + content hash), registered.
6. **Backfill:** computed across history, so old strategies can be retrained.
7. **Live deployment:** subscribable at declared cadence.

**The form (schema-style UI):** name, description, owner, inputs, code link, cadence + freshness SLA, universe (which products / regions / venues), tags, documentation notes (regimes where it's known to break — e.g. "natgas inventory features behave anomalously during pipeline-export-capacity additions; use with caution on TTF post-2022").

### 4.4 The Drift Dashboard

Live features drift. Theo's drift dashboard surfaces the worst offenders.

**Layout:**

- **Top panel** — feature drift heatmap: features (rows) × time (columns), cells colored by drift score. Sortable by current drift, by trend, by impact (downstream P/L at risk).
- **Triage queue** — top features needing action.
- **Detail pane** — for a selected feature, the time series of its distribution drift, downstream models / strategies affected, suggested actions.
- **Acknowledgments log** — drifts Theo has reviewed and explicitly accepted (e.g. "ECMWF retired their old HRES variant; expected drift in HDD-divergence feature; no action").

This is one of the most-checked surfaces during diagnostic work. Particular attention during seasonal transitions (autumn → winter, spring → summer) — features with seasonal components legitimately shift, but the platform separates expected seasonal drift from anomalous drift.

### 4.5 Cross-Pollination View

Features built by other desks that might apply to Theo's domain.

**Suggested-similar widget** — when Theo opens a feature, a sidebar shows features built by other desks with similar inputs or tags. "Rafael's USD-regime classifier is consumed by 12 of your strategies."

**Trending features across desks** — what's being built / used most across the firm. Often a leading indicator of where alpha is being found.

**Feature-of-the-week** — a curated highlight from another desk.

This surface is light-touch.

### 4.6 Interactions Theo has with the feature library

- **Daily (background):** drift dashboard glance during morning fleet review; alerts route for features feeding amber/red strategies.
- **Weekly:** browse cross-pollination view; identify candidate cross-desk features to evaluate (e.g. Rafael's geopolitical-event-classifier is potentially useful for sanctions strategies).
- **Ad hoc (during research):** browse + search for features matching a thesis; first move on a new strategy idea.
- **Ad hoc (during feature engineering):** the engineering surface, primarily in the notebook.
- **Ad hoc (during retire):** when a feature is being deprecated (perhaps because its upstream weather-model is being delicensed), Theo reviews downstream impact and decides on replacement.

### 4.7 Why this matters

- **Efficiency:** Theo does not rebuild "HDD population-weighted multi-model consensus" 14 times in 14 different notebooks. He picks it from the library, parameterizes if needed, builds on it. Time-to-strategy-prototype drops from days to hours.
- **Risk:** drift is monitored continuously. A model trained on one weather-regime breaks silently when its features shift; the dashboard catches this before P/L does.
- **PnL:** features are reused across strategies. A high-quality HDD-divergence feature compounds across the natgas fleet; a refined OPEC-compliance feature improves the OPEC-scaffolding fleet and the sanctioned-flow strategies simultaneously.

## 5. The Research Workspace

The research workspace is where Theo turns raw data and features into validated strategies. It is his primary working surface during research-heavy hours — which, in automated mode, is most of the day outside of inventory-release windows and OPEC events.

### 5.1 Notebook Environment

The workspace is notebook-first (Jupyter-style) with a full IDE option.

**Layout (sketch):**

- **Left sidebar** — file tree (Theo's notebooks, shared workspaces, scratch); platform integrations (data layer search, feature library search, model registry browse, experiment tracker, strategy templates); kernel state.
- **Main panel** — the active notebook. Standard Jupyter UX with platform extensions.
- **Right sidebar** — context panel.
- **Bottom panel** — terminal / cell output / experiment-tracker auto-log.

**Critical platform integrations:**

- **One-line data access.** `df = data.load("eia.weekly_petroleum.crude_inventory", since="1990-01-01")`. No SQL fumbling.
- **One-line feature retrieval.** `hdd_divergence = features.get("hdd_zscore_population_weighted_consensus", regions=["US_NE", "US_MW"], since="2010-01-01")`.
- **One-line model loading.** `model = models.get("theo.calendar_spread_lgbm", version="3.1.0")`.
- **One-line backtest.** `result = backtest(strategy=my_strategy, data=hist, period="2015-01-01:2024-06-30")`.
- **One-line plotting.** Helpers for forward-curve charts, spread-z-score time series, seasonal-overlay plots, inventory-vs-5y-band visualizations.
- **One-line experiment registration.** Backtests and training runs auto-register.

**Compute attached to the kernel:** runs on research compute. Dataset size doesn't matter; GPU available when needed; trader's machine doesn't melt under a hyperparameter sweep.

**Persistence and collaboration:** notebooks persist per user; shared workspaces for desk collaboration; real-time collaboration; version control native.

### 5.2 Backtest Engine UI

The single most-used surface in the research workspace.

**Layout when running a backtest:**

- **Form panel** — strategy selector, data window (with explicit option to span specific seasons or specific event windows — e.g. "all hurricane seasons 2015–2023"), products / venues, parameter overrides, execution model parameters.
- **Live progress** — "8.2 of 15.0 years simulated, 55% complete, ETA 6 min." Cancel button.
- **Streaming results** — equity curve building bar by bar.
- **Final results page (when complete):**
  - Summary metrics — Sharpe, Sortino, Calmar, max drawdown, hit rate, expected shortfall, capacity.
  - Equity curve with drawdown shading; benchmark overlay.
  - Per-trade attribution histogram.
  - Slippage breakdown — assumed vs realized.
  - **Regime-conditional performance** — Sharpe by season (winter / summer / shoulder), by curve regime (contango / backwardation), by inventory regime (above-5y-band / within-band / below-band), by macro regime (USD-strong / weak), by event-window (EIA Wednesday, OPEC week, hurricane-active, geopolitical-event-active).
  - **Seasonal attribution** — most energy strategies have seasonal P/L profiles; the engine decomposes year-over-year same-season contribution.
  - **Sensitivity analysis** — parameter perturbation effect on Sharpe.
  - **Robustness checks** — out-of-sample, walk-forward, bootstrap CI on Sharpe.
  - Auto-flagged warnings — lookahead detected; survivorship bias risk; in-sample tuning detected; **calendar-spread expiry-roll bias** (a backtest that forgot to roll properly is a common energy-specific bug); **seasonal-overfit warning** (strategy validated only on a subset of years that happened to share regime).

**Realistic execution simulation is mandatory.** Energy-specific elements:

- **Slippage curves** derived from historical depth, with thin back-month adjustment (back-month futures are illiquid; assumed slippage scales).
- **Calendar-spread atomic execution** modeled as exchange-recognized combos (CME calendar combos), with realistic combo-vs-leg slippage difference.
- **Crack-spread multi-leg execution** modeled with leg-level fill-probability and ratio-imbalance risk.
- **Roll cost** modeled per roll window — front-month roll is the dominant transaction-cost source.
- **Exchange fees** with VIP-tier discounts applied; clearing fees explicit.
- **Block / RFQ probability** for OTC swaps and exotic options structures.

The same execution code runs in live trading as in backtest — divergence between paper and live is rare and investigated.

### 5.3 Walk-Forward Visualization

Walk-forward backtest is the default; the visualization is critical for honest evaluation.

**Layout:**

- **Top:** equity curve broken into training-window and test-window segments.
- **Middle:** Sharpe per test window with confidence interval bars.
- **Bottom:** parameter-stability check.
- **Side:** out-of-sample Sharpe summary, in-sample Sharpe summary, generalization gap.

For energy, walk-forward windows are typically calibrated to span at least 1–2 full annual cycles (so winter + summer + shoulder seasons all appear in training and test) — the platform warns when window choice is insufficient for a seasonal strategy.

### 5.4 Strategy Template Library

A library of pre-built strategy compositions Theo starts from. Reduces time-to-first-strategy from weeks to hours.

**Examples (illustrative):**

- **Calendar-spread mean-reversion template.** Long-deferred / short-front when calendar-spread z-score is significantly low; reverse when high. Parameterized by product, spread tenor (M1-M2, M1-M3, M1-M6), entry / exit z-score thresholds, hold-time cap, seasonal gating, max position size, auto-flatten before front-month last-trade-day. Hedging: built-in (the spread is the hedge).
- **Weather-driven natgas template.** Directional or curve-shape position when HDD/CDD multi-model-consensus divergence exceeds threshold. Parameterized by region, product (HH or TTF), divergence threshold, multi-model agreement gate, storage-state gate (pause when storage is at extreme), hold-time, exit conditions. Seasonal lifecycle: active October–April for HDD-driven, June–September for CDD-driven.
- **Inventory-setup template (pre-EIA / post-EIA).** Pre-release positioning when whisper-vs-consensus divergence exceeds threshold; pause within 5-min release blackout; post-release continuation when surprise direction is significant; mean-reversion fade on extreme prints. Parameterized by product (crude / gasoline / distillate / natgas), pre-release threshold, post-release horizon, fade threshold.
- **Crack-spread mean-reversion template.** 3:2:1 / 2:1:1 / single-product crack mean-reversion to z-score bands. Parameterized by region (USGC / NWE / Singapore), crack ratio, z-score thresholds, refinery-outage gate (pause when affected refining capacity exceeds threshold), turnaround-season gate.
- **OPEC-event scaffolding template.** Pre-positioned sentiment scaffold ahead of scheduled OPEC+ JMMC / ministerial meetings; auto-pause + flatten-working-orders + escalate-to-trader when the headline crosses. Parameterized by meeting type, prior-meeting-reaction template, position sizing (deliberately modest), human-override mode (mandatory).
- **Location-spread template.** Inter-location spread mean-reversion with shipping-rate and arbitrage-window adjustment. Parameterized by location pair (WTI-Brent, HH-TTF, TTF-JKM), shipping-rate gate, arbitrage-window gate.
- **Seasonal cycle template.** Multi-year-backtested seasonal pattern (e.g. distillate-strength-into-Q4). Parameterized by season window, product, position direction, sizing curve through season.
- **Refinery-outage template.** Position the affected crack spread when a meaningful outage is confirmed and lasting. Parameterized by minimum capacity threshold, expected duration gate, region.
- **Spark / dark spread template.** Natgas-vs-power or coal-vs-power mean-reversion in selected markets. Parameterized by market, gate on EUA carbon level (for European markets).

Theo's day starts at a template and customizes from there. Many of his ~150 live strategies are instances of one of ~12–15 templates with parameter profiles tuned per product and region.

### 5.5 Compute Management

- **Active jobs panel** — running jobs with progress, ETA, cost-so-far, cancel buttons.
- **Queued jobs panel** — submitted but waiting.
- **Cost dashboard** — month-to-date compute spend, by job type, with budget guardrails.
- **GPU/cluster availability** — when can a big training job run.
- **Result archive** — completed jobs.

Long-running jobs require explicit confirmation. Cost is always visible. The trader does not manage VMs or queues.

### 5.6 Anti-Patterns the Workspace Prevents

- **Untracked data pulls.** Every query logs lineage.
- **Untracked feature definitions.** A feature defined in a notebook and never published is suspect.
- **Lookahead bias.** The backtest engine refuses to use future data; warnings if the trader tries. Particular attention to **inventory-release-window leak** — a feature accidentally using the post-release print as a pre-release input is flagged.
- **Survivorship bias.** Backtests run on the as-of universe (delisted / discontinued contracts preserved).
- **In-sample tuning masquerading as out-of-sample.** Walk-forward forces honest splits.
- **Reproducibility gaps.** Notebooks that can't be re-run from scratch are flagged.
- **Calendar-spread roll bug.** A backtest that doesn't model the front-month roll correctly will silently overstate Sharpe; the engine validates roll modeling.
- **Seasonal-overfit warning.** Strategies validated on too-narrow a year-set get warned.

### 5.7 Interactions Theo has with the workspace

- **Pre-market:** review overnight backtest / training results; pick winners.
- **In-market (research-heavy hours):** active in the workspace; new strategy ideas, feature engineering, retraining. Compresses around inventory-release-windows when supervision becomes foveal.
- **Diagnostic (when alerted):** pull a misbehaving strategy into the workspace, replicate, diagnose, fix, redeploy.
- **Post-market:** queue overnight jobs.
- **Weekend research blocks:** Sunday afternoon for the next-week's seasonal-cycle review and strategy-parameter refresh.

### 5.8 Why this matters

- **Efficiency:** time-to-validated-strategy compresses from weeks to hours. The seasonal data set is large; the backtest engine running on shared compute is the difference between "I'll model that next month" and "I'll model that this afternoon."
- **Risk:** anti-patterns (lookahead, survivorship, p-hacking, calendar-spread roll bugs, seasonal overfit) are caught by the platform, not by Theo's discipline.
- **PnL:** more validated alpha per quarter. The energy market's seasonal cycles are deep and historically rich; the firm that mines them with rigor compounds advantage.

## 6. The Model Registry

Models are the executable form of Theo's edge. The registry catalogs every model the firm has trained, with full reproducibility guarantees. Whether a gradient-boosted tree predicting calendar-spread mean-reversion, a random-forest predicting EIA inventory surprises, or a structured rule-set for OPEC-meeting scaffolding, every model is a first-class object with identity, training data hash, hyperparameters, performance, and deployment status.

### 6.1 The Model Registry Browser

**Layout:**

- **Left sidebar** — taxonomy filters: model class (gradient-boosted / linear / neural / rule-set); domain (calendar / weather / inventory / crack / OPEC / sanctions / seasonal); owner; deployment status; performance band; drift state.
- **Main panel** — table of models. Columns: name, version, owner, model class, training date, OOS Sharpe, deployment count, drift status, last-modified.
- **Right pane** — model record.

### 6.2 The Model Record Page

Per model, the canonical record:

- **Identity:** model ID, version (semantic + content hash), name, description, owner, code commit.
- **Lineage:** training data hash, feature set with versions, hyperparameters, label definition, training command. Reproducibility guaranteed.
- **Training metadata:** training date, duration, compute used, $ cost, hardware.
- **Performance — multiple regimes:**
  - In-sample / OOS hold-out / walk-forward Sharpe with CI.
  - Per-regime conditional performance — by season (winter / summer / shoulder), by curve regime, by inventory regime, by macro regime, by event window.
  - Capacity estimate.
- **Lineage graph:** parent (if fine-tuned / retrained), children, siblings.
- **Deployment state:** which strategies use which version, in which environments.
- **Drift state:** input-distribution drift, prediction-distribution drift, performance vs expectation.
- **Documentation:** explainability cards (feature importance, partial-dependence, SHAP-style attribution), known failure modes (e.g. "underperforms during pipeline-disruption events"), regime fit notes.
- **Action panel:** "retrain with new data," "deploy to paper," "deprecate," "fork into a new variant."

### 6.3 Versioning & Immutability

- **Semantic versioning** for trader-meaningful changes.
- **Content hash** for guaranteed reproducibility.
- **Old versions never deleted.** A retired model is still in the registry, retrievable, redeployable.
- **Promotion path:** registered (research) → validated (paper) → deployed (live with strategy attached). Each transition auditable.
- **Rollback:** any prior version can be re-deployed in one click.

### 6.4 Drift Surface for Models

Distinct from feature drift, model drift focuses on the model's _outputs_.

- **Prediction-distribution drift** — has the model's prediction distribution shifted vs training-time? KS-test, PSI, custom metrics.
- **Performance drift** — is realized accuracy / Sharpe contribution diverging from backtest?
- **Calibration drift** — for probabilistic models, are predicted probabilities still well-calibrated?

Drift triage queue: top models by drift score, with downstream strategies. Click a row → suggested actions (retrain, recalibrate, replace, retire). Energy-specific: drift triage during seasonal transitions distinguishes expected-seasonal-shift from anomalous shift.

### 6.5 Lineage Graph

Per model, a visual graph:

- Upstream: training data → features → model.
- Downstream: model → strategies → P/L.
- Sister versions: prior versions, with deltas highlighted.

Used during diagnostic work and during model deprecation.

### 6.6 Why this matters

- **Efficiency:** Theo does not waste hours reconstructing what a strategy is running on. The registry says: this strategy uses model X v3.1.0, trained on data hash Y, with hyperparameters Z. Diagnostic loop closes fast.
- **Risk:** without the registry, the firm cannot answer regulator / auditor / risk-committee questions about what's deployed. Reproducibility is non-negotiable.
- **PnL:** retraining cadence is data-driven, not gut-driven. Decay is measured per model; retire decisions are evidence-based.

## 7. The Experiment Tracker

Most research is failed experiments. The experiment tracker is the firm's institutional memory.

### 7.1 The Experiment Browser

Layout:

- **Left sidebar** — filters: researcher, time period, model class, feature set, strategy class, status.
- **Main panel** — table of runs. Columns: run ID, name, researcher, started, duration, status, OOS Sharpe, feature set, parameter summary, annotations.
- **Sortable, multi-select for comparison.**

### 7.2 Per-Experiment Record

Each experiment captures:

- **Trigger:** notebook + cell, scheduled run, hyperparameter sweep, scripted pipeline.
- **Config:** hyperparameters, feature set, period, splits, seed, hardware.
- **Inputs:** feature versions, data snapshot, code commit.
- **Output:** performance metrics, equity curve, attribution, plots, log files.
- **Diagnostics:** runtime, peak memory, errors, warnings.
- **Annotations:** Theo's notes ("tested whether the inventory-surprise feature improves the calendar-spread strategy; modest uplift only in cold winters; archive").
- **Tags:** category, hypothesis, strategy class.

### 7.3 Run Comparison Views

The most-used surface for research velocity.

**Side-by-side comparison (2-way):** two experiments → side-by-side. Diffs: feature-set delta, hyperparameter delta, performance delta, equity-curve overlay, attribution comparison.

**N-way comparison (table form):** multiple experiments in a table; sort / filter on metrics.

**Pareto-frontier views:** which configurations dominate (Sharpe vs drawdown / capacity / complexity). 2D scatter plots; interactive.

**Hyperparameter sensitivity:** vary one parameter, hold others; plot the response curve.

**Ablation views:** "Which features matter most?" — permutation importance or SHAP attribution.

**Seasonal-conditional comparison:** energy-specific. Per experiment, performance broken out by season; compare two experiments' winter-vs-summer Sharpe profiles to see which is more robust.

### 7.4 Anti-Patterns Prevented

- **P-hacking by re-running.** Every run is logged; multiple-testing penalty surfaced.
- **Cherry-picking periods.** Each experiment's period is recorded.
- **Hidden in-sample tuning.** Walk-forward + log of every adjustment makes the trader's process honest.
- **Year-cherry-picking.** A strategy "tested" only on years 2015, 2018, 2021 (three trending years) is flagged when seasonal coverage is non-representative.

### 7.5 Interactions Theo has with the experiment tracker

- **During research bursts:** runs experiments, watches them stream in, picks winners.
- **Between bursts:** browses past experiments to see what was tried; avoids reinventing.
- **In retrospect:** "we shipped this calendar-spread model; what alternatives did we evaluate?"
- **For team handoff:** a researcher leaving the desk hands their successor a tagged set of experiment runs.
- **When David asks:** "show me the evidence behind this strategy promotion" — the experiment tracker has the audit trail.

### 7.6 Why this matters

- **Efficiency:** failed experiments are data, not waste.
- **Risk:** p-hacking is the silent killer of quant research. The tracker makes Theo's process honest and defensible.
- **PnL:** the firm's accumulated experiment knowledge compounds over years.

## 8. Strategy Composition

A model alone is not a tradable strategy. A strategy wraps a model (or a rule set) with sizing, entry/exit, hedging, risk gating, regime conditioning, capacity, and execution policy. For energy specifically, **calendar-spread structure**, **multi-leg crack execution**, **roll-window awareness**, and **seasonal lifecycle gating** are first-class composition concerns.

### 8.1 The Strategy Composition Surface

A structured form-plus-code UI.

**Layout (sketch):**

- **Top bar** — strategy ID, name, version, owner, current stage, action buttons.
- **Left graph view** — strategy as a directed graph: data sources → features → model(s) → signal → entry/exit logic → sizing → execution.
- **Right panel** — properties of selected node:
  - **Data source** — catalog reference, products, regions, period.
  - **Feature** — feature library reference.
  - **Model** — model registry reference, version pin.
  - **Signal** — threshold, confirmation conditions.
  - **Entry logic** — when to take a position (signal threshold + blackout windows: e.g. "no entry within 5 minutes of EIA petroleum release"; "no entry on OPEC-meeting day"; "no entry within 24h of front-month last-trade-day").
  - **Exit logic** — target / stop / time-based / signal-flip / regime-flip / front-month-roll.
  - **Sizing** — Kelly fraction, vol-targeting, capital cap, per-trade max, regime-conditional multipliers, seasonal-cycle multipliers.
  - **Hedging policy** — auto-hedge yes/no, hedge ratio, hedge venue (e.g. Brent against WTI for spread strategies), hedge cadence.
  - **Risk gates** — daily loss limit, drawdown limit, position-size limit, instrument concentration. Kill-on-breach.
  - **Execution policy** — algo class (calendar-spread-aware TWAP, settlement-window TAS, RFQ for swaps, direct), venue routing, fee preferences, latency budget. Roll-aware execution settings.
  - **Schedule** — active hours / days, blackout windows around macro events, seasonal lifecycle (active October–April, sleep May–September), inventory-release-window settings.
  - **Mode** — live / paper / shadow.
  - **Tags** — strategy class, product family, region, archetype owner.
- **Bottom panel** — validation feedback, backtest results, deployment state.

**Code drop-in:** for any node, "convert to custom code" opens a Python editor with the platform SDK.

### 8.2 Pre-Deployment Validation

Before promotion past research, the platform checks for common errors:

- **Lookahead leak detection.** Static analysis of signal logic.
- **Inventory-release-window leak.** Specific check that no feature uses post-release print as pre-release input.
- **Infinite-loop entry.**
- **Unbounded position size.**
- **Missing kill-switch wiring.**
- **Schedule conflicts.** Strategies marked active during EIA blackout, OPEC meeting day, or front-month last-trade-day where they shouldn't be.
- **Seasonal-lifecycle mismatch.** A winter-natgas strategy with no sleep-window declared is flagged.
- **Calendar-spread roll-window conflict.** A calendar-spread strategy must declare its roll behavior.
- **Compliance flags.** Position-limit checks (CFTC large trader thresholds), restricted-list exposure, sanctioned-counterparty exposure.
- **Capacity sanity.** Claimed capacity vs slippage-curve estimate.
- **Universe consistency.** Instrument list aligns with available data and feature coverage.

Each warning gates progression. Errors must be fixed; warnings can be acknowledged with reason.

### 8.3 Strategy Versioning

- Every change produces a new strategy version.
- Old versions stay in the registry.
- Live deployments pin to a specific version.
- Diff views: show what changed between versions.

### 8.4 Theo's Strategy Templates (Illustrative)

(See section 5.4 for the template library — calendar-spread mean-reversion, weather-driven natgas, inventory-setup, crack-spread mean-reversion, OPEC-event scaffolding, location-spread, seasonal cycle, refinery-outage, spark / dark spread.)

Theo's day starts at one of these templates and customizes from there. Many of his ~150 live strategies are instances of a template parameterized for a specific (product, region, tenor, season).

### 8.5 Why this matters

- **Efficiency:** the same model can be expressed as many strategies (M1-M2 vs M1-M6 calendar; USGC crack vs NWE crack; HH winter vs TTF winter) without re-implementing the model logic.
- **Risk:** validation catches the high-cost errors before they reach production. The seasonal-lifecycle, roll-window, and inventory-release-window checks are energy-specific guardrails that prevent silent disasters.
- **PnL:** Theo runs many strategy variants per model; capacity and risk profiles differ. Composition lets him capture each variant's distinct PnL contribution.

## 9. Promotion Gates & Lifecycle

The lifecycle (Research → Paper → Pilot → Live → Monitor → Retired) is enforced by promotion gates. The lifecycle UI is the surface Theo uses every day to advance, demote, and retire his ~150 strategies. **Energy-specific:** the lifecycle is **seasonal-aware** — winter natgas strategies wake up in autumn, sleep in spring; summer-driving gasoline strategies wake up in spring, sleep after Labor Day; OPEC-scaffolds are persistent year-round but reconfigure around scheduled meetings.

### 9.1 The Lifecycle Pipeline View

A pipeline visualization, like a Kanban board:

- **Columns:** Research, Paper, Pilot, Live, Monitor, Retired. Plus a **Sleeping** sub-state for seasonal strategies that are alive but inactive in their off-season.
- **Cards:** strategies, with name, owner, days-in-stage, current performance vs expectation, gate status, **next-wake-date** for seasonal strategies.
- **Drag (controlled):** dragging a card across columns proposes a transition; opens the gate UI.

This is the home page for Theo's lifecycle work. He sees, at a glance, his pipeline. The seasonal calendar overlay shows which strategies are due to wake up in the next 30 days.

### 9.2 The Gate UI per Transition

Each promotion is a checklist with evidence, not a chat conversation.

**Research → Paper:**

- Code review passed.
- Backtest framework approved (no anti-pattern warnings, no calendar-spread roll bugs, no seasonal overfit warnings).
- Walk-forward Sharpe above firm-wide threshold across at least 5 years of seasonal coverage.
- Risk parameters set within firm limits.
- Kill-switch wired and tested.
- Owner sign-off.

**Paper → Pilot:**

- N days of in-distribution behavior on paper (default 21 days for energy — longer than crypto because of slower cadence; configurable).
- Slippage estimates validating against backtest assumptions, including realistic calendar-spread combo execution.
- Strategy fits within firm risk limits at pilot capital level.
- For inventory-setup strategies: paper through at least 4 EIA release cycles.
- For OPEC-scaffolds: paper through at least one scheduled meeting.
- Owner + risk team sign-off.

**Pilot → Live:**

- N days of pilot behavior matching expectation (default 60 days for energy; configurable).
- Capacity estimate refined with real data.
- No anomalies in alert log.
- David sign-off for material capital allocations.

**Live → Monitor:**

- Trader-initiated (degradation observed) or system-initiated (drift / decay alerts).
- Reason logged.
- Capital cap reduced per policy.

**Live → Sleeping (seasonal):**

- Auto-triggered at season-end (e.g. winter-natgas strategies sleep April 1).
- All positions closed; working orders canceled.
- Strategy state preserved; ready to wake up at next-season-start with current parameters.
- Theo can override (extend, sleep early, sleep at custom date based on observed regime).

**Sleeping → Live (seasonal wake-up):**

- Auto-triggered at season-start.
- Theo confirms parameters are still appropriate for the current regime (no major weather model upgrades, no major venue changes, no structural shifts since last season).
- Capital allocated; strategy resumes.

**Monitor → Retired:**

- Decay confirmed (statistical evidence, with seasonal-pattern-loss as a specific decay form).
- No path to retraining or recalibration.
- Retire decision logged with rationale.

**Retired → Research / Paper (rare):**

- New evidence justifies revisit.

### 9.3 Lifecycle Decision Log

Append-only log of every transition: timestamp, strategy ID, version, from-stage, to-stage, decided by, reason, evidence links. Searchable, auditable, exportable for risk-committee review. Seasonal wake-up / sleep transitions logged like any other transition.

### 9.4 Lifecycle Cadence for Theo

Theo's typical fleet state:

- **Research:** 15–30 strategies in active research.
- **Paper:** 8–15 strategies running on simulated fills.
- **Pilot:** 10–20 strategies at 1–10% of target size.
- **Live:** 100–130 strategies at full size in-season; 60–80 strategies actively-live during shoulder seasons.
- **Sleeping:** 20–40 seasonal strategies at any time, depending on season (peak-sleeping is mid-summer for winter strategies and mid-winter for summer strategies).
- **Monitor:** 10–20 strategies on decay probation.
- **Retired:** dozens accumulated over time.

Daily / weekly Theo is making 2–8 promotion decisions and 0–3 retire decisions across the fleet. The seasonal wake-up calendar drives a burst of promotion-confirmation work in late September (winter wake-ups) and early March (summer wake-ups).

### 9.5 Why this matters

- **Efficiency:** lifecycle gates standardize quality control. Theo does not need to design a custom evaluation framework for each strategy. The seasonal lifecycle automates a class of work that would otherwise be a manual calendar-driven scramble.
- **Risk:** every strategy reaching live capital has passed code review, risk review, validation. The platform's risk surface is correlated with lifecycle stage.
- **PnL:** poorly performing strategies are retired by the lifecycle, not by Theo's gut. Discipline compounds. Seasonal-aware lifecycle prevents the "we forgot to wake up the winter natgas strategy until December" failure mode.

## 10. Capital Allocation

The capital allocation engine is the system that decides how much capital each strategy in Theo's fleet receives. In manual trading, Theo sized each position by gut + spreadsheet. In automated trading, the platform proposes allocations across the fleet and Theo approves.

### 10.1 The Allocation Engine UI

**Layout:**

- **Top panel** — total capital available, currently allocated, free, in-flight. Per-archetype budget (Theo's slice, set by David).
- **Main table** — every strategy with current allocation, proposed allocation, delta, expected Sharpe contribution, marginal Sharpe contribution, capacity headroom, drift state, lifecycle stage, **seasonal-cycle position** (where in its season the strategy currently is).
- **Right panel** — risk decomposition of the proposed portfolio: gross / net / DV01-equivalent / per-product / per-tenor / per-region / stress-scenario PnL. Concentration warnings.
- **Bottom panel** — methodology selector + parameters. Theo picks (or combines) Sharpe-proportional / risk-parity / Markowitz / Kelly / regime-conditional / hierarchical-risk-parity / custom.

**The proposal:**

- Generated nightly by default; on-demand when Theo wants. Specifically re-proposed on inventory-release days post-release.
- Auto-respects firm-level constraints (David's caps).
- Material changes flag for sign-off.
- "Approve and apply" button.

### 10.2 Per-Product and Per-Region Budget Management

Energy capital allocation is **product-and-region-shaped** in a way that matters:

- **Per-product budgets** — crude (WTI / Brent / Dubai), products (RBOB / ULSD / jet / gasoil), natgas (HH / TTF / JKM), power (PJM / ERCOT / German), carbon (EUA / CCA / RGGI). Each has an envelope.
- **Per-region budgets** — North America, Europe, Asia. Reflects desk specialization and macro exposure preferences.
- **Per-tenor budgets** — front-month vs back-month. Back-month is illiquid; capacity-aware allocation prevents over-deployment in thin tenors.
- **Per-strategy-class budgets** — calendar-spread fleet, weather fleet, inventory fleet, crack fleet, OPEC scaffolds, seasonal fleet, location fleet.
- **Cross-product correlation awareness** — the allocation engine penalizes over-concentration in correlated bets (e.g. front-month WTI calendar + Brent calendar are not independent).

### 10.3 Margin Segregation and Sub-Account Routing

- **Cross-margin sub-accounts** for strategies that benefit (calendar spreads at the same exchange).
- **Isolated-margin sub-accounts** for strategies with bounded loss profiles.
- **Per-venue sub-account map** — visible at allocation-engine level.

When a new strategy is composed, sub-account routing is part of the configuration. The allocation engine respects these constraints.

### 10.4 Allocation Drift

Allocations drift during the day. The engine continuously shows:

- Drift from optimal.
- Whether to rebalance now or wait for nightly.
- Cost of rebalancing vs expected return improvement.
- Auto-rebalance thresholds (configurable per strategy class).
- Specific rebalance behavior on inventory-release days — material allocation changes are queued post-release rather than mid-day to avoid trading into the volatility.

### 10.5 Capacity & Headroom

- **Per-strategy capacity utilization** — % of estimated capacity in use, color-coded.
- **Free capacity** — strategies with headroom; where to add.
- **Capacity exhausted** — strategies at cap; signals being skipped.
- **Back-month capacity** — particularly thin; flagged separately.
- **Seasonal capacity** — capacity in winter natgas strategies is much higher in December than in April; the engine respects.

### 10.6 Why this matters

- **Efficiency:** allocation across 150 strategies is not solvable by spreadsheet. The engine compresses what would otherwise be hours of nightly work into a 10-minute review.
- **Risk:** systematic risk-parity / Kelly / Markowitz constraints prevent over-allocation to a single strategy or correlation cluster. Per-product, per-region, per-tenor envelopes prevent silent concentration.
- **PnL:** marginal Sharpe analysis ensures incremental capital goes to where it has highest return. Capacity-aware sizing prevents over-trading thin back-month markets. Seasonal-aware sizing puts capital where it earns this season, not where it earned last season.

## 11. Live Fleet Supervision Console

The console where Theo supervises every live strategy in his fleet. Anomaly-driven by design: green by default; the trader is summoned only when something is off. This replaces the manual trader's "watch the curve and the spread dashboard" surface.

### 11.1 The Fleet Dashboard

The center of Theo's automated-mode supervisor console.

**Layout:**

- **Top filter bar** — health badge filter (default: amber + red only); strategy class filter; product filter; region filter; lifecycle-stage filter; **seasonal-cycle filter** (in-season / shoulder / sleeping).
- **Main grid / table** — one row per strategy. Columns:
  - Strategy ID, name.
  - Strategy class (calendar-spread / weather / inventory / crack / OPEC / location / seasonal / refinery / spark-dark).
  - Lifecycle stage + seasonal-cycle position.
  - **Health badge** — green / amber / red, computed composite of PnL deviation, drift, slippage, alert volume.
  - Capital deployed / cap.
  - PnL today / WTD / MTD / YTD.
  - Sharpe rolling 30d / 90d.
  - Drawdown — current / max-since-go-live.
  - Trade count today vs typical.
  - Hit rate, avg trade $.
  - Recent regime fit.
  - Last intervention.
  - Capacity utilization %.
  - **Theo-specific columns:**
    - **Season-state** — for seasonal strategies, where in the seasonal cycle (early-winter / peak-winter / late-winter / shoulder / sleeping).
    - **Inventory-state** — for inventory-fleet strategies, current inventory-vs-5y-band z-score and last release surprise.
    - **Curve-state** — for calendar-spread strategies, current spread z-score and curve regime (contango / backwardation).
    - **Weather-state** — for weather-fleet strategies, current HDD/CDD divergence and multi-model agreement.
    - **OPEC-state** — for OPEC scaffolds, days-to-next-meeting and current pre-positioning state.
    - **Refinery-outage-state** — for crack and refinery strategies, currently-affected capacity.
- **Sortable, filterable, expandable.** Group by strategy class / product / region / season toggleable.
- **Default view:** filtered to amber + red. With ~150 strategies, only 3–15 typically demand attention.

**Group-by views:**

- **By strategy class** — total class-level PnL, class-level health.
- **By product** — total product-level exposure across all strategies.
- **By region** — region-level PnL and concentration.
- **By season-state** — strategies currently in-season vs shoulder vs sleeping; helps Theo verify the seasonal calendar is working.
- **By event window** — strategies sensitive to the next inventory release / OPEC meeting / hurricane risk.

Theo toggles between views during diagnostic work.

### 11.2 The Strategy Detail Page

Click a strategy → drill into its full state.

**Layout:**

- **Header** — strategy ID, name, class, lifecycle stage, current state, action buttons (pause / cap / retrain-trigger / retire / sleep).
- **Top section: live state**
  - Live equity curve (with backtest expectation overlay).
  - Position breakdown — current holdings, with curve / spread / crack visualization.
  - Drift indicators.
  - Recent intervention log.
- **Middle section: signal feed**
  - Recent signals generated, executed vs skipped, with reasons.
  - Last N decisions with full context (input feature values, model output, signal threshold).
  - "Why this strategy entered / didn't enter" diagnostic.
- **Bottom section: diagnostic depth**
  - Feature health.
  - Slippage realized vs assumed.
  - Capacity utilization curve.
  - Recent retraining history.
  - Linked alerts.
  - Linked experiments.
  - **For seasonal strategies:** seasonal-pattern-fit indicator (is the strategy tracking its multi-year seasonal pattern this cycle?).
  - **For calendar-spread strategies:** roll-window indicator and roll-cost accumulator.
  - **For inventory-setup strategies:** last-release attribution (did the platform get the surprise direction right?).
  - **For weather strategies:** model-divergence-vs-realized tracker.

This page is where Theo does diagnostics. From here, he decides: pause, cap, retrain, leave alone, retire, sleep.

### 11.3 Anomaly Detection Surface

Categories:

- **Performance anomalies** — strategy underperforming its rolling distribution at 2σ / 3σ.
- **Behavior anomalies** — trade frequency, position size, hit rate outside historical bounds.
- **Feature drift** — input distribution shifted vs training.
- **Prediction drift** — output distribution shifted.
- **Execution anomalies** — slippage spike, rejection rate spike, calendar-spread combo failure.
- **Capacity warnings** — strategy hitting cap.
- **Correlation anomaly** — strategy correlating with another it should not (e.g. WTI calendar correlating with Brent calendar in an unexpected regime).
- **Regime mismatch** — running a "contango" model in a "backwardation" regime.
- **Inventory-window anomaly** — strategy trading into the EIA blackout window when it shouldn't.
- **Roll-window anomaly** — strategy holding a position into front-month last-trade-day.
- **Seasonal-state anomaly** — strategy active outside its declared seasonal window.
- **Infrastructure** — node down, data lag, RPC degraded, weather-model feed stale.

Each anomaly has severity, routing rules, and (for critical) auto-actions.

**The anomaly console:**

- Active anomalies, sorted by severity then recency.
- Per-anomaly: which strategy, what triggered, suggested action, "investigate" button, "acknowledge with reason" button.
- Acknowledged-anomalies log for review.

### 11.4 Cross-Strategy Correlation View

The fleet is supposed to be diversified; correlation drift erodes diversification.

**Layout:**

- **Heatmap** — strategy × strategy correlation matrix.
- **Drift indicators** — pairs that should be uncorrelated but are drifting.
- **Cluster visualization** — automatic clustering by behavior; outliers flagged.
- **Aggregate exposure decomposition** — fleet-level net delta per product, net DV01-equivalent per tenor, net beta to crude / natgas / power / EUA. Ensures supposedly-diversified strategies aren't quietly stacking exposure to a single factor (e.g. all the calendar spreads silently long contango).
- **Per-product fleet exposure** — total long / short crude across fleet; total long / short natgas; etc. The most important cross-strategy exposure read for an energy desk.

### 11.5 Inventory-Release-Window Live State

Distinct from the allocation engine's nightly proposal — this is the live, intra-week state focused on **the next major inventory or OPEC release**.

**Layout:**

- **Countdown banner** — minutes-to-next-release (EIA Wednesday 10:30am ET petroleum; EIA Thursday 10:30am natgas; OPEC monthly; OPEC+ JMMC). Always visible, always running.
- **Pre-release positioning summary** — current pre-positioning across the inventory-fleet by product. Total $-notional at risk.
- **Whisper-vs-consensus tracker** — current desk whisper, current published consensus, divergence z-score.
- **Recent surprise history** — last 10 prints of this release: actual, consensus, surprise direction, market reaction (price move T+1h, T+24h).
- **Strategy-by-strategy state** — every inventory-fleet strategy with current pre-positioning, pause-state, post-release plan.
- **Manual override controls** — pause-all-inventory-fleet (one click); reduce-all-by-50% (one click); pull-all-pre-positioning (one click); transition-to-event-mode (see section 14).
- **For OPEC-meeting state:** days-to-meeting; current OPEC-scaffold positioning; manual override controls (pause-OPEC-scaffolds; flatten-OPEC-scaffolds).
- **For hurricane-active state:** active storms, NHC cone state, GoM-production-at-risk indicator, strategies in the hurricane-affected universe.
- **For refinery-outage state:** currently-active outages, capacity at risk by region, affected crack-spread strategies.

Foveal during the relevant event windows. Quietly available the rest of the time.

### 11.6 Strategy State Inspection

A diagnostic surface that lets Theo inspect the **internal state of a running strategy** — its current variables, signal evaluation, model output, regime classifier, position-sizing intermediates — and compare live behavior against backtest expectation. Critical for verifying that a strategy is configured correctly, that live and backtest aren't drifting, and that the trader's mental model of the strategy matches what the code is actually doing.

This is a verification surface, not a continuously-streamed real-time view. It is implemented per strategy; the strategy declares which variables it exposes, and the platform renders them on demand. Some strategies expose 5 variables; some expose 50; engineering cost dictates depth.

**Two layers of inspection:**

#### 11.6.1 Internal-state view (per strategy)

A panel inside the strategy detail page that the trader opens on demand.

**What it shows (illustrative, varies per strategy):**

- **Current state variables** — internal counters, flags, regime classifications, running averages, accumulators. Displayed in a structured table with field name, current value, last-updated timestamp.
- **Current feature snapshot** — the input feature values the strategy is currently seeing. Useful for "is the calendar-spread-z feature returning what I'd expect right now?"
- **Last N signal evaluations** — for the last decisions: input features, model output, entry / exit / no-action decision, reason.
- **Current position state** — what the strategy is holding; what it intends to do next; pending orders.
- **Risk-gate state** — daily-loss accumulator, drawdown-since-go-live, capacity utilization, distance-to-each-risk-limit.
- **Regime classifier output** — the strategy's view of the current regime (e.g. "contango, normal-storage, no-imminent-OPEC-event"); strategies with regime gating expose which gates are open / closed.
- **Strategy-specific custom state** — e.g. a calendar-spread strategy might expose: current spread estimate, spread-z, time-to-front-month-roll, last-roll-cost-incurred. A weather-driven natgas strategy might expose: current HDD divergence, multi-model-agreement score, storage-deficit gate state, hold-time-elapsed. An OPEC scaffold might expose: days-to-meeting, current pre-positioning, headline-pause-armed flag.
- **Inventory-fleet specific state:** last-release-surprise, post-release-position, blackout-window status.
- **Refinery-outage specific state:** affected capacity, expected-duration estimate, exit trigger state.

**Refresh model:**

- **Refresh button** for on-demand snapshot. The most common interaction.
- **Auto-refresh toggle** for selected strategies (e.g. when actively diagnosing). Configurable cadence: 1s / 5s / 30s / 1min / off.
- **Schedule push** for selected strategies — the platform pushes state updates only when the strategy actually changes state (entered a position, evaluated a signal, hit a gate). Lightweight, event-driven.
- **Engineering pragmatic:** the platform does not stream all variables of all 150 strategies in real time — that's heavy on backend and wasteful. Streaming is opt-in per strategy when the trader is actively inspecting; default is on-demand refresh.

**Per-strategy implementation:**

- The strategy declares its exposed state via a contract (a list of variables, types, descriptions). The platform renders whatever the strategy declares.
- Some strategies expose comprehensive state; some expose minimal state. Pragmatic — engineering cost should match diagnostic value.
- The trader is not blocked if a strategy is light on exposed state; the supervision dashboard, model registry, and execution log give independent diagnostic angles.

#### 11.6.2 Backtest-vs-live comparison

For any live strategy, a side-by-side view comparing live behavior against backtest expectation. Critical for catching configuration drift early.

**Layout:**

- **Top:** equity curve, live (last N days) overlaid on backtest counterfactual. Divergence flagged.
- **Per-trade comparison:** recent live trades vs what the backtest would have done at the same moment.
- **Per-feature drift:** input features the strategy saw live vs the same features in the backtest's training distribution.
- **Per-signal calibration:** for probabilistic models, was the live signal calibrated as the backtest predicted?
- **Diagnosis hints:** the platform suggests likely root causes if divergence is meaningful — feature drift, execution-quality degradation (calendar-spread combo slippage), model drift, configuration mismatch, data-pipeline issue (weather-model feed stale, inventory-data revision).
- **Seasonal-pattern comparison:** for seasonal strategies, the live cycle vs the backtest's same-season historical distribution.

**Use cases:**

- After Theo deploys a new strategy: confirm the first weeks' behavior matches the backtest.
- When a strategy enters monitor stage: was the divergence caused by deployment or regime?
- When validating a candidate retrain: how does the new model's first weeks compare to its backtest?
- After a seasonal wake-up: is the strategy tracking its prior in-season behavior?

**Refresh model:**

- Computed daily by default. The comparison is a slow-moving diagnostic.
- On-demand refresh available.

#### 11.6.3 Why this matters

- **Efficiency:** when a strategy is misbehaving, Theo can see exactly what it's "thinking" without needing to run a fresh backtest or open the code repo. The diagnostic loop closes in minutes rather than hours.
- **Risk:** silent configuration drift between backtest and live is a major failure mode. The comparison surface catches it before scaled capital makes the mistake expensive. For seasonal strategies, this is especially valuable — a mis-configured wake-up could silently bleed all season.
- **PnL:** strategies that match their backtest expectation can be scaled with confidence. Strategies whose live diverges from backtest are caught early and either fixed or capped.
- **Engineering verification:** as a side effect, this surface is one of the cleanest end-to-end tests of the platform — if Theo can see the right state for a strategy, the data plumbing, model registration, strategy composition, execution layer (including calendar-spread combo execution), and reporting layer are all working end-to-end.

### 11.7 Why this matters

- **Efficiency:** anomaly-driven attention compresses 150 strategies into ~3–15 to investigate. Theo does not stare at 150 charts.
- **Risk:** anomalies are caught before P/L damage compounds. Auto-pause on critical alerts limits blast radius. Inventory-blackout-window enforcement and seasonal-state validation prevent classes of silent error.
- **PnL:** time saved on supervision is reinvested in research and in interpreting OPEC / hurricane / refinery-outage events that the platform deliberately doesn't trade.

## 12. Intervention Console

When Theo decides to act, the intervention console is the surface. Distinct from automatic actions (kill-on-breach, auto-flatten before roll, auto-pause on EIA blackout) — this is _Theo's_ interventions.

### 12.1 Per-Strategy Controls

For any strategy:

- **Start / pause / stop** — with confirmation + audit trail.
- **Cap change** — increase / decrease capital cap.
- **Risk-limit change** — daily loss limit, drawdown limit, position-size limit. Audited.
- **Symbol / region whitelist / blacklist** — temporarily exclude.
- **Schedule modification** — pause active hours, add a blackout window.
- **Seasonal lifecycle override** — sleep early; wake up early; extend.
- **Mode change** — live / paper / shadow.
- **Force-flatten** — close all positions on this strategy now. Reason field mandatory.
- **Demote to monitor** — move to monitor with reason.

Every intervention is logged: timestamp, actor, action, reason, pre-state, post-state.

### 12.2 Group Controls

- **Pause all in strategy class** (e.g. pause all OPEC scaffolds when an unexpected ministerial-level meeting is announced; pause all inventory-fleet strategies before a particularly noisy EIA print).
- **Pause all on product** (e.g. pause all natgas strategies during an unexpected polar-vortex regime that's outside training distribution).
- **Pause all on region** (e.g. pause all USGC-affected strategies as a major hurricane approaches).
- **Pause all in lifecycle stage** (e.g. pause all pilots during a major macro event).
- **Cap all by tag** — multiplicative cap reduction across a tagged set.
- **Hurricane mode** — one-click reduce-all-Gulf-affected-strategies-to-50%.

### 12.3 Manual Trading & Reconciliation

**Even in fully automated mode, the trader must retain the ability to place, adjust, and close trades manually from the UI.** This is non-negotiable. Energy-specific scenarios:

**1. Emergency intervention.**
A strategy is misbehaving; the auto-flatten failed; an exchange is in a degraded state; a calendar-spread combo execution is stuck mid-leg; a major refinery-outage surprise hits and Theo wants to position immediately on a product the platform isn't trading. He needs to flatten or adjust positions by hand right now.

**2. Reconciliation between algo state and venue state.**
The platform's view and the exchange's view should always match — but in practice they occasionally diverge (a calendar-spread combo that registered only one leg; a roll that didn't transfer cleanly between months; a swap clearing that briefly showed a stale balance). Theo needs to manually align the two.

**3. Discretionary override on top of the automated book.**
A high-conviction OPEC-headline read, a hurricane-track judgment, a refinery-outage interpretation, a geopolitical-premium call where Theo wants to layer a directional position on top of what the strategies are doing — explicitly tagged as such. **This is the canonical Theo case** — the OPEC scaffolding pauses, and Theo trades the headline manually.

The platform must support all three with **full manual-trading capability identical to the manual mode** described earlier in this doc. Theo retains every surface from his manual workflow: outright futures ticket, calendar-spread ticket, crack-spread ticket, options ticket, swaps RFQ ticket, ladder click-to-trade, hotkeys, smart router, pre-trade preview, working orders blotter. The manual surfaces don't disappear in automated mode; they are present and reachable.

#### 12.3.1 The Full Manual Order Ticket

The complete order entry ticket from manual mode (see [#2 Order Entry Ticket Framework](common-tools.md#2-order-entry-ticket-framework) and the manual sections of this doc above).

- **All order types available:** market, limit, stop, stop-limit, OCO, bracket, trailing, peg-to-mid, post-only, IOC, FOK, GTC, GTD, TAS (trade-at-settlement).
- **Multi-leg native:** atomic calendar spreads (CME combos), crack spreads (3:2:1 / 2:1:1), location spreads, options structures.
- **Hotkeys preserved:** all his manual-mode hotkeys remain bound (buy/sell at top of book per contract month; cancel-all on contract month; **roll position forward** single-key; flatten product across all months; hedge-to-flat; cancel-all-on-focused-product). Speed matters during emergencies.
- **Pre-trade preview:** margin impact, position impact (in $-notional, DV01-equivalent by tenor, **as delta on the entire book including the automated fleet**), liquidation price, fee estimate, slippage estimate, basis-risk flag for cross-hedges.
- **Smart order router:** aggregated venue depth, best-price routing.
- **RFQ workflow:** for swaps and OTC options, broker-dealer panel RFQ.
- **Compliance / pre-trade gates:** position-limit checks (CFTC large trader), restricted-list, sanctioned-counterparty, jurisdictional access.

Practically: the manual terminal is a tab in the supervisor console, not a separate application. Theo presses a hotkey or clicks an icon → manual ticket comes up over the current view → he places the trade → ticket closes back to the supervisor view.

#### 12.3.2 Trade Tagging & Attribution

Every manually-placed trade gets a mandatory tag:

- **Emergency intervention** — flagged for post-incident review; auto-included in the day's incident log.
- **Reconciliation** — paired with the algo state being reconciled. Reconciliation tickets generate an audit pair.
- **Manual override (OPEC headline)** — explicit OPEC-headline trade tag; paired with the headline that triggered.
- **Manual override (hurricane / refinery / geopolitical)** — categorized override; paired with the event narrative.
- **Manual override (directional macro)** — explicit directional override; tagged with the macro thesis.

Attribution carries the tag through P/L, performance metrics, reports. David's behavioral monitoring tracks the frequency of each tag class — sustained increase in emergency interventions or overrides is a leading indicator David investigates.

#### 12.3.3 Reconciliation Workflow

A specific surface for the reconciliation case.

**The reconciliation page:**

- **Left panel:** the platform's view — every position the strategies _think_ they have, per venue, per product, per tenor.
- **Right panel:** the venue's view — every position the venue _actually_ shows.
- **Diff highlighted:** rows where the two disagree. Discrepancy size in $ and as % of position.
- **Per-row actions:**
  - "Trust venue" — the platform updates its internal state.
  - "Trust platform" — manual reconciliation order placed at the venue.
  - "Investigate" — opens a diagnostic with the relevant fills, cancels, modifies. Energy-specific diagnostic threads: calendar-spread combo single-leg execution; cross-month roll mid-flight; cleared-OTC-swap settlement timing.
- **Bulk actions** — "trust venue for all calendar-spread roll-window discrepancies" when the source is known.

**Auto-trigger:**

- Continuous reconciliation in the background.
- Discrepancies above a threshold escalate to alerts.
- Theo can run a manual full reconciliation on demand — typically end-of-day, post-roll-window, or after an incident.

#### 12.3.4 Emergency Modes

A specific UI mode that Theo can switch into during a crisis.

**Emergency mode reorganizes the screen:**

- **Manual ticket pinned** — large, foveal. Default tab open: the multi-leg ticket relevant to the active emergency (calendar spread for a roll incident; outright + ladder for an OPEC headline; crack ticket for a refinery outage).
- **Multi-venue aggregated ladder** for the focus instrument — foveal.
- **Live position state across all products** — second-largest panel.
- **Working orders across all venues** — what's resting that Theo might need to cancel.
- **Strategy intervention console** — pause / kill controls visible.
- **Alert console** — relevant alerts streaming.
- **Latency / connectivity panel** — venue-by-venue connection state.
- **Hurricane / OPEC / refinery context panel** (when relevant) — the live event state, foveal.

Hotkeys preserved; muscle memory from manual mode is the trader's most valuable asset during a real emergency.

**Switching into emergency mode** is a single keystroke. Switching back is one keystroke. Work-in-flight preserved; nothing lost.

#### 12.3.5 Manual Trading Hotkeys (Always Available)

Even in default research mode, certain manual-trading hotkeys are global:

- **Open manual ticket** for currently-focused product.
- **Open calendar-spread ticket** for currently-focused product.
- **Open crack-spread ticket** for the relevant region.
- **Flatten focused product** across all venues and all months.
- **Cancel-all-on-focused-product.**
- **Roll position forward** for the focused product (front to next-month).
- **Hedge-to-flat** focused product (auto-pair against optimal hedge).
- **Switch to emergency mode** (keystroke chord; less easily triggered).

These remain bound regardless of which mode the supervisor console is in.

#### 12.3.6 Audit & Friction

Manual trading is auditable but not friction-free for non-emergency cases:

- **Emergency interventions** — minimal friction. One confirmation, audit logged.
- **Reconciliation** — friction matched to size.
- **Manual override (OPEC / hurricane / refinery / geopolitical / macro)** — full friction: reason field, confirmation gate, override tag mandatory. The friction reflects the consequence — directional override outside the systematic framework should be a deliberate decision.

Every manual trade enters the same audit trail as algo trades, with the manual flag and tag class. Searchable, reviewable, exportable for risk-committee or regulator review.

#### 12.3.7 Why this matters

- **Efficiency:** in an OPEC-headline minute, seconds to a working manual ticket = real PnL preservation. The OPEC scaffold pauses; Theo trades the headline; the platform tags and audits.
- **Risk:** reconciliation is a real operational risk in energy because of the multi-leg combo, roll-window, and cleared-OTC complexity. Without a designed reconciliation workflow, the platform's view and the venue's view drift.
- **PnL:** the ability to layer a high-conviction discretionary trade on top of the automated book is the entire point of the partial-automation tier for Theo. The systematic fleet captures the boring alpha; Theo captures the OPEC-headline / hurricane / refinery-outage / geopolitical-premium alpha that pure systematics miss.
- **Platform validation:** if Theo can place every trade his strategies make from the manual UI — including calendar-spread combos and crack-spread multi-leg — the platform's execution layer is verified end-to-end.

### 12.4 Kill Switches at Multiple Scopes

Layered kill switches per [#19 Kill Switches](common-tools.md#19-kill-switches-granular):

- **Per-strategy kill** — cancel all working orders + flatten on this strategy.
- **Per-strategy-class kill** — flatten the OPEC-scaffolds; flatten the inventory fleet; flatten the calendar-spread fleet.
- **Per-product kill** — flatten all natgas; flatten all crude; flatten all crack spreads.
- **Per-region kill** — pull all USGC-affected; pull all European.
- **Per-venue kill** — pull all firm activity from this venue.
- **Hedge-to-neutral** — buy front-month to offset back-month exposure across the fleet (not strictly a kill but an emergency-shaped action).
- **Fleet-wide kill** — Theo's entire automated cousin (all his ~150 strategies). Multi-confirmation.
- **Firm-wide kill** — David + CIO + risk-officer; multi-key authentication.

Each scope's kill is a designed action: cancel-or-flatten configurable, audit-trail mandatory, reversal procedure documented.

### 12.5 Intervention Audit Log

Append-only log of every intervention. Searchable / filterable / exportable.

- Per-row: timestamp, scope, actor, action, reason, pre-state, post-state, downstream effect.
- Used in post-incident review (David's firm-wide replay), regulator request, behavioral self-review.

### 12.6 Why this matters

- **Efficiency:** intervention scoping (per-strategy / class / product / region / fleet) lets Theo respond proportionately. He doesn't nuke the whole fleet for one product's hiccup.
- **Risk:** every intervention is auditable. Catastrophe response (hurricane landfall, OPEC walkout, oil-export-terminal attack, mass refinery outage) is designed; the platform has practiced it.
- **PnL:** the cost of over-intervention is missed PnL. The cost of under-intervention is realized loss. Granular controls plus disciplined auditing balance both.

## 13. Post-Trade & Decay Tracking

The feedback loop from yesterday's results into tomorrow's research. Every strategy is evaluated daily / weekly / monthly: did it perform as expected, is it decaying, does it need retraining, is it ready to retire? Energy-specific: **seasonal pattern fit** is a primary axis — multi-year backtest of recurring seasonal trades, with the question "was the entry timely within the seasonal pattern?"

### 13.1 Per-Strategy Retrospectives

Auto-generated per strategy on a configurable cadence (typically weekly + monthly + post-season for seasonal strategies).

**Layout:**

- **Header** — strategy name, period covered, current stage.
- **Performance vs expectation panel:**
  - Realized Sharpe in the period vs research-time expected distribution.
  - Equity curve overlay: realized vs backtest counterfactual.
- **Drawdown decomposition.**
- **Regime fit:**
  - % of period in each regime (season, curve, inventory, macro, event).
  - Per-regime performance.
  - Regime-fit health score.
- **Seasonal pattern fit (for seasonal strategies):**
  - Multi-year same-season comparison.
  - Pattern-match score.
  - Year-vs-year same-week PnL distribution.
- **Capacity realized vs assumed:**
  - Slippage, fill rate, partial fills, calendar-spread combo execution quality.
- **Recent interventions and effect.**
- **Drift state.**
- **Recommended action:**
  - Continue / retrain / cap / monitor / retire / adjust-seasonal-window — with rationale.

Theo reads these end-of-week, on the strategies needing attention.

### 13.2 Fleet-Level Review

Auto-generated weekly + monthly + post-season.

**Layout:**

- **Total PnL decomposition:**
  - By strategy class.
  - By product.
  - By region.
  - By tenor.
  - By season.
  - By event window (EIA week, OPEC week, hurricane-active period).
- **Risk-adjusted contribution:**
  - Per strategy: Sharpe contribution, marginal Sharpe.
- **Marginal contribution analysis:**
  - "If I added $X to strategy A, expected incremental Sharpe is Y."
- **Correlation evolution.**
- **Capacity utilization across the fleet.**
- **Seasonal calendar review:**
  - Strategies waking up in next 30 days.
  - Strategies sleeping in next 30 days.
  - Mid-season parameter-refresh recommendations.

Theo reads this Sunday evening; informs Monday capital-allocation decisions.

### 13.3 Decay Metrics Surface

A dedicated dashboard for catching decay early.

**Layout:**

- **Sharpe-over-time per strategy** — rolling Sharpe with confidence bands.
- **Half-life estimates** — how long does this alpha persist before halving.
- **Feature-importance drift** — features whose importance is shifting per model.
- **Backtest vs live divergence** — point estimate + distribution.
- **Seasonal pattern decay** — for seasonal strategies, year-over-year same-season Sharpe trend. A seasonal pattern that worked 2015–2020 but didn't in 2021–2024 is a flag.
- **Regime-shift detection** — when the structural regime underlying a strategy class has shifted (e.g. US LNG export capacity has structurally changed the HH-TTF spread regime; calendar-spread strategies trained on pre-2022 data may be obsolete).

This surface is consulted weekly. Decisions: queue retrain, cap, demote to monitor, retire.

### 13.4 Retrain Queue UI

When the platform proposes retraining, the proposal queues here.

**Layout:**

- **Queue table** — strategy, model version, retrain reason, proposed training data window, estimated compute cost, estimated improvement.
- **Per-row actions:** approve, defer, customize (Theo modifies the training data window or hyperparameters before approving — particularly relevant for seasonal strategies where window choice affects pattern fit), reject (with reason).
- **Auto-approval thresholds** — strategies in monitor / pilot can have auto-approve enabled; live strategies require explicit approval.
- **Retrain history** — past retrains and their outcomes.

### 13.5 Retire Decisions

Retirement is a decision — the platform proposes, Theo approves.

**The proposal:**

- Decay confirmed (statistical evidence linked).
- Better strategy in the same niche.
- Path to recalibration / retraining exhausted.
- Capital freed by retirement.

**The approval workflow:**

- Theo reviews the retire proposal.
- Approves: strategy moves to retired, capital freed, audit logged.
- Rejects: strategy stays, with reason ("regime change might reverse; give one more season").
- Modifies: e.g. "retire the WTI-Brent variant but keep the Brent-Dubai variant; the Russian-export shift specifically broke the WTI-Brent regime, not Brent-Dubai."

### 13.6 Why this matters

- **Efficiency:** retrospectives are auto-generated. Theo reads, he doesn't compose.
- **Risk:** decaying strategies are caught by the metric, not by Theo's anecdotal sense.
- **PnL:** retraining cadence is data-driven. Capital trapped in dying strategies is recycled. The Learn → Decide loop closes. Seasonal-pattern decay caught early prevents a "we ran the same winter strategy for three years past its expiry" failure.

## 14. The Supervisor Console — Theo's Daily UI

The supervisor console is the integration of all the surfaces above into one workspace. It's not a single new surface; it's the layout / mode-switching / spatial organization of everything described.

### 14.1 Theo's Monitor Layout (Illustrative)

A senior energy quant-trader runs 4–6 monitors. Theo's typical layout in automated mode (compare to his manual physical-setup table earlier in this doc — the manual surfaces are still present, now in the periphery):

| Position      | Surface                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Top-left      | **Fleet supervision dashboard** (default amber + red filter)                                      |
| Top-center    | **Research workspace** (notebook environment)                                                     |
| Top-right     | **Anomaly / alerts console + decay surface + inventory-release-window state**                     |
| Middle-left   | **Strategy detail page** (drill-down when investigating)                                          |
| Middle-center | **Capital allocation engine + per-product / per-region budget state**                             |
| Middle-right  | **Promotion gate queue + experiment tracker + seasonal calendar**                                 |
| Bottom-left   | **Forward curves + spread dashboard (peripheral)** — outright + spread context, seasonal overlays |
| Bottom-right  | **News / research feed + comms** — OPEC headlines, weather services, sell-side, broker chat       |
| Tablet        | Bloomberg / Reuters chat, IB commodity strategist notes, weather services                         |

The supervisor console's center of gravity is **research workspace + fleet supervision**. The manual terminal's center of gravity (forward curves, spread dashboard, inventory dashboard, ticket entry) is now in the bottom corners as background — **but the manual surfaces remain reachable in one keystroke and become foveal during OPEC-meeting hours, hurricane events, refinery-outage events, and inventory-release windows.**

### 14.2 Mode-Switching

The console has modes; switching reconfigures the layout (per [#30 Customizable Layout](common-tools.md#30-customizable-layout--workspace)):

- **Research mode (default during quiet hours):** notebook environment in foveal positions; supervisor + alerts in periphery; capital allocation collapsed.
- **Supervision mode (alert-driven):** fleet dashboard + strategy detail in foveal positions; research workspace minimized.
- **Inventory-release mode (Wednesday 10:00–11:30am ET; Thursday 10:00–11:30am for natgas):** inventory-release-window state foveal; affected strategies' detail pages visible; manual ticket pre-loaded for the relevant product; pre-release blackout countdown banner; whisper-vs-consensus tracker. Reflexes from manual-mode are preserved.
- **OPEC-meeting mode (scheduled JMMC / ministerial hours):** OPEC scaffold state foveal; manual ticket pre-loaded for crude (WTI + Brent + Dubai); OPEC compliance dashboard visible; geopolitical news feed pinned. Theo trades the headline manually; the platform handles everything else.
- **Hurricane / refinery-outage mode:** event panel foveal; affected strategies foveal; manual ticket pre-loaded for the relevant region's products; weather service / refinery operator news pinned; Gulf-production-at-risk indicator visible.
- **Pre-market mode:** fleet review + alerts + macro context dominant.
- **Post-market mode:** decay + retrospectives + capital allocation + experiment-priority-queue dominant.
- **Emergency mode:** see section 12.3.4.

Switching is one keystroke. Work-in-flight (open notebooks, pending interventions) preserved.

### 14.3 Anomaly-Driven Default State

Critical: the console is **green-by-default**. Most of the day, Theo is heads-down in research; the supervisor surface is quiet. Alerts route to him via:

- Banner on screen (auditable).
- Audio (configurable per severity).
- Mobile push (when away from desk).
- Phone page (catastrophe-tier alerts only — Gulf-of-Mexico hurricane landfall, refinery explosion, oil-export-terminal attack, OPEC walkout).

Theo trusts the platform's silence. False-positive alerts erode this trust quickly.

### 14.4 Why this matters

- **Efficiency:** time-on-research is the trader-quant's primary leverage. The console design ensures research is foveal-by-default, supervision is peripheral-by-default. The manual terminal's surfaces are recallable in one keystroke during the events where they matter (OPEC, hurricane, refinery, inventory window).
- **Risk:** mode-switching to event mode in seconds during a crisis is the difference between contained damage and runaway loss.
- **PnL:** the cognitive shift from foveal-position to peripheral-fleet is what makes 150 strategies tractable. Without it, scale is impossible.

## 15. Theo's Automated-Mode Daily Rhythm

Energy markets are calendar-driven and event-driven. Theo's day is structured around:

- **Daily:** market open and close (US futures hours; ICE / Brent overnight reach into European mornings).
- **Weekly:** EIA Wednesday 10:30am ET (petroleum); EIA Thursday 10:30am ET (natural gas); Baker Hughes Friday rig count.
- **Monthly:** OPEC monthly report (typically mid-month); IEA monthly report (typically a few days later); EIA Short-Term Energy Outlook.
- **Periodic:** OPEC+ JMMC and ministerial meetings (calendared; ad-hoc meetings possible).
- **Seasonal:** winter heating demand window (October–April); summer driving / cooling window (May–September); hurricane season (June–November); shoulder seasons.
- **Event-driven:** geopolitical events (Russia, Iran, Venezuela, Houthi attacks); refinery outages; pipeline disruptions; sanctions packages; SPR actions.

### 15.1 Pre-Market (45–75 min)

The day starts with **fleet triage and event-calendar review**, not with watching a chart.

**Fleet review (15–20 min):**

- Glance at supervisor console. Default: most strategies green; investigate amber + red.
- Read overnight session attribution: which strategies generated PnL, which detracted, which behaved out-of-distribution.
- Read alerts queue from overnight — capacity warnings, feature drift, regime mismatches, infrastructure incidents (especially weather-model feed delays from European providers overnight).
- Verify all positions are at intended state — no overnight surprises (Brent / TTF / JKM trade overnight).
- Make morning decisions: pause this strategy whose drift exceeded threshold; promote that pilot to live; cap this one whose capacity is exhausted; sleep this seasonal strategy a week early because the regime has clearly shifted.

**Event-calendar review (10–15 min):**

- This week's EIA / DOE / OPEC / IEA releases (with day-ahead consensus tracking).
- Today's specific releases (if any).
- Active hurricanes, current NHC cone state, GoM-production-at-risk.
- Active refinery outages and updates.
- Geopolitical event tracker: any overnight headlines requiring desk attention.
- OPEC meetings within the next 30 days; current pre-positioning state.

**Macro / regime read (10–15 min):**

- Read morning notes — sell-side energy desks, internal research, Argus / Platts pricing commentary — through the news feed.
- Check DXY, freight rates (VLCC / Suezmax overnight changes), China refinery throughput indicators.
- Identify regime-shift signals.

**Research catch-up (10–15 min):**

- Skim experiment-tracker results from overnight runs.
- Promote winners.
- Archive losers with notes.
- Review canary-deployment results.

**Promotion-gate decisions (5–10 min):**

- Strategies waiting for promotion: review the gate evidence, sign off or send back.
- Coordinate with David on any promotions material to firm risk.

**Coffee / clear head:** step away. The cognitive load of the rest of the day is research-heavy with intermittent supervision; preserve focus.

### 15.2 In-Market (continuous, anomaly-driven, event-punctuated)

This is the radical shift from manual trading. Most of the day is **research, not supervision** — except during inventory-release windows and event-mode moments.

**Default state:** trader is in the research workspace. Notebooks open. Working on:

- A new strategy idea (from yesterday's review).
- Feature engineering — a hypothesis to test (e.g. "does the Russia-vs-Saudi compliance gap predict next-30-day Brent-Dubai spread?").
- Model retraining for a strategy showing drift.
- Hyperparameter sweep on a candidate model.
- Diagnosing a strategy that underperformed yesterday.
- Reading new sell-side / specialist research and prototyping ideas.

**Background:** supervisor console is open in another monitor; default green. Alerts route to mobile when heads-down.

**Inventory-release window (Wednesday 10:00–11:30am ET; Thursday for natgas):**

- 30 minutes prior: switch to inventory-release mode; review inventory-fleet pre-positioning; check whisper-vs-consensus state; verify pre-release blackout will activate at T-5 minutes.
- 5 minutes prior: pre-release blackout active; no new entries; existing positions held.
- 10:30am: release; platform ingests, computes surprise, post-release continuation strategies activate per their plans.
- 10:30–11:00am: monitor live state; if mean-reversion-fade strategies are triggering, verify slippage is in line; if anything's anomalous, intervene (pause-fleet, manual-ticket if needed).
- 11:00–11:30am: settle into normal state; review the print's attribution.

**OPEC-meeting hours (scheduled JMMC / ministerial):**

- Pre-meeting: switch to OPEC-meeting mode; OPEC scaffold positioning verified; manual ticket pre-loaded.
- Meeting hours: scaffolds remain active until headline crosses.
- Headline crosses: scaffolds auto-pause + flatten working orders + escalate to Theo.
- Theo interprets the headline and decides: trade it manually, ride the scaffold direction, flatten everything, hedge to neutral.
- Tagged as OPEC-headline override; logged.
- Post-headline: review attribution, decide whether to re-arm scaffolds for the next meeting.

**Hurricane / refinery-outage event:**

- Event detected (NHC cone update; refinery operator news; pipeline-outage report).
- Switch to event mode.
- Review affected strategies; pause / cap as judgment dictates.
- Manually trade the headline if conviction merits.
- Tagged.
- Return to default state when event normalizes.

**Alert response (5–10% of the day):** when a non-event alert fires:

- Drill into the strategy detail page.
- Diagnose: is this a true anomaly or known transient?
- If intervene: pause / cap / replace. Document.
- If known transient: acknowledge with reason.

**Mid-day capital-allocation review:** glance at the allocation engine's drift indicators. Material drift triggers a rebalance proposal; trader approves or defers.

**Cross-trader coordination:** brief desk-chat exchanges with adjacent archetypes (Rafael on cross-asset oil regime; Henry / Quinn on energy-equity overlap; firm-level chat on OPEC-headline coordination).

### 15.3 Post-Market (60–90 min)

End-of-day review and tomorrow's research priorities.

**End-of-day attribution (15–20 min):**

- Today's PnL decomposition — by strategy class, by product, by region, by tenor, by event window.
- Identify outliers — strategies that significantly outperformed or underperformed expectation. Note for retrospective.
- Verify all positions are flat or as-intended.

**Decay check (10–15 min):**

- Run the decay surface: any strategies whose Sharpe trend is concerning?
- Any strategies needing retraining?
- Any seasonal-pattern decay flags?

**Capital allocation (10–15 min):**

- Review nightly allocation proposal.
- Approve, modify, or escalate to David.

**Research-priority setting (15–25 min):**

- Based on the day's findings: what's tomorrow's research priority?
- Queue overnight backtests / training runs.
- Update experiment-tracker priorities.

**Promotion-gate triage (5–10 min):**

- Strategies ready for promotion review tomorrow morning.

**Sign-off:**

- Confirm all alerts are acknowledged or resolved.
- Confirm fleet is in expected state for overnight.
- Verify European overnight strategies (Brent, TTF, JKM, gasoil) are correctly configured.

### 15.4 Cadence Variations

- **Inventory-release weeks** — every week. Wednesday and Thursday are supervision-heavy; Monday / Tuesday / Friday are research-heavy.
- **OPEC-meeting weeks** — supervision-heavy on meeting day; pre-week is preparation-heavy.
- **Hurricane-active periods (June–November)** — supervision-heavy when storms approach the GoM; quiet otherwise.
- **Winter peak (December–February)** — natgas-fleet supervision-heavy; weather-model-divergence triage frequent.
- **Refinery-turnaround seasons (March–May, September–November)** — crack-fleet supervision-heavy.
- **Quiet weeks** (mid-shoulder seasons, no scheduled OPEC, no major geopolitical) — research-dominated.
- **Quarter-end** — cross-fleet review, retire decisions, capital reallocation, committee report contribution.
- **Annual contract-roll calendar** — front-month roll windows are micro-events; the calendar-spread fleet's roll-window is supervised closely.

## 16. Differences from Manual Mode

| Dimension                  | Manual Theo                                   | Automated Theo                                                                                                   |
| -------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Coverage                   | 5–10 actively-watched products                | Crude / products / natgas / power / carbon × multiple regions × 12–60-month curves × multiple spreads            |
| Trades per day             | 5–25 high-conviction                          | Hundreds across the fleet                                                                                        |
| Phase 1 (Decide)           | Reading curves, spreads, inventories          | Choosing alpha to research; managing portfolio of strategies + interpreting OPEC / hurricane / refinery / geopol |
| Phase 2 (Enter)            | Click ticket / spread combo                   | Promote strategy through lifecycle gates; manual ticket reserved for OPEC-headline / hurricane / overrides       |
| Phase 3 (Hold)             | Watching positions, curves, spreads           | Anomaly-driven supervision of fleet; foveal during inventory windows / OPEC / hurricane                          |
| Phase 4 (Learn)            | Journaling lessons; seasonal pattern review   | Decay tracking, retraining, attribution-driven research priorities, multi-year seasonal pattern fit              |
| Time on charts             | 70%                                           | 5–10% (mostly diagnostic, plus event-mode windows)                                                               |
| Time on research           | 10–15%                                        | 55–65%                                                                                                           |
| Time on supervision        | 10–15%                                        | 10–15% (concentrated in event windows)                                                                           |
| Time on intervention       | (continuous)                                  | 5–10% (concentrated in OPEC / hurricane / refinery events)                                                       |
| Time on data / procurement | minimal                                       | 5–10%                                                                                                            |
| Time on capital allocation | minimal (per-trade sizing only)               | 5–10% (fleet-level)                                                                                              |
| Latency criticality        | Front-month execution, calendar-spread combos | Per-strategy-class latency tiers, with budget enforcement; back-month and OTC tolerant                           |
| Risk units                 | $-notional + DV01 + greeks                    | Same + per-strategy DV01-equivalent + per-product / per-region / per-tenor envelopes + correlation cluster       |
| Edge metric                | P/L, Sharpe                                   | P/L, Sharpe, decay rate, capacity utilization, marginal Sharpe, seasonal pattern fit, **CLV-style entry timing** |
| Cognitive load             | Foveal-on-curves-and-spreads                  | Peripheral-on-fleet; foveal-on-research-or-anomaly; foveal-on-event during OPEC / hurricane / inventory          |
| Failure modes              | Tilt, missed inventory print, fatigue         | Silent overfit, decay-blindness, alert fatigue, seasonal mis-configuration, runaway algo, missed OPEC pre-arm    |
| Tools mastered             | Curve dashboard, spread dashboard, ticket     | Notebook, feature library, model registry, lifecycle gates, allocation engine, seasonal calendar, OPEC scaffold  |
| Compensation driver        | Sharpe + AUM                                  | Same + research velocity + fleet capacity utilization + seasonal-pattern-fit                                     |

The fundamental change: **Theo stops being the one watching the EIA print and the OPEC headline alone, and becomes the principal investor in his own quant fund — while retaining the seat where OPEC headlines, hurricane tracks, refinery-outage interpretations, and geopolitical premium reads remain his.**

## 17. Coordination with Other Roles

### 17.1 Coordination with Rafael (Macro)

Rafael runs global macro, expressing themes through asset-class peers' books. Energy is one of his expression domains. Cross-asset oil moves — when oil is being driven by USD, by Chinese demand, by global growth, by inflation regime — are Rafael's read; the trade through Theo's book is the expression.

- **Theme-to-strategy mapping** — when Rafael has a "long oil on Chinese reflation" theme, the platform surfaces existing Theo strategies that align (or don't), and Rafael / Theo coordinate on whether to express through Theo's existing fleet, through a custom strategy, or through Rafael's own book.
- **Cross-asset correlation visibility** — Theo's fleet vs Rafael's fleet pairwise correlations are visible to both. Avoid double-up.
- **Macro-regime sharing** — Rafael's USD-regime, growth-regime, and inflation-regime classifiers feed Theo's models as input features.
- **Theme-day coordination** — when Rafael is positioning ahead of a major macro release (FOMC, China data, ECB) that could affect oil, he flags Theo so the energy fleet is appropriately gated.

### 17.2 Coordination with Quinn

Quinn runs cross-archetype factor / stat-arb / market-neutral systematic strategies. Some of her strategies overlap with Theo's domain (a commodity-momentum factor; a cross-asset carry strategy that includes energy futures).

- **Correlation matrix shared** — Quinn's fleet vs Theo's fleet pairwise correlations visible to both.
- **Promotion-gate awareness** — Quinn promoting a new energy-touching strategy alerts Theo; if Theo's existing strategies would correlate, they negotiate.
- **Feature sharing** — features Theo builds (calendar-spread z-scores, inventory-vs-5y bands, multi-model HDD divergences) are useful to Quinn's cross-archetype factor strategies.
- **Research collaboration** — joint research on cross-archetype topics (e.g. cross-asset volatility-regime indicators that affect both Quinn's stat-arb and Theo's mean-reversion strategies).

### 17.3 Coordination with David

David is the firm-level supervisor. Theo's automated cousin is a $X-allocated fleet within David's purview.

- **Fleet-level reporting** — David sees Theo's ~150 strategies aggregated, with health / PnL / risk-consumed visible.
- **Capital allocation gates** — material allocation changes route to David.
- **Behavioral monitoring** — David watches Theo's intervention frequency, override frequency (especially OPEC-headline and hurricane overrides — these are expected and tagged, but unexpected spikes are flags), retire-decision pace.
- **Promotion-gate sign-off for material strategies** — strategies above a capital-cap threshold require David's sign-off in addition to Theo's.
- **Catastrophe response** — firm-wide kill switches require David + CIO + risk officer; Theo has fleet-level kill autonomy.
- **Risk-committee deliverables** — Theo's monthly attribution + risk decomposition + lifecycle decisions are inputs to David's committee deck.

### 17.4 Firm-Level OPEC-Headline Coordination

OPEC headlines are firm-level events. Multiple desks (Theo's energy book, Rafael's macro book, Henry's energy-sector equity book, Quinn's cross-archetype factor strategies) all have exposure. Coordination happens before, during, and after.

- **Pre-meeting coordination** — desk-level pre-positioning summary across Theo / Rafael / Henry; firm-level net exposure visible to David. Adjustments where exposures stack unintentionally.
- **Meeting-hour shared awareness** — chat channel + shared event-mode dashboard with all relevant traders' positions visible (with permissions-controlled detail).
- **Headline-cross response coordination** — when the headline crosses, desks may take different views (Theo on the energy-curve impact; Rafael on the cross-asset implications; Henry on the energy-equity reaction). Coordination prevents working at cross-purposes.
- **Post-meeting attribution** — multi-desk post-meeting review of how the firm performed across the headline.

The platform supports this with a shared OPEC-event surface that's visible to all participants; their automated-mode supervisor consoles can switch into a coordinated-event-mode for the meeting hours.

### 17.5 Cross-Domain Adjacent Coordinations

- **Energy-equity overlap.** Theo's fleet drives crude / natgas / power / EUA prices that are inputs to Henry's energy-sector equity portfolio (Exxon, Chevron, refiners, utilities, EU-power exposed names). When Theo's fleet has a strong directional view, the cross-impact on Henry's book is visible to both.
- **Sanctioned-flow + macro overlap.** Sanctions packages are Rafael's regime input + Theo's flow input + David's compliance gate. The platform's sanctioned-flow tracking surface is shared.
- **Carbon-policy overlap.** EUA price moves affect Theo's European energy strategies + Henry's European utilities + Rafael's European inflation regime view. Cross-coordination on EU-policy events.

### 17.6 Why this matters

- **Efficiency:** without coordination, the firm builds the same exposure twice across desks, doubles up on capacity, dilutes attribution. Coordination layered on visibility tools is cheap.
- **Risk:** correlated bets across desks compound risk. Firm-level OPEC-event coordination is the canonical example — three desks all long oil into an OPEC meeting is a single bet, not three.
- **PnL:** cross-desk research collaboration produces alpha that no single desk could find alone. Theo's calendar-spread features + Rafael's regime classifiers + Quinn's stat-arb framework = a class of strategies none of them would build alone.

## 18. How to Use This Appendix

When evaluating Theo's automated terminal (against any platform — including our own):

**Data layer:**

- Are all the energy-domain data sources cataloged with quality / lineage / cost / freshness / used-by tracking? (EIA / DOE / IEA archives; multiple weather-model providers — GFS / ECMWF / ICON / UKMET; shipping data including Vortexa-style floating-storage; refinery-utilization history; OPEC production data; sanctioned-flow tracking; hurricane-track archives.)
- Is the procurement dashboard a serious tool, with attribution-vs-cost evidence?
- Is gap analysis tied to concrete strategies that can't be deployed?
- Is the EIA-release-window data plumbing hardened (release-time-window-aware quality monitoring, blackout enforcement)?
- Are weather-model archives multi-provider and divergence-aware?

**Feature library:**

- Are Theo's features (calendar-spread z-scores, inventory-vs-5y bands, multi-model HDD/CDD divergences, OPEC-compliance residuals, refinery-margin compression, sanctioned-flow anomalies, seasonal-cycle indicators) first-class with drift monitoring?
- Is the feature engineering surface frictionless inline-in-notebook?
- Is cross-pollination across desks supported? (Rafael's regime classifiers; Henry's energy-equity factors; Quinn's cross-archetype features.)
- Is seasonal-aware drift detection separated from anomalous drift?

**Research workspace:**

- Can Theo go from idea to validated strategy in hours, not weeks?
- Is the backtest engine realistic (slippage, fees, latency, partial fills, calendar-spread combo execution, roll-cost, RFQ for swaps)?
- Are anti-patterns (lookahead, survivorship, p-hacking, calendar-spread roll bugs, seasonal overfit, inventory-release-window leak) caught by the platform?
- Is the strategy-template library populated with energy-specific templates (calendar spreads, weather-driven natgas, inventory setup, crack mean-reversion, OPEC scaffolding, location spreads, seasonal cycles, refinery outages, spark / dark spreads)?
- Is walk-forward window choice validated against seasonal coverage?

**Model registry & experiment tracker:**

- Can any model be re-trained from registered inputs and produce a bit-identical result?
- Are old versions never deleted?
- Does the experiment tracker make Theo's research process honest and defensible?
- Is seasonal-conditional comparison supported in the experiment tracker?

**Strategy composition:**

- Is the composition surface visual + code-droppable?
- Does pre-deployment validation catch lookahead, unbounded sizing, missing kill-switches, inventory-release-window leak, seasonal-lifecycle mismatch, calendar-spread roll-window conflict?
- Are energy-specific templates provided?

**Lifecycle:**

- Is the pipeline visualization (research → paper → pilot → live → monitor → retired) usable as a daily kanban board?
- Is the **seasonal Sleeping sub-state** a first-class lifecycle state, with auto-wake-up at season-start and auto-sleep at season-end?
- Are gates checklists with evidence, not chat conversations?
- Is rollback one-click?
- Are seasonal wake-up / sleep transitions logged like any other transition?

**Capital allocation:**

- Does the allocation engine propose a nightly portfolio with risk-decomposition + marginal-Sharpe analysis?
- Are per-product, per-region, per-tenor, per-strategy-class budgets first-class?
- Is back-month capacity treated separately from front-month?
- Is seasonal-aware sizing supported?
- Are sub-account routing and margin segregation supported?

**Live fleet supervision:**

- Can Theo supervise 150+ strategies anomaly-driven, default green, with energy-specific columns (season-state, inventory-state, curve-state, weather-state, OPEC-state, refinery-outage-state)?
- Is the strategy detail page a complete diagnostic surface?
- Are anomalies severity-routed with auto-actions on critical?
- Is the **inventory-release-window live state** a first-class surface with countdown banner, pre-positioning summary, whisper-vs-consensus tracker, manual override controls?
- Is **strategy state inspection** (internal variables, current feature snapshot, recent signal evaluations, regime classifier output) available on demand per strategy?
- Is **backtest-vs-live comparison** computed (daily by default, on-demand available) for divergence catching, including seasonal-pattern comparison?
- Is the platform pragmatic about state-streaming load?

**Intervention console & manual trading:**

- Are kill switches granular (strategy / class / product / region / venue / fleet / firm) with multi-key authentication for the largest scopes? Does **hedge-to-neutral** exist as a first-class emergency-shaped action?
- Is **the full manual order ticket** (outright, calendar-spread, crack-spread, options, swaps RFQ, hotkeys, smart router, multi-venue ladder, pre-trade preview with DV01-equivalent) preserved and one-keystroke-reachable from the supervisor console?
- Is **emergency mode** a designed UI mode with manual ticket + multi-venue ladder + working orders foveal?
- Is **inventory-release mode**, **OPEC-meeting mode**, and **hurricane / refinery-outage mode** designed UI modes with the right surfaces foveal?
- Is **reconciliation** a designed workflow (algo state vs venue state, with diff highlighting and per-row actions, including calendar-spread combo single-leg execution diagnostic)?
- Is every manual trade tagged (emergency / reconciliation / OPEC-headline / hurricane / refinery / geopolitical / directional macro) and auditable?
- Are global manual-trading hotkeys (open ticket, calendar-spread ticket, crack ticket, flatten product, cancel-all, roll forward, hedge-to-flat) bound regardless of supervisor console mode?
- Is every intervention logged with timestamp / actor / action / reason / pre-state / post-state?

**Post-trade & decay:**

- Are retrospectives auto-generated, not composed?
- Is decay caught by metrics, not gut?
- Is **seasonal pattern fit** a primary post-trade axis with multi-year same-season comparison?
- Is the retrain queue actionable, with auto-approval for routine retrains and explicit approval for live strategies?
- Is structural-regime-shift detection separated from ordinary decay?

**Supervisor console:**

- Is research foveal-by-default and supervision peripheral-by-default?
- Are the manual-mode surfaces (forward curves, spread dashboard, inventory dashboard, ticket entry) reachable in one keystroke and designed-in to event modes?
- Is mode-switching one keystroke?
- Is the platform green-by-default and trustworthy in its silence?

**Daily rhythm:**

- Can Theo actually spend 55–65% of his time on research while the fleet runs supervised in the periphery?
- Are pre-market / in-market / post-market workflows supported?
- Are inventory-release windows, OPEC-meeting hours, hurricane / refinery events first-class day-shaping surfaces?

**Coordination:**

- Is Theo's fleet visible to Rafael, Henry, Quinn, David at the right level of detail?
- Are firm-level OPEC-headline coordination, sanctioned-flow visibility, and carbon-policy event coordination first-class?
- Are cross-desk correlation, promotion alerts, feature sharing supported?

**Cross-cutting:**

- Is lineage end-to-end (data → feature → model → strategy → trade → P/L)?
- Is reproducibility guaranteed?
- Are audit trails non-negotiable?
- Is the OPEC-scaffolding pattern (pre-position systematically, pause and escalate on the headline, human-trade the headline manually) implementable?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.
