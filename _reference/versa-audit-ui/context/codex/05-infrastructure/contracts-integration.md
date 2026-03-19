# Contracts Integration Guide

**Constraints SSOT:** [02-data/contracts-scope-and-layout.md](../02-data/contracts-scope-and-layout.md) — AC vs UIC
scope, dependency rule (AC cannot import UIC), layout. For package layout detail:
unified-api-contracts/docs/PACKAGE_LAYOUT_AND_SCOPE.md.

---

## TL;DR

Complete guide for using `unified-api-contracts` (external API schemas + VCR mocks) and `unified-internal-contracts`
(internal service contracts) in services.

---

## Overview

Two contract libraries provide schema definitions and type safety. **unified-api-contracts (AC)** holds external and
normalised contracts only; internal contracts come from **unified-internal-contracts (UIC)** only. VCR recording and
contract-vs-reality validation are performed in the **interfaces** (unified-market-interface,
unified-trade-execution-interface, unified-sports-execution-interface, unified-reference-data-interface,
unified-position-interface, unified-cloud-interface) in their integration tests — not in AC. **Interfaces contribute
cassettes to AC’s `mocks/` via PR** so one canonical location is used for replay and by all consumers. **SSOT:**
[02-data/vcr-cassette-ownership.md](../02-data/vcr-cassette-ownership.md).

| Library                        | Purpose                                            | Examples                           |
| ------------------------------ | -------------------------------------------------- | ---------------------------------- |
| **unified-api-contracts**      | External API schemas, normalisers, static examples | Databento, CCXT, Tardis, The Graph |
| **unified-internal-contracts** | Internal service contracts                         | Features, ML, Events, Messaging    |

**Schema audit matrix:** unified-api-contracts includes an auto-generated `docs/SCHEMA_AUDIT_MATRIX.md` (Provider ×
Schema Type, ✓/~/—, canonical target). Run `python scripts/generate_schema_audit_matrix.py` to regenerate. Use for
auditing usage, orphaned schemas, import errors, and missing functionality in downstream consumers.

---

## Normalization flow

- **Pattern:** Venue (raw) → UAC raw schema validation → UAC normalizer → Canonical type → Interface returns to service.
- **Interfaces must call UAC normalizers** — never pass raw through.
- **All external API responses** must map to a canonical type in .
- **Reference:** schema normalization completion plan ().

---

## Phase 1: unified-api-contracts Setup

### 1.1 Understanding unified-api-contracts Structure

**Placement rule (SSOT: codex 02-data/contracts-scope-and-layout.md; full layout:
unified-api-contracts/docs/PACKAGE_LAYOUT_AND_SCOPE.md):**

- **External API/protocol/venue** → `unified_api_contracts/external/<name>/` (e.g. binance, databento, prime_broker,
  fix, nautilus).
- **Canonical types** → `unified_api_contracts/canonical/`.
- **Shared cross-venue** → `schemas/` (e.g. risk, regulatory).
- **Small shared types** → `shared/`.
- **Manifest** → `venue_manifest/` at root. **Sports** domain stays at root (canonical + sources).

```
unified-api-contracts/
├── unified_api_contracts/
│   ├── unified_api_contracts/external/   # Raw schemas per venue/API
│   │   ├── databento/
│   │   ├── binance/
│   │   ├── ccxt/
│   │   └── ...
│   ├── unified_api_contracts/canonical/      # Canonical domain, execution, errors
│   ├── schemas/                          # Shared cross-venue (risk, regulatory, etc.)
│   ├── shared/                           # Small shared types
│   ├── venue_manifest/                  # Package infrastructure
│   └── sports/                           # Domain exception: canonical + sources
└── tests/
```

### 1.2 Add Dependency

```toml
# pyproject.toml
[project]
dependencies = [
    "unified-api-contracts>=1.0.0,<2.0.0",
]

[tool.uv.sources]
# For local development
unified-api-contracts = { path = "../unified-api-contracts", editable = true }
```

### 1.3 Install

```bash
# Install in editable mode
uv pip install -e ".[dev]"

# Verify
python -c "import unified_api_contracts; print(unified_api_contracts.__version__)"
```

---

## Phase 2: Using External API Schemas

**Pattern:** → → return canonical. Never return raw venue responses.

### 2.1 Databento Integration

**Import schemas:**

```python
from unified_api_contracts.databento.schemas import (
    DatabentoOhlcvBar,
    DatabentoTrade,
    DatabentoOrderBookSnapshot,
)
from unified_api_contracts.databento.normalizers import normalize_databento_ohlcv
from unified_api_contracts.canonical.schemas import CanonicalOhlcvBar
```

**Use in service:**

```python
import databento as db
from unified_api_contracts.databento.schemas import DatabentoOhlcvBar
from unified_api_contracts.databento.normalizers import normalize_databento_ohlcv


async def fetch_databento_ohlcv(symbol: str, date: str) -> list[CanonicalOhlcvBar]:
    """Fetch OHLCV data from Databento and normalize."""
    client = db.Historical(api_key=config.databento_api_key)

    # Fetch data
    data = client.timeseries.get_range(
        dataset="GLBX.MDP3",
        symbols=[symbol],
        schema="ohlcv-1m",
        start=date,
        end=date,
    )

    # Parse with Pydantic
    bars = [DatabentoOhlcvBar.model_validate(record) for record in data]

    # Normalize to canonical format
    canonical_bars = [normalize_databento_ohlcv(bar) for bar in bars]

    return canonical_bars
```

### 2.2 CCXT Integration

**Import schemas:**

```python
from unified_api_contracts.ccxt.schemas import (
    CcxtOhlcv,
    CcxtOrder,
    CcxtTrade,
    CcxtOrderBook,
)
from unified_api_contracts.ccxt.normalizers import normalize_ccxt_ohlcv
```

**Use in service:**

```python
import ccxt
from unified_api_contracts.ccxt.schemas import CcxtOhlcv
from unified_api_contracts.ccxt.normalizers import normalize_ccxt_ohlcv


async def fetch_ccxt_ohlcv(exchange_id: str, symbol: str) -> list[CanonicalOhlcvBar]:
    """Fetch OHLCV data from CCXT exchange and normalize."""
    exchange_class = getattr(ccxt, exchange_id)
    exchange = exchange_class({"enableRateLimit": True})

    # Fetch data
    ohlcv_data = await exchange.fetch_ohlcv(symbol, timeframe="1m", limit=100)

    # Parse with Pydantic
    bars = [CcxtOhlcv.model_validate_list(record) for record in ohlcv_data]

    # Normalize to canonical format
    canonical_bars = [normalize_ccxt_ohlcv(bar, exchange_id, symbol) for bar in bars]

    return canonical_bars
```

### 2.3 Tardis Integration

**Import schemas:**

```python
from unified_api_contracts.tardis.schemas import (
    TardisTrade,
    TardisOrderBook,
    TardisDerivativeTicker,
)
from unified_api_contracts.tardis.normalizers import normalize_tardis_trade
```

**Use in service:**

```python
from tardis_dev import datasets
from unified_api_contracts.tardis.schemas import TardisTrade
from unified_api_contracts.tardis.normalizers import normalize_tardis_trade


async def fetch_tardis_trades(exchange: str, symbol: str, date: str) -> list[CanonicalTrade]:
    """Fetch trades from Tardis and normalize."""
    # Fetch data
    trades_iter = datasets.trades(
        exchange=exchange,
        symbols=[symbol],
        from_date=date,
        to_date=date,
        api_key=config.tardis_api_key,
    )

    # Parse with Pydantic
    trades = [TardisTrade.model_validate(trade) for trade in trades_iter]

    # Normalize to canonical format
    canonical_trades = [normalize_tardis_trade(trade) for trade in trades]

    return canonical_trades
```

---

## Phase 3: VCR Mocks for Testing

### 3.1 Using VCR Cassettes

**unified-api-contracts provides pre-recorded API responses:**

```python
# tests/integration/test_databento_integration.py
import pytest
from unified_api_contracts.databento.vcr_mocks import get_databento_vcr


@pytest.fixture
def databento_vcr():
    """Get VCR instance with Databento cassettes."""
    return get_databento_vcr()


def test_fetch_databento_ohlcv(databento_vcr):
    """Test fetching Databento OHLCV with VCR."""
    with databento_vcr.use_cassette("databento_ohlcv_es_2026-02-27.yaml"):
        bars = fetch_databento_ohlcv(symbol="ES.FUT", date="2026-02-27")

        assert len(bars) > 0
        assert bars[0].symbol == "ES.FUT"
        assert bars[0].open > 0
```

### 3.2 Recording New Cassettes

**When adding new API endpoints:**

```python
# Record mode: records new interactions
with databento_vcr.use_cassette("new_endpoint.yaml", record_mode="new_episodes"):
    response = client.new_endpoint()

# Playback mode: uses recorded interactions
with databento_vcr.use_cassette("new_endpoint.yaml"):
    response = client.new_endpoint()
```

**Interfaces:** Recording is done in the six interfaces (they hold API keys). After recording, **contribute cassettes to
AC’s `mocks/` via PR** so one canonical location is used for replay and by all consumers. **SSOT:**
[02-data/vcr-cassette-ownership.md](../02-data/vcr-cassette-ownership.md) § “Contributing cassettes to AC mocks/ via
PR”.

### 3.3 VCR Configuration

**VCR cassette path is SSOT in unified-api-contracts.** Use the canonical path so all consumers and codex stay aligned:

- **Canonical path:** `unified_api_contracts/unified_api_contracts/external/<venue>/mocks/` (e.g.
  `unified_api_contracts/unified_api_contracts/external/databento/mocks/` for Databento).
- **Reference:** [02-data/vcr-cassette-ownership.md](../02-data/vcr-cassette-ownership.md).

```python
# In unified-api-contracts or consumers: point to unified-api-contracts cassette root
from pathlib import Path

# When installed as package, resolve relative to unified_api_contracts package
import unified_api_contracts
CASSETTE_ROOT = Path(unified_api_contracts.__file__).parent / "external"

def get_databento_vcr() -> vcr.VCR:
    """Get VCR instance; cassettes live in unified-api-contracts unified_api_contracts/external/<venue>/mocks/."""
    return vcr.VCR(
        cassette_library_dir=str(CASSETTE_ROOT / "databento" / "mocks"),
        record_mode="once",
        match_on=["method", "scheme", "host", "port", "path", "query"],
        filter_headers=["authorization", "x-api-key"],
        filter_post_data_parameters=["api_key"],
    )
```

---

## UIC vs UEI: Separation of Concerns

| Repo                                 | Role                   | Owns                                                                                                                                                        |
| ------------------------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **unified-internal-contracts (UIC)** | Contract schemas only  | LifecycleEventType, EventEnvelope, EventSinkSpec, pubsub message bodies (FillEventMessage, etc.), features, ML, risk, errors. Pure Pydantic; no cloud SDKs. |
| **unified-events-interface (UEI)**   | Protocol + logging API | EventSink protocol, `log_event()`, `setup_events()`. No ownership of event type enums or payload shapes — those come from UIC.                              |

**Rule:** UEI defines _how_ to emit events (interface); UIC defines _what_ is emitted (payload types). Services import
lifecycle types from UIC and pass them to UEI/UTS logging. No duplicate contract definitions in UEI.

---

## Phase 4: unified-internal-contracts Setup

### 4.1 Understanding unified-internal-contracts Structure

```
unified-internal-contracts/
├── unified_internal_contracts/
│   ├── features.py         # Feature pipeline contracts
│   ├── ml.py               # ML service contracts
│   ├── events.py           # Event schemas
│   ├── messaging.py        # Pub/Sub message schemas
│   ├── requests.py         # Internal service request schemas
│   ├── responses.py        # Internal service response schemas
│   └── schemas/
│       ├── errors.py       # Error response schemas
│       └── health.py       # Health check schemas
└── tests/
    └── fixtures/          # SSOT for internal schema fixtures (see 02-data/vcr-cassette-ownership.md)
```

### 4.2 Add Dependency

```toml
# pyproject.toml
[project]
dependencies = [
    "unified-internal-contracts>=1.0.0,<2.0.0",
]

[tool.uv.sources]
# For local development
unified-internal-contracts = { path = "../unified-internal-contracts", editable = true }
```

---

## Phase 5: Using Internal Contracts

### 5.1 Feature Pipeline Contracts

**Producer (feature-engineering-service):**

```python
from unified_internal_contracts.features import (
    FeatureRequest,
    FeatureResponse,
    FeatureMetadata,
)


def compute_features(request: FeatureRequest) -> FeatureResponse:
    """Compute features for given fixtures."""
    # Compute features
    features_df = compute_team_features(request.fixtures)

    # Return response
    return FeatureResponse(
        request_id=request.request_id,
        features=features_df.to_dict(orient="records"),
        metadata=FeatureMetadata(
            feature_count=len(features_df.columns),
            row_count=len(features_df),
            computation_time_ms=elapsed_ms,
        ),
    )
```

**Consumer (strategy-service):**

```python
from unified_internal_contracts.features import FeatureRequest, FeatureResponse


async def get_features(fixtures: list[dict]) -> FeatureResponse:
    """Request features from feature-engineering-service."""
    request = FeatureRequest(
        request_id=str(uuid.uuid4()),
        fixtures=fixtures,
        feature_groups=["team", "h2h", "league"],
    )

    # Send to feature service (via Pub/Sub or HTTP)
    response = await feature_service_client.compute_features(request)

    # Response is validated by Pydantic
    return response
```

### 5.2 ML Service Contracts

**Producer (ml-training-service):**

```python
from unified_internal_contracts.ml import (
    TrainingRequest,
    TrainingResponse,
    ModelMetadata,
)


def train_model(request: TrainingRequest) -> TrainingResponse:
    """Train ML model."""
    # Train model
    model = train_lightgbm(request.features, request.target)

    # Save model
    model_path = save_model(model, request.model_id)

    # Return response
    return TrainingResponse(
        model_id=request.model_id,
        model_path=model_path,
        metadata=ModelMetadata(
            accuracy=0.85,
            precision=0.82,
            recall=0.88,
            f1_score=0.85,
        ),
    )
```

**Consumer (strategy-service):**

```python
from unified_internal_contracts.ml import InferenceRequest, InferenceResponse


async def predict(features: dict) -> InferenceResponse:
    """Get predictions from ML service."""
    request = InferenceRequest(
        model_id="team_performance_v1",
        features=features,
    )

    response = await ml_service_client.predict(request)
    return response
```

### 5.3 Event Schemas

**Producer (any service):**

```python
from unified_internal_contracts.events import (
    ServiceEvent,
    EventType,
    EventMetadata,
)


def publish_event(event_type: EventType, data: dict) -> None:
    """Publish event to Pub/Sub."""
    event = ServiceEvent(
        event_id=str(uuid.uuid4()),
        event_type=event_type,
        service_name="instruments-service",
        timestamp=datetime.now(timezone.utc),
        data=data,
        metadata=EventMetadata(
            environment="production",
            version="1.0.0",
        ),
    )

    publisher.publish(topic_path, event.model_dump_json().encode())
```

**Consumer (any service):**

```python
from unified_internal_contracts.events import ServiceEvent


def handle_event(message: bytes) -> None:
    """Handle incoming event."""
    # Parse and validate
    event = ServiceEvent.model_validate_json(message)

    # Process based on type
    if event.event_type == EventType.DATA_UPDATED:
        refresh_cache(event.data)
    elif event.event_type == EventType.MODEL_TRAINED:
        load_new_model(event.data["model_id"])
```

### 5.4 Messaging Contracts

**Producer:**

```python
from unified_internal_contracts.messaging import (
    PubSubMessage,
    MessageMetadata,
)


def publish_message(topic: str, data: dict) -> None:
    """Publish message to Pub/Sub."""
    message = PubSubMessage(
        message_id=str(uuid.uuid4()),
        data=data,
        metadata=MessageMetadata(
            publisher="instruments-service",
            timestamp=datetime.now(timezone.utc),
        ),
    )

    publisher.publish(topic_path, message.model_dump_json().encode())
```

**Consumer:**

```python
from unified_internal_contracts.messaging import PubSubMessage


def handle_message(message_bytes: bytes) -> None:
    """Handle incoming Pub/Sub message."""
    message = PubSubMessage.model_validate_json(message_bytes)

    # Process message
    process_data(message.data)
```

---

## Phase 6: Quality Gates Integration

### 6.1 SDK Version Alignment Check

**For services depending on unified-api-contracts:**

```bash
# scripts/quality-gates.sh
echo "Step 5: SDK version alignment"
python3 -c "
import sys
from pathlib import Path

# Check unified-api-contracts version matches workspace standard
import tomli
with open('pyproject.toml', 'rb') as f:
    data = tomli.load(f)

deps = data['project']['dependencies']
unified_api_contracts_dep = [d for d in deps if 'unified-api-contracts' in d][0]

# Parse version constraint
if '>=' in unified_api_contracts_dep and '<' in unified_api_contracts_dep:
    print('✓ unified-api-contracts version constraint valid')
else:
    print('✗ unified-api-contracts must use >= and < constraints')
    sys.exit(1)
"
```

### 6.2 Contract Validation Tests

```python
# tests/unit/test_contract_validation.py
import pytest
from unified_api_contracts.databento.schemas import DatabentoOhlcvBar
from unified_internal_contracts.features import FeatureRequest


def test_databento_schema_validation():
    """Test Databento schema validation."""
    # Valid data
    valid_bar = {
        "ts_event": 1640995200000000000,
        "open": 4800.0,
        "high": 4850.0,
        "low": 4790.0,
        "close": 4820.0,
        "volume": 1000,
    }
    bar = DatabentoOhlcvBar.model_validate(valid_bar)
    assert bar.open == 4800.0

    # Invalid data
    invalid_bar = {"open": "not a number"}
    with pytest.raises(ValueError):
        DatabentoOhlcvBar.model_validate(invalid_bar)


def test_feature_request_validation():
    """Test feature request validation."""
    # Valid request
    valid_request = {
        "request_id": "123",
        "fixtures": [{"home": "TeamA", "away": "TeamB"}],
        "feature_groups": ["team"],
    }
    request = FeatureRequest.model_validate(valid_request)
    assert request.request_id == "123"

    # Invalid request
    invalid_request = {"request_id": 123}  # Should be string
    with pytest.raises(ValueError):
        FeatureRequest.model_validate(invalid_request)
```

---

## Phase 7: Version Management

### 7.1 Contract Versioning

**Follow semantic versioning:**

- **MAJOR**: Breaking changes to schemas (e.g., remove field, change type)
- **MINOR**: Backward-compatible additions (e.g., add optional field)
- **PATCH**: Bug fixes, documentation updates

**Example:**

```python
# unified_api_contracts/databento/schemas.py

# Version 1.0.0
class DatabentoOhlcvBar(BaseModel):
    ts_event: int
    open: float
    high: float
    low: float
    close: float
    volume: int

# Version 1.1.0 (backward compatible - added optional field)
class DatabentoOhlcvBar(BaseModel):
    ts_event: int
    open: float
    high: float
    low: float
    close: float
    volume: int
    vwap: float | None = None  # New optional field

# Version 2.0.0 (breaking change - ts_event now datetime)
class DatabentoOhlcvBar(BaseModel):
    ts_event: datetime  # Changed from int to datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    vwap: float | None = None
```

### 7.2 Dependency Constraints

**Services should use version ranges:**

```toml
[project]
dependencies = [
    "unified-api-contracts>=1.0.0,<2.0.0",  # Allow minor updates, block major
    "unified-internal-contracts>=1.0.0,<2.0.0",
]
```

---

## Phase 8: Testing Strategies

### 8.1 Unit Tests with Mocks

```python
# tests/unit/test_databento_client.py
from unittest.mock import MagicMock
from unified_api_contracts.databento.schemas import DatabentoOhlcvBar


def test_fetch_ohlcv_with_mock():
    """Test fetching OHLCV with mocked client."""
    # Mock Databento client
    mock_client = MagicMock()
    mock_client.timeseries.get_range.return_value = [
        {
            "ts_event": 1640995200000000000,
            "open": 4800.0,
            "high": 4850.0,
            "low": 4790.0,
            "close": 4820.0,
            "volume": 1000,
        }
    ]

    # Fetch and validate
    bars = fetch_databento_ohlcv_with_client(mock_client, "ES.FUT", "2026-02-27")
    assert len(bars) == 1
    assert bars[0].open == 4800.0
```

### 8.2 Integration Tests with VCR

```python
# tests/integration/test_databento_integration.py
import pytest
from unified_api_contracts.databento.vcr_mocks import get_databento_vcr


@pytest.mark.integration
def test_fetch_databento_ohlcv_vcr():
    """Test fetching Databento OHLCV with VCR."""
    vcr = get_databento_vcr()

    with vcr.use_cassette("databento_ohlcv_es.yaml"):
        bars = fetch_databento_ohlcv("ES.FUT", "2026-02-27")

        assert len(bars) > 0
        assert all(isinstance(bar, CanonicalOhlcvBar) for bar in bars)
```

---

## Common Issues

### Issue: Schema validation fails with "extra fields not permitted"

**Solution:**

```python
# Allow extra fields in schema
class DatabentoOhlcvBar(BaseModel):
    model_config = {"extra": "allow"}  # or "ignore"

    ts_event: int
    open: float
    # ...
```

### Issue: Version conflict between unified-api-contracts consumers

**Solution:**

```bash
# Check versions across repos
cd $UNIFIED_TRADING_WORKSPACE_ROOT
bash unified-trading-pm/scripts/check-dependency-alignment.sh

# Update all repos to use same version range
# Edit pyproject.toml in each repo
# Run uv lock
```

### Issue: VCR cassette not found

**Solution:** Cassettes live under `unified_api_contracts/unified_api_contracts/external/<venue>/mocks/`. See
[02-data/vcr-cassette-ownership.md](../02-data/vcr-cassette-ownership.md).

```bash
# Verify cassette exists
ls unified_api_contracts/unified_api_contracts/external/databento/mocks/

# Record new cassette
with vcr.use_cassette("new_cassette.yaml", record_mode="new_episodes"):
    # Make API call
```

---

## Related Documents

| Document                                                                                                  | Description                            |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| [06-coding-standards/integration-testing-layers.md](../06-coding-standards/integration-testing-layers.md) | Layer 0 (AC↔UIC alignment), Layer 1–3 |
| [service-setup-checklist.md](service-setup-checklist.md)                                                  | Service setup workflow                 |
| [artifact-registry-setup.md](artifact-registry-setup.md)                                                  | Publishing libraries                   |
| [06-coding-standards/external-import-standards.md](../06-coding-standards/external-import-standards.md)   | Import patterns                        |
