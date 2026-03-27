import type { FinderColumnDef } from "@/components/shared/finder/types";

/** Match Tailwind arbitrary width e.g. w-[168px] */
const WIDTH_PX_RE = /^w-\[(\d+)px\]$/;

export function isFlexFinderColumn(width: string): boolean {
  return width.trim() === "flex-1";
}

/** Returns pixel width from w-[Npx], or null for flex / unknown */
export function parseFinderWidthPx(width: string): number | null {
  const m = WIDTH_PX_RE.exec(width.trim());
  if (!m) return null;
  return parseInt(m[1], 10);
}

export function isResizableFinderColumn(col: FinderColumnDef): boolean {
  return !isFlexFinderColumn(col.width) && parseFinderWidthPx(col.width) != null;
}

export function getFinderColumnDefaultWidthPx(col: FinderColumnDef): number {
  if (col.defaultWidthPx != null) return col.defaultWidthPx;
  const parsed = parseFinderWidthPx(col.width);
  if (parsed != null) return parsed;
  return 200;
}

export function buildInitialFinderColumnWidths(columns: FinderColumnDef[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of columns) {
    if (!isResizableFinderColumn(c)) continue;
    out[c.id] = getFinderColumnDefaultWidthPx(c);
  }
  return out;
}

export function clampFinderColumnWidth(col: FinderColumnDef, widthPx: number): number {
  const min = col.minWidthPx ?? 96;
  const max = col.maxWidthPx ?? 560;
  return Math.round(Math.min(max, Math.max(min, widthPx)));
}
