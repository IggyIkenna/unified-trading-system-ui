"use client";

/**
 * DeFi Rebalance Preview Dialog — shows proposed capital movements per strategy
 * with instruction breakdown before executing.
 *
 * Triggered from wallet summary when treasury deviates from target.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STRATEGY_DISPLAY_NAMES, type DeFiStrategyId, type RebalancePreview } from "@/lib/types/defi";

interface RebalanceDialogProps {
  preview: RebalancePreview;
  onConfirm: () => void;
  onCancel: () => void;
}

function formatUsd(val: number): string {
  const abs = Math.abs(val);
  const sign = val >= 0 ? "+" : "-";
  return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function DeFiRebalanceDialog({ preview, onConfirm, onCancel }: RebalanceDialogProps) {
  const isDeploying = preview.action === "deploy";
  const moveAmount = Math.abs(
    preview.treasury_balance_usd - (preview.total_aum_usd * preview.treasury_target_pct) / 100,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-lg bg-background p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Rebalance Preview</h3>
          <Badge className={isDeploying ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
            {isDeploying ? "Deploy Capital" : "Reduce Positions"}
          </Badge>
        </div>

        {/* Treasury Status */}
        <div className="mb-4 rounded-md bg-muted/50 p-3 text-sm">
          <div className="flex justify-between">
            <span>Treasury (current)</span>
            <span className="font-medium">
              {preview.treasury_current_pct}% — ${preview.treasury_balance_usd.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Treasury (target)</span>
            <span>{preview.treasury_target_pct}%</span>
          </div>
          <div className="mt-1 flex justify-between font-medium">
            <span>{isDeploying ? "Capital to deploy" : "Capital to withdraw"}</span>
            <span className={isDeploying ? "text-green-600" : "text-amber-600"}>${moveAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Per-Strategy Allocations */}
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-medium">Per-Strategy Allocation</h4>
          <div className="space-y-2">
            {preview.allocations.map((alloc) => {
              const displayName = STRATEGY_DISPLAY_NAMES[alloc.strategy_id as DeFiStrategyId] ?? alloc.strategy_id;
              const pct =
                preview.total_aum_usd > 0
                  ? (((alloc.current_balance_usd + alloc.proposed_change_usd) / preview.total_aum_usd) * 100).toFixed(1)
                  : "0";
              return (
                <div key={alloc.strategy_id} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div>
                    <div className="font-medium">{displayName}</div>
                    <div className="text-muted-foreground">
                      Current: ${alloc.current_balance_usd.toLocaleString()} → {pct}%
                    </div>
                  </div>
                  <div
                    className={`text-right font-mono font-medium ${alloc.proposed_change_usd >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatUsd(alloc.proposed_change_usd)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Execution Summary */}
        <div className="mb-4 rounded-md bg-muted/50 p-3 text-xs">
          <div className="flex justify-between">
            <span>Total instructions</span>
            <span className="font-medium">{preview.total_instructions}</span>
          </div>
          <div className="flex justify-between">
            <span>Estimated gas</span>
            <span className="font-medium text-red-600">~${preview.estimated_gas_usd.toFixed(2)}</span>
          </div>
          <div className="mt-1 text-muted-foreground">
            Each strategy will generate TRANSFER + operation-specific instructions. Review individual instructions after
            confirming.
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            className={isDeploying ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
          >
            {isDeploying ? "Deploy Capital" : "Reduce Positions"}
          </Button>
        </div>
      </div>
    </div>
  );
}
