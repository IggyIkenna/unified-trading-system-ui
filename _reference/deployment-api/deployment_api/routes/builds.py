"""
Build listing and manual deploy API routes.

Provides endpoints for:
- Listing available builds per service from Artifact Registry (or deployed_versions fallback)
- Manually deploying any build tag to any environment (no version gate — deployment is manual)

Build tag format (produced by cloud-build-router.yml):
  main         → {semver}                  e.g. 1.0.0
  staging      → {semver}-staging          e.g. 1.0.0-staging
  feat/*       → {semver}-{branch-slug}    e.g. 0.3.168-feat-my-feature

Display format: "{version} @ {branch}"  e.g. "0.3.168 @ feat/my-feature"
"""

from __future__ import annotations

import json
import logging
import re
import subprocess
from pathlib import Path
from typing import Literal, cast

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from deployment_api.settings import (
    CLOUD_MOCK_MODE,
    CLOUD_PROVIDER,
    WORKSPACE_ROOT,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Artifact Registry configuration (matches cloud-build-router.yml)
_AR_HOST = "asia-northeast1-docker.pkg.dev"
_AR_REPO = "unified-trading"
_GCP_PROJECTS: dict[str, str] = {
    "dev": "uts-dev-ikenna",
    "staging": "uts-staging-ikenna",
    "prod": "uts-prod-ikenna",
}
_SEMVER_RE = re.compile(r"^(\d+\.\d+\.\d+)(.*)$")
_BRANCH_PREFIX_RE = re.compile(r"^(feat|fix|chore|refactor|perf|ci|docs|test)-(.+)$")

Environment = Literal["dev", "staging", "prod"]


class BuildEntry(
    BaseModel
):  # CORRECT-LOCAL — API response schema local to this route; not a domain contract
    """A single available build in Artifact Registry."""

    tag: str = Field(..., description="Artifact Registry image tag")
    display: str = Field(..., description="Human-readable '{version} @ {branch}' label")
    version: str = Field(..., description="Semver string extracted from tag")
    branch: str = Field(..., description="Branch name extracted from tag slug")
    is_v1: bool = Field(..., description="True if version >= 1.0.0")


class DeployRequest(
    BaseModel
):  # CORRECT-LOCAL — API request schema local to this route; not a domain contract
    """Request body for deploying a specific build tag to an environment."""

    image_tag: str = Field(..., description="Artifact Registry image tag to deploy")
    environment: Environment = Field(..., description="Target environment: dev, staging, or prod")


def _tag_to_entry(tag: str) -> BuildEntry:
    """Parse an AR tag string into a BuildEntry with human-readable display."""
    m = _SEMVER_RE.match(tag)
    if not m:
        return BuildEntry(tag=tag, display=tag, version=tag, branch="unknown", is_v1=False)

    version = m.group(1)
    suffix = m.group(2).lstrip("-")  # e.g. "feat-my-feature", "staging", ""

    if not suffix:
        branch = "main"
    elif suffix == "staging":
        branch = "staging"
    else:
        # Reverse branch slug: feat-my-feature → feat/my-feature
        pm = _BRANCH_PREFIX_RE.match(suffix)
        branch = f"{pm.group(1)}/{pm.group(2)}" if pm else suffix

    major, minor, _ = (int(x) for x in version.split("."))
    is_v1 = major >= 1 or (major == 1 and minor >= 0)

    return BuildEntry(
        tag=tag,
        display=f"{version} @ {branch}",
        version=version,
        branch=branch,
        is_v1=is_v1,
    )


def _sort_key(entry: BuildEntry) -> tuple[int, int, int]:
    """Sort descending by (major, minor, patch)."""
    try:
        parts = tuple(int(x) for x in entry.version.split("."))
        return (-parts[0], -parts[1], -parts[2])
    except (ValueError, IndexError):
        return (0, 0, 0)


def _mock_builds_from_manifest(service: str, env: str) -> list[BuildEntry]:
    """Fallback for mock mode: read deployed_versions from PM manifest."""
    manifest_path = Path(WORKSPACE_ROOT) / "unified-trading-pm" / "workspace-manifest.json"
    if not manifest_path.is_file():
        return []
    try:
        manifest = cast(dict[str, object], json.loads(manifest_path.read_text()))
        deployed_raw: object = manifest.get("deployed_versions")  # noqa: qg-empty-fallback — dict.get default for missing key in manifest
        deployed: dict[str, dict[str, str]] = (
            cast(dict[str, dict[str, str]], deployed_raw) if isinstance(deployed_raw, dict) else {}
        )
        env_deployed = deployed.get(env, {})  # noqa: qg-empty-fallback — dict.get default for missing env
        tag = env_deployed.get(service, "")  # noqa: qg-empty-fallback — dict.get default for missing service
        if tag:
            return [_tag_to_entry(tag)]
    except (json.JSONDecodeError, OSError, KeyError):
        logger.warning("Could not read manifest for mock builds fallback")
    return []


async def _list_ar_tags(service: str, project: str) -> list[str]:
    """List image tags from Artifact Registry for a given service + GCP project."""
    try:
        from google.cloud import (  # noqa: cloud-sdk-direct
            artifactregistry_v1,  # pyright: ignore[reportMissingTypeStubs]  # no stubs for artifactregistry
        )

        ar_client: object = artifactregistry_v1.ArtifactRegistryAsyncClient()  # pyright: ignore[reportUnknownMemberType]
        repo = f"projects/{project}/locations/asia-northeast1/repositories/{_AR_REPO}"
        parent = f"{repo}/packages/{service}"
        tags: list[str] = []
        ar_request: object = artifactregistry_v1.ListTagsRequest(parent=parent, page_size=100)  # pyright: ignore[reportUnknownMemberType]
        _list_tags_fn: object = getattr(ar_client, "list_tags", None)
        _pager: object = await _list_tags_fn(ar_request) if callable(_list_tags_fn) else None
        if _pager is None:
            return tags
        async for tag in _pager:  # pyright: ignore[reportUnknownVariableType]
            # Tag name format: .../tags/{tag_name}
            tag_name: str = str(getattr(cast(object, tag), "name", "")).split("/")[-1]
            tags.append(tag_name)
        return tags
    except Exception as e:
        logger.warning("Could not list AR tags for %s/%s: %s", project, service, e)
        return []


@router.get("/api/builds/{service}", response_model=list[BuildEntry], tags=["Builds"])
async def list_builds(
    service: str,
    env: Environment = Query(..., description="Target environment: dev, staging, or prod"),
) -> list[BuildEntry]:
    """
    List available builds for a service from Artifact Registry.

    Returns builds sorted by version descending. In mock mode (CLOUD_MOCK_MODE=true or
    CLOUD_PROVIDER=local), falls back to deployed_versions from the PM manifest.

    Build display format: "{version} @ {branch}" — human-readable and idempotent
    (same version + branch = same artifact, enforced by immutable AR tags).
    """
    is_mock = CLOUD_MOCK_MODE or CLOUD_PROVIDER == "local"

    if is_mock:
        entries = _mock_builds_from_manifest(service, env)
        if not entries:
            # Return empty with informative mock entry
            logger.info("Mock mode: no deployed_versions entry for %s/%s", service, env)
        return sorted(entries, key=_sort_key)

    project = _GCP_PROJECTS.get(env)
    if not project:
        raise HTTPException(status_code=400, detail=f"Unknown environment: {env}")

    tags = await _list_ar_tags(service, project)
    if not tags:
        # AR unavailable or no tags yet — fall back to manifest
        logger.warning("No AR tags found for %s in %s — falling back to manifest", service, env)
        return sorted(_mock_builds_from_manifest(service, env), key=_sort_key)

    entries = [_tag_to_entry(t) for t in tags]
    return sorted(entries, key=_sort_key)


@router.post("/api/deployments/{service}/deploy", tags=["Builds"])
async def deploy_build(service: str, deploy_request: DeployRequest) -> dict[str, object]:
    """
    Deploy a specific build tag to any environment.

    No version gate — deployment is always a manual decision. Pre-1.0.0 builds
    are explicitly allowed for development and testing.

    This triggers a Cloud Run revision update with the specified image tag.
    In mock mode, returns a dry-run response without calling Cloud Run.
    """
    image_tag = deploy_request.image_tag
    env = deploy_request.environment

    is_mock = CLOUD_MOCK_MODE or CLOUD_PROVIDER == "local"

    if is_mock:
        logger.info("Mock deploy: %s:%s → %s (dry run)", service, image_tag, env)
        return {
            "status": "accepted",
            "service": service,
            "image_tag": image_tag,
            "environment": env,
            "mock": True,
            "message": f"Mock mode — would deploy {service}:{image_tag} to {env}",
        }

    project = _GCP_PROJECTS.get(env)
    if not project:
        raise HTTPException(status_code=400, detail=f"Unknown environment: {env}")

    ar_image = f"{_AR_HOST}/{project}/{_AR_REPO}/{service}:{image_tag}"
    region = "asia-northeast1"

    try:
        result = subprocess.run(
            [
                "gcloud",
                "run",
                "deploy",
                service,
                f"--image={ar_image}",
                f"--region={region}",
                f"--project={project}",
                "--quiet",
            ],
            capture_output=True,
            text=True,
            timeout=120,
            check=False,
        )
        if result.returncode != 0:
            logger.error("gcloud run deploy failed: %s", result.stderr)
            raise HTTPException(
                status_code=502,
                detail=f"Cloud Run deploy failed: {result.stderr[:500]}",
            )
        logger.info("Deployed %s:%s to %s/%s", service, image_tag, env, project)
        return {
            "status": "deploying",
            "service": service,
            "image_tag": image_tag,
            "environment": env,
            "image": ar_image,
        }
    except subprocess.TimeoutExpired as e:
        raise HTTPException(status_code=504, detail="gcloud deploy timed out") from e
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {e}") from e
