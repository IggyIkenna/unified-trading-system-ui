from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class CanonicalBase(BaseModel):
    """Base for all canonical normalised schemas — rejects unknown fields."""

    model_config = ConfigDict(extra="forbid")
