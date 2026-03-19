# Per-Source Co-Location Pattern

**SSOT for:** the directory layout convention inside `unified_api_contracts/external/` that co-locates all artifacts for
a single external data source in one flat directory.

**Repo:** [unified-api-contracts](https://github.com/central-element/unified-api-contracts) — `external/` sub-package.

---

## Principle

Every external data source has ONE flat directory under `unified_api_contracts/external/{source}/` containing ALL
artifacts for that source:

```
external/binance/
├── __init__.py          # Re-exports from schemas + normalize
├── schemas.py           # Raw API Pydantic models (or sub-modules: market_schemas.py, etc.)
├── normalize.py         # Venue-specific normalizers (raw → canonical)
├── mappings.py          # Per-source symbol/venue mappings (future)
├── mocks/               # VCR cassettes for testing
│   └── ticker.yaml
│   └── orderbook.yaml
└── examples/            # Example payloads for documentation
```

---

## Benefits

- **Namespace isolation**: Everything about Binance is in one place.
- **Developer ergonomics**: Working on Binance? `cd external/binance/`.
- **Testability**: VCR cassettes co-located with the schemas they validate.
- **Venue independence**: Adding a new venue = one new directory, zero changes to shared code.

---

## normalize.py Pattern

Each `normalize.py` imports:

- Shared helpers from `normalize_utils/_helpers.py` (decimal conversion, timestamps, etc.)
- Canonical types from `canonical/domain/` (CanonicalTicker, CanonicalOrder, etc.)
- Raw schemas from local `schemas.py` (BinanceTicker, BinanceOrder, etc.)

```python
# external/binance/normalize.py
from unified_api_contracts.normalize_utils._helpers import _d, _ts_ms
from unified_api_contracts.canonical.domain.market import CanonicalTicker
from .schemas import BinanceTicker

def normalize_binance_ticker(raw: BinanceTicker) -> CanonicalTicker:
    return CanonicalTicker(
        symbol=raw.symbol,
        last_price=_d(raw.lastPrice),
        timestamp=_ts_ms(raw.time),
    )
```

---

## normalize_utils/ Role

`normalize_utils/` contains:

- `_helpers.py` -- shared conversion functions (decimal, timestamp, side normalization)
- `errors/` -- error normalization utilities
- `sides.py`, `symbols.py` -- generic normalizers used by multiple sources
- Aggregator files (tickers.py, orderbooks.py, etc.) that re-export from `external/{source}/normalize.py`

**normalize_utils/ is UAC-internal.** External consumers must NOT import from it. Use the facade:
`from unified_api_contracts.{domain} import X`.

---

## Current Coverage

49 sources have `normalize.py`. 25 sources have `schemas.py` only (normalizers not yet written or source does not
produce normalizable data).

---

## Related Docs

- [contracts-scope-and-layout.md](contracts-scope-and-layout.md) -- UAC Citadel Architecture, import surface rules,
  `external/` flat layout rule
- [vcr-cassette-ownership.md](vcr-cassette-ownership.md) -- VCR cassette ownership and contributing workflow
- [schema-governance.md](schema-governance.md) -- three-layer schema governance model
