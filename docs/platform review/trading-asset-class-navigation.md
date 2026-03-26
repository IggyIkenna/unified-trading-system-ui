# Trading Terminal — Asset-Class Navigation Restructure

> **Source:** Platform review meeting 2026-03-25
> **Lifecycle stage:** Trading (`/services/trading/`)
> **Scope:** Service-level tabs within the Trading terminal (NOT the top-level lifecycle nav)
> **Status:** Idea phase — needs further discussion

---

## 1. The Problem

**Current state:** The Trading terminal has 16 service tabs in a flat list:

> Overview, Terminal, DeFi Ops, Options & Futures, Sports, Predictions, Bundles, Instructions, Positions, Orders, Alerts, Book Trade, Accounts, P&L Breakdown, Risk, Markets

This is overwhelming — a DeFi user doesn't care about Sports, and an Options trader doesn't care about Predictions. Clients should see what's relevant to their subscription without being lost in tabs that don't apply.

**From meeting:**

> "Using the terminal for the first time and there's way too many tabs so you're like, 'There's gonna be, because it's complex.' You're like, 'Roughly where am I? What kind of? What's my starting point? What's my ending point?'"

---

## 2. Proposed Structure: Asset-Class Groups → Service Tabs

**From meeting:**

> "You might even just have that be the top right:
>
> - Predictions
> - Sports
> - Options and Futures
> - DeFi ops
> - and nothing else
>   at the top. Once you're in there, because DeFi guy wants to click on DeFi and not be worried about anything else."

**Two-tier navigation within Trading:**

### Tier 1: Asset-Class Group Tabs (top level within Trading)

| Group                 | What it covers                                      |
| --------------------- | --------------------------------------------------- |
| **Predictions**       | Polymarket, prediction markets, up/down instruments |
| **Sports**            | Football fixtures, bookmaker odds, sports arb       |
| **Options & Futures** | TradFi derivatives, crypto options, futures         |
| **DeFi Ops**          | On-chain DeFi: lending, LP, atomic bundles          |

### Tier 2: Service Tabs (within each asset-class group)

Once inside an asset-class group, the user sees familiar service tabs:

- Overview (specific to that asset class)
- Terminal (charts, orderbook, trading buttons)
- Combos/Bundles (adapted per asset class)
- Instruments
- Positions
- Orders
- Alerts
- Book Trade
- Accounts
- P&L Breakdown
- Markets (venues relevant to this asset class)

> "Once he's on DeFi he sees the concept of: bundles, instruments, predictions, instructions, all those alerts, book trade, accounts, P&L breakdown."

**Key insight:** Most service tabs are the **same concept** across asset classes — just with different data and possibly slightly different layouts. This is a data-scoping exercise more than a UI-building exercise for most tabs.

---

## 3. FOMO / Cross-Sell: Locked Tabs

**From meeting:**

> "There's a lot of extra information now you can do at the top for FOMO but this is now extreme; DeFi guy can see Options and Futures and Sports and just not be able to click on it under a lock. That's the FOMO."

**What this means:**

- Non-subscribed asset-class groups are visible but locked (lock icon, grayed out)
- This creates FOMO: "I can see Sports exists but I'd need to subscribe"
- Clicking a locked group could show a teaser or subscription prompt

---

## 4. Activity Dots (Workflow Stage Indicators)

**From meeting:**

> "Those little coloured dots, I guess, would be these: monitoring, trading, configuring, reconciliation, analysing"

> "Roughly where am I? What kind of? What's my starting point? What's my ending point and they all need to map to the dot."

**What this means:**

Each service tab maps to a workflow activity type, shown as a colored dot:

| Activity       | Color (TBD) | Example Tabs                 |
| -------------- | ----------- | ---------------------------- |
| Monitoring     | Blue?       | Overview, Alerts, Markets    |
| Trading        | Green?      | Terminal, Book Trade, Orders |
| Configuring    | Purple?     | Instructions, Bundles/Combos |
| Reconciliation | Amber?      | Accounts, Positions          |
| Analysing      | Cyan?       | P&L Breakdown, Risk          |

The dots help users orient: "Am I looking at something? Trading something? Configuring something? Checking my positions?"

---

## 5. Filters Still Apply Within Each Group

**From meeting:**

> "Beyond that you still have the filters so you still have the organisational client and the fact that you can only see certain strategies for your particular strategy family."

> "Categories remain what categories are called, which is our own internal version of things which needs to map but clients don't really need to see that. They just need to see what's commercially most relevant."

**What this means:**

- Within each asset-class group, existing filters remain: organisation, client, strategy family
- **Strategy family** (commercial label) is what clients see — not internal "categories"
- Internal categories map to strategy families but the mapping is ODUM-internal

---

## 6. How This Affects the Current Tabs

| Current Tab       | Where It Goes                                                |
| ----------------- | ------------------------------------------------------------ |
| Overview          | Each asset-class group gets its own overview                 |
| Terminal          | Shared component, scoped to asset class                      |
| DeFi Ops          | Becomes the DeFi asset-class group (top level)               |
| Options & Futures | Becomes the Options & Futures group (top level)              |
| Sports            | Becomes the Sports group (top level)                         |
| Predictions       | Becomes the Predictions group (top level)                    |
| Bundles           | Becomes "Combos" within each group (adapted per asset class) |
| Instructions      | Per-group where relevant                                     |
| Positions         | Shared tab within each group, data-scoped                    |
| Orders            | Shared tab within each group, data-scoped                    |
| Alerts            | Shared tab within each group, data-scoped                    |
| Book Trade        | Shared tab within each group                                 |
| Accounts          | Shared tab within each group, data-scoped                    |
| P&L Breakdown     | Shared tab within each group, data-scoped                    |
| Risk              | Shared tab within each group, data-scoped                    |
| Markets           | Shared tab within each group, showing relevant venues        |

---

## 7. Investment Management / Strategy Graduation (Related)

**From meeting:**

> "We're going to launch our strategies; they're all testing. After a minimum of a week, we call it graduated in our world, but after minimum a month, we called it graduated for the investment management offering."

> "The investment management candidate strategies would be potentially different from what's trading and would give us an ability to warehouse some early-stage models for our own testing."

**What this means for navigation:**

- ODUM sees all strategies including early-stage testing ones (unrestricted access)
- Clients see strategies only after they've "graduated" (minimum 1 month live track record)
- The graduation status is automatic — based on live duration, not manual promotion
- Client sees the same portal, same pretty graphs — just filtered to graduated strategies

This is an entitlement/data-scoping concern, not a UI structure change. The nav doesn't need to change for this — it's API-side filtering.

---

## Open Questions

- [ ] Is this a hard decision or still open for alternative approaches?
- [ ] Should there be an "All" or "Cross-Asset" group that shows everything for ODUM internal users?
- [ ] Does each asset-class group need its own URL prefix? (e.g., `/services/trading/defi/positions` vs `/services/trading/positions?group=defi`)
- [ ] How do cross-asset strategies (e.g., "ML Regime Switcher" that trades multiple asset classes) appear? Under which group?
- [ ] Color scheme for activity dots — align with existing platform color language?
- [ ] Mobile: how does two-tier tab navigation work on small screens?
