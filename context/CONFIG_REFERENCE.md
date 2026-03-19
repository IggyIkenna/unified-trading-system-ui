# Configuration Reference for Unified Trading System UI

## Overview

This document explains where to find actual, working configurations from the backend services and how to use them when building the UI.

**TL;DR:** Configuration exists in the wild. We've catalogued it. Use it to avoid guessing.

---

## 1. What Configuration Exists?

Every service in the Unified Trading System has configuration. Configuration is **NOT guesswork** — it's the actual Pydantic models that services use at runtime.

Configuration includes:

- **API service configs** — what can be configured on `MarketDataApiConfig`, `ExecutionServiceConfig`, etc.
- **Feature flags and toggles** — boolean knobs that control behavior
- **Timeouts, retry policies, rate limits** — operational parameters
- **Data source and sink declarations** — where services read/write
- **Venue-specific parameters** — per-exchange configuration (Binance vs Kraken vs Aave)
- **Strategy internals** — ML signal config, risk config, rebalancing rules
- **Client domain configs** — org-level, role-based permissions

---

## 2. How to Find Configuration

### Source 1: `config-registry.json` (Canonical)

**Location:** `unified-api-contracts/openapi/config-registry.json`

**What it contains:**
- Every Pydantic config class from every service
- All fields, types, defaults
- Grouped by repo

**Example:**
```json
{
  "deployment-api": [
    {
      "class_name": "DeploymentApiConfig",
      "module": "deployment_api.deployment_api_config",
      "fields": {
        "tardis_base_url": {
          "type": "<class 'str'>",
          "default": "https://api.tardis.dev/v1",
          "required": false
        },
        "enable_csv_sampling": {
          "type": "<class 'bool'>",
          "default": false,
          "required": false
        }
      }
    }
  ]
}
```

**How to use:**
1. Find the service you're building UI for (e.g., `ExecutionService`)
2. Look up the corresponding config class (`ExecutionServicesConfig`)
3. See all configurable fields, their types, defaults
4. Use this to build configuration panels in the UI

### Source 2: Backend Service Repos

**What to look for:**

In each service repo, look for:

| File Pattern | What It Contains |
|--------------|------------------|
| `<service>/config.py` | Main configuration class |
| `<service>/service_config.py` | Alternative location |
| `<service>/engine/core/config_loader.py` | Strategy/ML internal config |
| `<service>/domain_configs.py` | Client/org/venue domain configs |

**Example:** To find execution service config:
```bash
cd unified-trading-system-repos/execution-service
find . -name "*config*" -type f | head -20
# Look for: service_config.py, config.py, etc.
```

### Source 3: Service Documentation

In `unified-trading-codex/`, find service-specific config docs:

```
unified-trading-codex/
├── 01-domain/
│   ├── execution-service-config-guide.md
│   ├── strategy-service-configuration.md
│   └── ...
└── 06-coding-standards/
    ├── config-types.md        # ← Canonical config patterns
    └── dependency-management.md
```

---

## 3. Configuration Patterns by Service

### Execution Service Configuration

**Main config class:** `ExecutionServicesConfig`

**Key sections:**
- Order routing rules (per-venue execution preferences)
- Risk management overrides
- Position limits (by venue, by symbol)
- Slippage and price improvement targets
- Smart order routing parameters
- Post-trade optimization

**UI relevance:**
- Configuration panels for traders setting execution preferences
- Risk limit controls
- Slippage budgets per strategy

### Strategy Service Configuration

**Main config class:** `StrategyConfig` + sub-configs

**Key sections:**
- `MLSignalConfig` — model selection, feature weights, signal thresholds
- `RiskConfig` — max drawdown, volatility targets, correlation limits
- `RebalancingConfig` — frequency, execution windows, tolerance bands
- `SmartOrderRoutingConfig` — venue selection, order splitting
- `BenchmarkConfig` — benchmark selection and tracking
- `PositionConfig` — position limits, concentration rules

**UI relevance:**
- Strategy parameter tuning UI
- Signal configuration panels
- Risk scenario definition
- Backtest/simulation controls

### Alerting Service Configuration

**Main config class:** `AlertingSystemConfig`

**Key sections:**
- Alert rules (thresholds, conditions)
- Delivery channels (Slack, email, PagerDuty)
- Rate limiting and deduplication
- Event filtering and routing

**UI relevance:**
- Alert rule builder
- Notification preferences
- Alert history and drill-down

### Data Service Configuration

**Main config class:** `MarketDataApiConfig` + `DataSourceConfig`

**Key sections:**
- Data source URLs (Tardis, Databento, The Graph, Alchemy)
- Rate limits per source
- Caching and persistence rules
- Data freshness SLAs
- Subscription tiers

**UI relevance:**
- Data catalogue UI
- Subscription management
- Source selection and pricing
- Historical data queries

---

## 4. How Configuration Maps to UI Features

### Pattern: Configuration as Feature Gates

Many features are controlled by **boolean config fields**:

```python
class ExecutionServiceConfig:
    enable_smart_order_routing: bool = True  # Gate for SOR feature
    enable_post_trade_optimization: bool = False  # Gated feature
    enable_dark_pool_routing: bool = False  # Advanced feature
```

**In UI:**
- If `enable_smart_order_routing=false`, hide SOR controls
- If `enable_post_trade_optimization=true`, show PTO panel
- If `enable_dark_pool_routing=true`, add dark pool venue option

### Pattern: Configuration as Limits

Many fields define hard limits:

```python
class RiskConfig:
    max_position_size_pct: float = 5.0  # Max 5% of portfolio
    max_daily_loss_amount: float = 100000.0  # Max $100K loss
    max_correlation_threshold: float = 0.8  # Max corr with benchmark
```

**In UI:**
- Slider max = config value
- Input validation uses config limits
- Show user: "Max allowed: {config_value}"

### Pattern: Configuration as Defaults

Many fields provide sensible defaults:

```python
class SmartOrderRoutingConfig:
    preferred_venues: list[str] = ["KRAKEN", "BINANCE"]  # Order matters
    execution_timeout_ms: int = 5000  # 5 second timeout
    max_execution_price_deviation_bps: int = 50  # 50 bps max slip
```

**In UI:**
- Dropdown default = config value
- Timeout input default = config value
- Pre-populate with config defaults, allow override

---

## 5. When Configuration Changes

### How to Stay in Sync

1. **Config changes in backend** → generate new `config-registry.json`
2. **Regenerate:** `cd unified-trading-pm && python scripts/openapi/generate_config_registry.py`
3. **Commit new version** to unified-api-contracts/openapi/
4. **UI pull** new registry from api-contracts
5. **UI regenerates** config panels with new fields

### Deprecation Pattern

If a config field is deprecated:

```python
class ExecutionServiceConfig:
    # DEPRECATED: use smart_order_routing_v2_config instead
    smart_order_routing_config: dict | None = None
    smart_order_routing_v2_config: dict = {...}  # New field
```

**In UI:**
- Show deprecation warning if old field is used
- Encourage migration to new field
- Eventually hide deprecated fields

---

## 6. Configuration by Service Type

### API Services (stateless)

**Configs are mostly read-only:**
- Data source URLs
- API keys / authentication
- Rate limits
- Timeouts

**UI role:** Display current settings, link to deployment/admin panel for changes

### Core Services (stateful)

**Configs are dynamic and tradeable:**
- Risk limits (changeable per day/session)
- Position limits (real-time adjustable)
- Execution preferences (per strategy)
- Alert rules (user-configurable)

**UI role:** Build full CRUD interfaces

### Feature Services

**Configs are feature-level:**
- Which features are enabled
- Feature parameters (thresholds, windows, etc.)
- Feature-specific limits

**UI role:** Feature toggles + parameter tuning

---

## 7. Configuration Validation

All config fields have **type information** in the registry.

Use this for **UI validation:**

```python
# From config-registry.json:
"max_position_size": {
    "type": "<class 'float'>",
    "default": 5.0,
    "required": true
}
```

**In UI:**
```typescript
// Input component constraint
<input type="number" min="0" max="100" step="0.1" />
```

---

## 8. Configuration and Sharding

Some configurations are **per-shard**:

```python
class ExecutionServiceConfig:
    shards: dict[str, ShardExecutionConfig] = {}
    # Each shard has its own config:
    # - shards["CEFI"].risk_limits
    # - shards["DeFi"].rate_limits
    # - shards["Sports"].position_limits
```

**In UI:**
- When displaying risk limits, ask: "Which shard?" (CEFI, DeFi, Sports)
- Show shard-specific limits, not global
- See **SHARDING_DIMENSIONS.md** for sharding taxonomy

---

## 9. Known Configuration Gaps

See **API_FRONTEND_GAPS.md** for a running list of:
- Config fields that exist in backend but UI doesn't expose
- UI features that lack backend configuration support
- Configuration the UI needs but backend doesn't provide
- Alignment opportunities

---

## 10. Generation & Regeneration

### How `config-registry.json` is Generated

**Script:** `unified-trading-pm/scripts/openapi/generate_config_registry.py`

**What it does:**
1. Scans all service repos in the workspace
2. Imports each service's config class
3. Extracts Pydantic field metadata
4. Groups by repo
5. Outputs JSON

**How to regenerate:**
```bash
cd unified-trading-pm
python scripts/openapi/generate_config_registry.py --output-dir ../unified-api-contracts/openapi/
```

**When to regenerate:**
- When adding new config fields to any service
- When a service publishes a new version
- When modifying config class structure
- Before major UI refactors (ensure UI matches current config)

---

## 11. Quick Links

- **Full config registry:** `unified-api-contracts/openapi/config-registry.json`
- **Sharding guide:** [`SHARDING_DIMENSIONS.md`](./SHARDING_DIMENSIONS.md)
- **API/frontend gaps:** [`API_FRONTEND_GAPS.md`](./API_FRONTEND_GAPS.md)
- **Execution config deep-dive:** `unified-trading-codex/01-domain/execution-service-config-guide.md`
- **General config patterns:** `unified-trading-codex/06-coding-standards/config-types.md`
- **Regenerate configs:** `cd unified-trading-pm && python scripts/openapi/generate_config_registry.py`

---

## 12. For Agents

### Before Building a Config UI

1. **Find the config class** in config-registry.json
   - Look up service name (e.g., "execution-service")
   - Find config class name (e.g., "ExecutionServicesConfig")
2. **Review all fields** — don't guess
   - Use types to validate inputs
   - Use defaults to pre-populate
   - Use required flag to know what's mandatory
3. **Check for shards** — some config is per-shard
   - See SHARDING_DIMENSIONS.md for shard taxonomy
4. **Check API_FRONTEND_GAPS.md** — avoid building unsupported config
5. **Add your discoveries** to API_FRONTEND_GAPS.md as you build

---

**Version:** 1.0
**Last Updated:** 2026-03-19
**Maintainer:** Unified Trading System UI Team
