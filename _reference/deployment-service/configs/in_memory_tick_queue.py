"""
InMemoryTickQueue Protocol — Hybrid Live Seam Interface

ALLOWED ONLY under co_located_vm deployment profile.

This Protocol defines the contract between market-tick-data-service (MTDS) as
producer and market-data-processing-service (MDPS) as consumer when both services
run co-located on the same VM.

FORBIDDEN in: cloud_run | batch | multi_vm
PERMITTED in: co_located_vm ONLY

See: deployment-service/docs/hybrid-live-seam.md
"""

from __future__ import annotations

import queue
from typing import Protocol, runtime_checkable


@runtime_checkable
class InMemoryTickQueue(Protocol):
    """
    Protocol for the in-memory tick queue seam between MTDS and MDPS.

    Implementations:
        - queue.Queue(maxsize=10_000)  — standard threading implementation
        - asyncio.Queue(maxsize=10_000) — for async service implementations

    Usage (MTDS producer side):
        tick_queue.put({"instrument_id": "BINANCE:SPOT:BTC-USDT", "price": 42000.0, ...})

    Usage (MDPS consumer side):
        try:
            tick = tick_queue.get_nowait()
        except queue.Empty:
            break  # no more ticks in window
    """

    def put(self, tick: dict) -> None:
        """
        Write a tick into the queue.

        Blocks if queue is full (applies backpressure — MTDS slows down).
        tick must contain at minimum: instrument_id (str), timestamp (int, epoch_us).
        """
        ...

    def get_nowait(self) -> dict:
        """
        Read one tick without blocking.

        Raises queue.Empty if no ticks are available.
        MDPS should drain in a tight loop until queue.Empty, then process window.
        """
        ...


def make_tick_queue(maxsize: int = 10_000) -> queue.Queue[dict]:
    """
    Factory for the default threading-based InMemoryTickQueue implementation.

    Only call this from orchestrator code that has already confirmed:
        deployment_profile == "co_located_vm"

    Args:
        maxsize: Maximum ticks in queue before backpressure kicks in.
                 Default 10_000 covers ~10s of 1000 ticks/sec throughput.

    Returns:
        A queue.Queue[dict] that satisfies the InMemoryTickQueue Protocol.
    """
    return queue.Queue(maxsize=maxsize)
