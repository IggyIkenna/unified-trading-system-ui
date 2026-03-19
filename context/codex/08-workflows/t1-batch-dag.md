# T+1 Batch Pipeline DAG

**SSOT for:** T+1 nightly batch replay, GCS namespace conventions, batch-vs-live event comparison, deviation thresholds,
Cloud Scheduler service schedule.

---

## Purpose

Every trading day, live services execute in real time. The T+1 batch pipeline re-runs the same pipeline the following
morning using the same config that was active during the live session. This enables stage-by-stage comparison between
live output and batch output, pinpointing exactly which service deviated and why.

**Three invariants:**

1. `t1-recon/` writes NEVER touch `batch/` or `live/` GCS namespaces
2. Each service runs on its own Cloud Scheduler job — the recon orchestrator does NOT trigger them
3. Config replay uses a frozen config snapshot written by execution-service at EOD (00:30 UTC)

---

## GCS Namespace Conventions

All batch services support a `--run-tag` CLI argument. When omitted, data goes to `batch/` (thermal backtests). When
`--run-tag t1-recon` is passed, data goes to `t1-recon/`.

```
gs://<service-bucket>/
  batch/           ← thermal/ad-hoc backtests (unchanged)
  live/            ← live trading data (unchanged)
  t1-recon/        ← T+1 reconciliation runs ONLY
    features/
      delta-one/{date}/
      volatility/{date}/
      calendar/{date}/
      onchain/{date}/
      sports/{date}/
      cross-instrument/{date}/
      multi-timeframe/{date}/
      commodity/{date}/
    ml/{date}/
    strategy/{date}/
    execution/{date}/
    events/{date}/{service}/   ← batch-emitted events (not published to PubSub)
    recon/
      ml_recon_report_{date}.json
      strategy_recon_report_{date}.json
      execution_recon_report_{date}.json
      agent_report_{date}.md
      summary_{date}.json
      index.json               ← list of completed recon runs (appended by orchestrator)
  configs/
    snapshots/{date}/          ← frozen execution config written at EOD by execution-service
```

---

## Cloud Scheduler: T+1 Service Schedule

All schedules are UTC. Services run sequentially in dependency order. The recon orchestrator polls GCS for output file
presence before starting each stage.

| Service                             | Schedule (UTC) | Writes to                                    | Dependencies |
| ----------------------------------- | -------------- | -------------------------------------------- | ------------ |
| execution-service (config snapshot) | 00:30          | `configs/snapshots/{date}/`                  | none         |
| features-calendar-service           | 01:30          | `t1-recon/features/calendar/{date}/`         | none         |
| features-delta-one-service          | 02:00          | `t1-recon/features/delta-one/{date}/`        | calendar     |
| features-volatility-service         | 02:00          | `t1-recon/features/volatility/{date}/`       | delta-one    |
| features-onchain-service            | 02:30          | `t1-recon/features/onchain/{date}/`          | none         |
| features-sports-service             | 02:30          | `t1-recon/features/sports/{date}/`           | none         |
| features-cross-instrument-service   | 02:30          | `t1-recon/features/cross-instrument/{date}/` | delta-one    |
| features-multi-timeframe-service    | 02:30          | `t1-recon/features/multi-timeframe/{date}/`  | delta-one    |
| features-commodity-service          | 02:30          | `t1-recon/features/commodity/{date}/`        | delta-one    |
| ml-inference-service                | 03:00          | `t1-recon/ml/{date}/`                        | all features |
| strategy-service                    | 04:00          | `t1-recon/strategy/{date}/`                  | ml           |
| batch-live-reconciliation-service   | 06:00          | `t1-recon/recon/`                            | all above    |

---

## Recon Orchestrator Stage DAG

**Service:** `batch-live-reconciliation-service` **Trigger:** Cloud Scheduler 06:00 UTC daily **Deployment:** Cloud Run
Job (pay-per-run, no idle cost) **Timeout:** 2 hours max (each stage capped at 30 minutes)

```
Stage 0 — Config + Data Availability Check
  Poll GCS: configs/snapshots/{date}/ (execution config as-of EOD)
  Poll GCS: t1-recon/ml/{date}/ (ML inference outputs present?)
  Poll GCS: t1-recon/strategy/{date}/ (strategy outputs present?)
  Timeout: 30 min — fail with PubSub alert if upstream data missing

Stage 1 — ML Reconciliation
  Batch:  ml-inference-service --run-tag t1-recon --date {date}
  Live:   gs://{events-bucket}/live/events/{date}/ml-inference-service/
  Output: t1-recon/recon/ml_recon_report_{date}.json

Stage 2 — Strategy Reconciliation
  Batch:  strategy-service batch --run-tag t1-recon --date {date}
  Live:   gs://{events-bucket}/live/events/{date}/strategy-service/
  Output: t1-recon/recon/strategy_recon_report_{date}.json

Stage 3 — Execution Reconciliation
  Batch:  execution-service batch_backtest --run-tag t1-recon --date {date}
          --config-snapshot gs://{bucket}/configs/snapshots/{date}/
  Live:   gs://{events-bucket}/live/events/{date}/execution-service/
  Output: t1-recon/recon/execution_recon_report_{date}.json

Stage 4 — Agent Analysis
  Input:  all 3 recon reports + config context
  Service: trading-agent-service (reconciliation analysis task)
  Output: t1-recon/recon/agent_report_{date}.md
          PubSub → alerting-service → Slack #trading-recon

Stage 5 — Consolidated Results
  Write:  t1-recon/recon/summary_{date}.json
  Append: t1-recon/recon/index.json
  Emit:   PubSub success event
```

---

## Deviation Metrics and Thresholds

### Stage 1: ML Reconciliation

| Metric                        | Description                                                        | Alert Threshold |
| ----------------------------- | ------------------------------------------------------------------ | --------------- |
| `signal_direction_match_rate` | % instruments where batch signal direction = live signal direction | < 95%           |
| `signal_magnitude_mae`        | Mean absolute error between batch and live signal magnitudes       | > 0.1           |
| `instrument_coverage_pct`     | % instruments with both batch and live signals present             | < 90%           |
| `latency_delta_ms`            | Median difference between live emit timestamp and batch equivalent | > 5000ms        |

### Stage 2: Strategy Reconciliation

| Metric                      | Description                                                      | Alert Threshold         |
| --------------------------- | ---------------------------------------------------------------- | ----------------------- |
| `instruction_alignment_pct` | % live instructions reproduced in batch (same side + instrument) | < 85%                   |
| `benchmark_pnl_delta`       | Absolute difference: batch P&L vs live P&L (benchmark pricing)   | > 2% of notional        |
| `position_snapshot_delta`   | Max absolute position deviation (EOD batch vs live snapshot)     | > 1 unit per instrument |
| `var_delta_pct`             | VaR deviation: batch EOD VaR vs live EOD VaR                     | > 10%                   |

### Stage 3: Execution Reconciliation

| Metric                    | Description                                              | Alert Threshold   |
| ------------------------- | -------------------------------------------------------- | ----------------- |
| `alpha_pnl_gap`           | Live fills P&L minus batch fills P&L (alpha attribution) | > 1% of notional  |
| `fill_rate_delta`         | Absolute difference in fill rate: live vs batch          | > 5%              |
| `slippage_delta_bps`      | Mean slippage deviation: live vs batch predicted         | > 10 bps          |
| `algo_selection_accuracy` | % orders where algo matched config (TWAP/VWAP/POV)       | < 99%             |
| `order_latency_p99_ms`    | P99 order latency deviation vs 500ms gate                | > 100ms from gate |

---

## Event Comparison Pattern

In **live mode** services publish to PubSub. These events are archived to:
`gs://{events-bucket}/live/events/{date}/{service}/`

In **T+1 batch mode** services write events directly to GCS (not PubSub):
`gs://{events-bucket}/t1-recon/events/{date}/{service}/`

The recon orchestrator diffs these two GCS paths. No PubSub replay is required.

**Comparison fields per event type:**

- ML signal events: `instrument_id`, `signal_direction` (-1/0/1), `magnitude`, `timeframe`
- Strategy instruction events: `instrument_id`, `side` (BUY/SELL), `operation_type`, `quantity`
- Execution fill events: `instrument_id`, `filled_qty`, `fill_price`, `algo`, `latency_ms`
- Position snapshot events: `instrument_id`, `net_position`, `unrealized_pnl`
- Risk snapshot events: `instrument_id`, `var_1d`, `exposure_usd`, `delta`

---

## Adding a New Service to the T+1 Pipeline

Checklist for onboarding a batch service to T+1 reconciliation:

1. **CLI**: Add `--run-tag` argument to the service's `parser.py`
   - Type: `str`, optional, default: `"batch"`
   - Help: `"GCS output prefix tag (default: batch; use t1-recon for T+1 reconciliation)"`
2. **GCS writer**: Ensure the service's GCS output path respects the run-tag prefix
   - Pattern: `{run_tag}/{service_name}/{date}/`
3. **Event writer**: In batch mode, write events to GCS `{run_tag}/events/{date}/{service}/` instead of publishing to
   PubSub
4. **GCS_PATHS.md**: Update `docs/GCS_PATHS.md` in the service repo to document the `t1-recon/` namespace alongside
   `batch/` and `live/`
5. **Cloud Scheduler**: Add a Cloud Run Job entry in `deployment-service/terraform/gcp/` with the appropriate schedule
   from the table above
6. **Recon orchestrator**: Add a polling check in `stage0_config_pull.py` for the new service's output file

---

## Batch vs Thermal Backtest Distinction

| Run type           | `--run-tag` value   | GCS prefix  | Purpose                                        |
| ------------------ | ------------------- | ----------- | ---------------------------------------------- |
| Thermal backtest   | omitted / `"batch"` | `batch/`    | Research, strategy development, ad-hoc testing |
| T+1 reconciliation | `"t1-recon"`        | `t1-recon/` | Nightly live vs batch comparison               |
| Live trading       | N/A                 | `live/`     | Production real-time data                      |

These namespaces are **strictly isolated**. The recon orchestrator only reads from `t1-recon/` and `live/`. Thermal
backtests in `batch/` are never read by the reconciliation system.

---

## References

- `batch-live-reconciliation-service/` — orchestrator implementation
- `deployment-service/terraform/gcp/` — Cloud Run Job + Cloud Scheduler definitions
- `unified-trading-codex/04-architecture/pipeline-service-layers.md` — 7-layer pipeline DAG
- `unified-trading-codex/00-SSOT-INDEX.md` — T+1 reconciliation row
- Per-service `docs/GCS_PATHS.md` — service-specific path conventions
