"""Internal testing utilities — synthetic data, tick replay, and seed scripts.

Import directly from submodules (require optional deps: numpy, pandas, pyarrow, pyyaml):

    from unified_internal_contracts.testing.scenario_config import FaultConfig, ScenarioConfig
    from unified_internal_contracts.testing.synthetic import SyntheticDataGenerator, SeedDataWriter
    from unified_internal_contracts.testing.tick_replay import TickReplayEngine, make_tick

Pytest fixtures — register in conftest.py:
    pytest_plugins = ["unified_internal_contracts.testing.conftest_fixtures"]

Seed scripts (run as CLI tools):
    seed_instruments.py  — generate instruments.json
    seed_features.py     — compute feature Parquet files
    seed_ml_artifacts.py — generate model artifact JSON
    seed_validator.py    — validate seed data against UAC schemas
"""
# No module-level imports — testing submodules require optional deps.
