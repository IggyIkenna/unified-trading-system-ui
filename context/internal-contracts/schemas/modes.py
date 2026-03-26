"""Canonical operational mode schemas — system-wide env var injection.

These are the four canonical mode groups, each injected as an environment variable
by the deployment system and read by UnifiedCloudConfig in unified-config-interface.

All services and libraries receive these modes at startup via env var injection.
They NEVER read environment variables directly — they receive the mode from UnifiedCloudConfig.

ENV VAR          | Enum          | Default    | Meaning
-----------------|---------------|------------|----------------------------------
DATA_MODE        | DataMode      | real       | Use mock generators or real data sources
RUNTIME_MODE     | RuntimeMode   | live       | Live stream or batch processing
CLOUD_PROVIDER   | CloudProvider | gcp        | GCP, AWS, or local emulator stack
PHASE_MODE       | PhaseMode     | phase3     | System capability phase (data availability)
TESTING_STAGE    | TestingStage  | MOCK       | Strategy testing progression stage

NO cloud SDKs (google-cloud-*, boto3). Pure StrEnum + Pydantic config only.
"""

from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel


class DataMode(StrEnum):
    """Data source mode — controls whether services use mock generators or real data.

    Injected as DATA_MODE env var. When MOCK, implies cloud emulators are active
    (CLOUD_PROVIDER=local) and no live API credentials are required.
    """

    MOCK = "mock"
    REAL = "real"


class RuntimeMode(StrEnum):
    """Service execution mode — drives transport protocol and compute selection.

    Injected as RUNTIME_MODE env var. LIVE = streaming / event-driven;
    BATCH = historical processing / scheduled jobs.

    Canonical replacement for the duplicate ServiceMode in unified-events-interface.
    """

    LIVE = "live"
    BATCH = "batch"


class CloudProvider(StrEnum):
    """Cloud provider the service runs on.

    Injected as CLOUD_PROVIDER env var. LOCAL activates emulator stacks
    (fsouza/fake-gcs-server, PubSub emulator, BigQuery emulator).
    """

    GCP = "gcp"
    AWS = "aws"
    LOCAL = "local"


class PhaseMode(StrEnum):
    """System capability phase — controls which data pipelines are active.

    Injected as PHASE_MODE env var. Services that depend on data types
    not yet available in the current phase gracefully degrade or skip.

    PHASE_1: instruments reference data only (no live feeds, no ML)
    PHASE_2: + corporate actions, dividends, splits
    PHASE_3: full pipeline — market data, execution, features, ML inference
    """

    PHASE_1 = "phase1"
    PHASE_2 = "phase2"
    PHASE_3 = "phase3"


class LogLevel(StrEnum):
    """Standard log severity levels for operational configuration.

    Used by services to declare their minimum log level via UnifiedCloudConfig.
    Compatible with Python's logging module level names.
    """

    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class MockScenario(StrEnum):
    """Named, deterministic mock scenario for testing and local dev.

    Each scenario has a canonical YAML config in
    unified_api_contracts.internal/testing/scenarios/<name>.yaml
    specifying the RNG seed, volatility multipliers, fault injection, etc.

    Same seed = same output — scenarios are fully reproducible.
    """

    NORMAL = "normal"
    HEAVY = "heavy"
    LIGHT = "light"
    BIG_RANGES = "big_ranges"
    BUST = "bust"
    NO_SYSTEM_OVERLOAD = "no_system_overload"
    MISSING_DATA = "missing_data"
    DELAYED_DATA = "delayed_data"


class TestingStage(StrEnum):
    """Strategy testing progression stages.

    Strategies must pass through stages sequentially:
    MOCK -> HISTORICAL -> LIVE_MOCK -> LIVE_TESTNET -> STAGING -> LIVE_REAL

    HISTORICAL has a `full` flag (sample by default, full for comprehensive backtest).
    """

    MOCK = "MOCK"  # All fake, simulates live event schema. CLOUD_MOCK_MODE=true
    HISTORICAL = "HISTORICAL"  # Real data replay (sample=quick sanity, full=comprehensive backtest)
    LIVE_MOCK = "LIVE_MOCK"  # Live market data feed, paper execution
    LIVE_TESTNET = "LIVE_TESTNET"  # Live market data, testnet/fork execution
    STAGING = "STAGING"  # Near-prod, Tenderly fork, real auth. Requires HISTORICAL(full) pass
    LIVE_REAL = "LIVE_REAL"  # Production, real mainnet, real capital. Human approval required


class TestingStageConfig(BaseModel):
    """Configuration for the current testing stage of a strategy.

    Tracks which stage a strategy is in, whether the full historical backtest
    has been completed, and the last stage transition timestamp.
    """

    current_stage: TestingStage = TestingStage.MOCK
    historical_full_complete: bool = False
    last_stage_transition: str | None = None  # ISO timestamp
    stage_gate_override: bool = False  # Human override to skip gates


__all__ = [
    "CloudProvider",
    "DataMode",
    "LogLevel",
    "MockScenario",
    "PhaseMode",
    "RuntimeMode",
    "TestingStage",
    "TestingStageConfig",
]
