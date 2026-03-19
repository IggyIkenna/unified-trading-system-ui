"""Canonical feature domain models — feature metadata and records."""

from pydantic import BaseModel


class FeatureMetadata(BaseModel):
    """Metadata describing a computed feature."""

    name: str
    version: str
    source: str
    domain: str


class CanonicalFeatureRecord(BaseModel):
    """A single feature observation with metadata."""

    feature_name: str
    value: float
    timestamp: str
    metadata: FeatureMetadata
