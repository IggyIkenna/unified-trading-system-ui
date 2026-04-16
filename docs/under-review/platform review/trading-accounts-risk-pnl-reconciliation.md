# Trading Terminal — Accounts, Positions, Risk, P&L & Reconciliation Enhancements

> **Source:** Platform review meeting 2026-03-25
> **Lifecycle stage:** Trading (`/services/trading/`)
> **Current tabs:** Accounts, Positions, Risk, P&L Breakdown, Orders
> **Status:** Not started (Promote tab in progress first)

---

## 1. Accounts Tab Enhancements

**From meeting:**

> "Accounts need to definitely filter by clients and filter by venues. The actual account. Filtering by clients and filtering by venues makes sense but I think there's no time series. You want to have time series here as well so we can plot not just snapshots."

> "So we can pretty much borrow time series concepts from positions for the accounts tab as well. Accounts tab effectively is also acting as the positions tab and more generally just high level."

**What to build:**

- **Filters:** Filter by client, filter by venue
- **Time series:** Currently the accounts tab is snapshot-only — add time series charts (borrow the pattern from positions tab)
- The accounts tab serves as a high-level aggregated view that also encompasses position data
- Think of it as: Accounts = high-level portfolio view with time series; Positions = granular instrument-level detail

---

## 2. Missing Views — Trades, Orders, Greeks, Risk Exposures

**From meeting:**

> "Where do we see every single trade we've done? Where do we see every single order we've done? Where do we see our risk? We see our P&L breakdown by things but we don't see anywhere our actual Greeks and extending beyond Greeks."

**Gaps identified:**

| What's missing                     | Where it should live         | Notes                                  |
| ---------------------------------- | ---------------------------- | -------------------------------------- |
| Full trade blotter (every trade)   | Orders tab or new Trades tab | Every fill, every execution            |
| Full order blotter (every order)   | Orders tab                   | Every order placed (filled + unfilled) |
| Greeks (delta, gamma, vega, theta) | Risk tab                     | Currently missing from Risk            |
| Risk exposures beyond Greeks       | Risk tab                     | See Section 3 below                    |

---

## 3. Risk Tab — Major Enhancement

### 3.1 P&L Attribution Metrics Are Also Risk Metrics

**From meeting:**

> "Everything on P&L attribution is also a risk type, right? Basis is a risk type, carry is a risk type, funding is a risk type so that we can see our exposures in that area."

> Two options discussed:
>
> 1. "Change P&L breakdown to be cross-functional — see them from a risk perspective one view and see them from a P&L perspective one view"
> 2. "Have a separate tab which is risk, which effectively shows all the same shit but it's just risk versions of the cross section and the time series"

**Decision needed:** Option 1 (cross-functional toggle on P&L tab) or Option 2 (separate risk tab with same metrics in risk framing). Both were discussed — the meeting leaned towards having both views available.

**Risk metrics to add:**

- Greeks: delta, gamma, vega, theta (and higher-order)
- Basis exposure
- Carry exposure
- Funding rate exposure
- Cross-section view (snapshot across all positions/strategies)
- Time series view (how risk metrics evolved over time)

### 3.2 Scenario Analysis (Inspired by Deribit)

**From meeting:**

> "We need something where we can do scenario analysis. We need a user to be able to define some stuff... We need some ability to see what happens if you drop down 10% and you shift vol up 10%."

> "Deribit has a really cool scenario functionality — once you can do it for options you can do it for everything because you've already covered the most complex versions."

> "Move it up, move it down with a slider, and I'm going to keep seeing my P&L and Greeks and how my portfolio Greeks and position look at that particular snapshot."

**What to build — Scenario Analysis Panel:**

- **Sliders for market shocks:**
  - Underlying price: up/down (at least 5 increments each direction)
  - Volatility: up/down (at least 5 increments each direction)
  - Spreads (for basis trades): widen/narrow
  - Time (theta decay): forward N days
- **Combinatorial grid:** price × vol matrix showing P&L at each combination
  - Keep it manageable — ~5 steps each direction, not infinite combinations
- **Output at each grid point:**
  - P&L (mark-to-market change)
  - Updated Greeks
  - Updated position sizes
  - **Liquidation indicator:** if you slide too far, show "you've hit liquidation" — the point at which the portfolio would be margin-called
- **Historical what-if:** "I made money, but I was 1% move away from liquidation" — the slider shows how close you were to the edge at any historical point
- Data will be read from a database (pre-computed or on-demand), not real-time calculation in the browser
- Start with generic shock types (price, vol, spreads, time) — fixed scenarios first, then customisable

**For different asset classes:**

- **Options:** full Greeks shock (delta, gamma, vega, theta) — most complex, covers everything
- **Basis/carry trades:** spread shocks (basis widens/narrows)
- **Spot/perps:** price + funding rate shocks
- **Sports:** less relevant for scenario analysis

### 3.3 Liquidation Distance

> "The kind of generic 'you would hit liquidation' could be part of the risk. You keep sliding; you keep sliding. If you go too far, it's like you've hit liquidation."

**What to build:**

- Liquidation distance metric per position and per portfolio
- Visual indicator: how far from liquidation in % terms
- Integrated into the scenario slider — when the slider crosses the liquidation threshold, visual warning

---

## 4. Position Health & Quick Reconciliation

**From meeting:**

> "If, for example, in the position tab health, it said 'health is reconciled', does that mean that the position that we're showing is the same as what the exchange is showing? If it's not healthy then we can sort by health."

> "Once you see something's unhealthy, you want to then click on it and go to the quick reconcile tab, because it's going to be a frequent thing."

**What to build:**

### 4.1 Position Health Status

- Each position gets a health indicator: **Reconciled** (green) / **Unreconciled** (red) / **Pending** (amber)
- "Reconciled" means: our position matches what the exchange reports
- Sortable/filterable by health status
- Alerts also fire for unhealthy positions (separate from this UI)

### 4.2 Quick Reconcile Flow

- Click an unhealthy position → opens a quick reconcile view
- This is a **frequent workflow**, so it needs to be fast and accessible (not buried in menus)

### 4.3 Deep Dive — Trade Matching

> "If you do want to deep dive because you're like, I don't want to reconcile without figuring out what all the trades we did versus the exchange did..."

> "You can quickly click into that instrument. See all of the exchange trades in a list and see all of our own trades in a list and then you can just visually match them."

**Deep dive view (per instrument):**

- **Two columns:**
  - Left: Our trades (from our system)
  - Right: Exchange trades (from the venue)
- Algorithmic matching already exists in the backend reconciliation process
- Matched trades: green ✓
- Unmatched trade: highlighted red — this is what needs investigation
- **Beyond trades:** sometimes trades match but positions differ because of:
  - Staking rewards
  - Interest rate differences (debt interest ≠ projected)
  - Exchange gave a position without a corresponding fill
  - OTC trades that exist intentionally

---

## 5. P&L Reconciliation — Unexplained Residual

**From meeting:**

> "P&L reconciliation. The P&L attribution tab breakdown tab is trying to explain our P&L in as perfect a way as possible but obviously it's going to miss something."

> "There should be an unreconciled — or better word for the residual that already exists — so unexplained is there and then we just need alerts based on our residual being too high because something's a bit wrong if that's explaining half of our P&L."

**What to build:**

- The P&L attribution already has an "unexplained" residual — this is confirmed to exist
- **Add:** Alert threshold on the unexplained residual — if it exceeds X% of total P&L, fire an alert
- The unexplained component captures: fee differences, unmodeled costs, rounding, data timing mismatches
- Half of P&L being unexplained = something is broken → needs investigation alert

---

## Open Questions

- [ ] Option 1 or Option 2 for Risk vs P&L views? (cross-functional toggle vs separate tab)
- [ ] Scenario analysis — pre-computed grids vs on-demand API calculation?
- [ ] Quick reconcile — does this warrant its own sub-tab or is it a modal/drawer within positions?
- [ ] What % threshold for unexplained P&L residual alerts? (5%? 10%? Configurable?)
- [ ] Trade matching UI — do we need export/download for audit purposes?
