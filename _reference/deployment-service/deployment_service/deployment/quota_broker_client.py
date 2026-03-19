from __future__ import annotations

import base64
import json
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, cast

import requests
from google.auth.transport.requests import Request
from google.oauth2 import id_token
from requests import Response

# Add parent directory to path for imports
current_dir = Path(__file__).parent
parent_dir = current_dir.parent
sys.path.insert(0, str(parent_dir))

from deployment_service.deployment_config import DeploymentConfig

ComputeType = Literal["vm", "cloud_run"]


@dataclass(frozen=True)
class QuotaBrokerAcquireResult:
    granted: bool
    lease_id: str
    reason: str | None = None
    retry_after_seconds: int | None = None


class QuotaBrokerClient:
    """
    Minimal client for the centralized quota-broker (Cloud Run IAM).

    Env:
      - QUOTA_BROKER_URL: base URL like https://quota-broker-xxxxx-uc.a.run.app
      - QUOTA_BROKER_AUTH_MODE: "iam" (default) or "none"
      - QUOTA_BROKER_TIMEOUT_SECONDS: request timeout (default 10)
    """

    def __init__(
        self,
        *,
        base_url: str | None = None,
        auth_mode: str | None = None,
        timeout_seconds: float | None = None,
    ):
        config = DeploymentConfig()
        self.base_url = (base_url or config.quota_broker_url or "").rstrip("/")
        self.auth_mode = (auth_mode or config.quota_broker_auth_mode or "iam").lower()
        self.timeout_seconds = float(timeout_seconds or config.quota_broker_timeout_seconds or 10.0)

        self._token_request = Request()
        self._cached_token: str | None = None
        self._cached_token_exp: float | None = None

    def enabled(self) -> bool:
        return bool(self.base_url)

    def _audience(self) -> str:
        # For Cloud Run, audience should match the service URL.
        return self.base_url

    def _get_bearer_token(self) -> str:
        # Cache token until ~60s before expiry.
        now = time.time()
        if self._cached_token and self._cached_token_exp and now < (self._cached_token_exp - 60):
            return self._cached_token

        # fetch_id_token() internally uses ADC (metadata server on Cloud Run, or local ADC).
        token: str = str(id_token.fetch_id_token(self._token_request, self._audience()))

        # Parse exp from JWT without verification (safe for caching only).
        try:
            payload_b64 = token.split(".")[1]
            # Pad base64url string
            payload_b64 += "=" * (-len(payload_b64) % 4)
            payload: dict[str, object] = cast(
                dict[str, object],
                json.loads(base64.urlsafe_b64decode(payload_b64.encode("utf-8")).decode("utf-8")),
            )
            exp = float(cast(float | str | None, payload.get("exp")) or 0.0)
        except (OSError, ValueError, RuntimeError):
            exp = now + 300.0

        self._cached_token = token
        self._cached_token_exp = exp
        return token

    def _headers(self) -> dict[str, str]:
        if not self.enabled():
            return {}
        if self.auth_mode == "none":
            return {}
        # default: iam
        return {"Authorization": f"Bearer {self._get_bearer_token()}"}

    def get_live_quotas(self, *, regions: list[str]) -> dict[str, object]:
        if not self.enabled():
            raise RuntimeError("QuotaBrokerClient not enabled (QUOTA_BROKER_URL not set)")
        params = {"regions": ",".join(regions)}
        resp = requests.get(
            f"{self.base_url}/v1/quotas/live",
            headers=self._headers(),
            params=params,
            timeout=self.timeout_seconds,
        )
        resp.raise_for_status()
        return cast(dict[str, object], resp.json())

    def acquire(
        self,
        *,
        deployment_id: str,
        shard_id: str,
        compute_type: ComputeType,
        region: str,
        resources: dict[str, float],
        ttl_seconds: int | None = None,
    ) -> QuotaBrokerAcquireResult:
        if not self.enabled():
            # If broker not configured, default to "granted" so current behavior is unchanged.
            return QuotaBrokerAcquireResult(granted=True, lease_id="disabled")

        payload: dict[str, object] = {
            "deployment_id": deployment_id,
            "shard_id": shard_id,
            "compute_type": compute_type,
            "region": region,
            "resources": resources,
        }
        if ttl_seconds is not None:
            payload["ttl_seconds"] = int(ttl_seconds)

        try:
            resp: Response = requests.post(
                f"{self.base_url}/v1/admissions/acquire",
                headers={**self._headers(), "Content-Type": "application/json"},
                json=payload,
                timeout=self.timeout_seconds,
            )
        except (OSError, ValueError, RuntimeError) as e:
            # Fail closed (deny) but do not crash callers.
            return QuotaBrokerAcquireResult(
                granted=False,
                lease_id="",
                reason=f"broker_request_error: {e}",
                retry_after_seconds=30,
            )

        if not resp.ok:
            # Best-effort parse broker error payload.
            reason = f"broker_http_{resp.status_code}"
            retry_after = 30
            lease_id = ""
            try:
                data = resp.json() or {}
                lease_id = str(data.get("lease_id") or "")
                reason = str(data.get("reason") or reason)
                ra = data.get("retry_after_seconds")
                retry_after = int(ra) if ra is not None else retry_after
            except (OSError, ValueError, RuntimeError):
                # Include short body snippet for debugging.
                body = (resp.text or "")[:200].strip()
                if body:
                    reason = f"{reason}: {body}"
            return QuotaBrokerAcquireResult(
                granted=False,
                lease_id=lease_id,
                reason=reason,
                retry_after_seconds=retry_after,
            )

        data = resp.json() or {}
        return QuotaBrokerAcquireResult(
            granted=bool(data.get("granted")),
            lease_id=str(data.get("lease_id") or ""),
            reason=data.get("reason"),
            retry_after_seconds=data.get("retry_after_seconds"),
        )

    def release(self, *, lease_id: str) -> bool:
        if not self.enabled():
            return True
        try:
            resp = requests.post(
                f"{self.base_url}/v1/admissions/release",
                headers={**self._headers(), "Content-Type": "application/json"},
                json={"lease_id": lease_id},
                timeout=self.timeout_seconds,
            )
            if not resp.ok:
                return False
            data = resp.json() or {}
            return bool(data.get("released"))
        except (OSError, ValueError, RuntimeError):
            return False
