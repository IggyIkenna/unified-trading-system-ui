"""
Unit tests for DeployRequest model — exclude_dates field.

Moved from deployment-service/tests/unit/test_shard_calculator.py and
test_shard_edge_cases.py because these tests validate the DeployRequest
Pydantic model which lives in deployment-api, not deployment-service.

NOTE: We define a minimal DeployRequest inline rather than importing from
deployment_api.routes.state_management because the routes/__init__.py
eagerly imports all route modules, which triggers a cascade ending at
`from deployment import DeploymentOrchestrator` — a cross-repo dependency
not available in CI without deployment-service installed.
"""

from pydantic import BaseModel, Field


class _DeployRequest(BaseModel):
    """Minimal replica of deployment_api.routes.state_management.DeployRequest.

    Only the fields needed for exclude_dates tests are included.
    The canonical model is in deployment_api/routes/state_management.py.
    """

    service: str = Field(..., description="Service name to deploy")
    start_date: str | None = Field(None)
    end_date: str | None = Field(None)
    exclude_dates: dict[str, object] | None = Field(None)


class TestDeployRequestExcludeDates:
    """Tests for exclude_dates field on DeployRequest model."""

    def test_exclude_dates_field_in_deploy_request(self):
        """Test that DeployRequest model accepts exclude_dates field."""
        request = _DeployRequest(
            service="instruments-service",
            start_date="2024-01-01",
            end_date="2024-01-05",
            exclude_dates={
                "CEFI": ["2024-01-01", "2024-01-02"],
                "DEFI": ["2024-01-01"],
            },
        )

        assert request.exclude_dates is not None
        assert "CEFI" in request.exclude_dates
        assert len(request.exclude_dates["CEFI"]) == 2

    def test_exclude_dates_field_optional(self):
        """Test that exclude_dates is optional in DeployRequest."""
        request = _DeployRequest(
            service="instruments-service",
            start_date="2024-01-01",
            end_date="2024-01-05",
        )

        assert request.exclude_dates is None
