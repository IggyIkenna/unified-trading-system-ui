"""Internal request/response/error schemas."""

from unified_internal_contracts.schemas.errors import (
    DeadLetterRecord,
    EnhancedError,
    ErrorCategory,
    ErrorContext,
    ErrorRecoveryStrategy,
    ErrorSeverity,
    StartupValidationError,
)
from unified_internal_contracts.schemas.rbac import (
    ROLE_PERMISSIONS,
    Permission,
    UserProfile,
    UserRole,
    has_role_permission,
)
from unified_internal_contracts.schemas.strategy import (
    StrategySpec,
    StrategyType,
)

__all__ = [
    "ROLE_PERMISSIONS",
    "DeadLetterRecord",
    "EnhancedError",
    "ErrorCategory",
    "ErrorContext",
    "ErrorRecoveryStrategy",
    "ErrorSeverity",
    "Permission",
    "StartupValidationError",
    "StrategySpec",
    "StrategyType",
    "UserProfile",
    "UserRole",
    "has_role_permission",
]
