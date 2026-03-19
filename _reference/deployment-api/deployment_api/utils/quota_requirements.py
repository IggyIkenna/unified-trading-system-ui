from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import cast


@dataclass(frozen=True)
class VmQuotaShape:
    cpu_metric: str
    vcpus: int
    external_ipv4: int
    ssd_gb: int

    def per_shard(self) -> dict[str, float]:
        return {
            self.cpu_metric: float(self.vcpus),
            "IN_USE_ADDRESSES": float(self.external_ipv4),
            "SSD_TOTAL_GB": float(self.ssd_gb),
        }


_MACHINE_VCPU_RE = re.compile(r".+-(\d+)$")

# GCP C2 standard machine types only exist in these vCPU sizes per zone (e.g. asia-northeast1).
VALID_C2_VCPUS = (4, 8, 16, 30, 60)


def snap_c2_vcpus_to_valid(vcpus: int) -> int:
    """Snap C2 vCPU count to nearest valid GCP size (4, 8, 16, 30, 60)."""
    if vcpus <= 0:
        return 4
    if vcpus >= 60:
        return 60
    return min(VALID_C2_VCPUS, key=lambda x: (abs(x - vcpus), x))


def parse_machine_type_vcpus(machine_type: str) -> int | None:
    """
    Parse vCPU count from machine type strings like:
      - c2-standard-16
      - n2-standard-32
      - c2d-highcpu-56
    """

    if not machine_type:
        return None
    m = _MACHINE_VCPU_RE.match(machine_type.strip())
    if not m:
        return None
    try:
        return int(m.group(1))
    except (OSError, ValueError, RuntimeError):
        return None


def cpu_quota_metric_for_machine(machine_type: str) -> str:
    """
    Map machine family to regional quota metric name (best-effort).
    """

    mt = (machine_type or "").lower()
    family = mt.split("-")[0] if mt else ""
    if family == "c2":
        return "C2_CPUS"
    if family == "c2d":
        return "C2D_CPUS"
    if family == "c3":
        return "C3_CPUS"
    if family == "n2":
        return "N2_CPUS"
    if family == "e2":
        return "E2_CPUS"
    return "CPUS"


def vm_quota_shape_from_compute_config(compute_config: dict[str, object]) -> VmQuotaShape:
    machine_type = str(compute_config.get("machine_type") or "")
    vcpus = parse_machine_type_vcpus(machine_type) or 0
    cpu_metric = cpu_quota_metric_for_machine(machine_type)
    if cpu_metric == "C2_CPUS" and vcpus not in VALID_C2_VCPUS:
        vcpus = snap_c2_vcpus_to_valid(vcpus)

    # VM backend uses pd-ssd; disk quota tracked as SSD_TOTAL_GB.
    disk_raw: object = compute_config.get("disk_size_gb") or 0
    ssd_gb = int(cast(int, disk_raw)) if isinstance(disk_raw, (int, float)) else 0
    external_ipv4 = 1
    return VmQuotaShape(
        cpu_metric=cpu_metric,
        vcpus=vcpus,
        external_ipv4=external_ipv4,
        ssd_gb=ssd_gb,
    )


def multiply_resources(resources: dict[str, float], factor: int) -> dict[str, float]:
    out: dict[str, float] = {}
    for k, v in (resources or {}).items():
        try:
            out[k] = float(v) * float(factor)
        except (OSError, ValueError, RuntimeError):
            out[k] = 0.0
    return out


def recommend_max_concurrent_from_headroom(
    *,
    live_remaining: dict[str, float],
    per_shard: dict[str, float],
    safety_buffer: dict[str, float] | None = None,
) -> int | None:
    """
    Compute a conservative max_concurrent recommendation based on:
      floor((remaining - safety) / per_shard_cost) across relevant metrics.
    """

    safety_buffer = safety_buffer or {}
    caps: list[int] = []
    for metric, cost in (per_shard or {}).items():
        cost = float(cost or 0.0)
        if cost <= 0:
            continue
        remaining = float(live_remaining.get(metric, 0.0) or 0.0)
        remaining -= float(safety_buffer.get(metric, 0.0) or 0.0)
        if remaining <= 0:
            return 0
        caps.append(math.floor(remaining / cost))

    if not caps:
        return None
    return max(0, min(caps))
