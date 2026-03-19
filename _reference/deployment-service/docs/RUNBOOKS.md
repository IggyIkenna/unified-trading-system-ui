# Operations Runbooks

**Last consolidated:** 2026-02-09

This document consolidates operational runbooks for the unified trading deployment system.

---

## Part 1: 2025 Backfill Runbook (Optimized Mode)

For large backfills (year-scale) where shard counts can reach tens of thousands and the UI must remain responsive.

### Why Optimized Mode Exists

- Large deployments often require **rolling concurrency** (you cannot run 10k–50k jobs at once).
- Cloud Run has a **hard cap of 1000 running executions per region**, and the Job Run API has relatively low write quotas.
- The UI is fast only if it **doesn't download every shard** and **doesn't analyze logs** on every poll.

Optimized mode enables:

- **Quota-safe concurrency** (rolling scheduling + throttled launch rate)
- **Shard count reduction** (date chunking heuristics if you didn't explicitly set it)
- **Fast UI polling** (summary mode + paginated shard inspection)

### Recommended Workflow (UI)

1. **Select service** (e.g. `market-tick-data-handler`).
2. **Compute**
   - Prefer **Cloud Run** for broad, steady throughput.
   - Prefer **VM** when shards are heavy (e.g. venue overrides like COINBASE) or you need large RAM.
3. **Set date range**: `2025-01-01` → `2025-12-31`.
4. **Select categories**: `CEFI`, `TRADFI`, `DEFI`.
5. Turn on **Optimized mode**.
   - Keep the recommended **date granularity** (weekly/monthly) unless you have a strong reason.
   - Keep **max concurrent** at or below the suggested value (Cloud Run: ≤ 900).
6. **Dry run first**.
   - Review the "Advisor" warnings/notes in the dry-run result panel.
   - Confirm shard count is reasonable (monthly/weekly should reduce job count dramatically).
7. Click **Deploy Live**.

### Monitoring a Large Backfill (UI)

- The deployment details view polls with `skip_logs=true&summary=true` for speed.
- The **Shards** tab does not auto-load all shards. Use:
  - **Load page** (paginated) to inspect running/failed shards without downloading everything.
  - **Load all** only if you truly need the full shard list (can be slow for huge deployments).
- The **Logs** tab loads logs lazily when opened.

### Common Failure Modes & Fixes

#### 1) Cloud Run quota / 429s / "too many running executions"

- Lower **max concurrent** (stay ≤ 900).
- Expect rolling behavior for large shard counts.
- If a single region is saturated, Cloud Run backend may failover regions for launches; refresh uses region-aware batching.

#### 2) Vendor/API rate limits → shards "hang" in RUNNING

- Reduce **container max_workers**.
- Ensure key rotation is enabled via `SHARD_INDEX`/`TOTAL_SHARDS` (Optimized mode injects these for Cloud Run/VM).
- If failures are concentrated in one vendor/venue, reduce concurrency for that slice.

#### 3) Cloud Run memory/CPU constraints

- Cloud Run max memory is **32Gi**. If service configs suggest 64Gi/128Gi, use **VM** or resize the Job template.
- Avoid `skip_venue_sharding` on Cloud Run unless you are sure the Job template can handle the heavier shard payload.

#### 4) Long-running or stuck VM shards

- VM shards use `timeout_seconds` (from compute config). Auto-sync applies conservative "stuck" detection when a shard exceeds `timeout_seconds + grace`.
- Use **Refresh** and **Report** to see failure categories and retry patterns.

---

## Part 2: Status Tab Blank - Troubleshooting Guide

**Issue:** Status tab works for some users but shows blank/empty for others.
**Root Cause:** GCP permissions differences.

### Why Status Tab Might Be Blank

The Status tab needs access to **4 different GCP resources:**

1. **GCS Buckets** (Data timestamps)
2. **Deployment State Bucket** (Last deployment)
3. **Cloud Build API** (Last build)
4. **GitHub Token via Secret Manager** (Last code push)

If **any** of these fail, the tab might show blank or partial data.

### Required Permissions

#### 1. GCS Bucket Access (For Data Timestamps)

**Buckets needed:**

- `instruments-store-cefi-test-project`
- `instruments-store-tradfi-test-project`
- `instruments-store-defi-test-project`
- `market-data-tick-cefi-test-project`
- `market-data-tick-tradfi-test-project`
- `market-data-tick-defi-test-project`

```bash
# Check if you have access:
gsutil ls gs://instruments-store-cefi-test-project/ | head -5

# If fails, grant roles/storage.objectViewer
```

#### 2. Deployment State Bucket (For Last Deployment)

**Bucket:** `deployment-orchestration-test-project`

```bash
gsutil ls gs://deployment-orchestration-test-project/deployments/ | head -5
```

#### 3. Cloud Build API (For Last Build)

```bash
gcloud builds list --region=asia-northeast1 --limit=1
# Requires roles/cloudbuild.builds.viewer
```

#### 4. GitHub Token Access (For Last Code Push)

Requires **TWO** permissions:

**A. Secret Manager:**

```bash
gcloud projects add-iam-policy-binding test-project \
  --member="user:YOUR_EMAIL" \
  --role="roles/secretmanager.secretAccessor"
```

**B. Service Account impersonation:**

```bash
gcloud iam service-accounts add-iam-policy-binding \
  github-token-sa@test-project.iam.gserviceaccount.com \
  --project=test-project \
  --member="user:YOUR_EMAIL" \
  --role="roles/iam.serviceAccountTokenCreator"
```

### Diagnostic Steps

1. **Check API response:** `curl http://localhost:8000/api/service-status/instruments-service/status | python3 -m json.tool`
2. Look for `null` or `"error"` in `last_data_update`, `last_deployment`, `last_build`, `last_code_push`
3. Check backend logs for error messages
4. Check browser console (F12) for 403/404 on `/api/service-status/`

### Most Likely Issue

If Status tab works for one user but not another: the failing user likely lacks **GitHub token impersonation** (`roles/iam.serviceAccountTokenCreator` on `github-token-sa`).

### Permissions Checklist

- [ ] `roles/storage.objectViewer` on project or buckets
- [ ] `roles/cloudbuild.builds.viewer` on project
- [ ] `roles/secretmanager.secretAccessor` on project (or github-token secret)
- [ ] `roles/iam.serviceAccountTokenCreator` on github-token-sa

**The last one (SA impersonation) is often missing.**
