# Trader Archetype — Theo Rasmussen (Senior Energy Trader)

A reference profile of a top-performing energy trader at a top-5 firm. Used as a yardstick for what an ideal **energy / commodities** terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).
For sister archetypes on the same desk, see the other `trader-archetype-*.md` files in this folder.

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

- The price of oil reflects **supply, demand, storage, and logistics** — not just sentiment. A pipeline outage is more important than a chart pattern.
- Almost every trade is **calendar-shaped** — long Dec, short Mar, betting on the spread. Outright direction is hard; relative-value is the bread and butter.
- **Seasonality is real.** Winter heating demand drives natgas; summer driving drives gasoline; cold snaps blow out heating oil cracks; hurricane season disrupts Gulf production.
- **Locations matter.** WTI (Cushing) is not Brent (North Sea) is not Dubai (Middle East). Same product, different geography, different dynamics. Spreads between them are first-class trades.
- **Cracks and crushes** — oil into gasoline + diesel (the "crack spread") — relate inputs to outputs. Refiner economics are tradable.
- **Inventories are the price.** Weekly EIA petroleum / DOE natgas storage reports move markets. Storage levels vs 5-year average is the central indicator.
- **OPEC and geopolitics** drive crude. War in producing regions, sanctions, OPEC+ decisions, Strategic Petroleum Reserve actions.
- **Weather drives natgas and power.** Heating degree days, cooling degree days, hurricane forecasts, polar vortex.

### His cognitive load

Theo holds in his head:

- **Forward curves** for every product he trades — typically 12–60 months out.
- **Spread structures** — calendar spreads, location spreads, crack spreads — each its own market.
- **Storage levels** vs seasonal norms.
- **Fundamental drivers** — production rates (rigs, OPEC quotas, US shale productivity), demand indicators (refining utilization, miles driven, jet fuel demand), inventory flows.
- **Weather forecasts** at multiple horizons (1–14 days, monthly, seasonal).
- **Geopolitical flashpoints** — Middle East tensions, Russian sanctions, Venezuela, Libya, Iran nuclear deal, Houthi attacks on shipping.

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

Theo's days are calendar-driven: weekly EIA report (Wednesday 10:30am ET for petroleum, Thursday 10:30am for natgas), monthly OPEC report, monthly IEA report. These structure his week.

---

## Phase 1: Decide

### Forward curves (the primary thinking surface)

For each product:

- **Current curve** — futures prices by month, out 12–60 months.
- **Curve overlay** — current vs 1d / 1w / 1m / 1y / 5y-avg.
- **Curve shape labeling** — backwardation (front > back) vs contango (back > front), with magnitude.
- **Spread breakdown** — adjacent calendar spreads (Mar-Apr, Apr-May, etc.) as a sub-curve.
- **Implied storage cost** in contango — the curve premium for holding.
- **Term structure of vol** — IV by tenor on options.

### Spread dashboard

The trader's bread and butter. First-class instruments:

- **Calendar spreads** — every adjacent and non-adjacent pair (M1-M2, M1-M3, M1-M6, M1-M12) with z-score vs historical.
- **Location spreads** — WTI-Brent, Brent-Dubai, WTI-WCS (Canadian), WTI-LLS (Light Louisiana Sweet), HH-TTF (US-Europe natgas), TTF-JKM (Europe-Asia LNG).
- **Crack spreads** — 3:2:1 crack (3 oil → 2 gasoline + 1 distillate), gasoline crack, distillate crack, by region.
- **Spark spread** — natgas vs power (refining-equivalent for power generation).
- **Dark spread** — coal vs power.
- **Crush spreads** for ags (soybean → meal + oil) — adjacent commodity.
- **z-scores** on each spread vs 1m / 6m / 1y / 5y history.
- **Seasonal overlays** — current spread vs 5-year seasonal average.

### Inventory & fundamentals

The single most important data layer in energy:

- **EIA Weekly Petroleum Status** — crude, gasoline, distillate, jet fuel inventories. Total + by PADD region. Vs prior week, vs 5-year avg, vs 5-year range.
- **EIA Weekly Natural Gas Storage** — total + by region (East, Midwest, Mountain, Pacific, South Central). Working gas.
- **OPEC Monthly Oil Market Report** — production, demand forecasts, OECD inventory.
- **IEA Monthly Oil Market Report** — global supply/demand balance.
- **Strategic Petroleum Reserve** — US SPR levels, recent actions.
- **Floating storage** — ships at sea with crude (vela / Vortexa data).
- **Refining utilization rates** — % of capacity running.
- **Rig counts** — Baker Hughes, US oil + gas rigs.
- **Production data** — US weekly, OPEC monthly, Russia (where reported).

### Weather & seasonality

Energy is a weather market:

- **Heating degree days (HDD) / Cooling degree days (CDD)** forecasts — 1–14 day, 30-day, 90-day. Vs normal, vs prior year.
- **Population-weighted temperature forecasts** — actual demand-relevant.
- **Storm tracker** — Atlantic / Pacific hurricanes during season; threats to Gulf production / refining.
- **Polar vortex / arctic blast** indicators.
- **El Niño / La Niña** seasonal context.
- **Snowfall, drought** — affecting natgas demand, hydropower.

### Geopolitical & supply tracker

- **Conflict / sanctions tracker** — Russia, Iran, Venezuela, Libya, Iraq.
- **Houthi shipping attacks** — Red Sea / Suez impact on flows.
- **OPEC+ meeting calendar** — JMMC, ministerial meetings, with countdown.
- **OPEC+ production targets** vs realized.
- **US shale productivity** — DUC (drilled uncompleted) wells, well completions, production per rig.
- **LNG export terminals** — US capacity additions, outages.
- **Pipeline outages** — Colonial, TC Energy, Druzhba, etc.
- **Refinery outages** — turnarounds, fires, planned maintenance.

### Macro inputs

- **DXY** — strong dollar typically pressures oil.
- **US 10y yield** — inflation expectations.
- **Equities** — risk-on / risk-off proxy.
- **Freight rates** — Baltic Dry, tanker rates (VLCC, Suezmax) — physical demand proxy.
- **Industrial production** — global PMIs.
- **China data** — implied oil demand from refinery throughput, trade balance.

### Positioning data

- **CFTC Commitment of Traders** — managed money positioning by contract.
- **ICE positioning** for Brent.
- **Commitments of Speculators** — net long / short, % of OI.

### Sell-side and physical research

- **Energy strategist morning notes.**
- **Trade ideas** with track records.
- **Physical desk color** — refining margins, blender economics, where physical traders see flows.

### Carbon & adjacent

- **EUA (EU carbon allowances)** — increasingly correlated with European energy.
- **California carbon (CCA), RGGI** — US.
- **Renewable fuel credits (RINs).**

**Layout principle for Decide:** forward curves and spread dashboards are foveal. Inventory release dates structure the week. Weather and geopolitics are continuous peripherals.

---

## Phase 2: Enter

Energy execution is **calendar-spread native**, **location-aware**, and **product-fragmented** (futures vs options vs swaps vs cleared OTC).

### Outright futures ticket

- **Product, contract month, side, size, type, TIF.**
- **Tick-size aware** — energy futures have specific tick increments and dollar values per tick.
- **Last-trade-date awareness** — front month expires soon; UI flags it.
- **Pre-trade preview:** position impact, margin (initial + maintenance), DV01-equivalent (price sensitivity).

### Calendar spread ticket (first-class)

- **Two contract months** — long Dec24, short Jun25.
- **Spread quoted as a single number** — the price differential.
- **Atomic execution** — both legs go in coordinated, often via exchange-recognized spread products.
- **Z-score history** of the spread vs entry.
- **Carry / storage implication** — does this spread reflect storage cost?

### Crack / location spread ticket

- **Multi-leg multi-product** — long crude future, short gasoline future, short heating oil future (3:2:1 crack).
- **Standard ratios** as templates (3:2:1, 2:1:1).
- **Quoted in $/bbl** of refining margin.

### Options ticket

- **Futures options** primarily — American-style, expiration 1 month before futures expiry.
- **Multi-leg structures** — straddle, strangle, calendars, ratios.
- **Vol-quoted entry.**
- **Greeks displayed.**

### Swaps / OTC ticket

For products without exchange futures or with specialized structures:

- **Swap on a basis differential** — e.g. WTI Midland vs WTI Cushing.
- **Index-on-a-month** — average price over a month.
- **OTC options** for non-listed strikes.
- **RFQ workflow** to broker-dealer panel.
- **Cleared vs bilateral** awareness.

### Roll workflow

Energy futures expire monthly; rolling positions is a constant activity:

- **Roll calendar** — when to roll each position.
- **Roll algos** — TWAP through roll window, calendar-spread-aware.
- **Cost-of-roll tracker** — accumulated roll cost over time.

### Hedge workflow

- **Spot-hedge against physical exposure** (rare for financial desk but structural).
- **Cross-hedge** — using one product to hedge another (gasoil for jet fuel, etc.).

### Pre-trade preview

For multi-leg structures:

- DV01 by tenor.
- Spread P/L per scenario.
- Margin (initial + maintenance + variation).
- Liquidity profile.
- Basis risk if cross-hedge.

### Algos

- **TWAP / VWAP** for futures.
- **Calendar-spread-aware** — execute outright while watching spread to optimize.
- **Auction-aware** for inventory release windows.
- **Settlement-window algos** — participate in trade-at-settlement.

### Hotkeys

- Buy / sell at top of book.
- Cancel all on contract.
- Roll position forward.
- Flatten product.

**Layout principle for Enter:** the calendar spread ticket is first-class, not buried. Crack spreads are templated. Options structures are templated. Roll is a designed workflow, not an ad-hoc action.

---

## Phase 3: Hold / Manage

Energy positions evolve through the curve as time passes (roll), as fundamentals shift (inventory, weather), and as events erupt (geopolitics).

### Positions blotter — by product & spread

- **Outright positions** — by product, by month.
- **Spread positions** — calendar / location / crack — as composite objects.
- **Greek-equivalents** — price sensitivity per $1 move; vega for options.
- **Drill-down to legs.**

### Forward exposure ladder

- **Net position by month** — out across the curve.
- **DV01-equivalent by month** — concentration per tenor.
- **Total position aggregate per product.**

### Live PnL — energy-style decomposition

- **Outright price PnL** — directional moves.
- **Curve change PnL** — calendar spread shape.
- **Spread P/L** — for active spread trades.
- **Roll cost** — accumulated.
- **Vol PnL** — for options.
- **Per-product, per-spread breakdown.**

### Risk panel

- **Position by product & month** with limits.
- **Spread exposure** — calendar / location / crack — with limits.
- **DV01-equivalent total** vs limit.
- **Vega** for options exposure.
- **Stress scenarios:**
  - Outright shocks: WTI ±$10, HH natgas ±$1.
  - Curve shocks: front contango → backwardation, parallel shifts.
  - Crack widening / narrowing.
  - Hurricane scenario — Gulf production -20%.
  - OPEC surprise — 1mb/d cut or release.
  - SPR release — 30M barrels.
  - Cold snap / heat wave scenarios for natgas.
  - Geopolitical — Iran-Israel conflict, $100 → $130 oil.
- **Liquidity profile** — most-traded contracts vs back-month illiquidity.
- **Margin & collateral** consumption.

### Inventory countdown

- **EIA Wednesday countdown** — minutes-to-release.
- **Pre-release positioning** by product.
- **Consensus expectation** — survey of analysts.
- **Whisper number** — desk consensus.
- **Recent surprises** — pattern of how surprises move price.

### Weather watch

- **Active weather threats** to positions.
- **Forecast updates** — when daily/weekly forecast updates land.
- **Hurricane watch** during season — track positions exposed to Gulf.

### Geopolitical alerts

- **Conflict escalation** — keyword-based news alerts.
- **OPEC+ decision** countdowns.
- **SPR action** announcements.
- **Sanctions changes** — Russia, Iran.

### Alerts

- **Price alerts** — outright and spread.
- **Spread z-score alerts.**
- **Inventory release alerts** — pre-release, post-release surprise size.
- **Weather alerts** — new HDD/CDD forecast diverging from prior.
- **Geopolitical alerts.**
- **Roll alerts** — contract approaching expiry.
- **Risk limit alerts.**

### Trade journal

- Per trade / spread: thesis, fundamentals supporting, expected catalyst, invalidation.
- Updated around inventory and OPEC events.

### Communications

- **Bloomberg / Reuters chat** — broker chat, sell-side desk color.
- **Physical desk chat** if firm has one.
- **Weather service** integrated.
- **Geopolitical analyst** feed.

### Heatmap

- Products / spreads sized by exposure × today's move.

### Kill switches

- **Reduce by product** — flatten gasoline, keep crude.
- **Reduce all energy.**
- **Hedge to neutral** — buy front-month to offset back-month exposure.
- **Cancel all working orders.**

**Layout principle for Hold:** spread positions and forward exposure are foveal. Inventory countdown and weather/geopolitics are critical peripherals. Roll workflow is always pending in the background.

---

## Phase 4: Learn

Energy post-trade emphasizes **fundamentals fit**, **spread vs outright skill**, **seasonal pattern recognition**.

### Trade history

- Every trade with curve / spread / inventory / weather / geopolitical context at entry.
- Tagged by trade type (outright, calendar, location, crack) and theme (inventory build, weather event, OPEC, geopolitics).

### PnL attribution

- **Outright vs spread vs cracks** — different skills.
- **By product** — crude skill vs natgas skill vs power skill.
- **By tenor** — front-month vs back-month.
- **By season** — winter natgas vs summer gasoline.
- **By event type** — inventory trades, OPEC trades, weather trades, geopolitical trades.

### Performance metrics

- Sharpe, Sortino, Calmar.
- Hit rate by trade type and event type.
- **DV01-equivalent return** — risk-adjusted.
- **Carry capture** — earned roll yield in backwardated curves.

### Spread trade analytics

- **Spread mean-reversion** — when did the spread converge?
- **Half-life of dislocations** by product.
- **Stop-out vs target-hit ratio.**

### Inventory trade analytics

- **Pre-release positioning vs result** — were we on the right side?
- **Surprise direction skill.**
- **Surprise magnitude calibration.**

### Weather trade analytics

- **Forecast-driven trade outcomes** — did the forecast match reality?
- **Forecast vs realized weather** — was the forecast we traded actually right?

### Geopolitical trade analytics

- **Event response speed** — how fast did we react?
- **Persistence of geopolitical risk premia** — when did they fade?

### Execution quality / TCA

- **Per-trade slippage** vs decision-time mid.
- **Roll cost** vs theoretical (calendar spread mid).
- **Block / RFQ** best-quote frequency by counterparty.

### Seasonal pattern fit

- **Was the seasonal trade timely?** Did we enter at the right point in the seasonal pattern?
- **Multi-year backtest** of recurring seasonal trades.

### Behavioral analytics

- **Inventory-week discipline** — held through release or exited?
- **Weather forecast trust** — over- or under-reacted to forecast updates?
- **Geopolitical reaction** — chased the news or faded it?

### Reports

- Daily P/L commentary (especially around inventory days).
- Weekly portfolio review.
- Monthly attribution by product / spread / event.
- Quarterly investor / committee letter contribution.
- Compliance / regulatory filings (CFTC large trader reports, position limits).

**Layout principle for Learn:** spread / event / seasonal slicing. Pattern-matching across years is the key learning loop.

---

## What Ties Theo's Terminal Together

1. **Forward curves are first-class.** Every product is a curve, not a price.
2. **Spreads are first-class instruments.** Calendar / location / crack spreads with z-scores and dedicated tickets.
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
