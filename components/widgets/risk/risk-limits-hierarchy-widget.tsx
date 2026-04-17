"use client";

import * as React from "react";
import type { WidgetComponentProps } from "../widget-registry";
import { useRiskData, getUtilization, getStatusFromUtil, formatCurrency, type RiskLimit } from "./risk-data-context";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableWidget } from "@/components/shared/table-widget";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CollapsibleSection } from "@/components/shared";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import type { ColumnDef } from "@tanstack/react-table";

function fmtVal(v: number, u: string): string {
  if (u === "$") return `$${formatNumber(v / 1_000_000, 2)}m`;
  if (u === "%") return `${v}%`;
  if (u === "x") return `${v}x`;
  return formatNumber(v, 2);
}

const detailColumns: ColumnDef<RiskLimit, unknown>[] = [
  {
    accessorKey: "entityType",
    header: "Level",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="text-[11px] capitalize text-muted-foreground">{row.getValue<string>("entityType")}</span>
    ),
  },
  {
    accessorKey: "entity",
    header: "Entity",
    enableSorting: true,
    cell: ({ row }) => <span className="text-[11px] font-medium">{row.getValue<string>("entity")}</span>,
  },
  {
    accessorKey: "name",
    header: "Type",
    enableSorting: true,
    cell: ({ row }) => <span className="text-[11px]">{row.getValue<string>("name")}</span>,
  },
  {
    accessorKey: "value",
    header: () => <span className="flex justify-end">Value</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-[11px] text-right font-mono tabular-nums">
        {fmtVal(row.original.value, row.original.unit)}
      </div>
    ),
  },
  {
    accessorKey: "limit",
    header: () => <span className="flex justify-end">Limit</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-[11px] text-right font-mono tabular-nums text-muted-foreground">
        {fmtVal(row.original.limit, row.original.unit)}
      </div>
    ),
  },
  {
    id: "utilization",
    header: () => <span className="flex justify-end">Util</span>,
    enableSorting: false,
    cell: ({ row }) => {
      const util = getUtilization(row.original.value, row.original.limit);
      return <div className="text-[11px] text-right font-mono tabular-nums">{formatPercent(util, 0)}</div>;
    },
  },
  {
    id: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => {
      const util = getUtilization(row.original.value, row.original.limit);
      return <StatusBadge status={getStatusFromUtil(util)} showDot={true} />;
    },
  },
];

export function RiskLimitsHierarchyWidget(_props: WidgetComponentProps) {
  const { riskLimits, sortedLimits, selectedNode, setSelectedNode, isLoading, hasError } = useRiskData();

  const selectedHierarchyNode = selectedNode ? riskLimits.find((l) => l.entity === selectedNode) : null;

  if (isLoading) {
    return (
      <div className="space-y-1.5 p-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded" />
        ))}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Failed to load risk limits
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Hierarchy tree (domain-specific indented rendering) */}
      <div className="space-y-2 p-1 shrink-0">
        {selectedNode && selectedHierarchyNode && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20 text-xs">
            <span className="font-medium">Scope:</span>
            <div className="flex items-center gap-1 text-muted-foreground">
              {riskLimits
                .filter((l) => l.level < selectedHierarchyNode.level)
                .slice(0, selectedHierarchyNode.level)
                .map((parent) => (
                  <React.Fragment key={parent.id}>
                    <span>{parent.entity}</span>
                    <ChevronRight className="size-2.5" />
                  </React.Fragment>
                ))}
              <span className="font-medium text-foreground">{selectedNode}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-5 px-1.5 text-[10px]"
              onClick={() => setSelectedNode(null)}
            >
              <X className="size-2.5 mr-0.5" />
              Clear
            </Button>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-[10px]">Entity</TableHead>
              <TableHead className="text-[10px]">Level</TableHead>
              <TableHead className="text-[10px] text-right">Exposure</TableHead>
              <TableHead className="text-[10px] text-right">VaR 95%</TableHead>
              <TableHead className="text-[10px] text-right">Util</TableHead>
              <TableHead className="text-[10px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {riskLimits.slice(0, 6).map((limit) => {
              const util = getUtilization(limit.value, limit.limit);
              const status = getStatusFromUtil(util);
              const indent = limit.level * 12;
              const isLeaf = limit.level === 5;
              const isSelected = selectedNode === limit.entity;

              return (
                <TableRow
                  key={limit.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50",
                    isSelected && "bg-primary/5 border-l-2 border-primary",
                  )}
                  onClick={() => setSelectedNode(isSelected ? null : limit.entity)}
                >
                  <TableCell>
                    <div className="flex items-center text-[11px]" style={{ paddingLeft: `${indent}px` }}>
                      {limit.level > 0 && <span className="text-muted-foreground mr-1">└</span>}
                      <span className={cn("font-medium", isLeaf && "text-muted-foreground")}>{limit.entity}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[11px] capitalize text-muted-foreground">{limit.entityType}</TableCell>
                  <TableCell className="text-[11px] text-right font-mono tabular-nums">
                    {formatCurrency(limit.value)}
                  </TableCell>
                  <TableCell className="text-[11px] text-right font-mono tabular-nums text-muted-foreground">
                    {limit.var95 ? formatCurrency(limit.var95) : "—"}
                  </TableCell>
                  <TableCell className="text-[11px] text-right font-mono tabular-nums">
                    {formatPercent(util, 0)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={status} showDot={true} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* All Limits Detail — flat table via TableWidget */}
      <CollapsibleSection title="All Limits Detail" defaultOpen={false} count={sortedLimits.length}>
        <TableWidget
          columns={detailColumns}
          data={sortedLimits}
          isLoading={isLoading}
          error={hasError ? "Failed to load risk limits" : null}
          enableSorting
          enableColumnVisibility={false}
          emptyMessage="No limits available"
        />
      </CollapsibleSection>
    </div>
  );
}
