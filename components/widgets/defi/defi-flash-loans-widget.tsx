"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Fuel, Plus, Trash2, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { FLASH_OPERATION_TYPES, FLASH_VENUES } from "@/lib/config/services/defi.config";
import { SWAP_TOKENS } from "@/lib/mocks/fixtures/defi-swap";
import { useDeFiData } from "./defi-data-context";
import { formatNumber } from "@/lib/utils/formatters";

export function DeFiFlashLoansWidget(_props: WidgetComponentProps) {
  const { flashSteps, addFlashStep, removeFlashStep, updateFlashStep, flashPnl, executeDeFiOrder } = useDeFiData();

  const netPnl = flashPnl.netPnl;

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center gap-2">
        <Zap className="size-4 text-amber-400" />
        <span className="text-xs font-medium">Bundle steps</span>
      </div>

      <CollapsibleSection title="Flash borrow (auto)" defaultOpen={false}>
        <div className="px-2 pb-2">
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2">
            <div className="flex items-center gap-1.5">
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
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
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Operations</p>
        {flashSteps.map((step, index) => (
          <div key={step.id} className="p-2.5 rounded-lg border space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
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
              <Select value={step.operationType} onValueChange={(v) => updateFlashStep(step.id, "operationType", v)}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FLASH_OPERATION_TYPES.map((op) => (
                    <SelectItem key={op} value={op}>
                      {op}
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
              <Select value={step.asset} onValueChange={(v) => updateFlashStep(step.id, "asset", v)}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SWAP_TOKENS.map((t) => (
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

        <Button variant="outline" size="sm" className="w-full text-xs" onClick={addFlashStep}>
          <Plus className="size-3 mr-1.5" />
          Add step
        </Button>
      </div>

      <CollapsibleSection title="Flash repay (auto)" defaultOpen={false}>
        <div className="px-2 pb-2">
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2">
            <div className="flex items-center gap-1.5">
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
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
        <Button variant="outline" className="text-xs" type="button">
          <Fuel className="size-3.5 mr-1.5" />
          Simulate
        </Button>
        <Button
          className="text-xs"
          disabled={flashSteps.length === 0}
          onClick={() => {
            executeDeFiOrder({
              client_id: "internal-trader",
              instrument_id: `FLASH_LOAN:${flashSteps.map((s) => s.operationType).join(">")}`,
              venue: "Aave",
              side: "buy",
              order_type: "market",
              quantity: 100,
              price: netPnl,
              asset_class: "DeFi",
              lane: "defi",
            });
            toast({
              title: "Flash loan executed",
              description: `${flashSteps.length}-step bundle — net P&L $${formatNumber(netPnl, 2)} (mock ledger)`,
            });
          }}
        >
          <Zap className="size-3.5 mr-1.5" />
          Execute bundle
        </Button>
      </div>
    </div>
  );
}
