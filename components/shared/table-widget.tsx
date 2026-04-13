"use client";

import { DataFreshness } from "@/components/shared/data-freshness";
import { DataTable } from "@/components/shared/data-table";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { LiveFeedWidget } from "@/components/shared/live-feed-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ExportColumn } from "@/lib/utils/export";
import type { ColumnDef, Table as TanstackTable } from "@tanstack/react-table";
import { ChevronDown, Columns, RefreshCw, RotateCcw, Search } from "lucide-react";
import * as React from "react";

// ---------------------------------------------------------------------------
// Public types — re-exported so child widgets can import from one place
// ---------------------------------------------------------------------------

/** A single dropdown (select) filter shown in the toolbar. */
export interface TableSelectFilter {
  value: string;
  onChange: (v: string) => void;
  /** Placeholder shown on the trigger button. */
  placeholder: string;
  /** Label for the "show all" option, e.g. "All Venues". */
  allLabel: string;
  /** Tailwind width class for the trigger. Defaults to "w-32". */
  width?: string;
  /** Non-empty options only — the component skips empty-string values. */
  options: Array<{ value: string; label: string }>;
}

/** Multi-select asset-class checkbox popover. */
export interface TableAssetClassFilter {
  options: string[];
  active: string[];
  onToggle: (cls: string) => void;
  /** Label shown on the trigger when nothing is selected. Default: "Asset Class". */
  allLabel?: string;
}

/** All filter state provided by the child widget. */
export interface TableFilterConfig {
  search?: {
    query: string;
    onChange: (q: string) => void;
    placeholder?: string;
  };
  selectFilters?: TableSelectFilter[];
  assetClass?: TableAssetClassFilter;
  /** Number of active non-default filters — drives the Reset badge and button. */
  activeFilterCount?: number;
  onReset?: () => void;
}

/** Right-side toolbar actions. */
export interface TableActionsConfig {
  onRefresh?: () => void;
  /** Any JSX rendered left of the Refresh button (e.g. "View Strategy" link). */
  extraActions?: React.ReactNode;
  export?: {
    data: Record<string, unknown>[];
    columns: ExportColumn[];
    filename: string;
  };
  /** When provided, renders a DataFreshness badge left of Refresh. */
  dataFreshness?: {
    lastUpdated: Date;
    isWebSocket: boolean;
    isBatch: boolean;
  };
}

// ---------------------------------------------------------------------------
// TableWidget
// ---------------------------------------------------------------------------

interface TableWidgetProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  filterConfig?: TableFilterConfig;
  actions?: TableActionsConfig;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  /** Default true — renders column visibility toggle in the toolbar. */
  enableColumnVisibility?: boolean;
  enableSorting?: boolean;
  tableFooter?: React.ReactNode;
  className?: string;
}

function TableWidget<TData>({
  columns,
  data,
  filterConfig,
  actions,
  isLoading,
  error,
  onRetry,
  emptyMessage = "No results.",
  enableColumnVisibility = true,
  enableSorting = true,
  tableFooter,
  className,
}: TableWidgetProps<TData>) {
  const [tableInstance, setTableInstance] = React.useState<TanstackTable<TData> | null>(null);

  const { search, selectFilters, assetClass, activeFilterCount = 0, onReset } = filterConfig ?? {};

  const assetClassLabel =
    !assetClass || assetClass.active.length === 0
      ? (assetClass?.allLabel ?? "Asset Class")
      : assetClass.active.length === 1
        ? assetClass.active[0]
        : `${assetClass.active.length} classes`;

  const hasFilters = !!search || (selectFilters && selectFilters.length > 0) || !!assetClass;

  const hasRightActions =
    !!actions?.extraActions ||
    !!actions?.dataFreshness ||
    !!actions?.onRefresh ||
    (enableColumnVisibility && !!tableInstance) ||
    !!actions?.export;

  const toolbar = (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/40 bg-muted/10 overflow-x-auto min-w-0">
      {/* ── Left: filter controls ── */}

      {search && (
        <div className="relative shrink-0">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search.query}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder ?? "Search…"}
            className="h-7 pl-7 pr-2 text-xs w-40"
          />
        </div>
      )}

      {selectFilters?.map((f, idx) => (
        <Select key={idx} value={f.value} onValueChange={f.onChange}>
          <SelectTrigger className={cn("h-7 text-xs shrink-0", f.width ?? "w-32")}>
            <SelectValue placeholder={f.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{f.allLabel}</SelectItem>
            {f.options
              .filter((o) => o.value)
              .map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      ))}

      {assetClass && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-7 gap-1 text-xs shrink-0",
                assetClass.active.length > 0 && "border-primary/50 text-primary",
              )}
            >
              {assetClassLabel}
              <ChevronDown className="size-3 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3" align="start">
            <p className="text-[10px] text-muted-foreground mb-2 font-medium">Asset class</p>
            <div className="space-y-1.5">
              {assetClass.options.map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <Checkbox
                    id={`tw-asset-${opt}`}
                    checked={assetClass.active.includes(opt)}
                    onCheckedChange={() => assetClass.onToggle(opt)}
                  />
                  <Label htmlFor={`tw-asset-${opt}`} className="text-xs font-normal cursor-pointer">
                    {opt}
                  </Label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {onReset && activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-muted-foreground shrink-0"
          onClick={onReset}
        >
          <RotateCcw className="size-3" />
          Reset ({activeFilterCount})
        </Button>
      )}

      {/* ── Spacer — only needed when both sides have content ── */}
      {(hasFilters || hasRightActions) && <div className="flex-1 min-w-2" />}

      {/* ── Right: action controls ── */}

      {actions?.extraActions}

      {actions?.dataFreshness && (
        <DataFreshness
          lastUpdated={actions.dataFreshness.lastUpdated}
          isWebSocket={actions.dataFreshness.isWebSocket}
          isBatch={actions.dataFreshness.isBatch}
        />
      )}

      {actions?.onRefresh && (
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs shrink-0" onClick={actions.onRefresh}>
          <RefreshCw className="size-3" />
          Refresh
        </Button>
      )}

      {enableColumnVisibility && tableInstance && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs shrink-0">
              <Columns className="size-3.5" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {tableInstance
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize text-xs"
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(!!v)}
                >
                  {col.id.replace(/_/g, " ")}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {actions?.export && (
        <ExportDropdown
          data={actions.export.data}
          columns={actions.export.columns}
          filename={actions.export.filename}
        />
      )}
    </div>
  );

  return (
    <LiveFeedWidget isLoading={isLoading} error={error} onRetry={onRetry} header={toolbar} className={className}>
      <Card className="border-0 rounded-none h-full">
        <CardContent className="p-0 overflow-x-auto">
          <DataTable
            columns={columns}
            data={data}
            enableSorting={enableSorting}
            enableColumnVisibility={enableColumnVisibility}
            hideColumnToggle
            onTableReady={(t) => setTableInstance(t as TanstackTable<TData>)}
            emptyMessage={emptyMessage}
            tableFooter={tableFooter}
          />
        </CardContent>
      </Card>
    </LiveFeedWidget>
  );
}

export { TableWidget };
export type { TableWidgetProps };
