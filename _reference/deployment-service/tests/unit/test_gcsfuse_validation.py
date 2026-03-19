"""
Unit tests for gcsfuse bucket validation.

Ensures services never mount large buckets that cause OOM.
"""

from pathlib import Path

import pytest
import yaml

# Whitelist: Small buckets that are safe to mount with gcsfuse
ALLOWED_GCSFUSE_BUCKETS = {
    # Instruments: ~200-500 files total, small metadata
    "instruments-store-cefi-{project_id}",
    "instruments-store-defi-{project_id}",
    "instruments-store-tradfi-{project_id}",
    # Deployment orchestration: ~few thousand files with 48h TTL
    "deployment-orchestration-{project_id}",
}

# Blacklist: Large buckets that MUST NOT be mounted (millions of files, cause OOM)
FORBIDDEN_GCSFUSE_BUCKETS = {
    # Market tick data: millions of parquet files, TBs of data
    "market-data-tick-cefi-{project_id}",
    "market-data-tick-defi-{project_id}",
    "market-data-tick-tradfi-{project_id}",
    # Features: large parquet datasets
    "features-volatility-cefi-{project_id}",
    "features-volatility-tradfi-{project_id}",
    "features-onchain-{project_id}",
    "features-delta-one-cefi-{project_id}",
    "features-delta-one-defi-{project_id}",
    "features-delta-one-tradfi-{project_id}",
    "features-calendar-{project_id}",
    # ML: large model files and artifacts
    "ml-models-store-{project_id}",
    "ml-training-artifacts-{project_id}",
    "ml-predictions-store-{project_id}",
    "ml-configs-store-{project_id}",
    # Strategy and execution: large output datasets
    "strategy-store-{project_id}",
    "execution-store-{project_id}",
}


def get_sharding_configs() -> list[tuple[str, dict]]:
    """Get all sharding config files."""
    configs_dir = Path(__file__).parent.parent.parent / "configs"
    sharding_files = list(configs_dir.glob("sharding.*.yaml"))
    results = []
    for f in sharding_files:
        with open(f) as fh:
            cfg = yaml.safe_load(fh)
        results.append((f.name, cfg))
    return results


def test_no_forbidden_gcsfuse_buckets():
    """
    CRITICAL: Services must NOT mount large buckets with gcsfuse.

    Large buckets (market-data-tick, features, ML) cause OOM due to:
    - Millions of files → massive metadata cache
    - Type cache grows with directory depth
    - Each mount = separate gcsfuse process

    This test ensures Quality Gates FAIL if any service tries to mount
    a forbidden bucket.
    """
    violations = []

    for filename, cfg in get_sharding_configs():
        service_name = filename.replace("sharding.", "").replace(".yaml", "")
        vm_config = cfg.get("compute", {}).get("vm", {})
        gcsfuse_buckets = vm_config.get("gcsfuse_buckets", [])

        if not gcsfuse_buckets:
            # Empty list or not set - OK
            continue

        for bucket in gcsfuse_buckets:
            if bucket in FORBIDDEN_GCSFUSE_BUCKETS:
                violations.append(f"{service_name}: FORBIDDEN bucket '{bucket}' in gcsfuse_buckets")

    if violations:
        error_msg = (
            "\n\n"
            "❌ GCSFUSE VALIDATION FAILED\n"
            "❌ The following services are trying to mount LARGE buckets with gcsfuse.\n"
            "❌ This causes OOM death loops. Use GCS API instead.\n\n"
            + "\n".join(f"  - {v}" for v in violations)
            + "\n\n"
            "Forbidden buckets (millions of files, TBs of data):\n"
            + "\n".join(f"  - {b}" for b in sorted(FORBIDDEN_GCSFUSE_BUCKETS))
            + "\n\n"
            "Allowed buckets (small, bounded):\n"
            + "\n".join(f"  - {b}" for b in sorted(ALLOWED_GCSFUSE_BUCKETS))
            + "\n"
        )
        pytest.fail(error_msg)
    assert True, "GCSFuse validation passed"


def test_gcsfuse_buckets_in_whitelist():
    """
    Verify all gcsfuse_buckets (if any) are in the whitelist.

    Services should only mount small, bounded buckets.
    """
    violations = []

    for filename, cfg in get_sharding_configs():
        service_name = filename.replace("sharding.", "").replace(".yaml", "")
        vm_config = cfg.get("compute", {}).get("vm", {})
        gcsfuse_buckets = vm_config.get("gcsfuse_buckets", [])

        if not gcsfuse_buckets:
            continue

        for bucket in gcsfuse_buckets:
            if bucket not in ALLOWED_GCSFUSE_BUCKETS:
                violations.append(
                    f"{service_name}: bucket '{bucket}' not in whitelist (is it safe to mount?)"
                )

    if violations:
        error_msg = (
            "\n\n"
            "⚠️  GCSFUSE WHITELIST WARNING\n"
            "The following buckets are not in the whitelist:\n\n"
            + "\n".join(f"  - {v}" for v in violations)
            + "\n\n"
            "If these buckets are small (<10k files), add them to ALLOWED_GCSFUSE_BUCKETS.\n"
            "If they are large, remove them from gcsfuse_buckets and use GCS API.\n"
        )
        pytest.fail(error_msg)
    assert True, "GCSFuse validation passed"


def test_domain_services_have_no_gcsfuse():
    """
    All domain services (12 pipeline services) should have gcsfuse disabled.

    Only the UTD v2 API (Cloud Run) should use gcsfuse for STATE_BUCKET.
    """
    domain_services = [
        "market-tick-data-service",
        "market-data-processing-service",
        "instruments-service",
        "features-volatility-service",
        "features-onchain-service",
        "features-delta-one-service",
        "features-calendar-service",
        "ml-inference-service",
        "ml-training-service",
        "strategy-service",
        "execution-service",
        "corporate-actions",
    ]

    violations = []

    for filename, cfg in get_sharding_configs():
        service_name = filename.replace("sharding.", "").replace(".yaml", "")
        if service_name not in domain_services:
            continue

        vm_config = cfg.get("compute", {}).get("vm", {})
        gcsfuse_buckets = vm_config.get("gcsfuse_buckets", [])

        if gcsfuse_buckets:
            violations.append(
                f"{service_name}: has {len(gcsfuse_buckets)} gcsfuse_buckets (should be [])"
            )

    if violations:
        error_msg = (
            "\n\n"
            "❌ DOMAIN SERVICES MUST NOT USE GCSFUSE\n"
            "The following services still have gcsfuse enabled:\n\n"
            + "\n".join(f"  - {v}" for v in violations)
            + "\n\n"
            "Set gcsfuse_buckets: [] for all domain services.\n"
            "Only the UTD v2 API (Cloud Run) should use gcsfuse for STATE_BUCKET.\n"
        )
        pytest.fail(error_msg)
    assert True, "GCSFuse validation passed"


def test_gcsfuse_disabled_for_all_services():
    """
    Current policy: ALL services have gcsfuse disabled (including domain services).

    This is the simplest, most reliable solution. Services use GCS API for all I/O.
    """
    for filename, cfg in get_sharding_configs():
        service_name = filename.replace("sharding.", "").replace(".yaml", "")
        vm_config = cfg.get("compute", {}).get("vm", {})
        gcsfuse_buckets = vm_config.get("gcsfuse_buckets", [])

        assert not gcsfuse_buckets, (
            f"{service_name}: gcsfuse should be disabled (gcsfuse_buckets: [])"
        )
