# Multi-Cloud Migration Guide

**Last consolidated:** 2026-02-09

This document consolidates the multi-cloud (GCP + AWS) migration guide and the AWS execution checklist.

---

## Part 1: Migration Overview

### Goal

Make the entire system AWS-ready by updating all GCP-specific code to cloud-agnostic patterns. **One codebase, two cloud providers, environment-variable switchable.**

### Prerequisites

**GCP:** Already complete. Verify with:

```bash
gcloud auth list
gcloud services list --enabled
gsutil ls
```

**AWS:** Setup required. See `configs/checklist.prerequisites.yaml` and the steps below.

---

## Part 2: Code Migration

### Step 1: Update Imports

**Before (GCP-specific):**

```python
from google.cloud import storage, bigquery, secretmanager
```

**After (Cloud-agnostic):**

```python
from unified_trading_library import (
    get_storage_client,
    get_secret_client,
    get_query_client,
    get_secret,
)
```

### Step 2: Update Storage Operations

**Before:**

```python
from google.cloud import storage
client = storage.Client()
bucket = client.bucket("my-bucket-test-project")
blob.upload_from_filename("/local/file.parquet")
```

**After:**

```python
from unified_trading_library import get_storage_client
client = get_storage_client()
client.upload_file("my-bucket", "path/to/file.parquet", "/local/file.parquet")
```

### Step 3: Update Secret Retrieval

**After:**

```python
from unified_trading_library import get_secret
api_key = get_secret(
    secret_name="tardis-api-key",
    fallback_env_var="TARDIS_API_KEY",
)
```

### Step 4: Environment Variables

Add to `.env.example`:

```bash
CLOUD_PROVIDER=gcp  # or "aws"
GCP_PROJECT_ID=test-project
AWS_ACCOUNT_ID=123456789012
AWS_REGION=us-east-1
```

### Step 5: Bucket Templates

**Rule:** All bucket templates must use `{project_id}`, not hardcoded project IDs.

```
GCP:  instruments-store-cefi-test-project
AWS:  instruments-store-cefi-test-project-aws
```

---

## Part 3: AWS Infrastructure Setup

### One-Time AWS Setup

```bash
# 1. Authenticate
aws configure
aws sts get-caller-identity

# 2. Shared infrastructure (S3, ECR, IAM, VPC, Batch)
cd terraform/shared/aws
terraform init && terraform plan && terraform apply

# 3. CI/CD (CodeBuild)
cd terraform/cloud-build/aws
terraform init && terraform plan && terraform apply

# 4. Authorize GitHub connection (AWS Console > Developer Tools > Connections)

# 5. Set secrets
aws secretsmanager put-secret-value --secret-id tardis-api-key --secret-string 'YOUR_KEY'
aws secretsmanager put-secret-value --secret-id databento-api-key --secret-string 'YOUR_KEY'
# ... etc
```

### Bucket Creation

```bash
# GCP
python scripts/setup-buckets.py --cloud gcp --dry-run
python scripts/setup-buckets.py --cloud gcp

# AWS
python scripts/setup-buckets.py --cloud aws --dry-run
python scripts/setup-buckets.py --cloud aws
```

### Validation

```bash
python deploy.py validate-buckets --service instruments-service --cloud gcp
python deploy.py validate-buckets --service instruments-service --cloud aws
```

---

## Part 4: Per-Service Checklist

| Service                        | Status      | Key Changes                                    |
| ------------------------------ | ----------- | ---------------------------------------------- |
| instruments-service            | Mostly done | Fix hardcoded IDs in scripts, add .env.example |
| market-tick-data-handler       | Check       | get_storage_client(), day={date} format        |
| market-data-processing-service | Check       | Cloud-agnostic storage, paths                  |
| features-delta-one-service     | Check       | Cloud-agnostic storage                         |
| features-calendar-service      | Done        | Uses StandardizedDomainCloudService            |
| ml-training-service            | Check       | GCS reader cloud-agnostic                      |
| ml-inference-service           | Check       | Feature subscriber AWS-ready                   |
| strategy-service               | Check       | Cloud-agnostic storage                         |
| execution-service              | Check       | ~80 files with GCS refs                        |

---

## Part 5: Cloud-Agnostic Test Template

Create `tests/unit/test_cloud_agnostic.py` in each service:

- Verify no direct `from google.cloud import` or `import boto3`
- Verify bucket templates use `{project_id}`
- Verify paths use `day={date}` format
- Verify `CLOUD_PROVIDER=aws` is respected

---

## Part 6: unified-trading-library (Core Library)

- `get_storage_client()` returns GCS or S3 based on `CLOUD_PROVIDER`
- `get_secret()` works with GCP Secret Manager and AWS Secrets Manager
- `get_query_client()` works with BigQuery and Athena

---

## Part 7: Deployment Commands

**GCP:**

```bash
export CLOUD_PROVIDER=gcp
./deploy instruments-service --backend vm --date 2023-01-01
```

**AWS:**

```bash
export CLOUD_PROVIDER=aws
export AWS_PROJECT_ID=test-project-aws
./deploy instruments-service --backend aws-batch --date 2023-01-01
```

---

## Part 8: Success Criteria

- [ ] `CLOUD_PROVIDER=gcp` works (current)
- [ ] `CLOUD_PROVIDER=aws` works (after migration)
- [ ] Same code runs on both clouds
- [ ] Only env vars differ between deployments
- [ ] Data structures identical

---

## Part 9: Rollback

If issues arise, set `CLOUD_PROVIDER=gcp` to use the original GCP implementation.
