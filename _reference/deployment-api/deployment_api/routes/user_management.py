"""User management API routes — CRUD for users + role assignment.

All write operations require ADMIN or SUPER_ADMIN role.
Read operations require USER_VIEW permission (ADMIN+).
Role/permission reference endpoints are open to authenticated users.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from unified_internal_contracts.schemas.rbac import (  # noqa: deep-import — RBAC not re-exported from UIC top-level yet
    Permission,
    UserRole,
)

from deployment_api.rbac import require_permission
from deployment_api.services.user_management import (
    AssignRoleRequest,
    CreateUserRequest,
    UpdateUserRequest,
    UserManagementService,
)

logger = logging.getLogger(__name__)
router = APIRouter()

_user_service = UserManagementService()


@router.get("/users")
async def list_users(
    _check: None = Depends(require_permission(Permission.USER_VIEW)),
) -> dict[str, object]:
    """List all registered users.

    Requires USER_VIEW permission (ADMIN or SUPER_ADMIN).
    """
    users = _user_service.list_users()
    return {"users": [u.model_dump() for u in users], "count": len(users)}


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    _check: None = Depends(require_permission(Permission.USER_VIEW)),
) -> dict[str, object]:
    """Get a single user by ID.

    Requires USER_VIEW permission.
    """
    user = _user_service.get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail=f"User not found: {user_id}")
    return {"user": user.model_dump()}


@router.post("/users", status_code=201)
async def create_user(
    request: CreateUserRequest,
    _check: None = Depends(require_permission(Permission.USER_MANAGE)),
) -> dict[str, object]:
    """Create a new user.

    Requires USER_MANAGE permission (ADMIN or SUPER_ADMIN).
    """
    # Validate role value
    valid_roles = [r.value for r in UserRole]
    if request.role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role: {request.role}. Valid roles: {valid_roles}",
        )

    try:
        user = _user_service.create_user(request)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e)) from e

    return {"user": user.model_dump(), "message": "User created successfully"}


@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    request: UpdateUserRequest,
    _check: None = Depends(require_permission(Permission.USER_MANAGE)),
) -> dict[str, object]:
    """Update an existing user.

    Requires USER_MANAGE permission (ADMIN or SUPER_ADMIN).
    """
    if request.role is not None:
        valid_roles = [r.value for r in UserRole]
        if request.role not in valid_roles:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid role: {request.role}. Valid roles: {valid_roles}",
            )

    user = _user_service.update_user(user_id, request)
    if user is None:
        raise HTTPException(status_code=404, detail=f"User not found: {user_id}")

    return {"user": user.model_dump(), "message": "User updated successfully"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    _check: None = Depends(require_permission(Permission.USER_MANAGE)),
) -> dict[str, object]:
    """Deactivate a user (soft delete).

    Requires USER_MANAGE permission (ADMIN or SUPER_ADMIN).
    """
    found = _user_service.delete_user(user_id)
    if not found:
        raise HTTPException(status_code=404, detail=f"User not found: {user_id}")

    return {"user_id": user_id, "deactivated": True, "message": "User deactivated successfully"}


@router.post("/users/{user_id}/role")
async def assign_role(
    user_id: str,
    request: AssignRoleRequest,
    _check: None = Depends(require_permission(Permission.USER_ROLE_ASSIGN)),
) -> dict[str, object]:
    """Assign a role to a user.

    Requires USER_ROLE_ASSIGN permission (ADMIN or SUPER_ADMIN).
    """
    valid_roles = [r.value for r in UserRole]
    if request.role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role: {request.role}. Valid roles: {valid_roles}",
        )

    user = _user_service.assign_role(user_id, request.role)
    if user is None:
        raise HTTPException(status_code=404, detail=f"User not found: {user_id}")

    return {"user": user.model_dump(), "message": f"Role assigned: {request.role}"}


@router.get("/roles")
async def list_roles() -> dict[str, object]:
    """List all available roles with their permissions.

    Open to any authenticated user (for UI dropdowns).
    """
    roles = UserManagementService.get_available_roles()
    return {"roles": roles, "count": len(roles)}


@router.get("/permissions")
async def list_permissions() -> dict[str, object]:
    """List all available permissions.

    Open to any authenticated user (for reference).
    """
    permissions = UserManagementService.get_available_permissions()
    return {"permissions": permissions, "count": len(permissions)}
