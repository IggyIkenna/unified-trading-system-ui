# Massive Backfill Cost Analysis - 50 TB in 24 Hours

**Scenario:** Process entire 6-year dataset (50 TB) in 24 hours using 500 C2 machines
**Date:** February 10, 2026
**Purpose:** One-time full system backfill cost estimate

---

## Compute Cost Calculation

### Machine Pricing (asia-northeast1)

| Machine Type   | vCPUs | RAM   | Cost/Hour | Cost/24 Hours |
| -------------- | ----- | ----- | --------- | ------------- |
| c2-standard-4  | 4     | 16 GB | $0.2088   | $5.01         |
| c2-standard-8  | 8     | 32 GB | $0.4176   | $10.02        |
| c2-standard-16 | 16    | 64 GB | $0.8352   | $20.04        |

### Scenario 1: 500 × c2-standard-4 (Most Common)

**Configuration:**

- 500 machines
- 4 vCPUs each = 2,000 total vCPUs
- 16 GB RAM each = 8 TB total RAM
- 24 hours continuous

**Cost Calculation:**

```
500 machines × $0.2088/hour × 24 hours = $2,505.60
```

**Cost per TB processed:** $2,505.60 / 50 TB = **$50.11/TB**

---

### Scenario 2: 500 × c2-standard-8 (More Powerful)

**Configuration:**

- 500 machines
- 8 vCPUs each = 4,000 total vCPUs
- 32 GB RAM each = 16 TB total RAM
- 24 hours continuous

**Cost Calculation:**

```
500 machines × $0.4176/hour × 24 hours = $5,011.20
```

**Cost per TB processed:** $5,011.20 / 50 TB = **$100.22/TB**

---

### Scenario 3: Mixed Fleet (Optimized)

**Configuration:**

- 300 × c2-standard-4 (for lighter tasks like instruments, candles)
- 200 × c2-standard-8 (for heavier tasks like features, ML training)
- 24 hours continuous

**Cost Calculation:**

```
(300 × $0.2088 × 24) + (200 × $0.4176 × 24) = $1,503.36 + $2,004.48 = $3,507.84
```

**Cost per TB processed:** $3,507.84 / 50 TB = **$70.16/TB**

---

## Complete 24-Hour Backfill Cost Breakdown

### Pipeline Stages

| Stage     | Service                        | Machines | Type     | Hours | Cost       |
| --------- | ------------------------------ | -------- | -------- | ----- | ---------- |
| 1         | instruments-service            | 10       | c2-std-4 | 24    | $50        |
| 2         | market-tick-data-handler       | 50       | c2-std-4 | 24    | $251       |
| 3         | market-data-processing-service | 100      | c2-std-4 | 24    | $501       |
| 4         | features-delta-one-service     | 250      | c2-std-8 | 24    | $2,506     |
| 5         | ml-training-service            | 50       | c2-std-8 | 24    | $501       |
| 6         | ml-inference-service           | 30       | c2-std-4 | 24    | $150       |
| 7         | strategy-service               | 10       | c2-std-4 | 24    | $50        |
| **Total** |                                | **500**  |          |       | **$4,009** |

**Note:** This assumes perfect parallelization and all services running simultaneously for the full 24 hours.

---

## Storage Costs for 50 TB

### Data Breakdown

| Service                | Data Size  | % of Total |
| ---------------------- | ---------- | ---------- |
| market-tick            | 40 TB      | 80%        |
| market-data-processing | 4 TB       | 8%         |
| features               | 4 TB       | 8%         |
| ML models              | 50 GB      | 0.1%       |
| predictions            | 10 GB      | 0.02%      |
| instruments            | 1 GB       | 0.002%     |
| **Total**              | **~50 TB** | 100%       |

### Storage Costs

**Immediate (All STANDARD):**

- 50 TB × 1,024 GB/TB × $0.023/GB = $1,177/month
- **First month cost:** $1,177

**After 90 Days (With Aggressive Lifecycle):**

- 5% STANDARD (2.5 TB): $59/month
- 5% NEARLINE (2.5 TB): $33/month
- 10% COLDLINE (5 TB): $36/month
- 80% ARCHIVE (40 TB): $102/month
- **Steady-state cost:** $230/month = $2,760/year

**Annual Savings:** $14,124 - $2,760 = **$11,364/year (80% reduction)**

---

## Total One-Time Backfill Cost

### Complete Cost (24-Hour Processing)

| Component                        | Cost       | Notes                     |
| -------------------------------- | ---------- | ------------------------- |
| **Compute (500 machines × 24h)** | **$4,009** | c2-standard-4/8 mix       |
| Storage (first month)            | $1,177     | All STANDARD initially    |
| Egress (if downloading)          | $0         | Stays in GCP              |
| Operations (API calls)           | $50        | GCS read/write operations |
| **TOTAL**                        | **$5,236** | One-time backfill cost    |

**Cost per TB:** $5,236 / 50 TB = **$104.72/TB**

---

## Ongoing Costs (After Backfill)

### Daily Maintenance (Incremental Updates)

**Assumptions:**

- Add 1 day of new data daily
- ~50 GB/day new data (all services)
- 10-20 machines for incremental processing

**Daily Cost:**

- Compute: 15 machines × c2-std-4 × 2 hours = 15 × $0.2088 × 2 = **$6.26/day**
- Storage: 50 GB × $0.023 = $1.15/month = **$0.04/day**
- **Total:** $6.30/day = **$2,300/year**

### Monthly Analysis/Backtesting (3K Iterations)

**Cost:** $848/month = **$10,167/year**
(See Section 13 of COST.md for detailed breakdown)

### Total Annual Cost (After Initial Backfill)

| Component                 | Annual Cost      |
| ------------------------- | ---------------- |
| Storage (with lifecycle)  | $2,760           |
| Daily maintenance compute | $2,300           |
| Analysis/backtesting      | $10,167          |
| UI hosting                | $300             |
| **Total**                 | **$15,527/year** |

---

## Cost Optimization Strategies

### 1. Use Preemptible VMs (80% Discount)

**Savings:**

- Regular: 500 × c2-std-4 × 24h = $2,505
- Preemptible: 500 × c2-std-4 × 24h × 0.2 = **$501**
- **Savings: $2,004 (80% reduction)**

**Total with Preemptible:** $5,236 → **$3,232 (38% cheaper)**

**Trade-off:**

- Can be preempted (interrupted) anytime
- Need retry logic
- Acceptable for batch processing
- Not recommended for time-sensitive operations

**Recommendation:** ✅ Use preemptible for initial backfill (not time-critical)

---

### 2. Spread Over Longer Period

**Alternative: 48 Hours Instead of 24**

**Configuration:**

- 250 machines × c2-std-4 × 48 hours
- Same total compute: 12,000 vCPU-hours

**Cost:**

- Regular: 250 × $0.2088 × 48 = **$2,505** (same)
- Preemptible: **$501** (same)

**Benefit:** Lower concurrent load, same cost

---

### 3. Optimize by Service Priority

**Tier 1: Generate Core Data (12 hours, 300 machines)**

- Instruments → Market Tick → Candles
- Cost: 300 × $0.2088 × 12 = $751

**Tier 2: Generate Features (8 hours, 250 machines, after Tier 1)**

- Features-delta-one, features-calendar
- Cost: 250 × $0.4176 × 8 = $836

**Tier 3: ML Training & Inference (4 hours, 100 machines, after Tier 2)**

- ML training, inference, predictions
- Cost: 100 × $0.4176 × 4 = $167

**Total Sequential:** $751 + $836 + $167 = $1,754
**Total Time:** 24 hours (with dependencies)
**Savings vs Parallel:** $2,505 - $1,754 = **$751 (30% cheaper)**

**With Preemptible:** $1,754 × 0.2 = **$351 total**

---

## Comparison: One-Time vs Incremental

### Option A: One-Time Massive Backfill (24 hours)

**Cost:**

- Compute: $4,009 (regular) or $802 (preemptible)
- Storage (first month): $1,177
- **Total:** $5,186 (regular) or **$1,979 (preemptible)**

**Pros:**

- ✅ Complete system in 24 hours
- ✅ Instant production readiness
- ✅ All historical data available

**Cons:**

- ❌ High upfront cost
- ❌ Risk of errors affecting large dataset
- ❌ Harder to debug if issues arise

---

### Option B: Incremental Backfill (30 days, ~2 hours/day)

**Cost:**

- Compute: 20 machines × c2-std-4 × 2 hours × 30 days = 20 × $0.2088 × 2 × 30 = **$251**
- Storage (gradual): ~$40/month × 1 = $40
- **Total:** $291

**Pros:**

- ✅ Much cheaper ($291 vs $5,186)
- ✅ Easy to debug and iterate
- ✅ Can catch errors early
- ✅ Spread cost over time

**Cons:**

- ❌ Takes 30 days instead of 24 hours
- ❌ System not immediately production-ready

---

### Option C: Hybrid (Critical Data Fast, Rest Slow)

**Phase 1: Recent 90 Days (24 hours, 200 machines)**

- Critical for immediate ML training
- Cost: 200 × $0.2088 × 24 = **$1,002** (or $200 preemptible)
- Data: ~2 TB (recent, high-value)

**Phase 2: Remaining 5.9 Years (30 days, incremental)**

- Historical data, less time-sensitive
- Cost: 20 × $0.2088 × 2 × 30 = **$251**
- Data: ~48 TB (historical, archival)

**Total:** $1,253 (or $451 with preemptible)
**Timeline:** Production-ready in 24 hours, full historical data in 30 days

---

## Recommended Approach

### For Initial System Setup (Now)

**Use Option C (Hybrid):**

1. **Day 1:** Generate recent 90 days with 200 preemptible VMs
   - Cost: $200
   - Result: ML training ready immediately
2. **Days 2-31:** Backfill remaining 5.9 years incrementally
   - Cost: $251
   - Result: Complete historical dataset

**Total Cost:** $451
**Timeline:** ML production-ready in 24 hours, full data in 30 days

### For Future Full Regeneration

**Use Option A with Preemptible:**

- 500 × preemptible VMs × 24 hours
- Cost: $802
- Only needed if schema changes require regeneration

---

## Break-Even Analysis

### When to Use Massive Parallel Processing?

**Cost of 24-hour backfill:** $4,009 (regular) or $802 (preemptible)
**Cost of 30-day incremental:** $291

**Break-even:** If time-to-production is worth more than $3,718 (or $511 with preemptible)

**Use Cases for Massive Parallel:**

- Critical production deadline
- Testing full system capacity
- One-time schema migration
- Disaster recovery

**Use Cases for Incremental:**

- Initial system setup (not time-critical)
- Gradual data quality validation
- Budget-constrained environments
- Testing and iteration

---

## Network & I/O Considerations

### GCS Operations Cost

**50 TB Backfill:**

- Write operations: 50 TB / 10 MB per file = 5,000,000 writes
- Cost: 5M × $0.05/10,000 = **$25**
- Read operations (downstream): Similar
- **Total operations:** ~$50

### Network Egress

**Within GCP (asia-northeast1):**

- VM → GCS in same region: **$0 (free)**
- VM → BigQuery in same region: **$0 (free)**

**No egress costs for 24-hour backfill if everything stays in asia-northeast1!**

---

## Real-World Execution Plan

### Recommended: Staged Approach

**Week 1: Core Data Pipeline (Days 1-7)**

- Run: instruments → market-tick → candles → features
- Machines: 200 × c2-std-4 × 2 hours/day × 7 days
- Cost: 200 × $0.2088 × 2 × 7 = **$585**
- Output: Recent 90 days for all services

**Week 2: ML Pipeline (Days 8-14)**

- Run: ML training (3 stages) + inference
- Machines: 100 × c2-std-8 × 4 hours/day × 7 days
- Cost: 100 × $0.4176 × 4 × 7 = **$1,169**
- Output: Models + predictions for recent 90 days

**Week 3-4: Historical Backfill (Days 15-30)**

- Run: All services, incremental historical data
- Machines: 50 × c2-std-4 × 2 hours/day × 16 days
- Cost: 50 × $0.2088 × 2 × 16 = **$334**
- Output: Full 6 years of data

**Total Cost:** $585 + $1,169 + $334 = **$2,088**
**Timeline:** 30 days
**Benefit:** Gradual validation, early production readiness (Week 2)

---

## Summary: 24-Hour Backfill Options

| Approach                 | Machines    | Duration  | Cost (Regular) | Cost (Preemptible) | Production Ready |
| ------------------------ | ----------- | --------- | -------------- | ------------------ | ---------------- |
| **Massive Parallel**     | 500         | 24 hours  | **$4,009**     | **$802**           | Day 1            |
| **Optimized Sequential** | 300→250→100 | 24 hours  | $1,754         | $351               | Day 1            |
| **Hybrid (Recommended)** | 200→20      | 24h + 30d | $1,253         | $451               | Day 1 (partial)  |
| **Incremental**          | 20          | 30 days   | $291           | $58                | Day 30           |
| **Staged (Best)**        | 200→100→50  | 30 days   | $2,088         | $418               | Day 14           |

---

## Cost Comparison vs Daily Operations

### One-Time Backfill

| Approach                               | Cost |
| -------------------------------------- | ---- |
| 24-hour massive parallel (preemptible) | $802 |
| 30-day staged (preemptible)            | $418 |

### Daily Operations (After Backfill)

| Component                | Daily Cost     | Annual Cost     |
| ------------------------ | -------------- | --------------- |
| Daily maintenance        | $6/day         | $2,300/year     |
| Storage (with lifecycle) | $7.50/day      | $2,760/year     |
| **Total**                | **$13.50/day** | **$5,060/year** |

**Key Insight:** One-time backfill cost ($418-802 with preemptible) equals 60-150 days of ongoing operations.

**Recommendation:** Pay upfront for faster backfill if production timeline is critical.

---

## Preemptible VM Considerations

### Reliability

**Preemption Rate:** ~5-10% chance per 24 hours
**Expected Interruptions:** 25-50 machines out of 500

**Mitigation:**

- Implement retry logic in deployment orchestrator
- Use Cloud Run Jobs (automatic retry)
- Checkpoint progress to GCS (resume from checkpoint)

### Cost-Benefit

**Regular VMs:**

- Cost: $4,009
- Reliability: 100%
- No interruptions

**Preemptible VMs:**

- Cost: $802 (80% discount)
- Reliability: 90-95%
- Some retries needed

**Verdict:** ✅ Use preemptible for backfill (retries acceptable, massive savings)

---

## GCP Quota Requirements

### Compute Engine Quotas

**For 500 × c2-standard-4:**

- CPUs (asia-northeast1): 2,000 vCPUs
- Default quota: 24 vCPUs per region
- **Quota increase needed:** Request 2,500 vCPUs

**For 500 × c2-standard-8:**

- CPUs: 4,000 vCPUs
- **Quota increase needed:** Request 4,500 vCPUs

### Request Quota Increase

```bash
# Via gcloud
gcloud compute regions describe asia-northeast1 --format="table(quotas.metric,quotas.limit)"

# Request increase via Cloud Console:
# IAM & Admin → Quotas → Compute Engine API → CPUS_ALL_REGIONS → Edit Quota
# Request: 4,500 vCPUs for asia-northeast1
```

**Processing Time:** 2-5 business days
**Cost:** Free

---

## Recommendation

### For Immediate Production Readiness

**Use Hybrid Approach with Preemptible VMs:**

1. **Phase 1 (Day 1): Recent 90 Days**
   - 200 × c2-std-4 × 24 hours
   - Cost: $200 (preemptible)
   - Output: Production-ready ML system

2. **Phase 2 (Days 2-31): Historical Data**
   - 20 × c2-std-4 × 2 hours/day × 30 days
   - Cost: $251 (regular VMs for reliability)
   - Output: Complete 6-year dataset

**Total Cost:** $451
**Timeline:** Production-ready Day 1, complete by Day 31
**Best balance:** Speed + cost + validation

### Alternative: If Budget is Priority

**Use Incremental (30 Days):**

- Cost: $58 (preemptible)
- Timeline: Day 30 for production
- Savings: $744 vs hybrid

**Trade-off:** 30 days vs 1 day to production readiness

---

## Answer to Your Specific Question

**Your exact scenario: 500 C2 machines × 24 hours for 50 TB**

| Machine Type                  | Total Cost | Cost per TB | With Preemptible |
| ----------------------------- | ---------- | ----------- | ---------------- |
| c2-standard-4                 | **$2,506** | $50.11/TB   | **$501**         |
| c2-standard-8                 | **$5,011** | $100.22/TB  | **$1,002**       |
| Mixed (300×std-4 + 200×std-8) | **$3,508** | $70.16/TB   | **$702**         |

**Add storage for first month:** +$1,177
**Add operations:** +$50

**Total One-Time Cost:**

- Regular VMs: $4,735 (with c2-std-4)
- **Preemptible VMs: $1,728** (recommended)

**Cost per TB processed: $34.56/TB with preemptible** 🎯

That's the complete cost of processing your entire 50 TB dataset in 24 hours!
