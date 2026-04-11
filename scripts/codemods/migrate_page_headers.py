#!/usr/bin/env python3
"""
Migrate first top-level page header block (h1 + optional description p) to PageHeader.
Skips files that already import PageHeader. Conservative: only plain-text h1/p content.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Match a div wrapping h1 + single p (description). h1/p text must not contain { or <.
BLOCK_RE = re.compile(
    r"<div>\s*\n"
    r'\s*<h1 className="[^"]*">([^<{}]+)</h1>\s*\n'
    r'\s*<p className="[^"]*text-muted-foreground[^"]*"[^>]*>\s*\n'
    r"\s*([^<{}]+?)\s*\n"
    r"\s*</p>\s*\n"
    r"\s*</div>",
    re.MULTILINE,
)

ALT_BLOCK_RE = re.compile(
    r"<div>\s*\n"
    r'\s*<h1 className="[^"]*">([^<{}]+)</h1>\s*\n'
    r'\s*<p className="[^"]*text-muted-foreground[^"]*"[^>]*>([^<{}]+)</p>\s*\n'
    r"\s*</div>",
    re.MULTILINE,
)

SPACE_Y1_RE = re.compile(
    r'<div className="space-y-1">\s*\n'
    r'\s*<h1 className="[^"]*">([^<{}]+)</h1>\s*\n'
    r'\s*<p className="[^"]*text-muted-foreground[^"]*"[^>]*>\s*\n'
    r"\s*([^<{}]+?)\s*\n"
    r"\s*</p>\s*\n"
    r"\s*</div>",
    re.MULTILINE,
)

IMPORT_LINE = 'import { PageHeader } from "@/components/platform/page-header";\n'


def ensure_import(text: str) -> str:
    if "PageHeader" in text and "page-header" in text:
        return text
    if IMPORT_LINE.strip() in text:
        return text
    m = re.search(r'^("use client";\s*\n)', text)
    if m:
        insert_at = m.end()
        return text[:insert_at] + "\n" + IMPORT_LINE + text[insert_at:]
    return IMPORT_LINE + text


def replace_block(text: str) -> tuple[str, bool]:
    m = BLOCK_RE.search(text)
    if not m:
        m = ALT_BLOCK_RE.search(text)
        if not m:
            m = SPACE_Y1_RE.search(text)
            if not m:
                return text, False
            title, desc = m.group(1).strip(), m.group(2).strip()
        else:
            title, desc = m.group(1).strip(), m.group(2).strip()
    else:
        title, desc = m.group(1).strip(), m.group(2).strip()
    replacement = (
        f'<PageHeader\n        title="{title}"\n        description="{desc}"\n      />'
    )
    new_text = text[: m.start()] + replacement + text[m.end() :]
    return new_text, True


def process_file(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    if "from \"@/components/platform/page-header\"" in text or "from '@/components/platform/page-header'" in text:
        return "skip-has-import"
    if "<PageHeader" in text:
        return "skip-has-component"
    new_text, ok = replace_block(text)
    if not ok:
        return "skip-no-match"
    new_text = ensure_import(new_text)
    path.write_text(new_text, encoding="utf-8")
    return "ok"


def main() -> int:
    globs = [
        "app/(platform)/**/*.tsx",
        "app/(ops)/**/*.tsx",
        "app/health/**/*.tsx",
    ]
    paths: list[Path] = []
    for g in globs:
        paths.extend(ROOT.glob(g))
    # de-dupe
    paths = sorted({p.resolve() for p in paths if p.is_file()})
    skip_names = {"layout.tsx"}
    ok = skip = 0
    for p in paths:
        if p.name in skip_names:
            continue
        if "archive" in str(p):
            continue
        r = process_file(p)
        if r == "ok":
            ok += 1
            print(f"OK {p.relative_to(ROOT)}")
        else:
            skip += 1
    print(f"--- migrated={ok} skipped={skip}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
