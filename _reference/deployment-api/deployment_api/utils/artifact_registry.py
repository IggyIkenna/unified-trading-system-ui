"""
Artifact Registry utilities for resolving Docker image metadata.

Uses the Docker Registry HTTP API v2 which Artifact Registry implements.
This avoids needing the google-cloud-artifact-registry package.
"""

import logging
import re
from datetime import UTC, datetime
from typing import cast

import aiohttp
import google.auth
import google.auth.transport.requests

logger = logging.getLogger(__name__)

# Cache for image metadata (to avoid repeated API calls)
_image_cache: dict[str, dict[str, object]] = {}
_cache_ttl = 300  # 5 minutes


def _parse_image_url(image_url: str) -> dict[str, str] | None:
    """
    Parse an Artifact Registry Docker image URL.

    Examples:
        asia-northeast1-docker.pkg.dev/project-id/repo/image:tag
        asia-northeast1-docker.pkg.dev/project-id/repo/image@sha256:abc123

    Returns:
        Dict with location, project, repository, image, tag/digest
    """
    # Pattern for Artifact Registry URLs
    pattern = (
        r"^(?P<location>[a-z]+-[a-z]+[0-9]*)-docker\.pkg\.dev"
        r"/(?P<project>[^/]+)/(?P<repository>[^/]+)/(?P<image>[^:@]+)"
        r"(?::(?P<tag>[^@]+)|@(?P<digest>sha256:[a-f0-9]+))?$"
    )

    match = re.match(pattern, image_url)
    if not match:
        logger.warning("Could not parse image URL: %s", image_url)
        return None

    result = match.groupdict()
    # Default tag to 'latest' if not specified
    if not result.get("tag") and not result.get("digest"):
        result["tag"] = "latest"

    return result


def _get_auth_token() -> str | None:
    """Get OAuth2 token for Artifact Registry API."""
    try:
        creds_result: tuple[object, object] = google.auth.default(  # pyright: ignore[reportUnknownMemberType]  # google-auth stubs
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        credentials: object = creds_result[0]
        # Refresh credentials if needed
        request = google.auth.transport.requests.Request()
        if hasattr(credentials, "refresh"):
            credentials.refresh(request)
        return str(getattr(credentials, "token", "")) if hasattr(credentials, "token") else None
    except (OSError, ValueError, RuntimeError) as e:
        logger.error("Failed to get auth token: %s", e)
        return None


async def get_image_info(image_url: str) -> dict[str, object] | None:
    """
    Get image digest and metadata from Artifact Registry.

    Uses Docker Registry HTTP API v2:
    GET /v2/{name}/manifests/{reference}

    Args:
        image_url: Full Docker image URL
            (e.g., asia-northeast1-docker.pkg.dev/project/repo/image:tag)

    Returns:
        Dict with digest, tags, created_time, etc.
    """
    # Check cache first
    cache_key = image_url
    if cache_key in _image_cache:
        cached = _image_cache[cache_key]
        cached_at = cast(datetime, cached["_cached_at"])
        if (datetime.now(UTC) - cached_at).seconds < _cache_ttl:
            return cached

    parsed = _parse_image_url(image_url)
    if not parsed:
        return None

    token = _get_auth_token()
    if not token:
        return None

    location = parsed["location"]
    project = parsed["project"]
    repository = parsed["repository"]
    image = parsed["image"]
    reference = parsed.get("digest") or parsed.get("tag") or "latest"

    # Docker Registry API endpoint
    registry_url = f"https://{location}-docker.pkg.dev"
    manifest_url = f"{registry_url}/v2/{project}/{repository}/{image}/manifests/{reference}"

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": (
            "application/vnd.docker.distribution.manifest.v2+json,"
            " application/vnd.oci.image.manifest.v1+json"
        ),
    }

    try:
        timeout = aiohttp.ClientTimeout(total=10)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            # Get manifest (this returns the digest in Docker-Content-Digest header)
            async with session.get(manifest_url, headers=headers) as response:
                if response.status != 200:
                    logger.warning("Failed to get manifest for %s: %s", image_url, response.status)
                    return None
                digest = response.headers.get("Docker-Content-Digest") or ""

            # Try to get all tags for this digest
            tags_url = f"{registry_url}/v2/{project}/{repository}/{image}/tags/list"
            all_tags: list[str] = []
            async with session.get(tags_url, headers=headers) as tags_response:
                if tags_response.status == 200:
                    tags_data = cast(dict[str, object], await tags_response.json())
                    raw_tags = tags_data.get("tags")
                    all_tags = cast(list[str], raw_tags) if isinstance(raw_tags, list) else []

        # Build result
        result: dict[str, object] = {
            "digest": digest,
            "short_digest": digest.replace("sha256:", "")[:12] if digest else None,
            "tag": reference,
            "all_tags": all_tags,
            "image_url": image_url,
            "location": location,
            "project": project,
            "repository": repository,
            "image": image,
            "_cached_at": datetime.now(UTC),
        }

        # Cache result
        _image_cache[cache_key] = result

        return result

    except aiohttp.ClientError as e:
        logger.error("Error fetching image info for %s: %s", image_url, e)
        return None
    except (OSError, ValueError, RuntimeError) as e:
        logger.error("Unexpected error fetching image info: %s", e)
        return None


def invalidate_image_cache(image_url: str | None = None):
    """Clear image cache (optionally for a specific URL)."""
    if image_url:
        _image_cache.pop(image_url, None)
    else:
        _image_cache.clear()
