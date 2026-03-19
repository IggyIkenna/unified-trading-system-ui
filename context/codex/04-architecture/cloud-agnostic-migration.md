# Cloud-Agnostic Migration

## TL;DR

All cloud I/O (storage, secrets, queues) must go through the abstraction layer provided by `unified-cloud-interface`
(UCI, Tier 0). Direct imports of `google.cloud.*` or `boto3` in application source code are a Phase 0 violation. The
`CLOUD_PROVIDER` environment variable switches the active provider at runtime without code changes.

**Naming rule:** Public-facing protocols and interface class names use the `Cloud*` prefix. Provider implementations
inside `providers/gcp.py` and `providers/aws.py` may use cloud-specific prefixes (`GCSStorageClient`,
`S3StorageClient`), but these must never appear in public re-exports or abstract class names.

See also: `04-architecture/TIER-ARCHITECTURE.md` § Naming Conventions (lines 91–96) for the canonical one-liner
statement of this rule.

---

## The Abstraction Layer

`unified-cloud-interface` (UCI) is a Tier 0 library. It exposes factory functions that return cloud-agnostic protocol
implementations:

| Factory function       | Returns protocol     | What it does                                               |
| ---------------------- | -------------------- | ---------------------------------------------------------- |
| `get_storage_client()` | `CloudStorageClient` | Read/write blobs (GCS bucket or S3)                        |
| `get_secret_client()`  | `CloudSecretClient`  | Access secrets (GCP Secret Manager or AWS Secrets Manager) |
| `get_queue_client()`   | `CloudQueueClient`   | Publish/subscribe (Pub/Sub or SQS/SNS)                     |

```python
from unified_cloud_interface import get_storage_client, get_secret_client
```

All service code must import from `unified_cloud_interface`. No other import path for cloud I/O is acceptable in
non-provider source files.

---

## CLOUD_PROVIDER Environment Variable

The `CLOUD_PROVIDER` env var controls which provider implementation is instantiated:

| Value   | Storage backend              | Secrets backend       |
| ------- | ---------------------------- | --------------------- |
| `gcp`   | GCS (`google.cloud.storage`) | GCP Secret Manager    |
| `aws`   | S3 (`boto3`)                 | AWS Secrets Manager   |
| `local` | Local filesystem             | Environment variables |

`CLOUD_PROVIDER` is read once at process start. GCP is the primary production provider; AWS is secondary. The `local`
provider is for development and unit tests only.

This env var is the **only** acceptable way to inject cloud provider choice. Never branch on
`os.getenv("CLOUD_PROVIDER")` in application code — the factory functions handle this.

---

## Naming Convention

### Protocols and Abstract Classes — `Cloud*` prefix (mandatory)

```python
# CORRECT — protocol uses Cloud* prefix
class CloudStorageClient(Protocol):
    def read(self, path: str) -> bytes: ...
    def write(self, path: str, data: bytes) -> None: ...

class CloudModelArtifactStore(Protocol):
    def save(self, model: object, path: str) -> None: ...
    def load(self, path: str) -> object: ...

class CloudEventSink(Protocol):
    def emit(self, event: str, metadata: dict[str, str]) -> None: ...
```

### Provider Implementations — cloud-specific prefix in `providers/` only

```python
# CORRECT — implementation in providers/gcp.py uses GCS* prefix
class GCSStorageClient:
    def read(self, path: str) -> bytes: ...

# CORRECT — implementation in providers/aws.py uses S3* prefix
class S3StorageClient:
    def read(self, path: str) -> bytes: ...
```

### Forbidden in public re-exports and abstract classes

```python
# WRONG — cloud-specific prefix in protocol
class GCSModelArtifactStore(Protocol): ...   # rename to CloudModelArtifactStore

# WRONG — cloud-specific prefix in __init__.py re-export
from .providers.gcp import GCSStorageClient as StorageClient  # do not re-export as public API
```

---

## Migration Guide — Before / After

### Storage reads and writes

```python
# BEFORE (direct GCS import — Phase 0 violation)
from google.cloud import storage
client = storage.Client(project="my-project")
bucket = client.bucket("my-bucket")
blob = bucket.blob("path/to/file.parquet")
blob.upload_from_string(data)

# AFTER (cloud-agnostic via UCI)
from unified_cloud_interface import get_storage_client
storage_client = get_storage_client()
storage_client.write("gs://my-bucket/path/to/file.parquet", data)
```

### Secret access

```python
# BEFORE (direct GCP Secret Manager import — Phase 0 violation)
from google.cloud import secretmanager
client = secretmanager.SecretManagerServiceClient()
name = f"projects/{project}/secrets/{secret_name}/versions/latest"
response = client.access_secret_version(name=name)
api_key = response.payload.data.decode("utf-8")

# AFTER (cloud-agnostic via UCI)
from unified_cloud_interface import get_secret_client
api_key = get_secret_client().access_secret("tardis-api-key")
```

### Pub/Sub message publishing

```python
# BEFORE (direct Pub/Sub import — Phase 0 violation)
from google.cloud import pubsub_v1
publisher = pubsub_v1.PublisherClient()
topic_path = publisher.topic_path(project_id, topic_name)
publisher.publish(topic_path, data=message_bytes)

# AFTER (cloud-agnostic via UCI or UTS GCSEventSink/PubSubEventSink)
from unified_trading_services import PubSubEventSink
sink = PubSubEventSink(project_id=config.gcp_project_id, topic=config.events_topic)
sink.emit("DATA_BROADCAST", metadata={"messages_published": 100})
```

---

## ModelArtifactStore — T0 Protocol, T3 Concrete Implementation

`ModelArtifactStore` is a pure abstract protocol living at Tier 0. The concrete implementation `CloudModelArtifactStore`
lives in `unified-domain-client` (T3) and uses `get_storage_client()` from UCI (T0). ML services (T4) import the T0
protocol only; the concrete implementation is injected at startup via dependency injection.

```python
# ML service (T4) — imports T0 protocol only
from unified_internal_contracts import ModelArtifactStore

class MyInferenceService:
    def __init__(self, artifact_store: ModelArtifactStore) -> None:
        self._store = artifact_store

# CLI entrypoint — injects T3 concrete implementation
from unified_domain_client import CloudModelArtifactStore
service = MyInferenceService(artifact_store=CloudModelArtifactStore(...))
```

---

## Phase 0 Detection

The Phase 0 baseline check (see `06-coding-standards/pre-sprint-baseline.md`) flags direct cloud imports with:

```bash
rg "from google\.cloud|import boto3" --type py \
  --glob '!.venv*' --glob '!providers' <source_dir>/
```

Zero results are required to pass Phase 0. The `--glob '!providers'` exclusion permits cloud imports inside
`providers/gcp.py` and `providers/aws.py` — nowhere else.

---

## Related

- Tier architecture and `Cloud*` naming rule: `04-architecture/TIER-ARCHITECTURE.md` § Naming Conventions
- Secrets management detail: `07-security/secrets-management.md`
- Cursor rule: `.cursor/rules/core/cloud-agnostic.mdc`
- Phase 0 baseline: `06-coding-standards/pre-sprint-baseline.md`
