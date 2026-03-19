# Minimal stub for google.auth.impersonated_credentials
from collections.abc import Sequence

from google.auth import Credentials as _BaseCredentials

class Credentials:
    """Impersonated credentials."""

    def __init__(
        self,
        source_credentials: _BaseCredentials,
        target_principal: str,
        target_scopes: Sequence[str],
        delegates: Sequence[str] | None = None,
        lifetime: int = 3600,
        quota_project_id: str | None = None,
    ) -> None: ...
    service_account_email: str
    token: str | None
    def refresh(self, request: object) -> None: ...
