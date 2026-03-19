"""
Unit tests for deployment_service.backends.base.

Covers:
- JobStatus enum values
- JobInfo dataclass: duration_seconds, to_dict (all edge cases)
- ComputeBackend.deploy_shards: sequential delegation, shard_id extraction, args fallback
- ComputeBackend.get_status_with_context: passes through to get_status
- Abstract interface: subclass must implement all abstract methods
"""

from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest

from deployment_service.backends.base import ComputeBackend, JobInfo, JobStatus

# ---------------------------------------------------------------------------
# Concrete subclass for testing the non-abstract parts of ComputeBackend
# ---------------------------------------------------------------------------


class _ConcreteBackend(ComputeBackend):
    """Minimal concrete implementation for testing shared base-class logic."""

    def __init__(self) -> None:
        super().__init__(
            project_id="test-proj",
            region="us-central1",
            service_account_email="svc@test.iam.gserviceaccount.com",
        )
        self.deploy_calls: list[dict[str, object]] = []

    @property
    def backend_type(self) -> str:
        return "concrete"

    def deploy_shard(
        self,
        shard_id: str,
        docker_image: str,
        args: list[str],
        environment_variables: dict[str, str],
        compute_config: dict[str, object],
        labels: dict[str, str],
    ) -> JobInfo:
        self.deploy_calls.append(
            {
                "shard_id": shard_id,
                "docker_image": docker_image,
                "args": args,
                "environment_variables": environment_variables,
                "compute_config": compute_config,
                "labels": labels,
            }
        )
        return JobInfo(
            job_id=f"job-{shard_id}",
            shard_id=shard_id,
            status=JobStatus.RUNNING,
        )

    def get_status(self, job_id: str) -> JobInfo:
        return JobInfo(job_id=job_id, shard_id="s", status=JobStatus.RUNNING)

    def cancel_job(self, job_id: str) -> bool:
        return True

    def get_logs_url(self, job_id: str) -> str:
        return f"https://logs.example.com/{job_id}"


# ---------------------------------------------------------------------------
# JobStatus
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestJobStatus:
    def test_all_values_present(self) -> None:
        values = {s.value for s in JobStatus}
        assert values == {"pending", "running", "succeeded", "failed", "cancelled", "unknown"}

    def test_enum_access_by_value(self) -> None:
        assert JobStatus("pending") is JobStatus.PENDING
        assert JobStatus("running") is JobStatus.RUNNING
        assert JobStatus("succeeded") is JobStatus.SUCCEEDED
        assert JobStatus("failed") is JobStatus.FAILED
        assert JobStatus("cancelled") is JobStatus.CANCELLED
        assert JobStatus("unknown") is JobStatus.UNKNOWN


# ---------------------------------------------------------------------------
# JobInfo
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestJobInfo:
    def test_minimum_required_fields(self) -> None:
        info = JobInfo(job_id="j1", shard_id="s1", status=JobStatus.PENDING)
        assert info.job_id == "j1"
        assert info.shard_id == "s1"
        assert info.status == JobStatus.PENDING
        assert info.start_time is None
        assert info.end_time is None
        assert info.error_message is None
        assert info.logs_url is None
        assert info.metadata == {}

    def test_duration_seconds_computed_correctly(self) -> None:
        start = datetime(2026, 3, 1, 10, 0, 0, tzinfo=UTC)
        end = datetime(2026, 3, 1, 10, 2, 30, tzinfo=UTC)  # 150 seconds later
        info = JobInfo(
            job_id="j",
            shard_id="s",
            status=JobStatus.SUCCEEDED,
            start_time=start,
            end_time=end,
        )
        assert info.duration_seconds == 150.0

    def test_duration_seconds_none_when_no_start(self) -> None:
        info = JobInfo(
            job_id="j",
            shard_id="s",
            status=JobStatus.RUNNING,
            end_time=datetime.now(UTC),
        )
        assert info.duration_seconds is None

    def test_duration_seconds_none_when_no_end(self) -> None:
        info = JobInfo(
            job_id="j",
            shard_id="s",
            status=JobStatus.RUNNING,
            start_time=datetime.now(UTC),
        )
        assert info.duration_seconds is None

    def test_duration_seconds_none_when_neither(self) -> None:
        info = JobInfo(job_id="j", shard_id="s", status=JobStatus.PENDING)
        assert info.duration_seconds is None

    def test_to_dict_all_fields_populated(self) -> None:
        start = datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC)
        end = datetime(2026, 1, 1, 0, 1, 0, tzinfo=UTC)
        info = JobInfo(
            job_id="jid",
            shard_id="sid",
            status=JobStatus.FAILED,
            start_time=start,
            end_time=end,
            error_message="something went wrong",
            logs_url="https://logs.example.com",
            metadata={"key": "val"},
        )
        d = info.to_dict()
        assert d["job_id"] == "jid"
        assert d["shard_id"] == "sid"
        assert d["status"] == "failed"
        assert d["start_time"] == start.isoformat()
        assert d["end_time"] == end.isoformat()
        assert d["duration_seconds"] == 60.0
        assert d["error_message"] == "something went wrong"
        assert d["logs_url"] == "https://logs.example.com"
        assert d["metadata"] == {"key": "val"}

    def test_to_dict_none_times(self) -> None:
        info = JobInfo(job_id="j", shard_id="s", status=JobStatus.UNKNOWN)
        d = info.to_dict()
        assert d["start_time"] is None
        assert d["end_time"] is None
        assert d["duration_seconds"] is None

    def test_to_dict_status_values_for_all_statuses(self) -> None:
        for status in JobStatus:
            info = JobInfo(job_id="j", shard_id="s", status=status)
            assert info.to_dict()["status"] == status.value

    def test_metadata_default_factory_not_shared(self) -> None:
        """Each JobInfo gets its own independent metadata dict."""
        info1 = JobInfo(job_id="j1", shard_id="s1", status=JobStatus.PENDING)
        info2 = JobInfo(job_id="j2", shard_id="s2", status=JobStatus.PENDING)
        info1.metadata["key"] = "value"
        assert "key" not in info2.metadata


# ---------------------------------------------------------------------------
# ComputeBackend.deploy_shards (base sequential implementation)
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestDeployShards:
    def _make_shard(self, shard_id: str, args: list[str] | None = None) -> dict[str, object]:
        result: dict[str, object] = {"shard_id": shard_id}
        if args is not None:
            result["args"] = args
        return result

    def test_deploys_all_shards_sequentially(self) -> None:
        backend = _ConcreteBackend()
        shards = [
            self._make_shard("shard-0", ["--mode", "train"]),
            self._make_shard("shard-1", ["--mode", "eval"]),
        ]

        results = backend.deploy_shards(
            shards=shards,
            docker_image="gcr.io/proj/img:v1",
            environment_variables={"ENV": "test"},
            compute_config={"memory": "2Gi"},
            labels={"env": "prod"},
        )

        assert len(results) == 2
        assert results[0].shard_id == "shard-0"
        assert results[1].shard_id == "shard-1"
        assert len(backend.deploy_calls) == 2

    def test_returns_list_of_job_infos(self) -> None:
        backend = _ConcreteBackend()
        shards = [self._make_shard("s0")]
        results = backend.deploy_shards(
            shards=shards,
            docker_image="img",
            environment_variables={},
            compute_config={},
            labels={},
        )
        assert all(isinstance(r, JobInfo) for r in results)

    def test_args_fallback_to_empty_list_when_absent(self) -> None:
        """Shards without 'args' key get empty args list."""
        backend = _ConcreteBackend()
        shards = [{"shard_id": "s0"}]
        backend.deploy_shards(
            shards=shards,
            docker_image="img",
            environment_variables={},
            compute_config={},
            labels={},
        )
        assert backend.deploy_calls[0]["args"] == []

    def test_args_fallback_when_args_is_none(self) -> None:
        """Shards with args=None get empty args list."""
        backend = _ConcreteBackend()
        shards = [{"shard_id": "s0", "args": None}]
        backend.deploy_shards(
            shards=shards,
            docker_image="img",
            environment_variables={},
            compute_config={},
            labels={},
        )
        assert backend.deploy_calls[0]["args"] == []

    def test_shard_id_fallback_to_index_when_absent(self) -> None:
        """Shards without 'shard_id' key get auto-generated IDs like 'shard-N'."""
        backend = _ConcreteBackend()
        # Note: the base class uses len(jobs) at call time, so first shard is shard-0
        shards = [{"docker_image": "img"}, {"docker_image": "img"}]
        results = backend.deploy_shards(
            shards=shards,
            docker_image="img",
            environment_variables={},
            compute_config={},
            labels={},
        )
        # shard_ids should have been auto-assigned (shard-0, shard-1)
        assert results[0].shard_id.startswith("shard-")
        assert results[1].shard_id.startswith("shard-")

    def test_env_vars_labels_config_passed_through(self) -> None:
        backend = _ConcreteBackend()
        env = {"KEY": "val"}
        config: dict[str, object] = {"memory": "4Gi", "cpu": 2}
        labels = {"team": "ml"}
        shards = [self._make_shard("s0", ["arg"])]

        backend.deploy_shards(
            shards=shards,
            docker_image="myimage",
            environment_variables=env,
            compute_config=config,
            labels=labels,
        )
        call = backend.deploy_calls[0]
        assert call["environment_variables"] == env
        assert call["compute_config"] == config
        assert call["labels"] == labels
        assert call["docker_image"] == "myimage"

    def test_empty_shards_list_returns_empty(self) -> None:
        backend = _ConcreteBackend()
        results = backend.deploy_shards(
            shards=[],
            docker_image="img",
            environment_variables={},
            compute_config={},
            labels={},
        )
        assert results == []
        assert backend.deploy_calls == []

    def test_parallelism_param_accepted_by_base(self) -> None:
        """Base class accepts parallelism= but ignores it (sequential)."""
        backend = _ConcreteBackend()
        shards = [self._make_shard("s0"), self._make_shard("s1"), self._make_shard("s2")]
        results = backend.deploy_shards(
            shards=shards,
            docker_image="img",
            environment_variables={},
            compute_config={},
            labels={},
            parallelism=5,
        )
        assert len(results) == 3


# ---------------------------------------------------------------------------
# ComputeBackend.get_status_with_context
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestGetStatusWithContext:
    def test_delegates_to_get_status_by_default(self) -> None:
        backend = _ConcreteBackend()
        result = backend.get_status_with_context(
            "job-abc",
            deployment_id="dep-1",
            shard_id="shard-0",
        )
        assert result.job_id == "job-abc"
        assert result.status == JobStatus.RUNNING

    def test_deployment_and_shard_context_ignored_in_base(self) -> None:
        """The base implementation ignores context args (concrete backends may override)."""
        backend = _ConcreteBackend()
        r1 = backend.get_status_with_context("job-x")
        r2 = backend.get_status_with_context("job-x", deployment_id="d", shard_id="s")
        assert r1.status == r2.status


# ---------------------------------------------------------------------------
# Abstract method enforcement
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestAbstractMethodEnforcement:
    def test_cannot_instantiate_without_all_abstract_methods(self) -> None:
        """Subclass missing abstract methods cannot be instantiated."""

        class _Incomplete(ComputeBackend):
            @property
            def backend_type(self) -> str:
                return "incomplete"

            def deploy_shard(self, *args, **kwargs) -> JobInfo:
                return MagicMock()

            def get_status(self, job_id: str) -> JobInfo:
                return MagicMock()

            # cancel_job and get_logs_url intentionally omitted

        with pytest.raises(TypeError):
            _Incomplete(  # type: ignore[abstract]
                project_id="p",
                region="r",
                service_account_email="sa",
            )

    def test_concrete_backend_can_be_instantiated(self) -> None:
        backend = _ConcreteBackend()
        assert backend.project_id == "test-proj"
        assert backend.region == "us-central1"
        assert backend.backend_type == "concrete"
