"""CI/CD domain contracts for workflow event tracking."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class GitHubWorkflowEvent(BaseModel):
    """Event emitted when a GitHub Actions workflow run completes."""

    repo_name: str = Field(description="Repository name (org/repo format)")
    workflow_name: str = Field(description="Name of the workflow that ran")
    run_id: int = Field(description="GitHub Actions run ID")
    run_url: str = Field(description="URL to the workflow run on GitHub")
    conclusion: Literal["success", "failure", "cancelled"] = Field(
        description="Final conclusion of the workflow run"
    )
    triggered_by: str = Field(description="GitHub user or event that triggered the run")
    branch: str = Field(description="Git branch the workflow ran on")
    commit_sha: str = Field(description="Git commit SHA that was checked out")
    duration_seconds: float = Field(description="Total wall-clock duration in seconds")
    timestamp: datetime = Field(description="UTC timestamp when the run completed")
    details_json: dict[str, object] = Field(
        default_factory=dict,
        description="Arbitrary structured details about the run (steps, artifacts, etc.)",
    )
    severity: str = Field(
        default="INFO",
        description="Log severity level (will reference LogLevel from UAC once available)",
    )
