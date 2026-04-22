"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { ArrowRight, Clock, TrendingDown, TrendingUp } from "lucide-react";
import type { StrategyInstruction } from "@/lib/types/instructions";
import {
  getInstructionConfidenceColor,
  getInstructionOperationBadgeVariant,
  getInstructionSlippageColor,
  getInstructionStatusColor,
} from "@/lib/utils/instructions";
import { InstructionFillStatusIcon } from "./instruction-fill-status-icon";
import { InstructionDetailGrid } from "./instruction-detail-grid";
import { useInstructionsData } from "./instructions-data-context";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

export function InstructionPipelineRows({
  scrollClassName,
  fillHeight,
}: {
  scrollClassName?: string;
  /** When true, scroll area grows with the widget (no fixed max-height). */
  fillHeight?: boolean;
}) {
  const { filteredInstructions, selectedInstructionId, setSelectedInstructionId } = useInstructionsData();

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0">
      <div className="grid grid-cols-3 gap-0 border-b border-border shrink-0">
        <div className="px-3 py-1.5 bg-muted/30 text-caption font-medium text-muted-foreground uppercase tracking-wider">
          Signal
        </div>
        <div className="px-3 py-1.5 bg-muted/30 text-caption font-medium text-muted-foreground uppercase tracking-wider border-x border-border">
          Instruction
        </div>
        <div className="px-3 py-1.5 bg-muted/30 text-caption font-medium text-muted-foreground uppercase tracking-wider">
          Fill / Diff
        </div>
      </div>

      <WidgetScroll className={cn("min-h-0", fillHeight ? "flex-1" : (scrollClassName ?? "max-h-[600px]"))}>
        {filteredInstructions.map((inst) => (
          <InstructionPipelineRow
            key={inst.id}
            inst={inst}
            isSelected={selectedInstructionId === inst.id}
            onToggle={() => setSelectedInstructionId(selectedInstructionId === inst.id ? null : inst.id)}
          />
        ))}

        {filteredInstructions.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            No instructions match the current filters
          </div>
        )}
      </WidgetScroll>
    </div>
  );
}

function InstructionPipelineRow({
  inst,
  isSelected,
  onToggle,
}: {
  inst: StrategyInstruction;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const fillQtyPct = inst.fill ? (inst.fill.fillQty / inst.instruction.quantity) * 100 : 0;

  return (
    <div>
      <div
        className={cn(
          "grid grid-cols-3 gap-0 border-b border-border cursor-pointer hover:bg-muted/20 transition-colors",
          isSelected && "bg-muted/30",
        )}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="px-3 py-2.5 space-y-1">
          <div className="flex items-center gap-1.5">
            {inst.signal.direction === "LONG" || inst.signal.direction === "BACK" || inst.signal.direction === "YES" ? (
              <TrendingUp className="size-3 text-emerald-500" />
            ) : inst.signal.direction === "SHORT" ? (
              <TrendingDown className="size-3 text-rose-500" />
            ) : (
              <ArrowRight className="size-3 text-muted-foreground" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                inst.signal.direction === "LONG" || inst.signal.direction === "BACK" || inst.signal.direction === "YES"
                  ? "text-emerald-400"
                  : inst.signal.direction === "SHORT"
                    ? "text-rose-400"
                    : "text-muted-foreground",
              )}
            >
              {inst.signal.direction}
            </span>
            <span className={cn("text-caption font-mono", getInstructionConfidenceColor(inst.signal.confidence))}>
              {formatPercent(inst.signal.confidence * 100, 0)}
            </span>
          </div>
          <div className="text-caption text-muted-foreground font-mono truncate" title={inst.strategyId}>
            {inst.strategyId}
          </div>
          <Badge variant="outline" className="text-nano px-1 py-0">
            {inst.strategyType}
          </Badge>
        </div>

        <div className="px-3 py-2.5 space-y-1 border-x border-border">
          <div className="flex items-center gap-1.5">
            <Badge
              variant={getInstructionOperationBadgeVariant(inst.instruction.operationType)}
              className="text-nano px-1.5 py-0"
            >
              {inst.instruction.operationType}
            </Badge>
            <span
              className={cn(
                "text-xs font-medium",
                inst.instruction.side === "BUY" ? "text-emerald-400" : "text-rose-400",
              )}
            >
              {inst.instruction.side}
            </span>
          </div>
          <div className="text-xs font-mono">
            {inst.instruction.quantity.toLocaleString()} @ $
            {inst.instruction.price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
          <div className="text-caption text-muted-foreground">{inst.instruction.venue}</div>
        </div>

        <div className="px-3 py-2.5 space-y-1">
          {inst.fill ? (
            <>
              <div className="flex items-center gap-1.5">
                <InstructionFillStatusIcon status={inst.fill.status} />
                <span className={cn("text-xs font-medium", getInstructionStatusColor(inst.fill.status))}>
                  {inst.fill.status}
                </span>
              </div>
              <div className="text-xs font-mono">
                {inst.fill.fillQty.toLocaleString()} @ $
                {inst.fill.fillPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-caption font-mono", getInstructionSlippageColor(inst.fill.slippageBps))}>
                  {inst.fill.slippageBps > 0 ? "+" : ""}
                  {formatNumber(inst.fill.slippageBps, 1)} bps
                </span>
                {fillQtyPct < 100 && (
                  <span className="text-caption text-amber-400 font-mono">{formatPercent(fillQtyPct, 0)} filled</span>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5 animate-pulse" />
              Pending...
            </div>
          )}
        </div>
      </div>

      {isSelected && (
        <div className="bg-muted/20 border-b border-border px-4 py-3">
          <InstructionDetailGrid inst={inst} />
        </div>
      )}
    </div>
  );
}
