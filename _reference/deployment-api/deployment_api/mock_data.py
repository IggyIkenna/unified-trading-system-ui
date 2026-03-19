"""Mock data for deployment-api routes when CLOUD_MOCK_MODE=true.

Provides realistic sample data for deployments, services, and configs
so the API can run without cloud provider backends.
"""

from __future__ import annotations

MOCK_DEPLOYMENTS: list[dict[str, object]] = [
    {
        "deployment_id": "dep-20260314-001",
        "service": "market-tick-data-service",
        "status": "completed",
        "total_shards": 847,
        "created_at": "2026-03-14T06:00:00Z",
        "compute": "cloud_run",
        "mode": "batch",
        "cloud_provider": "gcp",
    },
    {
        "deployment_id": "dep-20260314-002",
        "service": "execution-service",
        "status": "running",
        "total_shards": 120,
        "created_at": "2026-03-14T08:30:00Z",
        "compute": "cloud_run",
        "mode": "batch",
        "cloud_provider": "gcp",
    },
    {
        "deployment_id": "dep-20260314-003",
        "service": "feature-momentum-service",
        "status": "pending",
        "total_shards": 256,
        "created_at": "2026-03-14T10:00:00Z",
        "compute": "vm",
        "mode": "batch",
        "cloud_provider": "gcp",
    },
    {
        "deployment_id": "dep-20260313-001",
        "service": "strategy-service",
        "status": "completed",
        "total_shards": 64,
        "created_at": "2026-03-13T22:00:00Z",
        "compute": "cloud_run",
        "mode": "batch",
        "cloud_provider": "gcp",
    },
    {
        "deployment_id": "dep-20260313-002",
        "service": "instruments-service",
        "status": "failed",
        "total_shards": 9,
        "created_at": "2026-03-13T20:00:00Z",
        "compute": "cloud_run",
        "mode": "live",
        "cloud_provider": "gcp",
    },
]

MOCK_SERVICES: list[dict[str, object]] = [
    {
        "name": "market-tick-data-service",
        "description": "Ingests and stores raw market tick data from all venues",
        "dimensions": ["category", "venue", "date"],
    },
    {
        "name": "execution-service",
        "description": "Backtests execution strategies across instruments and venues",
        "dimensions": ["category", "venue", "instrument", "date"],
    },
    {
        "name": "feature-momentum-service",
        "description": "Computes momentum features from tick data",
        "dimensions": ["category", "venue", "date"],
    },
    {
        "name": "strategy-service",
        "description": "Runs strategy backtests from grid configs",
        "dimensions": ["category", "venue", "date"],
    },
    {
        "name": "instruments-service",
        "description": "Refreshes instrument definitions across all venues",
        "dimensions": ["category", "venue"],
    },
]

MOCK_CONFIGS: list[dict[str, object]] = [
    {
        "config_id": "cfg-exec-cefi-btc",
        "service": "execution-service",
        "category": "CEFI",
        "venue": "binance",
        "instrument": "BTC-USDT",
        "path": "configs/V2/CEFI_BTC/binance/BTC-USDT/config.json",
    },
    {
        "config_id": "cfg-exec-cefi-eth",
        "service": "execution-service",
        "category": "CEFI",
        "venue": "binance",
        "instrument": "ETH-USDT",
        "path": "configs/V2/CEFI_ETH/binance/ETH-USDT/config.json",
    },
    {
        "config_id": "cfg-strategy-momentum",
        "service": "strategy-service",
        "category": "CEFI",
        "venue": "binance",
        "path": "configs_grid/CEFI/binance/momentum_macd_5M.json",
    },
]
