"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  /** Accessor — string key on T or a render function */
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
  /** Minimum column width in px */
  minWidth?: number;
}

interface DataTableWidgetProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Unique key extractor per row */
  rowKey: (row: T, index: number) => string;
  /** Optional per-row class (e.g. highlight) */
  getRowClassName?: (row: T) => string | undefined;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Whether to show a compact variant with smaller font + padding */
  compact?: boolean;
  /** If provided, shown when data is empty */
  emptyMessage?: string;
  /** When true, the first column is sticky on horizontal scroll */
  stickyFirstColumn?: boolean;
  className?: string;
}

type SortDir = "asc" | "desc" | null;

export function DataTableWidget<T>({
  columns,
  data,
  rowKey,
  getRowClassName,
  onRowClick,
  compact = true,
  emptyMessage = "No data",
  stickyFirstColumn = false,
  className,
}: DataTableWidgetProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDir>(null);

  const handleSort = React.useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((prev) => (prev === "asc" ? "desc" : prev === "desc" ? null : "asc"));
        if (sortDir === "desc") setSortKey(null);
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey, sortDir],
  );

  const sorted = React.useMemo(() => {
    if (!sortKey || !sortDir) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;
    return [...data].sort((a, b) => {
      const av = typeof col.accessor === "function" ? "" : a[col.accessor];
      const bv = typeof col.accessor === "function" ? "" : b[col.accessor];
      const aStr = String(av ?? "");
      const bStr = String(bv ?? "");
      const aNum = Number(aStr);
      const bNum = Number(bStr);
      const result = !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : aStr.localeCompare(bStr);
      return sortDir === "desc" ? -result : result;
    });
  }, [data, columns, sortKey, sortDir]);

  const cellPadding = compact ? "px-2 py-1" : "px-3 py-2";
  const fontSize = compact ? "text-[11px]" : "text-xs";

  return (
    <WidgetScroll axes="both" className={className}>
      <Table>
        <TableHeader>
          <TableRow className="border-border/50">
            {columns.map((col, colIdx) => (
              <TableHead
                key={col.key}
                className={cn(
                  cellPadding,
                  fontSize,
                  "font-medium text-muted-foreground whitespace-nowrap",
                  col.sortable && "cursor-pointer select-none hover:text-foreground",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  stickyFirstColumn && colIdx === 0 && "sticky left-0 z-10 bg-card/95 shadow-[1px_0_0_0] shadow-border/50",
                  col.headerClassName,
                )}
                style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key && sortDir === "asc" && <ArrowUp className="size-2.5" />}
                  {col.sortable && sortKey === col.key && sortDir === "desc" && <ArrowDown className="size-2.5" />}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-6 text-xs">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((row, idx) => (
              <TableRow
                key={rowKey(row, idx)}
                className={cn(
                  "border-border/30",
                  onRowClick && "cursor-pointer hover:bg-muted/30",
                  getRowClassName?.(row),
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col, colIdx) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      cellPadding,
                      fontSize,
                      "font-mono whitespace-nowrap",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      stickyFirstColumn && colIdx === 0 && "sticky left-0 z-10 bg-card/95 shadow-[1px_0_0_0] shadow-border/50",
                      col.className,
                    )}
                  >
                    {typeof col.accessor === "function" ? col.accessor(row) : String(row[col.accessor] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </WidgetScroll>
  );
}
