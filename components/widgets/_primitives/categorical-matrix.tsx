"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export interface CategoricalMatrixCell {
  /** Numeric value rendered + colour-coded. Null = no data (rendered as muted dash). */
  value: number | null;
  /** Optional override label (e.g. "0.05%" instead of the auto-formatted value). */
  label?: string;
  /** Optional click handler payload — the cell renders interactive when this is set. */
  onClickPayload?: unknown;
}

export interface CategoricalMatrixProps<R extends string = string, C extends string = string> {
  /** Row labels (top-to-bottom). */
  rows: ReadonlyArray<R>;
  /** Column labels (left-to-right). */
  cols: ReadonlyArray<C>;
  /** Cells indexed as cells[row][col]. Missing entries render as "no data". */
  cells: Readonly<Record<R, Readonly<Record<C, CategoricalMatrixCell>>>>;
  /**
   * Colour scale mode:
   *  - "diverging": red ↔ green centred at zero (funding rates, %change)
   *  - "sequential": single-hue ramp 0→max (volume, count)
   *  - "categorical": user-supplied per-cell colour (rendered via cell.label classname)
   */
  scale?: "diverging" | "sequential";
  /** Format value for tooltip / label. Default: 2dp + sign. */
  format?: (v: number) => string;
  /** Label for row axis (renders on the corner). */
  rowLabel?: string;
  /** Label for col axis (renders on the corner). */
  colLabel?: string;
  className?: string;
  cellClassName?: string;
  onCellClick?: (row: R, col: C, cell: CategoricalMatrixCell) => void;
}

function defaultFormat(v: number): string {
  const sign = v > 0 ? "+" : "";
  if (Math.abs(v) >= 1000) return `${sign}${(v / 1000).toFixed(1)}k`;
  if (Math.abs(v) < 0.01 && v !== 0) return `${sign}${(v * 10000).toFixed(1)}bp`;
  return `${sign}${v.toFixed(2)}`;
}

/** Returns a CSS background-color string for the value, given scale + min/max. */
function pickBg(value: number, min: number, max: number, scale: "diverging" | "sequential"): string {
  if (scale === "diverging") {
    if (value === 0) return "transparent";
    const range = Math.max(Math.abs(min), Math.abs(max));
    if (range === 0) return "transparent";
    const intensity = Math.min(1, Math.abs(value) / range);
    const alpha = 0.08 + intensity * 0.45;
    if (value > 0) return `rgba(16, 185, 129, ${alpha})`; // emerald
    return `rgba(239, 68, 68, ${alpha})`; // red
  }
  // sequential: chart-1 ramp
  if (max === min) return "transparent";
  const intensity = (value - min) / (max - min);
  const alpha = 0.08 + intensity * 0.55;
  return `rgba(59, 130, 246, ${alpha})`; // blue
}

/**
 * Discrete × discrete colour-coded matrix primitive.
 *
 * Replaces ad-hoc per-widget heatmap implementations like
 * `defi-funding-matrix-widget.tsx` and `monthly-returns-heatmap.tsx`. New
 * widgets that need a categorical matrix layout MUST consume this primitive
 * — see DART cross-asset-group market-data terminal plan P0.3.
 *
 * Cross-asset-group use cases:
 *  - funding rate matrix (rows=asset, cols=venue, cells=funding rate)
 *  - sector heatmap (rows=sector, cols=time bucket, cells=%change)
 *  - sports CLV-by-book (rows=book, cols=sport, cells=CLV)
 *  - monthly returns (rows=year, cols=month, cells=return)
 */
export function CategoricalMatrix<R extends string = string, C extends string = string>({
  rows,
  cols,
  cells,
  scale = "diverging",
  format = defaultFormat,
  rowLabel,
  colLabel,
  className,
  cellClassName,
  onCellClick,
}: CategoricalMatrixProps<R, C>) {
  const { min, max } = React.useMemo(() => {
    let mn = Number.POSITIVE_INFINITY;
    let mx = Number.NEGATIVE_INFINITY;
    for (const r of rows) {
      const rowCells = cells[r];
      if (!rowCells) continue;
      for (const c of cols) {
        const cell = rowCells[c];
        if (!cell || cell.value == null) continue;
        if (cell.value < mn) mn = cell.value;
        if (cell.value > mx) mx = cell.value;
      }
    }
    if (!Number.isFinite(mn)) mn = 0;
    if (!Number.isFinite(mx)) mx = 0;
    return { min: mn, max: mx };
  }, [rows, cols, cells]);

  return (
    <div className={cn("w-full overflow-auto", className)}>
      <table className="border-collapse text-[11px] tabular-nums font-mono">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-background px-2 py-1 text-left font-semibold text-muted-foreground/80">
              {rowLabel && colLabel ? `${rowLabel} ↓ / ${colLabel} →` : (rowLabel ?? colLabel ?? "")}
            </th>
            {cols.map((c) => (
              <th key={c} className="px-2 py-1 text-center font-semibold text-muted-foreground/80 whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const rowCells = cells[r];
            return (
              <tr key={r}>
                <td className="sticky left-0 z-10 bg-background px-2 py-1 text-left font-medium text-foreground/85 whitespace-nowrap">
                  {r}
                </td>
                {cols.map((c) => {
                  const cell = rowCells?.[c];
                  if (!cell || cell.value == null) {
                    return (
                      <td key={c} className={cn("px-2 py-1 text-center text-muted-foreground/40", cellClassName)}>
                        —
                      </td>
                    );
                  }
                  const bg = pickBg(cell.value, min, max, scale);
                  const isInteractive = !!onCellClick;
                  return (
                    <td
                      key={c}
                      style={{ backgroundColor: bg }}
                      className={cn(
                        "px-2 py-1 text-center transition-colors",
                        isInteractive && "cursor-pointer hover:ring-1 hover:ring-primary/50",
                        cellClassName,
                      )}
                      onClick={isInteractive ? () => onCellClick(r, c, cell) : undefined}
                      title={cell.label ?? format(cell.value)}
                    >
                      {cell.label ?? format(cell.value)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
