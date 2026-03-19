# Contract Failure Handling

## Dead-Letter Queue Strategy

All adapters must validate raw API responses before normalisation. Validation failures are routed to a dead-letter queue
— never silently pass-through.

---

## Flow

```
RAW API RESPONSE
  → _safe_parse() (unified-api-contracts Pydantic validation)
  → ValidationError → EnhancedError(category=VALIDATION_ERROR, recovery_strategy=DEAD_LETTER)
  → DeadLetterRecord written to GCS + published to Pub/Sub topic DEAD_LETTER_VALIDATION
```

---

## \_safe_parse() Contract

All adapters call `_safe_parse()` before normalisation. Validation failures are never caught and retried — they are
routed to DLQ.

---

## EnhancedError for Validation Failures

```python
EnhancedError(
    category=VALIDATION_ERROR,
    recovery_strategy=DEAD_LETTER,
    correlation_id=...,
    ...
)
```

---

## DeadLetterRecord Fields

| Field              | Type          | Purpose                            |
| ------------------ | ------------- | ---------------------------------- |
| `service`          | str           | Originating service                |
| `venue`            | str           | Venue identifier                   |
| `timestamp`        | datetime      | UTC timestamp                      |
| `raw_payload`      | str           | JSON string of failed raw response |
| `schema_attempted` | str           | e.g. "BinanceLiquidationMessage"   |
| `error`            | EnhancedError | Full error with correlation_id     |
| `correlation_id`   | str           | Cross-service trace                |
| `retry_count`      | int           | 0 for validation failures          |
| `dlq_topic`        | str           | "DEAD_LETTER_VALIDATION"           |

---

## Storage and Publishing

- **GCS bucket**: DeadLetterRecord written to configured DLQ bucket (partitioned by date/venue)
- **Pub/Sub**: Published to topic `DEAD_LETTER_VALIDATION`

---

## Monitoring

- **DLQ depth per venue**: Monitored in live-health-monitor-ui ContractHealth dashboard
- **Alert threshold**: Depth > 100 per venue per hour

---

## Retry Policy

- **0 auto-retries** for validation failures — data is invalid, not transient
- Retrying invalid data does not fix it; alert and investigate
