"""
Schema robustness tests for deployment-service.

Layer 1 smoke: verifies dataclass-based state models and catalog dataclasses
instantiate cleanly and enforce their invariants.
"""

from __future__ import annotations


class TestDeploymentStateEnums:
    """Verify status enum values are well-formed."""

    def test_deployment_status_importable(self) -> None:
        from deployment_service.deployment.state import DeploymentStatus

        assert DeploymentStatus is not None

    def test_shard_status_importable(self) -> None:
        from deployment_service.deployment.state import ShardStatus

        assert ShardStatus is not None

    def test_failure_category_importable(self) -> None:
        from deployment_service.deployment.state import FailureCategory

        assert FailureCategory is not None

    def test_deployment_status_has_pending(self) -> None:
        from deployment_service.deployment.state import DeploymentStatus

        assert DeploymentStatus.PENDING.value == "pending"

    def test_shard_status_has_succeeded(self) -> None:
        from deployment_service.deployment.state import ShardStatus

        assert ShardStatus.SUCCEEDED.value == "succeeded"

    def test_failure_category_from_error_message_unknown(self) -> None:
        from deployment_service.deployment.state import FailureCategory

        result = FailureCategory.from_error_message("")
        assert result == FailureCategory.UNKNOWN


class TestExecutionAttemptDataclass:
    """Verify ExecutionAttempt dataclass instantiation."""

    def test_execution_attempt_instantiation(self) -> None:
        from deployment_service.deployment.state import ExecutionAttempt

        attempt = ExecutionAttempt(attempt=1)
        assert attempt.attempt == 1
        assert attempt.status == "pending"

    def test_execution_attempt_to_dict_has_required_keys(self) -> None:
        from deployment_service.deployment.state import ExecutionAttempt

        attempt = ExecutionAttempt(attempt=1, zone="us-central1-a", status="running")
        d = attempt.to_dict()
        assert "attempt" in d
        assert "zone" in d
        assert "status" in d


class TestShardStateDataclass:
    """Verify ShardState dataclass instantiation."""

    def test_shard_state_instantiation(self) -> None:
        from deployment_service.deployment.state import ShardState

        shard = ShardState(shard_id="shard-0")
        assert shard.shard_id == "shard-0"
        assert shard.retries == 0

    def test_shard_state_to_dict_keys(self) -> None:
        from deployment_service.deployment.state import ShardState

        shard = ShardState(shard_id="shard-1")
        d = shard.to_dict()
        for key in ("shard_id", "status", "retries"):
            assert key in d


class TestCatalogDataclasses:
    """Verify CatalogEntry and ServiceCatalog dataclasses."""

    def test_catalog_entry_instantiation(self) -> None:
        from deployment_service.catalog import CatalogEntry

        entry = CatalogEntry(service="test-svc", dimensions={"date": "2024-01-01"}, file_count=5)
        assert entry.service == "test-svc"
        assert entry.file_count == 5

    def test_catalog_entry_completion_percentage(self) -> None:
        from deployment_service.catalog import CatalogEntry

        entry = CatalogEntry(service="svc", dimensions={}, file_count=1, expected_count=2)
        assert entry.completion_percentage == 50.0

    def test_service_catalog_overall_completion_zero_when_empty(self) -> None:
        from deployment_service.catalog import ServiceCatalog

        cat = ServiceCatalog(service="svc", start_date="2024-01-01", end_date="2024-01-07")
        assert cat.overall_completion == 0.0
