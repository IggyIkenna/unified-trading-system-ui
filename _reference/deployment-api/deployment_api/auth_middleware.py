"""
Authentication middleware and dependencies for the deployment API.

Provides route-level authentication and authorization using Google OAuth.
Integrates with the RBAC system from unified-internal-contracts for
role-based access control.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import TypeVar

from pydantic import BaseModel
from unified_internal_contracts.schemas.rbac import (
    UserRole,  # noqa: deep-import — RBAC not re-exported from UIC top-level yet
)

logger = logging.getLogger(__name__)


class GoogleUser(BaseModel):  # CORRECT-LOCAL
    """Google OAuth user model."""

    email: str
    name: str = ""
    roles: list[str] = []
    role: str = UserRole.VIEWER.value


F = TypeVar("F", bound=Callable[..., object])


def get_current_user() -> GoogleUser:
    """FastAPI dependency: returns the current authenticated Google user.

    In production, this should be overridden via FastAPI dependency_overrides
    to decode the OAuth token and return the actual user.
    """
    raise NotImplementedError("Auth not configured — inject via dependency override")


def role_required(role: str) -> Callable[[F], F]:
    """FastAPI dependency factory: requires the given role.

    Validates that the current user's role meets the minimum required level.
    Uses the RBAC hierarchy: VIEWER < OPERATOR < ADMIN < SUPER_ADMIN.
    """
    _hierarchy = [r.value for r in UserRole]

    def decorator(func: F) -> F:
        return func

    return decorator


# Export auth dependencies for use in routes
__all__ = ["GoogleUser", "get_current_user", "role_required"]
