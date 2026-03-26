# Trading Terminal — DeFi Ops & Combo Builder

> **Source:** Platform review meeting 2026-03-25
> **Lifecycle stage:** Trading (`/services/trading/`)
> **Current tabs:** DeFi Ops (`/services/trading/defi`), Bundles (`/services/trading/bundles`)
> **Status:** Not started (Promote tab in progress first)

---

## 1. Two Distinct Concepts in DeFi Ops

**From meeting:**

> "There are two distinctions that we can do in DeFi Ops:
>
> 1. Atomic bundle in itself is a specific type of DeFi Ops.
> 2. Separately you've got Combo Builder."

> "Atomic's bundle builder is atomic because it's a combo and the combos are inherently atomic if they're exchange-traded instruments but this is basically just a combo creation thing."

**What this means:**

- **Atomic Bundles (DeFi-specific):** Transactions that must execute atomically on-chain (all-or-nothing). This is a DeFi-native concept — flash loans, multi-step DeFi operations bundled into a single transaction.
- **Combo Builder (cross-asset):** A general combo/multi-leg trade builder. Combos exist across all asset classes — they just look different per asset class.

These are related but distinct: atomic bundles are a DeFi execution mechanism; combo builder is a product/strategy construction tool.

---

## 2. Combos Split by Theme (Asset Class)

**From meeting:**

> "I think it's fine to split combos by theme:
>
> - DeFi options and futures
> - Spot (you don't have combos anyway)
>   Then for sports you can do accumulators. A sports accumulator is effectively a combo. All things need to happen for you to make money."

> "Streamlines the concept of combo: everything has it. You're less in category space and you're more in strategy space."

**Combo types by asset class:**

| Asset Class       | Combo Type                          | Example                                        |
| ----------------- | ----------------------------------- | ---------------------------------------------- |
| DeFi              | Atomic bundles, multi-step DeFi ops | Flash loan + swap + repay in one tx            |
| Options & Futures | Multi-leg option strategies         | Straddle, strangle, butterfly, calendar spread |
| Sports            | Accumulators                        | Multi-match parlay (all must win)              |
| Predictions       | Multi-outcome bets                  | Combined prediction market positions           |
| Spot              | N/A (no combos for spot)            | —                                              |

**Key insight:** The combo builder is a **unified concept** — every asset class has its version of "combine multiple things into one trade." The UI should reflect this by having one combo builder framework that adapts per asset class, not separate combo builders per asset class.

---

## 3. Combo Builder as Strategy-Level Concept

> "It's also useful for us if we have predictions across multiple things eventually and we're like we want to do aggregators off of them. It's probably a human decision instantly but then we can start to see how those accumulators look versus other things."

**What this means:**

- Combos aren't just execution — they're a strategy building block
- The combo builder feeds into the research/strategy pipeline too
- Users can create combos, test their historical performance, and then promote them like any other strategy
- ODUM internally can also use combos for their own trading (aggregators across predictions)

---

## 4. Relationship to Current Tabs

Currently the Trading terminal has:

- **DeFi Ops** (`/services/trading/defi`) — exists, needs the atomic bundle builder
- **Bundles** (`/services/trading/bundles`) — exists, this is the general combo/bundle tab

**After this enhancement:**

- DeFi Ops keeps its DeFi-specific tools (atomic bundles, DeFi instructions)
- Bundles tab becomes the cross-asset combo builder
- The combo builder within Bundles adapts its UI based on which asset class group the user is in (see asset-class navigation doc)

---

## Open Questions

- [ ] Should atomic bundles have their own sub-tab within DeFi Ops, or is the entire DeFi Ops tab the atomic bundle builder?
- [ ] How does the combo builder integrate with the research pipeline? (Can a user create a combo and immediately backtest it?)
- [ ] For sports accumulators — do we need real-time combined odds calculation in the UI?
- [ ] Does "Bundles" get renamed to "Combos" or "Combo Builder" for clarity?
