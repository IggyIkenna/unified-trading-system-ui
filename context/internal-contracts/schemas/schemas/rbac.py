"""RBAC schemas — UserRole, Permission, UserProfile.

Canonical RBAC definitions for the Unified Trading System.
Used by unified-admin-ui, deployment-service, and any service
that needs role-based access control decisions.

Roles follow a strict hierarchy: VIEWER < OPERATOR < ADMIN < SUPER_ADMIN.
Permissions are granular capabilities assigned per role.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum


class UserRole(StrEnum):
    """User role hierarchy for the trading system.

    VIEWER: Read-only access to dashboards and reports.
    OPERATOR: Can execute trades, manage positions, trigger deployments.
    ADMIN: Full service management, user management, config changes.
    SUPER_ADMIN: System-wide access including infrastructure and audit.
    """

    VIEWER = "viewer"
    OPERATOR = "operator"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class Permission(StrEnum):
    """Granular permissions for RBAC enforcement.

    Naming convention: <domain>:<action>
    """

    # Trading
    TRADE_VIEW = "trade:view"
    TRADE_EXECUTE = "trade:execute"
    TRADE_CANCEL = "trade:cancel"

    # Positions
    POSITION_VIEW = "position:view"
    POSITION_CLOSE = "position:close"

    # Market data
    MARKET_DATA_VIEW = "market_data:view"
    MARKET_DATA_SUBSCRIBE = "market_data:subscribe"

    # Deployment
    DEPLOY_VIEW = "deploy:view"
    DEPLOY_TRIGGER = "deploy:trigger"
    DEPLOY_ROLLBACK = "deploy:rollback"

    # Configuration
    CONFIG_VIEW = "config:view"
    CONFIG_EDIT = "config:edit"

    # User management
    USER_VIEW = "user:view"
    USER_MANAGE = "user:manage"
    USER_ROLE_ASSIGN = "user:role_assign"

    # Audit
    AUDIT_VIEW = "audit:view"
    AUDIT_EXPORT = "audit:export"

    # Risk
    RISK_VIEW = "risk:view"
    RISK_OVERRIDE = "risk:override"

    # System
    SYSTEM_HEALTH_VIEW = "system:health_view"
    SYSTEM_ADMIN = "system:admin"


# Role -> permissions mapping (hierarchical: higher roles inherit lower)
ROLE_PERMISSIONS: dict[UserRole, frozenset[Permission]] = {
    UserRole.VIEWER: frozenset(
        {
            Permission.TRADE_VIEW,
            Permission.POSITION_VIEW,
            Permission.MARKET_DATA_VIEW,
            Permission.DEPLOY_VIEW,
            Permission.CONFIG_VIEW,
            Permission.RISK_VIEW,
            Permission.SYSTEM_HEALTH_VIEW,
            Permission.AUDIT_VIEW,
        }
    ),
    UserRole.OPERATOR: frozenset(
        {
            # Inherits VIEWER
            Permission.TRADE_VIEW,
            Permission.POSITION_VIEW,
            Permission.MARKET_DATA_VIEW,
            Permission.DEPLOY_VIEW,
            Permission.CONFIG_VIEW,
            Permission.RISK_VIEW,
            Permission.SYSTEM_HEALTH_VIEW,
            Permission.AUDIT_VIEW,
            # OPERATOR additions
            Permission.TRADE_EXECUTE,
            Permission.TRADE_CANCEL,
            Permission.POSITION_CLOSE,
            Permission.MARKET_DATA_SUBSCRIBE,
            Permission.DEPLOY_TRIGGER,
        }
    ),
    UserRole.ADMIN: frozenset(
        {
            # Inherits OPERATOR
            Permission.TRADE_VIEW,
            Permission.POSITION_VIEW,
            Permission.MARKET_DATA_VIEW,
            Permission.DEPLOY_VIEW,
            Permission.CONFIG_VIEW,
            Permission.RISK_VIEW,
            Permission.SYSTEM_HEALTH_VIEW,
            Permission.AUDIT_VIEW,
            Permission.TRADE_EXECUTE,
            Permission.TRADE_CANCEL,
            Permission.POSITION_CLOSE,
            Permission.MARKET_DATA_SUBSCRIBE,
            Permission.DEPLOY_TRIGGER,
            # ADMIN additions
            Permission.DEPLOY_ROLLBACK,
            Permission.CONFIG_EDIT,
            Permission.USER_VIEW,
            Permission.USER_MANAGE,
            Permission.USER_ROLE_ASSIGN,
            Permission.AUDIT_EXPORT,
            Permission.RISK_OVERRIDE,
        }
    ),
    UserRole.SUPER_ADMIN: frozenset(
        {
            # All permissions
            Permission.TRADE_VIEW,
            Permission.POSITION_VIEW,
            Permission.MARKET_DATA_VIEW,
            Permission.DEPLOY_VIEW,
            Permission.CONFIG_VIEW,
            Permission.RISK_VIEW,
            Permission.SYSTEM_HEALTH_VIEW,
            Permission.AUDIT_VIEW,
            Permission.TRADE_EXECUTE,
            Permission.TRADE_CANCEL,
            Permission.POSITION_CLOSE,
            Permission.MARKET_DATA_SUBSCRIBE,
            Permission.DEPLOY_TRIGGER,
            Permission.DEPLOY_ROLLBACK,
            Permission.CONFIG_EDIT,
            Permission.USER_VIEW,
            Permission.USER_MANAGE,
            Permission.USER_ROLE_ASSIGN,
            Permission.AUDIT_EXPORT,
            Permission.RISK_OVERRIDE,
            Permission.SYSTEM_ADMIN,
        }
    ),
}


@dataclass
class UserProfile:
    """User profile with RBAC role and permissions.

    Fields:
        user_id: Unique user identifier (from OAuth provider).
        email: User email address.
        display_name: Human-readable display name.
        role: Assigned UserRole.
        permissions: Effective permissions (computed from role + overrides).
        is_active: Whether the account is active.
        created_at: Account creation timestamp.
        last_login_at: Most recent login timestamp.
        mfa_enabled: Whether MFA is enabled for this user.
        provider: Auth provider (google, cognito).
    """

    user_id: str
    email: str
    display_name: str
    role: UserRole
    permissions: frozenset[Permission] = field(default_factory=frozenset)
    is_active: bool = True
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    last_login_at: datetime | None = None
    mfa_enabled: bool = False
    provider: str = "google"

    def has_permission(self, permission: Permission) -> bool:
        """Check if user has a specific permission."""
        if self.permissions:
            return permission in self.permissions
        return permission in ROLE_PERMISSIONS.get(self.role, frozenset())

    def effective_permissions(self) -> frozenset[Permission]:
        """Return all effective permissions (explicit + role-based)."""
        role_perms = ROLE_PERMISSIONS.get(self.role, frozenset())
        if self.permissions:
            return self.permissions | role_perms
        return role_perms


def has_role_permission(role: UserRole, permission: Permission) -> bool:
    """Check if a role includes a specific permission."""
    return permission in ROLE_PERMISSIONS.get(role, frozenset())


__all__ = [
    "ROLE_PERMISSIONS",
    "Permission",
    "UserProfile",
    "UserRole",
    "has_role_permission",
]
