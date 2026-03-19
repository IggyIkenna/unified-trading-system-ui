# Coordination Events -- Service-to-Service Wiring

> Last updated: 2026-03-15. This document maps all coordination events defined in `unified-events-interface` and
> documents which services publish and subscribe to each event, along with the PubSub topic convention and payload
> contracts.

## Overview

Coordination events enable **live-mode** service-to-service signalling via PubSub. They are distinct from lifecycle
events (which track a single service's batch/live run progress). Coordination events notify downstream services that
upstream work is complete and data is available for consumption.

**Key characteristics:**

- Live mode only -- `publish_coordination_event()` raises `ValueError` in batch mode
- Requires `setup_events()` to be called first with `mode="live"`
- Transport: PubSub (GCP Cloud Pub/Sub or equivalent)
- Schema: `CoordinationEvent` dataclass from `unified-events-interface`
- All event types must be UPPERCASE strings

**Machine-readable SSOT:** `unified-events-interface/unified_events_interface/schemas.py` --
`STANDARD_COORDINATION_EVENTS` set.

**UIC mirror:** `unified-internal-contracts/unified_internal_contracts/events.py` -- `LifecycleEventType` enum includes
`DATA_READY`, `PREDICTIONS_READY`, `STRATEGY_SIGNALS_READY`.

---

## Standard Coordination Events (10)

| Event Type                 | Domain       | Description                                        |
| -------------------------- | ------------ | -------------------------------------------------- |
| `DATA_READY`               | Market Data  | Processed candles available for downstream use     |
| `INSTRUMENTS_READY`        | Instruments  | Instrument definitions refreshed and available     |
| `FEATURES_READY`           | Features     | Feature calculations complete, output in GCS       |
| `PREDICTIONS_READY`        | ML Inference | ML predictions published (cascade confirmed)       |
| `SIGNALS_READY`            | Strategy     | Trading signals generated, ready for execution     |
| `INSTRUCTIONS_READY`       | Execution    | Trade instructions queued (defined, not yet wired) |
| `LIVE_ODDS_RECEIVED`       | Sports       | Live odds data received from feed                  |
| `LIVE_MATCH_STATE_UPDATED` | Sports       | Match state updated from live feed                 |
| `LIVE_FEATURES_COMPUTED`   | Sports       | Sports features calculated from live data          |
| `LIVE_SIGNAL_GENERATED`    | Sports       | Sports trading signal generated                    |

---

## Wiring Map -- Publishers and Subscribers

### Financial Pipeline (CeFi/TradFi/DeFi)

```
instruments-service
  publishes ──> INSTRUMENTS_READY
                    │
                    └──> market-tick-data-service (SUBSCRIBER)
                              subscribes via subscribe_coordination_events("INSTRUMENTS_READY", handler)
                              Action: starts tick collection for received instruments

market-data-processing-service
  publishes ──> DATA_READY
                    │
                    └──> (NO SUBSCRIBER WIRED)
                         Intended: features-delta-one-service should subscribe in live mode
                         Currently: features-* services run on batch schedule, not event-driven

features-delta-one-service
  publishes ──> FEATURES_READY
                    │
                    └──> (NO SUBSCRIBER WIRED)
                         Intended: ml-inference-service should subscribe in live mode
                         Currently: ml-inference reads features from GCS on its own schedule

ml-inference-service
  publishes ──> PREDICTIONS_READY (via cascade_prediction_publisher.py)
                    │
                    └──> (NO SUBSCRIBER WIRED)
                         Intended: strategy-service should subscribe in live mode
                         Currently: strategy-service consumes predictions via PubSub topic
                         (cascade_predictions), not coordination events

strategy-service
  publishes ──> SIGNALS_READY
                    │
                    └──> (NO SUBSCRIBER WIRED)
                         Intended: execution-service should subscribe in live mode
                         Currently: execution-service is not wired to coordination events
```

### Sports Pipeline

```
strategy-service (sports_feature_subscriber.py)
  publishes ──> LIVE_FEATURES_COMPUTED
  publishes ──> LIVE_SIGNAL_GENERATED
  (These are logged as coordination events but no downstream subscriber is wired)
```

---

## Wiring Status Summary

| Event                      | Publisher(s)                      | Subscriber(s)            | Status       |
| -------------------------- | --------------------------------- | ------------------------ | ------------ |
| `INSTRUMENTS_READY`        | instruments-service               | market-tick-data-service | WIRED        |
| `DATA_READY`               | market-data-processing-service    | (none)                   | PUBLISH ONLY |
| `FEATURES_READY`           | features-delta-one-service        | (none)                   | PUBLISH ONLY |
| `PREDICTIONS_READY`        | ml-inference-service              | (none)                   | PUBLISH ONLY |
| `SIGNALS_READY`            | strategy-service                  | (none)                   | PUBLISH ONLY |
| `INSTRUCTIONS_READY`       | (none)                            | (none)                   | DEFINED ONLY |
| `LIVE_ODDS_RECEIVED`       | (none)                            | (none)                   | DEFINED ONLY |
| `LIVE_MATCH_STATE_UPDATED` | (none)                            | (none)                   | DEFINED ONLY |
| `LIVE_FEATURES_COMPUTED`   | strategy-service (sports adapter) | (none)                   | PUBLISH ONLY |
| `LIVE_SIGNAL_GENERATED`    | strategy-service (sports adapter) | (none)                   | PUBLISH ONLY |

**Assessment:** Only 1 of 10 coordination events has both a publisher and subscriber wired (`INSTRUMENTS_READY`). The
remaining 5 published events have no subscriber, and 4 events are defined but neither published nor subscribed.

---

## Gaps Requiring Wiring

### GAP-1: DATA_READY subscriber missing

**Flow:** `market-data-processing-service` --> `DATA_READY` --> `features-delta-one-service`

- Publisher: `market_data_processing_service/app/core/orchestration_service.py:147`
- Subscriber needed: features-delta-one-service live mode handler
- Currently, features services run on batch schedules. In live mode, they should subscribe to `DATA_READY` to trigger
  feature recalculation when new candles arrive.

### GAP-2: FEATURES_READY / PREDICTIONS_READY chain missing

**Flow:** `features-*` --> `FEATURES_READY` --> `ml-inference-service` --> `PREDICTIONS_READY` --> `strategy-service`

- features-delta-one-service publishes `FEATURES_READY` at
  `features_delta_one_service/cli/handlers/batch_handler.py:382`
- ml-inference-service publishes `PREDICTIONS_READY` at
  `ml_inference_service/app/core/cascade_prediction_publisher.py:132`
- Neither ml-inference-service nor strategy-service subscribe to upstream coordination events
- strategy-service consumes predictions via the `cascade_predictions` PubSub topic (direct PubSub subscription, not via
  coordination events)

### GAP-3: SIGNALS_READY subscriber missing

**Flow:** `strategy-service` --> `SIGNALS_READY` --> `execution-service`

- Publisher: `strategy_service/cli/service_entry.py:423`
- execution-service has no `subscribe_coordination_events` call
- execution-service currently uses its own PubSub subscription for trade instructions

### GAP-4: Sports coordination events not wired

- `LIVE_ODDS_RECEIVED` and `LIVE_MATCH_STATE_UPDATED` are defined but have no publisher or subscriber
- `LIVE_FEATURES_COMPUTED` and `LIVE_SIGNAL_GENERATED` are published by strategy-service's sports adapter but have no
  subscriber

---

## CoordinationEvent Schema

```python
@dataclass
class CoordinationEvent:
    timestamp: datetime       # UTC timestamp
    source_service: str       # e.g., "market-data-processing-service"
    event_type: str           # e.g., "DATA_READY" (must be UPPERCASE)
    payload: JSONDict         # Event-specific data (must not be empty)
    correlation_id: str       # Workflow correlation ID
```

### Payload Conventions by Event Type

| Event Type          | Payload Fields                                                      |
| ------------------- | ------------------------------------------------------------------- |
| `DATA_READY`        | `timestamp`, `data_type` ("candles"), `count`, `date`, `category`   |
| `INSTRUMENTS_READY` | `event_type`, `instruments_count`, `gcs_path`                       |
| `FEATURES_READY`    | `timestamp`, `feature_groups_count`                                 |
| `PREDICTIONS_READY` | `instrument_id`, `timeframe`, `model_id`, `direction`, `confidence` |
| `SIGNALS_READY`     | `successful_dates`, `total_dates`                                   |

---

## API Usage

### Publishing (upstream service)

```python
from unified_events_interface import publish_coordination_event

# After processing completes:
with contextlib.suppress(RuntimeError, ValueError):
    publish_coordination_event(
        "DATA_READY",
        payload={
            "timestamp": datetime.now(UTC).isoformat(),
            "data_type": "candles",
            "count": total_success,
            "date": date_str,
            "category": category.value,
        },
    )
```

### Subscribing (downstream service)

```python
from unified_events_interface import subscribe_coordination_events

# At service startup (live mode):
def _on_data_ready(event: CoordinationEvent) -> None:
    logger.info("DATA_READY received: %s", event.payload)
    # Trigger feature recalculation...

subscribe_coordination_events("DATA_READY", _on_data_ready)
```

---

## Design Notes

- **Batch mode guard:** All publishers wrap `publish_coordination_event()` in
  `contextlib.suppress(RuntimeError, ValueError)` because the function raises `ValueError` in batch mode. This is
  correct -- coordination events only make sense in live streaming workflows.
- **PubSub vs coordination events:** Some services use direct PubSub topic subscriptions (e.g., strategy-service
  subscribes to `cascade_predictions` topic) alongside coordination events. Coordination events are a higher-level
  abstraction built on PubSub; direct PubSub is used when the payload requires streaming semantics rather than one-shot
  notifications.
- **Idempotency:** Subscribers must be idempotent. Coordination events may be delivered more than once (PubSub
  at-least-once semantics).

---

## Related

- Lifecycle events: `03-observability/lifecycle-events.md`
- Data flow map: `04-architecture/data-flow-map.md`
- Event schemas: `unified-events-interface/unified_events_interface/schemas.py`
- UIC event types: `unified-internal-contracts/unified_internal_contracts/events.py`
