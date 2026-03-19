# Bucket Naming and Config Standards

## TL;DR

- **Canonical env var**: Use `GCP_PROJECT_ID` (not `GCP_PROJECT_ID` or generic `project_id`) for consistency and
  cloud-agnostic clarity.
- **Bucket naming**: Use **prefix + project ID suffix**. Config stores the prefix; service code joins to form the full
  bucket name.
- **Pattern**: `{bucket_prefix}-{gcp_project_id}` — prefix is cloud-agnostic; project ID ensures uniqueness.

---

## Project ID: GCP_PROJECT_ID Only

Use `GCP_PROJECT_ID` as the canonical environment variable and config attribute for GCP project identification.

| Use                            | Avoid                                  |
| ------------------------------ | -------------------------------------- |
| `GCP_PROJECT_ID`               | `GCP_PROJECT_ID` (legacy alias only)   |
| `gcp_project_id` (config attr) | `project_id` (ambiguous across clouds) |

**Rationale**: Amazon and GCP project IDs are distinct. Explicit `GCP_PROJECT_ID` / `AWS_ACCOUNT_ID` naming avoids
ambiguity and supports multi-cloud.

**Backward compatibility**: Config may accept `GCP_PROJECT_ID` as an alias for `GCP_PROJECT_ID`, but new code and docs
use `GCP_PROJECT_ID` only.

---

## Bucket Naming: Prefix + Project ID Suffix

### Pattern

```
bucket_name = f"{bucket_prefix}-{gcp_project_id}"
```

- **Bucket prefix**: Cloud-agnostic, same for GCP and AWS (e.g. `market-data-tick-cefi`, `instruments-store-cefi`).
- **Project ID**: Cloud-specific suffix for uniqueness (GCP project ID or AWS account ID).

### Config Structure

| Env Var                            | Description               | Example                   |
| ---------------------------------- | ------------------------- | ------------------------- |
| `GCP_PROJECT_ID`                   | GCP project ID (suffix)   | `test-project`            |
| `MARKET_DATA_BUCKET_PREFIX_CEFI`   | Bucket prefix for CEFI    | `market-data-tick-cefi`   |
| `MARKET_DATA_BUCKET_PREFIX_TRADFI` | Bucket prefix for TRADFI  | `market-data-tick-tradfi` |
| `MARKET_DATA_BUCKET_PREFIX_DEFI`   | Bucket prefix for DEFI    | `market-data-tick-defi`   |
| `INSTRUMENTS_BUCKET_PREFIX_CEFI`   | Instruments bucket prefix | `instruments-store-cefi`  |

### Service Code

```python
def get_bucket_for_category(self, category: str, test_mode: bool = False) -> str:
    prefix = self._get_bucket_prefix_for_category(category, test_mode)
    return f"{prefix}-{self.gcp_project_id}"
```

### Test Mode

For test buckets, prefix may include `-test`:

- Prod: `market-data-tick-cefi-{gcp_project_id}`
- Test: `market-data-tick-cefi-test-{gcp_project_id}`

Env var: `MARKET_DATA_BUCKET_PREFIX_CEFI_TEST` = `market-data-tick-cefi-test`

---

## Backward Compatibility

Services may support both:

1. **Prefix-only**: `bucket = f"{prefix}-{gcp_project_id}"` (preferred)
2. **Full bucket name**: `MARKET_DATA_GCS_BUCKET_CEFI` = full name (legacy override)

If a full bucket name is configured, use it. Otherwise, derive from prefix + `GCP_PROJECT_ID`.

---

## References

- `06-coding-standards/README.md` — Configuration
- `05-infrastructure/cloud-agnostic-migration.md` — Cloud abstractions
- `02-data/schema-governance.md` — Schema and storage patterns
