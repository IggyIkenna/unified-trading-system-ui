# Cloud-Agnostic Migration Guide

## Overview

This guide explains how deployment-service achieves cloud-agnostic design for the data layer.

## Migration Status

| Component                    | Status                   | Priority |
| ---------------------------- | ------------------------ | -------- |
| storage_facade               | Complete                 | -        |
| api/routes/data_status.py    | Migrated                 | P1       |
| api/routes/deployments.py    | Migrated                 | P1       |
| api/routes/service_status.py | Partial                  | P1       |
| backends/\*                  | **Complete (GCP + AWS)** | ✅       |
| scripts/\*                   | GCP-Only                 | P3       |

## Architecture Layers

### Layer 1: Data Layer (Cloud-Agnostic)

- GCS/S3 operations via `api/utils/storage_facade.py`
- Uses GCS FUSE when `DEPLOYMENT_ENV=production` and mounts exist
- Falls back to GCS API otherwise

### Layer 2: Infrastructure Layer (Cloud-Agnostic) ✅

- **GCP**: Compute Engine VMs via `backends/vm.py` (1,490 lines)
- **GCP**: Cloud Run Jobs via `backends/cloud_run.py` (566 lines)
- **AWS**: EC2 instances via `backends/aws_ec2.py` (383 lines)
- **AWS**: AWS Batch (Fargate) via `backends/aws_batch.py` (415 lines)
- **Factory**: `backends/provider_factory.py` with `CLOUD_PROVIDER` detection (196 lines)

**Total**: 3,338 lines of production-ready, cloud-agnostic compute backends

### Layer 3: Application Layer (Cloud-Agnostic)

- API routes use `storage_facade` (list_objects, list_prefixes, read_object_text, write_object_text)
- Orchestration uses abstractions
- Lock operations remain on GCS (require if_generation_match)

## Usage

### Correct: Use storage_facade

```python
from api.utils.storage_facade import list_objects, list_prefixes, object_exists, read_object_text, write_object_text

# List objects
objs = list_objects(bucket_name, prefix, max_results=50)

# List prefixes (directories)
prefixes = list_prefixes(bucket_name, prefix)

# Check existence
exists = object_exists(bucket_name, object_path)

# Read/write
text = read_object_text(bucket_name, object_path)
write_object_text(bucket_name, object_path, data)
```

### Incorrect: Direct GCS client

```python
from api.utils.gcs_client import get_storage_client

# Avoid - bypasses storage facade and GCS FUSE optimization
client = get_storage_client()
bucket = client.bucket(bucket_name)
blobs = list(bucket.list_blobs(prefix=prefix))
```
