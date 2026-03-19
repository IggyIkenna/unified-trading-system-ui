# Operation Capability Registry

**SSOT:** `unified-api-contracts/unified_api_contracts/registry/capability.py` + `venue_context.py`

## Overview

The operation capability registry adds per-operation, per-environment validation to the UAC registry. It answers: "Can I
call operation X on venue Y in environment Z, and if so, how do I authenticate?"

Three layers of granularity (coarse to fine):

| Layer               | Scope                 | Example                                                         |
| ------------------- | --------------------- | --------------------------------------------------------------- |
| `SourceCapability`  | Per-source            | "hyperliquid supports testnet"                                  |
| `operation_details` | Per-operation per-env | "place_order on testnet uses l1_action signing with api_wallet" |
| `EndpointSpec`      | Per-HTTP-endpoint     | "POST /info returns HyperliquidMeta, cassette recorded"         |

## Key Types

### OperationEnvDetail

Per-environment detail for a single operation. Fields:

| Field                 | Type | Purpose                           | Common Values                                                                             |
| --------------------- | ---- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| `supported`           | bool | Whether this op works in this env | `True`, `False`                                                                           |
| `signing_scheme`      | str  | How to sign the request           | `hmac_sha256`, `l1_action`, `user_signed`, `eip712`, `on_chain`, `api_key_header`, `none` |
| `required_credential` | str  | What credential type is needed    | `api_key`, `api_wallet`, `main_wallet`, `wallet_private_key`, `cert`, `none`              |
| `data_fidelity`       | str  | Quality of data in this env       | `production`, `synthetic`, `production_mirror`, `delayed`                                 |
| `base_url`            | str  | Environment-specific base URL     | `https://api.hyperliquid-testnet.xyz`                                                     |
| `notes`               | str  | Human-readable context            | `"API wallet cannot transfer; use UI"`                                                    |

### OperationDetail

Container for per-environment details:

```python
OperationDetail(environments={
    "mainnet": OperationEnvDetail(signing_scheme="l1_action", required_credential="api_wallet"),
    "testnet": OperationEnvDetail(supported=False, notes="Transfer requires main wallet key"),
})
```

### Extended SourceCapability Fields

```python
SourceCapability(
    source="hyperliquid",
    ...existing fields...
    operation_details={"place_order": OperationDetail(...), "usd_class_transfer": OperationDetail(...)},
    base_urls={"mainnet": "https://api.hyperliquid.xyz", "testnet": "https://api.hyperliquid-testnet.xyz"},
    margin_model={"mainnet": "cross", "testnet": "unified"},
)
```

## Key Functions

### validate_operation(source, operation, env)

Returns `OperationEnvDetail` or raises `UnsupportedOperationError`.

```python
from unified_api_contracts.registry import bootstrap_capabilities, validate_operation

bootstrap_capabilities()

# Happy path — returns detail
detail = validate_operation("hyperliquid", "place_order", "testnet")
# detail.signing_scheme == "l1_action"
# detail.required_credential == "api_wallet"

# Blocked operation — raises
validate_operation("hyperliquid", "usd_class_transfer", "testnet")
# UnsupportedOperationError: hyperliquid.usd_class_transfer is not supported on testnet

# Unknown operation — falls back to source-level check
detail = validate_operation("hyperliquid", "unknown_op", "mainnet")
# Returns OperationEnvDetail() with defaults (None fields)
```

### resolve_venue_context(venue, operation, env)

Returns a `VenueContext` object merging source capability, sports metadata, and operation detail.

```python
from unified_api_contracts.registry import resolve_venue_context

ctx = resolve_venue_context("DRAFTKINGS")
# ctx.execution_pattern == "web_scraper"
# ctx.captcha_risk == True
# ctx.sports_auth_method == "login_credentials"

ctx = resolve_venue_context("HYPERLIQUID", "place_order", "testnet")
# ctx.execution_pattern == "clob_api"
# ctx.base_url == "https://api.hyperliquid-testnet.xyz"
# ctx.margin_model_value == "unified"
```

### compose_validation(venue, instruction_type, operation, env, ...)

Chains structural validation (`validate_instruction`) with runtime validation (`validate_operation`) in one call.

```python
from unified_api_contracts.registry import compose_validation

detail = compose_validation(
    venue="HYPERLIQUID",
    instruction_type="TRADE",
    operation="place_order",
    env="mainnet",
    order_type="LIMIT",
    instrument_type="PERPETUAL",
)
# detail.signing_scheme == "l1_action"
```

## Execution Patterns

Derived from `signing_scheme` + `sports_venue_type` + `venue_category`:

| Pattern        | When                                   | Examples                              |
| -------------- | -------------------------------------- | ------------------------------------- |
| `clob_api`     | HMAC/JWT/L1 signing on a CLOB exchange | Binance, Hyperliquid, Betfair, Kalshi |
| `on_chain_tx`  | Web3 transaction signing               | Aave, Uniswap, Curve, Polymarket      |
| `web_scraper`  | Browser automation, login credentials  | DraftKings, Bet365, FanDuel           |
| `fix_protocol` | FIX session logon                      | CME, ICE                              |
| `ib_gateway`   | Interactive Brokers TWS/Gateway        | IBKR                                  |
| `data_only`    | Read-only API, no execution            | Yahoo, Glassnode, DefiLlama           |

## Signing Scheme Reference

| Scheme           | Description                                   | Venues                                |
| ---------------- | --------------------------------------------- | ------------------------------------- |
| `hmac_sha256`    | HMAC-SHA256 on request params                 | Binance, Bybit, OKX, Coinbase, Kalshi |
| `hmac_sha384`    | HMAC-SHA384                                   | Bitfinex                              |
| `hmac_sha512`    | HMAC-SHA512                                   | Kraken, Gate.io                       |
| `l1_action`      | Hyperliquid phantom agent (msgpack + EIP-712) | Hyperliquid orders/cancels            |
| `user_signed`    | Hyperliquid user-signed (EIP-712 direct)      | Hyperliquid transfers/withdrawals     |
| `eip712`         | EIP-712 typed data signing                    | Polymarket, dYdX, MEV/Flashbots       |
| `on_chain`       | Web3 transaction signing via wallet           | Aave, Uniswap, Curve, Morpho, Lido    |
| `api_key_header` | API key in HTTP header                        | Glassnode, Alchemy, TheGraph          |
| `jwt`            | JWT token auth                                | Upbit                                 |
| `fix_logon`      | FIX protocol session                          | FIX venues                            |
| `ib_gateway`     | IB TWS/Gateway connection                     | IBKR                                  |
| `none`           | No auth required                              | DefiLlama, Yahoo, public endpoints    |

## Adding a New Venue

1. Add `SourceCapability` in the appropriate `_cefi.py`, `_defi.py`, etc.
2. Include `operation_details` for each execution operation
3. Include `base_urls` for each environment
4. Include `margin_model` if the venue has margin trading
5. Run `bootstrap_capabilities()` in tests
6. Verify with `validate_operation(source, operation, env)`

## Where Validation Is Wired

| Repo     | Entry Point                              | Validation Type                      |
| -------- | ---------------------------------------- | ------------------------------------ |
| UTEI     | `factory.py:get_order_adapter()`         | `validate_operation("place_order")`  |
| UDEI     | `protocols/*.py` (15 methods)            | `preflight_validate_operation()`     |
| UMI      | `factory.py:_run_capability_preflight()` | Probes first market operation        |
| URDI     | `factory.py` + `router.py`               | Graceful warning                     |
| USEI     | 4 exchange adapters (13 methods)         | `validate_operation(venue, op, env)` |
| exec-svc | `instruction_router.py`                  | `compose_validation()` — full chain  |

## Population Status

- **77 sources** registered across 5 categories (CeFi, DeFi, TradFi, Sports, AltData)
- **53 sources** with populated `operation_details`
- **24 sources** with empty details (data-only — falls back to source-level)
- **80 unit tests** + parametrized integration across all 53 sources
