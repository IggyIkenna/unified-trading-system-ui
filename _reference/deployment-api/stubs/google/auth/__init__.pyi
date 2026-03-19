# Minimal stub for google.auth — covers only the symbols used in deployment-api.
from collections.abc import Sequence
from typing import Any

class Credentials:
    """Base credentials class."""

    service_account_email: str
    token: str | None
    expiry: Any
    def refresh(self, request: object) -> None: ...

def default(
    scopes: Sequence[str] | None = None,
    request: object | None = None,
    quota_project_id: str | None = None,
    default_scopes: Sequence[str] | None = None,
) -> tuple[Credentials, str | None]: ...
