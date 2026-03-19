# VM Health Monitoring & gcsfuse Optimization

**Date:** 2026-02-10
**Status:** ✅ Implemented

## Summary

Implemented two-layer VM health monitoring to detect and terminate unhealthy VMs, plus removed gcsfuse from all domain services to eliminate OOM issues.

---

## Part 1: VM Health Monitoring (Two Defense Layers)

### Layer 1: Known Issue Detection (OOM Death Loop)

**Problem:** gcsfuse processes get OOM-killed by kernel, cloud-init restarts them, infinite loop. VM stays RUNNING but gcsfuse keeps dying.

**Solution:** Monitor serial console logs for OOM messages:

```python
# In auto_sync (api/main.py)
if "Out of memory: Killed process" count >= OOM_KILL_THRESHOLD (default: 5):
    backend.cancel_job_fire_and_forget(job_id, zone)
    mark_shard_failed(shard_id, reason="oom_death_loop")
```

**Settings:**

- `OOM_KILL_THRESHOLD=5` (default) - terminate after 5 OOM kills in serial logs

**When it triggers:**

- Checks VMs that have been RUNNING > 60 seconds
- Fetches last 8KB of serial console logs
- Counts "Out of memory: Killed process" occurrences
- Terminates immediately if threshold exceeded

---

### Layer 2: Unknown Issue Canary (Startup Timeout)

**Problem:** Unknown issues prevent VM from starting job - no OOM, just stuck. We want to catch ANY issue where the VM fails to make progress.

**Solution:** Check for standardized startup marker:

```python
# Service must emit "SERVICE_STARTED" or "Starting processing" to serial logs
if running_seconds > VM_STARTUP_TIMEOUT_SECONDS (default: 300):
    if "SERVICE_STARTED" not in serial_logs:
        backend.cancel_job_fire_and_forget(job_id, zone)
        mark_shard_failed(shard_id, reason="startup_timeout")
```

**Settings:**

- `VM_STARTUP_TIMEOUT_SECONDS=300` (5 minutes) - terminate if no startup signal

**When it triggers:**

- After VM has been RUNNING > 5 minutes
- If serial logs don't contain "SERVICE_STARTED" or "Starting processing"
- Catches: dependency install failures, config errors, network issues, etc.

**TODO:** Each service must emit startup marker:

```python
# In service main():
print("SERVICE_STARTED", flush=True)  # Goes to serial console
```

---

## Part 2: gcsfuse Optimization

### Problem

gcsfuse memory overhead caused OOM on VMs:

- 6 mounts × ~30 MB per mount = ~180 MB overhead
- Large buckets (market-data-tick: millions of files) → metadata cache bloat
- Type cache grows with directory depth
- Each mount = separate gcsfuse process

### Solution: Disable gcsfuse for All Domain Services

**Before:**

```yaml
# market-tick-data-handler
gcsfuse_buckets:
  - instruments-store-cefi-{project_id} # Input
  - instruments-store-defi-{project_id} # Input
  - instruments-store-tradfi-{project_id} # Input
  - market-data-tick-cefi-{project_id} # Output (no benefit!)
  - market-data-tick-defi-{project_id} # Output (no benefit!)
  - market-data-tick-tradfi-{project_id} # Output (no benefit!)
```

**After:**

```yaml
# All services: market-tick-data-handler, market-data-processing-service,
# instruments-service, features-*, ml-*, strategy-service, execution-service
gcsfuse_buckets: []
  # Disabled: gcsfuse memory overhead too high for large buckets
  # All I/O via GCS API (unified-trading-library handles caching)
```

**Services updated (12 total):**

- market-tick-data-handler
- market-data-processing-service
- instruments-service
- features-volatility-service
- features-onchain-service
- features-delta-one-service
- features-calendar-service
- ml-inference-service
- ml-training-service
- strategy-service
- execution-service
- corporate-actions

**Benefits:**

- Eliminates ~180 MB gcsfuse overhead per VM
- No more OOM death loops from gcsfuse
- Simpler, more predictable memory usage
- unified-trading-library GCS client handles caching efficiently

---

## Part 3: UTD v2 API gcsfuse Optimization

### Problem

UTD v2 API (Cloud Run) mounted **18 buckets**:

- 3 instruments-store
- 3 market-data-tick
- 7 features
- 3 ML
- 2 strategy/execution

**Issue:** API only needs to read deployment STATE, not domain data.

### Solution: Mount Only STATE_BUCKET

**Before (cloudbuild.yaml):**

```yaml
# 18 volume mounts for domain service buckets + STATE_BUCKET
```

**After:**

```yaml
# Mount ONLY deployment-orchestration bucket for fast state reads
- "--add-volume=name=vol-deployment,type=cloud-storage,bucket=deployment-orchestration-${PROJECT_ID},readonly=false"
- "--add-volume-mount=volume=vol-deployment,mount-path=/mnt/gcs/deployment-orchestration-${PROJECT_ID}"
```

**Benefits:**

- Reduced from 18 mounts → 1 mount
- STATE_BUCKET is small (~few thousand files max with TTL)
- Fast state reads for deployment status
- Domain data accessed via GCS API when needed (data-status, service-status endpoints)

### State TTL Cleanup

**Problem:** Unbounded growth of STATE_BUCKET → gcsfuse metadata grows indefinitely.

**Solution:** Auto-cleanup in `auto_sync` (once per hour):

```python
# Cleanup deployments older than STATE_TTL_HOURS (default: 48)
if deployment age > 48 hours:
    delete_objects(STATE_BUCKET, f"deployments.{env}/{deployment-id}/")
```

**Settings:**

- `STATE_TTL_HOURS=48` (default) - keep last 48 hours of deployments

**When it runs:**

- Once per hour during auto_sync
- Checks `state.json` updated timestamp
- Deletes entire deployment directory (state.json + shard logs)

**Result:** STATE_BUCKET stays bounded, UI shows last 48 hours of deployments

---

## Part 4: Fire-and-Forget Orphan VM Deletion

### Problem

Old orphan termination:

- Deleted VMs one at a time (blocking)
- Waited for each delete operation to complete
- ~10 minutes to kill 20 VMs

**Cost impact:** Charged until API call completes, not until VM is gone.

### Solution: Parallel Fire-and-Forget

```python
# Fire up to 20 deletes in parallel, don't wait for completion
for job_id, zone in orphans[:20]:
    pool.submit(backend.cancel_job_fire_and_forget, job_id, zone)

# Track pending deletes
_pending_vm_deletes[job_id] = (timestamp, zone)

# Retry if still RUNNING after 30 seconds
if now - timestamp > 30 and VM still RUNNING:
    fire delete again
```

**Settings:**

- `ORPHAN_DELETE_MAX_PARALLEL=20` - fire up to 20 deletes per sync
- `ORPHAN_DELETE_RETRY_SECONDS=30` - retry if VM still RUNNING after 30s
- `AUTO_SYNC_INTERVAL_ACTIVE=30` - sync every 30 seconds when active (reduced from 5s to avoid rate limits)

**Benefits:**

- Minimize billing window (fire quickly, don't wait)
- Handle up to 20 orphans per 30-second cycle
- Retry if delete didn't complete
- Clean up tracking when VM disappears from vm_map

---

## Configuration Summary

### New Environment Variables

| Variable                      | Default | Description                                      |
| ----------------------------- | ------- | ------------------------------------------------ |
| `VM_STARTUP_TIMEOUT_SECONDS`  | 300     | Terminate if no startup signal after N seconds   |
| `OOM_KILL_THRESHOLD`          | 5       | Terminate after N OOM kills in serial logs       |
| `STATE_TTL_HOURS`             | 48      | Keep last N hours of deployment state            |
| `ORPHAN_DELETE_MAX_PARALLEL`  | 20      | Max concurrent delete requests                   |
| `ORPHAN_DELETE_RETRY_SECONDS` | 30      | Retry delete if VM still RUNNING after N seconds |
| `AUTO_SYNC_INTERVAL_ACTIVE`   | 30      | Seconds between syncs when active (was 5)        |

Add to `.env` / Cloud Run env vars as needed.

---

## Testing Checklist

### VM Health Monitoring

- [ ] Deploy a shard that will OOM (e.g., COINBASE with insufficient RAM)
- [ ] Verify auto_sync detects OOM in serial logs and terminates VM
- [ ] Verify shard marked `failed` with `failure_category=oom_death_loop`

- [ ] Deploy a shard with broken startup (e.g., missing dependency)
- [ ] Verify auto_sync terminates after 5 minutes (no startup signal)
- [ ] Verify shard marked `failed` with `failure_category=startup_timeout`

### gcsfuse Disabled

- [ ] Deploy market-tick-data-handler with `gcsfuse_buckets: []`
- [ ] Verify no gcsfuse processes in VM (`ps aux | grep gcsfuse` should be empty)
- [ ] Verify job completes successfully (reads instruments, writes tick data)
- [ ] Check memory usage - should be lower than before

### STATE_BUCKET TTL

- [ ] Check STATE_BUCKET size: `gsutil du -sh gs://deployment-orchestration-{project}/`
- [ ] Wait for TTL cleanup (once per hour)
- [ ] Verify deployments older than 48 hours are deleted
- [ ] Verify UI shows only last 48 hours of deployments

### Fire-and-Forget Orphan Deletion

- [ ] Create deployment with GCS-complete + VM-still-running orphans
- [ ] Verify auto_sync fires up to 20 deletes in parallel
- [ ] Check logs for `[FIRE_AND_FORGET] Delete initiated for {job_id}`
- [ ] Verify VMs disappear from GCP within 1-2 minutes

---

## Monitoring

### Key Log Messages

**OOM detection:**

```
[AUTO_SYNC] VM health check killed {job_id}: oom_death_loop - 7 OOM kills detected
```

**Startup timeout:**

```
[AUTO_SYNC] VM health check killed {job_id}: startup_timeout - No startup signal after 315s
```

**State TTL cleanup:**

```
[AUTO_SYNC] TTL cleanup: deleted {deployment_id} (age: 3d)
```

**Fire-and-forget orphan termination:**

```
[AUTO_SYNC] Fired 18 orphan VM deletes (job done)
[FIRE_AND_FORGET] Delete initiated for {job_id} (zone {zone})
```

### Metrics to Track

- OOM kill rate: how many VMs terminated for `oom_death_loop`
- Startup timeout rate: how many VMs terminated for `startup_timeout`
- STATE_BUCKET size: should stay bounded (< 5 GB with 48h TTL)
- Orphan termination latency: time from "GCS SUCCESS + VM RUNNING" to VM deleted

---

## Next Steps

1. **Add SERVICE_STARTED marker** to all services' main() functions
2. **Test OOM detection** on known-bad configuration (insufficient RAM)
3. **Test startup timeout** by breaking a service's startup (e.g., comment out imports)
4. **Monitor STATE_BUCKET size** over 1 week to verify TTL cleanup works
5. **Monitor orphan termination** in production - verify <2 minute latency

---

## Files Changed

- `api/main.py` - VM health checks, state TTL cleanup, fire-and-forget orphan deletion
- `api/settings.py` - New settings (VM_STARTUP_TIMEOUT_SECONDS, OOM_KILL_THRESHOLD, STATE_TTL_HOURS, etc.)
- `backends/vm.py` - cancel_job_fire_and_forget(), zone in vm_map
- `cloudbuild.yaml` - Reduced from 18 mounts to 1 (STATE_BUCKET only)
- `configs/sharding.*.yaml` - All 12 services: `gcsfuse_buckets: []`
