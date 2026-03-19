# Alerting

## TL;DR

Alerts are categorized by severity and mapped to the three-tier event model. Currently, failure detection (OOM, startup
timeout) is [IMPLEMENTED] with automatic VM termination. Notification channels (Slack for pipeline failures, PagerDuty
for live critical) are [PLANNED]. Alert triggers are derived from lifecycle events, resource events, and domain events
via the UTD v2 API.

---

## Alert Categories

### Infrastructure Alerts (from Resource Events -- Tier 2)

| Alert           | Trigger                           | Detection                  | Response                                      | Status        |
| --------------- | --------------------------------- | -------------------------- | --------------------------------------------- | ------------- |
| OOM Death Loop  | Serial log OOM pattern >= 5 times | UTD v2 auto-sync (30s)     | VM terminated, state set to `oom_death_loop`  | [IMPLEMENTED] |
| Startup Timeout | No `SERVICE_STARTED` after 5 min  | UTD v2 auto-sync (30s)     | VM terminated, state set to `startup_timeout` | [IMPLEMENTED] |
| Memory Critical | `memory_percent > 90%`            | `PerformanceMonitor` (30s) | Log at ERROR level, `resource_alert` JSON     | [IMPLEMENTED] |
| Memory Warning  | `memory_percent > 85%`            | `PerformanceMonitor` (30s) | Log at WARNING level                          | [IMPLEMENTED] |
| CPU High        | `cpu_percent > 90%`               | `PerformanceMonitor` (30s) | Log at WARNING level                          | [IMPLEMENTED] |
| Disk High       | `disk_usage_percent > 90%`        | `PerformanceMonitor` (30s) | Log at WARNING level                          | [IMPLEMENTED] |

### Pipeline Alerts (from Lifecycle Events -- Tier 1)

| Alert             | Trigger                                 | Detection              | Response                           | Status                                               |
| ----------------- | --------------------------------------- | ---------------------- | ---------------------------------- | ---------------------------------------------------- |
| Service Failed    | `FAILED` event emitted                  | UTD v2 event parser    | Shard state `failed`, notification | [IMPLEMENTED] (detection) / [PLANNED] (notification) |
| Stage Timeout     | No `STOPPED` within 30 min of `STARTED` | UTD v2 time comparison | Investigation alert                | [PLANNED]                                            |
| Validation Failed | `VALIDATION_FAILED` event               | UTD v2 event parser    | Check upstream deps                | [IMPLEMENTED] (detection)                            |
| Slow Stage        | Stage duration > threshold              | UTD v2 `stage_timings` | Performance investigation          | [PLANNED]                                            |

### Data Quality Alerts (from Domain Events -- Tier 3)

| Alert                    | Trigger                                 | Detection            | Response               | Status                                   |
| ------------------------ | --------------------------------------- | -------------------- | ---------------------- | ---------------------------------------- |
| Timestamp Mismatch       | `TIMESTAMP_VALIDATION_FAILED`           | Domain event in logs | Skip file, investigate | [IMPLEMENTED] (skip) / [PLANNED] (alert) |
| Buffer Validation Failed | `BUFFER_VALIDATION_FAILED`              | Domain event in logs | Check upstream data    | [IMPLEMENTED] (skip) / [PLANNED] (alert) |
| Dependency Check Failed  | `DEPENDENCY_CHECK_FAILED`               | Domain event in logs | Wait for upstream      | [IMPLEMENTED] (detection)                |
| Download Failed          | `API_DOWNLOAD_FAILED` count > threshold | Domain event count   | Check API/credentials  | [PLANNED]                                |

### Live Trading Alerts (from Domain Events -- Tier 3)

| Alert              | Trigger                         | Detection                | Response               | Status    |
| ------------------ | ------------------------------- | ------------------------ | ---------------------- | --------- |
| Position Drift     | Live position != expected       | Strategy reconciliation  | Manual intervention    | [PLANNED] |
| Prediction Latency | Inference time > SLA            | ml-inference timing      | Scale resources        | [PLANNED] |
| Signal Anomaly     | Signal count deviates > 2 sigma | Strategy output analysis | Review strategy params | [PLANNED] |
| Execution Failure  | Order rejected or failed        | Execution service events | Manual review          | [PLANNED] |

---

## Notification Channels [IMPLEMENTED]

### Slack Integration

**Target:** Pipeline failures and batch observability alerts.

```
Channel: #pipeline-alerts
  - OOM death loop detected
  - Startup timeout detected
  - Service FAILED events
  - Stage timeout (>30 min)
  - Data quality validation failures

Channel: #pipeline-status
  - Deployment completion summaries
  - Daily pipeline health report
```

### PagerDuty Integration

**Target:** Live trading critical failures only.

```
Severity: P1 (Critical)
  - Position drift > threshold
  - Live service FAILED with no recovery
  - Execution order failures

Severity: P2 (Warning)
  - Prediction latency > SLA
  - Signal anomaly detected
```

---

## Alert Flow Architecture [IMPLEMENTED]

```
Event Sources
  |
  |-- Tier 1 (Lifecycle) --> UTD v2 Event Parser
  |-- Tier 2 (Resource)  --> PerformanceMonitor / Serial Console
  |-- Tier 3 (Domain)    --> UTD v2 Event Parser
  |
  v
UTD v2 API (auto-sync every 30s)
  |
  |-- Shard state updates (status, failure_category)
  |-- [PLANNED] Alert evaluation engine
  |     |
  |     |-- Match event against alert rules
  |     |-- Deduplicate (no repeat alerts for same shard)
  |     |-- Route to notification channel
  |     |
  |     v
  |-- [IMPLEMENTED] Slack webhook  --> #pipeline-alerts  (alerting_service/notifiers/slack.py)
  |-- [IMPLEMENTED] PagerDuty API  --> On-call rotation  (alerting_service/notifiers/pagerduty.py)
  |-- [IMPLEMENTED] VM termination (OOM, startup timeout)
```

---

## Current Detection (What Works Today)

### OOM Detection [IMPLEMENTED]

```python
# In UTD v2 auto-sync:
# 1. Fetch serial console logs
# 2. Count OOM-related patterns
# 3. If count >= OOM_KILL_THRESHOLD (default 5):
#    - Set failure_category = "oom_death_loop"
#    - Terminate VM via fire-and-forget
```

### Startup Timeout [IMPLEMENTED]

```python
# In UTD v2 auto-sync:
# 1. Check VM uptime
# 2. If > VM_STARTUP_TIMEOUT_SECONDS (default 300):
#    - Scan serial logs for "SERVICE_EVENT: STARTED"
#    - If not found:
#      - Set failure_category = "startup_timeout"
#      - Terminate VM
```

### Event-Based State Updates [IMPLEMENTED]

```python
# In UTD v2 auto-sync:
# 1. Parse SERVICE_EVENT: lines from serial logs
# 2. Update shard state:
#    - current_stage, stage_timings, progress
# 3. On FAILED event:
#    - Set status = "failed"
#    - Set failure_category = "service_failed"
```

---

## Monitoring Queries for Alerting [PLANNED]

### Missing STOPPED Event (Stage Timeout)

```
resource.type="gce_instance"
textPayload=~"SERVICE_EVENT: STARTED"
NOT textPayload=~"SERVICE_EVENT: STOPPED"
timestamp < NOW() - 30m
```

### High Failure Rate

```
resource.type="gce_instance"
textPayload=~"SERVICE_EVENT: FAILED"
| group_by resource.labels.instance_id, count()
| where count > 3
```

### Slow Processing Stages

```
resource.type="gce_instance"
jsonPayload.stage_timings.processing > 300
```

---

## Configuration

| Parameter                    | Default         | Description                                                         |
| ---------------------------- | --------------- | ------------------------------------------------------------------- |
| `OOM_KILL_THRESHOLD`         | `5`             | Serial log OOM patterns before VM termination                       |
| `VM_STARTUP_TIMEOUT_SECONDS` | `300`           | Seconds before startup timeout                                      |
| `STATE_TTL_HOURS`            | `48`            | Shard state retention                                               |
| Slack webhook URL            | --              | [IMPLEMENTED] via Secret Manager (`alerting-slack-webhook-url`)     |
| PagerDuty service key        | --              | [IMPLEMENTED] via Secret Manager (`alerting-pagerduty-routing-key`) |
| Stage timeout threshold      | `1800` (30 min) | [PLANNED]                                                           |
| Download failure threshold   | `10`            | [PLANNED]                                                           |

---

## Infrastructure Health (Machine-Readable SSOT)

**SSOT:** `runtime-topology.yaml` `health_probes` section.

### Cloud Run Services

API services expose `/health` (liveness) and `/readiness` endpoints. Cloud Run auto-restarts on health check failure.
Services: execution-results-api, market-data-api, client-reporting-api, deployment-api.

### VM Services

deployment-service watchdog monitors: CPU, memory, disk, serial console OOM patterns. Thresholds: 85% memory warning,
90% critical.

### Pre-Crash State Dump

`ResourceAwareShutdownHandler` persists state checkpoint to GCS at 85% memory threshold. If VM crashes before logging,
Cloud Logging + serial console are the forensics source (infrastructure-level, not our code).

### Post-Crash Recovery

alerting-service subscribes to Cloud Logging error/crash entries for automated incident creation (Slack + PagerDuty).
