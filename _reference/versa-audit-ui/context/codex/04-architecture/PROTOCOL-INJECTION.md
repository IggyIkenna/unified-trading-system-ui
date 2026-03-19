# N-Tier Protocol Injection Contract

**Last Updated:** 2026-03-06 **SSOT for:** How libraries know which cloud protocol to use at runtime. **Related:**
`unified-trading-pm/TOPOLOGY-DAG.md` · `deployment-service/configs/runtime-topology.yaml` **Implementation:**
`unified-cloud-interface/unified_cloud_interface/factory.py`

---

## The Core Invariant

```
Services declare WHAT they want to do + which MODE they run in.
Deployment injects HOW (which provider, which bucket/topic).
Libraries resolve the rest.
Services never read CLOUD_PROVIDER, bucket names, or topic names directly.
```

This invariant is enforced by `quality-gates.sh` STEP 5.10 (no direct cloud SDK imports) and STEP 5.11 (no
`CloudTarget`, `gcs_bucket`, `bigquery_dataset` field names in services).

---

## Injection Stack

```
workspace-manifest.json (PM)
  └── TOPOLOGY-DAG.md (PM) — tier map, which libraries belong where
        └── runtime-topology.yaml (deployment-service/configs/)
              └── Deployment injects env vars per service instance:
                    CLOUD_PROVIDER=gcp|aws|local
                    SERVICE_MODE=live|batch
                    PROTOCOL_DATA_SINK_BUCKET_{ROUTING_KEY_UPPER}=<bucket-name>
                    PROTOCOL_EVENT_BUS_TOPIC_{ROUTING_KEY_UPPER}=<topic-name>
                      └── UCI factory.py (T0 — unified-cloud-interface)
                            └── Resolves: StorageClient | DataSink | EventBus | QueueClient
                                  └── Service calls:
                                        get_data_sink(routing_key="features")
                                        get_event_bus(routing_key="orders")
                                        get_storage_client()
                                        get_secret_client()
                                          └── Zero cloud SDK knowledge in service code
```

---

## Tier Injection Points

| Tier               | Library                    | Injection role                                                                                                                                   |
| ------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| T0                 | `unified-cloud-interface`  | Defines all client ABCs + factory functions. Reads `CLOUD_PROVIDER` via `UnifiedCloudConfig`. Zero `os.getenv`. No service-specific knowledge.   |
| T1                 | `unified-config-interface` | `UnifiedCloudConfig` resolves env vars. All config values from here. Zero `os.getenv` in production source.                                      |
| T1                 | `unified-trading-library`  | Service runtime helpers (`BatchOrchestrator`, `StateStore`). Uses UCI factory. Never reads `CLOUD_PROVIDER` or `PROTOCOL_*` directly.            |
| T2/T3 (interfaces) | UMI, UTEI, UDC, etc.       | Use `get_data_sink(routing_key=...)` / `get_storage_client()` / `get_secret_client()`. Never instantiate providers. No `gcs_bucket` field names. |
| Services (T4)      | All services               | Call intent-level factory functions only. Declare `SERVICE_MODE`. Never import `google.cloud.*` or `boto3`.                                      |
| Deployment         | runtime-topology.yaml      | Sets all env vars per service deployment. Services are blind to GCP vs AWS.                                                                      |

---

## Factory Functions (UCI T0)

All live in `unified_cloud_interface.factory`:

```python
# Cloud-agnostic storage
get_storage_client(project_id=None) -> StorageClient
get_secret_client() -> SecretClient
get_queue_client() -> QueueClient

# Mode-agnostic data I/O (reads PROTOCOL_* env vars for bucket/topic routing)
get_data_sink(routing_key: str) -> DataSink
get_data_source(routing_key: str) -> DataSource
get_event_bus(routing_key: str) -> EventBus

# Compute/cache
get_analytics_client() -> AnalyticsClient
get_compute_client() -> ComputeClient
get_async_cache_client() -> AsyncCacheClient

# Mode
get_service_mode() -> ServiceMode  # live | batch
```

`CLOUD_PROVIDER` selects `gcp | aws | local`. `SERVICE_MODE` selects `live | batch` transport strategy.

---

## Env Var Naming Convention

```
CLOUD_PROVIDER=gcp|aws|local
SERVICE_MODE=live|batch

# Per routing key (set in runtime-topology.yaml per service):
PROTOCOL_DATA_SINK_BUCKET_FEATURES=features-store-cefi
PROTOCOL_DATA_SINK_BUCKET_INSTRUMENTS=instruments-store-cefi
PROTOCOL_DATA_SINK_BUCKET_EXECUTION=execution-results
PROTOCOL_DATA_SINK_BUCKET_ML_MODELS=ml-models-store

PROTOCOL_EVENT_BUS_TOPIC_ORDERS=projects/{project}/topics/orders
PROTOCOL_EVENT_BUS_TOPIC_FILLS=projects/{project}/topics/execution-fills
```

Routing key is the snake_case domain name (lowercase). Env var is `ROUTING_KEY.upper()`.

---

## Live vs Batch Wiring

| `SERVICE_MODE` | `DataSink` transport                     | `EventBus` transport                         |
| -------------- | ---------------------------------------- | -------------------------------------------- |
| `live`         | Object storage streaming writes (GCS/S3) | Message queue (PubSub/SQS)                   |
| `batch`        | Object storage bulk writes (GCS/S3)      | In-process (no queue — direct function call) |

The `runtime-topology.yaml` `co_location_rules` can override to `in_memory` for collocated services.

---

## What Services Must NOT Do

```python
# VIOLATION — never in service code
import os
bucket = os.getenv("GCS_BUCKET")  # banned
from google.cloud import storage   # banned outside UCI providers
import boto3                        # banned outside UCI providers

ct = CloudTarget(gcs_bucket="x")  # deleted from UDC/UTL
```

```python
# CORRECT — service code pattern
from unified_cloud_interface.factory import get_data_sink, get_storage_client

sink = get_data_sink(routing_key="features")
await sink.write(df, path="features/2024-01-01/data.parquet")

client = get_storage_client()
raw = client.download_bytes(bucket, path)  # bucket from config
```

---

## Enforcement

Quality gate STEP 5.10 (hard-fail): `rg "from google.cloud|import boto3|import botocore" --type py` Quality gate STEP
5.11 (hard-fail): `rg "CloudTarget|gcs_bucket|bigquery_dataset" --type py`

Both are in `quality-gates.sh`. Any violation blocks merge. Exceptions: `unified-cloud-interface/providers/` and
`deployment-service/terraform/` are exempt.

---

## Cross-References

- `unified-trading-pm/TOPOLOGY-DAG.md` — tier diagram (human-readable DAG)
- `deployment-service/configs/runtime-topology.yaml` — per-service env var wiring
- `unified-cloud-interface/unified_cloud_interface/factory.py` — implementation
- `unified-cloud-interface/unified_cloud_interface/protocol.py` — DataSink/DataSource/EventBus ABCs
- `unified-trading-pm/plans/active/service_protocol_abstraction.plan.md` — plan defining this architecture
- `unified-trading-pm/plans/active/topology_dag_pm_ssot.plan.md` — plan that created this doc
