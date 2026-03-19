"""
deployment-service — Deployment Orchestration Service

Extracted from deployment-service. Contains:
- orchestrator: T+1 job orchestration with dependency graph
- catalog: Data completion tracking across services
- config_loader: YAML config loading (venues, sharding, cloud providers)
- cloud_client: Cloud-agnostic storage operations
- monitor: Deployment progress and state monitoring
- shard_builder: Shard construction from combinatorics
- shard_calculator: Shard calculation and limit enforcement
- backends/: Cloud execution backends (GCP, AWS)

This package does NOT export API or UI concerns. Those live in deployment-api
and deployment-ui respectively.
"""

from .catalog import DataCatalog, ExecutionConfigStatus
from .cloud_client import CloudClient
from .config_loader import ConfigLoader
from .events import VM_EVENT_TYPES, ShardEvent, VMEventType
from .live_deployment import LiveDeployer, LiveDeploymentRequest, LiveDeploymentResult
from .monitor import DeploymentMonitor
from .orchestrator import T1Orchestrator
from .shard_calculator import Shard, ShardCalculator, ShardLimitExceeded

__all__ = [
    "CloudClient",
    "ConfigLoader",
    "DataCatalog",
    "DeploymentMonitor",
    "ExecutionConfigStatus",
    "LiveDeployer",
    "LiveDeploymentRequest",
    "LiveDeploymentResult",
    "Shard",
    "ShardCalculator",
    "ShardLimitExceeded",
    "ShardEvent",
    "T1Orchestrator",
    "VM_EVENT_TYPES",
    "VMEventType",
]
