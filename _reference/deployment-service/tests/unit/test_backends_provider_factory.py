"""
Unit tests for deployment_service/backends/provider_factory.py.

Covers:
- COMPUTE_TYPE_MAP structure
- get_cloud_provider: reads from DeploymentConfig
- get_backend_for_provider: GCP cloud_run / GCP vm / AWS batch / AWS ec2
- get_backend_for_provider: unknown provider raises ValueError
- get_backend: delegates to get_backend_for_provider with current provider
- _get_gcp_backend: cloud_run missing job_name raises ValueError
- _get_gcp_backend: unsupported GCP type raises ValueError
- _get_aws_backend: unsupported AWS type raises ValueError
- get_backend_for_service: resolves topology and delegates
- list_available_backends: all providers / specific provider / unknown provider
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from deployment_service.backends.provider_factory import (
    COMPUTE_TYPE_MAP,
    get_backend,
    get_backend_for_provider,
    get_backend_for_service,
    list_available_backends,
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PROJECT = "test-project"
REGION = "us-central1"
SA = "sa@test.iam.gserviceaccount.com"


# ---------------------------------------------------------------------------
# COMPUTE_TYPE_MAP
# ---------------------------------------------------------------------------


class TestComputeTypeMap:
    def test_gcp_cloud_run_maps_to_cloud_run(self) -> None:
        assert COMPUTE_TYPE_MAP["gcp"]["cloud_run"] == "cloud_run"

    def test_gcp_vm_maps_to_vm(self) -> None:
        assert COMPUTE_TYPE_MAP["gcp"]["vm"] == "vm"

    def test_aws_cloud_run_maps_to_batch(self) -> None:
        assert COMPUTE_TYPE_MAP["aws"]["cloud_run"] == "batch"

    def test_aws_batch_maps_to_batch(self) -> None:
        assert COMPUTE_TYPE_MAP["aws"]["batch"] == "batch"

    def test_aws_vm_maps_to_ec2(self) -> None:
        assert COMPUTE_TYPE_MAP["aws"]["vm"] == "ec2"

    def test_aws_ec2_maps_to_ec2(self) -> None:
        assert COMPUTE_TYPE_MAP["aws"]["ec2"] == "ec2"


# ---------------------------------------------------------------------------
# get_cloud_provider
# ---------------------------------------------------------------------------


class TestGetCloudProvider:
    def test_reads_from_deployment_config(self) -> None:
        from deployment_service.backends.provider_factory import get_cloud_provider

        with patch("deployment_service.backends.provider_factory.DeploymentConfig") as MockCfg:
            cfg = MagicMock()
            cfg.cloud_provider = "GCP"
            MockCfg.return_value = cfg

            result = get_cloud_provider()

        assert result == "gcp"

    def test_returns_lowercase(self) -> None:
        from deployment_service.backends.provider_factory import get_cloud_provider

        with patch("deployment_service.backends.provider_factory.DeploymentConfig") as MockCfg:
            cfg = MagicMock()
            cfg.cloud_provider = "AWS"
            MockCfg.return_value = cfg

            result = get_cloud_provider()

        assert result == "aws"


# ---------------------------------------------------------------------------
# get_backend_for_provider — GCP paths
# ---------------------------------------------------------------------------


class TestGetBackendForProviderGCP:
    def test_gcp_cloud_run_returns_cloud_run_backend(self) -> None:
        with patch("deployment_service.backends.provider_factory.CloudRunBackend") as MockCloudRun:
            mock_instance = MagicMock()
            MockCloudRun.return_value = mock_instance

            result = get_backend_for_provider(
                provider="gcp",
                compute_type="cloud_run",
                project_id=PROJECT,
                region=REGION,
                service_account_email=SA,
                job_name="my-job",
            )

        assert result is mock_instance
        MockCloudRun.assert_called_once_with(
            project_id=PROJECT,
            region=REGION,
            service_account_email=SA,
            job_name="my-job",
        )

    def test_gcp_vm_returns_vm_backend(self) -> None:
        with patch("deployment_service.backends.provider_factory.VMBackend") as MockVM:
            mock_instance = MagicMock()
            MockVM.return_value = mock_instance

            result = get_backend_for_provider(
                provider="gcp",
                compute_type="vm",
                project_id=PROJECT,
                region=REGION,
                service_account_email=SA,
            )

        assert result is mock_instance
        MockVM.assert_called_once()

    def test_gcp_cloud_run_missing_job_name_raises(self) -> None:
        with pytest.raises(ValueError, match="job_name"):
            get_backend_for_provider(
                provider="gcp",
                compute_type="cloud_run",
                project_id=PROJECT,
                region=REGION,
            )

    def test_gcp_cloud_run_non_string_job_name_raises(self) -> None:
        with pytest.raises(ValueError, match="job_name"):
            get_backend_for_provider(
                provider="gcp",
                compute_type="cloud_run",
                project_id=PROJECT,
                region=REGION,
                job_name=None,  # type: ignore[arg-type]
            )

    def test_gcp_unsupported_compute_type_raises(self) -> None:
        with pytest.raises(ValueError, match="Unsupported GCP compute type"):
            get_backend_for_provider(
                provider="gcp",
                compute_type="ecs",
                project_id=PROJECT,
                region=REGION,
            )


# ---------------------------------------------------------------------------
# get_backend_for_provider — AWS paths
# ---------------------------------------------------------------------------


class TestGetBackendForProviderAWS:
    def test_aws_batch_returns_batch_backend(self) -> None:
        with patch("deployment_service.backends.provider_factory.AWSBatchBackend") as MockBatch:
            mock_instance = MagicMock()
            MockBatch.return_value = mock_instance

            result = get_backend_for_provider(
                provider="aws",
                compute_type="batch",
                project_id="123456789",
                region="us-east-1",
                job_queue="my-queue",
                job_definition="my-def",
            )

        assert result is mock_instance
        MockBatch.assert_called_once_with(
            project_id="123456789",
            region="us-east-1",
            job_queue="my-queue",
            job_definition="my-def",
        )

    def test_aws_cloud_run_maps_to_batch(self) -> None:
        """AWS cloud_run is aliased to batch."""
        with patch("deployment_service.backends.provider_factory.AWSBatchBackend") as MockBatch:
            MockBatch.return_value = MagicMock()

            get_backend_for_provider(
                provider="aws",
                compute_type="cloud_run",
                project_id="123456789",
                region="us-east-1",
            )

        MockBatch.assert_called_once()

    def test_aws_ec2_returns_ec2_backend(self) -> None:
        with patch("deployment_service.backends.provider_factory.AWSEC2Backend") as MockEC2:
            mock_instance = MagicMock()
            MockEC2.return_value = mock_instance

            result = get_backend_for_provider(
                provider="aws",
                compute_type="ec2",
                project_id="123456789",
                region="us-east-1",
                subnet_id="subnet-abc",
                security_group_id="sg-abc",
                instance_profile_arn="arn:aws:iam::123:instance-profile/role",
                key_name="my-key",
            )

        assert result is mock_instance

    def test_aws_vm_maps_to_ec2(self) -> None:
        """AWS vm is aliased to ec2."""
        with patch("deployment_service.backends.provider_factory.AWSEC2Backend") as MockEC2:
            MockEC2.return_value = MagicMock()

            get_backend_for_provider(
                provider="aws",
                compute_type="vm",
                project_id="123456789",
                region="us-east-1",
            )

        MockEC2.assert_called_once()

    def test_aws_unsupported_compute_type_raises(self) -> None:
        with pytest.raises(ValueError, match="Unsupported AWS compute type"):
            get_backend_for_provider(
                provider="aws",
                compute_type="fargate",
                project_id="123456789",
                region="us-east-1",
            )


# ---------------------------------------------------------------------------
# get_backend_for_provider — unknown provider
# ---------------------------------------------------------------------------


class TestGetBackendForProviderUnknown:
    def test_unknown_provider_raises(self) -> None:
        with pytest.raises(ValueError, match="Unsupported cloud provider"):
            get_backend_for_provider(
                provider="azure",
                compute_type="vm",
                project_id=PROJECT,
                region=REGION,
            )


# ---------------------------------------------------------------------------
# get_backend
# ---------------------------------------------------------------------------


class TestGetBackend:
    def test_delegates_to_get_backend_for_provider(self) -> None:
        with (
            patch(
                "deployment_service.backends.provider_factory.get_cloud_provider",
                return_value="gcp",
            ),
            patch("deployment_service.backends.provider_factory.CloudRunBackend") as MockCloudRun,
        ):
            MockCloudRun.return_value = MagicMock()

            result = get_backend(
                compute_type="cloud_run",
                project_id=PROJECT,
                region=REGION,
                service_account_email=SA,
                job_name="my-job",
            )

        MockCloudRun.assert_called_once()
        assert result is not None

    def test_aws_provider_creates_batch(self) -> None:
        with (
            patch(
                "deployment_service.backends.provider_factory.get_cloud_provider",
                return_value="aws",
            ),
            patch("deployment_service.backends.provider_factory.AWSBatchBackend") as MockBatch,
        ):
            MockBatch.return_value = MagicMock()

            get_backend(
                compute_type="batch",
                project_id="acct-id",
                region="us-east-1",
            )

        MockBatch.assert_called_once()


# ---------------------------------------------------------------------------
# get_backend_for_service
# ---------------------------------------------------------------------------


class TestGetBackendForService:
    def test_resolves_topology_and_creates_backend(self) -> None:
        with (
            patch(
                "deployment_service.backends.provider_factory.get_deployment_target",
                return_value="cloud_run",
            ),
            patch(
                "deployment_service.backends.provider_factory.get_cloud_provider",
                return_value="gcp",
            ),
            patch("deployment_service.backends.provider_factory.CloudRunBackend") as MockCloudRun,
        ):
            MockCloudRun.return_value = MagicMock()

            result = get_backend_for_service(
                service_name="instruments-service",
                project_id=PROJECT,
                region=REGION,
                service_account_email=SA,
                job_name="instruments-job",
            )

        assert result is not None

    def test_uses_topology_compute_type(self) -> None:
        with (
            patch(
                "deployment_service.backends.provider_factory.get_deployment_target",
                return_value="vm",
            ) as mock_topo,
            patch(
                "deployment_service.backends.provider_factory.get_cloud_provider",
                return_value="gcp",
            ),
            patch("deployment_service.backends.provider_factory.VMBackend") as MockVM,
        ):
            MockVM.return_value = MagicMock()

            get_backend_for_service(
                service_name="ml-training-service",
                project_id=PROJECT,
                region=REGION,
            )

        mock_topo.assert_called_once_with("ml-training-service")
        MockVM.assert_called_once()


# ---------------------------------------------------------------------------
# list_available_backends
# ---------------------------------------------------------------------------


class TestListAvailableBackends:
    def test_all_providers_returned_when_no_filter(self) -> None:
        result = list_available_backends()
        assert "gcp" in result
        assert "aws" in result
        assert "cloud_run" in result["gcp"]
        assert "vm" in result["gcp"]
        assert "batch" in result["aws"]
        assert "ec2" in result["aws"]

    def test_filter_by_gcp(self) -> None:
        result = list_available_backends(provider="gcp")
        assert list(result.keys()) == ["gcp"]
        assert "cloud_run" in result["gcp"]

    def test_filter_by_aws(self) -> None:
        result = list_available_backends(provider="aws")
        assert list(result.keys()) == ["aws"]
        assert "batch" in result["aws"]

    def test_unknown_provider_returns_empty_list(self) -> None:
        result = list_available_backends(provider="azure")
        assert result == {"azure": []}

    def test_provider_filter_case_insensitive(self) -> None:
        result = list_available_backends(provider="GCP")
        assert "gcp" in result
