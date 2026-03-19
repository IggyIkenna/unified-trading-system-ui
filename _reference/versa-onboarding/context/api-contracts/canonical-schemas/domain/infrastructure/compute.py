"""Canonical compute resource types for quota management.

ComputeType and VmQuotaShape are domain-level abstractions used by
deployment-service and quota-broker to describe VM resource shapes
independent of any specific cloud provider.
"""

from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, Field


class ComputeType(StrEnum):
    """Compute backend type for quota requests."""

    VM = "vm"
    CLOUD_RUN = "cloud_run"


class VmQuotaShape(BaseModel):
    """VM resource shape for quota calculation.

    Maps machine config to GCP regional quota metrics.
    """

    cpu_metric: str = Field(..., description="GCP quota metric name (e.g. C2_CPUS, N2_CPUS)")
    vcpus: int = Field(..., description="vCPU count")
    external_ipv4: int = Field(..., description="External IPv4 addresses (typically 1 per VM)")
    ssd_gb: int = Field(..., description="SSD disk size in GB")

    def per_shard(self) -> dict[str, float]:
        """Return resource dict for one shard (per quota_requirements.VmQuotaShape.per_shard)."""
        return {
            self.cpu_metric: float(self.vcpus),
            "IN_USE_ADDRESSES": float(self.external_ipv4),
            "SSD_TOTAL_GB": float(self.ssd_gb),
        }
