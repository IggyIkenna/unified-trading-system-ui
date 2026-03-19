# Performance Targets

**Status:** Active — all CI performance gates must validate against these targets.

---

## Latency Targets

All latencies measured end-to-end (wall clock), using mocked external dependencies unless otherwise noted.

| Path                                               | p50   | p95    | p99    | max    |
| -------------------------------------------------- | ----- | ------ | ------ | ------ |
| Order submission (execution-service → venue mock)  | 200ms | 400ms  | 500ms  | 1000ms |
| Signal generation (strategy-service, full cycle)   | 500ms | 800ms  | 1000ms | 2000ms |
| Feature computation (any single service, 1 symbol) | 100ms | 300ms  | 500ms  | 1000ms |
| ML inference (ml-inference-api, single prediction) | 50ms  | 150ms  | 250ms  | 500ms  |
| End-to-end signal-to-order (strategy → execution)  | 800ms | 1500ms | 2000ms | 5000ms |
| GCS read (feature batch, 1 day, 1 symbol)          | 500ms | 1000ms | 2000ms | 5000ms |
| PubSub publish (single event)                      | 10ms  | 50ms   | 100ms  | 200ms  |

### In-process matching (execution-service, BatchMatchingEngine)

| Path                        | p99 target |
| --------------------------- | ---------- |
| Simulated fill (batch mode) | <1ms       |
| Order routing overhead      | <1ms       |
| TWAP schedule generation    | <1ms       |
| VWAP volume calculation     | <2ms       |

---

## Throughput Targets

| Component           | Target                                           |
| ------------------- | ------------------------------------------------ |
| Tick ingestion      | ≥1000 ticks/second per venue                     |
| PubSub events       | ≥500 events/second sustained                     |
| Backfill            | ≥1M ticks/hour per venue (with Tardis/Databento) |
| Feature computation | ≥100 instrument-days/second                      |
| ML inference batch  | ≥10 predictions/second                           |

---

## Resource Targets

Per service, per Cloud Run instance under normal load.

| Service tier               | Max CPU | Max memory | Max GCS ops/min |
| -------------------------- | ------- | ---------- | --------------- |
| Data services (MTDH, MDPS) | 80%     | 2GB        | 1000            |
| Feature services (all 8)   | 70%     | 1.5GB      | 500             |
| ML inference               | 90%     | 4GB        | 100             |
| Strategy service           | 60%     | 1GB        | 200             |
| Execution service          | 70%     | 2GB        | 300             |

---

## Machine-Readable Targets (YAML)

```yaml
latency_targets_ms:
  order_submission:
    p50: 200
    p95: 400
    p99: 500
    max: 1000
  signal_generation:
    p50: 500
    p95: 800
    p99: 1000
    max: 2000
  feature_computation:
    p50: 100
    p95: 300
    p99: 500
    max: 1000
  ml_inference:
    p50: 50
    p95: 150
    p99: 250
    max: 500
  e2e_signal_to_order:
    p50: 800
    p95: 1500
    p99: 2000
    max: 5000
  gcs_read:
    p50: 500
    p95: 1000
    p99: 2000
    max: 5000
  pubsub_publish:
    p50: 10
    p95: 50
    p99: 100
    max: 200

inprocess_matching_targets_ms:
  simulated_fill_p99: 1
  order_routing_p99: 1
  twap_schedule_p99: 1
  vwap_calculation_p99: 2

throughput_targets:
  tick_ingestion_per_sec: 1000
  pubsub_events_per_sec: 500
  backfill_ticks_per_hour: 1000000
  feature_computation_instrument_days_per_sec: 100
  ml_inference_predictions_per_sec: 10

resource_targets:
  data_services:
    max_cpu_pct: 80
    max_memory_gb: 2
    max_gcs_ops_per_min: 1000
  feature_services:
    max_cpu_pct: 70
    max_memory_gb: 1.5
    max_gcs_ops_per_min: 500
  ml_inference:
    max_cpu_pct: 90
    max_memory_gb: 4
    max_gcs_ops_per_min: 100
  strategy_service:
    max_cpu_pct: 60
    max_memory_gb: 1
    max_gcs_ops_per_min: 200
  execution_service:
    max_cpu_pct: 70
    max_memory_gb: 2
    max_gcs_ops_per_min: 300
```

---

## Memory Leak Tolerance

All services must stay within **+10% RSS growth** over a 30-minute soak test at normal load. Peak-load soak (5×
multiplier, 1 hour): **+15% RSS growth** maximum.

---

## CI Load Scenarios

| Scenario  | Multiplier | Duration | When runs |
| --------- | ---------- | -------- | --------- |
| normal    | 1×         | 60s      | Every PR  |
| peak      | 5×         | 600s     | Nightly   |
| sustained | 5×         | 3600s    | Weekly    |

Slow tests are marked `@pytest.mark.slow`. PR CI runs only `normal` scenario (excludes `slow`).
