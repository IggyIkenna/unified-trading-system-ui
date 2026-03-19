# Intent-Level API Pattern (Service Protocol Abstraction)

**Standard:** Services declare WHAT + MODE. Libraries decide HOW. Deployment injects WHERE.

## The Rule

A service file MUST NEVER contain these words in source code: `gcs`, `gcp`, `bigquery`, `s3`, `pubsub`, `sqs`, `redis`,
`cloudtarget`, `bucket`, `dataset`, `upload_to_gcs`

Those words belong **only** in:

- `unified-cloud-interface/providers/` (UCI provider boundary)
- `deployment-service/terraform/` (Terraform is exempt)
- `deployment-service/configs/services/*/batch.env` (deployment config)

## Factory Functions (from `unified_cloud_interface`)

```python
from unified_cloud_interface import get_data_sink, get_data_source, get_event_bus, get_service_mode

# Write structured data (parquet/json/bytes)
sink = get_data_sink(routing_key="cefi")
sink.write(df, partition={"day": "2024-01-01"}, format="parquet", filename="BTC-USDT.parquet")

# Read structured data
source = get_data_source(routing_key="cefi")
df = source.read(partition={"day": "2024-01-01"}, format="parquet")

# Publish events
bus = get_event_bus()
bus.publish("instruments.updated", payload_bytes)

# Read deployment mode (live | batch)
mode = get_service_mode()  # ServiceMode.LIVE or ServiceMode.BATCH
```

## routing_key Convention

Multi-bucket services (features, instruments, market-data) use `routing_key` to select the bucket:

| routing_key | Env var read by factory               |
| ----------- | ------------------------------------- |
| `"cefi"`    | `PROTOCOL_DATA_SINK_BUCKET_CEFI`      |
| `"tradfi"`  | `PROTOCOL_DATA_SINK_BUCKET_TRADFI`    |
| `"defi"`    | `PROTOCOL_DATA_SINK_BUCKET_DEFI`      |
| `None`      | `PROTOCOL_DATA_SINK_BUCKET` (default) |

Single-bucket services omit `routing_key` and rely on `PROTOCOL_DATA_SINK_BUCKET`.

## Backends (PROTOCOL_DATA_SINK_BACKEND)

| Backend    | When to use                                   | UCI class          |
| ---------- | --------------------------------------------- | ------------------ |
| `gcs`      | GCP batch/live                                | `StorageDataSink`  |
| `s3`       | AWS batch/live                                | `StorageDataSink`  |
| `bigquery` | GCP live streaming inserts (small row counts) | `BigQueryDataSink` |
| `athena`   | AWS S3+Glue batch (large datasets)            | `AthenaDataSink`   |
| `local`    | Dev / CI (no credentials, writes to temp dir) | `LocalDataSink`    |

## Path Structure (Service's Responsibility)

Services OWN their partition structure — that is domain knowledge, not infra:

```python
# Good: service defines the partition keys and filename
sink.write(
    parquet_bytes,
    partition={"day": date_str, "feature_group": feature_group, "timeframe": timeframe},
    format="bytes",
    filename=f"{instrument_id}.parquet",
)

# Bad: service constructs gs:// paths
path = f"gs://{self.bucket}/features/day={date}/..."  # NO
```

## Migration from StandardizedDomainCloudService

```python
# Before (deprecated — leaks GCS/BQ details)
from unified_trading_library import StandardizedDomainCloudService
service = StandardizedDomainCloudService("features", cloud_target=CloudTarget(gcs_bucket=..., bigquery_dataset=...))
service.upload_to_gcs_batch(uploads)

# After (UCI intent API)
from unified_cloud_interface import get_data_sink
sink = get_data_sink(routing_key="cefi")
sink.write(df, partition={"day": date_str}, format="parquet")
```

## Deployment Config

Per-service `PROTOCOL_*` env vars live in:

- `deployment-service/configs/services/<service>/batch.env`
- `deployment-service/configs/services/<service>/live.env`
- Schema documented in `deployment-service/configs/protocol-config-schema.yaml`

Deployment bootstrap injects these at Cloud Run / ECS task startup.

## Quality Gate Check (STEP 5.11 / 5.12)

The quality gate rejects service PRs that contain protocol-leaking symbols:

```bash
rg -l "CloudTarget|upload_to_gcs|gcs_bucket|bigquery_dataset|StandardizedDomainCloudService" \
    --type py --glob '!.venv*' --glob '!tests' .
# Any match = FAIL
```

See: `06-coding-standards/quality-gates-service-template.sh` (STEP 5.10, 5.11, 5.12)
