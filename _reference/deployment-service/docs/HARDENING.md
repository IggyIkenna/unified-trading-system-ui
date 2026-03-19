# Hardening Framework and Shard Readiness Overview

4-stage readiness, checklist framework, and service hardening status.

**Last consolidated:** 2026-02-09

---

## Goals

1. **Code Standardization** - GCS output paths follow consistent patterns (key=value format: `day={date}/feature_group={group}/timeframe={tf}/`)
2. **Unit Test Coverage** - All CLI-driven paths have tests
3. **E2E Test Coverage** - Combinatoric testing validates outputs
4. **Data Catalog** - Track completeness across services
5. **Dependency Flow** - Validate upstream data before running
6. **Resource Optimization** - Adaptive MAX_WORKERS for date parallelism, no CSV dumps on VMs

**Note:** All production services already use `key=value` format. See [BIGQUERY_HIVE_PARTITIONING_VALIDATION.md](BIGQUERY_HIVE_PARTITIONING_VALIDATION.md)

---

## 4-Stage Shard Readiness

Each shard must pass these stages in order. A shard is "ready" when all 4 are complete.

| Stage                                | Definition                                                                           | Verification                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| **1. CI/CD**                         | Quality gates pass, Docker builds                                                    | `gh run list`, Cloud Build green                                               |
| **2. Shard-Level Failure Mechanism** | Code fails loudly; no `except: continue` swallowing errors; exit non-zero on failure | Audit the processing loop; break one instrument/date, verify exit non-zero     |
| **3. E2E Local**                     | Run locally for 1+ date per shard, zero errors, schema validation passes             | `{service-cli} --force --start-date 2026-01-10 --end-date 2026-01-10` exits 0  |
| **4. Cloud + Data Catalogue**        | Full deploy with `--force`; data status 100% for valid dates                         | `data-status/turbo?service={svc}&freshness_date={merge_timestamp}` shows FOUND |

**NEW (2026-02-10):** With MAX_WORKERS date parallelism:

- Shards may cover multiple dates (e.g., 16 dates per shard)
- Stage 3/4 validation applies to ALL dates in shard
- Per-date status tracked in results JSON

### Why `--force` for Stages 3–4

Without `--force`, existing blobs are skipped and timestamps stay old. Data status uses `freshness_date` to count only blobs updated after the hardening merge. Use `--force` to prove hardened code produced the data.

### Freshness Workflow

```
1. Merge hardening PR (note merge timestamp)
2. Re-run all MVP shards with --force
3. Check data status with freshness_date = merge timestamp
4. All FOUND → Stage 4 complete; any DATA_STALE → re-run that shard
```

---

## Shard Status Summary

| Service                        | Stage 1 | Stage 2 | Stage 3 | Stage 4 | Blockers                                   |
| ------------------------------ | ------- | ------- | ------- | ------- | ------------------------------------------ |
| instruments-service            | 11/11   | 11/11   | 11/11   | 8/11    | TradFi+CeFi Stage 4 next                   |
| market-tick-data-handler       | 25/25   | 25/25   | 25/25   | 0/25    | CeFi TARDIS; 3 DeFi shards missing         |
| market-data-processing-service | 15/15   | 15/15   | 0/15    | 0/15    | Stage 3 in progress                        |
| features-delta-one-service     | 23/23   | 23/23   | 1/23    | 0/23    | 200 days MDPS; feature_group name mismatch |
| features-onchain-service       | 4/4     | 0/4     | 0/4     | 0/4     | MDPS DeFi lending                          |
| features-calendar-service      | 3/3     | 0/3     | 0/3     | 0/3     | No blockers                                |
| ml-training-service            | 12/12   | 0/12    | 0/12    | 0/12    | Blocked on features                        |
| ml-inference-service           | 12/12   | 0/12    | 0/12    | 0/12    | Blocked on ml-training                     |
| strategy-service               | 6/6     | 0/6     | 0/6     | 0/6     | Batch handler P0; mock ML initially        |
| execution-service              | 6/6     | 6/6     | 0/6     | 0/6     | Battle testing                             |
| features-volatility-service    | —       | —       | —       | —       | Included in hardening map                  |

_Full per-shard matrix and MVP venue/date details: see archived MVP_SHARD_READINESS_CHECKLIST._

---

## 45-Point Checklist (Per Service)

Each service has `configs/checklist.{service}.yaml`. Key phases:

- **Phase 1 (1–6):** Repo foundation, deps, config, env
- **Phase 2 (7–12):** Cloud-agnostic, paths, testing
- **Phase 3 (13–18):** Logging, error handling, UTC
- **Phase 4 (19–24):** Schema validation, GCS paths
- **Phase 5 (25–30):** Deployment, data catalogue
- **Phase 6 (31–36):** Multi-cloud, secrets
- **Phase 7 (37–45):** Runbooks, final sign-off

---

## GCS Path Standards (Nested)

| Pattern                                 | Example            |
| --------------------------------------- | ------------------ |
| `by_date/day-{YYYY-MM-DD}/`             | Date partitioning  |
| `feature_group-{group}/timeframe-{tf}/` | Feature structure  |
| `data_type-{type}/`                     | Data type grouping |

**Instruments:** `instrument_availability/by_date/day={date}/instruments.parquet` (key=value)
**Features:** `by_date/day-{date}/feature_group-{group}/timeframe-{tf}/{instrument}.parquet` (nested)

---

## Audit Framework (100 Points)

- **Cloud-Agnostic (20):** No direct google.cloud imports; use unified-trading-library
- **GCS Path (20):** key=value format; day-first ordering
- **Testing (20):** Python alignment; quality gates
- **Schema (20):** Validation in write paths
- **Deployment (20):** deploy.py works; data catalogue

See [audit/CURRENT_AUDIT.md](../audit/CURRENT_AUDIT.md) for current findings.

---

## Related

- [CLI.md](CLI.md) - Shard calculation, deploy commands
- [GCS_AND_SCHEMA.md](GCS_AND_SCHEMA.md) - Path format details
