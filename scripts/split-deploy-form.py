#!/usr/bin/env python3
from pathlib import Path

ROOT = Path("/home/hk/unified-trading-system-repos/unified-trading-system-ui/components/ops/deployment")
bak = (ROOT / "DeployForm.tsx.bak").read_text(encoding="utf-8").splitlines()
form = ROOT / "form"
form.mkdir(exist_ok=True)


def join(a: int, b: int) -> str:
    return "\n".join(bak[a - 1 : b]) + "\n"


# Multi-select 1688-1783
(form / "multi-select-dimension.tsx").write_text(
    '"use client";\n\nimport { CheckCircle2 } from "lucide-react";\nimport { Button } from "@/components/ui/button";\nimport { Label } from "@/components/ui/label";\nimport { cn } from "@/lib/utils";\nimport type { ServiceDimension } from "@/lib/types/deployment";\n\n'
    + join(1688, 1783).replace("interface MultiSelectDimensionProps", "export interface MultiSelectDimensionProps").replace(
        "function MultiSelectDimension", "export function MultiSelectDimension",
    ),
    encoding="utf-8",
)

# Constants
(form / "deploy-form-constants.ts").write_text(
    join(81, 98) + "\nexport { REGIONS, getZonesForRegion };\n",
    encoding="utf-8",
)

# Fix constants file - original used const REGIONS - add export keyword
c = (form / "deploy-form-constants.ts").read_text(encoding="utf-8")
c = c.replace("const REGIONS", "export const REGIONS").replace(
    "const getZonesForRegion", "export const getZonesForRegion",
)
(form / "deploy-form-constants.ts").write_text(c, encoding="utf-8")

print("wrote form/multi-select-dimension.tsx and deploy-form-constants.ts")
