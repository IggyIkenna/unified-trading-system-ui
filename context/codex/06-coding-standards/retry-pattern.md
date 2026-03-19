# Retry Pattern

## Overview

All retryable I/O in the unified trading system must use the standard `@with_retry` decorator from
`unified-trading-services` (T1). Never implement ad-hoc retry loops inline.

---

## Standard Pattern: Exponential Backoff with Jitter

```python
from unified_trading_services.retry import with_retry

@with_retry(max_attempts=3, base_delay_s=0.5, jitter=True)
async def call_external_api(client: SomeClient, payload: dict[str, str]) -> dict[str, str]:
    return await client.post(payload)
```

The decorator computes delay as:

```
delay = min(base_delay_s * (2 ** attempt), max_delay_s) + uniform(0, jitter_max_s)
```

Default `jitter_max_s` is 0.1 s. This prevents thundering-herd retry storms when multiple services fail simultaneously.

---

## Attempt Limits

| Call target         | `max_attempts` | Rationale                                                     |
| ------------------- | -------------- | ------------------------------------------------------------- |
| External APIs       | 3              | Venue/exchange APIs rate-limit aggressively; 3 is sufficient  |
| Internal services   | 5              | Internal latency spikes are usually transient                 |
| PubSub publish      | 3              | PubSub client has built-in retry; outer layer is a safety net |
| Secret Manager read | 2              | Secrets rarely fail; fast-fail preferred                      |

---

## Non-Retryable Responses

Do NOT retry on these HTTP status codes. Retrying is futile and can amplify load:

| Code | Reason                          |
| ---- | ------------------------------- |
| 400  | Bad Request — fix the payload   |
| 401  | Unauthorized — fix credentials  |
| 403  | Forbidden — fix IAM permissions |
| 404  | Not Found — resource absent     |
| 422  | Unprocessable — schema mismatch |

```python
NON_RETRYABLE_STATUS_CODES: frozenset[int] = frozenset({400, 401, 403, 404, 422})
```

The `with_retry` decorator inspects the raised `HTTPStatusError` and re-raises immediately (without consuming remaining
attempts) when the response code is in `NON_RETRYABLE_STATUS_CODES`.

---

## Retryable Responses

Retry on transient failures:

| Code / Condition  | Reason                                       |
| ----------------- | -------------------------------------------- |
| 429               | Rate limited — back off and retry            |
| 500               | Internal Server Error — transient downstream |
| 502               | Bad Gateway — upstream proxy issue           |
| 503               | Service Unavailable — transient overload     |
| 504               | Gateway Timeout — upstream timed out         |
| `ConnectionError` | Network-level failure                        |
| `TimeoutError`    | Request timed out before response            |

---

## Rules

- Import `with_retry` from `unified_trading_services.retry` — never reimplement.
- Do not use `tenacity`, `retry`, or any third-party retry library. One decorator, one pattern.
- Do not retry inside a circuit breaker's `OPEN` state — the decorator must check breaker state first.
- Always pass `max_attempts` explicitly — do not rely on defaults for production call sites.
- Log each retry attempt at `WARNING` level with attempt number, target, and delay.
- After all attempts exhausted, re-raise the original exception (no silent swallowing).

---

## Related

- `04-architecture/kill-switch-circuit-breaker.md` — circuit breaker interplay with retries
- `06-coding-standards/error-handling.md` — `EnhancedError` wrapping on final failure
- Phase 3 plan: `topology-with-retry-decorator` (T1)
