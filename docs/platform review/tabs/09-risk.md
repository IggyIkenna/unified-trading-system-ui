# Tab: Risk

**Route:** `/services/trading/risk`
**Page file:** `app/(platform)/services/trading/risk/page.tsx`
**Lines:** 2,764 | **Status:** Full implementation — largest page in the terminal

---

## Current State

Comprehensive risk management dashboard. The most complete risk view in the platform.

**What it renders:**

- Risk limits with `LimitBar` visualisations (per-strategy, per-venue, per-asset-class)
- VaR (Value at Risk) and CVaR summary cards
- Greeks: per-strategy and portfolio-level delta, gamma, vega, theta
- `DynamicCorrelationHeatmap` (lazy-loaded) — strategy correlation matrix
- Stress scenarios with sliders — shock price/vol and see P&L impact
- Regime analysis — which market regime we're in
- Venue circuit breakers: enable/disable per venue with `useCircuitBreakerMutation`
- Kill switch: emergency portfolio halt with `useKillSwitchMutation`
- Portfolio Greeks summary

**Data sources:** `useRiskLimits`, `useVaR`, `useGreeks`, `useStressScenarios`, `useVarSummary`, `useStressTest`, `useRegime`, `usePortfolioGreeks`, `useVenueCircuitBreakers`, `useCircuitBreakerMutation`, `useKillSwitchMutation`, `useGlobalScope`, `apiFetch` for some actions

**Filtering/scoping:** Global scope used where relevant across the large file.

---

## Meeting Review Items

From `trading-accounts-risk-pnl-reconciliation.md`:

- **Greeks missing from Risk:** Greeks are mentioned as missing — but the page actually HAS Greeks (`useGreeks`, `usePortfolioGreeks`). What may be missing is **extending beyond Greeks** to broader risk exposures.
- **Basis, carry, funding as risk metrics:** These P&L attribution components are also risk exposures. Should be visible here in risk framing (not just in P&L Breakdown).
- **Scenario analysis — Deribit-style:** The stress sliders already exist. Needs enhancement: at least 5 steps each direction for price and vol, a P&L/Greeks grid at each combination, and a **liquidation distance indicator** — when the slider crosses the liquidation threshold, show a visual warning.
- **Cross-section vs time series:** Both views needed for risk metrics (see what risk looks like now vs how it evolved).

---

## Improvements Needed

1. **Scenario analysis enhancement:** Current stress sliders are basic. Upgrade to:
   - At least 5 price steps up/down and 5 vol steps up/down
   - A combinatorial grid view (price × vol matrix) showing P&L at each node
   - Liquidation distance: as the slider moves, show "X% away from liquidation" and flash a warning when threshold is crossed
   - Asset-class-specific shocks: spread shocks for basis trades, funding rate shocks for perps, DeFi protocol-specific shocks
2. **Extended risk exposures (beyond Greeks):** Add:
   - Basis exposure (spread between correlated instruments)
   - Carry exposure (cost/benefit of holding positions)
   - Funding rate exposure (for perpetual swaps)
   - These mirror the P&L attribution components from the P&L page, shown in risk framing
3. **Liquidation distance metric:** Standalone card showing: for the current portfolio, how far (in %) from any venue's liquidation price. Drill down per position.
4. **Cross-section vs time series toggle:** Like the P&L page — show risk metrics as a snapshot (cross-section) or how they evolved over time.
5. **Historical what-if:** "I made this P&L but I was 1% away from liquidation at date X" — use the as-of data source to show historical risk snapshots.
6. **Monte Carlo:** The Promote tab has a Monte Carlo panel — consider showing live portfolio Monte Carlo here too (1,000-path simulation, probability of loss > X% in next 30 days).

---

## Asset-Class Relevance

**Common** — risk management spans all asset classes. Some risk metrics are asset-class specific:

- **CeFi/DeFi:** Liquidation price (margin-based), funding rate exposure
- **DeFi:** Liquidation health factor (Aave-style), smart contract risk, gas cost sensitivity
- **TradFi Options:** Full Greeks suite (delta, gamma, vega, theta, rho, vanna, volga)
- **Sports+Predictions:** Settlement risk, counterparty risk (bookmaker default), event outcome risk
  These should appear conditionally based on portfolio composition.

---

## Action

**Enhance** — strong foundation. Priority improvements: Deribit-style scenario grid with liquidation indicator, extended risk exposures (basis/carry/funding), historical risk snapshots via as-of mode.
