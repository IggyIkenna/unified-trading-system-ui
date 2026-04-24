"""Document management schemas for client-reporting-api.

DocumentMetadata tracks the lifecycle of documents stored in cloud storage.
The API never handles file bytes — all transfer is client-to-cloud-storage
via pre-signed URLs (see unified-cloud-interface presigned_urls.py).
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class DocumentCategory(StrEnum):
    """Document classification categories."""

    INVOICE = "INVOICE"
    ONBOARDING = "ONBOARDING"
    REGULATORY = "REGULATORY"
    CONTRACT = "CONTRACT"
    REPORT = "REPORT"
    COMPLIANCE = "COMPLIANCE"


class DocumentStatus(StrEnum):
    """Document lifecycle states."""

    PENDING_UPLOAD = "PENDING_UPLOAD"
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    READY = "READY"
    SIGNED = "SIGNED"
    ARCHIVED = "ARCHIVED"
    DELETED = "DELETED"


class DocumentMetadata(BaseModel, frozen=True):
    """Metadata for a document stored in cloud storage.

    The document content itself is in GCS/S3, accessed via pre-signed URLs.
    This model tracks the metadata and lifecycle state.
    """

    id: str = Field(description="Unique document identifier (UUID)")
    org_id: str = Field(description="Organization that owns this document")
    category: DocumentCategory
    filename: str = Field(description="Original filename as uploaded")
    size_bytes: int = Field(description="File size in bytes")
    content_type: str = Field(
        default="application/octet-stream",
        description="MIME type (application/pdf, etc.)",
    )
    storage_path: str = Field(
        description="Full path in cloud storage: documents/{org_id}/{category}/{filename}",
    )
    uploaded_by: str = Field(description="User ID or service name that uploaded")
    uploaded_at: datetime = Field(description="Upload timestamp (UTC)")
    status: DocumentStatus = Field(default=DocumentStatus.PENDING_UPLOAD)
    docusign_envelope_id: str | None = Field(
        default=None,
        description="DocuSign envelope ID if sent for signature",
    )
