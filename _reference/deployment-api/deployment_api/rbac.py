"""RBAC enforcement dependencies for FastAPI routes.

Uses the canonical role/permission definitions from unified-internal-contracts.
Provides FastAPI dependency functions that can be injected into route handlers
to enforce permission checks.

Usage:
    from deployment_api.rbac import require_permission

    @router.get("/users")
    async def list_users(
        _check: None = Depends(require_permission(Permission.USER_VIEW)),
    ) -> dict[str, object]:
        ...
"""

from __future__ import annotations

import logging
from collections.abc import Callable, Coroutine

from fastapi import HTTPException, Request
from unified_events_interface import log_event
from unified_internal_contracts.schemas.rbac import (  # noqa: deep-import — RBAC not re-exported from UIC top-level yet
    Permission,
    UserRole,
    has_role_permission,
)

from deployment_api.auth import DISABLE_AUTH
from deployment_api.services.user_management import UserManagementService

logger = logging.getLogger(__name__)

_user_service = UserManagementService()


async def get_current_user_role(
    request: Request,
) -> UserRole:
    """Resolve the current user's role from the user store.

    In dev mode (DISABLE_AUTH=true), returns SUPER_ADMIN.
    Otherwise, looks up the user by email from the auth context
    and returns their assigned role. Defaults to VIEWER if not found.
    """
    if DISABLE_AUTH:
        return UserRole.SUPER_ADMIN

    # Try to get email from auth context
    email: str | None = getattr(request.state, "user_email", None)
    if not email:
        # Fall back to GoogleUser dependency if available
        return UserRole.VIEWER

    profile = _user_service.get_user_by_email(email)
    if profile is None:
        return UserRole.VIEWER

    return UserRole(profile.role)


def require_permission(
    permission: Permission,
) -> Callable[..., Coroutine[object, object, None]]:
    """FastAPI dependency factory: require the caller to have a specific permission.

    Returns a dependency function that raises HTTP 403 if the user lacks
    the required permission.

    Args:
        permission: The Permission enum value to check.

    Returns:
        A FastAPI dependency function.
    """

    async def _check_permission(
        request: Request,
    ) -> None:
        if DISABLE_AUTH:
            return

        role = await get_current_user_role(request)

        if not has_role_permission(role, permission):
            log_event(
                "RBAC_DENIED",
                severity="WARNING",
                details={
                    "permission": permission.value,
                    "user_role": role.value,
                    "path": request.url.path,
                },
            )
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient permissions: requires {permission.value}",
            )

    return _check_permission


def require_role(
    minimum_role: UserRole,
) -> Callable[..., Coroutine[object, object, None]]:
    """FastAPI dependency factory: require at least the given role level.

    Role hierarchy: VIEWER < OPERATOR < ADMIN < SUPER_ADMIN.

    Args:
        minimum_role: The minimum UserRole required.

    Returns:
        A FastAPI dependency function.
    """
    role_hierarchy = [UserRole.VIEWER, UserRole.OPERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]

    async def _check_role(
        request: Request,
    ) -> None:
        if DISABLE_AUTH:
            return

        current_role = await get_current_user_role(request)

        current_level = role_hierarchy.index(current_role) if current_role in role_hierarchy else -1
        required_level = (
            role_hierarchy.index(minimum_role) if minimum_role in role_hierarchy else 999
        )

        if current_level < required_level:
            log_event(
                "RBAC_DENIED",
                severity="WARNING",
                details={
                    "required_role": minimum_role.value,
                    "user_role": current_role.value,
                    "path": request.url.path,
                },
            )
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient role: requires {minimum_role.value} or higher",
            )

    return _check_role
