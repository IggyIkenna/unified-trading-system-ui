# H7 — VCR Cassette Coverage Audit: Databento & Tardis

**Date**: 2026-03-11 **Scope**: Production HTTP endpoints called by `unified-market-interface` clients and adapters.

---

## Databento

Databento is accessed via the **Python SDK** (`databento.Historical`), not raw HTTP. The SDK wraps
`hist.databento.com/v0/` internally. VCR cassettes at the raw-HTTP level are not the primary test mechanism — the SDK is
mocked at the object level in unit tests.

### Production SDK Calls (from source)

| SDK Method                                                            | Called In                                | Rate-Limit Category | Cassette    |
| --------------------------------------------------------------------- | ---------------------------------------- | ------------------- | ----------- |
| `client.metadata.list_datasets()`                                     | `databento_base_client.py:403` (warmup)  | `metadata`          | **MISSING** |
| `client.timeseries.get_range(schema=DEFINITION, ...)`                 | `databento_adapter.py:190` (instruments) | `timeseries`        | **MISSING** |
| `client.timeseries.get_range(schema=OHLCV_1M/TRADES/MBP_1/TBBO, ...)` | `databento_adapter.py:430` (market data) | `timeseries`        | **MISSING** |
| `client.batch.list_jobs(states=[...])`                                | `databento_batch_jobs.py:147,339`        | `batch.list_jobs`   | **MISSING** |
| `client.batch.submit_job(...)`                                        | `databento_batch_jobs.py:262`            | `batch.submit_job`  | **MISSING** |
| `client.batch.download(job_id, ...)`                                  | `databento_batch_jobs.py:490`            | `batch.list_jobs`   | **MISSING** |

**Current cassette coverage**: 0/6 endpoints — `databento/mocks/` contains only `.gitkeep`.

---

## Tardis

Tardis is accessed via raw HTTP (`httpx` sync + `aiohttp` async). VCR cassettes directly apply.

### Production HTTP Calls (from source)

| Method | URL Pattern                                                                                  | Used For                             | Cassette                      |
| ------ | -------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------- |
| `GET`  | `https://api.tardis.dev/v1/exchanges`                                                        | Warmup (both sync + async)           | **EXISTS** (`exchanges.yaml`) |
| `GET`  | `https://api.tardis.dev/v1/exchanges/{exchange}`                                             | Venue access check, instrument fetch | **MISSING**                   |
| `HEAD` | `https://datasets.tardis.dev/v1`                                                             | Warmup connection pool               | **MISSING**                   |
| `GET`  | `https://datasets.tardis.dev/v1/{exchange}/{data_type}/{year}/{month}/{day}/{symbol}.csv.gz` | CSV data download                    | **MISSING**                   |

**Current cassette coverage**: 1/4 endpoints.

---

## Pyth (bonus — found in production path)

Pyth is accessed via raw HTTP for live DeFi price feeds (`PythLiveAdapter`).

| Method | URL Pattern                                                     | Cassette                                 |
| ------ | --------------------------------------------------------------- | ---------------------------------------- |
| `GET`  | `https://hermes.pyth.network/v2/updates/price/latest?ids[]=...` | **EXISTS** (`pyth_ws_price_update.yaml`) |

**Current cassette coverage**: 1/1 endpoints.

---

## BloxRoute (bonus — found in production path)

BloxRoute (`BloxrouteLiveAdapter`) uses WebSocket connections, not HTTP REST — VCR cassettes do not apply. The
`bloxroute/mocks/stub.yaml` is a placeholder only.

---

## Priority for Stub Completion

| Priority | Provider  | Endpoint                                                  | Reason                                     |
| -------- | --------- | --------------------------------------------------------- | ------------------------------------------ |
| P0       | Tardis    | `GET /v1/exchanges/{exchange}`                            | Called on every instrument-fetch warm path |
| P0       | Tardis    | `HEAD https://datasets.tardis.dev/v1`                     | Warmup; missing causes test noise          |
| P0       | Tardis    | `GET datasets.tardis.dev/.../{symbol}.csv.gz`             | Core market-data download path             |
| P1       | Databento | `metadata.list_datasets`                                  | Called on every session warmup             |
| P1       | Databento | `timeseries.get_range` (definition schema)                | Called on instrument discovery             |
| P2       | Databento | `timeseries.get_range` (OHLCV_1M/TRADES)                  | Market data download                       |
| P3       | Databento | `batch.list_jobs` / `batch.submit_job` / `batch.download` | Batch job orchestration                    |

**Note on Databento**: Because the SDK wraps HTTP internally, raw cassettes provide limited value — prefer mocking
`databento.Historical` at the object level in unit tests. Stub cassettes for Databento are provided here for
completeness and future SDK-HTTP integration tests.
