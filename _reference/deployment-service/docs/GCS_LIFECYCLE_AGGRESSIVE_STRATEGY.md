# GCS Lifecycle - Aggressive Strategy for 80% Unused Data

**Purpose:** Optimized lifecycle policy for systems where most data is rarely accessed
**Status:** Ready to apply
**Estimated Savings:** $1,500-2,500/year (60-75% reduction for MVP)

---

## Key Insight

**Your access pattern:**

- MVP instruments (BTC, SPY): ~10-20% of data, accessed frequently
- Non-MVP instruments: ~80% of data, rarely or never accessed
- Historical data: Most queries focus on recent 30-90 days

**Implication:** Most data should move to cold storage **very quickly**

---

## Aggressive Lifecycle Policy

### Timeline

| Age        | Storage Class | Cost per GB/month | Cumulative Savings |
| ---------- | ------------- | ----------------- | ------------------ |
| 0-3 days   | STANDARD      | $0.023            | Baseline           |
| 3-14 days  | NEARLINE      | $0.013            | 43% cheaper        |
| 14-90 days | COLDLINE      | $0.007            | 70% cheaper        |
| 90+ days   | ARCHIVE       | $0.0025           | 89% cheaper        |

### Policy JSON

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": { "type": "SetStorageClass", "storageClass": "NEARLINE" },
        "condition": { "age": 3, "matchesStorageClass": ["STANDARD"] }
      },
      {
        "action": { "type": "SetStorageClass", "storageClass": "COLDLINE" },
        "condition": { "age": 14, "matchesStorageClass": ["NEARLINE"] }
      },
      {
        "action": { "type": "SetStorageClass", "storageClass": "ARCHIVE" },
        "condition": { "age": 90, "matchesStorageClass": ["COLDLINE"] }
      }
    ]
  }
}
```

---

## Cost Analysis (MVP: BTC + SPY, 6 Years)

### Current State (All STANDARD)

**Total Storage:** 7,133 GB

- Instruments: 109 GB
- Market Tick: 5,600 GB
- Market Data Processing: 948 GB
- Features: 476 GB

**Monthly Cost:** 7,133 GB × $0.023 = $164.06/month
**Annual Cost:** $1,968/year

---

### With Aggressive Lifecycle (Reality-Based)

**Assumptions:**

- **10% accessed in last 3 days** (STANDARD) - Recent MVP data
- **10% accessed in last 14 days** (NEARLINE) - Recent analysis
- **30% accessed in last 90 days** (COLDLINE) - Historical analysis
- **50% older than 90 days** (ARCHIVE) - Rarely accessed

**Storage Distribution:**

| Storage Class | % of Data | Amount (GB) | Cost/GB/month | Monthly Cost |
| ------------- | --------- | ----------- | ------------- | ------------ |
| STANDARD      | 10%       | 713 GB      | $0.023        | $16.40       |
| NEARLINE      | 10%       | 713 GB      | $0.013        | $9.27        |
| COLDLINE      | 30%       | 2,140 GB    | $0.007        | $14.98       |
| ARCHIVE       | 50%       | 3,567 GB    | $0.0025       | $8.92        |
| **Total**     | 100%      | 7,133 GB    | -             | **$49.57**   |

**Annual Cost:** $595/year
**Annual Savings:** $1,968 - $595 = **$1,373/year (70% reduction)**

---

### With Even More Realistic Distribution (80% Rarely Accessed)

**Assumptions (More Aggressive):**

- **5% accessed in last 3 days** (STANDARD) - Active MVP instruments only
- **5% accessed in last 14 days** (NEARLINE) - Recent MVP + occasional lookback
- **10% accessed in last 90 days** (COLDLINE) - Historical analysis on MVP
- **80% older than 90 days** (ARCHIVE) - Non-MVP instruments + old data

**Storage Distribution:**

| Storage Class | % of Data | Amount (GB) | Cost/GB/month | Monthly Cost |
| ------------- | --------- | ----------- | ------------- | ------------ |
| STANDARD      | 5%        | 357 GB      | $0.023        | $8.21        |
| NEARLINE      | 5%        | 357 GB      | $0.013        | $4.64        |
| COLDLINE      | 10%       | 713 GB      | $0.007        | $4.99        |
| ARCHIVE       | 80%       | 5,706 GB    | $0.0025       | $14.27       |
| **Total**     | 100%      | 7,133 GB    | -             | **$32.11**   |

**Annual Cost:** $385/year
**Annual Savings:** $1,968 - $385 = **$1,583/year (80% reduction)**

---

## Retrieval Cost Impact

### Realistic Scenarios

#### Scenario 1: Daily MVP Operations (BTC, SPY)

**Access Pattern:**

- Recent 7 days: STANDARD (free retrieval)
- Occasional lookback 30 days: Mix of STANDARD/NEARLINE

**Data Retrieved:** 50 GB/month (mostly STANDARD)
**Retrieval Cost:** ~$0.50/month = $6/year

**Net Savings:** $1,583 - $6 = **$1,577/year**

---

#### Scenario 2: Quarterly ML Retraining

**Access Pattern:**

- 90-day training window
- Mix: 60% STANDARD/NEARLINE (free/$0.01), 30% COLDLINE ($0.02), 10% ARCHIVE ($0.05)

**Data Retrieved:** 200 GB/quarter (800 GB/year)

- 480 GB STANDARD/NEARLINE: $4.80
- 240 GB COLDLINE: $4.80
- 80 GB ARCHIVE: $4.00
- **Total:** $13.60/year

**Net Savings:** $1,583 - $14 = **$1,569/year**

---

#### Scenario 3: Historical Backtest (Once per Year)

**Access Pattern:**

- Full 6 years of data for 2 instruments
- 5% STANDARD, 5% NEARLINE, 10% COLDLINE, 80% ARCHIVE

**Data Retrieved:** 1,000 GB once/year

- 50 GB STANDARD: $0
- 50 GB NEARLINE: $0.50
- 100 GB COLDLINE: $2.00
- 800 GB ARCHIVE: $40.00
- **Total:** $42.50/year

**Net Savings:** $1,583 - $43 = **$1,540/year**

---

#### Combined Annual Retrieval Costs

| Operation                 | Frequency  | Cost/Year    |
| ------------------------- | ---------- | ------------ |
| Daily MVP operations      | Daily      | $6           |
| Quarterly ML retraining   | 4x/year    | $14          |
| Historical backtest       | 1x/year    | $43          |
| Ad-hoc exploration        | Occasional | $20          |
| **Total Retrieval Costs** | -          | **$83/year** |

**Net Annual Savings:** $1,583 - $83 = **$1,500/year (76% reduction)**

---

## At Scale (Full MVP: 11 Venues)

### Current (All STANDARD)

**Total Storage:** ~50 TB
**Annual Cost:** $14,000/year

### With Aggressive Lifecycle (80% in ARCHIVE)

**Storage Distribution:**

- 5% STANDARD: 2.5 TB × $0.023 × 12 = $690/year
- 5% NEARLINE: 2.5 TB × $0.013 × 12 = $390/year
- 10% COLDLINE: 5 TB × $0.007 × 12 = $420/year
- 80% ARCHIVE: 40 TB × $0.0025 × 12 = $1,200/year
- **Total:** $2,700/year

**Retrieval Costs (Full Scale):**

- Daily operations: $30/year
- Quarterly retraining: $70/year
- Historical backtests: $200/year
- Ad-hoc: $100/year
- **Total:** $400/year

**Net Annual Cost:** $2,700 + $400 = $3,100/year
**Annual Savings:** $14,000 - $3,100 = **$10,900/year (78% reduction)**

---

## Timeline to Full Savings

### Week 1 (3-Day Threshold)

**Transitions:** 90% of data → NEARLINE
**Monthly Savings:** ~$70 ($840/year)
**Cumulative:** 43% reduction

### Week 2 (14-Day Threshold)

**Transitions:** 80% of data → COLDLINE
**Monthly Savings:** ~$110 ($1,320/year)
**Cumulative:** 67% reduction

### Month 3 (90-Day Threshold)

**Transitions:** 80% of data → ARCHIVE
**Monthly Savings:** ~$132 ($1,583/year)
**Cumulative:** 80% reduction

**Full savings realized in 90 days!**

---

## Why This Works

### 1. Data Access Reality

**Most data is NEVER accessed after initial generation:**

- Non-MVP instruments: Generated once, rarely queried
- Historical tick data: Used for candle generation, then cold
- Old candles: Used for feature generation, then cold
- Old features: Used for one-time training, then cold

### 2. MVP Focus

**Active use is concentrated:**

- 2 instruments (BTC, SPY) out of hundreds
- Recent 30-90 days for most analysis
- Occasional historical backtests (1-2x/year)

### 3. Retrieval Is Infrequent

**When you DO retrieve cold data:**

- It's for specific, high-value operations (backtests, research)
- Retrieval cost ($0.05/GB for ARCHIVE) is justified by storage savings
- Example: $40 retrieval cost vs $1,500/year storage savings = 96% net savings

---

## Implementation Considerations

### 1. Minimum Storage Duration Charges

| Storage Class | Minimum Duration | Impact                                         |
| ------------- | ---------------- | ---------------------------------------------- |
| NEARLINE      | 30 days          | Low risk - data stays ≥14 days before COLDLINE |
| COLDLINE      | 90 days          | No risk - policy matches minimum               |
| ARCHIVE       | 365 days         | Caution - early deletion costly                |

**Mitigation:** Don't delete ARCHIVE objects unless absolutely necessary. If data must be deleted, wait until it's been in ARCHIVE for 365 days.

### 2. Data Regeneration vs Storage

**Trade-off Analysis:**

For data older than 90 days in ARCHIVE:

- **Option A:** Keep in ARCHIVE ($0.0025/GB/month)
- **Option B:** Delete and regenerate when needed

**Break-even:** If retrieval + regeneration compute cost > $0.0025/GB/month, keep in ARCHIVE.

**For market tick data:**

- Regeneration cost: ~$10-50 (Tardis API + compute)
- 6 months of tick data: ~3 TB = $7.50/month in ARCHIVE = $90/year
- **Verdict:** Keep in ARCHIVE (cheaper than regeneration)

### 3. Selective Deletion for Non-MVP

**Strategy:** Delete non-MVP instrument data after moving to ARCHIVE if NEVER accessed.

**Potential Additional Savings:**

- 70% of ARCHIVE data is non-MVP instruments
- 70% × 5,706 GB = 3,994 GB can be safely deleted
- Savings: 3,994 GB × $0.0025 × 12 = $120/year

**Total with Selective Deletion:** $1,583 - $120 = **$1,703/year savings (87% reduction)**

---

## Monitoring & Adjustment

### Week 1: Verify Transitions

```bash
# Check storage class distribution
gsutil ls -L gs://features-delta-one-cefi-{project}/by_date/**/*.parquet | \
  grep "Storage class" | sort | uniq -c

# Expected after 3 days:
# - Most objects: NEARLINE
# - Recent 3 days: STANDARD
```

### Week 2: Validate COLDLINE Transitions

```bash
# Count by storage class
gsutil ls -Lr gs://market-data-tick-cefi-{project}/raw_tick_data/ | \
  grep "Storage class" | awk '{print $3}' | sort | uniq -c

# Expected after 14 days:
# - 5% STANDARD (last 3 days)
# - 5% NEARLINE (3-14 days)
# - 90% COLDLINE (14+ days)
```

### Month 3: Confirm ARCHIVE Transitions

```bash
# Full distribution check
for bucket in $(gsutil ls | grep test-project); do
  echo "=== $bucket ==="
  gsutil du -s "$bucket"
  gsutil ls -Lr "$bucket" | grep "Storage class" | \
    awk '{print $3}' | sort | uniq -c
done

# Expected:
# - ~80% in ARCHIVE
# - ~20% in STANDARD/NEARLINE/COLDLINE
```

### Monthly: Cost Tracking

```bash
# Use Cloud Console Billing Reports
# Filter by: Storage → GCS → asia-northeast1
# Group by: Storage Class

# Track month-over-month reduction
```

---

## Rollback Plan

### If Retrieval Costs Too High

**Symptoms:**

- Monthly retrieval costs > $50
- Frequent need to access old data

**Solution:** Adjust to less aggressive policy

```json
{
  "lifecycle": {
    "rule": [
      { "action": { "storageClass": "NEARLINE" }, "condition": { "age": 7 } },
      { "action": { "storageClass": "COLDLINE" }, "condition": { "age": 30 } },
      { "action": { "storageClass": "ARCHIVE" }, "condition": { "age": 180 } }
    ]
  }
}
```

### If Need to Restore Data to STANDARD

```bash
# Rewrite objects to STANDARD (costs: rewrite + retrieval)
gsutil -m rewrite -s STANDARD gs://bucket/path/**/*.parquet

# Cost:
# - Retrieval: $0.05/GB for ARCHIVE
# - Rewrite: Free
# - New storage: $0.023/GB/month in STANDARD
```

---

## Recommended Next Steps

### 1. Apply Aggressive Policy (Now)

```bash
cd deployment-service
./scripts/setup-gcs-lifecycle-policies.sh
```

### 2. Monitor for 90 Days

- Week 1: NEARLINE transitions
- Week 2: COLDLINE transitions
- Month 3: ARCHIVE transitions
- Track actual vs estimated savings

### 3. Measure Retrieval Costs

- Log all GCS operations
- Categorize by storage class
- Calculate monthly retrieval costs
- Adjust policy if needed

### 4. Optimize Further (Month 4+)

**If retrieval costs < $50/month:**

- Keep aggressive policy
- Consider selective deletion of non-MVP data

**If retrieval costs > $100/month:**

- Adjust policy to less aggressive
- Keep frequently-accessed data in NEARLINE longer

---

## Summary

**Current Cost:** $1,968/year (MVP)
**With Aggressive Policy:** $385/year storage + $83/year retrieval
**Net Cost:** $468/year
**Annual Savings:** **$1,500/year (76% reduction)**

**At Full Scale (11 venues):**
**Annual Savings:** **$10,900/year (78% reduction)**

**Recommendation:** ✅ **Apply immediately** - massive savings with minimal risk

**Key Success Factors:**

- 80% of data rarely accessed → perfect for aggressive tiering
- MVP focus on 2 instruments → most data can go cold fast
- Retrieval costs minimal compared to storage savings
- Policy fully reversible if access patterns change
