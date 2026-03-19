# Timestamp Ordering

## Overview

Every event flowing through the unified trading pipeline carries multiple timestamps that record when it was created at
each stage. Strict UTC-aware ordering is enforced at write time.

---

## UTC Requirement

All timestamps **must** be timezone-aware UTC datetimes.

```python
# CORRECT
from datetime import datetime, timezone

ts = datetime.now(tz=timezone.utc)

# WRONG — produces a naive datetime with no timezone info
ts = datetime.utcnow()  # noqa: DTZ003  — DO NOT USE
```

`basedpyright` is configured to flag `datetime.utcnow()` as a warning. Any occurrence in production code is a bug.

---

## Four-Stage Pipeline Sequence

Every published event must satisfy the following ordering invariant:

```
exchange_time ≤ received_time ≤ processed_time ≤ published_time
```

| Timestamp        | Set by                   | Meaning                                          |
| ---------------- | ------------------------ | ------------------------------------------------ |
| `exchange_time`  | Market tick data handler | Timestamp from the venue/exchange message        |
| `received_time`  | Market tick data handler | Wall-clock time the message was received locally |
| `processed_time` | Processing service       | Wall-clock time processing completed             |
| `published_time` | Publishing service       | Wall-clock time the PubSub message was published |

---

## Validation Before Every Write

Call `validate_timestamp_ordering()` before persisting or publishing any event that carries these four fields.

```python
from unified_trading_services.timestamps import validate_timestamp_ordering

validate_timestamp_ordering(
    exchange_time=event.exchange_time,
    received_time=event.received_time,
    processed_time=event.processed_time,
    published_time=event.published_time,
)
# raises TimestampOrderingViolation if invariant is broken
```

Do not skip this call. Violations downstream (e.g. in features or ML layers) are hard to diagnose after the fact.

---

## Clock Skew Tolerance

Exchange timestamps may arrive slightly in the future relative to local wall-clock due to clock skew between the venue
and the system. A tolerance of **500 ms** is allowed:

```
exchange_time ≤ received_time + timedelta(milliseconds=500)
```

If `exchange_time` exceeds `received_time + 500ms`, log a `WARNING` and clamp `exchange_time` to `received_time`. Do not
raise an error — this is a monitoring signal, not a hard failure.

---

## Storage and Serialisation

- Always serialise timestamps as ISO 8601 with explicit `+00:00` suffix: `2026-03-08T14:00:00.123456+00:00`.
- Never store as a naive string without timezone (e.g. `"2026-03-08T14:00:00"` alone is forbidden).
- BigQuery columns: use `TIMESTAMP` (not `DATETIME`) so timezone information is preserved.
- GCS filenames that include a date partition must use `YYYY-MM-DD` in UTC, never local time.

---

## Rules

- `datetime.utcnow()` is banned — use `datetime.now(tz=timezone.utc)`.
- `datetime.now()` with no `tz` argument is banned — always pass `tz=timezone.utc`.
- Do not compare a naive datetime to an aware datetime — this raises a `TypeError`; fix the source.
- `validate_timestamp_ordering()` must be called before every write that includes all four fields.
- MTDH (market-tick-data-service) is the canonical source of `exchange_time` and `received_time`; downstream services
  must not overwrite them.

---

## Related

- Phase 3 plan: `topology-timestamp-ordering` (T4 Batch B — MTDH)
- `02-data/` — data schema standards including timestamp fields
- `06-coding-standards/validation-patterns.md` — Pydantic validators for timestamps
