"use client";

import { cn } from "@/lib/utils";
import type { StrategyInstruction } from "@/lib/types/instructions";
import {
  formatInstructionTimestamp,
  getInstructionConfidenceColor,
  getInstructionSlippageColor,
} from "@/lib/utils/instructions";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

export function InstructionDetailGrid({ inst }: { inst: StrategyInstruction }) {
  return (
    <div className="grid grid-cols-3 gap-4 text-xs">
      <div className="space-y-1">
        <p className="text-caption text-muted-foreground uppercase tracking-wider">Signal Detail</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          <span className="text-muted-foreground">Time</span>
          <span className="font-mono">{formatInstructionTimestamp(inst.signal.timestamp)}</span>
          <span className="text-muted-foreground">Direction</span>
          <span className="font-medium">{inst.signal.direction}</span>
          <span className="text-muted-foreground">Confidence</span>
          <span className={cn("font-mono", getInstructionConfidenceColor(inst.signal.confidence))}>
            {formatPercent(inst.signal.confidence * 100, 1)}
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-caption text-muted-foreground uppercase tracking-wider">Instruction Detail</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          <span className="text-muted-foreground">Op Type</span>
          <span className="font-mono">{inst.instruction.operationType}</span>
          <span className="text-muted-foreground">Notional</span>
          <span className="font-mono">
            $
            {(inst.instruction.quantity * inst.instruction.price).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </span>
          <span className="text-muted-foreground">Venue</span>
          <span>{inst.instruction.venue}</span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-caption text-muted-foreground uppercase tracking-wider">Discrepancy</p>
        {inst.fill ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <span className="text-muted-foreground">Price Diff</span>
            <span className={cn("font-mono", getInstructionSlippageColor(inst.fill.slippageBps))}>
              ${formatNumber(inst.fill.fillPrice - inst.instruction.price, 2)}
            </span>
            <span className="text-muted-foreground">Qty Diff</span>
            <span
              className={cn(
                "font-mono",
                inst.fill.fillQty < inst.instruction.quantity ? "text-amber-400" : "text-emerald-400",
              )}
            >
              {(inst.fill.fillQty - inst.instruction.quantity).toLocaleString()}
            </span>
            <span className="text-muted-foreground">Slippage</span>
            <span className={cn("font-mono", getInstructionSlippageColor(inst.fill.slippageBps))}>
              {formatNumber(inst.fill.slippageBps, 1)} bps
            </span>
          </div>
        ) : (
          <p className="text-muted-foreground italic">No fill yet</p>
        )}
      </div>
    </div>
  );
}
