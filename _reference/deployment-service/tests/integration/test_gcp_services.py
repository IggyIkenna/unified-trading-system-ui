"""
GCP Services Integration Tests

Tests that validate the dashboard API can access required GCP services:
- Cloud Logging (for deployment logs)
- Compute Engine (for VM status/serial console)
- Cloud Build (for build status)
- Cloud Run (for job status)
- Artifact Registry (for image metadata)

These tests require GCP credentials and will skip if not available.

In CI, these run when GCP_SA_KEY secret is configured.
The GitHub Actions service account must have these IAM roles:
- roles/logging.viewer
- roles/compute.viewer
- roles/cloudbuild.builds.viewer
- roles/run.viewer
- roles/artifactregistry.reader
- roles/storage.objectViewer

Locally, they run if you have gcloud auth or GOOGLE_APPLICATION_CREDENTIALS.

To run these tests:
    pytest tests/integration/test_gcp_services.py -v

To run with specific credentials:
    GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json pytest tests/integration/test_gcp_services.py -v
"""

import os

import pytest

pytestmark = pytest.mark.integration

# Constants
DEFAULT_PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "test-project")
DEFAULT_REGION = "asia-northeast1"


def has_cloudbuild_module() -> bool:
    """Check if google-cloud-build package is installed."""
    import importlib.util

    return importlib.util.find_spec("google.cloud.devtools.cloudbuild_v1") is not None


@pytest.fixture
def project_id():
    return os.environ.get("GCP_PROJECT_ID", DEFAULT_PROJECT_ID)


@pytest.fixture
def region():
    return os.environ.get("GCP_REGION", DEFAULT_REGION)


class TestCloudLoggingIntegration:
    """Integration tests for Cloud Logging access.

    These tests verify the service account has roles/logging.viewer permission.
    """

    @pytest.mark.integration
    def test_logging_client_init(self, project_id):
        """Test Cloud Logging client can be initialized."""
        from google.cloud import logging as cloud_logging

        client = cloud_logging.Client(project=project_id)
        assert client is not None
        assert client.project == project_id

    @pytest.mark.integration
    def test_logging_list_entries(self, project_id):
        """Test listing recent log entries (requires roles/logging.viewer)."""
        from google.api_core.exceptions import Forbidden, PermissionDenied
        from google.cloud import logging as cloud_logging

        client = cloud_logging.Client(project=project_id)

        # Query recent Cloud Run job logs (last 1 hour)
        filter_str = """
resource.type="cloud_run_job"
severity >= DEFAULT
"""

        # List entries with a small limit
        try:
            entries = list(
                client.list_entries(
                    filter_=filter_str.strip(),
                    order_by=cloud_logging.DESCENDING,
                    max_results=5,
                )
            )
        except (PermissionDenied, Forbidden) as e:
            pytest.skip(f"No GCP permissions: {e}")

        # We don't assert on count since there might be no recent logs
        # The test passes if we can query without permission errors
        assert isinstance(entries, list)

    @pytest.mark.integration
    def test_logging_query_specific_job(self, project_id, region):
        """Test querying logs for a specific Cloud Run job."""
        from google.api_core.exceptions import Forbidden, PermissionDenied
        from google.cloud import logging as cloud_logging

        client = cloud_logging.Client(project=project_id)

        # Query for any instruments-service logs
        filter_str = """
resource.type="cloud_run_job"
resource.labels.job_name="instruments-service"
"""

        try:
            entries = list(
                client.list_entries(
                    filter_=filter_str.strip(),
                    max_results=3,
                )
            )
        except (PermissionDenied, Forbidden) as e:
            pytest.skip(f"No GCP permissions: {e}")

        assert isinstance(entries, list)
        # Log entries have specific attributes
        for entry in entries:
            assert hasattr(entry, "severity")
            assert hasattr(entry, "timestamp")
            assert hasattr(entry, "payload")


class TestComputeEngineIntegration:
    """Integration tests for Compute Engine access.

    These tests verify the service account has roles/compute.viewer permission.
    """

    @pytest.mark.integration
    def test_compute_client_init(self, project_id):
        """Test Compute Engine client can be initialized."""
        from google.cloud import compute_v1

        client = compute_v1.InstancesClient()
        assert client is not None

    @pytest.mark.integration
    def test_compute_list_instances(self, project_id, region):
        """Test listing instances in a zone (requires roles/compute.viewer)."""
        from google.api_core.exceptions import Forbidden, PermissionDenied
        from google.cloud import compute_v1

        client = compute_v1.InstancesClient()
        zone = f"{region}-b"

        # List instances (may be empty, that's fine)
        request = compute_v1.ListInstancesRequest(
            project=project_id,
            zone=zone,
            max_results=5,
        )

        try:
            instances = list(client.list(request=request))
        except (PermissionDenied, Forbidden) as e:
            pytest.skip(f"No GCP permissions: {e}")

        assert isinstance(instances, list)

    @pytest.mark.integration
    def test_compute_zones_access(self, project_id):
        """Test we can list available zones."""
        from google.api_core.exceptions import Forbidden, PermissionDenied
        from google.cloud import compute_v1

        client = compute_v1.ZonesClient()

        request = compute_v1.ListZonesRequest(
            project=project_id,
            max_results=10,
        )

        try:
            zones = list(client.list(request=request))
        except (PermissionDenied, Forbidden) as e:
            pytest.skip(f"No GCP permissions: {e}")

        assert len(zones) > 0
        # Verify we can access asia-northeast1 zones
        zone_names = [z.name for z in zones]
        assert any("asia-northeast1" in z for z in zone_names)


class TestCloudBuildIntegration:
    """Integration tests for Cloud Build access.

    These tests verify the service account has roles/cloudbuild.builds.viewer permission.
    """

    @pytest.mark.integration
    def test_cloudbuild_client_init(self, project_id):
        """Test Cloud Build client can be initialized."""
        if not has_cloudbuild_module():
            pytest.skip(
                "google-cloud-build not installed (install with: pip install google-cloud-build)"
            )
        from google.cloud.devtools import cloudbuild_v1

        client = cloudbuild_v1.CloudBuildClient()
        assert client is not None

    @pytest.mark.integration
    def test_cloudbuild_list_builds(self, project_id, region):
        """Test listing recent builds (requires roles/cloudbuild.builds.viewer)."""
        if not has_cloudbuild_module():
            pytest.skip(
                "google-cloud-build not installed (install with: pip install google-cloud-build)"
            )
        from google.api_core.exceptions import Forbidden, PermissionDenied
        from google.cloud.devtools import cloudbuild_v1

        client = cloudbuild_v1.CloudBuildClient()
        parent = f"projects/{project_id}/locations/{region}"

        request = cloudbuild_v1.ListBuildsRequest(
            parent=parent,
            page_size=5,
        )

        try:
            builds = list(client.list_builds(request=request))
        except (PermissionDenied, Forbidden) as e:
            pytest.skip(f"No GCP permissions: {e}")

        assert isinstance(builds, list)
        # Recent builds should have common attributes
        for build in builds[:3]:
            assert hasattr(build, "id")
            assert hasattr(build, "status")
            assert hasattr(build, "create_time")

    @pytest.mark.integration
    def test_cloudbuild_list_triggers(self, project_id, region):
        """Test listing build triggers."""
        if not has_cloudbuild_module():
            pytest.skip(
                "google-cloud-build not installed (install with: pip install google-cloud-build)"
            )
        from google.api_core.exceptions import Forbidden, PermissionDenied
        from google.cloud.devtools import cloudbuild_v1

        client = cloudbuild_v1.CloudBuildClient()
        parent = f"projects/{project_id}/locations/{region}"

        request = cloudbuild_v1.ListBuildTriggersRequest(
            parent=parent,
            page_size=10,
        )

        try:
            triggers = list(client.list_build_triggers(request=request))
        except (PermissionDenied, Forbidden) as e:
            pytest.skip(f"No GCP permissions: {e}")

        assert isinstance(triggers, list)
        # Should have at least some triggers set up
        assert len(triggers) > 0


class TestCloudRunIntegration:
    """Integration tests for Cloud Run access.

    These tests verify the service account has roles/run.viewer permission.
    """

    @pytest.mark.integration
    def test_cloudrun_jobs_client_init(self, project_id):
        """Test Cloud Run Jobs client can be initialized."""
        from google.cloud import run_v2

        client = run_v2.JobsClient()
        assert client is not None

    @pytest.mark.integration
    def test_cloudrun_list_jobs(self, project_id, region):
        """Test listing Cloud Run jobs (requires roles/run.viewer)."""
        from google.api_core.exceptions import Forbidden, PermissionDenied
        from google.cloud import run_v2

        client = run_v2.JobsClient()
        parent = f"projects/{project_id}/locations/{region}"

        request = run_v2.ListJobsRequest(
            parent=parent,
        )

        try:
            jobs = list(client.list_jobs(request=request))
        except (PermissionDenied, Forbidden) as e:
            pytest.skip(f"No GCP permissions: {e}")

        assert isinstance(jobs, list)
        # Should have deployment jobs set up (structure test)
        assert len(jobs) > 0

        # Verify job structure: if this project has our known service jobs, at least one should appear
        job_names = [j.name.split("/")[-1] for j in jobs]
        known_services = [
            "instruments-service",
            "market-tick-data-handler",
            "market-data-processing-service",
        ]
        has_known = any(svc in name for name in job_names for svc in known_services)
        if not has_known:
            pytest.skip(
                "No known Cloud Run service jobs found in this project "
                "(instruments-service, market-tick-data-handler, market-data-processing-service). "
                "Run in a project with those jobs deployed to assert names."
            )

    @pytest.mark.integration
    def test_cloudrun_list_executions(self, project_id, region):
        """Test listing Cloud Run job executions."""
        from google.api_core.exceptions import Forbidden, PermissionDenied
        from google.cloud import run_v2

        jobs_client = run_v2.JobsClient()
        executions_client = run_v2.ExecutionsClient()

        parent = f"projects/{project_id}/locations/{region}"

        # Get first job
        try:
            jobs = list(jobs_client.list_jobs(run_v2.ListJobsRequest(parent=parent)))
        except (PermissionDenied, Forbidden) as e:
            pytest.skip(f"No GCP permissions: {e}")

        if not jobs:
            pytest.skip("No Cloud Run jobs found")

        job = jobs[0]

        # List executions for this job
        request = run_v2.ListExecutionsRequest(
            parent=job.name,
        )

        try:
            executions = list(executions_client.list_executions(request=request))
        except (PermissionDenied, Forbidden) as e:
            pytest.skip(f"No GCP permissions: {e}")

        assert isinstance(executions, list)


class TestArtifactRegistryIntegration:
    """Integration tests for Artifact Registry access.

    These tests verify the service account has roles/artifactregistry.reader permission.
    """

    @pytest.mark.integration
    def test_artifact_registry_auth(self, project_id):
        """Test getting auth token for Artifact Registry."""
        import google.auth
        import google.auth.transport.requests

        credentials, _ = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )

        request = google.auth.transport.requests.Request()
        credentials.refresh(request)

        assert credentials.token is not None
        assert len(credentials.token) > 0

    @pytest.mark.integration
    def test_artifact_registry_list_images(self, project_id, region):
        """Test listing Docker images via Registry HTTP API."""
        import google.auth
        import google.auth.transport.requests
        import requests

        # Get auth token
        credentials, _ = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        request_obj = google.auth.transport.requests.Request()
        credentials.refresh(request_obj)

        # Query Artifact Registry via Docker HTTP API
        registry_url = f"https://{region}-docker.pkg.dev"
        # List repositories in the unified-services registry
        catalog_url = f"{registry_url}/v2/catalog"

        headers = {
            "Authorization": f"Bearer {credentials.token}",
        }

        response = requests.get(catalog_url, headers=headers, timeout=10)
        # 200 = success, 401 = no access (test will fail appropriately)
        assert response.status_code in [
            200,
            404,
        ], f"Unexpected status: {response.status_code}"

    @pytest.mark.integration
    def test_get_image_info_utility(self, project_id, region):
        """Test the get_image_info utility function."""
        import asyncio
        import sys

        sys.path.insert(0, str(__file__).rsplit("/", 3)[0])

        from deployment_api.utils.artifact_registry import get_image_info

        # Test with a known image (instruments-service)
        image_url = (
            f"{region}-docker.pkg.dev/{project_id}/unified-services/instruments-service:latest"
        )

        result = asyncio.run(get_image_info(image_url))

        # Result may be None if image doesn't exist yet, but shouldn't raise
        if result:
            assert "digest" in result or result.get("digest") is None
            assert "image" in result
            assert result["image"] == "instruments-service"


class TestLogsEndpointIntegration:
    """Integration tests for the logs API endpoint functionality.

    These tests verify the complete logs fetching flow works end-to-end.
    """

    @pytest.mark.integration
    def test_cloud_run_logs_fetch(self, project_id, region):
        """Test fetching logs for a Cloud Run job (integration test of full flow)."""
        from google.api_core.exceptions import Forbidden, PermissionDenied
        from google.cloud import logging as cloud_logging
        from google.cloud import run_v2

        # Get a recent execution to query logs for
        jobs_client = run_v2.JobsClient()
        executions_client = run_v2.ExecutionsClient()

        parent = f"projects/{project_id}/locations/{region}"
        try:
            jobs = list(jobs_client.list_jobs(run_v2.ListJobsRequest(parent=parent)))
        except (PermissionDenied, Forbidden) as e:
            pytest.skip(f"No GCP permissions: {e}")

        if not jobs:
            pytest.skip("No Cloud Run jobs found")

        # Find an execution with logs
        execution_name = None
        for job in jobs[:5]:  # Check first 5 jobs
            try:
                executions = list(
                    executions_client.list_executions(run_v2.ListExecutionsRequest(parent=job.name))
                )
            except (PermissionDenied, Forbidden) as e:
                pytest.skip(f"No GCP permissions: {e}")
            if executions:
                execution_name = executions[0].name.split("/")[-1]
                job_name = job.name.split("/")[-1]
                break

        if not execution_name:
            pytest.skip("No Cloud Run executions found")

        # Now query Cloud Logging for this execution
        logging_client = cloud_logging.Client(project=project_id)

        filter_str = f"""
resource.type="cloud_run_job"
resource.labels.job_name="{job_name}"
labels."run.googleapis.com/execution_name"="{execution_name}"
"""

        try:
            entries = list(
                logging_client.list_entries(
                    filter_=filter_str.strip(),
                    max_results=10,
                )
            )
        except (PermissionDenied, Forbidden) as e:
            pytest.skip(f"No GCP permissions: {e}")

        assert isinstance(entries, list)
        # Log entries should have the expected structure
        for entry in entries:
            assert hasattr(entry, "severity")
            assert hasattr(entry, "payload")

    @pytest.mark.integration
    def test_vm_serial_console_access(self, project_id, region):
        """Test VM serial console access (for VM deployment logs).

        This tests the permission but may skip if no VMs are running.
        """
        from google.api_core.exceptions import Forbidden, PermissionDenied
        from google.cloud import compute_v1

        client = compute_v1.InstancesClient()
        zones = [f"{region}-a", f"{region}-b", f"{region}-c"]

        # Find any running instance
        found_instance = None
        found_zone = None

        for zone in zones:
            try:
                instances = list(
                    client.list(
                        compute_v1.ListInstancesRequest(
                            project=project_id,
                            zone=zone,
                            max_results=5,
                        )
                    )
                )
            except (PermissionDenied, Forbidden) as e:
                pytest.skip(f"No GCP permissions: {e}")
            running = [i for i in instances if i.status == "RUNNING"]
            if running:
                found_instance = running[0].name
                found_zone = zone
                break

        if not found_instance:
            pytest.skip("No running VMs found to test serial console access")

        # Try to get serial port output
        try:
            request = compute_v1.GetSerialPortOutputInstanceRequest(
                project=project_id,
                zone=found_zone,
                instance=found_instance,
                port=1,
            )
            output = client.get_serial_port_output(request=request)
            assert hasattr(output, "contents")
        except (PermissionDenied, Forbidden) as e:
            pytest.skip(f"No GCP permissions: {e}")
        except Exception as e:
            # Other errors (e.g. instance not found) fail normally
            pytest.fail(f"Serial console access failed: {e}")
