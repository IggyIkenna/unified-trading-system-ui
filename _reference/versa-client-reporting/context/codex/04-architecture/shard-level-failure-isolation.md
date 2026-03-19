# Shard-Level Failure Isolation (SSOT)

## Rule

**A failed shard MUST NOT kill other shards in the same batch.**

Shards are the isolation boundary. When processing fails for one shard, the service:
1. Logs the error with full details (venue, error message, shard ID, correlation ID) to the event stream
2. Emits a `VENUE_PROCESSING_FAILED` or `DATE_PROCESSING_FAILED` event with error details
3. Continues processing remaining shards
4. Reports partial success at the end (not total failure)

A **partially complete shard** should be killed — do not store partial data for a shard that errored mid-processing.

## Sharding Dimensions

| Service | Shard Dimensions | Example |
|---------|-----------------|---------|
| instruments-service | category x venue x date | CEFI x BINANCE-SPOT x 2026-01-05 |
| market-tick-data-service | category x venue x instrument_type x data_type x date | CEFI x BINANCE-SPOT x SPOT_PAIR x trades x 2026-01-05 |
| market-data-processing-service | category x venue x instrument_type x date x timeframe | CEFI x BINANCE-SPOT x SPOT_PAIR x 2026-01-05 x 1min |

## Error Handling Pattern

```python
for venue in venues_to_process:
    try:
        result = await process_venue(venue, date)
        all_results[venue] = result
    except (ValueError, KeyError, TypeError, RuntimeError) as e:
        # Per-shard error isolation: log and continue
        logger.error("Shard %s/%s failed: %s — continuing", venue, date, e)
        log_event("VENUE_PROCESSING_FAILED", details={
            "venue": venue,
            "date": date.isoformat(),
            "error": str(e),
            "error_type": type(e).__name__,
            "correlation_id": correlation_id,
        })
        # Do NOT raise — continue with remaining shards
```

## Anti-Patterns (DO NOT)

- `raise RuntimeError(...)` inside a per-venue loop — kills all remaining venues
- Swallowing errors silently (`except: pass`) — errors must be logged and evented
- Storing partial shard data — if a shard fails mid-processing, discard its partial output

## Event Stream Requirements

Failed shard events MUST include:
- `venue`: Which venue/shard failed
- `error`: Human-readable error message
- `error_type`: Exception class name
- `correlation_id`: For tracing
- `category`: Market category (cefi, tradfi, defi, sports)

This enables diagnosis from the event stream (GCS in batch, PubSub in live) without re-running the service.
