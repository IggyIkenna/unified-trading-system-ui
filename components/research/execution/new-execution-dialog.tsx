"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Zap, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { EXECUTION_BACKTESTS } from "@/lib/build-mock-data";
import type { ExecutionBacktest } from "@/lib/build-mock-data";
import { Award } from "lucide-react";

// ─── New Execution Backtest Dialog ──────────────────────────────────────────

type AlgoType =
  | "TWAP"
  | "VWAP"
  | "Iceberg"
  | "Aggressive Limit"
  | "Passive Limit"
  | "Market Only";

export function NewExecutionBacktestDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [algo, setAlgo] = React.useState<AlgoType>("VWAP");
  const [orderType, setOrderType] = React.useState("Limit-then-Market");
  const [routing, setRouting] = React.useState("SOR");
  const [slippageModel, setSlippageModel] = React.useState("orderbook_based");
  const [marketImpact, setMarketImpact] = React.useState("square_root");
  const [allowPartial, setAllowPartial] = React.useState(true);
  const [strategyBt, setStrategyBt] = React.useState("");
  const [selectedVenues, setSelectedVenues] = React.useState<string[]>([
    "BINANCE",
    "OKX",
  ]);

  const completedStrategyBts = EXECUTION_BACKTESTS.filter((_, i) => i < 3).map(
    (b) => ({ id: b.strategy_backtest_id, name: b.strategy_name }),
  );

  const toggleVenue = (v: string) =>
    setSelectedVenues((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="size-5 text-emerald-400" />
            New Execution Backtest
          </DialogTitle>
          <DialogDescription>
            Simulate execution of strategy signals using different algorithms.
            Measures slippage, fill rates, and implementation shortfall.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Strategy source */}
          <div className="space-y-2">
            <Label>Strategy Signals Source</Label>
            <Select value={strategyBt} onValueChange={setStrategyBt}>
              <SelectTrigger>
                <SelectValue placeholder="Select a strategy backtest…" />
              </SelectTrigger>
              <SelectContent>
                {completedStrategyBts.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Execution Algorithm */}
          <div className="space-y-2">
            <Label>Execution Algorithm</Label>
            <Select value={algo} onValueChange={(v) => setAlgo(v as AlgoType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  [
                    "TWAP",
                    "VWAP",
                    "Iceberg",
                    "Aggressive Limit",
                    "Passive Limit",
                    "Market Only",
                  ] as AlgoType[]
                ).map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Algo-specific params */}
          {algo === "TWAP" && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Window (min)</Label>
                <Input type="number" defaultValue={30} min={5} max={480} />
              </div>
              <div className="space-y-2">
                <Label>Slices</Label>
                <Input type="number" defaultValue={12} min={2} max={100} />
              </div>
              <div className="space-y-2">
                <Label>Urgency</Label>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high"].map((u) => (
                      <SelectItem key={u} value={u} className="capitalize">
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {algo === "VWAP" && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Participation %</Label>
                <Input type="number" defaultValue={10} min={1} max={50} />
              </div>
              <div className="space-y-2">
                <Label>Max Participation %</Label>
                <Input type="number" defaultValue={25} min={5} max={100} />
              </div>
              <div className="space-y-2">
                <Label>Price Limit (bps)</Label>
                <Input type="number" defaultValue={10} min={1} max={100} />
              </div>
            </div>
          )}

          {algo === "Iceberg" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Visible Qty %</Label>
                <Input type="number" defaultValue={20} min={5} max={50} />
              </div>
              <div className="space-y-2">
                <Label>Refresh Rate (ms)</Label>
                <Input type="number" defaultValue={500} min={100} max={5000} />
              </div>
            </div>
          )}

          {algo === "Aggressive Limit" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Limit Offset (bps)</Label>
                <Input type="number" defaultValue={2} min={0} max={50} />
              </div>
              <div className="space-y-2">
                <Label>Cancel After (s)</Label>
                <Input type="number" defaultValue={30} min={5} max={300} />
              </div>
            </div>
          )}

          {/* Order Type */}
          <div className="space-y-2">
            <Label>Order Type</Label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Limit", "Market", "Limit-then-Market"].map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Venues */}
          <div className="space-y-2">
            <Label>Venues</Label>
            <div className="flex flex-wrap gap-2">
              {[
                "BINANCE",
                "OKX",
                "BYBIT",
                "COINBASE",
                "HYPERLIQUID",
                "DERIBIT",
              ].map((v) => (
                <Badge
                  key={v}
                  variant="outline"
                  onClick={() => toggleVenue(v)}
                  className={cn(
                    "cursor-pointer text-xs transition-colors",
                    selectedVenues.includes(v)
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:border-border",
                  )}
                >
                  {v}
                </Badge>
              ))}
            </div>
          </div>

          {/* Market simulation row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Routing</Label>
              <Select value={routing} onValueChange={setRouting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOR">Smart Order Router</SelectItem>
                  <SelectItem value="venue-specific">Venue-specific</SelectItem>
                  <SelectItem value="split">Split</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Slippage Model</Label>
              <Select value={slippageModel} onValueChange={setSlippageModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orderbook_based">
                    Orderbook-based
                  </SelectItem>
                  <SelectItem value="fixed_bps">Fixed BPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Execution Delay (ms)</Label>
              <Input type="number" defaultValue={50} min={0} max={5000} />
            </div>
            <div className="space-y-2">
              <Label>Market Impact</Label>
              <Select value={marketImpact} onValueChange={setMarketImpact}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="square_root">Square-root</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Maker Fee (bps)</Label>
              <Input type="number" defaultValue={2} min={0} max={50} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="partial-fill"
              checked={allowPartial}
              onCheckedChange={setAllowPartial}
            />
            <Label htmlFor="partial-fill" className="cursor-pointer">
              Allow partial fills
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose} disabled={!strategyBt} className="gap-2">
            <Play className="size-4" />
            Run Backtest
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Candidate Dialog ───────────────────────────────────────────────────────

export function CandidateDialog({
  bt,
  open,
  onClose,
}: {
  bt: ExecutionBacktest;
  open: boolean;
  onClose: (confirmed: boolean) => void;
}) {
  const r = bt.results!;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose(false)}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="size-5 text-amber-400" />
            Mark as Strategy Candidate
          </DialogTitle>
          <DialogDescription>
            This backtest will be promoted to a strategy candidate and become
            available in the Promote tab for formal review.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="rounded-lg border border-border/50 p-3 space-y-2 text-sm">
            <p className="font-medium">{bt.name}</p>
            <p className="text-xs text-muted-foreground">
              {bt.strategy_name} · {bt.instrument}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                label: "Net Profit",
                value: `$${r.net_profit.toLocaleString()}`,
                good: true,
              },
              {
                label: "Sharpe Ratio",
                value: r.sharpe_ratio.toFixed(2),
                good: r.sharpe_ratio > 1.5,
              },
              {
                label: "Max Drawdown",
                value: `${r.max_drawdown_pct.toFixed(1)}%`,
                good: r.max_drawdown_pct < 15,
              },
              {
                label: "Avg Slippage",
                value: `${r.avg_slippage_bps.toFixed(1)} bps`,
                good: r.avg_slippage_bps < 3,
              },
            ].map((m) => (
              <div key={m.label} className="rounded bg-muted/40 p-2">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    m.good ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {m.value}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            The full lineage (features → model → strategy → execution config)
            will be captured in the candidate record.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onClose(true)}
            className="gap-2 bg-amber-500 hover:bg-amber-600 text-black"
          >
            <Award className="size-4" />
            Promote to Candidate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
