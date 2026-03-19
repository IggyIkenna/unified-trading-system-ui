"""
Unit tests for quota_requirements module.

Tests cover VmQuotaShape, machine type parsing, C2 snapping, quota metric
mapping, and resource multiplication.
"""

from deployment_api.utils.quota_requirements import (
    VALID_C2_VCPUS,
    VmQuotaShape,
    cpu_quota_metric_for_machine,
    multiply_resources,
    parse_machine_type_vcpus,
    recommend_max_concurrent_from_headroom,
    snap_c2_vcpus_to_valid,
    vm_quota_shape_from_compute_config,
)


class TestVmQuotaShape:
    """Tests for VmQuotaShape dataclass."""

    def test_per_shard_returns_correct_metrics(self):
        shape = VmQuotaShape(cpu_metric="C2_CPUS", vcpus=16, external_ipv4=1, ssd_gb=200)
        per_shard = shape.per_shard()
        assert per_shard["C2_CPUS"] == 16.0
        assert per_shard["IN_USE_ADDRESSES"] == 1.0
        assert per_shard["SSD_TOTAL_GB"] == 200.0

    def test_frozen_dataclass_is_immutable(self):
        import pytest

        shape = VmQuotaShape(cpu_metric="CPUS", vcpus=4, external_ipv4=1, ssd_gb=100)
        with pytest.raises(AttributeError):
            shape.vcpus = 8  # type: ignore[misc]


class TestSnapC2VcpusToValid:
    """Tests for snap_c2_vcpus_to_valid."""

    def test_valid_c2_sizes_unchanged(self):
        for v in VALID_C2_VCPUS:
            assert snap_c2_vcpus_to_valid(v) == v

    def test_zero_or_negative_returns_4(self):
        assert snap_c2_vcpus_to_valid(0) == 4
        assert snap_c2_vcpus_to_valid(-5) == 4

    def test_over_60_returns_60(self):
        assert snap_c2_vcpus_to_valid(100) == 60
        assert snap_c2_vcpus_to_valid(61) == 60

    def test_rounds_to_nearest(self):
        # The function picks by abs(x - vcpus), then x (smallest on tie)
        # 6: |6-4|=2, |6-8|=2 — tie, picks 4 (smaller)
        assert snap_c2_vcpus_to_valid(6) == 4
        # 7: |7-4|=3, |7-8|=1 — picks 8
        assert snap_c2_vcpus_to_valid(7) == 8
        # 5: |5-4|=1, |5-8|=3 — picks 4
        assert snap_c2_vcpus_to_valid(5) == 4

    def test_returns_valid_value_always(self):
        for i in range(1, 70):
            result = snap_c2_vcpus_to_valid(i)
            assert result in VALID_C2_VCPUS


class TestParseMachineTypeVcpus:
    """Tests for parse_machine_type_vcpus."""

    def test_c2_standard_16(self):
        assert parse_machine_type_vcpus("c2-standard-16") == 16

    def test_n2_standard_32(self):
        assert parse_machine_type_vcpus("n2-standard-32") == 32

    def test_c2d_highcpu_56(self):
        assert parse_machine_type_vcpus("c2d-highcpu-56") == 56

    def test_empty_string_returns_none(self):
        assert parse_machine_type_vcpus("") is None

    def test_no_number_suffix_returns_none(self):
        assert parse_machine_type_vcpus("c2-standard") is None

    def test_e2_micro(self):
        assert parse_machine_type_vcpus("e2-micro-2") == 2


class TestCpuQuotaMetricForMachine:
    """Tests for cpu_quota_metric_for_machine."""

    def test_c2_machine(self):
        assert cpu_quota_metric_for_machine("c2-standard-16") == "C2_CPUS"

    def test_c2d_machine(self):
        assert cpu_quota_metric_for_machine("c2d-highcpu-56") == "C2D_CPUS"

    def test_c3_machine(self):
        assert cpu_quota_metric_for_machine("c3-standard-8") == "C3_CPUS"

    def test_n2_machine(self):
        assert cpu_quota_metric_for_machine("n2-standard-32") == "N2_CPUS"

    def test_e2_machine(self):
        assert cpu_quota_metric_for_machine("e2-standard-4") == "E2_CPUS"

    def test_unknown_family(self):
        assert cpu_quota_metric_for_machine("custom-machine-16") == "CPUS"

    def test_empty_string(self):
        assert cpu_quota_metric_for_machine("") == "CPUS"

    def test_none_like(self):
        assert cpu_quota_metric_for_machine(None) == "CPUS"  # type: ignore[arg-type]


class TestVmQuotaShapeFromComputeConfig:
    """Tests for vm_quota_shape_from_compute_config."""

    def test_c2_machine_snaps_vcpus(self):
        config = {"machine_type": "c2-standard-8", "disk_size_gb": 200}
        shape = vm_quota_shape_from_compute_config(config)
        assert shape.cpu_metric == "C2_CPUS"
        assert shape.vcpus == 8  # 8 is already valid
        assert shape.ssd_gb == 200
        assert shape.external_ipv4 == 1

    def test_n2_machine(self):
        config = {"machine_type": "n2-standard-32", "disk_size_gb": 100}
        shape = vm_quota_shape_from_compute_config(config)
        assert shape.cpu_metric == "N2_CPUS"
        assert shape.vcpus == 32

    def test_missing_disk_defaults_to_zero(self):
        config = {"machine_type": "c2-standard-4"}
        shape = vm_quota_shape_from_compute_config(config)
        assert shape.ssd_gb == 0

    def test_float_disk_converts_to_int(self):
        config = {"machine_type": "n2-standard-8", "disk_size_gb": 200.5}
        shape = vm_quota_shape_from_compute_config(config)
        assert shape.ssd_gb == 200

    def test_c2_invalid_vcpus_snapped(self):
        config = {"machine_type": "c2-standard-7", "disk_size_gb": 100}
        shape = vm_quota_shape_from_compute_config(config)
        assert shape.vcpus in VALID_C2_VCPUS


class TestMultiplyResources:
    """Tests for multiply_resources."""

    def test_basic_multiplication(self):
        resources = {"C2_CPUS": 16.0, "SSD_TOTAL_GB": 200.0}
        result = multiply_resources(resources, factor=3)
        assert result["C2_CPUS"] == 48.0
        assert result["SSD_TOTAL_GB"] == 600.0

    def test_factor_zero(self):
        result = multiply_resources({"CPUS": 8.0}, factor=0)
        assert result["CPUS"] == 0.0

    def test_empty_resources(self):
        result = multiply_resources({}, factor=5)
        assert result == {}

    def test_none_resources(self):
        result = multiply_resources(None, factor=3)  # type: ignore[arg-type]
        assert result == {}


class TestRecommendMaxConcurrentFromHeadroom:
    """Tests for recommend_max_concurrent_from_headroom."""

    def test_basic_recommendation(self):
        result = recommend_max_concurrent_from_headroom(
            live_remaining={"C2_CPUS": 100.0},
            per_shard={"C2_CPUS": 16.0},
        )
        assert result == 6  # floor(100/16)

    def test_limiting_metric_used(self):
        result = recommend_max_concurrent_from_headroom(
            live_remaining={"C2_CPUS": 100.0, "SSD_TOTAL_GB": 50.0},
            per_shard={"C2_CPUS": 16.0, "SSD_TOTAL_GB": 200.0},
        )
        # SSD limits to 0 (50/200 = 0.25 -> floor = 0)
        assert result == 0

    def test_safety_buffer_reduces_headroom(self):
        result = recommend_max_concurrent_from_headroom(
            live_remaining={"CPUS": 64.0},
            per_shard={"CPUS": 8.0},
            safety_buffer={"CPUS": 16.0},
        )
        assert result == 6  # floor((64-16)/8)

    def test_zero_remaining_returns_zero(self):
        result = recommend_max_concurrent_from_headroom(
            live_remaining={"CPUS": 0.0},
            per_shard={"CPUS": 8.0},
        )
        assert result == 0

    def test_empty_per_shard_returns_none(self):
        result = recommend_max_concurrent_from_headroom(
            live_remaining={"CPUS": 100.0},
            per_shard={},
        )
        assert result is None

    def test_zero_cost_per_shard_skipped(self):
        result = recommend_max_concurrent_from_headroom(
            live_remaining={"CPUS": 100.0, "FREE_METRIC": 0.0},
            per_shard={"CPUS": 10.0, "FREE_METRIC": 0.0},
        )
        assert result == 10  # Only CPUS metric counts

    def test_result_not_negative(self):
        result = recommend_max_concurrent_from_headroom(
            live_remaining={"CPUS": 5.0},
            per_shard={"CPUS": 8.0},
        )
        assert result == 0
