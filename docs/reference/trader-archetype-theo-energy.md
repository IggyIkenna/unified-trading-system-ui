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
