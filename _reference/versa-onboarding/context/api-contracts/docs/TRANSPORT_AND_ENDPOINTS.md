# Transport and endpoints: REST vs WebSocket vs FIX

How each venue is accessed (REST, WebSocket, FIX), constraints, and how to handle each in code and tests.

---

## Summary matrix

| Venue         | REST                 | WebSocket              | FIX          | Auth                          | Rate limits    | Notes                                |
| ------------- | -------------------- | ---------------------- | ------------ | ----------------------------- | -------------- | ------------------------------------ |
| databento     | Yes (Historical API) | No                     | No           | API key (header)              | Per-key limits | Symbology REST; timeseries.get_range |
| tardis        | Yes (HTTP API, CSV)  | If documented          | No           | API key                       | Per plan       | Exchanges, instruments, trades, book |
| ccxt          | Yes (unified)        | Per exchange           | Per exchange | Exchange keys                 | Per exchange   | fetch\_\* methods; WS via exchange   |
| binance       | Yes                  | Yes (streams)          | No           | API key + secret              | Weight-based   | REST /fapi/_, /v3/_; WS wss://       |
| thegraph      | Yes (GraphQL HTTP)   | No                     | No           | API key (URL)                 | Per key        | POST subgraph endpoint               |
| okx           | Yes                  | Yes (private/public)   | If offered   | API key + secret + passphrase | Per endpoint   | REST /api/\*; WS wss://              |
| bybit         | Yes                  | Yes                    | If offered   | API key + secret              | Per category   | REST /v5/\*; WS wss://               |
| yahoo_finance | Yes (HTTP)           | No                     | No           | Optional                      | Throttled      | Quote/chart endpoints                |
| alchemy       | Yes (JSON-RPC HTTP)  | Optional (WSS)         | No           | API key                       | Per tier       | RPC + optional WebSocket             |
| hyperliquid   | Yes (HTTP)           | Yes (info/trades/user) | No           | Wallet/sig                    | Per IP         | HTTP + S3 stats bucket               |
| aster         | Yes (HTTP/RPC)       | Yes (events)           | No           | Wallet                        | Per chain      | On-chain perps                       |
| upbit         | Yes                  | Yes (ticker/trade)     | If offered   | API key + secret              | Per endpoint   | REST /v1/\*; WS wss://               |
| ibkr          | No (TWS API)         | Yes (callbacks)        | No           | TWS/Gateway login             | Per connection | Single connection; ib_insync         |

---

## How to handle each transport

### REST

- **Usage**: HTTP GET/POST; request/response JSON (or CSV for Tardis).
- **Constraints**: Rate limits per venue (see venue docs); use exponential backoff and respect Retry-After.
- **In tests**: Use VCR cassettes in `unified_api_contracts/<venue>/mocks/`; filter `Authorization`, `X-API-Key`, and other secret headers so cassettes are safe to commit.
- **Schema**: Validate responses with `unified_api_contracts.<venue>.schemas` before mapping to canonical types.

### WebSocket

- **Usage**: Connect to `wss://...`; subscribe with venue-specific message format; parse incoming message schema per venue.
- **Constraints**: Single or few connections per venue; reconnect with backoff; message ordering and reconnection semantics differ by venue.
- **In tests**: Either (1) mock the WebSocket client and feed canned message JSON validated by our WebSocket message schemas, or (2) use VCR for the WS handshake and first N messages if the recorder supports it.
- **Schema**: We have response schemas for REST; WebSocket message shapes should match the same or dedicated WS message models where they differ (e.g. Binance stream ticker vs REST ticker).

### FIX

- **Usage**: Where offered (e.g. OKX, Bybit), FIX session over TCP; logon, order messages, etc.
- **Constraints**: Session lifecycle; sequence numbers; FIX spec version per venue.
- **In tests**: Mock FIX session or use recorded FIX log files; validate parsed FIX fields against our schemas where we model them.
- **Schema**: Add FIX message or session schemas in unified-api-contracts when we integrate a FIX adapter.

---

## Per-venue endpoint coverage

Each venue's `schemas.py` and `examples/` should cover:

- **Market data**: ticker, order book, trades, OHLCV (where applicable).
- **Order feed**: order submit response, order status, cancel (REST and/or WS).
- **Position/balance**: positions, balances, margin (where applicable).
- **Errors**: HTTP/API error payload; map to `unified_api_contracts.<venue>.schemas.*Error`.

Examples in `unified_api_contracts/<venue>/examples/` and VCR cassettes in `unified_api_contracts/<venue>/mocks/` provide one validating example per endpoint type so we directly test every contracted shape.

---

## References

- INDEX.md — per-venue contract index (market data, order, position, errors, WS, FIX).
- CONTRIBUTING.md — how to add venues, capture examples, record VCR.
- `unified_api_contracts/venue_manifest.py` — `has_rest`, `has_websocket`, `has_fix` per venue.
