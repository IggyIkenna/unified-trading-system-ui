"""Bootstrap configuration for deployment-service.

Topology bootstrap: RUNTIME_TOPOLOGY_PATH and WORKSPACE_ROOT are read before
UnifiedCloudConfig exists. This config centralizes that bootstrap phase.
"""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class TopologyBootstrapConfig:
    """Bootstrap config for runtime topology path resolution.

    Populated from env at startup. Used by ConfigLoader.load_runtime_topology_config.
    """

    runtime_topology_path: str | None
    workspace_root: str | None

    @classmethod
    def from_env(cls) -> TopologyBootstrapConfig:
        """Create from environment. Bootstrap phase — env read before config exists."""
        return cls(
            runtime_topology_path=os.environ.get("RUNTIME_TOPOLOGY_PATH"),
            workspace_root=os.environ.get("WORKSPACE_ROOT"),
        )
