# VCR Cassette Pattern

## Overview

VCR (Video Cassette Recorder) cassettes capture real HTTP/WebSocket/SDK responses from external venues and data sources,
then replay them in tests to avoid live network calls. This enables deterministic, fast integration tests without
hitting rate limits or requiring credentials.

## Cassette Locations

| Repo                    | Path                                                  | Purpose                                                      |
| ----------------------- | ----------------------------------------------------- | ------------------------------------------------------------ |
| `unified-api-contracts` | `api_contracts/api_contracts_external/<venue>/mocks/` | Cassette YAML files, one per endpoint                        |
| `unified-api-contracts` | `vcr_endpoints.py`                                    | Endpoint definitions — URL patterns, request/response schema |
| `unified-api-contracts` | `scripts/record_vcr_cassettes.py`                     | Recording script — requires live credentials                 |

## Recording Cassettes

```bash
cd unified-api-contracts
# Requires: real API key in Secret Manager or VENUE_API_KEY env var
python scripts/record_vcr_cassettes.py --venue binance --endpoint spot_klines
# Cassette saved to: api_contracts/api_contracts_external/binance/mocks/spot_klines.yaml
```

## Replay in Interface Repos

Cassettes are replayed in the owning interface repo, with `unified-api-contracts` as a dependency:

```python
# unified-market-interface/tests/integration/test_binance_adapter.py
import pytest
import vcr

@pytest.mark.integration
@vcr.use_cassette("path/to/cassettes/binance_spot_klines.yaml")
def test_binance_kline_normalization():
    adapter = BinanceMarketAdapter(api_key="dummy")
    candles = adapter.get_candles("BTCUSDT", "1h", limit=10)
    assert len(candles) == 10
    assert candles[0].close > 0
```

## Cassette Ownership

- **Definition + storage:** `unified-api-contracts` (external schemas, venue contracts)
- **Execution:** owning interface repo (unified-market-interface, unified-cloud-interface,
  unified-reference-data-interface)
- **Never:** run VCR tests standalone from `unified-api-contracts` — the interface repo provides the test runner and
  normalization layer under test

## Updating Cassettes

Re-run the recording script when:

1. Venue API response schema changes
2. New endpoint is added to AC
3. Cassette is >90 days old (staleness risk)
