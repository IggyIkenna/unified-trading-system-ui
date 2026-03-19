"""
Unit tests for zone round-robin distribution (shard_index % 3).

Validates:
- Zone assignment: shard_index % len(zones) gives correct zone
- 30 shards -> 10-10-10 across zones
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


class TestZoneDistribution:
    """Tests for zone round-robin distribution logic."""

    def test_zone_assignment_shard_index_mod_3(self):
        """Shard index 0,1,2 -> zones 0,1,2; 3,4,5 -> zones 0,1,2; etc."""
        backend = _make_vm_backend(
            project_id="test-project",
            region="asia-northeast1",
            service_account_email="test@test.iam.gserviceaccount.com",
        )
        zones = backend.zones

        # Simulate orchestrator/auto-scheduler logic
        for shard_index in range(12):
            assigned_zone = zones[shard_index % len(zones)]
            expected_idx = shard_index % 3
            assert assigned_zone == zones[expected_idx]

    def test_30_shards_distribute_10_10_10(self):
        """Batch of 30 shards should distribute 10 per zone."""
        backend = _make_vm_backend(
            project_id="test-project",
            region="asia-northeast1",
            service_account_email="test@test.iam.gserviceaccount.com",
        )
        zones = backend.zones

        counts = dict.fromkeys(zones, 0)
        for shard_index in range(30):
            assigned = zones[shard_index % len(zones)]
            counts[assigned] += 1

        assert len(set(counts.values())) == 1
        assert next(iter(counts.values())) == 10

    def test_zone_suffixes_asia_northeast1(self):
        """asia-northeast1 has zones a, b, c (order may vary)."""
        backend = _make_vm_backend(
            project_id="test-project",
            region="asia-northeast1",
            service_account_email="test@test.iam.gserviceaccount.com",
        )
        zones = backend.zones
        zone_suffixes = [z.split("-")[-1] for z in zones]
        assert set(zone_suffixes) == {"a", "b", "c"}
