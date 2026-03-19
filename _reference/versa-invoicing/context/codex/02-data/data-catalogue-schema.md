# Data Catalogue Schema

**SSOT for:** canonical schema for `unified-trading-pm/configs/data-catalogue.{service}.yaml` files (symlinked into `deployment-service/configs/`).

All `data-catalogue.*.yaml` files must conform to this schema. Validated by
`data_catalogue_refresh.plan.md#dc-catalogue-format-standard`.

---

## Required Fields Per Dataset Entry

```yaml
datasets:
  - dataset_id: instruments_cefi_binance # snake_case, globally unique
    category: cefi # cefi | tradfi | defi | sports | altdata | prediction
    service_owner: instruments-service # repo name that writes this dataset
    schema_ref: unified_internal_contracts.domain.instruments.InstrumentsSchema
    gcp_path: gs://instruments-cefi-batch/instrument_availability/
    aws_path: s3://instruments-cefi-batch/instrument_availability/
    partition_keys: [year, month, day] # Hive partition columns
    format: parquet # parquet | json | csv
    retention_days: 90
    last_updated: "2026-03-07T00:00:00Z" # ISO 8601 UTC; updated by service post-batch hook
    row_count_last_batch: 1234 # integer; updated by service post-batch hook
    status: available # available | empty | missing | deprecated
    mvp_tier: mvp_required # mvp_required | mvp_optional | post_mvp
```

---

## Field Rules

| Field                  | Type         | Rule                                                                                              |
| ---------------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| `dataset_id`           | string       | `{entity}_{category}_{source}` — globally unique across all catalogues                            |
| `category`             | enum         | `cefi \| tradfi \| defi \| sports \| altdata \| prediction`                                       |
| `service_owner`        | string       | Must match a repo name in `workspace-manifest.json`                                               |
| `schema_ref`           | string       | Fully-qualified Python import path to the UIC schema class or constant                            |
| `gcp_path`             | string       | Must start with `gs://`                                                                           |
| `aws_path`             | string       | Must start with `s3://`                                                                           |
| `partition_keys`       | list[str]    | Hive partition columns; minimum `[year, month, day]` for time-series                              |
| `format`               | enum         | `parquet \| json \| csv`; prefer parquet                                                          |
| `retention_days`       | int          | Must match GCS/S3 lifecycle rule in deployment-service Terraform                                  |
| `last_updated`         | ISO datetime | Auto-updated by `catalogue_updater.py` after each successful batch write                          |
| `row_count_last_batch` | int          | Auto-updated by `catalogue_updater.py`                                                            |
| `status`               | enum         | `available \| empty \| missing \| deprecated`                                                     |
| `mvp_tier`             | enum         | `mvp_required \| mvp_optional \| post_mvp` — set by `data_catalogue_refresh.plan.md#dc-mvp-split` |

---

## Optional Fields

| Field                 | Type      | Description                                                 |
| --------------------- | --------- | ----------------------------------------------------------- |
| `description`         | string    | Human-readable summary of the dataset                       |
| `tags`                | list[str] | Free-form tags for discovery, e.g. `[ohlcv, candles, cefi]` |
| `sla_freshness_hours` | int       | Maximum acceptable staleness in hours before alerting       |
| `depends_on`          | list[str] | Upstream `dataset_id` values this dataset depends on        |

---

## Auto-Update Pattern

After each successful batch write, `instruments-service` (or the owning service) calls:

```python
from catalogue_updater import update_dataset_catalogue
update_dataset_catalogue(dataset_id="instruments_cefi_binance", row_count=1234)
```

`catalogue_updater.py` (to be created in `unified-cloud-interface` or `instruments-service`):

- Reads the existing `data-catalogue.{service}.yaml` from GCS/S3 or local config
- Updates `last_updated` and `row_count_last_batch`
- Writes back via `get_storage_client()`
- Emits `CATALOGUE_UPDATED` event via event bus

---

## Availability Audit Reports

Availability audits produce reports in:

- `deployment-service/configs/data-catalogue-gcp-availability-report.yaml`
- `deployment-service/configs/data-catalogue-aws-availability-report.yaml`

PASS threshold: >= 80% of declared datasets have `status: available`.

---

## References

- `data_catalogue_refresh.plan.md` — implementation plan (availability audit, MVP split, auto-update, metadata store)
- `unified-trading-pm/configs/data-catalogue.*.yaml` — per-service catalogue files (canonical data; symlinked into `deployment-service/configs/`)
- `00-SSOT-INDEX.md` — SSOT registry entry for data catalogue
