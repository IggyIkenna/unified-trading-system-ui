"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Download, Grid3X3 } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

export interface DimensionDef {
  key: string;
  label: string;
  values: string[];
}

export interface MetricDef {
  key: string;
  label: string;
  format?: "number" | "currency" | "percent" | "decimal";
  colorize?: boolean;
}

interface DimensionalGridProps<T extends Record<string, unknown>> {
  data: T[];
  dimensions: DimensionDef[];
  metrics: MetricDef[];
  pinnedDimensions?: Record<string, string[]>;
  onDimensionPin?: (dimension: string, values: string[]) => void;
  onSort?: (metric: string, direction: "asc" | "desc") => void;
  onRowSelect?: (rowIds: string[]) => void;
  onRowClick?: (rowId: string) => void;
  enableSelection?: boolean;
  enableHeatmap?: boolean;
  enableExport?: boolean;
  selectionToolbar?: (selectedIds: string[]) => React.ReactNode;
  rowKey?: keyof T;
  className?: string;
}

export function DimensionalGrid<T extends Record<string, unknown>>({
  data,
  dimensions,
  metrics,
  pinnedDimensions = {},
  onDimensionPin,
  onSort,
  onRowSelect,
  onRowClick,
  enableSelection = true,
  enableHeatmap = false,
  enableExport = true,
  selectionToolbar,
  rowKey = "id" as keyof T,
  className,
}: DimensionalGridProps<T>) {
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");
  const [showHeatmap, setShowHeatmap] = React.useState(enableHeatmap);

  // Filter data based on pinned dimensions
  const filteredData = React.useMemo(() => {
    return data.filter((row) => {
      return Object.entries(pinnedDimensions).every(([dim, values]) => {
        if (!values || values.length === 0) return true;
        return values.includes(String(row[dim]));
      });
    });
  }, [data, pinnedDimensions]);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = Number(a[sortColumn]) || 0;
      const bVal = Number(b[sortColumn]) || 0;
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    const newDirection = sortColumn === column && sortDirection === "desc" ? "asc" : "desc";
    setSortColumn(column);
    setSortDirection(newDirection);
    onSort?.(column, newDirection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = sortedData.map((row) => String(row[rowKey]));
      setSelectedRows(new Set(allIds));
      onRowSelect?.(allIds);
    } else {
      setSelectedRows(new Set());
      onRowSelect?.([]);
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
    onRowSelect?.(Array.from(newSelected));
  };

  const formatMetric = (value: unknown, format?: string) => {
    const num = Number(value);
    if (isNaN(num)) return String(value);

    switch (format) {
      case "currency":
        if (num >= 1_000_000) return `$${formatNumber(num / 1_000_000, 2)}m`;
        if (num >= 1_000) return `$${formatNumber(num / 1_000, 1)}k`;
        return `$${formatNumber(num, 2)}`;
      case "percent":
        return `${formatPercent(num, 2)}`;
      case "decimal":
        return formatNumber(num, 2);
      default:
        return num.toLocaleString();
    }
  };

  const getHeatmapColor = (value: number, metric: MetricDef) => {
    if (!showHeatmap || !metric.colorize) return undefined;
    // Simple heatmap: green for positive, red for negative
    if (value > 0) return `rgba(74, 222, 128, ${Math.min(value / 100, 0.3)})`;
    if (value < 0) return `rgba(248, 113, 113, ${Math.min(Math.abs(value) / 100, 0.3)})`;
    return undefined;
  };

  const handleExport = () => {
    const headers = [...dimensions.map((d) => d.label), ...metrics.map((m) => m.label)];
    const rows = sortedData.map((row) => [
      ...dimensions.map((d) => String(row[d.key])),
      ...metrics.map((m) => String(row[m.key])),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grid-export.csv";
    a.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">
            Showing {sortedData.length} of {data.length}
          </span>
          {dimensions.map((dim) => (
            <DropdownMenu key={dim.key}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  {dim.label}
                  {pinnedDimensions[dim.key]?.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {pinnedDimensions[dim.key].length}
                    </Badge>
                  )}
                  <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-64 overflow-auto">
                {dim.values.map((value) => (
                  <DropdownMenuCheckboxItem
                    key={value}
                    checked={pinnedDimensions[dim.key]?.includes(value)}
                    onCheckedChange={(checked) => {
                      const current = pinnedDimensions[dim.key] || [];
                      const updated = checked ? [...current, value] : current.filter((v) => v !== value);
                      onDimensionPin?.(dim.key, updated);
                    }}
                  >
                    {value}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {enableHeatmap && (
            <Button
              variant={showHeatmap ? "secondary" : "outline"}
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setShowHeatmap(!showHeatmap)}
            >
              <Grid3X3 className="size-3.5" />
              Heatmap
            </Button>
          )}
          {enableExport && (
            <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleExport}>
              <Download className="size-3.5" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Selection Toolbar */}
      {selectedRows.size > 0 && selectionToolbar && (
        <div className="flex items-center gap-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">{selectedRows.size} selected</span>
          {selectionToolbar(Array.from(selectedRows))}
        </div>
      )}

      {/* Data Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {enableSelection && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedRows.size === sortedData.length && sortedData.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {dimensions.map((dim) => (
                <TableHead key={dim.key} className="font-semibold">
                  {dim.label}
                </TableHead>
              ))}
              {metrics.map((metric) => (
                <TableHead
                  key={metric.key}
                  className="font-semibold cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort(metric.key)}
                >
                  <div className="flex items-center gap-1">
                    {metric.label}
                    {sortColumn === metric.key ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="size-3.5" />
                      ) : (
                        <ArrowDown className="size-3.5" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3.5 opacity-50" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row) => {
              const id = String(row[rowKey]);
              const isSelected = selectedRows.has(id);

              return (
                <TableRow
                  key={id}
                  className={cn("cursor-pointer transition-colors", isSelected && "bg-primary/5")}
                  onClick={() => onRowClick?.(id)}
                >
                  {enableSelection && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={isSelected} onCheckedChange={() => handleSelectRow(id)} />
                    </TableCell>
                  )}
                  {dimensions.map((dim) => (
                    <TableCell key={dim.key} className="font-medium">
                      {String(row[dim.key])}
                    </TableCell>
                  ))}
                  {metrics.map((metric) => {
                    const value = Number(row[metric.key]) || 0;
                    return (
                      <TableCell
                        key={metric.key}
                        className="font-mono tabular-nums"
                        style={{
                          backgroundColor: getHeatmapColor(value, metric),
                        }}
                      >
                        <span
                          className={cn(
                            metric.colorize && (value > 0 ? "pnl-positive" : value < 0 ? "pnl-negative" : ""),
                          )}
                        >
                          {formatMetric(row[metric.key], metric.format)}
                        </span>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
