# Platform Review — Meeting Chat (2026-03-25)

> **Status:** All messages categorized into structured docs (2026-03-26).
> **Promote lifecycle tab** is already in progress — see `docs/promote lifecycle tab/PROMOTE_LIFECYCLE_DESIGN.md`.
> Everything else below is captured in the docs listed at the bottom.

---

## Categorized Messages

### Message 1 — Research/Build: Grid Search, Features, Strategy Comparison, Execution Decision

**→ Captured in:** `docs/platform review/research-build-enhancements.md` (Sections 1-6)

[3/25/26 5:22 PM] Upwork Ikenna: Okay so multi-tab execution, keeping the high-level tab the same, multi-tab for strategy machine learning strategy and execution. All the while allowing the user to quickly filter through a lot of information to less information to get their fixed config set up and then hyperparameter is their grid search for all of the dynamic stuff with UI-based grid searching. If you have the grid fixed to one point then you're just using one point for that particular part of the config. It will tell you how many backtests you're going to spin up, tell you a projected compute hours and cost or whatever. That's the same for everything.

The features visualisation is super cool. Features and ETL, we can steal a lot of that stuff and put it on the data pipeline as well and

Strategy comparison and execution comparison. Here we need a way to be able to see visually all the things in comparison mode versus absolute mode

The same way that TradingView allows you to subscribe to advanced technical indicators, those advanced technical indicators would effectively be our features library. We decide what we're willing to give away in terms of our IP, and they can subscribe to enhanced models. But in the basic level, you give them the Bollinger Bands, and you know, EMAs, and RSI's - exactly, all that kind of basic stuff where they can quickly parameterize them as well.

So, then you basically still have the easiest way would be to make sure that those existing features are pre-computed in that way and then live as well. We just make sure that they're also computed live. So that's just our store of features that are generic. We can still use them in our machine learning model, but like in practise, we have different permutations that make sense for us for the actual process, but you know, we'd have those vanilla ones available for these plots. (this is strategy tab). You know, correlation between signals, correlation between strategies, maybe, and correlation between strategies and a chosen underlying. Your chosen underlying could be, in theory, any of our instruments but maybe to start with just Bitcoin, S&P, and gold, some bits of general benchmark asset classes so that we can look at the correlation of our P&L between strategies and each other and the strategies in the underlying. The strategies in each other would be our way of saying are we building a diversified portfolio and our strategies versus the benchmark would be our way of saying are we achieving alpha over the benchmark visually.

Execution: what do we split into the execution build or what do we put execution as a service? Or we drop the concept of execution as a service and execution naturally means you have to use our algo garden for execution and then you get to promote different algos to production. Otherwise you just get to promote a single one, simple one so we could take down one service as a standalone, probably makes it, but yeah that's a decision for later.

---

### Message 2 — Promote Lifecycle + Investment Management Graduation

**→ Promote part:** Already in progress — see `docs/promote lifecycle tab/PROMOTE_LIFECYCLE_DESIGN.md`
**→ Investment Management / Graduation:** Captured in `docs/platform review/trading-asset-class-navigation.md` (Section 7)

completing promote

When it comes to promoting and everything, we naturally would want some sort of link. We'd have to think about this today, but some sort of link between the ODUM strategies. We're not going to give our client strategies, the ODUM strategies, unless our client has agreed that we're able to raise for them and we split the difference.

The investment management candidate strategies would be potentially different from what's trading and would give us an ability to warehouse some early-stage models for our own testing. In fact, that's exactly how it's going to work from day one. We're going to launch our strategies; they're all testing. We have no idea if they're going to make money. After a minimum of a week, we call it graduated in our world, but after minimum a month, we called it graduated for the investment management offering. Then they can start to see the historical performance, and automatically we don't need to add it manually. It's just feeding in from the data that we already see on this side.
[3/25/26 5:22 PM] Upwork Ikenna: So we have access to that same portal with unrestricted access. We'd see all the early-stage strategies as well, with all the same pretty graphs. They would see it when we want them to see it, and we can tell them whether it's our strategy or another person's strategy or not. That's up to us, as long as it's vetted in our system. It doesn't really matter.

---

### Message 3 — Trading Terminal: Sports & Predictions

**→ Captured in:** `docs/platform review/trading-sports-predictions.md` (All sections)

[3/25/26 5:35 PM] Upwork Ikenna: Yeah, trading terminal, the main additions probably are around the enhancements around sports and predictions. For both it's trying to figure out what the high-level information is that's nice. There's nothing wrong with seeing all of the product market predictions that exist. There's nothing wrong with being able to drop down and see in a nice visual way that Arsenal are playing Chelsea so you can see your latest fixtures or your up-and-coming fixtures.

It would be nice if you're able to then filter through on a time basis to see your historical fixtures as well since we have the information, we might as well showcase it so you can easily see historical games. The results are there, the in-game stats (which we've already grabbed historically) are only going to be half-time and pre-game stats for the most part, and the current end-of-game stats in terms of corners and all that kind of stuff. Seeing that and being able to filter through historically is already a pretty nice tool, much more visually friendly under stats, right, that have it but this is really hard to pass so that's the explanatory.

You probably need another tab, which is more like an arbitrage tab, and that's just showing you, for sports, a nice grid of your different bookmakers, all of the bookmakers that you're subscribed to, which for us would be everything. We charge people more the more bookmakers they subscribe to and, like, that, right, so they can actually use our portal to do manual up if they want or they can use it to build strategies to do manual but then they have to pay more to be part of the research environment. They can also give us signals and we can trade them for them. There are multiple layers. They can interact on sports. The trading terminal just gives them the visualisation regardless of what interaction they've done with us.

---

### Message 4 — Predictions: Polymarket, Arb Streaming, Historical Replay

**→ Captured in:** `docs/platform review/trading-sports-predictions.md` (Sections 2.1–2.5)

[3/25/26 5:40 PM] Upwork Ikenna: For predictions it's fine to focus on football right now because we're not doing anything else anytime soon so no point overboasting on that side. We've got crossover with sports so naturally, market fixtures should just match and results and odds are not market-specific; they're generic, hence the canonical IDs but market odds should be just another venue in sports, right? Market should just be viewable in sports for the arb and stuff like that but for the predictions actual tab we can have one tab which is a little bit like what we have now, very high level, covering everything, streaming straight from polymarket; that's easy enough.
Historically, the one where we can look at historical and live and everything, when it comes to arbitrage, when we can actually trade, needs to be filtered to our instrument ID. We have:

- Bitcoin up/down 5 minutes, all the way up to 24 hours
- SPY up/down 5 minutes, all the way up to 24 hours
- the sports as well
  We can show those sports again from an arbitrage perspective in another visualisation here and then unify a visualisation in predictions where, for the things that we're predicting, we're trying to figure out what's the information a user would want to see, including ourselves, for the closest thing that relates to that prediction. The same way polymarket shows you a live version of bitcoin going up and down on a chart, as they're showing the bitcoin up/down market. Same thing for SPY and sports, live results and stuff like that. For SPY and bitcoin we can probably enrich it beyond polymarket because polymarket doesn't show us things like options implied deltas and stuff, right? We could probably look at, if there's a strike, maybe the closest strike to when the up-down market started and the delta of that strike. If the delta of that strike is going up a lot whilst the odds are going down or vice versa, it's just a little visual thing of how those things are going.
  Otherwise yeah, just the underlyings are fine, I guess. Yeah I mean it's probably about until we know more about what we're actually doing with polymarket we will be about as much and then we'll find out what more interesting features around, like just like a trade list. I'm putting market already has trade lists so we should be able to see a trade list of course of all the things. All of this stuff for sports and predictions, the key is going to be we can see it live and we can also see it in the past, right? Yeah go back; you can't do that on polymarket's website. We can go back and see how these things looked at a certain time, given a certain state of the world; us and users can go back and check that shit. Yeah so did we miss an arb? Those kind of questions and I guess maybe even an arb streaming. Again if you're looking at it flat you see the arbs now. If you have an arb stream you're like, "Okay these arbs." Arb streaming, okay.

Yeah so the historical synthetic arb trades that you could have done. Yeah, streamed historically, it's gonna be tricky because if the arb exists and persists across ten views you don't want to keep showing the same data, right, but basically fresh arbs. You want to see incrementally fresh arbs and then you need some sort of decay. If an arb stops being an arb and then starts being an arb again, you still want to show it twice. Once an arb crosses to the no-arb zone again it's no longer cached in existing arbs and then once it becomes an arb again, given some threshold (which a user could select, the threshold, 1%, 2% whatever), then they just see the arb. They're like, not only would you see the arb, ready to trade manually once it's that threshold, you'd also see historically what would have been your arbs given that threshold. That's very high level but I think that'd be pretty cool for us as well to be able to see.

---

### Message 5 — Quick View on Every Tab

**→ Captured in:** `docs/platform review/cross-cutting-quickview-news-liveasof.md` (Section 1)

[3/25/26 5:41 PM] Upwork Ikenna: Make sure that quick view exists on every tab because it doesn't currently, I think, exist on every tab on the trading terminal. That way the user can always see the high level so they don't need to always worry about whether they're on the alerts tab that always sees the important stuff there

---

### Message 6 — News Section Enhancement

**→ Captured in:** `docs/platform review/cross-cutting-quickview-news-liveasof.md` (Section 2)

[3/25/26 5:41 PM] Upwork Ikenna: Yeah add a new section, put some jargon in there, just some ability to filter it down by category so they see the news that's relevant for sports, see the news that's relevant for TradFi, DeFi. A lot of it is overlapping for non-sport stuff but for sport stuff and crypto stuff, especially, there's gonna be specific stuff for commodities; there's gonna be specific stuff. Maybe like a category and then for TradFi you want one more breakdown, just on the actual asset classes:

- fixed income
- currencies
  yeah so
  [3/25/26 5:41 PM] Upwork Ikenna: news severity that makes sense

---

### Message 7 — Accounts, Risk, P&L, Positions, Reconciliation, Scenario Analysis

**→ Captured in:** `docs/platform review/trading-accounts-risk-pnl-reconciliation.md` (All sections)

[3/25/26 5:47 PM] Upwork Ikenna: Yeah, accounts need to definitely filter by clients and filter by venues. The actual account. Filtering by clients and filtering by venues makes sense but I think there's no time series. You want to have time series here as well so we can plot not just snapshots. So we can pretty much borrow time series concepts from positions for the accounts tab as well. Accounts tab effectively is also acting as the positions tab and more generally just high level.

Where do we see every single trade we've done? Where do we see every single order we've done? Where do we see our risk? We see our P&L breakdown by things but we don't see anywhere our actual Greeks and extending beyond Greeks.
Everything on P&L attribution is also a risk type, right? Basis is a risk type, carry is a risk type, funding is a risk type so that we can see our exposures in that area, right? We can do it two ways:

1. We can change P&L breakdown to be like cross-functional so that because they are the same metrics we can see them from a risk perspective one view and see them from a P&L perspective one view, right?
2. We have a separate tab which is risk, which effectively shows all the same shit but it's just risk versions of the cross section and the time series, right?
   We need that kind of tab and we also need something where we can do scenario analysis. We need a user to be able to define some stuff but that's probably going to have to go through us because it's going to require making sure that we have the calculators for it. This is all going on recording as well. We need some ability to see what happens if you drop down 10% and you shift vol up, you know, 10%. Deribit has a really cool scenario functionality, which maybe Claude knows from the internet, and once you can do it for options you can do it for everything, right, because you've already covered the most complex versions of anything.
   It's like what do you want to see and you want to be able to scroll over, scroll through and see, like, okay I'm going to keep changing my underlying, right? Move it up, move it down, move them up with a slider, and I'm going to keep seeing my P&L and Greeks and how my portfolio Greeks and position look at that particular snapshot, right? I'm going to shock the future up, shock the future down, shock vol up, shock vol down, and for the basis stuff you know it's more like spreads, right? You want to see how is my P&L mark to market going to look if I move my spreads by X amount, right? It's a little bit tricky because there are an infinite combinations of metrics of things you can change, right? I mean most people start with some kind of generic things you can do and they just make them fixed; that's the easiest way to do it.
   It'd be nice to have some sort of slider so that we can grid through at least five versions of market up and down, at least five versions of all up and down, right, so we can combinatorially them. Without having like a billion combinatorics, because in practise we're just going to be reading those from a database; we're probably not going to be pre-configuring them, pre-computing them, especially if we want to see how they would have looked in the past, like I made this money but I was like 1% move away from liquidating my portfolio, you know. The kind of generic you would hit liquidation could be part of the risk, right, so you keep sliding; you keep sliding. If you go too far, it's like you've hit liquidation.

---

### Message 8 — Activity Dots (Workflow Indicators)

**→ Captured in:** `docs/platform review/trading-asset-class-navigation.md` (Section 4)

[3/25/26 5:49 PM] Upwork Ikenna: Those little coloured dots, I guess, would be these: monitoring, trading, configuring, reconciliation, analysing

---

### Message 9 — Too Many Tabs, Orientation Problem

**→ Captured in:** `docs/platform review/trading-asset-class-navigation.md` (Section 1)

[3/25/26 5:50 PM] Upwork Ikenna: Using the terminal for the first time and there's way too many tabs so you're like, 'There's gonna be, because it's complex.' You're like, 'Roughly where am I? What kind of? You know, what's my starting point? What's my ending point and they all need to map to the dot.'

---

### Message 10 — Position Health, Quick Reconcile, Trade Matching, P&L Residual

**→ Captured in:** `docs/platform review/trading-accounts-risk-pnl-reconciliation.md` (Sections 4-5)

[3/25/26 5:54 PM] Upwork Ikenna: If, for example, in the position tab health, it said "health is reconciled", does that mean that the position that we're showing is the same as what the exchange is showing? If it's not healthy then we can sort by health. Obviously there'll be alerts around that as well but this is just another way of viewing it. Once you see something's unhealthy, like you said, you want to then click on it and go to the quick reconcile tab, because it's going to be a frequent thing. And then if you do want to deep dive because you're like, I don't want to reconcile without figuring out what all the trades we did versus the exchange did in case we booked a fake trade and we're reconciling to that (but we want that fake trade to exist because it's an OTC trade or because the exchange gave us a position). We want to just deep dive a little bit into how they gave us a position without giving us the fill. You can quickly click into that instrument. See all of the exchange trades in the list and see all of our own trades in a list and then you can just visually match them. It can already try to do some kind of algorithmic matching because we have a backend trade matching reconciliation process anyway so we're going to be like, good trade, good trade, good trade, and this is the one that we couldn't reconcile. Sometimes it's going to be more than trades, right? The trades will match but it's just that we got some staking rewards or our interest rate on our debt wasn't exactly the same as what we projected, right? Our position is our trades are actually the same; our position is the differentiator, right?

Finally on that same topic, P&L reconciliation. The P&L attribution tab breakdown tab is trying to explain our P&L in as perfect a way as possible but obviously it's going to miss something. We had different fees to what we had configured or whatever. There should be an unreconciled (or better word for the residual that already exists), so unexplained is there and then we can... okay so that's actually already fine. Yeah we just need alerts based on our residual being too high because something's a bit wrong if that's explaining half of our P&L that we can't explain ourselves.

---

### Message 11 — Live vs As-Of (Batch) Mode

**→ Captured in:** `docs/platform review/cross-cutting-quickview-news-liveasof.md` (Section 3)

[3/25/26 5:55 PM] Upwork Ikenna: So this one I'm going to do this actually being used so I'm just going to mock it like it's still in mock but it can still have the functionality because the only difference is going to be doing backend calls, right so we just want still all the calls but live/simulated and as of l vs live should feed through to every possible tab

---

### Message 12 — Static UI vs Mock Data Source Distinction

**→ Captured in:** `docs/platform review/cross-cutting-quickview-news-liveasof.md` (Section 3.2-3.3)

[3/25/26 5:57 PM] Upwork Ikenna: Where the UI is doing static views, that's not a backend integration. That's a UI functionality that needs to improve, right? Whereas fake data, yeah, that's a mock source versus reality. Make sure that frees through every single tab where it logically wouldn't, like maybe the trading terminal to trade in the past; in that way it is potentially a bit weird. I don't really know what that means.

From an audit perspective you don't want to be booking trades historically like real trades anyway, right? You want trades to happen when you click it for a fake trade that we want to, for whatever reason, stick into a back test. It doesn't really make sense to do it through this UI anyway because that should just be programmatic. If for whatever reason we want to stick in a massive trade then just programme that into the back test scenario. You won't be able to follow a back test in real time anyway, maybe one day but I don't know if that's necessary, but it is not useful for now.

---

### Message 13 — DeFi Ops & Combo Builder

**→ Captured in:** `docs/platform review/trading-defi-ops-combo-builder.md` (All sections)

[3/25/26 6:05 PM] Upwork Ikenna: There are two distinctions that we can do in DeFi Ops:

1. Atomic bundle in itself is a specific type of DeFi Ops.
2. Separately you've got Combo Builder.
   Atomic's bundle builder is atomic because it's a combo and the combos are inherently atomic if they're exchange-traded instruments but this is basically just a combo creation thing, right? So

Yeah I think it's fine to split combos by theme:

- DeFi options and futures
- spot (you don't have combos anyway)
  Then for sports you can do accumulators. A sports accumulator is effectively a combo. All things need to happen for you to make money and that's cool for a user. It's also useful for us if we have predictions across multiple things eventually and we're like we want to do aggregators off of them. It's probably a human decision instantly but then we can start to see how those accumulators look versus other things. Streamlines the concept of combo: everything has it. You're less in category space and you're more in strategy space. Strategy type, or I don't know what you call the difference between DeFi sports and everything else basically, but like whatever you want to call that deviation. Those three tabs at the top give you an idea of where you are in those areas and then once you're there you're entering into the details.

---

### Message 14 — Asset-Class Navigation Restructure + FOMO + Strategy Families

**→ Captured in:** `docs/platform review/trading-asset-class-navigation.md` (Sections 2-6)

I mean to be honest you might even just have that be the top right, like:

- Predictions
- Sports
- Options and Futures
- DeFi ops
- and nothing else
  at the top. Once you're in there, because DeFi guy wants to click on DeFi and not be worried about anything else, you can start restricting tabs a lot but it just becomes messy. There's a lot of extra information now you can do at the top for FOMO but this is now extreme; DeFi guy can see options and futures in sports and just not be able to click on it under a lock. That's the FOMO but once he's on DeFi he sees the concept of:
- bundles
- instruments
- predictions
- instructions
- all those alerts
- book trade accounts
- piano breakdown
  and then sports sees the same and options and futures sees the same. For the most part if you're in an option strategy you're in an option strategy. You're not worried about sports at the same time. There's no options for sports and there's no options for DeFi so you're in one group.
  Beyond that you still have the filters so you still have the organisational client and the fact that you can only see certain strategies for your particular strategy family, but I guess that's one word for it, right, strategy family or group. Categories remain what categories are called, which is like our own internal version of things which needs to map but clients don't really need to see that. They just need to see what's commercially most relevant to what they're trying to achieve, which is probably the strategy family as opposed to the other stuff.

---

## Structured Docs Created

| Doc                                          | File                                                   | Covers Messages                                                                                        |
| -------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Research/Build Enhancements                  | `research-build-enhancements.md`                       | 1 (grid search, features, comparison, execution, correlation)                                          |
| Sports & Predictions                         | `trading-sports-predictions.md`                        | 3, 4 (fixtures, arb grid, Polymarket, historical replay, arb streaming)                                |
| Accounts, Risk, P&L, Reconciliation          | `trading-accounts-risk-pnl-reconciliation.md`          | 7, 10 (accounts time series, Greeks, scenario analysis, position health, trade matching, P&L residual) |
| DeFi Ops & Combo Builder                     | `trading-defi-ops-combo-builder.md`                    | 13 (atomic bundles, combo builder, accumulators)                                                       |
| Asset-Class Navigation                       | `trading-asset-class-navigation.md`                    | 2 (graduation), 8 (dots), 9 (too many tabs), 14 (restructure, FOMO, filters)                           |
| Cross-Cutting (Quick View, News, Live/As-Of) | `cross-cutting-quickview-news-liveasof.md`             | 5, 6, 11, 12 (quick view, news categories, live vs as-of, static vs mock)                              |
| Promote Lifecycle (pre-existing)             | `../promote lifecycle tab/PROMOTE_LIFECYCLE_DESIGN.md` | 2 (promote portion — already in progress)                                                              |
