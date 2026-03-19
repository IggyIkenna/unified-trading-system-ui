# Cache Strategy and State Management

**Last consolidated:** 2026-02-09

This document consolidates the API caching architecture and deployment state management.

---

## Part 1: Cache Strategy

### Architecture

Three-tier caching:

| Tier | Backend   | Speed     | Persistence          | Scope                   |
| ---- | --------- | --------- | -------------------- | ----------------------- |
| 1    | In-Memory | ~0.1ms    | ❌ Lost on restart   | Per-instance            |
| 2    | Redis     | ~1-5ms    | ❌ Lost on restart   | Shared (if configured)  |
| 3    | GCS       | ~50-200ms | ✅ Survives restarts | Shared across instances |

**Read path:** In-Memory → Redis → GCS → Fetch
**Write path:** Fetch → In-Memory + Redis + GCS (async)

### TTL Guidelines

| Data Type       | TTL   | Persist to GCS? |
| --------------- | ----- | --------------- |
| Health checks   | 5s    | No              |
| Deployment list | 20s   | No              |
| Service status  | 120s  | Yes             |
| Data status     | 300s  | Yes             |
| Build info      | 300s  | Yes             |
| Trigger IDs     | 3600s | Yes             |

### Configuration

- `REDIS_URL`: Redis connection (optional)
- `STATE_BUCKET`: `deployment-orchestration-{project}` for persistent cache
- GCS cache location: `gs://{STATE_BUCKET}/cache/unified_cache.json`

### Key Rule

**None values are NOT cached** — prevents infinite re-fetch loops when fetch returns "no data found."

---

## Part 2: State Management

### Critical Principle: Never Assume Success

A shard can ONLY be marked as `SUCCEEDED` if:

1. **Has a valid `job_id`** — proves a VM was actually launched
2. **GCS status file contains "SUCCESS"** — proves the job completed

If either condition fails → shard is marked `FAILED`.

### Status Determination Flow (VM Backend)

```
VM Exists?
├─ YES (RUNNING) → ShardStatus.RUNNING
├─ YES (TERMINATED) → Check GCS status file
│   ├─ SUCCESS → ShardStatus.SUCCEEDED
│   ├─ FAILED → ShardStatus.FAILED
│   └─ No file → ShardStatus.FAILED
└─ NO → Check GCS status file (if status_bucket configured)
    ├─ SUCCESS → ShardStatus.SUCCEEDED
    └─ No file / FAILED → ShardStatus.FAILED
```

### GCS State Structure

**Environment separation:**

- `deployments.development/` — local development (default)
- `deployments.production/` — Docker/Cloud Run

Controlled by `DEPLOYMENT_ENV`.

**Bucket:** `deployment-orchestration-{project}` (NOT `terraform-state-*`)

```
gs://deployment-orchestration-test-project/
├── deployments.development/
│   └── {deployment-id}/
│       ├── state.json
│       └── {shard-id}/
│           ├── status   # "SUCCESS:timestamp" or "FAILED:timestamp"
│           └── logs.txt
└── deployments.production/
    └── ...
```

### State Update Mechanisms

1. **Manual refresh:** `POST /api/deployments/{id}/refresh` — UI-triggered
2. **Auto-sync:** Background task every 60s — scans running deployments, checks GCS status, updates shards
3. **Deployment worker:** Launches initial shards; auto-sync takes over

### Common Failure Modes

| Scenario                  | GCS Status | job_id | Result    |
| ------------------------- | ---------- | ------ | --------- |
| Normal success            | SUCCESS    | ✓      | SUCCEEDED |
| Normal failure            | FAILED     | ✓      | FAILED    |
| VM crashed before writing | None       | ✓      | FAILED    |
| Launch failed             | None       | ✗      | FAILED    |

### Historical Bugs (Fixed)

- **Bug #1:** Auto-sync looked in `terraform-state-*` instead of `deployment-orchestration-*` — fixed.
- **Bug #2:** Assumed SUCCESS without verification when status_bucket not configured — now assumes FAILED.
- **Bug #3:** Batch refresh could mark shards SUCCEEDED without job_id — safety checks added.

---

## Part 3: VM Self-Deletion and Zombie Prevention

### Overview

**Purpose:** VMs automatically delete themselves after completing their job to minimize costs and prevent orphaned VMs.

**Status:** ✅ Implemented (Feb 10, 2026) - Commit 7ab7739

### Self-Deletion Flow

```
Job Completes → Write GCS Status File
  ↓
Staggered Delay (batch_index × delay_seconds)
  ↓
Retrieve Access Token from Metadata Server (3 attempts)
  ↓
Self-Delete via GCP API (10 retries with exponential backoff)
  ├─ SUCCESS (HTTP 200/204) → VM deletes itself
  └─ FAILURE (after 10 retries) → Write ZOMBIE marker → Force shutdown
```

### Batch Staggering

**Problem:** Large deployments (100+ VMs) hitting GCP delete API simultaneously → rate limiting

**Solution:** Staggered deletion delays

```yaml
# Example: Deployment with 100 VMs
vm_config:
  self_delete: true
  delete_batch_delay_seconds: 45 # Default

# VM 1: deletes immediately
# VM 2: waits 45 seconds
# VM 3: waits 90 seconds
# VM N: waits (N-1) × 45 seconds
```

**Formula:** `sleep $(( batch_index * delay_seconds ))`

**Benefits:**

- Spreads 100 VMs over ~75 minutes
- Avoids GCP rate limits (quota: ~20 deletes/min)
- VMs still terminate quickly relative to job duration

### ZOMBIE Marker System

**What is a ZOMBIE?**

A VM that completed its job but **failed to self-delete** after 10 API retry attempts.

**Why ZOMBIE markers?**

Without a marker, orchestrator sees:

- VM terminated (status = TERMINATED)
- GCS status = "SUCCESS"
- **Assumption:** Job succeeded and VM deleted normally

**Problem:** VM might still exist (consuming costs), but orchestrator thinks it's gone.

**Solution:** ZOMBIE marker in GCS

```
# Normal success
gs://{bucket}/deployments.{env}/{deployment_id}/{shard_id}/status
Content: SUCCESS:2026-02-10T12:34:56Z

# Deletion failure
Content: ZOMBIE:2026-02-10T12:35:30Z:deletion_failed_after_10_retries
```

### ZOMBIE Handling

**VM Behavior (on deletion failure):**

1. Write ZOMBIE marker to GCS (reuses existing GCS token from status write)
2. Log warning: "❌ VM deletion failed after all retries"
3. Sleep 30 seconds (grace period for GCS write to complete)
4. Force shutdown: `sudo poweroff` (prevents VM from running forever)

**Orchestrator Behavior:**

```python
# In _check_gcs_status()
status_part = content.split(":")[0]  # "SUCCESS", "FAILED", or "ZOMBIE"

if status_part == "ZOMBIE":
    logger.warning(f"VM {shard_id} marked as ZOMBIE (failed to self-delete): {content}")
    return JobStatus.FAILED  # Mark shard as failed

# In cleanup_zombie_vms()
for shard_id in shard_ids:
    gcs_status = self._check_gcs_status(deployment_id, shard_id)
    if gcs_status == "ZOMBIE":
        # Attempt to delete the VM via API
        success = self.cancel_job(job_id)
        if success:
            logger.warning(f"✅ Cleaned up ZOMBIE VM {job_id}")
```

**UI Impact:**

- Shard shows as `FAILED` (with ZOMBIE reason)
- Deployment dashboard shows warning for zombie cleanup
- Admin can manually trigger `cleanup_zombie_vms()` if needed

### Access Token Validation

**Problem:** Metadata server occasionally returns empty or malformed tokens

**Solution:** Token retrieval with validation (3 attempts)

```bash
for token_attempt in 1 2 3; do
  TOKEN_RESPONSE=$(curl -s --max-time 30 -H "Metadata-Flavor: Google" \\
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token")

  if [ $? -eq 0 ] && [ -n "$TOKEN_RESPONSE" ]; then
    ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")
    if [ -n "$ACCESS_TOKEN" ]; then
      echo "Access token retrieved successfully"
      break
    fi
  fi
  echo "Token retrieval attempt $token_attempt failed"
  [ "$token_attempt" -lt 3 ] && sleep 5
done

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ CRITICAL: Failed to retrieve access token after 3 attempts"
  echo "Cannot self-delete via API - will attempt ZOMBIE marker and force shutdown"
fi
```

### Exponential Backoff for Deletion

**Retry Schedule (10 attempts):**

| Attempt | Wait Before | Cumulative Wait |
| ------- | ----------- | --------------- |
| 1       | 0s          | 0s              |
| 2       | 25s         | 25s             |
| 3       | 35s         | 60s             |
| 4       | 45s         | 105s            |
| 5       | 55s         | 160s            |
| 6       | 65s         | 225s            |
| 7       | 75s         | 300s (5 min)    |
| 8       | 85s         | 385s            |
| 9       | 95s         | 480s (8 min)    |
| 10      | 105s        | 585s (~10 min)  |

**Formula:** `sleep $((15 + attempt * 10))`

**Total Time:** Up to 10 minutes of retries before ZOMBIE marker

### GCS Token Reuse

**Optimization:** Reuse GCS token from status file write

```bash
# Line 202: Get GCS token for status write
GCS_TOKEN=$(curl -s --max-time 30 -H "Metadata-Flavor: Google" \\
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token")

# Line 290: Reuse token for ZOMBIE marker write (if deletion fails)
if [ -n "$GCS_TOKEN" ]; then
  curl -s --max-time 60 -X POST \\
    -H "Authorization: Bearer $GCS_TOKEN" \\
    -H "Content-Type: text/plain" \\
    --data "$ZOMBIE_CONTENT" \\
    "https://storage.googleapis.com/upload/storage/v1/b/$GCS_BUCKET/o?uploadType=media&name=$STATUS_OBJECT"
fi
```

**Benefit:** No additional metadata server call (token already cached)

### Force Shutdown Safety

**Why force shutdown?**

If deletion fails, VM must NOT run forever (cost/quota waste).

**Mechanism:**

```bash
echo "Forcing VM shutdown in 30 seconds to prevent zombie state..."
sleep 30  # Grace period for GCS writes to complete
echo "Initiating forced shutdown..."
sudo poweroff
```

**Safety:**

- 30-second grace period ensures GCS writes complete
- `sudo poweroff` is clean shutdown (not kill signal)
- Prevents orphaned processes or corrupted writes

### Monitoring and Cleanup

**How to detect zombies:**

```bash
# Check GCS for ZOMBIE markers
gsutil cat "gs://deployment-orchestration-{project}/deployments.production/{deployment-id}/*/status" | grep ZOMBIE
```

**How to cleanup:**

```python
# Via API endpoint (not yet implemented)
POST /api/deployments/{deployment_id}/cleanup-zombies
```

**Manual cleanup:**

```bash
# Find zombie VMs
gcloud compute instances list --filter="name~{service}-" --zones={zone}

# Delete specific zombie
gcloud compute instances delete {instance-name} --zone={zone} --quiet
```

### Cost Impact

**Scenario: 100 VM deployment, 1 hour jobs**

**Without self-deletion:**

- VMs run indefinitely until manual cleanup
- Cost: $0.2088/hour × 100 VMs × 24 hours = **$501/day**

**With self-deletion:**

- VMs delete 1-2 minutes after job completion
- Cost: $0.2088/hour × 100 VMs × 1.03 hours = **$21.51**
- **Savings: $479/day (96%)**

**With ZOMBIE handling:**

- Failed deletions cleaned up within 10 minutes
- Max cost: $0.2088/hour × 1 VM × 0.17 hours = **$0.04 per zombie**
- Even with 10% zombie rate: **$21.91 vs $501**

### Configuration

**Enable self-deletion (default: enabled):**

```yaml
# In deployment creation
vm_backend:
  self_delete: true
  delete_batch_delay_seconds: 45
```

**GCS status bucket (required for ZOMBIE detection):**

```python
# deployment-service/config.py
status_bucket = "deployment-orchestration-{project}"
```

### Testing

**Verify self-deletion works:**

```bash
# 1. Launch test deployment
curl -X POST http://localhost:8080/api/deployments \
  -H "Content-Type: application/json" \
  -d '{"service":"test-service","shards":[{"cli_args":"--test"}]}'

# 2. Monitor VM lifecycle
gcloud compute instances list --filter="name~test-service-"

# 3. Wait for job completion + 2 minutes
# VM should disappear from list

# 4. Check GCS status
gsutil cat "gs://deployment-orchestration-{project}/deployments.production/{deployment-id}/*/status"
# Should show: SUCCESS:2026-02-10T12:34:56Z (not ZOMBIE)
```

**Trigger ZOMBIE scenario (for testing):**

```bash
# Temporarily break deletion API (e.g., revoke VM service account permissions)
gcloud projects remove-iam-policy-binding {project} \
  --member="serviceAccount:{vm-sa}@{project}.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"

# Launch deployment
# VMs will fail to delete and write ZOMBIE markers

# Restore permissions and cleanup
gcloud projects add-iam-policy-binding {project} ... # (restore IAM)
# Orchestrator should detect and cleanup zombies
```

---

## Part 4: Key Files

| File                        | Purpose                                                                   |
| --------------------------- | ------------------------------------------------------------------------- |
| `api/utils/cache.py`        | UnifiedCache, TTL constants                                               |
| `backends/vm.py`            | VM status, GCS status file reading, ZOMBIE detection, self-deletion logic |
| `deployment/state.py`       | DeploymentState, ShardState models                                        |
| `api/routes/deployments.py` | batch_refresh, create_deployment                                          |
| `api/main.py`               | Auto-sync background task                                                 |
