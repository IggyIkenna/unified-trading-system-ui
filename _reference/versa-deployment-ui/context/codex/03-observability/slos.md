# Service Level Objectives (SLOs) — Unified Trading System

**Last Updated:** 2026-03-06 **Owner:** Platform / SRE **Standard:** Google SRE — error budget model (30-day rolling
window)

---

## Framework

All SLOs use **30-day rolling windows**. Error budget = `(1 - SLO_target) * 30 days`.

**Alert rule:** Page when >50% of error budget consumed in a 30-day window. **Burn rate alert:** Fast burn (1h window,
14× budget consumption rate) → P1 page. **Cloud Monitoring:** SLO resources defined per service in Terraform
(`deployment-service/terraform/gcp/`).

---

## SLO Definitions

### execution-service

| SLI                          | Metric                                         | Target  | Error Budget (30d) | Notes                              |
| ---------------------------- | ---------------------------------------------- | ------- | ------------------ | ---------------------------------- |
| Order processing P99 latency | `execution_order_duration_p99`                 | < 500ms | 0.5% (3.6h)        | From order receipt to exchange ACK |
| Kill-switch activation P99   | `execution_killswitch_duration_p99`            | < 200ms | 0.1% (0.72h)       | Hard SLO — regulatory requirement  |
| Order acceptance rate        | `execution_orders_accepted / orders_submitted` | ≥ 99.9% | 0.1%               | Exchange rejections excluded       |

### strategy-service

| SLI                   | Metric                                          | Target  | Error Budget (30d) | Notes                            |
| --------------------- | ----------------------------------------------- | ------- | ------------------ | -------------------------------- |
| Signal generation P95 | `strategy_signal_duration_p95`                  | < 1s    | 0.1% (0.72h)       | Per-date batch signal completion |
| Batch completion rate | `strategy_batches_successful / batches_started` | ≥ 99.5% | 0.5%               | Retryable failures excluded      |

### market-data-api

| SLI                       | Metric                          | Target  | Error Budget (30d) | Notes                                 |
| ------------------------- | ------------------------------- | ------- | ------------------ | ------------------------------------- |
| Tick delivery P95 latency | `market_data_tick_duration_p95` | < 200ms | 0.5% (3.6h)        | From exchange receipt to API response |
| API availability          | `(requests - 5xx) / requests`   | ≥ 99.5% | 0.5%               | 4xx excluded (client errors)          |

### risk-and-exposure-service

| SLI                         | Metric                     | Target  | Error Budget (30d) | Notes                                   |
| --------------------------- | -------------------------- | ------- | ------------------ | --------------------------------------- |
| Position update P99 latency | `risk_position_update_p99` | < 100ms | 0.1% (0.72h)       | End-to-end position recalculation       |
| Alert delivery latency P99  | `risk_alert_delivery_p99`  | < 5s    | 0.1%               | From threshold breach to PubSub publish |

### alerting-service

| SLI                       | Metric                           | Target | Error Budget (30d) | Notes                                   |
| ------------------------- | -------------------------------- | ------ | ------------------ | --------------------------------------- |
| Alert delivery P99        | `alerting_delivery_p99`          | < 30s  | 0.5% (3.6h)        | From event receipt to notification sent |
| Alert false-positive rate | `false_positives / total_alerts` | < 1%   | —                  | Tracked via feedback; no hard budget    |

### instruments-service

| SLI                    | Metric                             | Target | Error Budget (30d) | Notes                                  |
| ---------------------- | ---------------------------------- | ------ | ------------------ | -------------------------------------- |
| Instrument refresh P95 | `instruments_refresh_duration_p95` | < 60s  | 1% (7.2h)          | Full catalog refresh                   |
| Data freshness         | Time since last successful sync    | < 24h  | 0.5%               | Stale data impacts downstream services |

### market-data-processing-service

| SLI                     | Metric                                 | Target         | Error Budget (30d) | Notes                            |
| ----------------------- | -------------------------------------- | -------------- | ------------------ | -------------------------------- |
| Candle processing P95   | `candles_processing_duration_p95`      | < 5s per batch | 1%                 | Per-timeframe candle computation |
| Processing success rate | `batches_successful / batches_started` | ≥ 99%          | 1%                 |                                  |

### ml-inference-service

| SLI                   | Metric                                       | Target | Error Budget (30d) | Notes                             |
| --------------------- | -------------------------------------------- | ------ | ------------------ | --------------------------------- |
| Inference P95 latency | `ml_inference_duration_p95`                  | < 2s   | 1% (7.2h)          | Single model inference call       |
| Model availability    | `successful_inferences / inference_requests` | ≥ 99%  | 1%                 | Excludes cold-start first request |

---

## Prometheus Metric Naming Convention

```
<service_snake>_<operation>_duration_seconds{status="ok|error", operation_type="..."}
<service_snake>_<operation>_total{status="ok|error"}
```

Examples:

- `execution_order_duration_seconds` — histogram
- `execution_orders_total{status="accepted"}` — counter
- `strategy_signal_duration_seconds` — histogram
- `market_data_tick_delivery_duration_seconds` — histogram

All histograms MUST define buckets covering SLO threshold:

```python
BUCKETS = [0.01, 0.025, 0.05, 0.1, 0.2, 0.5, 1.0, 2.5, 5.0, 10.0]
```

---

## Error Budget Alerting

### Cloud Monitoring Alert Policy (Terraform pattern)

```hcl
resource "google_monitoring_alert_policy" "slo_error_budget_burn" {
  display_name = "${var.service_name} — SLO Error Budget Burn"
  combiner     = "OR"

  conditions {
    display_name = "Fast burn: 14x budget consumed in 1h"
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/${var.service_name}/slo_burn_rate\""
      threshold_value = 14.4
      duration        = "3600s"
      comparison      = "COMPARISON_GT"
    }
  }

  conditions {
    display_name = "Slow burn: 50% budget consumed in 6h"
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/${var.service_name}/slo_burn_rate\""
      threshold_value = 1.0
      duration        = "21600s"
      comparison      = "COMPARISON_GT"
    }
  }

  notification_channels = [var.pagerduty_channel_id]
}
```

### Error Budget Consumption Formula

```
burn_rate = (error_rate_in_window) / (1 - slo_target)
budget_consumed_pct = burn_rate * (window_duration / 30d)
```

---

## OpenTelemetry Span Conventions

Service entry spans MUST set these attributes:

```python
with tracer.start_as_current_span("process_order") as span:
    span.set_attribute("service.name", "execution-service")
    span.set_attribute("order.client_id", client_id)
    span.set_attribute("order.venue", venue)
    span.set_attribute("order.category", category)  # CEFI/DEFI/SPORTS
```

Span names follow `<verb>_<noun>` snake_case pattern:

- `process_order`, `evaluate_signal`, `refresh_instruments`, `run_inference`
- `compute_candles`, `check_risk`, `deliver_alert`

---

## Incident Response Integration

See `alerting.md` for notification routing. See `lifecycle-events.md` for required event taxonomy (AUTH_FAILURE,
KILL_SWITCH_ACTIVATED, etc.).

Kill-switch SLO breach → automatic `KILL_SWITCH_ACTIVATED` event logged → P0 page.
