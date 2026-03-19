"""Smoke tests: verify all public API imports resolve without error."""


def test_package_imports() -> None:
    from deployment_service import (
        CloudClient,
        ConfigLoader,
        DataCatalog,
        DeploymentMonitor,
        Shard,
        ShardCalculator,
        ShardLimitExceeded,
        T1Orchestrator,
    )

    assert CloudClient is not None
    assert ConfigLoader is not None
    assert DataCatalog is not None
    assert DeploymentMonitor is not None
    assert Shard is not None
    assert ShardCalculator is not None
    assert ShardLimitExceeded is not None
    assert T1Orchestrator is not None


def test_backends_import() -> None:
    from deployment_service.backends import ComputeBackend, JobInfo, JobStatus

    assert ComputeBackend is not None
    assert JobInfo is not None
    assert JobStatus is not None
