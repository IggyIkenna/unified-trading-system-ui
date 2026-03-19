# Resource Profile: risk-and-exposure-service

## Deployment Mode

- Mode: both (batch risk reporting + live risk monitoring)
- Cloud Run region: asia-northeast1
- Execution: Cloud Run Job (batch) | Cloud Run Service (live)

## Resource Allocation

### Batch Mode (Risk Reporting)

| Resource    | Value           | Rationale                                                                                      |
| ----------- | --------------- | ---------------------------------------------------------------------------------------------- |
| CPU         | 4 vCPU          | Portfolio-level VaR, Greeks aggregation, stress testing across full instrument universe        |
| Memory      | 16 Gi           | Must hold full portfolio positions + correlation matrix + market data in memory simultaneously |
| Timeout     | 86400 s (24 hr) | Maximum — Monte Carlo simulations and full scenario analysis are time-intensive                |
| Max retries | 3               | Idempotent; retry on transient failures                                                        |

### Live Mode (Real-time Risk)

| Resource      | Value  | Rationale                                                             |
| ------------- | ------ | --------------------------------------------------------------------- |
| CPU           | 4 vCPU | Real-time Greeks recalculation on each tick requires sustained CPU    |
| Memory        | 16 Gi  | Same as batch: full live portfolio state must be in memory            |
| Min instances | 1      | Risk must not go offline during live trading; cold start unacceptable |

## Cost Estimate

GCP Cloud Run pricing (vCPU-second: $0.00002400, GB-second: $0.00000250).

| Scenario                    | Invocations/day | Avg duration   | Est. monthly cost |
| --------------------------- | --------------- | -------------- | ----------------- |
| Daily risk report           | 1               | 3600 s (1 hr)  | ~$4.25            |
| Full stress test            | 1               | 10800 s (3 hr) | ~$12.75           |
| Live monitoring (always-on) | always-on       | 86400 s        | ~$50/month        |

Assumptions: 4 vCPU + 16 Gi; live mode is one of the most expensive always-on services.

## Data Flow

- **Source:** GCS execution results (positions) + GCS market data (current prices) + PubSub live events
- **Sink:** GCS risk reports bucket; PubSub risk alerts topic
- **Live env backend:** PubSub (event bus) + Secret Manager (thresholds)

## Risk Metrics Computed

- Portfolio VaR (Value at Risk) — 1-day, 1% and 5% confidence
- Greeks (delta, gamma, vega, theta) — aggregated across portfolio
- Concentration risk — by instrument, sector, venue
- Liquidity risk — estimated time-to-exit per position
- Stress scenarios — GFC 2008, COVID 2020, crypto flash crashes

## Special Requirements

- Largest compute footprint among always-on services (tied with execution-service)
- Live mode must receive position updates from execution-service via PubSub within SLA (< 500ms)
- Circuit breaker integration: if risk limits breached, publishes to alerting-service PubSub topic

## Source References

- `deployment-service/terraform/services/risk-and-exposure-service/gcp/variables.tf`
- `deployment-service/configs/services/risk-and-exposure-service/live.env`
