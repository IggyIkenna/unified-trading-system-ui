# Hybrid Live Seam — MDPS ← MTDS In-Memory Adapter

## Overview

The hybrid live seam is an **in-memory tick queue** that allows `market-data-processing-service`
(MDPS) to consume ticks from `market-tick-data-service` (MTDS) without going through
GCS or PubSub. This eliminates cloud I/O round-trip latency for the critical
tick-to-candle pipeline when both services are co-located on the same VM.

## When It Is Allowed

**This seam is ONLY permitted when `deployment_profile = "co_located_vm"` in
`deployment-service/configs/runtime-topology.yaml`.**

In all other deployment profiles (cloud_run, batch, multi_vm), MTDS writes ticks to
GCS and MDPS reads from GCS via the standard `GCSDataSource` path.

```
FORBIDDEN in: cloud_run | batch | multi_vm | any profile other than co_located_vm
PERMITTED in: co_located_vm ONLY
```

## How It Works

```
co_located_vm profile ONLY:

  ┌─────────────────────────────────────────┐
  │           co-located VM                 │
  │                                         │
  │  ┌──────────────────┐                   │
  │  │  market-tick-    │  put(tick)        │
  │  │  data-service    │──────────────┐    │
  │  │  (MTDS)          │              │    │
  │  └──────────────────┘              ▼    │
  │                           ┌─────────────┤
  │                           │ InMemory    │
  │                           │ TickQueue   │
  │                           │ (asyncio.   │
  │                           │  Queue or   │
  │                           │  queue.Queue│
  │                           └──────┬──────┤
  │  ┌──────────────────┐            │      │
  │  │  market-data-    │  get_nowait│      │
  │  │  processing-svc  │◄───────────┘      │
  │  │  (MDPS)          │                   │
  │  └──────────────────┘                   │
  └─────────────────────────────────────────┘

Standard profiles (cloud_run, batch, multi_vm):

  MTDS ──► GCS (raw_tick_data/) ──► MDPS (GCSDataSource.read_tick_data)
```

### Mechanism

1. At service startup, the orchestrator detects `deployment_profile = co_located_vm`
2. A shared `InMemoryTickQueue` instance is created (see interface below)
3. MTDS receives a reference to the queue and calls `put(tick)` for every tick
4. MDPS `LiveDataSource` uses `get_nowait()` to drain the queue during each
   processing window (rolling 15-min candle window)
5. The queue is bounded (default `maxsize=10_000`) to apply backpressure
   if MDPS falls behind MTDS

### Why Not PubSub?

In `co_located_vm`, PubSub would add:

- ~50-200ms network round-trip per message
- GCP egress/ingress cost for high-frequency tick data
- Serialization overhead (proto/JSON encoding per tick)

The in-memory seam reduces latency to microseconds and eliminates cloud I/O cost
for co-located deployments (e.g., single GCE VM running both services as threads
or subprocesses).

## Protocol Interface

The `InMemoryTickQueue` Protocol is defined in
`deployment-service/configs/in_memory_tick_queue.py`:

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class InMemoryTickQueue(Protocol):
    def put(self, tick: dict) -> None:
        """Write a tick into the queue. Blocks if queue is full (backpressure)."""
        ...

    def get_nowait(self) -> dict:
        """Read one tick. Raises queue.Empty if no ticks available."""
        ...
```

See `deployment-service/configs/in_memory_tick_queue.py` for the canonical definition.

## Existing Interface Code

- `market-data-processing-service/market_data_processing_service/app/core/data_source.py`
  — `LiveDataSource` class uses a shared `data_buffer: dict` (instrument_key → DataFrame)
  — this is the MDPS side of the seam (reads from in-memory buffer)
- `market-data-processing-service/market_data_processing_service/app/core/data_sink.py`
  — `AsyncGCSDataSink` queues processed candles for background GCS persistence
  — the queue pattern (`persistence_queue.put(write_task)`) mirrors the seam design

## Guard: Profile Check

Any code that instantiates the shared `InMemoryTickQueue` MUST check the deployment
profile first. Violation of this guard is a P0 architectural defect.

```python
# CORRECT — only create the seam when co_located_vm
from unified_cloud_interface import get_service_mode
from unified_config_interface import UnifiedCloudConfig

def build_tick_source(config: UnifiedCloudConfig):
    profile = config.deployment_profile  # from DEPLOYMENT_PROFILE env var
    if profile == "co_located_vm":
        import queue
        return queue.Queue(maxsize=10_000)  # shared with MTDS
    # All other profiles: return None (MDPS reads from GCS)
    return None
```

## Warning

**This pattern is FORBIDDEN in any deployment profile other than `co_located_vm`.**

Using this seam in `cloud_run`, `batch`, or `multi_vm` deployments would silently
drop ticks (the two services would not share the same memory space) and result
in empty candle output with no error. Quality gate STEP 5.11 must be extended
to flag any instantiation of `InMemoryTickQueue` outside of a `co_located_vm`
profile guard.

## References

- `deployment-service/configs/runtime-topology.yaml` — deployment profile definitions
- `deployment-service/configs/in_memory_tick_queue.py` — canonical Protocol definition
- `market-data-processing-service/market_data_processing_service/app/core/data_source.py`
  — `LiveDataSource` (MDPS consumer side)
- `unified-trading-codex/06-coding-standards/integration-testing-layers.md`
  — Layer 1.5 tests must mock the seam (never use the real queue in unit tests)
- `unified-trading-pm/plans/active/phase1_foundation_prep.plan.md` — hybrid-live-seam task
