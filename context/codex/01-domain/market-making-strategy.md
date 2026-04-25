# Market Making Strategy

## Overview

This document defines the market making strategy framework for the unified trading system. It covers bid/ask spread
determination, quote refresh policies, inventory management, position limits, rebalancing strategies, and multi-venue
quoting.

---

## Bid/Ask Spread Strategy

### Spread Width Determination

**Key insight:** Spread width driven by volatility, Greeks, and underlying price movements (not a single fixed method)

#### Factors Influencing Spread Width

1. **Volatility-based adjustment:**
   - Higher volatility → Wider spread (to account for adverse selection risk)
   - Lower volatility → Tighter spread (more competitive)
   - Source: Real-time volatility (from volatility surface or realized vol)

2. **Greeks-based adjustment:**
   - High gamma → Widen spread (delta changes quickly)
   - High vega → Widen spread (volatility risk)
   - **From Strategy Layer:** Strategy computes optimal spread based on Greeks exposure

3. **Underlying price movement:**
   - Large underlying move → Recalculate option price, adjust quotes
   - Example: BTC moves $500 → Option delta changes → Reprice options

4. **Orderbook-based adjustment:**
   - Match or improve best bid/ask
   - **Competitive quoting:** Stay inside top-of-book to capture fills

### Spread Width Calculation (Strategy Layer)

**Strategy responsibilities:**

1. Fetch current volatility surface (or realized vol)
2. Calculate Greeks for quoted instruments
3. Determine optimal spread width:
   - Base spread: Function of volatility
   - Adjust for Greeks exposure (gamma, vega)
   - Adjust for inventory (see inventory skew below)
4. Send spread width to execution layer

**Example calculation:**

```python
def calculate_spread_width(volatility, gamma, inventory_ratio):
    base_spread_bps = volatility * 100  # 20% vol → 20 bps base spread
    gamma_adjustment = gamma * 0.01     # Wider spread if high gamma
    inventory_skew = inventory_ratio * 5  # Wider if inventory imbalanced
    return base_spread_bps + gamma_adjustment + inventory_skew
```

### Execution Layer Responsibilities

- Receive spread width from strategy
- Place limit orders at:
  - Bid: `mid_price - spread_width / 2`
  - Ask: `mid_price + spread_width / 2`
- Monitor for fills, update Position Monitor

---

## Quote Refresh Frequency

### Time, Event, and Price-Driven Updates

**Multi-trigger approach:** Refresh quotes based on time, market events, and price movements

#### Trigger 1: Time-Based (Periodic)

- **Interval:** Every 5-30 seconds (configurable per instrument)
- **Use case:** Ensure quotes stay competitive even if market is quiet
- **Mechanism:** Cancel existing quotes, recalculate spread, place new orders

#### Trigger 2: Event-Driven (Underlying Move)

- **Threshold:** Underlying price moves > X% (e.g., 0.5% for BTC)
- **Use case:** Adjust option quotes when underlying moves significantly
- **Mechanism:**
  1. Detect underlying price change via WebSocket
  2. Recalculate option theoretical price (delta impact)
  3. Cancel stale quotes, place new quotes

#### Trigger 3: Price-Driven (Strategy Updates Pricing)

- **Trigger:** Strategy layer pushes new theoretical price
- **Sources of repricing:**
  - Volatility surface update
  - Greeks recalculation (gamma, vega)
  - Time decay (theta)
- **Mechanism:**
  1. Strategy publishes new theoretical price to execution
  2. Execution cancels stale quotes, places new quotes

#### Update Throttling

**Minimum update threshold:** Prevent excessive quote churn

- Only update if new theoretical price differs by **≥ X% of premium**
- Example: For $100 option, only update if price changes by ≥ $1 (1%)
- **Rationale:** Avoid rate limits, reduce exchange fees (cancel/replace costs)

**Implementation:**

```python
def should_update_quote(old_price, new_price, threshold_pct=0.01):
    price_change_pct = abs(new_price - old_price) / old_price
    return price_change_pct >= threshold_pct
```

---

## Inventory Skew

### Correlation Model with Greeks

**Key principle:** Adjust quotes based on correlated exposure across instruments

#### Step 1: Calculate Exposure Per Greek

For each position:

- **Delta exposure:** Position size × delta × underlying price
- **Vega exposure:** Position size × vega
- **Gamma exposure:** Position size × gamma × underlying price

#### Step 2: Correlate Across Instruments

**Correlation sources:**

- Historical price correlation (BTC/ETH ≈ 0.75-0.85)
- Implied correlation (from options data)
- **Manual overrides** for known relationships

**Example:**

- Long 10 BTC calls: Delta exposure = $500k
- Short 20 ETH calls: Delta exposure = -$200k
- **Uncorrelated:** Net delta = $300k
- **Correlated (0.8):** Net delta ≈ $340k (accounting for co-movement)

#### Step 3: Net Correlated Exposure

Sum exposures across all instruments, weighted by correlation:

```python
def net_correlated_exposure(positions, correlation_matrix, greek="delta"):
    exposures = np.array([pos.get_exposure(greek) for pos in positions])
    net_exposure = exposures.T @ correlation_matrix @ exposures
    return net_exposure
```

#### Step 4: Adjust Quotes (Linear or Nonlinear)

**Strategy decides adjustment model:**

##### Linear Adjustment

- Proportional to net exposure
- Example: If net delta = 50% of limit → Widen bid by 5%, narrow ask by 5%

```python
def linear_inventory_skew(net_delta, max_delta, base_spread_bps):
    skew_ratio = net_delta / max_delta
    bid_adjust_bps = base_spread_bps * skew_ratio * 0.1  # 10% adjustment
    ask_adjust_bps = -base_spread_bps * skew_ratio * 0.1
    return bid_adjust_bps, ask_adjust_bps
```

##### Nonlinear Adjustment

- Exponential increase near position limits
- Example: If net delta = 90% of limit → Widen bid by 30%, stop quoting ask

```python
def nonlinear_inventory_skew(net_delta, max_delta, base_spread_bps):
    skew_ratio = net_delta / max_delta
    if abs(skew_ratio) > 0.9:
        # Aggressive skew near limits
        bid_adjust_bps = base_spread_bps * skew_ratio * 0.5
        ask_adjust_bps = -base_spread_bps * skew_ratio * 0.5
    else:
        # Moderate skew
        bid_adjust_bps = base_spread_bps * skew_ratio * 0.1
        ask_adjust_bps = -base_spread_bps * skew_ratio * 0.1
    return bid_adjust_bps, ask_adjust_bps
```

**Model source:**

- **Strategy Layer:** Computes adjustment model
- **May query:** Exposure Monitor or Risk Monitor for current exposure
- **Sends to Execution:** Adjusted bid/ask prices

---

## Position Limits

### All Limits: Instrument, Notional, and Risk

#### Instrument-Level Limits

**Max inventory per instrument:**

```yaml
position_limits:
  BTC-PERP:
    max_long: 10 BTC
    max_short: -10 BTC
  ETH-50000-C:
    max_long: 50 contracts
    max_short: -50 contracts
```

**Enforcement:**

- Check before placing quote
- If at limit → Only quote on opposite side (e.g., if max long, only quote bid to reduce position)

#### Notional Limits

**Max notional across portfolio:**

```yaml
portfolio_limits:
  max_notional: 5000000 # $5M total notional exposure
```

**Calculation:**

Sum of `|position_size × current_price|` across all instruments

**Enforcement:**

- Aggregate notional across all positions
- If approaching limit → Reduce quote sizes or stop quoting

#### Risk Limits (Greeks)

**Max delta, vega, gamma notionals:**

```yaml
portfolio_limits:
  max_delta_notional: 2000000 # $2M net delta
  max_vega_notional: 500000 # $500k vega
  max_gamma_notional: 1000000 # $1M gamma
```

**Enforcement:**

- Use correlated Greeks (see inventory skew section)
- If net delta > 90% of limit → Stop quoting ask (or bid, depending on sign)
- **Risk Monitor:** Publishes alerts if limits exceeded

---

## Inventory Rebalancing

### Aggressiveness Set by Strategy, Execute Until Inside Limits

**Key principle:** Strategy sets rebalancing aggressiveness, execution trades out excess inventory

#### Rebalancing Modes

##### Mode 1: Periodic Cross

- **When:** Every X hours (e.g., 4 hours) or end-of-day
- **Mechanism:** Execute offsetting trades at mid-price or better
- **Aggressiveness:** LOW (wait for good price)

##### Mode 2: Aggressive Hedging

- **When:** Limits exceeded
- **Mechanism:** Market orders to reduce inventory immediately
- **Aggressiveness:** HIGH (prioritize risk reduction over price)

##### Mode 3: Quote-Only Mode

- **When:** Near limits
- **Mechanism:** Stop quoting on one side (only quote to reduce inventory)
- **Aggressiveness:** MEDIUM (passive reduction via quoting)

#### Strategy Control

**Strategy sends rebalancing instruction:**

```json
{
  "rebalance_mode": "aggressive", // "periodic" | "aggressive" | "quote_only"
  "target_delta": 0.0, // Target net delta
  "urgency": "HIGH", // "LOW" | "MEDIUM" | "HIGH"
  "max_slippage_bps": 50 // Max acceptable slippage
}
```

**Execution executes until inside limits:**

```python
async def rebalance_inventory(target_delta, urgency):
    current_delta = get_net_delta()
    while abs(current_delta - target_delta) > tolerance:
        if urgency == "HIGH":
            await submit_market_order(hedge_instrument, -current_delta)
        else:
            await submit_limit_order(hedge_instrument, -current_delta, limit_price)
        current_delta = get_net_delta()
```

---

## Multi-Venue Quoting

### Configurable Per Strategy

**Key principle:** Strategy chooses single-venue or multi-venue based on liquidity and risk tolerance

#### Single-Venue (Simpler, Lower Risk)

**When to use:**

- Illiquid instruments (low volume, wide spreads)
- High latency sensitivity (avoid cross-venue arbitrage)
- **Lower complexity:** No cross-venue position tracking

**Mechanism:**

- Quote on single exchange per instrument
- Example: Quote BTC-PERP only on Binance

#### Multi-Venue (Higher Fill Rate, Cross-Venue Risk)

**When to use:**

- Liquid instruments (BTC, ETH spot/perps)
- Want to capture fills from multiple venues
- **Higher fill rate:** More opportunities

**Mechanism:**

- Quote same instrument on 2+ venues simultaneously
- Example: Quote BTC-PERP on Binance, OKX, Bybit
- **Risk:** Cross-venue inventory imbalance (long on Binance, short on OKX)

**Cross-venue position tracking:**

- Position Monitor tracks per-venue positions
- **Net position:** Sum across all venues
- **Venue-specific limits:** Avoid concentration on single exchange

#### Depends on Liquidity (Hybrid)

**Strategy decides dynamically:**

- If `daily_volume > $10M` → Multi-venue
- If `daily_volume < $1M` → Single-venue
- **Adaptive:** Switch based on market conditions

---

## Asset Class Prioritization

### Phase 1: Options, Perps, Sports

**Initial implementation focuses on:**

1. **Options:** Volatility spread capture (highest margin potential)
2. **Perps:** Funding rate capture + market making
3. **Sports:** Betting markets (existing arbitrage code)

**Rationale:**

- **Options:** Highest complexity, highest edge potential
- **Perps:** Established markets, reliable liquidity
- **Sports:** Existing infrastructure, quick win

### Future: Spot Crypto, Futures

- **Spot crypto:** Lower margin, higher volume (deferred to Phase 2)
- **Futures:** TradFi futures (CME, ICE) when TradFi strategies prioritized

---

## Market Making Workflow

### End-to-End Execution Flow

#### 1. Strategy Layer: Compute Pricing and Spread

```python
# Strategy service
theoretical_price = calculate_option_price(underlying, strike, expiry, vol)
spread_width = calculate_spread_width(vol, gamma, inventory_ratio)
bid_price = theoretical_price - spread_width / 2
ask_price = theoretical_price + spread_width / 2
```

#### 2. Strategy → Execution: Send Quoting Instruction

```json
{
  "strategy": "vol_market_making_btc",
  "instrument": "BTC-50000-C-20260331",
  "bid_price": 4950,
  "ask_price": 5050,
  "bid_size": 5,
  "ask_size": 5,
  "refresh_triggers": {
    "time_interval_sec": 30,
    "underlying_move_pct": 0.5,
    "price_update_threshold_pct": 1.0
  }
}
```

#### 3. Execution Layer: Place Quotes

```python
# Execution service
await place_limit_order("BTC-50000-C-20260331", "BUY", 5, 4950)
await place_limit_order("BTC-50000-C-20260331", "SELL", 5, 5050)
```

#### 4. Execution → Position Monitor: Report Fills

```python
# On fill
fill_event = {
    "instrument": "BTC-50000-C-20260331",
    "side": "BUY",
    "quantity": 5,
    "fill_price": 4950,
    "timestamp": "2026-02-12T10:30:45.123Z"
}
await position_monitor.publish_fill(fill_event)
```

#### 5. Position Monitor: Update Greeks, Check Limits

```python
# Position Monitor
positions = get_all_positions()
net_delta = calculate_net_correlated_delta(positions)
if net_delta > max_delta:
    await risk_monitor.alert("DELTA_LIMIT_EXCEEDED", net_delta)
```

#### 6. Strategy: Decide Rebalancing Action

```python
# Strategy receives limit alert
if net_delta > 0.9 * max_delta:
    rebalance_instruction = {
        "action": "REBALANCE",
        "target_delta": 0.0,
        "urgency": "HIGH"
    }
    await execution_service.submit_instruction(rebalance_instruction)
```

---

## Configuration Example

```yaml
market_making:
  spread_strategy:
    factors:
      - volatility # Primary driver
      - greeks # Gamma, vega adjustments
      - underlying_move # BTC/ETH price changes
      - orderbook # Competitive quoting
    throttle:
      min_price_change_pct: 1.0 # Only update if price moves ≥1%

  quote_refresh:
    time_interval_sec: 30
    underlying_move_threshold_pct: 0.5
    strategy_repricing: true # Strategy pushes new prices

  inventory_skew:
    model: nonlinear # "linear" | "nonlinear"
    correlation_source: historical_30d
    adjustment_max_pct: 50 # Max 50% spread adjustment

  position_limits:
    instrument_limits:
      BTC-PERP:
        max_long: 10
        max_short: -10
    portfolio_limits:
      max_notional: 5000000
      max_delta_notional: 2000000
      max_vega_notional: 500000

  rebalancing:
    mode: strategy_controlled
    urgency: HIGH # When limits exceeded
    max_slippage_bps: 50

  venues:
    mode: configurable # Strategy chooses per instrument
    liquidity_threshold: 10000000 # Multi-venue if volume > $10M

  asset_groupes:
    priority:
      - options
      - perps
      - sports
```

---

## Integration with Other Services

### Position Monitor

- **Publishes:** Real-time fills, position updates, Greeks
- **Subscribes to:** Market making quotes, rebalancing trades

### Risk Monitor

- **Checks:** Position limits, Greeks limits
- **Alerts:** MEDIUM/HIGH severity if limits exceeded

### Exposure Monitor

- **Normalizes:** Net exposure across instruments
- **Publishes:** Correlated Greeks to Strategy and Risk Monitor

### PnL Attribution

- **Tracks:** Market making PnL by instrument, venue, strategy
- **Breakdown:** Bid-ask spread capture, inventory PnL, Greeks PnL

---

## References

- **Options Pricing:** `01-domain/options-volatility-and-pricing.md`
- **Multi-Leg Execution:** `01-domain/options-multi-leg-execution.md`
- **Position Monitor:** `11-project-management/feature-request-cards-wave-1.md` (Epic #10)
- **Risk Monitor:** `11-project-management/feature-request-cards-wave-1.md` (Epic #11)
- **Exposure Monitor:** `11-project-management/feature-request-cards-wave-1.md` (Epic #14)

---

## Implementation Phases

### Phase 1: Basic Market Making (Q2 2026)

- Options market making (BTC, ETH)
- Time-based quote refresh
- Single-venue quoting
- Linear inventory skew

### Phase 2: Advanced Pricing (Q3 2026)

- Event-driven quote refresh (underlying moves)
- Price-driven updates (strategy repricing)
- Nonlinear inventory skew
- Correlation-based Greeks netting

### Phase 3: Multi-Venue & Rebalancing (Q3 2026)

- Multi-venue quoting
- Cross-venue position tracking
- Aggressive rebalancing when limits exceeded

### Phase 4: Perps & Sports (Q4 2026)

- Perps market making (funding rate strategies)
- Sports betting market making (Betfair, Pinnacle)
- Cross-asset class inventory management
