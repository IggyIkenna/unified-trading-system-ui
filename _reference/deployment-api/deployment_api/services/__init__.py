"""Service modules for deployment business logic."""

# IMPORT ORDER IS INTENTIONAL — do not let isort/ruff reorder these.
# isort: skip_file
#
# DeploymentManager MUST be imported first.  Loading it triggers a circular
# import chain:
#   services/__init__  →  deployment_manager
#   → routes/deployment_validation  →  routes/__init__
#   → routes/data_status.py  →  services (re-enters this module)
#
# At the point data_status.py re-enters, sys.modules already contains the
# partially-initialised services package so the import succeeds.  The data
# service classes (DataStatusService etc.) do NOT import from routes/ so
# they are safe to import AFTER DeploymentManager.
#
# If you need to add imports here, add them AFTER the DeploymentManager block.
from .deployment_manager import DeploymentManager
from .deployment_state import DeploymentStateManager
from .sync_service import SyncService

# These must come AFTER DeploymentManager — see comment above.
from .data_analytics_service import DataAnalyticsService
from .data_query_service import DataQueryService
from .data_status_service import DataStatusService

__all__ = [
    "DataAnalyticsService",
    "DataQueryService",
    "DataStatusService",
    "DeploymentManager",
    "DeploymentStateManager",
    "SyncService",
]
