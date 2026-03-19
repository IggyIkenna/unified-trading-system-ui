#!/usr/bin/env python3
"""
Deployment CLI for unified trading services.

Usage:
    python deploy.py deploy -s instruments-service -c vm --start-date 2024-01-01 --end-date 2024-01-07
    python deploy.py deploy -s market-tick-data-handler -c cloud_run --start-date 2024-01-01 --end-date 2024-01-07 --category CEFI
    python deploy.py status <deployment-id>
    python deploy.py resume <deployment-id>
    python deploy.py list --service instruments-service
"""

import warnings

warnings.filterwarnings("ignore", message=".*PydanticDeprecatedSince212.*")
warnings.filterwarnings("ignore", message=".*@model_validator.*")
warnings.filterwarnings("ignore", message=".*websockets.legacy.*")

import sys
from pathlib import Path

# Add project root to path for imports
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from deployment_service.cli import main

if __name__ == "__main__":
    main()
