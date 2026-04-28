# Reference — Ideal-World Trader Archetypes

This folder contains **ideal-world** reference profiles of trader and stakeholder archetypes you'd find on the trading floor of a top-5 global trading firm. Each doc describes the trader's mental model, physical setup, and the four-phase workflow (Decide → Enter → Hold → Learn) with the tools, surfaces, and principles their terminal must support.

These docs deliberately **avoid any reference to the current platform**. They describe the world we are aiming at, so we can later compare our system against a clear yardstick.

---

## How to Use This Folder

1. **Start with [manual-trader-workflow.md](manual-trader-workflow.md)** — the four-phase workflow that all archetype docs build on.
2. **Read the archetypes relevant to a feature or evaluation.** Each archetype doc walks through the same four phases, so they're cross-comparable.
3. **When evaluating any UI surface**, walk through one or more archetypes' four phases and ask: are the tools listed available? Are the layout and cross-cutting principles upheld? Gaps should be **known**, not **accidental**.

---

## Foundation

| Doc                                                    | What it covers                                                                                                                                      |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| [manual-trader-workflow.md](manual-trader-workflow.md) | The four-phase trader workflow (Decide / Enter / Hold / Learn) and the cross-cutting principles every trading UI must respect. **Read this first.** |

---

## Cross-Archetype Trackers

Concise, link-driven indexes that synthesize across all 15 archetypes — useful when scoping a feature or evaluating coverage of the platform.

| Doc                                | What it covers                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [common-tools.md](common-tools.md) | The shared platform surfaces every (or nearly every) archetype needs. ~30 surfaces. **The platform foundation.**   |
| [unique-tools.md](unique-tools.md) | Per-archetype specialized surfaces that don't generalize across the floor. **What each archetype needs uniquely.** |

---

## Crypto Desk

| Persona           | Role                                                                                    | Doc                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Marcus Vance**  | Senior CeFi crypto portfolio trader (Binance spot + perps + futures + options)          | [trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md)                   |
| **Julius Joseph** | Senior hybrid CeFi + DeFi strategies trader (multi-venue, multi-chain, on-chain native) | [trader-archetype-julius-hybrid.md](trader-archetype-julius-hybrid.md)               |
| **Quinn Park**    | Quant overseer running a fleet of automated strategies through their lifecycle          | [trader-archetype-quinn-quant-overseer.md](trader-archetype-quinn-quant-overseer.md) |
| **Mira Tanaka**   | Senior market maker, latency-obsessed, inventory-managed                                | [trader-archetype-mira-market-maker.md](trader-archetype-mira-market-maker.md)       |
| **Sasha Volkov**  | Senior options & volatility specialist, surface-driven, greeks-driven                   | [trader-archetype-sasha-options-vol.md](trader-archetype-sasha-options-vol.md)       |

---

## TradFi Desk

| Persona              | Role                                                                                          | Doc                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Henry Whitfield**  | Senior equity long/short PM, technology sector specialist, fundamentals + catalyst-driven     | [trader-archetype-henry-equity-long-short.md](trader-archetype-henry-equity-long-short.md) |
| **Ingrid Lindqvist** | Senior rates trader, G10 sovereigns + swaps, curve / DV01 / spread thinking                   | [trader-archetype-ingrid-rates.md](trader-archetype-ingrid-rates.md)                       |
| **Rafael Aguilar**   | Senior global macro PM, multi-asset, theme-driven, asymmetric expressions                     | [trader-archetype-rafael-global-macro.md](trader-archetype-rafael-global-macro.md)         |
| **Yuki Nakamura**    | Senior FX trader, G10 + EM, carry / fixing / NDF / session-aware                              | [trader-archetype-yuki-fx.md](trader-archetype-yuki-fx.md)                                 |
| **Theo Rasmussen**   | Senior energy trader, crude / products / natgas, calendar-spread / inventory / weather-driven | [trader-archetype-theo-energy.md](trader-archetype-theo-energy.md)                         |
| **Naomi Eberhardt**  | Senior event-driven / merger-arb trader, deal-as-object, regulatory + catalyst-driven         | [trader-archetype-naomi-event-driven.md](trader-archetype-naomi-event-driven.md)           |

---

## Event-Markets Desk

| Persona          | Role                                                                                                                                          | Doc                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Diego Moreno** | Senior live event trader — sports in-play (football, tennis, basketball) + horse racing; ladder / hedge / cross-book microstructure           | [trader-archetype-diego-live-event.md](trader-archetype-diego-live-event.md)               |
| **Aria Kapoor**  | Senior prediction-markets & event-research trader — Polymarket / Kalshi / Smarkets / Betfair; politics, econ data, geopolitics, tech, weather | [trader-archetype-aria-prediction-markets.md](trader-archetype-aria-prediction-markets.md) |

---

## Supervision & Client Side

| Persona         | Role                                                                                                                | Doc                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **David Reyes** | Portfolio Manager / Head of Risk — sits above the desk, allocates capital, sets limits, monitors aggregate exposure | [trader-archetype-david-pm-risk.md](trader-archetype-david-pm-risk.md)                 |
| **Elena Costa** | External client / institutional allocator — the opposite end of the platform from the traders                       | [trader-archetype-elena-external-client.md](trader-archetype-elena-external-client.md) |

---

## Quick Lookup — "Who do I read for…?"

| If you're designing…                              | Read primarily | Plus                                                                           |
| ------------------------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| A spot / perp execution surface                   | Marcus         | Mira (microstructure), Yuki (multi-LP)                                         |
| An options / vol surface                          | Sasha          | Marcus (delta hedging)                                                         |
| A multi-leg / cross-domain ticket                 | Julius         | Rafael (multi-asset), Naomi (pair)                                             |
| A positions blotter                               | Marcus         | Julius (unified CeFi+DeFi), Ingrid (DV01-bucketed), Yuki (currency-decomposed) |
| A risk panel                                      | David          | Marcus (per-trader), Sasha (greek-decomposed)                                  |
| A research / strategy lifecycle UI                | Quinn          | David (promotion gate)                                                         |
| A market-making / latency-critical UI             | Mira           | —                                                                              |
| Earnings / catalyst tooling                       | Henry          | Naomi (regulatory catalysts)                                                   |
| Yield-curve / spread visualization                | Ingrid         | Theo (forward curves)                                                          |
| Themes / cross-asset tracking                     | Rafael         | David (firm-level aggregation)                                                 |
| FX matrix / currency decomposition                | Yuki           | —                                                                              |
| Forward curves / inventory-driven flows           | Theo           | Ingrid (curve thinking)                                                        |
| Deal pipeline / regulatory tracking               | Naomi          | —                                                                              |
| Capital allocation / limits / firm-wide oversight | David          | Quinn (strategy-level)                                                         |
| In-play / live event trading (sports, racing)     | Diego          | Mira (microstructure parallel)                                                 |
| Prediction markets / event research / multi-venue | Aria           | Naomi (deal-as-object), Rafael (themes)                                        |
| Client-facing reporting & access                  | Elena          | David (institutional reports)                                                  |

---

## Cross-Cutting Themes Across Archetypes

Several principles show up in nearly every doc and are worth calling out at the index level:

1. **Phase-appropriate freshness.** Decide tolerates seconds; Enter/Hold demand sub-100ms; Learn is fine on minute-old data.
2. **First-class tagging at order time.** Strategy / theme / deal / pair / parent-trade tags must be applied at entry, not retroactively, or post-trade attribution is unreliable.
3. **Multi-leg native execution.** Almost every senior trader thinks in structures, not single instruments. Tickets must support atomic multi-leg.
4. **Risk in trader-native units.** $-notional alone is rarely the right unit — DV01 for rates, greeks for options, beta-adjusted for equities, currency-decomposed for FX, deal-break for event-driven.
5. **Calendar dominates planning.** Every desk has a calendar shape: earnings, FOMC, auctions, inventory releases, regulatory deadlines. The terminal must surface it.
6. **Hotkeys for action, mouse for analysis.** Universal across discretionary archetypes.
7. **Replay capability.** Post-trade review depends on reconstructing market + book state at a historical moment — at the resolution the trader operates at.
8. **Audit trails are non-negotiable.** Every parameter change, override, allocation, intervention, RFQ acceptance — timestamped and reasoned.
9. **Aggregation must drill down.** Every rolled-up number should be drillable to the source, with no loss of fidelity.
10. **Compliance / counterparty / venue / borrow are inline, not separate workflows.** The friction of pre-trade checks belongs in the ticket, not a sidecar tool.

---

## Status

All 15 archetype docs + workflow doc are complete as of writing. They are **reference material** — they don't change as the platform evolves. When the platform evolves, **comparison docs** (still to be written) will sit alongside these to record gaps, plans, and progress against the ideal.
