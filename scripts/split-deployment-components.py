#!/usr/bin/env python3
"""One-off splitter for ops deployment monoliths — run from repo root optional."""
from __future__ import annotations

import pathlib

UI = pathlib.Path(__file__).resolve().parent.parent / "components/ops/deployment"


def lines(path: pathlib.Path, start: int, end: int) -> str:
    raw = path.read_text().splitlines()
    return "\n".join(raw[start - 1 : end]) + "\n"


def main() -> None:
    dd = UI / "DeploymentDetails.tsx"
    df = UI / "DeployForm.tsx"
    ex = UI / "ExecutionDataStatus.tsx"

    details_dir = UI / "details"
    details_dir.mkdir(exist_ok=True)
    form_dir = UI / "form"
    form_dir.mkdir(exist_ok=True)
    eds_dir = UI / "execution-data-status"
    eds_dir.mkdir(exist_ok=True)

    # --- DeploymentDetails: types (77-193) ---
    (details_dir / "deployment-details-types.ts").write_text(
        lines(dd, 77, 193), encoding="utf-8"
    )

    # StatBox 3374-3401, ShardRow block 3403-3709 (rest of file)
    (details_dir / "stat-box.tsx").write_text(
        '"use client";\n\nimport { cn } from "@/lib/utils";\n\n'
        + lines(dd, 3374, 3401),
        encoding="utf-8",
    )

    shard_row_body = lines(dd, 3403, 3709)
    (details_dir / "shard-row.tsx").write_text(
        """\"use client\";

import {
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  RotateCcw,
  Square,
  StopCircle,
  XCircle,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ShardEvent } from "@/lib/types/deployment";
import type { ShardDetail } from "./deployment-details-types";

"""
        + shard_row_body,
        encoding="utf-8",
    )

    print("Wrote details/*.tsx partials — manual wiring still required (script stage 1)")


if __name__ == "__main__":
    main()
