"use client";

import {
  type Column,
  type ColumnDef,
  type OnChangeFn,
  type RowData,
  type SortingState,
  type Table as TanstackTable,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, ArrowUpDown, Columns } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Column type metadata
// ---------------------------------------------------------------------------

/**
 * Semantic type for a column's data. Set via `meta: { type: "number" }` on a ColumnDef.
 *
 * DataTable uses this to automatically:
 *   - Align headers and cells (numeric types → right; text/badge/datetime → left)
 *   - Apply monospace + tabular-nums to numeric and datetime cells
 *   - Place the sort icon on the correct side (left of text for right-aligned columns)
 *   - Exclude "actions" columns from the column-visibility toggle
 */
export type ColumnDataType =
  | "text" //     string data              — left-aligned
  | "number" //   numeric value             — right-aligned, mono, tabular-nums
  | "currency" // monetary value ($)        — right-aligned, mono, tabular-nums
  | "percent" //  percentage (%)            — right-aligned, mono, tabular-nums
  | "datetime" // date / time              — left-aligned, mono
  | "badge" //    status label / pill       — left-aligned
  | "actions"; // buttons / controls       — not sortable, excluded from visibility toggle

// Augment TanStack's ColumnMeta so every ColumnDef gains a strongly-typed `meta.type`.
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Declares the semantic data type; drives automatic alignment in DataTable. */
    type?: ColumnDataType;
    /** Allow arbitrary extra per-column metadata (e.g. className, width). */
    [key: string]: unknown;
  }
}

const NUMERIC_TYPES = new Set<ColumnDataType>(["number", "currency", "percent"]);
const MONO_TYPES = new Set<ColumnDataType>(["number", "currency", "percent", "datetime"]);

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  enableSorting?: boolean;
  enableColumnVisibility?: boolean;
  /** When true, the internal Columns toggle is hidden (render it externally via controlled columnVisibility). */
  hideColumnToggle?: boolean;
  /** Called once the tanstack table instance is created. */
  onTableReady?: (table: TanstackTable<TData>) => void;
  /**
   * Controlled column visibility state. When provided alongside onColumnVisibilityChange,
   * the parent owns the state — DataTable uses it as-is.
   */
  columnVisibility?: VisibilityState;
  /** Called when column visibility changes (pair with columnVisibility). */
  onColumnVisibilityChange?: (v: VisibilityState) => void;
  enableVirtualization?: boolean;
  virtualRowHeight?: number;
  className?: string;
  emptyMessage?: string;
  /** Rendered after `<tbody>` (e.g. `<TableFooter><TableRow>…</TableRow></TableFooter>`). */
  tableFooter?: React.ReactNode;
}

function DataTable<TData>({
  columns,
  data,
  enableSorting = true,
  enableColumnVisibility = true,
  hideColumnToggle = false,
  onTableReady,
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange: externalOnColumnVisibilityChange,
  enableVirtualization = false,
  virtualRowHeight = 35,
  className,
  emptyMessage = "No results.",
  tableFooter,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<VisibilityState>({});

  // When controlled props are provided the parent owns the state; otherwise use internal state.
  const columnVisibilityState = externalColumnVisibility ?? internalColumnVisibility;

  const handleVisibilityChange: OnChangeFn<VisibilityState> = React.useCallback(
    (updater) => {
      const next = typeof updater === "function" ? updater(columnVisibilityState) : updater;
      if (externalOnColumnVisibilityChange) {
        externalOnColumnVisibilityChange(next);
      } else {
        setInternalColumnVisibility(next);
      }
    },
    [columnVisibilityState, externalOnColumnVisibilityChange],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility: columnVisibilityState },
    onSortingChange: setSorting,
    onColumnVisibilityChange: handleVisibilityChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    enableSorting,
  });

  const { rows } = table.getRowModel();

  const onTableReadyRef = React.useRef(onTableReady);
  onTableReadyRef.current = onTableReady;
  React.useEffect(() => {
    onTableReadyRef.current?.(table);
  }, [table]);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => virtualRowHeight,
    enabled: enableVirtualization,
    overscan: 20,
  });

  // ---------------------------------------------------------------------------
  // Sort icon (shared between header cells)
  // ---------------------------------------------------------------------------
  function SortIcon({ column }: { column: Column<TData, unknown> }) {
    const sorted = column.getIsSorted();
    if (sorted === "asc") return <ArrowUp className="size-3.5 shrink-0" />;
    if (sorted === "desc") return <ArrowDown className="size-3.5 shrink-0" />;
    return <ArrowUpDown className="size-3.5 shrink-0 opacity-40" />;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className={cn("w-full space-y-2", className)}>
      {enableColumnVisibility && !hideColumnToggle && (
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="size-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize"
                    checked={columnVisibilityState[col.id] !== false}
                    onCheckedChange={(value) => handleVisibilityChange({ ...columnVisibilityState, [col.id]: !!value })}
                  >
                    {col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className={cn("rounded-md border", enableVirtualization && "max-h-[600px] overflow-auto")}
      >
        <Table containerClassName="overflow-x-visible">
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers
                  .filter((header) => columnVisibilityState[header.column.id] !== false)
                  .map((header) => {
                    const colType = header.column.columnDef.meta?.type;
                    const numeric = NUMERIC_TYPES.has(colType as ColumnDataType);
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center w-full",
                              header.column.getCanSort() && "cursor-pointer select-none",
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {/*
                             * The inner div always has flex-1 so it fills the full cell width —
                             * this is what keeps header text vertically aligned with cell data.
                             *
                             * The sort icon lives INSIDE this div, right next to the label:
                             *
                             * Text columns (left-aligned):
                             *   DOM + visual: [label][↕] ────────── (both at left edge)
                             *
                             * Numeric columns (right-aligned, flex-row-reverse):
                             *   DOM:    [label][↕]
                             *   Visual: ────────── [↕][label]       (both at right edge)
                             */}
                            <div
                              className={cn("flex-1 min-w-0 flex items-center gap-1", numeric && "flex-row-reverse")}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && (
                                <SortIcon column={header.column as Parameters<typeof SortIcon>[0]["column"]} />
                              )}
                            </div>
                          </div>
                        )}
                      </TableHead>
                    );
                  })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : enableVirtualization ? (
              <>
                {virtualizer.getVirtualItems().length > 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      style={{
                        height: `${virtualizer.getVirtualItems()[0]?.start ?? 0}px`,
                        padding: 0,
                        border: "none",
                      }}
                    />
                  </tr>
                )}
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  if (!row) return null;
                  return (
                    <TableRow
                      key={row.id}
                      data-index={virtualRow.index}
                      data-state={row.getIsSelected() ? "selected" : undefined}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const ct = cell.column.columnDef.meta?.type;
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              NUMERIC_TYPES.has(ct as ColumnDataType) && "text-right tabular-nums",
                              MONO_TYPES.has(ct as ColumnDataType) && "font-mono",
                            )}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
                {virtualizer.getVirtualItems().length > 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      style={{
                        height: `${virtualizer.getTotalSize() - (virtualizer.getVirtualItems().at(-1)?.end ?? 0)}px`,
                        padding: 0,
                        border: "none",
                      }}
                    />
                  </tr>
                )}
              </>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell) => {
                    const ct = cell.column.columnDef.meta?.type;
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          NUMERIC_TYPES.has(ct as ColumnDataType) && "text-right tabular-nums",
                          MONO_TYPES.has(ct as ColumnDataType) && "font-mono",
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
          {tableFooter}
        </Table>
      </div>
    </div>
  );
}

export { DataTable, type DataTableProps };
