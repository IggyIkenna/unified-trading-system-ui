"use client";

import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { FormWidget, useFormSubmit } from "@/components/shared/form-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useActiveStrategyId } from "@/hooks/use-active-strategy-id";
import {
  DEFI_ALGO_TYPES,
  DEFI_INSTRUCTION_TYPES,
  FLASH_VENUES,
  SLIPPAGE_OPTIONS,
} from "@/lib/config/services/defi.config";
import type { AlgoType, InstructionType } from "@/lib/types/defi";
import { INSTRUCTION_ALGO_MAP } from "@/lib/types/defi";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import { Fuel, Plus, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { useDeFiData } from "./defi-data-context";

export function DeFiFlashLoansWidget(_props: WidgetComponentProps) {
  const { flashSteps, addFlashStep, removeFlashStep, updateFlashStep, flashPnl, executeDeFiOrder, swapTokens } =
    useDeFiData();
  const { isSubmitting, error, clearError, handleSubmit } = useFormSubmit();
  const activeStrategyId = useActiveStrategyId();

  // Context is synchronous (mock) so isLoading is always false;
  // retained for when a real data source is wired in.
  const isLoading = false;

  const netPnl = flashPnl.netPnl;

  return (
    <FormWidget data-testid="defi-flash-loans-widget" isLoading={isLoading} error={error} onClearError={clearError}>
      <div className="flex items-center gap-2">
        <Zap className="size-4 text-amber-400" />
        <span className="text-xs font-medium">Bundle steps</span>
      </div>

      <CollapsibleSection title="Flash borrow (auto)" defaultOpen={false}>
        <div className="px-2 pb-2">
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2">
            <div className="flex items-center gap-1.5">
              <Badge variant="destructive" className="text-nano px-1.5 py-0">
                FLASH_BORROW
              </Badge>
              <span className="text-xs text-muted-foreground">Auto-prepended</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-muted-foreground">Protocol</span>
              <span className="font-mono">Aave V3</span>
              <span className="text-muted-foreground">Asset</span>
              <span className="font-mono">ETH</span>
              <span className="text-muted-foreground">Amount</span>
              <span className="font-mono">100 ETH</span>
              <span className="text-muted-foreground">Fee</span>
              <span className="font-mono text-amber-400">0.05% ($27.50)</span>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <div className="space-y-2">
        <p className="text-micro text-muted-foreground uppercase tracking-wider">Operations</p>
        {flashSteps.length === 0 && (
          <div className="py-4 text-center text-xs text-muted-foreground">
            No steps added. Click &ldquo;Add step&rdquo; to build your flash bundle.
          </div>
        )}
        {flashSteps.map((step, index) => (
          <div key={step.id} className="p-2.5 rounded-lg border space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-micro px-1.5 py-0">
                Step {index + 1}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-400"
                onClick={() => removeFlashStep(step.id)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={step.operationType}
                onValueChange={(v) => {
                  updateFlashStep(step.id, "operationType", v);
                  const allowed = INSTRUCTION_ALGO_MAP[v as InstructionType];
                  if (allowed && !allowed.includes(step.algo_type as AlgoType)) {
                    updateFlashStep(step.id, "algo_type", allowed[0]);
                  }
                }}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFI_INSTRUCTION_TYPES.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={step.venue} onValueChange={(v) => updateFlashStep(step.id, "venue", v)}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FLASH_VENUES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={step.algo_type ?? "SOR_DEX"}
                onValueChange={(v) => updateFlashStep(step.id, "algo_type", v)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(INSTRUCTION_ALGO_MAP[step.operationType as InstructionType] ?? []).map((a) => {
                    const cfg = DEFI_ALGO_TYPES.find((t) => t.value === a);
                    return (
                      <SelectItem key={a} value={a}>
                        {cfg?.label ?? a}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Select
                value={String(step.max_slippage_bps ?? 50)}
                onValueChange={(v) => updateFlashStep(step.id, "max_slippage_bps", v)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Slippage" />
                </SelectTrigger>
                <SelectContent>
                  {SLIPPAGE_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={String(s.value)}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={step.asset} onValueChange={(v) => updateFlashStep(step.id, "asset", v)}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {swapTokens.map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="font-mono">{t}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Amount"
                value={step.amount}
                onChange={(e) => updateFlashStep(step.id, "amount", e.target.value)}
                className="h-7 text-xs font-mono"
              />
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={addFlashStep}
          data-testid="flash-add-step-button"
        >
          <Plus className="size-3 mr-1.5" />
          Add step
        </Button>
      </div>

      <CollapsibleSection title="Flash repay (auto)" defaultOpen={false}>
        <div className="px-2 pb-2">
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2">
            <div className="flex items-center gap-1.5">
              <Badge variant="destructive" className="text-nano px-1.5 py-0">
                FLASH_REPAY
              </Badge>
              <span className="text-xs text-muted-foreground">Auto-appended</span>
            </div>
            <div className="text-xs text-muted-foreground font-mono">100 ETH + 0.05 ETH (fee) = 100.05 ETH</div>
          </div>
        </div>
      </CollapsibleSection>

      <div className="p-3 rounded-lg border space-y-2">
        <p className="text-xs font-medium">P&amp;L preview</p>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <span className="text-muted-foreground">Gross profit</span>
          <span className="font-mono text-emerald-400">${formatNumber(flashPnl.grossProfit, 2)}</span>
          <span className="text-muted-foreground">Flash fee</span>
          <span className="font-mono text-rose-400">-${formatNumber(flashPnl.flashFee, 2)}</span>
          <span className="text-muted-foreground">Gas estimate</span>
          <span className="font-mono text-rose-400">-${formatNumber(flashPnl.gasEstimate, 2)}</span>
          <Separator className="col-span-2 my-1" />
          <span className="font-medium">Net P&amp;L</span>
          <span className={cn("font-mono font-bold", netPnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
            ${formatNumber(netPnl, 2)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="text-xs"
          type="button"
          disabled={flashSteps.length === 0}
          onClick={() => {
            toast.info("Simulation not yet implemented", {
              description: "Flash bundle simulation requires backend integration.",
            });
          }}
        >
          <Fuel className="size-3.5 mr-1.5" />
          Simulate
        </Button>
        <Button
          className="text-xs"
          data-testid="flash-execute-button"
          disabled={flashSteps.length === 0 || isSubmitting}
          onClick={() =>
            handleSubmit(() => {
              executeDeFiOrder({
                client_id: "internal-trader",
                strategy_id: activeStrategyId ?? "ARBITRAGE_PRICE_DISPERSION@uniswap-flashloan-eth-usdc-ethereum-prod",
                instruction_type: "FLASH_BORROW",
                algo_type: "FLASH_LOAN_AAVE",
                instrument_id: `FLASH_LOAN:${flashSteps.map((s) => s.operationType).join(">")}`,
                venue: "AAVEV3-ETHEREUM",
                side: "buy",
                order_type: "market",
                quantity: 100,
                price: netPnl,
                max_slippage_bps: 50,
                expected_output: netPnl,
                benchmark_price: netPnl,
                asset_group: "DeFi",
                lane: "defi",
                is_atomic: true,
              });
              toast.success("Flash loan executed", {
                description: `${flashSteps.length}-step bundle — net P&L $${formatNumber(netPnl, 2)} (mock ledger)`,
              });
            })
          }
        >
          <Zap className="size-3.5 mr-1.5" />
          Execute bundle
        </Button>
      </div>
    </FormWidget>
  );
}
