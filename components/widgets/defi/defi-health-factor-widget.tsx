"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Activity, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useDeFiData } from "./defi-data-context";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function hfColor(hf: number): string {
  if (hf >= 1.5) return "text-emerald-400";
  if (hf >= 1.3) return "text-amber-400";
  return "text-rose-400";
}

function hfBgColor(hf: number): string {
  if (hf >= 1.5) return "bg-emerald-500/20 border-emerald-500/30";
  if (hf >= 1.3) return "bg-amber-500/20 border-amber-500/30";
  return "bg-rose-500/20 border-rose-500/30";
}

function hfLabel(hf: number): string {
  if (hf >= 1.5) return "Healthy";
  if (hf >= 1.3) return "Warning";
  return "Critical";
}

export function DeFiHealthFactorWidget(_props: WidgetComponentProps) {
  const { healthFactorDashboard: hf, emergencyExit } = useDeFiData();
  const [exitOpen, setExitOpen] = React.useState(false);

  // HF gauge: visual bar from 0 to 2.0
  const barPct = Math.min((hf.current_hf / 2.0) * 100, 100);
  const warningPct = (hf.warning_at / 2.0) * 100;
  const liquidationPct = (hf.liquidation_at / 2.0) * 100;

  return (
    <div className="space-y-3 p-1">
      {/* Main HF display */}
      <div className={cn("rounded-lg border p-4 text-center space-y-1", hfBgColor(hf.current_hf))}>
        <p className="text-xs text-muted-foreground">Health Factor</p>
        <p className={cn("text-3xl font-mono font-bold", hfColor(hf.current_hf))}>{formatNumber(hf.current_hf, 2)}</p>
        <Badge variant="outline" className={cn("text-[10px]", hfColor(hf.current_hf))}>
          {hfLabel(hf.current_hf)}
        </Badge>
      </div>

      {/* Visual gauge bar */}
      <div className="space-y-1">
        <div className="relative h-4 bg-muted/30 rounded overflow-hidden">
          {/* Liquidation marker */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10" style={{ left: `${liquidationPct}%` }} />
          {/* Warning marker */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10" style={{ left: `${warningPct}%` }} />
          {/* Current HF bar */}
          <div
            className={cn(
              "h-full rounded transition-all",
              hf.current_hf >= 1.5 ? "bg-emerald-500/60" : hf.current_hf >= 1.3 ? "bg-amber-500/60" : "bg-rose-500/60",
            )}
            style={{ width: `${barPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Liquidation ({formatNumber(hf.liquidation_at, 1)})</span>
          <span>Warning ({formatNumber(hf.warning_at, 1)})</span>
          <span>2.0</span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Buffer remaining</span>
          <span className="font-mono font-medium">{formatPercent(hf.buffer_pct, 1)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">weETH oracle rate</span>
          <span className="font-mono">{formatNumber(hf.weeth_oracle_rate, 4)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">weETH market rate</span>
          <span className="font-mono">{formatNumber(hf.weeth_market_rate, 4)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Oracle/market gap</span>
          <span className={cn("font-mono", hf.oracle_market_gap_pct > 0.1 ? "text-amber-400" : "text-emerald-400")}>
            {formatPercent(hf.oracle_market_gap_pct, 2)}
          </span>
        </div>
      </div>

      {/* Spread analysis */}
      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Rate Spread (Leveraged)</p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Staking rate</span>
          <span className="font-mono text-emerald-400">{formatPercent(hf.staking_rate_pct, 1)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Borrow rate</span>
          <span className="font-mono text-rose-400">-{formatPercent(hf.borrow_rate_pct, 1)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Net spread</span>
          <span className="font-mono">{formatPercent(hf.net_spread_pct, 1)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Leverage</span>
          <span className="font-mono">{formatNumber(hf.leverage, 1)}x</span>
        </div>
        <div className="border-t border-border/40 pt-1 flex items-center justify-between text-xs font-medium">
          <span>Leveraged spread</span>
          <span className="font-mono text-emerald-400">{formatPercent(hf.leveraged_spread_pct, 2)}</span>
        </div>
      </div>

      {/* Monitoring indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Activity className="size-3 text-emerald-400 animate-pulse" />
        <span>Monitoring: every {hf.monitoring_interval}</span>
      </div>

      {/* Emergency Exit Button */}
      <Dialog open={exitOpen} onOpenChange={setExitOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" className="w-full" size="sm">
            <ShieldAlert className="size-4 mr-2" />
            Emergency Exit
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="size-5" />
              Emergency Exit Estimate
            </DialogTitle>
            <DialogDescription>
              This will unwind the recursive staking position. Review costs before confirming.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Cost breakdown */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Estimated gas</span>
                <span className="font-mono">${formatNumber(emergencyExit.estimated_gas_usd, 0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Estimated slippage</span>
                <span className="font-mono">${formatNumber(emergencyExit.estimated_slippage_usd, 0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Exchange fees</span>
                <span className="font-mono">${formatNumber(emergencyExit.estimated_exchange_fees_usd, 0)}</span>
              </div>
              <div className="border-t border-border/40 pt-1 flex items-center justify-between text-xs font-medium">
                <span>Total cost</span>
                <span className="font-mono text-rose-400">${formatNumber(emergencyExit.total_cost_usd, 0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">% of NAV</span>
                <span className="font-mono">{formatPercent(emergencyExit.total_as_pct_of_nav, 1)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Estimated time</span>
                <span className="font-mono">~{emergencyExit.estimated_time_minutes} min</span>
              </div>
            </div>

            {/* Unwind steps */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Unwind Plan</p>
              {emergencyExit.steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="size-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-mono shrink-0">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setExitOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setExitOpen(false);
                toast.success("Emergency exit initiated", {
                  description: `Unwinding position. Estimated ${emergencyExit.estimated_time_minutes} min, cost $${formatNumber(emergencyExit.total_cost_usd, 0)} (mock).`,
                });
              }}
            >
              <ShieldAlert className="size-3 mr-1" />
              Confirm Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
