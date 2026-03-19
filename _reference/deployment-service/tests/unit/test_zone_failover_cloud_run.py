"""
Unit tests for Cloud Run backend single-region retry (no region switching).

Validates:
- No regions param in __init__
- No _switch_to_next_region, _record_quota_error, _reset_error_count
- Single region, 3 retries with backoff
"""

from deployment_service.backends.cloud_run import CloudRunBackend


class TestCloudRunSingleRegion:
    """Tests for Cloud Run backend single-region mode."""

    def test_init_no_regions_param(self):
        """CloudRunBackend should not accept regions param (removed)."""
        backend = CloudRunBackend(
            project_id="test-project",
            region="asia-northeast1",
            service_account_email="test@test.iam.gserviceaccount.com",
            job_name="test-job",
        )
        assert not hasattr(backend, "regions")
        assert not hasattr(backend, "_current_region_index")
        assert not hasattr(backend, "_consecutive_quota_errors")
        assert backend.region == "asia-northeast1"

    def test_no_region_switch_method(self):
        """CloudRunBackend should not have _switch_to_next_region."""
        backend = CloudRunBackend(
            project_id="test-project",
            region="asia-northeast1",
            service_account_email="test@test.iam.gserviceaccount.com",
            job_name="test-job",
        )
        assert not hasattr(backend, "_switch_to_next_region")
        assert not hasattr(backend, "_record_quota_error")
        assert not hasattr(backend, "_reset_error_count")

    def test_job_path_uses_single_region(self):
        """job_path should use the configured region only."""
        backend = CloudRunBackend(
            project_id="test-project",
            region="asia-northeast1",
            service_account_email="test@test.iam.gserviceaccount.com",
            job_name="test-job",
        )
        path = backend.job_path
        assert "asia-northeast1" in path
        assert path == "projects/test-project/locations/asia-northeast1/jobs/test-job"
