#!/usr/bin/env python3
"""Generate split modules from DeploymentDetails.tsx.bak (run once)."""
from __future__ import annotations

import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
BAK = ROOT / "components/ops/deployment/DeploymentDetails.tsx.bak"
DET = ROOT / "components/ops/deployment/details"


def slurp() -> list[str]:
    return BAK.read_text(encoding="utf-8").splitlines()


def join_lines(lines: list[str]) -> str:
    return "\n".join(lines) + "\n"


def main() -> None:
    src = slurp()

    def slice1(a: int, b: int) -> list[str]:
        return src[a - 1 : b]

    # Types: export interfaces
    type_lines = slice1(77, 193)
    out_types: list[str] = []
    for ln in type_lines:
        if ln.startswith("interface "):
            out_types.append("export " + ln)
        elif ln.startswith("const CLASSIFICATION_FILTERS"):
            out_types.append("export " + ln)
        else:
            out_types.append(ln)
    (DET / "deployment-details-types.ts").write_text(join_lines(out_types), encoding="utf-8")

    # StatBox
    stat = slice1(3374, 3401)
    (DET / "stat-box.tsx").write_text(
        '"use client";\n\nimport { cn } from "@/lib/utils";\n\n' + join_lines(stat),
        encoding="utf-8",
    )

    # Shard row: 3403-3709 — strip duplicate interfaces/constants that are in shard-row only
    shard = slice1(3403, 3709)
    (DET / "shard-row.tsx").write_text(
        """\"use client\";

import {
  CheckCircle2,
  CheckSquare,
  Clock,
  FileText,
  Loader2,
  RotateCcw,
  Square,
  StopCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ShardEvent } from "@/lib/types/deployment";
import type { ShardDetail } from "./deployment-details-types";

"""
        + join_lines(shard),
        encoding="utf-8",
    )

    # JSX slices (1-based inclusive)
    slices = {
        "deployment-details-header.tsx": (1240, 1546),
        "deployment-details-summary.tsx": (1548, 2038),
        "deployment-details-shards-tab.tsx": (2075, 2515),
        "deployment-details-logs-tab.tsx": (2517, 2964),
        "deployment-details-report-tab.tsx": (2966, 3140),
        "deployment-details-events-tab.tsx": (3142, 3265),
        "deployment-details-shard-logs-dialog.tsx": (3266, 3369),
    }
    for name, (a, b) in slices.items():
        (DET / f"{name}.fragment.txt").write_text(join_lines(slice1(a, b)), encoding="utf-8")

    print("Generated types, stat-box, shard-row, and .fragment.txt files under details/")


if __name__ == "__main__":
    main()
