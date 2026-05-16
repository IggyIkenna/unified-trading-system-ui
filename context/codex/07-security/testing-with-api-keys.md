# Testing with Live API Keys

**SSOT for:** `INTEGRATION_TEST_MODE` convention, VCR cassette matrix per interface, GCP auth integration test pattern.

---

## INTEGRATION_TEST_MODE Convention

All integration tests that touch external APIs or cloud services must respect this env var:

```bash
INTEGRATION_TEST_MODE=live    # hit real endpoints, record VCR cassettes
INTEGRATION_TEST_MODE=vcr     # replay cassettes only (default in CI)
INTEGRATION_TEST_MODE=unset   # skip integration tests entirely (default in unit runs)
```

**Rule:** If `INTEGRATION_TEST_MODE` is not set, integration tests are skipped silently (not failed). This lets
`pytest tests/unit/` run cleanly without cloud credentials.

**In CI (quickmerge):** Always `INTEGRATION_TEST_MODE=vcr`. Cassettes must be committed. Tests fail if cassette is
missing.

**For live recording:** Run locally with `INTEGRATION_TEST_MODE=live` and valid credentials. Commit the recorded
cassette. Scrub auth tokens before committing (see VCR cassette ownership: `02-data/vcr-cassette-ownership.md`).

---

## GCP Auth Integration Test Pattern

```python
# tests/integration/test_gcp_auth.py
import os
import pytest

INTEGRATION_MODE = os.environ.get("INTEGRATION_TEST_MODE", "unset")

@pytest.mark.skipif(INTEGRATION_MODE == "unset", reason="Set INTEGRATION_TEST_MODE=live|vcr to run")
class TestGCPAuth:
    def test_secret_manager_read(self):
        """Verify UCI SecretClient can read a test secret."""
        from unified_cloud_interface.factory import get_secret_client
        client = get_secret_client()
        # vcr mode: cassette replays the response
        # live mode: hits real Secret Manager
        value = client.get_secret("test-secret-key")
        assert value is not None
```

Credential injection: set `GOOGLE_APPLICATION_CREDENTIALS` to a workspace service account JSON for local live runs.
Never commit credentials. See `07-security/secrets-management.md`.

---

## VCR Cassette Matrix

Status of VCR cassettes per interface. All interfaces must reach `complete` before Phase 5 deployment gate.

| Interface                                 | Venues Covered                                    | Cassette Location                          | Status  |
| ----------------------------------------- | ------------------------------------------------- | ------------------------------------------ | ------- |
| UMI (unified-market-interface)            | binance, deribit, coinbase, hyperliquid           | `unified-api-contracts/mocks/umi/`         | pending |
| UTEI (unified-trade-execution-interface)  | binance, deribit, ibkr                            | `unified-api-contracts/mocks/utei/`        | pending |
| URDI (unified-reference-data-interface)   | databento, polygon                                | `unified-api-contracts/mocks/urdi/`        | pending |
| UPI (unified-position-interface)          | binance, ibkr                                     | `unified-api-contracts/mocks/upi/`         | pending |
| USEI (unified-sports-execution-interface) | betfair, pinnacle, polymarket                     | `unified-api-contracts/mocks/usei/`        | pending |
| UDEI (unified-defi-execution-interface)   | aave, uniswap, thegraph                           | `unified-api-contracts/mocks/udei/`        | pending |
| UCI (unified-cloud-interface)             | gcp (sm, gcs, bq, pubsub), aws (sm, s3, dynamodb) | `unified-cloud-interface/tests/cassettes/` | pending |

**Cassette requirements per venue:** at minimum one cassette per endpoint called in normal operation (instrument list,
order submit, position query, market data snapshot).

---

## References

- `02-data/vcr-cassette-ownership.md` — who records, where cassettes live, how to contribute to AC's `mocks/`
- `api_keys_and_auth.md` — implementation plan for cassette recording + GCP auth tests
- `07-security/secrets-management.md` — how API keys are stored in Secret Manager
