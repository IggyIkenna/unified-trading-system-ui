# Current System Audit

**Last consolidated:** 2026-02-09
**Source:** SYSTEM_WIDE_AUDIT (2026-02-06) + per-service audit summaries

---

## Executive Summary

12 services audited across the full data pipeline. **Strong foundations** in upstream (instruments, tick data) and execution layer. **Critical wiring issues** in middle layers (features, ML, strategy) prevent end-to-end data flow.

### System Readiness by Layer

| Layer              | Services                                          | Readiness | Blocking Issues                                     |
| ------------------ | ------------------------------------------------- | --------- | --------------------------------------------------- |
| Data I/O           | instruments-service, market-tick-data-handler     | 85%       | GCS path mismatch, get_config anti-pattern          |
| Data Processing    | market-data-processing-service                    | 70%       | Output path extra venue level, process_category bug |
| Feature Generation | features-calendar, delta-one, volatility, onchain | 50%       | Bucket conflicts, feature group name mismatches     |
| ML Layer           | ml-training, ml-inference                         | 30%       | Wrong feature buckets, walk-forward not wired       |
| Strategy/Execution | strategy-service, execution-service               | 65%       | Strategy batch placeholder; execution 97/110        |
| Shared Library     | unified-trading-library                           | 80%       | get_config exported, bucket naming dual systems     |

---

## Top 10 Critical Issues

| #   | Issue                                  | Services                                | Impact                                                              |
| --- | -------------------------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| 1   | Feature group names in sharding ≠ code | features-delta-one                      | Sharding uses `price_momentum`, code expects `momentum`             |
| 2   | Wrong features bucket template in ML   | ml-training, ml-inference               | Use `features-store-*` instead of `features-delta-one-{category}-*` |
| 3   | Calendar features via library, not GCS | features-delta-one                      | Breaks if calendar moves to GCS-only                                |
| 4   | Walk-forward model selection dead      | ml-inference                            | Batch uses `load_model()` not `load_model_for_inference_date()`     |
| 5   | Strategy batch handler placeholder     | strategy-service                        | `_run_single_backtest` returns zeros                                |
| 6   | Batch prediction publishing broken     | ml-inference                            | `prediction_events` always empty                                    |
| 7   | instruments GCS path venue subfolder   | instruments → all                       | Writes `day-{date}/venue-{venue}/` not flat                         |
| 8   | get_config() anti-pattern              | instruments, strategy, ucs              | 20+ instances                                                       |
| 9   | Schema validation not enforced         | features-delta-one, volatility, onchain | ParquetSchemaEnforcer not called                                    |
| 10  | Onchain bucket naming conflict         | features-onchain                        | Code uses shared; .env uses per-category                            |

---

## P0 Pipeline Blockers

1. Fix feature group names (sharding ↔ code) — 13 of 17 mismatched
2. Fix features bucket template in ml-training and ml-inference
3. Wire walk-forward selection in ml-inference batch flow
4. Wire strategy batch handler to actual backtest engines
5. Fix batch prediction publishing in ml-inference

---

## Per-Service Scores (from 2026-02-06 audit)

| Service                        | Score | Key Notes                                          |
| ------------------------------ | ----- | -------------------------------------------------- |
| instruments-service            | 85    | GCS path mismatch, get_config                      |
| market-tick-data-handler       | ~95   | Best-in-class                                      |
| market-data-processing-service | 70    | Extra venue level, process_category bug            |
| features-calendar-service      | ~60   | Multi-timeframe broken, schema mismatch            |
| features-delta-one-service     | ~50   | Feature group name mismatch, calendar via library  |
| features-volatility-service    | ~50   | Dependency checker wrong path, TRADFI empty        |
| features-onchain-service       | ~50   | Bucket conflict, missing requests                  |
| ml-training-service            | 30    | Wrong bucket, walk-forward not wired               |
| ml-inference-service           | 30    | Wrong bucket, walk-forward dead, predictions empty |
| strategy-service               | ~65   | Batch handler placeholder                          |
| execution-service              | 97    | Production-ready                                   |
| unified-trading-library        | 80    | get_config, dual bucket systems                    |

---

## Checklist Location

Per-service checklists: `configs/checklist.{service}.yaml`
Template: `configs/checklist.template.yaml`
Priority summary: (removed — was configs/checklist.PRIORITY_SUMMARY.yaml, classified as summary doc per no-summary-docs rule)

---

## Archived Audits

Full per-service reports and historical audits: [ARCHIVE.md](ARCHIVE.md)
