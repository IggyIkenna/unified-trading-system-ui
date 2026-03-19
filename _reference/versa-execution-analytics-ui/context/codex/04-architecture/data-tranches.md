# Three-Tranche Data Wiring

**SSOT:** This document describes the three-tranche model for client credential and data routing in the Unified Trading
System. The canonical implementation is `tranche_router.py` in
`execution-service/execution_service/data/tranche_router.py`.

---

## Overview

The tranche model classifies how a client's trading data and credentials are managed. Each tranche maps to a distinct
data source and secret resolution path.

| Tranche | Label                     | Credential Source                                      | Data Source                                                | Use Case                                        |
| ------- | ------------------------- | ------------------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------- |
| A       | `manual` / `fund_of_fund` | Manual CSV upload                                      | CSV file in GCS                                            | Fund-of-fund clients; no live API access        |
| B       | `managed`                 | Secret Manager: `exec-{client}-{venue}-{account_type}` | Live execution via exchange API                            | Directly managed accounts with exchange keys    |
| C       | `pooled`                  | PBS + PNL APIs (internal)                              | position-balance-monitor-service + pnl-attribution-service | Pooled accounts reading from internal risk APIs |

---

## Tranche A — Manual CSV

- Credentials: none (CSV upload workflow)
- Data path: `gs://{execution-gcs-bucket}/manual/{client_id}/positions.csv`
- Router output: `data_source = "manual"`
- Services: client-reporting-api reads from GCS directly

```
Client uploads CSV → GCS bucket → client-reporting-api reads → reporting output
```

---

## Tranche B — Secret Manager Live Execution

- Credentials: `exec-{client}-{venue}-{account_type}` in GCP Secret Manager
- Data path: Live exchange API via execution-service adapters
- Router output: `data_source = "api_live"`
- Services: execution-service fetches credentials at startup via `get_secret_client()`

```
CredentialsRegistry.exec_secret_for_client(client, venue, account_type)
  -> get_secret_client().access_secret(secret_name)
  -> exchange adapter
  -> execution-service engine
```

Secret name pattern: `exec-{client}-{venue}-{account_type}`

Examples:

- `exec-odum-binance-cefi`
- `exec-odum-deribit-cefi`
- `exec-odum-hyperliquid-defi`
- `exec-odum-ibkr-tradfi`

---

## Tranche C — PBS + PNL APIs

- Credentials: internal service-to-service auth (S2S OAuth SA tokens)
- Data path: `position-balance-monitor-service` REST API + `pnl-attribution-service` REST API
- Router output: `data_source = "api_internal"`
- Services: client-reporting-api calls internal APIs (not exchange directly)

```
client-reporting-api
  -> GET /api/v1/positions (position-balance-monitor-service)
  -> GET /api/v1/pnl (pnl-attribution-service)
  -> aggregate + report
```

---

## TrancheRouter Implementation

`execution-service/execution_service/data/tranche_router.py` is the canonical implementation of this routing logic. It
uses:

- `CredentialsRegistry.exec_secret_for_client()` from `unified_cloud_interface`
- `get_secret_client()` from `unified_cloud_interface`
- Client config from the `unified-trading-pm/credentials-registry.yaml` (via UIC)

The client-reporting-api has a secondary tranche router (`client_reporting_api/core/tranche_router.py`) scoped to
reporting data-source resolution only. The execution-side router is authoritative for credential resolution.

---

## Tranche Determination Logic

```python
def resolve_tranche(client_config: ClientConfig) -> str:
    tranche = client_config.get("tranche", "manual")
    if tranche == "fund_of_fund":
        return "A"  # Manual CSV
    if tranche == "managed" and client_config.get("secret_name"):
        return "B"  # SM exec credentials
    if tranche == "pooled":
        return "C"  # PBS + PNL APIs
    return "A"      # Default: manual
```

---

## Cross-references

- `unified-cloud-interface/unified_cloud_interface/credentials_registry.py` — `exec_secret_for_client()`
- `unified-trading-codex/07-security/secret-naming-convention.md` — exec key patterns
- `execution-service/execution_service/data/tranche_router.py` — canonical implementation
- `client-reporting-api/client_reporting_api/core/tranche_router.py` — reporting-side resolver
- `unified-trading-pm/credentials-registry.yaml` — per-client operational registry
