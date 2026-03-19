"""
Unit tests for VM backend zone failover (single-region, no region switching).

Validates:
- Zone hint from compute_config is used as starting zone
- Zone cycling (no region switch)
- record_zone_exhaustion does not trigger region switch
- get_zones_for_region returns correct zones for asia-northeast1
"""

import os
from unittest.mock import MagicMock, patch

from deployment_service.backends.vm import VMBackend


def _make_vm_backend(**kwargs):
    """Create a VMBackend with mocked GCP auth to avoid credential errors in unit tests."""
    with (
        patch("deployment_service.backends.services.vm_config.get_images_client") as mock_images,
        patch(
            "deployment_service.backends.services.vm_lifecycle.get_instances_client"
        ) as mock_instances,
        patch(
            "deployment_service.backends.services.vm_monitoring.get_instances_client"
        ) as mock_monitoring_instances,
        patch.dict(os.environ, {"GOOGLE_APPLICATION_CREDENTIALS": ""}),
    ):
        mock_images.return_value = MagicMock()
        mock_instances.return_value = MagicMock()
        mock_monitoring_instances.return_value = MagicMock()
        return VMBackend(**kwargs)


class TestVMZoneFailover:
    """Tests for VM backend zone-only failover (no multi-region)."""

    def test_init_single_region_no_regions_param(self):
        """VMBackend should not accept regions param (removed)."""
        backend = _make_vm_backend(
            project_id="test-project",
            region="asia-northeast1",
            service_account_email="test@test.iam.gserviceaccount.com",
            status_bucket="test-bucket",
            status_prefix="deployments.test",
        )
        assert not hasattr(backend, "regions")
        assert not hasattr(backend, "_current_region_index")
        assert backend.region == "asia-northeast1"
        assert len(backend.zones) == 3

    def test_get_zones_for_region_asia_northeast1(self):
        """_config_manager.get_zones_for_region returns 3 zones for asia-northeast1."""
        backend = _make_vm_backend(
            project_id="test-project",
            region="asia-northeast1",
            service_account_email="test@test.iam.gserviceaccount.com",
        )
        zones = backend._config_manager.get_zones_for_region("asia-northeast1")
        assert len(zones) == 3
        assert "asia-northeast1-a" in zones or "asia-northeast1-b" in zones
        assert all(z.startswith("asia-northeast1-") for z in zones)

    def test_record_zone_exhaustion_no_region_switch(self):
        """record_zone_exhaustion only increments counts, no region switch."""
        backend = _make_vm_backend(
            project_id="test-project",
            region="asia-northeast1",
            service_account_email="test@test.iam.gserviceaccount.com",
        )
        original_region = backend.region
        lifecycle = backend._lifecycle_manager

        lifecycle.record_zone_exhaustion("asia-northeast1-a")
        lifecycle.record_zone_exhaustion("asia-northeast1-b")
        lifecycle.record_zone_exhaustion("asia-northeast1-c")

        assert backend.region == original_region
        assert lifecycle._zone_exhaustion_counts.get("asia-northeast1-a") == 1

    def test_zone_hint_from_compute_config(self):
        """When compute_config has 'zone', it can be used as starting zone."""
        backend = _make_vm_backend(
            project_id="test-project",
            region="asia-northeast1",
            service_account_email="test@test.iam.gserviceaccount.com",
        )
        lifecycle = backend._lifecycle_manager

        # Simulate deploy_shard zone hint logic
        preferred_zone = "asia-northeast1-b"
        if preferred_zone in backend.zones:
            lifecycle._zone_index = backend.zones.index(preferred_zone)

        zones_to_try = lifecycle.get_zones_to_try()
        assert zones_to_try[0] == preferred_zone

    def test_get_zones_to_try_round_robin(self):
        """get_zones_to_try returns zones in round-robin order."""
        backend = _make_vm_backend(
            project_id="test-project",
            region="asia-northeast1",
            service_account_email="test@test.iam.gserviceaccount.com",
        )
        lifecycle = backend._lifecycle_manager
        zones_to_try = lifecycle.get_zones_to_try()
        assert len(zones_to_try) == len(backend.zones)
        assert set(zones_to_try) == set(backend.zones)
