"""Client reporting domain schemas — document management, invoicing, compliance.

SSOT for:
- DocumentMetadata: document lifecycle tracking
- DocumentCategory: document classification
- DocumentStatus: document state machine
"""

from .schemas import DocumentCategory, DocumentMetadata, DocumentStatus

__all__ = [
    "DocumentCategory",
    "DocumentMetadata",
    "DocumentStatus",
]
