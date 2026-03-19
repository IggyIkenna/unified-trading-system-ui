# End-to-End Completion Specs

**Last consolidated:** 2026-02-09

This document consolidates E2E completion specs for market-data-processing-service and features-calendar-service. Each service has a checklist at `configs/checklist.{service}.yaml`.

**Project:** test-project

---

## Shared Rules

1. **Branch Policy:** Push to a branch with your name (e.g., `feature/yourname-mdps-fixes`)
2. **DO NOT push to main** until quality gates pass
3. **Use Cursor** to understand the codebase before asking questions
4. **Follow the staged approach** — don't skip stages
5. **Update the checklist YAML** as items are completed

---

## Service Pipeline (Dependency Order)

```
instruments-service
    └── market-tick-data-handler
            └── market-data-processing-service
                    ├── features-calendar-service (root, no upstream)
                    │       └── features-delta-one-service
                    │               └── ml-training-service
                    │                       └── ml-inference-service
                    │                               └── strategy-service
                    │                                       └── execution-service
                    ├── features-volatility-service
                    └── features-onchain-service
```

---

# Part A: market-data-processing-service

**Checklist:** `unified-trading-codex/10-audit/repos/market-data-processing-service.yaml` (codex v3.0)
**Role:** Processes raw tick data into OHLCV candles (15s, 1m, 5m, 15m, 1h, 4h, 24h)

### Sharding

| Dimension | Values                                 |
| --------- | -------------------------------------- |
| category  | CEFI, TRADFI, DEFI                     |
| venue     | Per-category (BINANCE-SPOT, CME, etc.) |
| date      | Daily                                  |

### Stages

| Stage | Goal                                       |
| ----- | ------------------------------------------ |
| 1     | Local run May 23, 2023 — dry-run then real |
| 2     | Quality gates — ruff + pytest              |
| 3     | Cloud Build — image in Artifact Registry   |
| 4     | UTD-v2 small test May 23-25, CEFI          |
| 5     | Data validation — Data Status tab          |
| 6     | Full deployment 2023-2024                  |

### Key Commands

```bash
# Local
market-data-processing process --date 2023-05-23 --CEFI --venues BINANCE-FUTURES --dry-run

# Deploy
python -m deployment_service.cli deploy -s market-data-processing-service -c vm --start-date 2023-05-23 --end-date 2023-05-25 --category CEFI

# Data status
python -m deployment_service.cli data-status -s market-data-processing-service --start-date 2023-05-23 --end-date 2023-05-25 --check-timeframes
```

### Expected Issues

- **Upstream data gaps:** Run market-tick-data-handler first for missing venue/date
- **Memory:** BINANCE needs larger VMs (venue overrides in config)
- **Region quota:** Multi-region failover built in (asia-northeast1 → europe-west1 → us-central1)

---

# Part B: features-calendar-service

**Checklist:** `unified-trading-codex/10-audit/repos/features-calendar-service.yaml` (codex v3.0)
**Role:** Root service — fetches from OpenBB/FRED, Alpha Vantage; outputs temporal, scheduled_events, event_actuals

### Sharding

| Dimension | Values             |
| --------- | ------------------ |
| category  | CEFI, TRADFI, DEFI |
| date      | Monthly            |

**No venue dimension** — calendar data at category level. ~2 min per shard.

### Stages

| Stage | Goal                                  |
| ----- | ------------------------------------- |
| 0     | Fix ruff linting errors (if blocking) |
| 1     | Local run Jan 2024                    |
| 2     | Quality gates                         |
| 3     | Cloud Build                           |
| 4     | UTD-v2 small test Jan 2024            |
| 5     | Full deployment 2020-present          |

### Key Commands

```bash
# Local
python -m features_calendar_service --mode batch --category CEFI --start-date 2024-01-01 --end-date 2024-01-31 --dry-run

# Deploy
python -m deployment_service.cli deploy -s features-calendar-service -c vm --start-date 2024-01-01 --end-date 2024-01-31 --category CEFI

# Data status
python -m deployment_service.cli data-status -s features-calendar-service --start-date 2024-01-01 --end-date 2024-01-31 --check-feature-groups
```

### External APIs

| API               | Secret                | Rate         |
| ----------------- | --------------------- | ------------ |
| FRED (via OpenBB) | fred-api-key          | 120/min      |
| Alpha Vantage     | alpha-vantage-api-key | 5/min (free) |

### Expected Issues

- **API rate limits:** Run smaller date ranges for bulk backfills
- **OpenBB not installed:** `pip install openbb` or `pip install -e ".[openbb]"`
- **Missing API keys:** Event actuals empty; service continues with warning

---

## UI Tabs

| Tab         | Purpose                                                |
| ----------- | ------------------------------------------------------ |
| Deploy      | Launch deployments, dry-run, force                     |
| Data Status | Per-category/venue/timeframe breakdown, Deploy Missing |
| History     | Shard progress, logs, cancel                           |
| Readiness   | Checklist status                                       |
| Status      | Last data, deployment, build, code push                |

---

## Success Criteria

- Checklist 100% (minus AWS items)
- Data Status shows expected coverage
- No systematic failures in deployment logs
