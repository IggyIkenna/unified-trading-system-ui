# Rate Limit Handling — Gap Analysis

**Date:** 2026-03-05
**Scope:** 429 handling, header extraction, normalization, observability, venue coverage
**Related:** [SCHEMA_NORMALIZATION_GAPS_AUDIT.md](./SCHEMA_NORMALIZATION_GAPS_AUDIT.md) §2.6, §2.17

---

## 1. What Exists

### 1.1 Classification (VENUE_ERROR_MAP)

~15 venues have rate limit codes mapped to RETRY:

| Venue         | Code(s)                  | Action |
| ------------- | ------------------------ | ------ |
| binance       | -1003                    | RETRY  |
| bybit         | 10006                    | RETRY  |
| okx           | 50011                    | RETRY  |
| deribit       | 10028, 10040             | RETRY  |
| coinbase      | RATE_LIMIT_EXCEEDED      | RETRY  |
| tardis        | 429                      | RETRY  |
| alchemy       | 429                      | RETRY  |
| yahoo_finance | 429, RATE_LIMIT_EXCEEDED | RETRY  |
| upbit         | too_many_requests        | RETRY  |
| thegraph      | 429                      | RETRY  |
| ccxt          | RateLimitExceeded        | RETRY  |
| databento     | RATE_LIMIT               | RETRY  |
| hyperliquid   | RATE_LIMIT               | RETRY  |
| aster         | 429                      | RETRY  |
| bloxroute     | 429                      | RETRY  |

### 1.2 Schemas

- **RateLimitResponse** (errors.py): `retry_after`, `x_rate_limit_limit`, `x_rate_limit_remaining`, `x_rate_limit_reset`, `message`, `code`
- **HttpRateLimitHeaders** (rate_limits.py): `x_ratelimit_limit`, `x_ratelimit_remaining`, `x_ratelimit_reset`, `x_ratelimit_used`, `retry_after`
- **VENUE_RATE_LIMITS** (rate_limits.py): known limits per venue (e.g. Binance 2400/min, Bybit 24/s)

### 1.3 Proactive Limiting

- **UMI VenueRateLimiter** (token bucket) to avoid hitting limits

### 1.4 Retry

- Tardis, Hyperliquid, TheGraph: retry on 429 (status_forcelist)
- Generic backoff; does not use venue-provided Retry-After

---

## 2. Gaps

### 2.1 No Header Extraction on 429

- RateLimitResponse / HttpRateLimitHeaders exist but are **not used** when 429 occurs.

- Tardis: logs "HTTP 429 = Rate limited. Wait and retry." — **does not read Retry-After or X-RateLimit-\***.

- Backoff is generic; it does not use venue-provided Retry-After.

**Action:** Add `extract_rate_limit_headers(response)` helper; parse Retry-After (seconds or HTTP-date), X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset. Use in backoff calculation.

### 2.2 No Normalization to CanonicalRateLimitError

- No `normalize_*_error` functions; venue errors are not converted to CanonicalRateLimitError.

- No structured payload with `venue`, `retry_after`, `endpoint`, `headers` for downstream handling.

**Action:** Add `normalize_<provider>_rate_limit_error(response, status_code, body)` → CanonicalRateLimitError. Include venue, retry_after, endpoint, raw_headers.

### 2.3 No Tracking / Observability

- No `RATE_LIMIT_HIT` or `RATE_LIMIT_EXCEEDED` event in UEI.

- No structured logging of venue, endpoint, retry_after, or count.

- No metrics for rate limit hits per venue per time window.

**Action:** Add `log_event("RATE_LIMIT_HIT", metadata={venue, endpoint, retry_after, ...})`. Add Prometheus counter `rate_limit_hits_total{venue, endpoint}`. Document in lifecycle-events.md.

### 2.4 Incomplete Venue Coverage

- Kalshi, Polymarket, Pinnacle, Betfair, Odds API, and others are **not** in VENUE_ERROR_MAP for rate limits.

**Action:** Add rate limit codes for all venues in GAPS §2. Document per-venue 429 codes and header formats.

### 2.5 WebSocket Rate Limits

- Binance and others can disconnect on rate limit; this is in VENUE_ERROR_MAP but not tracked or normalized.

- No CanonicalRateLimitError for WS disconnect due to rate limit.

**Action:** Map WS close codes (e.g. "rate limit" in reason) to CanonicalRateLimitError. Add to connectivity schema.

---

## 3. Summary Matrix

| Aspect                                      | Status               |
| ------------------------------------------- | -------------------- |
| Classify rate limit codes → RETRY           | Partial (~15 venues) |
| Extract Retry-After / X-RateLimit-\* on 429 | **No**               |
| Normalize to CanonicalRateLimitError        | **No**               |
| Use Retry-After for backoff                 | **No**               |
| Log/track rate limit events                 | **No**               |
| Full venue coverage                         | **No**               |
| WebSocket rate limit handling               | **No**               |

---

## 4. Remediation Order

1. **Header extraction:** Add `extract_rate_limit_headers()` to UAC; use in UMI/UTL retry logic.
2. **CanonicalRateLimitError:** Add normalize/errors.py with `normalize_*_rate_limit_error` for all venues.
3. **Backoff:** Use Retry-After when present; fallback to exponential backoff.
4. **Venue coverage:** Add Kalshi, Polymarket, Pinnacle, Betfair, Odds API, etc. to VENUE_ERROR_MAP.
5. **Observability:** Add RATE_LIMIT_HIT event, structured logging, metrics.
6. **WebSocket:** Map WS rate limit disconnects to CanonicalRateLimitError.
