#!/usr/bin/env python3
"""Make operationId values unique in a merged OpenAPI spec (openapi-typescript requires this)."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def dedupe_paths(paths: dict[str, Any]) -> int:
    renamed = 0
    counts: dict[str, int] = {}
    for _path_key, path_item in paths.items():
        if not isinstance(path_item, dict):
            continue
        for method, op in path_item.items():
            if method.startswith("x-") or not isinstance(op, dict):
                continue
            oid = op.get("operationId")
            if not isinstance(oid, str) or not oid:
                continue
            counts[oid] = counts.get(oid, 0) + 1
            n = counts[oid]
            if n > 1:
                op["operationId"] = f"{oid}__{n}"
                renamed += 1
    return renamed


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--in-place", action="store_true", help="overwrite input file")
    parser.add_argument("-o", "--output", type=Path, help="write to this path instead")
    args = parser.parse_args()
    if not args.in_place and args.output is None:
        parser.error("specify --in-place or -o OUTPUT")
    data = json.loads(args.input.read_text())
    paths = data.get("paths")
    if not isinstance(paths, dict):
        raise SystemExit("spec has no paths object")
    n = dedupe_paths(paths)
    out = args.input if args.in_place else args.output
    assert out is not None
    out.write_text(json.dumps(data, indent=2) + "\n")
    print(f"dedupe-openapi-operation-ids: renamed {n} duplicate operationId(s) -> {out}")


if __name__ == "__main__":
    main()
