# API ↔ Frontend Gaps & Differentials

**This is a living document.** It tracks known differences between what the backend APIs provide and what the frontend expects. Use this to:

1. **Avoid building unsupported features** — if the gap is open, the API isn't ready
2. **Prioritize backend work** — see what APIs need enhancement
3. **Plan UI increments** — defer UI features that depend on missing APIs
4. **Feedback loop** — as you build the UI, discover new gaps and document them here

---

## How to Use This Document

### Finding Gaps

| By impact              | Look at   | Examples                                        |
| ---------------------- | --------- | ----------------------------------------------- |
| **High (blocker)**     | Section 1 | "Dashboard can't show real-time positions"      |
| **Medium (deferred)**  | Section 2 | "Risk alerts API supports email, not Slack yet" |
| **Low (nice-to-have)** | Section 3 | "Position history lacks trade attribution"      |

### Adding a Gap

When you discover an API shortfall while building UI:

1. **Create an issue** in the relevant backend service repo
2. **Add entry here** with:
   - What the UI needs
   - What the API currently provides
   - Why it matters (blocking, deferred, nice-to-have)
   - Suggested fix
3. **Link to the issue** so it stays tracked

### Resolving a Gap

When a backend team fixes an API:

1. **Update the status** (In Progress → Resolved)
2. **Update the UI plan** — now this feature can be built
3. **Date it** so we know when it was fixed

---

## 1. High-Impact Gaps (Blockers)

These gaps prevent major UI features from working. The UI team should **wait** or **defer** these features until resolved.

### Gap 1.1: Risk Dashboard Doesn't Have Per-Venue Risk Breakdown

**Blocking:** Risk UI can't show per-venue limits and utilization

**Current API behavior:**

- `GET /api/risk/limits` returns global shard limits only
- No per-venue breakdown
- Response:
  ```json
  {
    "shard": "CEFI",
    "max_daily_loss": 100000,
    "max_position_size": 0.05
  }
  ```

**What UI needs:**

- Per-venue limits (BINANCE max $2M, KRAKEN max $1.5M, etc.)
- Per-venue utilization (how close to limit)
- Response should be:
  ```json
  {
    "shard": "CEFI",
    "global_limits": { "max_daily_loss": 100000 },
    "venue_limits": {
      "BINANCE": { "max_position_usd": 2000000, "utilization_pct": 60 },
      "KRAKEN": { "max_position_usd": 1500000, "utilization_pct": 45 },
      "OTC": { "max_position_usd": 1500000, "utilization_pct": 0 }
    }
  }
  ```

**Status:** 🔴 **BLOCKED** — No API support yet

**Backend issue:** [risk-and-exposure-service#42](https://github.com/IggyIkenna/risk-and-exposure-service/issues/42) (example)

**Impact:** Risk dashboard can't show per-venue breakdown; UI will be less useful than it should be

**Workaround:** Show global limits only for now; defer per-venue breakdown to phase 2

**Suggested fix:** Extend `/api/risk/limits` to include `venue_limits` field

---

### Gap 1.2: Positions API Doesn't Include Cost Basis / Entry Price

**Blocking:** Position P&L calculation incomplete in UI

**Current API behavior:**

- `GET /api/positions` returns:
  ```json
  {
    "symbol": "BTC/USD",
    "side": "LONG",
    "quantity": 1.5,
    "current_price": 65000,
    "current_value": 97500,
    "unrealized_pnl": 2500,
    "venue": "BINANCE"
  }
  ```
- **Missing:** `entry_price`, `cost_basis`, `avg_entry`, `entry_time`

**What UI needs:**

- Entry price to show "bought at $64000, now $65000"
- Cost basis for tax reporting
- To calculate true position cost
- For position history / audit trail

**Status:** 🟡 **IN PROGRESS** — execution-service is adding this field in v0.2.0

**Estimated timeline:** 2 weeks

**Impact:** Position detail screens can't show entry price; UI shows only P&L

**Workaround:** Fetch entry price from execution history API separately (slow)

**Suggested fix:** Add `entry_price`, `cost_basis`, `entry_time`, `entry_qty` to positions response

---

### Gap 1.3: Execution History API Doesn't Support Date Range Filtering

**Blocking:** Large order histories are slow to load; UI becomes sluggish

**Current API behavior:**

- `GET /api/executions` returns all fills for symbol (no pagination on time)
- For active traders, this can be 1000s of records per day
- No date filtering, no limit parameter
- Response time: 30+ seconds for active traders

**What UI needs:**

- `?start_date=2026-03-01&end_date=2026-03-19` filtering
- `?limit=100&offset=0` pagination
- For "show fills in last 7 days" use case
- For "show fills on 2026-03-15" use case

**Status:** 🔴 **NOT STARTED** — execution-service hasn't prioritized

**Impact:** Order history UI will timeout or be unusably slow for active accounts

**Workaround:** Load first 100 records only; user can't see older fills without app restart

**Suggested fix:** Add date filtering and pagination to executions endpoint

---

### Gap 1.4: Strategy Configuration API Doesn't Support Partial Updates

**Blocking:** Can't update individual strategy config fields without redeploying

**Current API behavior:**

- `PUT /api/strategies/{id}/config` requires full config object
- If you want to change just one risk limit, must provide entire config
- Fragile — easy to accidentally overwrite other fields

**What UI needs:**

- `PATCH /api/strategies/{id}/config` with partial updates
- `PATCH /api/strategies/{id}/config/risk` to update just risk section
- Per-field validation errors, not whole-config rejection

**Status:** 🟡 **PLANNED** — strategy-service sprint #4

**Estimated timeline:** 3-4 weeks

**Impact:** Strategy config UI must use PUT not PATCH; harder to build intuitive update flows

**Workaround:** Fetch full config → modify → PUT back

**Suggested fix:** Support PATCH verb and partial updates with merge semantics

---

## 2. Medium-Impact Gaps (Deferred)

These gaps don't block core functionality, but they reduce UI quality or require workarounds. Build the UI anyway; these can be filled in later phases.

### Gap 2.1: Alert API Only Supports Email/SMS, Not Slack/PagerDuty

**Status:** 🟡 **IN PROGRESS** — alerting-service v0.2.0

**Current behavior:**

- Can create email-only alerts
- No Slack webhook support yet
- No PagerDuty integration

**What UI needs:**

- Alert notification channel selector (email, Slack, PagerDuty, SMS)
- Webhook URL input for Slack
- Service key input for PagerDuty

**Impact:** Alert UI will only show email option; less useful than intended

**Workaround:** Users create Slack webhooks manually and paste URLs in email (clunky)

**Suggested fix:** Add `notification_channels` support to alerts API

**UI Plan:** Phase 1: email only; Phase 2: add channel selector when API is ready

---

### Gap 2.2: Market Data API Doesn't Include Tick Count in OHLCV Candles

**Status:** 🟢 **RESOLVED** (v0.1.8) — but only for recent deployments

**What it was:**

- OHLCV candles lacked `tick_count` (number of trades in candle)
- UI couldn't show trade velocity

**What changed:**

- Market data API now includes `tick_count` in candle response
- Also added `volume_count` (number of distinct participants)

**Impact:** Volatility features and volume profiles now possible

**UI opportunity:** Add volume profile chart (candle + colored volume bars)

---

### Gap 2.3: Strategy Backtesting API Doesn't Return Tick-Level Data

**Status:** 🔴 **NOT STARTED**

**Current behavior:**

- Backtest results include daily P&L, Sharpe, drawdown
- No intra-day P&L progression, no order-by-order breakdown

**What UI needs:**

- Tick-level P&L for smooth profit curve animation
- Order-level attribution (which order made how much $?)
- For detailed backtest analysis

**Impact:** Backtest results UI is summary-only; can't drill into specific bars/trades

**Workaround:** Download backtest CSV, analyze in Excel

**Suggested fix:** Add `--detailed-output` flag to backtest API; return tick-level results

**UI Plan:** Defer until API supports detailed output

---

### Gap 2.4: Configuration API Doesn't Return Audit Trail

**Status:** 🟡 **PLANNED** — config-api sprint #2

**Current behavior:**

- Can fetch current config
- Can't see who changed what and when

**What UI needs:**

- Config change history API: `GET /api/config/{id}/history`
- Each entry: `{timestamp, user_id, field_name, old_value, new_value}`

**Impact:** Admin/audit screens can't show configuration change history

**Workaround:** Enable database audit logging separately (out of app)

**Suggested fix:** Add `/api/config/{id}/history` endpoint with full audit trail

**UI Plan:** Phase 1: show current config only; Phase 2: add change history when API ready

---

## 3. Low-Impact Gaps (Nice-to-Have)

These gaps are "nice" improvements but not critical. Build the UI without them; add if time permits.

### Gap 3.1: Positions API Doesn't Include Greeks for Options

**Status:** 🟢 **PLANNED** — but low priority

**Current behavior:**

- Option positions return quantity and value
- No delta, gamma, vega, theta

**What UI needs:**

- Greeks for options risk monitoring
- For options portfolio dashboard

**Impact:** Options risk UI will be basic (just value, not sensitivities)

**Workaround:** Fetch Greeks from external service (Databento, etc.)

---

### Gap 3.2: Execution API Doesn't Track Slippage vs Benchmark

**Status:** 🟢 **NICE-TO-HAVE** — low priority

**Current behavior:**

- Fills include actual price
- No "what would VWAP have been" comparison

**What UI needs:**

- Slippage metrics: `slippage_vs_midpoint`, `slippage_vs_vwap`

**Impact:** Execution analytics can't show slippage attribution

---

### Gap 3.3: Risk API Doesn't Support "What-If" Scenario Analysis

**Status:** 🔴 **NOT PLANNED**

**Current behavior:**

- Risk API shows current state
- Can't simulate "if I add 100 BTC, what happens to risk?"

**What UI needs:**

- POST `/api/risk/simulate` with proposed position delta
- Returns: new risk metrics, breach probability, etc.

**Impact:** Risk UI can't have "simulate position" feature

**Workaround:** Manual calculation in spreadsheet

---

## 4. Known Differentials (API vs UI Expectations)

These aren't gaps — the APIs work — but there are subtle differences between what the backend provides and what the UI naturally expects.

### Differential 4.1: Order Status Terminology

**API Response:**

```json
{
  "order_id": "123",
  "status": "OPEN",
  "filled_qty": 0.5,
  "remaining_qty": 0.5
}
```

**UI Expectation:**

- "Open" but also partially filled?
- What should we call this? "Partial Fill"? "Open"?

**Resolution:** API status is venue-native (BINANCE uses "OPEN" even if partial). UI should translate:

- OPEN + filled_qty > 0 → "Partially Filled"
- OPEN + filled_qty == 0 → "Open"
- CLOSED + filled_qty == 0 → "Cancelled"
- CLOSED + filled_qty > 0 → "Filled" or "Partially Filled"

---

### Differential 4.2: Price Representation (Decimal vs Scientific)

**API Response:**

```json
{
  "price": 6.5e-4,
  "size": 1000000
}
```

**UI Expectation:**

- Users expect "0.00065" not scientific notation
- Very small prices (altcoins) need careful display

**Resolution:** Format in UI layer:

- If price < 0.0001: show 8 decimal places
- If price < 1: show 6-8 decimal places
- If price >= 1: show 2 decimal places

---

### Differential 4.3: Timestamp Format

**API Response:**

```json
{
  "timestamp": 1711209600000, // milliseconds
  "created_at": "2026-03-24T00:00:00Z" // ISO string
}
```

**UI Expectation:**

- Inconsistency (some ms, some ISO strings)
- Timezone confusion (UTC vs local)

**Resolution:**

- Standardize: all timestamps as ISO 8601 UTC
- UI converts to user's local timezone for display
- Agenda item for API team: standardize on ISO 8601

---

### Differential 4.4: Aggregation Semantics

**API Response (Market Data):**

```json
{
  "symbol": "BTC/USD",
  "candle": {
    "open": 64000,
    "high": 66000,
    "low": 63000,
    "close": 65000,
    "volume": 150.5
  }
}
```

**UI Expectation:**

- Which exchange's prices? (Binance only? Binance+Kraken average?)
- Should multi-venue dashboards show aggregated candles or per-venue?

**Resolution:**

- API should be clear: this is BINANCE 1h candle (tag it)
- UI aggregates explicitly if needed (don't hide it)
- Config should control: "aggregation strategy = none | weighted_average | min/max"

---

## 5. By Service: API Readiness Matrix

### Execution Service

| Feature          | API Status             | UI Status      | Gap?             |
| ---------------- | ---------------------- | -------------- | ---------------- |
| Place order      | ✅ Ready               | ✅ Ready       | No               |
| Cancel order     | ✅ Ready               | ✅ Ready       | No               |
| View positions   | ⚠️ Missing entry_price | 🟡 In progress | **Yes: Gap 1.2** |
| View executions  | ⚠️ No date filtering   | 🟡 In progress | **Yes: Gap 1.3** |
| Set risk limits  | ✅ Ready               | 📋 Not started | No               |
| Simulated orders | ❌ Not started         | 📋 Not started | N/A              |

### Risk Service

| Feature                     | API Status     | UI Status      | Gap?             |
| --------------------------- | -------------- | -------------- | ---------------- |
| Get risk limits (global)    | ✅ Ready       | ✅ Ready       | No               |
| Get risk limits (per-venue) | ❌ Not started | 📋 Not started | **Yes: Gap 1.1** |
| Get current exposure        | ✅ Ready       | ✅ Ready       | No               |
| Alert on breach             | ✅ Ready       | ⚠️ Email only  | **Yes: Gap 2.1** |
| Scenario analysis           | ❌ Not started | 📋 Not started | **Gap 3.3**      |

### Strategy Service

| Feature                 | API Status          | UI Status      | Gap?             |
| ----------------------- | ------------------- | -------------- | ---------------- |
| View strategies         | ✅ Ready            | ✅ Ready       | No               |
| Update config (full)    | ✅ Ready            | ✅ Ready       | No               |
| Update config (partial) | ❌ No PATCH support | 🟡 Workaround  | **Yes: Gap 1.4** |
| Backtest (summary)      | ✅ Ready            | ✅ Ready       | No               |
| Backtest (detailed)     | ❌ No tick-level    | 📋 Not started | **Gap 2.3**      |

### Market Data Service

| Feature             | API Status               | UI Status | Gap? |
| ------------------- | ------------------------ | --------- | ---- |
| OHLCV candles       | ✅ Ready (w/ tick count) | ✅ Ready  | No   |
| Order book snapshot | ✅ Ready                 | ✅ Ready  | No   |
| Trade stream        | ✅ WebSocket ready       | ✅ Ready  | No   |
| Historical data     | ✅ Ready                 | ✅ Ready  | No   |

### Alerting Service

| Feature              | API Status     | UI Status      | Gap?        |
| -------------------- | -------------- | -------------- | ----------- |
| Create alert (email) | ✅ Ready       | ✅ Ready       | No          |
| Create alert (Slack) | 🟡 In progress | 📋 Not started | **Gap 2.1** |
| Alert history        | ✅ Ready       | ✅ Ready       | No          |
| Alert tuning         | ✅ Ready       | 📋 Not started | No          |

---

## 6. How to Update This Document

### When you find a gap:

```markdown
### Gap X.Y: [Title]

**Blocking / Deferred / Nice-to-have:** [Choose one]

**Current API behavior:**
[What it does now]

**What UI needs:**
[What it should do]

**Status:** [🔴 NOT STARTED | 🟡 IN PROGRESS | 🟢 RESOLVED]

**Impact:** [Why it matters]

**Workaround:** [How to work around it]

**Suggested fix:** [What should be changed]

**Backend issue:** [Link to GH issue if one exists]
```

### When a gap is fixed:

1. Change status to 🟢 **RESOLVED**
2. Add date resolved
3. Update UI plan (feature can now be built)
4. Move to "Resolved" section at bottom

---

## 7. Resolved Gaps (Archive)

### Resolved: Candles now include tick count (Gap 2.2)

**Date resolved:** 2026-03-10
**API:** Market Data v0.1.8+
**UI Impact:** Can now show volume profiles, trade velocity

---

## Summary Table

| Gap # | Title                               | Impact                | Status | Blocker? |
| ----- | ----------------------------------- | --------------------- | ------ | -------- |
| 1.1   | Risk API no per-venue breakdown     | Risk UI reduced       | 🔴     | **YES**  |
| 1.2   | Positions API missing entry price   | P&L incomplete        | 🟡     | **YES**  |
| 1.3   | Execution history no date filtering | Slow UI               | 🔴     | **YES**  |
| 1.4   | Strategy config no PATCH support    | Config UX fragile     | 🟡     | **YES**  |
| 2.1   | Alert API no Slack/PagerDuty        | Limited notifications | 🟡     | No       |
| 2.2   | Market data missing tick count      | ✅ RESOLVED           | 🟢     | No       |
| 2.3   | Backtest no tick-level data         | Backtest UI basic     | 🔴     | No       |
| 2.4   | Config API no audit trail           | Audit impossible      | 🟡     | No       |
| 3.1   | Positions API no Greeks             | Options UI basic      | 🟢     | No       |

---

**Version:** 1.0
**Last Updated:** 2026-03-19
**Maintainer:** Unified Trading System UI Team

---

### How This Document Drives Development

1. **UI team prioritizes:** Don't start features with 🔴 gaps; start with 🟢/🟡
2. **Backend team knows:** See what APIs need urgent work
3. **Feedback loop:** As UI team discovers new gaps, they're documented here immediately
4. **Planning:** Every sprint, review gaps to see if status changed
