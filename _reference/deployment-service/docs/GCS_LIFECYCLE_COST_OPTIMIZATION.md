# GCS Lifecycle Cost Optimization

**Purpose:** Automatic storage class transitions to reduce costs  
**Status:** Ready to apply to all buckets  
**Estimated Savings:** $800-1,500/year (MVP: BTC + SPY)

---

## Overview

### Storage Class Pricing (asia-northeast1)

| Storage Class | Cost per GB/month | Use Case                              | Retrieval Cost |
| ------------- | ----------------- | ------------------------------------- | -------------- |
| **STANDARD**  | $0.023            | Frequently accessed (< 7 days old)    | $0             |
| **NEARLINE**  | $0.013            | Infrequently accessed (7-30 days old) | $0.01/GB       |
| **COLDLINE**  | $0.007            | Rarely accessed (30-365 days old)     | $0.02/GB       |
| **ARCHIVE**   | $0.0025           | Long-term storage (> 365 days)        | $0.05/GB       |

### Lifecycle Policy Strategy

**Automatic Transitions:**

1. **7 days:** STANDARD → NEARLINE (43% cost reduction)
2. **30 days:** NEARLINE → COLDLINE (46% additional reduction)
3. **365 days:** COLDLINE → ARCHIVE (64% additional reduction)

**Key Benefits:**

- ✅ No code changes needed
- ✅ Applies to existing and new objects
- ✅ Reversible (can change policy anytime)
- ✅ Transitions are free (no operation cost)

---

## Cost Savings Analysis

### Current State (All STANDARD Storage)

**MVP (BTC + SPY, 6 years):**

- Instruments: 109 GB × $0.023 = $2.51/month
- Market Tick: 5,600 GB × $0.023 = $128.80/month
- Market Data Processing: 948 GB × $0.023 = $21.80/month
- Features: 476 GB × $0.023 = $10.95/month
- **Total: $164/month = $1,968/year**

### With Lifecycle Policy

**Assumptions:**

- 20% of data accessed in last 7 days (STANDARD)
- 20% of data accessed in last 30 days (NEARLINE)
- 40% of data accessed in last 365 days (COLDLINE)
- 20% of data older than 365 days (ARCHIVE)

**New Monthly Costs:**

| Service                | Standard (20%) | Nearline (20%) | Coldline (40%) | Archive (20%) | Total       | Savings |
| ---------------------- | -------------- | -------------- | -------------- | ------------- | ----------- | ------- |
| Instruments            | $0.50          | $0.28          | $0.31          | $0.05         | $1.14       | 55%     |
| Market Tick            | $25.76         | $14.54         | $32.13         | $6.44         | $78.87      | 39%     |
| Market Data Processing | $4.36          | $2.46          | $5.43          | $1.09         | $13.34      | 39%     |
| Features               | $2.19          | $1.24          | $2.73          | $0.55         | $6.71       | 39%     |
| **Total**              | **$32.81**     | **$18.52**     | **$40.60**     | **$8.13**     | **$100.06** | **39%** |

**Annual Savings:** $1,968 - $1,201 = **$767/year**

### At Scale (Full MVP: 11 Venues)

**Current (All STANDARD):** $14,000/year  
**With Lifecycle Policy:** $8,540/year  
**Annual Savings:** **$5,460/year (39% reduction)**

---

## Recommended Policies by Bucket Type

### 1. Instruments (Aggressive Tiering)

**Access Pattern:** Rarely accessed after initial generation

**Policy:**

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": { "type": "SetStorageClass", "storageClass": "NEARLINE" },
        "condition": { "age": 7 }
      },
      {
        "action": { "type": "SetStorageClass", "storageClass": "COLDLINE" },
        "condition": { "age": 30 }
      },
      {
        "action": { "type": "SetStorageClass", "storageClass": "ARCHIVE" },
        "condition": { "age": 365 }
      }
    ]
  }
}
```

**Buckets:**

- `instruments-store-cefi-{project}`
- `instruments-store-tradfi-{project}`
- `instruments-store-defi-{project}`

**Savings:** ~55% (instruments rarely accessed after generation)

---

### 2. Market Tick Data (Aggressive Tiering)

**Access Pattern:** Accessed during candle processing, then rarely

**Policy:**

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": { "type": "SetStorageClass", "storageClass": "NEARLINE" },
        "condition": { "age": 7 }
      },
      {
        "action": { "type": "SetStorageClass", "storageClass": "COLDLINE" },
        "condition": { "age": 30 }
      },
      {
        "action": { "type": "SetStorageClass", "storageClass": "ARCHIVE" },
        "condition": { "age": 365 }
      }
    ]
  }
}
```

**Buckets:**

- `market-data-tick-cefi-{project}`
- `market-data-tick-tradfi-{project}`
- `market-data-tick-defi-{project}`

**Savings:** ~39% (largest buckets, biggest impact)

---

### 3. Processed Candles (Aggressive Tiering)

**Access Pattern:** Accessed during feature generation, then rarely

**Policy:**

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": { "type": "SetStorageClass", "storageClass": "NEARLINE" },
        "condition": { "age": 7 }
      },
      {
        "action": { "type": "SetStorageClass", "storageClass": "COLDLINE" },
        "condition": { "age": 30 }
      },
      {
        "action": { "type": "SetStorageClass", "storageClass": "ARCHIVE" },
        "condition": { "age": 365 }
      }
    ]
  }
}
```

**Buckets:**

- `market-data-candles-cefi-{project}`
- `market-data-candles-tradfi-{project}`
- `market-data-candles-defi-{project}`

**Savings:** ~39%

---

### 4. Features (Moderate Tiering)

**Access Pattern:** Frequently accessed during ML training (30-90 day windows)

**Policy (More Conservative):**

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": { "type": "SetStorageClass", "storageClass": "NEARLINE" },
        "condition": { "age": 30 }
      },
      {
        "action": { "type": "SetStorageClass", "storageClass": "COLDLINE" },
        "condition": { "age": 90 }
      },
      {
        "action": { "type": "SetStorageClass", "storageClass": "ARCHIVE" },
        "condition": { "age": 365 }
      }
    ]
  }
}
```

**Rationale:** Keep recent features in STANDARD longer for ML training experiments

**Buckets:**

- `features-delta-one-cefi-{project}`
- `features-delta-one-tradfi-{project}`
- `features-delta-one-defi-{project}`
- `features-calendar-{project}`

**Savings:** ~25% (more conservative due to frequent access)

**Retrieval Cost Impact:**

- Nearline: $0.01/GB (acceptable for occasional retraining)
- Coldline: $0.02/GB (for historical analysis)
- Archive: $0.05/GB (rarely needed)

---

### 5. ML Models (Aggressive Tiering)

**Access Pattern:** Accessed once per quarter during inference, rarely otherwise

**Policy:**

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": { "type": "SetStorageClass", "storageClass": "NEARLINE" },
        "condition": { "age": 7 }
      },
      {
        "action": { "type": "SetStorageClass", "storageClass": "COLDLINE" },
        "condition": { "age": 90 }
      },
      {
        "action": { "type": "SetStorageClass", "storageClass": "ARCHIVE" },
        "condition": { "age": 365 }
      }
    ]
  }
}
```

**Buckets:**

- `ml-models-store-{project}`
- `ml-training-artifacts-{project}`

**Savings:** ~50% (small buckets, but still beneficial)

---

### 6. ML Predictions (Conservative Tiering)

**Access Pattern:** Accessed daily by strategy service for recent periods

**Policy (Most Conservative):**

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": { "type": "SetStorageClass", "storageClass": "NEARLINE" },
        "condition": { "age": 14 }
      },
      {
        "action": { "type": "SetStorageClass", "storageClass": "COLDLINE" },
        "condition": { "age": 60 }
      },
      {
        "action": { "type": "SetStorageClass", "storageClass": "ARCHIVE" },
        "condition": { "age": 365 }
      }
    ]
  }
}
```

**Rationale:** Strategy service may need recent predictions, keep accessible longer

**Buckets:**

- `ml-predictions-store-{project}`

**Savings:** ~20% (smallest bucket, least aggressive policy)

---

## Implementation

### Step 1: Apply Policies to All Buckets

```bash
cd deployment-service
chmod +x scripts/setup-gcs-lifecycle-policies.sh
./scripts/setup-gcs-lifecycle-policies.sh
```

**What it does:**

- Creates lifecycle policies for all service buckets
- Uses appropriate policy for each bucket type
- Verifies policies were applied correctly

**Time:** 5-10 minutes

### Step 2: Verify Policies

```bash
# Check specific bucket
gsutil lifecycle get gs://features-delta-one-cefi-test-project

# Check all buckets
for bucket in $(gsutil ls | grep "test-project"); do
  echo "=== $bucket ==="
  gsutil lifecycle get "$bucket" 2>&1 | grep -E "(age|storageClass)" || echo "No policy"
done
```

### Step 3: Monitor Transitions

**Check object storage class:**

```bash
# See storage class of objects
gsutil ls -L gs://features-delta-one-cefi-{project}/by_date/day=2023-01-01/ | grep "Storage class"
```

**Timeline:**

- Policies apply to NEW objects immediately
- EXISTING objects transition 24-48 hours after reaching age threshold
- First meaningful savings appear after ~7 days

---

## Retrieval Cost Considerations

### When Objects Are Accessed

| Storage Class | Retrieval Cost | Impact on 100 GB Query |
| ------------- | -------------- | ---------------------- |
| STANDARD      | $0             | $0                     |
| NEARLINE      | $0.01/GB       | $1.00                  |
| COLDLINE      | $0.02/GB       | $2.00                  |
| ARCHIVE       | $0.05/GB       | $5.00                  |

### ML Training Scenarios

**Scenario 1: Train on Recent 90 Days (Mostly STANDARD)**

- 90% STANDARD (free retrieval)
- 10% NEARLINE ($0.01/GB)
- **Cost:** Negligible

**Scenario 2: Train on 6-Month Window (Mixed)**

- 40% STANDARD (free)
- 30% NEARLINE ($0.01/GB)
- 30% COLDLINE ($0.02/GB)
- **Cost:** ~$0.90 per 100 GB
- **Acceptable for quarterly retraining**

**Scenario 3: Historical Backtest (2+ Years)**

- 10% STANDARD
- 20% NEARLINE
- 50% COLDLINE
- 20% ARCHIVE ($0.05/GB)
- **Cost:** ~$2.50 per 100 GB
- **Infrequent operation, cost justified by storage savings**

### Cost-Benefit

**Annual Storage Savings:** $767-5,460/year  
**Estimated Retrieval Costs:** $50-200/year (quarterly training + occasional backtests)  
**Net Savings:** **$600-5,200/year**

---

## Important Notes

### 1. Transitions Are One-Way (Within Policy)

- Objects automatically move to colder storage classes
- To move back to STANDARD, you must manually rewrite the object
- Or temporarily disable policy and wait

### 2. Minimum Storage Duration Charges

| Storage Class | Minimum Duration | Early Deletion Fee               |
| ------------- | ---------------- | -------------------------------- |
| NEARLINE      | 30 days          | Yes (charged for remaining days) |
| COLDLINE      | 90 days          | Yes (charged for remaining days) |
| ARCHIVE       | 365 days         | Yes (charged for remaining days) |

**Impact:** If you delete a COLDLINE object after 10 days, you're charged for full 90 days

**Mitigation:** Don't delete objects in cold storage classes unless necessary

### 3. Transitions Take 24-48 Hours

- Policy defines rules, GCS executes asynchronously
- Objects won't transition instantly after reaching age threshold
- Plan accordingly for time-sensitive operations

### 4. Metadata Operations Are Free

- Listing buckets: Free
- Getting object metadata: Free
- Only data retrieval incurs costs

---

## Monitoring & Validation

### Check Transition Status

```bash
# List objects with storage class
gsutil ls -L gs://features-delta-one-cefi-{project}/by_date/ | \
  grep -E "(gs://|Storage class)" | \
  paste - -

# Count objects by storage class
gsutil ls -L gs://features-delta-one-cefi-{project}/by_date/**/*.parquet | \
  grep "Storage class" | \
  sort | uniq -c
```

### Cost Analysis Over Time

**Month 1:**

- Minimal savings (only 7-day transitions)
- ~$50/year savings

**Month 2:**

- 30-day transitions kick in
- ~$400/year savings

**Month 12+:**

- Full effect (including Archive)
- ~$767-1,500/year savings

### Recommended Monitoring

**Weekly:**

- Check lifecycle policy is still active
- Verify new objects are being created correctly

**Monthly:**

- Analyze storage class distribution
- Calculate actual cost savings
- Adjust policies if access patterns change

**Quarterly:**

- Review retrieval costs
- Optimize policies based on actual usage
- Consider more aggressive or conservative policies

---

## Rollback / Adjustment

### Disable Policy

```bash
# Remove lifecycle policy
gsutil lifecycle set /dev/null gs://features-delta-one-cefi-{project}
```

### Modify Policy

```bash
# Edit policy JSON file
# Re-apply
gsutil lifecycle set new-policy.json gs://bucket-name
```

### Move Objects Back to STANDARD

```bash
# Rewrite objects to STANDARD (incurs rewrite cost)
gsutil -m rewrite -s STANDARD gs://bucket-name/path/**/*.parquet
```

---

## Terraform Integration (Future)

Update `terraform/modules/shared-infrastructure/gcp/main.tf`:

```hcl
resource "google_storage_bucket" "features_delta_one" {
  name     = "features-delta-one-${var.category}-${var.project_id}"
  location = var.region

  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
    condition {
      age                   = 30
      matches_storage_class = ["STANDARD"]
    }
  }

  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
    condition {
      age                   = 90
      matches_storage_class = ["NEARLINE"]
    }
  }

  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "ARCHIVE"
    }
    condition {
      age                   = 365
      matches_storage_class = ["COLDLINE"]
    }
  }
}
```

---

## Summary

**Implementation:**

1. Run `./scripts/setup-gcs-lifecycle-policies.sh`
2. Verify policies applied
3. Monitor transitions over 30 days

**Expected Outcomes:**

- **Immediate:** Policies active for new objects
- **7 days:** First transitions to NEARLINE
- **30 days:** Transitions to COLDLINE begin
- **60-90 days:** Steady-state savings (~$60-130/month for MVP)

**Cost Savings:**

- **MVP (BTC + SPY):** $767/year (39% reduction)
- **Full MVP (11 venues):** $5,460/year (39% reduction)
- **Net (after retrieval costs):** $600-5,200/year

**Recommendation:** ✅ **Apply immediately** - no downside, significant savings
