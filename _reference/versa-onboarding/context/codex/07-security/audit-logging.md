# Audit Logging

## TL;DR

Three mandatory security audit events must be emitted via `log_event()` wherever the triggering action occurs:
`AUTH_FAILURE`, `SECRET_ACCESSED`, and `CONFIG_CHANGED`. Trade execution and strategy audit records are persisted to GCS
and subject to a minimum 7-year retention period for regulatory compliance (FCA/MiFID II).

**Machine-readable SSOT:**

- Event schemas: `unified-internal-contracts/unified_internal_contracts/events.py` — `AuthFailureDetails`,
  `SecretAccessedDetails`, `ConfigChangedDetails`
- Audit retention and required fields: `unified-internal-contracts/unified_internal_contracts/schemas/audit.py` —
  `EXECUTION_AUDIT`, `STRATEGY_AUDIT`

---

## Mandatory Security Audit Events

### AUTH_FAILURE

Emit whenever an authentication attempt fails (API key rejected, OAuth token invalid, JWT expired, mTLS handshake
failure, etc.).

> **Do not confuse with `LOGIN_FAILURE`:** `AUTH_FAILURE` is a **server-side** security audit event emitted by API
> services when an API key, JWT, or mTLS credential is rejected. `LOGIN_FAILURE` is a **UI-side** observability event
> emitted by `unified-trading-ui-auth` when an OAuth PKCE flow fails in the browser (OAuth error callback or token
> validation failure). Both coexist in `STANDARD_LIFECYCLE_EVENTS`. See
> `03-observability/lifecycle-events.md §UI Auth Events`.

**Required fields:**

| Field            | Type  | Description                                               |
| ---------------- | ----- | --------------------------------------------------------- |
| `auth_type`      | `str` | One of: `api_key`, `oauth`, `jwt`, `mtls`                 |
| `username`       | `str` | Identity that attempted authentication (or `"anonymous"`) |
| `failure_reason` | `str` | Human-readable reason for failure                         |
| `ip_address`     | `str` | Source IP address of the request (if available)           |
| `endpoint`       | `str` | The endpoint or resource that was accessed                |
| `attempt_count`  | `int` | Cumulative failed attempts from this identity (if known)  |

```python
log_event("AUTH_FAILURE", metadata={
    "correlation_id": request_id,
    "auth_type": "api_key",
    "username": username,
    "failure_reason": "key_not_found",
    "ip_address": client_ip,
    "endpoint": "/orders",
    "attempt_count": 3,
})
```

### SECRET_ACCESSED

Emit whenever a secret is retrieved from Secret Manager via `get_secret_client()`. This event is typically emitted by
the secret client wrapper, not by application code directly.

**Required fields:**

| Field             | Type   | Description                                                   |
| ----------------- | ------ | ------------------------------------------------------------- |
| `secret_name`     | `str`  | Name of the secret in Secret Manager                          |
| `caller_identity` | `str`  | Service account or identity that accessed the secret          |
| `success`         | `bool` | Whether the access succeeded                                  |
| `operation`       | `str`  | One of: `access`, `create`, `delete`, `rotate`                |
| `version`         | `str`  | Secret version accessed (e.g. `"latest"` or a version number) |

```python
log_event("SECRET_ACCESSED", metadata={
    "correlation_id": run_id,
    "secret_name": "tardis-api-key",
    "caller_identity": "instruments-service@project.iam.gserviceaccount.com",
    "success": True,
    "operation": "access",
    "version": "latest",
})
```

### CONFIG_CHANGED

Emit whenever a configuration file is created, updated, or deleted — typically in deployment or runtime reconfiguration
flows.

**Required fields:**

| Field            | Type   | Description                                                   |
| ---------------- | ------ | ------------------------------------------------------------- |
| `config_file`    | `str`  | Workspace-relative path to the config file that changed       |
| `changed_by`     | `str`  | Identity (service account or username) that made the change   |
| `authorized`     | `bool` | Whether the change was authorized per IAM / approval workflow |
| `change_type`    | `str`  | One of: `update`, `create`, `delete`                          |
| `git_commit_sha` | `str`  | Git commit SHA if the change was applied via a code push      |
| `fields_changed` | `list` | List of field names that changed (redact values, not names)   |

```python
log_event("CONFIG_CHANGED", metadata={
    "correlation_id": deploy_id,
    "config_file": "deployment-service/configs/runtime-topology.yaml",
    "changed_by": "deploy-sa@project.iam.gserviceaccount.com",
    "authorized": True,
    "change_type": "update",
    "git_commit_sha": "a1b2c3d4",
    "fields_changed": ["max_workers", "venues"],
})
```

---

## Trade Execution Audit

Execution events (`ORDER_CREATED`, `ORDER_UPDATED`, `ORDER_CANCELLED`, `ORDER_FILLED`, `ORDER_REJECTED`) must be
persisted as immutable audit records.

**Canonical schema:** `EXECUTION_AUDIT` in `unified-internal-contracts/unified_internal_contracts/schemas/audit.py`

**Required fields on every execution audit record:**

| Field                | Description                       |
| -------------------- | --------------------------------- |
| `client_order_id`    | Client-assigned order identifier  |
| `exchange_timestamp` | Timestamp from the exchange (UTC) |
| `venue_response_id`  | Exchange-assigned order/fill ID   |
| `fill_price`         | Execution price (for fills)       |
| `fill_quantity`      | Quantity filled                   |

**GCS storage path:** `audit/{client_id}/{date}/{event_type}/`

**Retention:** minimum **7 years** (cold storage), per `AuditRetention(cold_years=7)` in `EXECUTION_AUDIT`.

---

## Strategy Audit

Strategy decision events (`STRATEGY_INSTRUCTION`, `SIGNAL_GENERATED`) must also be persisted.

**Canonical schema:** `STRATEGY_AUDIT` in `unified-internal-contracts/unified_internal_contracts/schemas/audit.py`

**Required fields:**

| Field               | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `strategy_id`       | Identifier for the strategy that generated the event |
| `client`            | Client for whom the strategy is running              |
| `signal_source`     | Model or rule that produced the signal               |
| `position_snapshot` | Serialised position state at decision time           |

**GCS storage path:** `audit/{client_id}/{date}/strategy/`

**Retention:** minimum **3 years** (cold storage).

---

## Data Retention Summary

| Audit Domain | Hot (days) | Warm (days) | Cold (years) | Path template                            |
| ------------ | ---------- | ----------- | ------------ | ---------------------------------------- |
| Execution    | 90         | 365         | 7            | `audit/{client_id}/{date}/{event_type}/` |
| Strategy     | 90         | 365         | 3            | `audit/{client_id}/{date}/strategy/`     |

Retention tiers are defined as `AuditRetention` models in
`unified-internal-contracts/unified_internal_contracts/schemas/audit.py`.

---

## Immutability Rules

- Audit records are **append-only**. Never delete or overwrite an existing audit record.
- Use the GCS Object Versioning or Retention Lock feature on the audit bucket to enforce immutability at the storage
  layer.
- `log_event()` writes are non-destructive JSONL appends; always use the append mode.

---

## Anti-Patterns

```python
# NEVER: emit AUTH_FAILURE without all required fields
log_event("AUTH_FAILURE")  # missing auth_type, username, failure_reason

# NEVER: skip logging on auth failure to avoid noise
except AuthError:
    pass  # silent swallow — violates audit requirement

# NEVER: modify or delete an existing audit record
storage_client.delete("audit/client-alpha/2026-03-01/ORDER_FILLED/records.jsonl")
```

---

## Related

- Machine-readable event schemas: `unified-internal-contracts/unified_internal_contracts/events.py`
- Machine-readable audit schemas: `unified-internal-contracts/unified_internal_contracts/schemas/audit.py`
- Lifecycle events (non-security): `03-observability/lifecycle-events.md`
- Secrets access pattern: `07-security/secrets-management.md`
- Cursor rule: `.cursor/rules/core/event-logging.mdc`
- Observability compliance: `.cursor/rules/misc/observability-compliance.mdc`
