# Kill Switch & Circuit Breaker

## Overview

The kill switch and circuit breaker are two distinct safety mechanisms that operate at different scopes. The kill switch
is a system-wide hard stop; the circuit breaker is a per-service adaptive protection layer.

---

## Kill Switch

### Ownership

- **State machine**: `execution-service` owns the 3-state kill switch machine.
- **PubSub propagation**: `alerting-service` owns publishing the `KILL_SWITCH_ACTIVATED` event to the
  `circuit-breaker-commands` PubSub topic, which all services subscribe to.

### How to Trigger Manually

Send a POST to the deployment-api kill-switch endpoint:

```
POST /admin/kill-switch
Authorization: Bearer <SERVICE_ACCOUNT_TOKEN>
Content-Type: application/json

{
  "action": "activate",
  "reason": "Manual halt — suspected fat-finger order"
}
```

The deployment-api forwards the command to execution-service via an internal PubSub message on the
`kill-switch-commands` topic. The execution-service transitions to `HALTED` state and emits `KILL_SWITCH_ACTIVATED` back
through alerting-service for cross-service propagation.

### Deactivation

```
POST /admin/kill-switch
Authorization: Bearer <SERVICE_ACCOUNT_TOKEN>
Content-Type: application/json

{
  "action": "deactivate",
  "reason": "Manual resume after incident review"
}
```

Deactivation requires a human-in-the-loop acknowledgement. The service transitions from `HALTED` to `CLOSED` (normal
operating state) only after the deactivation request is confirmed by alerting-service.

### Propagation Path

```
POST /admin/kill-switch (deployment-api)
    │
    ├─► kill-switch-commands PubSub topic
    │       │
    │       ├─► execution-service (transitions CLOSED → HALTED, rejects all new orders)
    │       └─► strategy-service  (stops emitting signals)
    │
    └─► alerting-service publishes KILL_SWITCH_ACTIVATED to circuit-breaker-commands
            │
            └─► ALL subscribing services halt dependent work
```

---

## Circuit Breaker

### Ownership

- **3-state machine implementation**: `execution-service/engine/` owns the circuit breaker state machine.
- **Cross-service propagation**: `alerting-service` subscribes to the execution-service event stream and publishes
  `CIRCUIT_BREAKER_OPEN` to the `circuit-breaker-commands` PubSub topic when the breaker trips.

### States

| State       | Description                                        | Behaviour                                  |
| ----------- | -------------------------------------------------- | ------------------------------------------ |
| `CLOSED`    | Normal operation. Requests flow through.           | All calls proceed.                         |
| `OPEN`      | Failure threshold exceeded. Requests are rejected. | Fast-fail; no downstream calls made.       |
| `HALF_OPEN` | Testing whether the downstream has recovered.      | One probe request allowed; others blocked. |

### State Transitions

```
CLOSED ──(failure_count >= threshold)──► OPEN
OPEN   ──(timeout_elapsed)─────────────► HALF_OPEN
HALF_OPEN ──(probe succeeds)───────────► CLOSED
HALF_OPEN ──(probe fails)──────────────► OPEN
```

### Thresholds (defaults)

| Parameter            | Default | Notes                                      |
| -------------------- | ------- | ------------------------------------------ |
| `failure_threshold`  | 5       | Consecutive failures before tripping       |
| `recovery_timeout_s` | 30      | Seconds in OPEN before moving to HALF_OPEN |
| `success_threshold`  | 1       | Probe successes needed to close            |

### Recovery Criteria

A circuit breaker returns to `CLOSED` when:

1. The `recovery_timeout_s` window elapses (OPEN → HALF_OPEN).
2. A probe request to the downstream service succeeds (HALF_OPEN → CLOSED).

If the probe fails, the breaker resets to `OPEN` and the recovery timeout restarts.

### PubSub Events

| Event                   | Published by     | Subscribers                                     |
| ----------------------- | ---------------- | ----------------------------------------------- |
| `CIRCUIT_BREAKER_OPEN`  | alerting-service | All T4+ services via `circuit-breaker-commands` |
| `CIRCUIT_BREAKER_RESET` | alerting-service | All T4+ services via `circuit-breaker-commands` |

---

## Related

- `07-security/compliance.md` — compliance events emitted during halt/resume
- `08-workflows/service-pair-flows.md` — execution ↔ alerting service interaction
- `03-observability/alerting.md` — alert rules tied to circuit breaker state changes
- Phase 3 plan: `topology-kill-switch-propagation` (T4 Batch F), `topology-circuit-breaker-impl` (T4 Batch F)
