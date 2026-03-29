"use client";

import * as React from "react";
import type { WidgetComponentProps } from "../widget-registry";
import { useRiskData, getUtilization, getStatusFromUtil, formatCurrency } from "./risk-data-context";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { CollapsibleSection } from "@/components/shared";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

export function RiskLimitsHierarchyWidget(_props: WidgetComponentProps) {
  const { riskLimits, sortedLimits, selectedNode, setSelectedNode } = useRiskData();

  const selectedHierarchyNode = selectedNode ? riskLimits.find((l) => l.entity === selectedNode) : null;

  return (
    <WidgetScroll axes="vertical">
      <div className="space-y-2 p-1">
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

        <CollapsibleSection title="All Limits Detail" defaultOpen={false} count={sortedLimits.length}>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-[10px]">Level</TableHead>
                <TableHead className="text-[10px]">Entity</TableHead>
                <TableHead className="text-[10px]">Type</TableHead>
                <TableHead className="text-[10px] text-right">Value</TableHead>
                <TableHead className="text-[10px] text-right">Limit</TableHead>
                <TableHead className="text-[10px] text-right">Util</TableHead>
                <TableHead className="text-[10px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLimits.map((limit) => {
                const util = getUtilization(limit.value, limit.limit);
                const status = getStatusFromUtil(util);
                const fmtVal = (v: number, u: string) => {
                  if (u === "$") return `$${formatNumber(v / 1_000_000, 2)}m`;
                  if (u === "%") return `${v}%`;
                  if (u === "x") return `${v}x`;
                  return formatNumber(v, 2);
                };
                return (
                  <TableRow key={limit.id}>
                    <TableCell className="text-[11px] capitalize text-muted-foreground">{limit.entityType}</TableCell>
                    <TableCell className="text-[11px] font-medium">{limit.entity}</TableCell>
                    <TableCell className="text-[11px]">{limit.name}</TableCell>
                    <TableCell className="text-[11px] text-right font-mono tabular-nums">
                      {fmtVal(limit.value, limit.unit)}
                    </TableCell>
                    <TableCell className="text-[11px] text-right font-mono tabular-nums text-muted-foreground">
                      {fmtVal(limit.limit, limit.unit)}
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
        </CollapsibleSection>
      </div>
    </WidgetScroll>
  );
}
