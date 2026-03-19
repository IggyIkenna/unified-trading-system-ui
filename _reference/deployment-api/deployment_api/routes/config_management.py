"""Config store management routes — CRUD for domain configs.

Provides versioned read/write/rollback for domain configs (instruments,
strategies, clients, venues) stored in cloud storage via ConfigStore.

All writes publish a config-domain-{domain} event to notify subscribing services.
"""

from __future__ import annotations

import asyncio
import difflib
import json
import logging
from datetime import UTC, datetime
from typing import Annotated, Protocol, cast

import yaml
from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/config-store", tags=["config-store"])

VALID_DOMAINS: frozenset[str] = frozenset({"instruments", "strategies", "clients", "venues"})
DOMAIN_TOPIC_PREFIX = "config-domain-"


# ─── Local Protocols (structural typing for ConfigStore + domain models) ──────


class _DomainConfigModel(Protocol):
    """Structural protocol for domain config Pydantic model instances."""

    def model_dump(self, *, mode: str = "python") -> dict[str, object]: ...


class _DomainConfigModelClass(Protocol):
    """Structural protocol for the domain config Pydantic model class (not instance)."""

    def model_validate(self, obj: dict[str, object]) -> _DomainConfigModel: ...


class _ConfigStoreProto(Protocol):
    """Structural protocol matching the ConfigStore interface from Agent 1."""

    def save_config(
        self,
        config: _DomainConfigModel,
        metadata: dict[str, str] | None = None,
    ) -> str: ...

    def load_config(
        self,
        config_class: type[_DomainConfigModel],
        version_path: str | None = None,
    ) -> _DomainConfigModel: ...

    def list_versions(self, *, limit: int = 50) -> list[dict[str, str]]: ...


# ─── Request / Response Models ────────────────────────────────────────────────


class ConfigWriteRequest(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    """Request body for writing a new domain config version."""

    content: dict[str, object] = Field(description="Config content as a JSON object")
    updated_by: str = Field(default="api", description="Who triggered the update")
    schema_version: str = Field(default="1.0", description="Schema version (semver)")


class ConfigVersionEntry(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    """Single entry from the config version history."""

    path: str = Field(description="Storage path of this config version")
    timestamp: str = Field(description="Timestamp in YYYYMMDDTHHMMSSZ format")
    schema_version: str = Field(description="Schema version at time of write")


class ConfigVersionResponse(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    """Response for write/rollback operations."""

    domain: str
    path: str
    timestamp: str
    message: str


class ConfigReadResponse(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    """Response for reading active config."""

    domain: str
    content: dict[str, object]
    active_path: str | None


class ConfigDiffResponse(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    """Response for config diff operation."""

    domain: str
    timestamp_a: str
    timestamp_b: str
    diff: list[str]


# ─── Helpers ─────────────────────────────────────────────────────────────────


def _now_timestamp() -> str:
    """Return current UTC time as YYYYMMDDTHHMMSSZ string."""
    return datetime.now(tz=UTC).strftime("%Y%m%dT%H%M%SZ")


def _validate_domain(domain: str) -> None:
    if domain not in VALID_DOMAINS:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid domain {domain!r}. Valid: {sorted(VALID_DOMAINS)}",
        )


def _make_config_store(domain: str, schema_version: str = "1.0") -> _ConfigStoreProto:
    """Create a ConfigStore for the given domain."""
    from unified_config_interface import get_config_store  # pyright: ignore[reportMissingTypeStubs]

    return cast(_ConfigStoreProto, get_config_store(domain=domain, schema_version=schema_version))


def _publish_domain_event(domain: str, config_path: str, updated_by: str) -> None:
    """Publish config-domain-{domain} event to notify subscribing services."""
    from unified_cloud_interface import get_event_bus  # pyright: ignore[reportMissingTypeStubs]
    from unified_events_interface import log_event

    topic = f"{DOMAIN_TOPIC_PREFIX}{domain}"
    message_data = {
        "domain": domain,
        "config_path": config_path,
        "updated_by": updated_by,
    }
    try:
        get_event_bus().publish(topic, json.dumps(message_data).encode())
        log_event(
            "CONFIG_CHANGED",
            details={
                "domain": domain,
                "config_path": config_path,
                "changed_by": updated_by,
                "authorized": True,
            },
        )
    except Exception as e:
        logger.warning("Failed to publish domain config event: %s", e)


# ─── Routes ──────────────────────────────────────────────────────────────────


@router.post("/{domain}", response_model=ConfigVersionResponse)
async def write_domain_config(
    domain: Annotated[
        str, Path(description="Config domain: instruments, strategies, clients, venues")
    ],
    request: ConfigWriteRequest,
) -> ConfigVersionResponse:
    """Write a new version of the domain config.

    Validates the content against the domain schema, writes a versioned YAML
    blob to cloud storage, updates the active pointer, and publishes a
    config-domain-{domain} event to notify all subscribing services.
    """
    _validate_domain(domain)

    def _write_sync() -> tuple[str, str]:
        from unified_config_interface import (
            schema_for_domain,  # pyright: ignore[reportMissingTypeStubs]
        )

        # Validate content against domain schema
        config_class = cast(_DomainConfigModelClass, schema_for_domain(domain))
        try:
            config_instance = config_class.model_validate(request.content)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Schema validation failed: {e}") from e

        store = _make_config_store(domain, request.schema_version)
        path = store.save_config(
            config_instance,
            metadata={"updated_by": request.updated_by, "schema_version": request.schema_version},
        )
        return path, _now_timestamp()

    try:
        path, timestamp = await asyncio.to_thread(_write_sync)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to write domain config: domain=%s", domain)
        raise HTTPException(status_code=500, detail="Failed to write config") from e

    # Publish event (non-blocking — best-effort)
    await asyncio.to_thread(_publish_domain_event, domain, path, request.updated_by)

    return ConfigVersionResponse(
        domain=domain,
        path=path,
        timestamp=timestamp,
        message=f"Config written successfully for domain={domain!r}",
    )


@router.get("/{domain}", response_model=ConfigReadResponse)
async def read_domain_config(
    domain: Annotated[str, Path(description="Config domain")],
) -> ConfigReadResponse:
    """Read the active domain config from the config store."""
    _validate_domain(domain)

    def _read_sync() -> tuple[dict[str, object], str | None]:
        from unified_config_interface import (
            schema_for_domain,  # pyright: ignore[reportMissingTypeStubs]
        )

        store = _make_config_store(domain)
        config_class = cast(type[_DomainConfigModel], schema_for_domain(domain))
        try:
            config_instance = store.load_config(config_class)
        except LookupError as e:
            # ConfigStoreError from unified_config_interface is a LookupError subclass
            # when no active config exists for the domain.
            raise HTTPException(
                status_code=404,
                detail=f"No active config for domain={domain!r}: {e}",
            ) from e
        return config_instance.model_dump(mode="json"), None

    try:
        content, active_path = await asyncio.to_thread(_read_sync)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to read domain config: domain=%s", domain)
        raise HTTPException(status_code=500, detail="Failed to read config") from e

    return ConfigReadResponse(domain=domain, content=content, active_path=active_path)


@router.get("/{domain}/versions", response_model=list[ConfigVersionEntry])
async def list_domain_config_versions(
    domain: Annotated[str, Path(description="Config domain")],
) -> list[ConfigVersionEntry]:
    """List config versions for the domain (newest first, up to 50)."""
    _validate_domain(domain)

    def _list_sync() -> list[ConfigVersionEntry]:
        store = _make_config_store(domain)
        versions = store.list_versions(limit=50)
        return [
            ConfigVersionEntry(
                path=v["path"],
                timestamp=v["timestamp"],
                schema_version=v["schema_version"],
            )
            for v in versions
        ]

    try:
        return await asyncio.to_thread(_list_sync)
    except Exception as e:
        logger.exception("Failed to list config versions: domain=%s", domain)
        raise HTTPException(status_code=500, detail="Failed to list versions") from e


@router.get("/{domain}/versions/{ts1}/diff/{ts2}", response_model=ConfigDiffResponse)
async def diff_domain_config_versions(
    domain: Annotated[str, Path(description="Config domain")],
    ts1: Annotated[str, Path(description="Timestamp A (YYYYMMDDTHHMMSSZ)")],
    ts2: Annotated[str, Path(description="Timestamp B (YYYYMMDDTHHMMSSZ)")],
) -> ConfigDiffResponse:
    """Return a unified diff between two config versions."""
    _validate_domain(domain)

    def _diff_sync() -> list[str]:
        from unified_config_interface import (
            schema_for_domain,  # pyright: ignore[reportMissingTypeStubs]
        )

        store = _make_config_store(domain)
        config_class = cast(type[_DomainConfigModel], schema_for_domain(domain))

        versions = store.list_versions(limit=500)
        path_a = next((v["path"] for v in versions if v["timestamp"] == ts1), None)
        path_b = next((v["path"] for v in versions if v["timestamp"] == ts2), None)

        if path_a is None:
            raise HTTPException(
                status_code=404,
                detail=f"Version {ts1!r} not found for domain={domain!r}",
            )
        if path_b is None:
            raise HTTPException(
                status_code=404,
                detail=f"Version {ts2!r} not found for domain={domain!r}",
            )

        cfg_a = store.load_config(config_class, version_path=path_a)
        cfg_b = store.load_config(config_class, version_path=path_b)

        yaml_a = yaml.safe_dump(cfg_a.model_dump(mode="json"), sort_keys=True)
        yaml_b = yaml.safe_dump(cfg_b.model_dump(mode="json"), sort_keys=True)

        diff = list(
            difflib.unified_diff(
                yaml_a.splitlines(keepends=True),
                yaml_b.splitlines(keepends=True),
                fromfile=f"{domain}@{ts1}",
                tofile=f"{domain}@{ts2}",
            )
        )
        return diff

    try:
        diff = await asyncio.to_thread(_diff_sync)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to diff configs: domain=%s", domain)
        raise HTTPException(status_code=500, detail="Failed to diff configs") from e

    return ConfigDiffResponse(domain=domain, timestamp_a=ts1, timestamp_b=ts2, diff=diff)


@router.post("/{domain}/rollback/{timestamp}", response_model=ConfigVersionResponse)
async def rollback_domain_config(
    domain: Annotated[str, Path(description="Config domain")],
    timestamp: Annotated[str, Path(description="Timestamp to roll back to (YYYYMMDDTHHMMSSZ)")],
) -> ConfigVersionResponse:
    """Roll back domain config to a specific version by re-saving it as the new active."""
    _validate_domain(domain)

    def _rollback_sync() -> tuple[str, str]:
        from unified_config_interface import (
            schema_for_domain,  # pyright: ignore[reportMissingTypeStubs]
        )

        store = _make_config_store(domain)
        config_class = cast(type[_DomainConfigModel], schema_for_domain(domain))

        versions = store.list_versions(limit=500)
        version_path = next((v["path"] for v in versions if v["timestamp"] == timestamp), None)

        if version_path is None:
            raise HTTPException(
                status_code=404,
                detail=f"Version {timestamp!r} not found for domain={domain!r}",
            )

        old_config = store.load_config(config_class, version_path=version_path)
        new_path = store.save_config(
            old_config,
            metadata={"updated_by": "rollback", "rolled_back_from": timestamp},
        )
        return new_path, _now_timestamp()

    try:
        new_path, new_timestamp = await asyncio.to_thread(_rollback_sync)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to rollback config: domain=%s, timestamp=%s", domain, timestamp)
        raise HTTPException(status_code=500, detail="Failed to rollback config") from e

    await asyncio.to_thread(_publish_domain_event, domain, new_path, "rollback")

    return ConfigVersionResponse(
        domain=domain,
        path=new_path,
        timestamp=new_timestamp,
        message=f"Rolled back domain={domain!r} to version {timestamp!r}",
    )
