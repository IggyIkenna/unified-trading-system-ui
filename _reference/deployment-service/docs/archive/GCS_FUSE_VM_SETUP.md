# GCS FUSE Setup

This guide covers GCS FUSE for **three distinct targets**:

1. **VM Jobs** (all 12 pipeline services) — faster parquet reads via Ubuntu + gcsfuse
2. **Cloud Run Jobs** (all 10 GCP services) — GCS volume mounts via Terraform
3. **Deployment API Service** (Cloud Run) — all buckets mounted in cloudbuild.yaml for data status, service status, config discovery

**Exception:** When `DEPLOYMENT_ENV=development` (local dev), the deployment API uses the GCS API instead of FUSE. Pipeline jobs always use FUSE when mounts exist.

---

## Part A: VM Jobs

### Implementation

All **12 pipeline services** have `gcsfuse_buckets` in their sharding configs under `compute.vm`:

- instruments-service, corporate-actions, market-tick-data-handler, market-data-processing-service
- features-calendar-service, features-delta-one-service, features-volatility-service, features-onchain-service
- ml-training-service, ml-inference-service, strategy-service, execution-service

VM creation is done by **Python** (`backends/vm.py`) via the Compute Engine API. When `gcsfuse_buckets` is present in `compute_config`, the backend:

- Uses Ubuntu 22.04 LTS image instead of COS
- Uses cloud-init that installs gcsfuse, mounts each bucket at `/mnt/gcs/{bucket}`, then runs the container with `-v /mnt/gcs:/mnt/gcs`
- Passes `GCS_FUSE_MOUNT_PATH=/mnt/gcs` and omits `UNIFIED_CLOUD_SERVICES_USE_DIRECT_GCS`

---

## Part B: Cloud Run Jobs (Pipeline Services)

Terraform `container-job` module supports `gcs_volumes`. Each of the 10 GCP services has GCS volume mounts in Terraform `main.tf`. Jobs receive `GCS_FUSE_MOUNT_PATH=/mnt/gcs` and do not get `UNIFIED_CLOUD_SERVICES_USE_DIRECT_GCS` when FUSE mounts exist.

---

## Part C: Deployment API Service (Cloud Run)

The deployment dashboard mounts all required buckets in **cloudbuild.yaml**: instruments-store, market-data-tick, features-_, ml-_, strategy-store, execution-store, deployment-orchestration. **storage_facade.py** uses FUSE when `DEPLOYMENT_ENV=production`. Local dev (`DEPLOYMENT_ENV=development`) uses the GCS API.

---

## VM Implementation: Step-by-Step

### 1. Ubuntu image in Python VM backend

In `backends/vm.py`, when `gcsfuse_buckets` is in compute_config:

- Use Ubuntu 22.04 LTS image instead of COS (`ubuntu-os-cloud/ubuntu-2204-lts`)
- Use the GCS FUSE cloud-init template

### 2. GCS FUSE cloud-init template (Python Jinja2)

Add `CLOUD_INIT_GCSFUSE_TEMPLATE` in `backends/vm.py`:

The template (Jinja2) installs gcsfuse, mounts each bucket at `/mnt/gcs/{bucket}`, and runs the container with `-v /mnt/gcs:/mnt/gcs`. The `gcsfuse_buckets` variable is a comma-separated list of bucket names (with `{project_id}` already substituted).

**gcsfuse install (Ubuntu 22.04):**

```bash
# Ubuntu 22.04 (Jammy)
export GCSFUSE_REPO=gcsfuse-$(lsb_release -c -s)  # -> gcsfuse-jammy
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt $GCSFUSE_REPO main" | sudo tee /etc/apt/sources.list.d/gcsfuse.list
sudo apt-get update && sudo apt-get install -y gcsfuse
```

### 3. UCS mount path matching

unified-trading-library looks for paths in this order:

| Priority | Path                                 | When used                                  |
| -------- | ------------------------------------ | ------------------------------------------ |
| 1        | `GCS_FUSE_MOUNT_PATH` env var        | If set, `{GCS_FUSE_MOUNT_PATH}/{gcs_path}` |
| 2        | `/mnt/gcs/{bucket}/{gcs_path}`       | Linux standard                             |
| 3        | `/gcs/{bucket}/{gcs_path}`           | Alternative                                |
| 4        | `~/gcs/{bucket}/{gcs_path}`          | User home                                  |
| 5        | `/mnt/disks/gcs/{bucket}/{gcs_path}` | GCE default                                |

With the bind mount `-v /mnt/gcs:/mnt/gcs`, the container sees `/mnt/gcs/{bucket}/...`. UCS builds paths as `/mnt/gcs/{bucket}/{gcs_path}` when checking `_check_gcs_fuse_mount`. So it will find the files.

**Important:** Do NOT set `UNIFIED_CLOUD_SERVICES_USE_DIRECT_GCS=1` when using GCS FUSE. That skips the FUSE lookup.

### 4. Service account permissions

The VM service account needs `roles/storage.objectViewer` (or equivalent) on the buckets. This is usually already in place.

---

## Quick Reference: gcsfuse Installation (Official Google Docs)

**Ubuntu/Debian (apt) - from https://cloud.google.com/storage/docs/gcsfuse-install:**

```bash
# 1. Install prerequisites
sudo apt-get update
sudo apt-get install -y curl lsb-release fuse

# 2. Add Cloud Storage FUSE repo
export GCSFUSE_REPO=gcsfuse-$(lsb_release -c -s)
echo "deb [signed-by=/usr/share/keyrings/cloud.google.asc] https://packages.cloud.google.com/apt $GCSFUSE_REPO main" | sudo tee /etc/apt/sources.list.d/gcsfuse.list

# 3. Import Google Cloud public key
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo tee /usr/share/keyrings/cloud.google.asc

# 4. Install gcsfuse
sudo apt-get update && sudo apt-get install -y gcsfuse
```

**If Ubuntu 22.04 (jammy) returns 404**, try the bionic repo:

```bash
export GCSFUSE_REPO=gcsfuse-bionic
```

**Mount a bucket:**

```bash
mkdir -p /mnt/gcs/my-bucket
gcsfuse --implicit-dirs my-bucket /mnt/gcs/my-bucket
```

**Mount with options (recommended for production):**

```bash
gcsfuse --implicit-dirs --foreground=false my-bucket /mnt/gcs/my-bucket
```

**Troubleshooting (foreground + trace logs):**

```bash
gcsfuse --foreground --log-severity=TRACE my-bucket /mnt/gcs/my-bucket
```

---

## Alternative: Use Direct GCS

For VM jobs without `gcsfuse_buckets`, deployment sets `UNIFIED_CLOUD_SERVICES_USE_DIRECT_GCS=1` so UCS uses the GCS API. Works on COS, no extra setup.

---

## Summary

| Target             | Approach          | Setup                                                       | Benefit                         |
| ------------------ | ----------------- | ----------------------------------------------------------- | ------------------------------- |
| **VM Jobs**        | GCS FUSE          | Ubuntu + gcsfuse cloud-init + `gcsfuse_buckets` in sharding | 10–100x faster parquet reads    |
| **Cloud Run Jobs** | GCS FUSE          | Terraform `gcs_volumes` in container-job module             | Fast parquet reads              |
| **Deployment API** | FUSE (production) | cloudbuild.yaml volume mounts                               | Faster queries, fewer API calls |

**DEPLOYMENT_ENV**: `production` → FUSE when mounted; `development` → GCS API (local dev).
