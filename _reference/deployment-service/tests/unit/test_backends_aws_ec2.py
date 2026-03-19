"""
Unit tests for deployment_service.backends.aws_ec2.AWSEC2Backend.

aws_ec2.py has a conditional botocore import and deferred boto3 via _ensure_boto3().
We patch _ensure_boto3 and inject mock clients.

Coverage targets:
- AWSEC2Backend.__init__: client and resource creation, optional params
- backend_type property
- _get_instance_type: all branching thresholds (t3.medium/large/xlarge/2xlarge,
  m5.4xlarge, m5.8xlarge), Gi/Mi string memory, numeric memory, default values
- _get_ami_id: SSM success path, fallback to hardcoded AMI (exception path)
- deploy_shard: success with full params, subnet/sg/profile/key optional params,
  ClientError → FAILED, metadata keys present
- get_status: running, terminated→UNKNOWN, stopped→FAILED, pending, shutting-down,
  not-found (empty reservations), ClientError InvalidInstanceID.NotFound→FAILED,
  generic ClientError→UNKNOWN, shard_id from tags, launch_time parsed
- _map_instance_state: all 6 known states + unknown fallback
- get_status_batch: empty, mixed instances across reservations, timestamps,
  ClientError per batch
- cancel_job: success, ClientError → False
- get_logs_url: URL format
- deploy_shards: concurrent thread pool
"""

from unittest.mock import MagicMock, patch

import pytest

from deployment_service.backends.base import JobInfo, JobStatus

try:
    from botocore.exceptions import ClientError as _ClientError
except ImportError:  # pragma: no cover
    _ClientError = Exception  # type: ignore[misc,assignment]

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ACCOUNT_ID = "111222333444"
REGION = "us-east-1"
IMAGE = "111222333444.dkr.ecr.us-east-1.amazonaws.com/my-service:latest"
INSTANCE_ID = "i-0abc1234def56789a"
AMI_ID = "ami-0a699202e5027c10d"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_client_error(code: str = "UnauthorizedOperation", msg: str = "test") -> _ClientError:
    return _ClientError(
        error_response={"Error": {"Code": code, "Message": msg}},
        operation_name="EC2",
    )


def _make_backend(
    subnet_id: str | None = None,
    security_group_id: str | None = None,
    instance_profile_arn: str | None = None,
    key_name: str | None = None,
) -> tuple["object", MagicMock, MagicMock, MagicMock]:
    """Return (backend, mock_ec2_client, mock_ec2_resource, mock_ssm_client)."""
    from deployment_service.backends.aws_ec2 import AWSEC2Backend

    mock_ec2_client = MagicMock()
    mock_ec2_resource = MagicMock()
    mock_ssm_client = MagicMock()
    mock_boto3 = MagicMock()

    def _client_factory(svc: str, region_name: str = "") -> MagicMock:
        if svc == "ec2":
            return mock_ec2_client
        if svc == "ssm":
            return mock_ssm_client
        return MagicMock()

    mock_boto3.client.side_effect = _client_factory
    mock_boto3.resource.return_value = mock_ec2_resource

    with patch("deployment_service.backends.aws_ec2._ensure_boto3", return_value=mock_boto3):
        backend = AWSEC2Backend(
            project_id=ACCOUNT_ID,
            region=REGION,
            subnet_id=subnet_id,
            security_group_id=security_group_id,
            instance_profile_arn=instance_profile_arn,
            key_name=key_name,
        )

    return backend, mock_ec2_client, mock_ec2_resource, mock_ssm_client


# ---------------------------------------------------------------------------
# Initialisation
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestAWSEC2BackendInit:
    def test_backend_type(self) -> None:
        backend, *_ = _make_backend()
        assert backend.backend_type == "aws_ec2"  # type: ignore[attr-defined]

    def test_region_stored(self) -> None:
        backend, *_ = _make_backend()
        assert backend.region == REGION  # type: ignore[attr-defined]

    def test_optional_params_none_by_default(self) -> None:
        backend, *_ = _make_backend()
        assert backend._subnet_id is None  # type: ignore[attr-defined]
        assert backend._security_group_id is None  # type: ignore[attr-defined]
        assert backend._instance_profile_arn is None  # type: ignore[attr-defined]
        assert backend._key_name is None  # type: ignore[attr-defined]

    def test_optional_params_stored(self) -> None:
        backend, *_ = _make_backend(
            subnet_id="subnet-abc",
            security_group_id="sg-xyz",
            instance_profile_arn="arn:aws:iam::1:instance-profile/my-profile",
            key_name="my-key",
        )
        assert backend._subnet_id == "subnet-abc"  # type: ignore[attr-defined]
        assert backend._security_group_id == "sg-xyz"  # type: ignore[attr-defined]
        assert backend._instance_profile_arn == "arn:aws:iam::1:instance-profile/my-profile"  # type: ignore[attr-defined]
        assert backend._key_name == "my-key"  # type: ignore[attr-defined]


# ---------------------------------------------------------------------------
# _get_instance_type
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestGetInstanceType:
    def _call(self, vcpu: object, memory: object) -> str:
        backend, *_ = _make_backend()
        return backend._get_instance_type({"vcpu": vcpu, "memory": memory})  # type: ignore[attr-defined]

    def test_small_maps_to_t3_medium(self) -> None:
        assert self._call(1, 2) == "t3.medium"

    def test_boundary_2vcpu_4gb_maps_to_t3_medium(self) -> None:
        assert self._call(2, 4) == "t3.medium"

    def test_2vcpu_8gb_maps_to_t3_large(self) -> None:
        assert self._call(2, 8) == "t3.large"

    def test_4vcpu_16gb_maps_to_t3_xlarge(self) -> None:
        assert self._call(4, 16) == "t3.xlarge"

    def test_8vcpu_32gb_maps_to_t3_2xlarge(self) -> None:
        assert self._call(8, 32) == "t3.2xlarge"

    def test_16vcpu_64gb_maps_to_m5_4xlarge(self) -> None:
        assert self._call(16, 64) == "m5.4xlarge"

    def test_large_maps_to_m5_8xlarge(self) -> None:
        assert self._call(32, 128) == "m5.8xlarge"

    def test_memory_gi_string_parsed(self) -> None:
        backend, *_ = _make_backend()
        result = backend._get_instance_type({"vcpu": 2, "memory": "4Gi"})  # type: ignore[attr-defined]
        assert result == "t3.medium"

    def test_memory_mi_string_parsed(self) -> None:
        backend, *_ = _make_backend()
        result = backend._get_instance_type({"vcpu": 2, "memory": "8192Mi"})  # type: ignore[attr-defined]
        assert result == "t3.large"

    def test_memory_plain_string_parsed(self) -> None:
        backend, *_ = _make_backend()
        result = backend._get_instance_type({"vcpu": 2, "memory": "4.0"})  # type: ignore[attr-defined]
        assert result == "t3.medium"

    def test_default_when_no_vcpu_or_memory(self) -> None:
        backend, *_ = _make_backend()
        result = backend._get_instance_type({})  # type: ignore[attr-defined]
        # vcpu defaults to 2, memory defaults to 4 → t3.medium
        assert result == "t3.medium"


# ---------------------------------------------------------------------------
# _get_ami_id
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestGetAmiId:
    def test_ssm_success_returns_parameter_value(self) -> None:
        backend, _, _, mock_ssm = _make_backend()
        mock_ssm.get_parameter.return_value = {"Parameter": {"Value": "ami-new-12345"}}

        ami = backend._get_ami_id()  # type: ignore[attr-defined]
        assert ami == "ami-new-12345"

    def test_ssm_failure_falls_back_to_hardcoded(self) -> None:
        backend, _, _, mock_ssm = _make_backend()
        mock_ssm.get_parameter.side_effect = OSError("SSM unavailable")

        ami = backend._get_ami_id()  # type: ignore[attr-defined]
        # us-east-1 is in the hardcoded map
        assert ami == "ami-0a699202e5027c10d"

    def test_unknown_region_falls_back_to_us_east_1(self) -> None:
        from deployment_service.backends.aws_ec2 import AWSEC2Backend

        mock_boto3 = MagicMock()
        mock_boto3.client.return_value = MagicMock()
        mock_boto3.resource.return_value = MagicMock()

        with patch("deployment_service.backends.aws_ec2._ensure_boto3", return_value=mock_boto3):
            backend_ap = AWSEC2Backend(project_id=ACCOUNT_ID, region="ap-southeast-99")

        # Make SSM fail so we fall back to the hardcoded map
        mock_ssm = MagicMock()
        mock_ssm.get_parameter.side_effect = OSError("SSM unavailable")
        backend_ap._ssm_client = mock_ssm  # type: ignore[attr-defined]

        ami = backend_ap._get_ami_id()  # type: ignore[attr-defined]
        # Unknown region falls back to us-east-1 AMI (the default in ECS_OPTIMIZED_AMI)
        assert ami == "ami-0a699202e5027c10d"


# ---------------------------------------------------------------------------
# deploy_shard — success
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestEC2DeployShardSuccess:
    def test_returns_pending_with_instance_id(self) -> None:
        backend, mock_client, _, mock_ssm = _make_backend()
        mock_ssm.get_parameter.return_value = {"Parameter": {"Value": AMI_ID}}
        mock_client.run_instances.return_value = {"Instances": [{"InstanceId": INSTANCE_ID}]}

        result = backend.deploy_shard(  # type: ignore[attr-defined]
            shard_id="shard-1",
            docker_image=IMAGE,
            args=["--mode", "infer"],
            environment_variables={"MODEL": "v3"},
            compute_config={"vcpu": 2, "memory": 4},
            labels={"env": "prod"},
        )

        assert isinstance(result, JobInfo)
        assert result.status == JobStatus.PENDING
        assert result.job_id == INSTANCE_ID
        assert result.shard_id == "shard-1"
        assert result.start_time is not None

    def test_metadata_contains_instance_type_and_image(self) -> None:
        backend, mock_client, _, mock_ssm = _make_backend()
        mock_ssm.get_parameter.return_value = {"Parameter": {"Value": AMI_ID}}
        mock_client.run_instances.return_value = {"Instances": [{"InstanceId": INSTANCE_ID}]}

        result = backend.deploy_shard(  # type: ignore[attr-defined]
            "s1", IMAGE, [], {}, {"vcpu": 2, "memory": 4}, {}
        )

        assert "instance_type" in result.metadata
        assert result.metadata["docker_image"] == IMAGE

    def test_subnet_id_included_when_set(self) -> None:
        backend, mock_client, _, mock_ssm = _make_backend(subnet_id="subnet-test-123")
        mock_ssm.get_parameter.return_value = {"Parameter": {"Value": AMI_ID}}
        mock_client.run_instances.return_value = {"Instances": [{"InstanceId": INSTANCE_ID}]}

        backend.deploy_shard("s1", IMAGE, [], {}, {}, {})  # type: ignore[attr-defined]

        call_kwargs = mock_client.run_instances.call_args.kwargs
        assert call_kwargs["SubnetId"] == "subnet-test-123"

    def test_security_group_included_when_set(self) -> None:
        backend, mock_client, _, mock_ssm = _make_backend(security_group_id="sg-test-456")
        mock_ssm.get_parameter.return_value = {"Parameter": {"Value": AMI_ID}}
        mock_client.run_instances.return_value = {"Instances": [{"InstanceId": INSTANCE_ID}]}

        backend.deploy_shard("s1", IMAGE, [], {}, {}, {})  # type: ignore[attr-defined]

        call_kwargs = mock_client.run_instances.call_args.kwargs
        assert "sg-test-456" in call_kwargs["SecurityGroupIds"]

    def test_instance_profile_included_when_set(self) -> None:
        profile_arn = "arn:aws:iam::1:instance-profile/my-profile"
        backend, mock_client, _, mock_ssm = _make_backend(instance_profile_arn=profile_arn)
        mock_ssm.get_parameter.return_value = {"Parameter": {"Value": AMI_ID}}
        mock_client.run_instances.return_value = {"Instances": [{"InstanceId": INSTANCE_ID}]}

        backend.deploy_shard("s1", IMAGE, [], {}, {}, {})  # type: ignore[attr-defined]

        call_kwargs = mock_client.run_instances.call_args.kwargs
        assert call_kwargs["IamInstanceProfile"]["Arn"] == profile_arn

    def test_key_name_included_when_set(self) -> None:
        backend, mock_client, _, mock_ssm = _make_backend(key_name="my-key-pair")
        mock_ssm.get_parameter.return_value = {"Parameter": {"Value": AMI_ID}}
        mock_client.run_instances.return_value = {"Instances": [{"InstanceId": INSTANCE_ID}]}

        backend.deploy_shard("s1", IMAGE, [], {}, {}, {})  # type: ignore[attr-defined]

        call_kwargs = mock_client.run_instances.call_args.kwargs
        assert call_kwargs["KeyName"] == "my-key-pair"

    def test_no_subnet_when_not_set(self) -> None:
        backend, mock_client, _, mock_ssm = _make_backend()
        mock_ssm.get_parameter.return_value = {"Parameter": {"Value": AMI_ID}}
        mock_client.run_instances.return_value = {"Instances": [{"InstanceId": INSTANCE_ID}]}

        backend.deploy_shard("s1", IMAGE, [], {}, {}, {})  # type: ignore[attr-defined]

        call_kwargs = mock_client.run_instances.call_args.kwargs
        assert "SubnetId" not in call_kwargs

    def test_user_data_is_base64_encoded(self) -> None:
        import base64

        backend, mock_client, _, mock_ssm = _make_backend()
        mock_ssm.get_parameter.return_value = {"Parameter": {"Value": AMI_ID}}
        mock_client.run_instances.return_value = {"Instances": [{"InstanceId": INSTANCE_ID}]}

        backend.deploy_shard("s1", IMAGE, [], {"K": "V"}, {}, {})  # type: ignore[attr-defined]

        call_kwargs = mock_client.run_instances.call_args.kwargs
        user_data_b64 = call_kwargs["UserData"]
        # Should be valid base64
        decoded = base64.b64decode(user_data_b64).decode()
        assert "#!/bin/bash" in decoded


# ---------------------------------------------------------------------------
# deploy_shard — error
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestEC2DeployShardError:
    def test_client_error_returns_failed(self) -> None:
        backend, mock_client, _, mock_ssm = _make_backend()
        mock_ssm.get_parameter.return_value = {"Parameter": {"Value": AMI_ID}}
        mock_client.run_instances.side_effect = _make_client_error("InsufficientInstanceCapacity")

        result = backend.deploy_shard(  # type: ignore[attr-defined]
            "err-shard", IMAGE, [], {}, {}, {}
        )

        assert result.status == JobStatus.FAILED
        assert result.job_id == "failed-err-shard"
        assert result.error_message is not None


# ---------------------------------------------------------------------------
# get_status
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestEC2GetStatus:
    def _setup_instance(
        self, mock_client: MagicMock, state: str, tags: list[dict[str, str]] | None = None
    ) -> None:
        instance: dict[str, object] = {
            "InstanceId": INSTANCE_ID,
            "State": {"Name": state},
            "LaunchTime": None,
        }
        if tags:
            instance["Tags"] = tags
        mock_client.describe_instances.return_value = {"Reservations": [{"Instances": [instance]}]}

    def test_running_state(self) -> None:
        backend, mock_client, *_ = _make_backend()
        self._setup_instance(mock_client, "running")
        result = backend.get_status(INSTANCE_ID)  # type: ignore[attr-defined]
        assert result.status == JobStatus.RUNNING

    def test_pending_state(self) -> None:
        backend, mock_client, *_ = _make_backend()
        self._setup_instance(mock_client, "pending")
        result = backend.get_status(INSTANCE_ID)  # type: ignore[attr-defined]
        assert result.status == JobStatus.PENDING

    def test_shutting_down_maps_to_running(self) -> None:
        backend, mock_client, *_ = _make_backend()
        self._setup_instance(mock_client, "shutting-down")
        result = backend.get_status(INSTANCE_ID)  # type: ignore[attr-defined]
        assert result.status == JobStatus.RUNNING

    def test_terminated_maps_to_unknown(self) -> None:
        backend, mock_client, *_ = _make_backend()
        self._setup_instance(mock_client, "terminated")
        result = backend.get_status(INSTANCE_ID)  # type: ignore[attr-defined]
        assert result.status == JobStatus.UNKNOWN

    def test_stopped_maps_to_failed(self) -> None:
        backend, mock_client, *_ = _make_backend()
        self._setup_instance(mock_client, "stopped")
        result = backend.get_status(INSTANCE_ID)  # type: ignore[attr-defined]
        assert result.status == JobStatus.FAILED

    def test_shard_id_extracted_from_tags(self) -> None:
        backend, mock_client, *_ = _make_backend()
        self._setup_instance(
            mock_client, "running", tags=[{"Key": "shard_id", "Value": "my-shard-42"}]
        )
        result = backend.get_status(INSTANCE_ID)  # type: ignore[attr-defined]
        assert result.shard_id == "my-shard-42"

    def test_shard_id_defaults_to_unknown_when_no_tag(self) -> None:
        backend, mock_client, *_ = _make_backend()
        self._setup_instance(mock_client, "running")
        result = backend.get_status(INSTANCE_ID)  # type: ignore[attr-defined]
        assert result.shard_id == "unknown"

    def test_not_found_returns_unknown(self) -> None:
        backend, mock_client, *_ = _make_backend()
        mock_client.describe_instances.return_value = {"Reservations": []}
        result = backend.get_status(INSTANCE_ID)  # type: ignore[attr-defined]
        assert result.status == JobStatus.UNKNOWN

    def test_invalid_instance_id_error_returns_failed(self) -> None:
        backend, mock_client, *_ = _make_backend()
        mock_client.describe_instances.side_effect = _make_client_error(
            "InvalidInstanceID.NotFound", "Instance not found"
        )
        result = backend.get_status(INSTANCE_ID)  # type: ignore[attr-defined]
        assert result.status == JobStatus.FAILED

    def test_generic_client_error_returns_unknown(self) -> None:
        backend, mock_client, *_ = _make_backend()
        mock_client.describe_instances.side_effect = _make_client_error("InternalError")
        result = backend.get_status(INSTANCE_ID)  # type: ignore[attr-defined]
        assert result.status == JobStatus.UNKNOWN

    def test_logs_url_present(self) -> None:
        backend, mock_client, *_ = _make_backend()
        self._setup_instance(mock_client, "running")
        result = backend.get_status(INSTANCE_ID)  # type: ignore[attr-defined]
        assert result.logs_url is not None
        assert INSTANCE_ID in result.logs_url


# ---------------------------------------------------------------------------
# _map_instance_state
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestMapInstanceState:
    @pytest.mark.parametrize(
        ("state", "expected"),
        [
            ("pending", JobStatus.PENDING),
            ("running", JobStatus.RUNNING),
            ("shutting-down", JobStatus.RUNNING),
            ("terminated", JobStatus.UNKNOWN),
            ("stopping", JobStatus.RUNNING),
            ("stopped", JobStatus.FAILED),
            ("some-unknown-state", JobStatus.UNKNOWN),
        ],
    )
    def test_state_mapping(self, state: str, expected: JobStatus) -> None:
        backend, *_ = _make_backend()
        assert backend._map_instance_state(state) == expected  # type: ignore[attr-defined]


# ---------------------------------------------------------------------------
# get_status_batch
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestEC2GetStatusBatch:
    def test_empty_returns_empty_dict(self) -> None:
        backend, mock_client, *_ = _make_backend()
        assert backend.get_status_batch([]) == {}  # type: ignore[attr-defined]
        mock_client.describe_instances.assert_not_called()

    def test_multiple_instances_across_reservations(self) -> None:
        backend, mock_client, *_ = _make_backend()
        mock_client.describe_instances.return_value = {
            "Reservations": [
                {
                    "Instances": [
                        {
                            "InstanceId": "i-111",
                            "State": {"Name": "running"},
                            "LaunchTime": None,
                            "Tags": [{"Key": "shard_id", "Value": "s1"}],
                        }
                    ]
                },
                {
                    "Instances": [
                        {
                            "InstanceId": "i-222",
                            "State": {"Name": "terminated"},
                            "LaunchTime": None,
                        }
                    ]
                },
            ]
        }

        result = backend.get_status_batch(["i-111", "i-222"])  # type: ignore[attr-defined]
        assert result["i-111"].status == JobStatus.RUNNING
        assert result["i-111"].shard_id == "s1"
        assert result["i-222"].status == JobStatus.UNKNOWN

    def test_chunking_over_100_instances(self) -> None:
        backend, mock_client, *_ = _make_backend()
        mock_client.describe_instances.return_value = {"Reservations": []}

        backend.get_status_batch([f"i-{i:016x}" for i in range(150)])  # type: ignore[attr-defined]
        assert mock_client.describe_instances.call_count == 2

    def test_client_error_returns_unknown_for_batch(self) -> None:
        backend, mock_client, *_ = _make_backend()
        mock_client.describe_instances.side_effect = _make_client_error()

        result = backend.get_status_batch(["i-001", "i-002"])  # type: ignore[attr-defined]
        assert result["i-001"].status == JobStatus.UNKNOWN
        assert result["i-002"].status == JobStatus.UNKNOWN


# ---------------------------------------------------------------------------
# cancel_job
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestEC2CancelJob:
    def test_terminate_success(self) -> None:
        backend, mock_client, *_ = _make_backend()
        mock_client.terminate_instances.return_value = {}

        assert backend.cancel_job(INSTANCE_ID) is True  # type: ignore[attr-defined]
        mock_client.terminate_instances.assert_called_once_with(InstanceIds=[INSTANCE_ID])

    def test_client_error_returns_false(self) -> None:
        backend, mock_client, *_ = _make_backend()
        mock_client.terminate_instances.side_effect = _make_client_error()

        assert backend.cancel_job(INSTANCE_ID) is False  # type: ignore[attr-defined]


# ---------------------------------------------------------------------------
# get_logs_url
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestEC2GetLogsUrl:
    def test_url_contains_region_and_instance_id(self) -> None:
        backend, *_ = _make_backend()
        url = backend.get_logs_url(INSTANCE_ID)  # type: ignore[attr-defined]
        assert REGION in url
        assert INSTANCE_ID in url
        assert "ec2" in url


# ---------------------------------------------------------------------------
# deploy_shards
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestEC2DeployShards:
    def test_concurrent_deploy_returns_all_results(self) -> None:
        backend, mock_client, _, mock_ssm = _make_backend()
        mock_ssm.get_parameter.return_value = {"Parameter": {"Value": AMI_ID}}

        call_counter = {"n": 0}

        def _run_instances(**kwargs: object) -> dict[str, object]:
            n = call_counter["n"]
            call_counter["n"] += 1
            return {"Instances": [{"InstanceId": f"i-{n:016x}"}]}

        mock_client.run_instances.side_effect = _run_instances

        shards = [{"shard_id": f"s{i}"} for i in range(6)]
        results = backend.deploy_shards(  # type: ignore[attr-defined]
            shards=shards,
            docker_image=IMAGE,
            environment_variables={},
            compute_config={"vcpu": 2, "memory": 4},
            labels={},
            parallelism=3,
        )

        assert len(results) == 6

    def test_empty_shards_returns_empty(self) -> None:
        backend, *_ = _make_backend()
        results = backend.deploy_shards(  # type: ignore[attr-defined]
            shards=[],
            docker_image=IMAGE,
            environment_variables={},
            compute_config={},
            labels={},
        )
        assert results == []
