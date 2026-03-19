# Data Retention Policies

## Overview

All persistent data in the Unified Trading System has defined retention periods. Retention is enforced at the storage
layer (GCS lifecycle rules / S3 lifecycle policies) and documented here as the single source of truth.

## Retention Schedule

| Data Category                    | Storage Path Prefix        | Retention  | Rationale                             |
| -------------------------------- | -------------------------- | ---------- | ------------------------------------- |
| Event lifecycle JSONL            | `lifecycle/`               | 90 days    | Operational debugging; not compliance |
| Alert history                    | `alerting/history/`        | 1 year     | FCA/MiFID compliance requirement      |
| CI/CD events                     | `github-events/`           | 90 days    | Deployment audit trail                |
| Application logs                 | Cloud Logging / CloudWatch | 30 days    | Platform default                      |
| Market data (raw ticks)          | `market-data/raw/`         | 1 year     | Backtest reproducibility              |
| Market data (aggregated candles) | `market-data/candles/`     | Indefinite | Compact; analysis value               |
| Trade execution records          | `executions/`              | 7 years    | Regulatory (FCA/MiFID II)             |
| Position snapshots               | `positions/snapshots/`     | 1 year     | Reconciliation                        |
| ML model artifacts               | `models/`                  | Indefinite | Reproducibility                       |
| ML training logs                 | `ml/training-logs/`        | 90 days    | Operational                           |
| Audit trail (batch-audit-api)    | `audit/trail/`             | 7 years    | Regulatory (FCA/MiFID II)             |

## Implementation

### GCS Bucket Lifecycle Rules

For GCP-hosted environments, retention is enforced via GCS bucket lifecycle rules:

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": { "type": "Delete" },
        "condition": {
          "age": 90,
          "matchesPrefix": ["lifecycle/", "github-events/", "ml/training-logs/"]
        }
      },
      {
        "action": { "type": "Delete" },
        "condition": {
          "age": 365,
          "matchesPrefix": ["alerting/history/", "market-data/raw/", "positions/snapshots/"]
        }
      }
    ]
  }
}
```

### S3 Lifecycle Policies

For AWS-hosted environments, equivalent S3 lifecycle rules apply:

```json
{
  "Rules": [
    {
      "ID": "operational-90d",
      "Filter": {
        "Or": {
          "Prefix": ["lifecycle/", "github-events/", "ml/training-logs/"]
        }
      },
      "Status": "Enabled",
      "Expiration": { "Days": 90 }
    },
    {
      "ID": "compliance-1y",
      "Filter": {
        "Or": {
          "Prefix": ["alerting/history/", "market-data/raw/", "positions/snapshots/"]
        }
      },
      "Status": "Enabled",
      "Expiration": { "Days": 365 }
    }
  ]
}
```

### Cloud Logging / CloudWatch

Application logs use platform defaults:

- **GCP Cloud Logging**: 30-day retention (default `_Default` bucket). Critical logs can be routed to a longer-retention
  bucket if needed.
- **AWS CloudWatch Logs**: 30-day retention set on log groups. Regulatory log groups (execution, audit) should be set to
  7 years.

## UCI Abstraction (Planned)

A `set_retention_policy()` method on the UCI `DataSink` interface is planned but not yet implemented. Once available,
services will declare retention intent at the application layer rather than relying solely on infrastructure
configuration:

```python
# Planned API (not yet available)
sink = get_data_sink()
sink.set_retention_policy("alerting/history/", days=365)
```

Until this abstraction is implemented, retention is managed exclusively through infrastructure-level lifecycle rules as
documented above.

## Compliance Notes

- **FCA/MiFID II** requires trade execution records and full audit trails to be retained for a minimum of 5 years (7
  years recommended). The `executions/` and `audit/trail/` prefixes are set to 7-year retention.
- **Alert history** (1 year) covers the compliance requirement for demonstrating that risk alerts were generated and
  acted upon.
- **Event lifecycle JSONL** (90 days) is purely operational -- it contains system events, not regulatory data. If a
  regulatory event type is added to the lifecycle stream, it must be duplicated to an appropriate compliance-tier
  prefix.
