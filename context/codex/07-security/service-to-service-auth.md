# Service-to-Service Authentication

**SSOT:** This document defines the S2S auth phases for the Unified Trading System. Implementations live in
`{service}/auth_s2s.py` in each enrolled service.

---

## Phase 0 — Static Bearer Token (CURRENT)

**Status:** Implemented in execution-service, risk-and-exposure-service.

All internal service-to-service calls include an `X-Service-Token` header. The expected value is loaded from config via
`UnifiedCloudConfig.service_auth_token` (backed by the `SERVICE_AUTH_TOKEN` env var or Secret Manager secret
`{service}-s2s-token`).

### Pattern

```python
# Caller (e.g. strategy-service calling execution-service)
from unified_config_interface import UnifiedCloudConfig

cfg = UnifiedCloudConfig()
headers = {"X-Service-Token": cfg.service_auth_token or ""}
response = await http_client.post("/internal/submit-order", headers=headers, json=payload)
```

```python
# Receiver (execution-service FastAPI route)
from execution_service.auth_s2s import verify_service_token

@router.post("/internal/submit-order")
async def submit_order(
    payload: OrderPayload,
    _: None = Depends(verify_service_token),
):
    ...
```

### Token provisioning

Token is stored in Secret Manager as `{service}-s2s-token` (or a single shared `service-mesh-token` for Phase 0). Loaded
at startup — restart required after rotation.

```bash
bash unified-trading-pm/scripts/setup_secret.sh \
  -p "${GCP_PROJECT_ID}" \
  -n "execution-service-s2s-token" \
  -v "$(openssl rand -hex 32)"
```

Set the env var in Cloud Run:

```yaml
env:
  - name: SERVICE_AUTH_TOKEN
    valueFrom:
      secretKeyRef:
        name: execution-service-s2s-token
        key: latest
```

### Bypass behaviour

If `SERVICE_AUTH_TOKEN` is not set on a service, `verify_service_token()` logs a warning and bypasses the check. This
ensures zero downtime during rollout — services can be enrolled incrementally.

---

## Phase 1 — GCP Service Account OAuth (PLANNED)

**Status:** Planned. Will replace Phase 0 after all services are deployed to Cloud Run.

Each service will have a dedicated GCP service account. Callers obtain short-lived OAuth tokens via the metadata server
or `google-auth` library. Receivers validate tokens via Google's tokeninfo endpoint.

```python
# Phase 1 caller pattern (planned)
import google.auth.transport.requests
import google.oauth2.id_token

def get_id_token(audience: str) -> str:
    request = google.auth.transport.requests.Request()
    return google.oauth2.id_token.fetch_id_token(request, audience)

headers = {"Authorization": f"Bearer {get_id_token('https://execution-service-url/')}"}
```

Phase 1 requires:

1. Service accounts provisioned per service (see `CredentialsRegistry.SERVICE_ACCOUNT_MAP`)
2. IAM binding: caller SA has `roles/run.invoker` on receiver Cloud Run service
3. Receiver validates token audience against its own Cloud Run URL

---

## Enrolled Services

| Service                          | Phase 0 module                          | Phase 1 target |
| -------------------------------- | --------------------------------------- | -------------- |
| execution-service                | `execution_service/auth_s2s.py`         | Phase 1        |
| risk-and-exposure-service        | `risk_and_exposure_service/auth_s2s.py` | Phase 1        |
| strategy-service                 | TBD (T4 Batch E)                        | Phase 1        |
| pnl-attribution-service          | TBD (T4 Batch F)                        | Phase 1        |
| position-balance-monitor-service | TBD (T4 Batch F)                        | Phase 1        |

---

## Phase 0 Implementation Details

### What SA OAuth Entails (Phase 0)

Phase 0 uses a **static shared bearer token** (not a true service account OAuth token — that is Phase 1). The name "SA
OAuth" in the plan refers to the target direction; Phase 0 is the transitional step:

- A random 32-byte hex string (`openssl rand -hex 32`) serves as the shared secret.
- Stored in Secret Manager as `{service}-s2s-token`.
- Loaded at service startup via `UnifiedCloudConfig.service_auth_token`.
- Sent on every internal HTTP call as `X-Service-Token: <token>`.
- Receiver validates via `verify_service_token()` FastAPI dependency.

This approach requires zero per-call latency (no OAuth round-trip) and is appropriate for the current phase where all
services are in the same VPC. Phase 1 (GCP SA OAuth) replaces this with short-lived Google-signed ID tokens.

### Smoke Test: `auth_smoke_test.py`

Each enrolled service MUST have `tests/smoke/auth_smoke_test.py`. This file validates that the `SERVICE_AUTH_TOKEN`
environment variable is present and meets the minimum security bar before any deployment proceeds.

**Canonical implementation:**

```python
# tests/smoke/auth_smoke_test.py
"""
Phase 0 S2S auth smoke test.

Validates that SERVICE_AUTH_TOKEN is set and meets the minimum security bar.
This test runs in CI (quality-gates.sh --quick) and as a pre-deploy gate.

Phase 0: static bearer token (32-byte hex minimum).
Phase 1 (planned): GCP service account OAuth ID token — this file will be
replaced with SA token validation when Phase 1 is implemented.
"""
import os
import re


def test_service_auth_token_env_var_is_set() -> None:
    """SERVICE_AUTH_TOKEN must be present — absent means SM provisioning was skipped."""
    token = os.environ.get("SERVICE_AUTH_TOKEN")
    assert token, (
        "SERVICE_AUTH_TOKEN must be set. "
        "Provision via: bash unified-trading-pm/scripts/setup_secret.sh "
        "-p $GCP_PROJECT_ID -n {service}-s2s-token -v $(openssl rand -hex 32)"
    )


def test_service_auth_token_minimum_length() -> None:
    """Token must be at least 32 chars (256-bit entropy floor)."""
    token = os.environ.get("SERVICE_AUTH_TOKEN", "")
    assert len(token) >= 32, (
        f"SERVICE_AUTH_TOKEN is only {len(token)} chars — minimum is 32. "
        "Rotate with: openssl rand -hex 32"
    )


def test_service_auth_token_is_hex_string() -> None:
    """Phase 0 tokens MUST be lowercase hex (output of openssl rand -hex 32).

    This catches accidentally provisioned plaintext passwords or base64 blobs
    that would pass the length check but have lower entropy density.
    """
    token = os.environ.get("SERVICE_AUTH_TOKEN", "")
    if not token:
        return  # already caught by test_service_auth_token_env_var_is_set
    assert re.fullmatch(r"[0-9a-f]+", token), (
        "SERVICE_AUTH_TOKEN must be a lowercase hex string. "
        "Generate with: openssl rand -hex 32"
    )
```

**Placement:** `tests/smoke/auth_smoke_test.py` in every enrolled service repo.

**CI execution:** `quality-gates.sh --quick` runs the smoke tier; this test is included automatically when the
`tests/smoke/` directory exists.

**Local execution:**

```bash
SERVICE_AUTH_TOKEN=$(openssl rand -hex 32) pytest tests/smoke/auth_smoke_test.py -v
```

### How Services Validate Tokens

The `verify_service_token()` FastAPI dependency is the canonical receiver implementation. It lives in
`{service}/auth_s2s.py`:

```python
# {service}/auth_s2s.py
import logging
from fastapi import Header, HTTPException, status
from unified_config_interface import UnifiedCloudConfig

logger = logging.getLogger(__name__)


async def verify_service_token(x_service_token: str = Header(default="")) -> None:
    """FastAPI dependency — validates X-Service-Token on all /internal/* routes.

    Bypass behaviour (Phase 0): if SERVICE_AUTH_TOKEN is not configured on THIS
    receiver, the check is skipped with a WARNING. This allows incremental rollout
    without downtime. Once all services are enrolled, the bypass will be removed.
    """
    cfg = UnifiedCloudConfig()
    expected = cfg.service_auth_token
    if not expected:
        logger.warning(
            "SERVICE_AUTH_TOKEN not configured — skipping S2S token check. "
            "Enroll this service by provisioning the secret and setting the env var."
        )
        return
    if x_service_token != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Service-Token",
        )
```

### Token Rotation Procedure

```bash
# 1. Generate new token
NEW_TOKEN=$(openssl rand -hex 32)

# 2. Add new version to Secret Manager (old version remains accessible)
bash unified-trading-pm/scripts/setup_secret.sh \
  -p "${GCP_PROJECT_ID}" \
  -n "{service}-s2s-token" \
  -v "$NEW_TOKEN"

# 3. Deploy new service version (picks up latest SM version at startup)
# 4. Verify smoke test passes with new token:
SERVICE_AUTH_TOKEN="$NEW_TOKEN" pytest tests/smoke/auth_smoke_test.py -v
```

---

## Testing

An `auth_smoke_test.py` validates S2S token env var per service. See the **Phase 0 Implementation Details** section
above for the canonical three-test implementation (`env_var_is_set`, `minimum_length`, `is_hex_string`).

**Quick reference:**

```bash
# Run smoke tests locally (simulates CI)
SERVICE_AUTH_TOKEN=$(openssl rand -hex 32) pytest tests/smoke/auth_smoke_test.py -v

# Run as part of quality gates
bash scripts/quality-gates.sh --quick
```

---

## Cross-references

- `unified-cloud-interface/unified_cloud_interface/credentials_registry.py` — `SERVICE_ACCOUNT_MAP`
- `unified-config-interface/unified_config_interface/cloud_config.py` — `service_auth_token` field
- `unified-trading-codex/07-security/secret-naming-convention.md` — naming patterns
- `execution-service/execution_service/auth_s2s.py` — Phase 0 implementation
- `risk-and-exposure-service/risk_and_exposure_service/auth_s2s.py` — Phase 0 implementation
