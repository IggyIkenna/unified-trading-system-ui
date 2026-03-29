#!/usr/bin/env python3
"""Replace ad-hoc Loader2 + animate-spin with <Spinner /> (run from repo root)."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def strip_animate_spin(class_name: str) -> str:
    parts = [p for p in class_name.split() if p and p != "animate-spin"]
    return " ".join(parts).strip()


def add_spinner_import(text: str) -> str:
    if 'from "@/components/shared/spinner"' in text or "from '@/components/shared/spinner'" in text:
        return text
    # After first "use client" or first import
    m = re.search(r"^(?:\"use client\";[\s\n]+)?", text, re.MULTILINE)
    insert_at = m.end() if m else 0
    line = 'import { Spinner } from "@/components/shared/spinner";\n'
    return text[:insert_at] + line + text[insert_at:]


def remove_loader2_from_lucide(text: str) -> str:
    def fix_import(m: re.Match[str]) -> str:
        inner = m.group(1)
        names = [n.strip() for n in inner.split(",") if n.strip()]
        names = [n for n in names if n != "Loader2"]
        if not names:
            return ""
        return f'import {{ {", ".join(names)} }} from "lucide-react";'

    out = re.sub(
        r"import\s*\{\s*([^}]+)\s*\}\s*from\s*[\"']lucide-react[\"'];",
        fix_import,
        text,
    )
    return re.sub(r"\n{3,}", "\n\n", out)


def process_file(path: Path) -> bool:
    if "archive" in path.parts or path.name == "spinner.tsx":
        return False
    text = path.read_text(encoding="utf-8")
    if "Loader2" not in text:
        return False

    original = text

    def repl_string(m: re.Match[str]) -> str:
        cls = m.group(1)
        cleaned = strip_animate_spin(cls)
        size_hint = ""
        if any(x in cleaned for x in ("size-8", "size-10", "h-8 w-8", "h-8 ", " w-8")):
            size_hint = ' size="lg"'
        elif any(x in cleaned for x in ("size-3", "h-3 w-3")):
            size_hint = ' size="sm"'
        if cleaned:
            return f'<Spinner{size_hint} className="{cleaned}" />'
        return f"<Spinner{size_hint} />"

    text = re.sub(
        r'<Loader2\s+className="([^"]*)"\s*/>',
        repl_string,
        text,
    )

    if "<Loader2" in text or "</Loader2>" in text:
        return False

    text = add_spinner_import(text)
    text = remove_loader2_from_lucide(text)
    if "Loader2" in text:
        return False

    if text == original:
        return False
    path.write_text(text, encoding="utf-8")
    return True


def main() -> int:
    changed = 0
    for path in sorted(ROOT.rglob("*.tsx")):
        if process_file(path):
            print(path.relative_to(ROOT))
            changed += 1
    print(f"Updated {changed} files", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
