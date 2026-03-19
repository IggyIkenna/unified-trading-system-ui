"""User management service — CRUD operations for system users.

Stores user profiles as JSON in cloud storage (GCS/S3) via the
storage facade. For local/dev mode, falls back to a local JSON file.

Uses RBAC schemas from unified-internal-contracts as the canonical
source of truth for roles and permissions.
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from pathlib import Path

from pydantic import BaseModel
from unified_config_interface import UnifiedCloudConfig
from unified_events_interface import log_event
from unified_internal_contracts.schemas.rbac import (  # noqa: deep-import — RBAC not re-exported from UIC top-level yet
    ROLE_PERMISSIONS,
    Permission,
    UserProfile,
    UserRole,
)

logger = logging.getLogger(__name__)

_cfg = UnifiedCloudConfig()


class UserProfileResponse(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    """Pydantic model for API responses (serializable version of UserProfile)."""

    user_id: str
    email: str
    display_name: str
    role: str
    permissions: list[str]
    is_active: bool
    created_at: str
    last_login_at: str | None
    mfa_enabled: bool
    provider: str


class CreateUserRequest(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    """Request body for creating a new user."""

    email: str
    display_name: str
    role: str = "viewer"
    provider: str = "google"


class UpdateUserRequest(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    """Request body for updating a user."""

    display_name: str | None = None
    role: str | None = None
    is_active: bool | None = None
    mfa_enabled: bool | None = None


class AssignRoleRequest(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    """Request body for assigning a role to a user."""

    role: str


def _user_store_path() -> Path:
    """Return local path for user store (dev/local mode)."""
    workspace = _cfg.workspace_root
    if workspace:
        return Path(workspace) / ".user-management" / "users.json"
    return Path.home() / ".unified-trading" / "users.json"


def _profile_to_response(profile: UserProfile) -> UserProfileResponse:
    """Convert a UserProfile dataclass to a serializable response model."""
    effective = profile.effective_permissions()
    return UserProfileResponse(
        user_id=profile.user_id,
        email=profile.email,
        display_name=profile.display_name,
        role=profile.role.value,
        permissions=[p.value for p in effective],
        is_active=profile.is_active,
        created_at=profile.created_at.isoformat(),
        last_login_at=profile.last_login_at.isoformat() if profile.last_login_at else None,
        mfa_enabled=profile.mfa_enabled,
        provider=profile.provider,
    )


def _load_users() -> dict[str, dict[str, object]]:
    """Load user store from disk."""
    path = _user_store_path()
    if not path.exists():
        return {}
    with open(path) as f:
        raw = json.load(f)
    if not isinstance(raw, dict):
        return {}
    result: dict[str, dict[str, object]] = {}
    for k, v in raw.items():
        if isinstance(v, dict):
            result[k] = v
    return result


def _save_users(users: dict[str, dict[str, object]]) -> None:
    """Persist user store to disk."""
    path = _user_store_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(users, f, indent=2, default=str)


def _dict_to_profile(data: dict[str, object]) -> UserProfile:
    """Reconstruct a UserProfile from stored dict."""
    role_str = str(data.get("role", "viewer"))
    role = UserRole(role_str)

    created_raw = data.get("created_at")
    created_at = datetime.fromisoformat(str(created_raw)) if created_raw else datetime.now(UTC)

    last_login_raw = data.get("last_login_at")
    last_login_at = datetime.fromisoformat(str(last_login_raw)) if last_login_raw else None

    return UserProfile(
        user_id=str(data.get("user_id", "")),  # noqa: qg-empty-fallback — JSON deserialization default
        email=str(data.get("email", "")),  # noqa: qg-empty-fallback — JSON deserialization default
        display_name=str(data.get("display_name", "")),  # noqa: qg-empty-fallback — JSON deserialization default
        role=role,
        is_active=bool(data.get("is_active", True)),
        created_at=created_at,
        last_login_at=last_login_at,
        mfa_enabled=bool(data.get("mfa_enabled", False)),
        provider=str(data.get("provider", "google")),
    )


def _profile_to_dict(profile: UserProfile) -> dict[str, object]:
    """Serialize a UserProfile to a storable dict."""
    return {
        "user_id": profile.user_id,
        "email": profile.email,
        "display_name": profile.display_name,
        "role": profile.role.value,
        "is_active": profile.is_active,
        "created_at": profile.created_at.isoformat(),
        "last_login_at": profile.last_login_at.isoformat() if profile.last_login_at else None,
        "mfa_enabled": profile.mfa_enabled,
        "provider": profile.provider,
    }


class UserManagementService:
    """Service for user CRUD and role management."""

    def list_users(self) -> list[UserProfileResponse]:
        """Return all registered users."""
        users = _load_users()
        profiles = [_dict_to_profile(v) for v in users.values()]
        return [_profile_to_response(p) for p in profiles]

    def get_user(self, user_id: str) -> UserProfileResponse | None:
        """Return a single user by ID."""
        users = _load_users()
        data = users.get(user_id)
        if data is None:
            return None
        return _profile_to_response(_dict_to_profile(data))

    def get_user_by_email(self, email: str) -> UserProfileResponse | None:
        """Look up a user by email address."""
        users = _load_users()
        for data in users.values():
            if str(data.get("email", "")) == email:  # noqa: qg-empty-fallback — JSON deserialization default
                return _profile_to_response(_dict_to_profile(data))
        return None

    def create_user(self, request: CreateUserRequest) -> UserProfileResponse:
        """Create a new user. Returns the created user profile."""
        users = _load_users()

        # Check for duplicate email
        for data in users.values():
            if str(data.get("email", "")) == request.email:  # noqa: qg-empty-fallback — JSON deserialization default
                msg = f"User with email {request.email} already exists"
                raise ValueError(msg)

        # Validate role
        role = UserRole(request.role)

        # Generate user_id from email (simple deterministic approach)
        user_id = request.email.replace("@", "_at_").replace(".", "_")

        profile = UserProfile(
            user_id=user_id,
            email=request.email,
            display_name=request.display_name,
            role=role,
            provider=request.provider,
        )

        users[user_id] = _profile_to_dict(profile)
        _save_users(users)

        log_event(
            "USER_CREATED",
            severity="INFO",
            details={"user_id": user_id, "email": request.email, "role": request.role},
        )
        logger.info("Created user: user_id=%s, email=%s, role=%s", user_id, request.email, role)

        return _profile_to_response(profile)

    def update_user(self, user_id: str, request: UpdateUserRequest) -> UserProfileResponse | None:
        """Update an existing user. Returns the updated profile or None if not found."""
        users = _load_users()
        data = users.get(user_id)
        if data is None:
            return None

        profile = _dict_to_profile(data)

        if request.display_name is not None:
            profile.display_name = request.display_name
        if request.role is not None:
            profile.role = UserRole(request.role)
        if request.is_active is not None:
            profile.is_active = request.is_active
        if request.mfa_enabled is not None:
            profile.mfa_enabled = request.mfa_enabled

        users[user_id] = _profile_to_dict(profile)
        _save_users(users)

        log_event(
            "USER_UPDATED",
            severity="INFO",
            details={"user_id": user_id, "changes": request.model_dump(exclude_none=True)},
        )
        logger.info("Updated user: user_id=%s", user_id)

        return _profile_to_response(profile)

    def delete_user(self, user_id: str) -> bool:
        """Soft-delete a user (set is_active=False). Returns True if found."""
        users = _load_users()
        data = users.get(user_id)
        if data is None:
            return False

        data["is_active"] = False
        users[user_id] = data
        _save_users(users)

        log_event(
            "USER_DEACTIVATED",
            severity="INFO",
            details={"user_id": user_id},
        )
        logger.info("Deactivated user: user_id=%s", user_id)
        return True

    def assign_role(self, user_id: str, role_str: str) -> UserProfileResponse | None:
        """Assign a role to a user. Returns the updated profile or None if not found."""
        users = _load_users()
        data = users.get(user_id)
        if data is None:
            return None

        role = UserRole(role_str)
        profile = _dict_to_profile(data)
        old_role = profile.role
        profile.role = role

        users[user_id] = _profile_to_dict(profile)
        _save_users(users)

        log_event(
            "USER_ROLE_CHANGED",
            severity="INFO",
            details={
                "user_id": user_id,
                "old_role": old_role.value,
                "new_role": role.value,
            },
        )
        logger.info(
            "Role changed: user_id=%s, old=%s, new=%s",
            user_id,
            old_role.value,
            role.value,
        )

        return _profile_to_response(profile)

    def record_login(self, email: str) -> None:
        """Record a login timestamp for a user (identified by email)."""
        users = _load_users()
        for uid, data in users.items():
            if str(data.get("email", "")) == email:  # noqa: qg-empty-fallback — JSON deserialization default
                data["last_login_at"] = datetime.now(UTC).isoformat()
                users[uid] = data
                _save_users(users)
                return

    @staticmethod
    def get_available_roles() -> list[dict[str, object]]:
        """Return all available roles with their permissions."""
        roles: list[dict[str, object]] = []
        for role in UserRole:
            perms = ROLE_PERMISSIONS.get(role, frozenset())
            roles.append(
                {
                    "role": role.value,
                    "description": _role_description(role),
                    "permissions": [p.value for p in sorted(perms, key=lambda p: p.value)],
                    "permission_count": len(perms),
                }
            )
        return roles

    @staticmethod
    def get_available_permissions() -> list[dict[str, str]]:
        """Return all available permissions."""
        return [{"permission": p.value, "domain": p.value.split(":")[0]} for p in Permission]


def _role_description(role: UserRole) -> str:
    """Human-readable description for a role."""
    descriptions: dict[UserRole, str] = {
        UserRole.VIEWER: "Read-only access to dashboards and reports",
        UserRole.OPERATOR: "Can execute trades, manage positions, trigger deployments",
        UserRole.ADMIN: "Full service management, user management, config changes",
        UserRole.SUPER_ADMIN: "System-wide access including infrastructure and audit",
    }
    return descriptions.get(role, "Unknown role")
