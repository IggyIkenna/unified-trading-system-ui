"""Source control / CI canonical types.

Provider-agnostic: GitHub, GitLab (future) normalize to these.
Used for workflow runs, PRs, repos across quickmerge, CI monitoring, VCR.
"""

from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class _CIBase(BaseModel):
    model_config = ConfigDict(extra="forbid")


class SourceControlProvider(StrEnum):
    GITHUB = "github"
    GITLAB = "gitlab"  # future


class CanonicalRepository(_CIBase):
    """Source control repository — GitHub repo, GitLab project."""

    provider: SourceControlProvider
    full_name: str = Field(description="org/repo or namespace/project")
    html_url: str | None = None
    default_branch: str | None = None
    visibility: str | None = None


class CanonicalWorkflowRun(_CIBase):
    """CI workflow run — GitHub Actions run, GitLab pipeline."""

    provider: SourceControlProvider
    run_id: str
    status: str | None = None
    conclusion: str | None = None
    branch: str | None = None
    event: str | None = None
    html_url: str | None = None


class CanonicalPullRequest(_CIBase):
    """Pull request / merge request."""

    provider: SourceControlProvider
    number: int
    title: str | None = None
    state: str | None = None
    head_ref: str | None = None
    base_ref: str | None = None
    html_url: str | None = None
