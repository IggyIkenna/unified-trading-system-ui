# Service Bundling Review

**Date:** 2026-03-08
**Plan ref:** `phase3_service_hardening_integration.plan.md` → `p3-service-bundling-review`
**Data source:** `deployment-service/docs/resource-profiles/` (22 per-service profiles)

---

## Summary Recommendation

| Candidate                                  | Recommendation                                         | Rationale                                                 |
| ------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------- |
| Risk + PnL co-location                     | **REJECT**                                             | Incompatible resource profiles; blast-radius unacceptable |
| Features bundle (calendar + onchain)       | **REJECT as shared container; already Cloud Run Jobs** | Different DAG positions; no benefit to bundling           |
| features-calendar-service as Cloud Run Job | **ALREADY CLOUD RUN JOB** — no action needed           |
| features-onchain-service as Cloud Run Job  | **ALREADY CLOUD RUN JOB** — no action needed           |

---

## 1. Risk + PnL Co-location

### Profiles

| Service                   | CPU    | Memory | Mode                  | Monthly est.    |
| ------------------------- | ------ | ------ | --------------------- | --------------- |
| risk-and-exposure-service | 4 vCPU | 16 Gi  | both (always-on live) | ~$50/month live |
| pnl-attribution-service   | 2 vCPU | 8 Gi   | batch only            | ~$1.10/day      |

### Pros

- Single Cloud Run container eliminates one Cold Start for the monitoring tier
- Shared in-process access to position state (avoid one PubSub hop)
- Reduced IAM surface: one SA instead of two

### Cons

| Issue                         | Severity     | Detail                                                                                                                                                                                   |
| ----------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blast radius                  | **BLOCKING** | Risk is always-on (min-instances=1); PnL is batch-only. A crash in the PnL attribution pass would restart the risk container, causing live risk gap.                                     |
| Incompatible resource profile | **BLOCKING** | Combined peak: 6 vCPU + 24 Gi. Cloud Run max instance size is 32 vCPU / 32 Gi — fits, but risk runs 24 hr/day while PnL runs ≤1 hr/day. Paying 24 hr of risk costs for 1 hr of PnL work. |
| Scaling mismatch              | **BLOCKING** | Risk scales on tick rate; PnL scales on trade history size. Independent horizontal scaling is required.                                                                                  |
| SRP violation                 | Medium       | Risk owns VaR/Greeks; PnL owns 6-dimension factor attribution. Bundling merges two distinct domain responsibilities into one deployment artifact.                                        |
| Deployment independence lost  | Medium       | Risk hotfixes (e.g. circuit breaker threshold change) require redeploying the PnL binary. No independent release cadence.                                                                |

### Verdict

**REJECT co-location.** The risk service is a live always-on service (live trading safety dependency) with 4 vCPU / 16 Gi, while PnL is a short-lived batch job (2 vCPU / 8 Gi). A crash in PnL processing would restart the live risk monitoring pod. The blast-radius consequence is unacceptable in a live trading context.

---

## 2. Features Bundle — Which Services Share Compatible Resource Profiles

### Profile comparison

| Service                           | CPU    | Memory | Mode  | Typical duration | DAG position                     |
| --------------------------------- | ------ | ------ | ----- | ---------------- | -------------------------------- |
| features-calendar-service         | 1 vCPU | 1 Gi   | batch | 2 min (daily)    | L3, after instruments-service    |
| features-onchain-service          | 1 vCPU | 4 Gi   | batch | 10–30 min        | L3, after market-data-processing |
| features-delta-one-service        | 2 vCPU | 8 Gi   | batch | 1 hr             | L3, after market-data-processing |
| features-volatility-service       | 2 vCPU | 8 Gi   | batch | 45 min           | L3, after market-data-processing |
| features-sports-service           | 2 vCPU | 8 Gi   | batch | 30 min           | L3, after market-tick-data       |
| features-multi-timeframe-service  | 2 vCPU | 8 Gi   | batch | 45 min           | L3, after market-data-processing |
| features-cross-instrument-service | 4 vCPU | 16 Gi  | batch | 1–3 hr           | L4, after delta-one + volatility |

### Analysis

**Calendar + onchain: superficially compatible** (both Small class), but:

- Calendar runs after instruments-service only (very early in pipeline)
- Onchain runs after market-data-processing-service (later gate)
- Combined job cannot start until the later gate passes — calendar would be blocked waiting for market data processing unnecessarily

**Delta-one + volatility: same resource class**, but:

- Volatility depends on options chains from DERIBIT (requires MDPS OPTIONS pass)
- Delta-one depends on OHLCV candles (requires MDPS general pass)
- Bundling means the combined job waits for the slowest upstream — volatility blocks delta-one completion reporting
- Delta-one publishes `FEATURES_READY` to trigger ml-inference-service; bundling delays this event by the volatility runtime

**Cross-instrument: incompatible** with all others (Large class: 4 vCPU / 16 Gi vs Medium: 2 vCPU / 8 Gi).

### Verdict

**REJECT features bundle.** Each features service has independent DAG entry conditions, independent output buckets, and independent downstream triggers. Bundling any pair delays the faster service unnecessarily and obscures the `FEATURES_READY` event semantics. The correct architecture is the current one: independent Cloud Run Jobs triggered by Cloud Scheduler / PubSub completion events.

---

## 3. features-calendar-service as Cloud Run Job

### Current state

Per `deployment-service/docs/resource-profiles/features-calendar-service.md`:

- **Execution: Cloud Run Job** — already deployed as a Cloud Run Job
- 1 vCPU, 1 Gi, 10 min timeout
- Runs daily; no persistent state; cheapest service at ~$0.02/month

### Assessment

Already a Cloud Run Job. No conversion needed.

**Characteristics that confirm this is correct:**

- Runs once daily (scheduled, not always-on)
- No persistent state: static calendar data → GCS write → done
- No external API dependencies: pure date arithmetic against exchange holiday calendars
- Short-lived: typical completion 2 min

**No action required.**

---

## 4. features-onchain-service as Cloud Run Job

### Current state

Per `deployment-service/docs/resource-profiles/features-onchain-service.md`:

- **Execution: Cloud Run Job** — already deployed as a Cloud Run Job
- 1 vCPU (sharding YAML), 4 Gi, 30 min timeout
- Runs twice daily (CEFI + DEFI categories)
- No exchange API keys required; uses public DeFi protocol APIs

### Assessment

Already a Cloud Run Job. No conversion needed.

**Characteristics that confirm this is correct:**

- Event-driven / scheduled, not always-on
- Stateless: fetches pre-computed protocol metrics → aggregates → writes to GCS
- No persistent WebSocket or position state

**No action required.**

---

## 5. Rejected Patterns and Why

| Pattern                                                | Status                              | Reason                                                                                                                                   |
| ------------------------------------------------------ | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Sidecar pattern (risk + circuit breaker logic)         | Already decided — separate services | alerting-service owns PubSub propagation; risk owns 3-state machine per architecture decisions                                           |
| Shared Cloud Run Service (features in one image)       | REJECTED                            | Violates SRP; defeats independent scaling; delays faster services                                                                        |
| VM consolidation (run multiple services on one GCE VM) | NOT APPLICABLE                      | All feature services run cleanly on Cloud Run Jobs; no VM required except market-tick-data COINBASE shard                                |
| PnL in execution-service sidecar                       | REJECTED                            | PnL is data-warehouse attribution; execution is live order routing. Combining live and reporting concerns is an architectural violation. |

---

## 6. Services That Are Already Correctly Scoped as Cloud Run Jobs

The following services have `Execution: Cloud Run Job` in their resource profiles and require no conversion:

| Service                           | Daily invocations    | Duration  | Notes                                 |
| --------------------------------- | -------------------- | --------- | ------------------------------------- |
| features-calendar-service         | 1                    | 2 min     | Date arithmetic only                  |
| features-onchain-service          | 2 (CEFI + DEFI)      | 10–30 min | DeFi API aggregation                  |
| pnl-attribution-service           | 1 (EOD)              | 30 min    | Already batch-only                    |
| features-delta-one-service        | 1                    | 1 hr      | Primary batch feature job             |
| features-volatility-service       | 1                    | 45 min    | Options surface                       |
| features-sports-service           | 1 (season-dependent) | 30 min    | Off-season frequency reduced          |
| features-multi-timeframe-service  | 1                    | 45 min    | 7 timeframes                          |
| features-cross-instrument-service | 1                    | 1–3 hr    | L4; depends on delta-one + volatility |
| instruments-service               | 1                    | variable  | Pipeline DAG gate                     |
| market-data-processing-service    | 1 per shard          | variable  | Some shards on VM                     |

---

## 7. Always-On Services (Must Remain Standalone Cloud Run Services)

These services must NOT be converted to Cloud Run Jobs and must NOT be bundled:

| Service                          | Min instances | Reason                                                                  |
| -------------------------------- | ------------- | ----------------------------------------------------------------------- |
| execution-service                | 1             | Live order routing; cold start is unacceptable                          |
| risk-and-exposure-service        | 1             | Live risk monitoring; must receive position updates within 500ms SLA    |
| strategy-service                 | 1             | Live signal generation; CascadeSubscriber to PubSub                     |
| ml-inference-service             | 1             | Live inference on each features-ready event                             |
| alerting-service                 | 1             | Continuous PubSub subscription for circuit-breaker propagation          |
| position-balance-monitor-service | —             | Polls every 5 min via Cloud Scheduler; timeout=4 min to prevent overlap |

---

## References

- `deployment-service/docs/resource-profiles/` — all 22 per-service profiles
- `deployment-service/docs/resource-profiles/README.md` — resource class table + cost summary
- `phase3_service_hardening_integration.plan.md` — `p3-service-bundling-review` todo
- Architecture decisions: no service mesh; circuit breaker owned by execution-service/engine/ + alerting-service propagation
