# Secret Naming Convention

**SSOT:** This document is the canonical reference for Secret Manager naming in the Unified Trading System. All new
secrets MUST follow these patterns before being provisioned.

The `CredentialsRegistry` class in `unified_cloud_interface.credentials_registry` enforces these patterns
programmatically — any venue or service credential lookup routes through that registry.

---

## Pattern Matrix

| Category                            | Pattern                                | Example                             |
| ----------------------------------- | -------------------------------------- | ----------------------------------- |
| Venue execution keys (per-client)   | `exec-{client}-{venue}-{account_type}` | `exec-odum-binance-cefi`            |
| Venue API credentials (system-wide) | `{venue}-api-credentials`              | `binance-api-credentials`           |
| Venue read keys (split key/secret)  | `{venue}-read-api-key`                 | `deribit-read-api-key`              |
| Venue trade keys (split key/secret) | `{venue}-trade-api-key`                | `binance-trade-api-key`             |
| Service accounts                    | `{service}-service-account`            | `execution-service-service-account` |
| Infrastructure secrets              | `{env}-{resource}-{type}`              | `prod-redis-password`               |
| Data vendor keys                    | `{vendor}-api-key`                     | `tardis-api-key`                    |
| Sports / prediction markets         | `{venue}-api-credentials`              | `betfair-api-credentials`           |

---

## Rules

| Rule                                    | Rationale                                                       |
| --------------------------------------- | --------------------------------------------------------------- |
| Lowercase, hyphen-separated only        | Consistent discovery; no `bybit_api_key` (underscore violation) |
| No version numbers in names             | Use Secret Manager versioning, not name suffixes                |
| No `change-me` placeholder values       | Caught by quality gate; must fail loud if secret absent         |
| Client prefix for client-scoped secrets | `exec-{client}-*` makes IAM scoping explicit                    |
| Venue name matches canonical venue ID   | `binance`, `deribit`, `okx` — not `Binance`, `DERIBIT`, `OKX`   |
| Credential type is last segment         | `-api-key`, `-api-secret`, `-passphrase`, `-credentials`        |

---

## Execution Key Pattern: `exec-{client}-{venue}-{account_type}`

Used by `execution-service` to look up per-client exchange credentials. The three-tranche data wiring in
`tranche_router.py` resolves to this pattern for Tranche B (Secret Manager live execution).

```python
from unified_cloud_interface import CredentialsRegistry, get_secret_client

secret_name = CredentialsRegistry.exec_secret_for_client("odum", "binance", "cefi")
# -> "exec-odum-binance-cefi"

creds_json = get_secret_client().access_secret(secret_name)
```

### Account type values

| Value    | Meaning                                               |
| -------- | ----------------------------------------------------- |
| `cefi`   | CeFi exchange account (Binance, Deribit, OKX, Bybit)  |
| `defi`   | DeFi / onchain execution (Hyperliquid EIP-712 wallet) |
| `tradfi` | TradFi brokerage (IBKR paper/live)                    |
| `sports` | Sports betting exchange (Betfair, Pinnacle)           |

---

## Service Account Pattern: `{service}-service-account`

GCP service accounts used for inter-service IAM auth. Each service has one service account secret containing the JSON
key. The `CredentialsRegistry.service_account_secret()` method returns the canonical name.

```python
sa_secret = CredentialsRegistry.service_account_secret("execution-service")
# -> "execution-service-service-account"
```

---

## Infrastructure Secrets Pattern: `{env}-{resource}-{type}`

| Secret                   | Purpose                             |
| ------------------------ | ----------------------------------- |
| `prod-redis-password`    | Redis cluster password (production) |
| `staging-redis-password` | Redis cluster password (staging)    |
| `prod-postgres-password` | PostgreSQL instance password        |

---

## Data Vendor Pattern: `{vendor}-api-key`

| Secret              | Vendor                          |
| ------------------- | ------------------------------- |
| `tardis-api-key`    | Tardis.dev historical tick data |
| `databento-api-key` | Databento market data           |
| `fred-api-key`      | FRED macroeconomic data         |
| `thegraph-api-key`  | The Graph subgraph queries      |
| `alchemy-api-key`   | Alchemy Ethereum RPC            |

---

## Known Violations (to fix)

| Current Name       | Canonical Name             | Status                                                          |
| ------------------ | -------------------------- | --------------------------------------------------------------- |
| `bybit_api_key`    | `bybit-api-key`            | Must rename — underscore not allowed                            |
| `bybit_api_secret` | `bybit-api-secret`         | Must rename — underscore not allowed                            |
| `betfair_app_key`  | `betfair-api-credentials`  | Must rename — underscores not allowed; consolidate to JSON blob |
| `ibkr-tws-key`     | `ibkr-account-credentials` | Rename for consistency with VENUE_SECRET_MAP                    |
| `graph-api-key`    | `thegraph-api-key`         | Deprecated alias — delete after all consumers migrated          |

---

## Enforcement

- `CredentialsRegistry` in UCI raises `KeyError` for unregistered venues/services
- Quality gate (`quality-gates.sh`) rejects any `os.getenv()` for secret values
- `.cursorrules` prohibits hardcoded API key strings in source code
- `get_secret_client()` is the only approved secret access path (no `os.getenv` fallback)

## Cross-references

- `unified-trading-codex/07-security/secrets-management.md` — full secret inventory + provisioning status
- `unified-cloud-interface/unified_cloud_interface/credentials_registry.py` — programmatic SSOT
- `unified-trading-pm/credentials-registry.yaml` — operational credentials registry (cost, required_for, status)
