"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Award,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Play,
  Settings2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutionBacktest } from "@/lib/build-mock-data";

// ---------------------------------------------------------------------------
// Collapsible Config Section (matches ML Training pattern)
// ---------------------------------------------------------------------------

function CollapsibleConfigSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <Card className="border-border/50">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors rounded-t-lg"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </h4>
        </div>
        {open ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <CardContent className="pt-0 pb-4 space-y-4">{children}</CardContent>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Algo types and per-algo param definitions
// ---------------------------------------------------------------------------

type AlgoType =
  | "TWAP"
  | "VWAP"
  | "Iceberg"
  | "POV Dynamic"
  | "Almgren-Chriss"
  | "Aggressive Limit"
  | "Passive Limit"
  | "Market Only";

const ALL_ALGOS: AlgoType[] = [
  "TWAP",
  "VWAP",
  "Iceberg",
  "POV Dynamic",
  "Almgren-Chriss",
  "Aggressive Limit",
  "Passive Limit",
  "Market Only",
];

const MOCK_STRATEGY_BACKTESTS = [
  { id: "sbt-001", name: "BTC Momentum v3 — Binance", instructions: [
    { id: "instr-001", type: "SWAP", instrument: "BTC-USDT", venue: "Binance", defaultAlgo: "VWAP" as AlgoType },
    { id: "instr-002", type: "SWAP", instrument: "ETH-USDT", venue: "Binance", defaultAlgo: "TWAP" as AlgoType },
  ]},
  { id: "sbt-002", name: "ETH Mean-Rev — Hyperliquid", instructions: [
    { id: "instr-003", type: "TRADE", instrument: "ETH-PERP", venue: "Hyperliquid", defaultAlgo: "Aggressive Limit" as AlgoType },
    { id: "instr-004", type: "TRADE", instrument: "ETH-USDT", venue: "Hyperliquid", defaultAlgo: "VWAP" as AlgoType },
  ]},
  { id: "sbt-003", name: "Multi-Asset Trend — OKX", instructions: [
    { id: "instr-005", type: "SWAP", instrument: "BTC-USDT", venue: "OKX", defaultAlgo: "VWAP" as AlgoType },
    { id: "instr-006", type: "SWAP", instrument: "SOL-USDT", venue: "OKX", defaultAlgo: "TWAP" as AlgoType },
    { id: "instr-007", type: "SWAP", instrument: "ETH-USDT", venue: "OKX", defaultAlgo: "Iceberg" as AlgoType },
  ]},
  { id: "sbt-004", name: "DeFi Basis — Aave/Uniswap", instructions: [
    { id: "instr-008", type: "LEND", instrument: "USDC", venue: "Aave", defaultAlgo: "Market Only" as AlgoType },
    { id: "instr-009", type: "SWAP", instrument: "WETH-USDC", venue: "Uniswap", defaultAlgo: "Market Only" as AlgoType },
    { id: "instr-010", type: "FLASH_LOAN", instrument: "USDC", venue: "Aave", defaultAlgo: "Market Only" as AlgoType },
  ]},
  { id: "sbt-005", name: "SOL Breakout — Binance", instructions: [
    { id: "instr-011", type: "TRADE", instrument: "SOL-USDT", venue: "Binance", defaultAlgo: "Aggressive Limit" as AlgoType },
  ]},
];

const VENUE_OPTIONS = [
  "BINANCE",
  "HYPERLIQUID",
  "OKX",
  "DERIBIT",
  "UNISWAP",
] as const;

// ─── New Execution Backtest Dialog ──────────────────────────────────────────

export function NewExecutionBacktestDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Section A: Source Config
  const [strategyBt, setStrategyBt] = React.useState("");
  const [selectedVenues, setSelectedVenues] = React.useState<string[]>([
    "BINANCE",
    "OKX",
  ]);

  // Section B: Per-instruction Algorithm Config
  const selectedBt = MOCK_STRATEGY_BACKTESTS.find((b) => b.id === strategyBt);
  const [instrAlgos, setInstrAlgos] = React.useState<Record<string, AlgoType>>({});
  const algo = (instrAlgos[Object.keys(instrAlgos)[0] ?? ""] ?? "VWAP") as AlgoType;
  const setAlgo = (_a: AlgoType) => {}; // legacy — per-instruction now

  // Init default algos when backtest selected
  React.useEffect(() => {
    if (selectedBt) {
      const defaults: Record<string, AlgoType> = {};
      for (const instr of selectedBt.instructions) {
        defaults[instr.id] = instr.defaultAlgo;
      }
      setInstrAlgos(defaults);
    }
  }, [strategyBt]); // eslint-disable-line react-hooks/exhaustive-deps
  // TWAP params
  const [twapSliceDuration, setTwapSliceDuration] = React.useState("30");
  const [twapOrderType, setTwapOrderType] = React.useState("limit");
  const [twapTimeLimit, setTwapTimeLimit] = React.useState("3600");
  const [twapMaxParticipation, setTwapMaxParticipation] = React.useState("25");
  // VWAP params
  const [vwapTimeLimit, setVwapTimeLimit] = React.useState("3600");
  const [vwapMaxParticipation, setVwapMaxParticipation] = React.useState("25");
  const [vwapAggressive, setVwapAggressive] = React.useState(false);
  // Iceberg params
  const [icebergShowSize, setIcebergShowSize] = React.useState("1000");
  const [icebergHiddenSize, setIcebergHiddenSize] = React.useState("9000");
  const [icebergTimeLimit, setIcebergTimeLimit] = React.useState("3600");
  // POV Dynamic params
  const [povParticipation, setPovParticipation] = React.useState("15");
  const [povTimeLimit, setPovTimeLimit] = React.useState("3600");
  // Almgren-Chriss params
  const [acRiskAversion, setAcRiskAversion] = React.useState("1.0");
  const [acHorizon, setAcHorizon] = React.useState("3600");

  // Section C: Market Impact Config
  const [marketImpactModel, setMarketImpactModel] =
    React.useState("square_root");
  const [slippageModel, setSlippageModel] = React.useState("orderbook_based");
  const [fixedSlippageBps, setFixedSlippageBps] = React.useState("5");
  const [allowPartialFills, setAllowPartialFills] = React.useState(true);
  const [minFillRate, setMinFillRate] = React.useState("80");

  // Section D: Smart Routing
  const [smartRouting, setSmartRouting] = React.useState(true);
  const [routingStrategy, setRoutingStrategy] = React.useState("best_price");
  const [maxVenueConcentration, setMaxVenueConcentration] =
    React.useState("80");

  const toggleVenue = (v: string) =>
    setSelectedVenues((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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

        <div className="space-y-4 py-2">
          {/* Section A: Source Config */}
          <CollapsibleConfigSection
            title="Source Config"
            icon={<GitBranch className="size-3.5 text-muted-foreground" />}
            defaultOpen={true}
          >
            <div className="space-y-2">
              <Label>Strategy Backtest</Label>
              <Select value={strategyBt} onValueChange={setStrategyBt}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a completed strategy backtest..." />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_STRATEGY_BACKTESTS.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Signals source from a completed strategy backtest
              </p>
            </div>

            <div className="space-y-2">
              <Label>Venues</Label>
              <div className="flex flex-wrap gap-2">
                {VENUE_OPTIONS.map((v) => (
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
              <p className="text-[11px] text-muted-foreground">
                Select target venues for execution simulation
              </p>
            </div>
          </CollapsibleConfigSection>

          {/* Section B: Per-Instruction Algorithm Config */}
          <CollapsibleConfigSection
            title="Algorithm Config (per instruction)"
            icon={<Settings2 className="size-3.5 text-muted-foreground" />}
            defaultOpen={true}
          >
            {selectedBt ? (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  Each instruction can use a different execution algorithm. Defaults are auto-suggested based on instruction type.
                </p>
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Instruction</th>
                        <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Type</th>
                        <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Instrument</th>
                        <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Algorithm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBt.instructions.map((instr) => (
                        <tr key={instr.id} className="border-b border-border/30 last:border-0">
                          <td className="px-2 py-1.5 text-muted-foreground font-mono">{instr.id.slice(-3)}</td>
                          <td className="px-2 py-1.5">
                            <Badge variant="outline" className="text-[10px]">{instr.type}</Badge>
                          </td>
                          <td className="px-2 py-1.5 font-medium">{instr.instrument}</td>
                          <td className="px-2 py-1.5">
                            <Select
                              value={instrAlgos[instr.id] ?? instr.defaultAlgo}
                              onValueChange={(v) => setInstrAlgos((prev) => ({ ...prev, [instr.id]: v as AlgoType }))}
                            >
                              <SelectTrigger className="h-7 text-xs w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ALL_ALGOS.map((a) => (
                                  <SelectItem key={a} value={a}>{a}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic">
                Select a strategy backtest above to see its instructions
              </p>
            )}

            {/* Dynamic algo params */}
            {algo === "TWAP" && (
              <div className="rounded-lg border border-border/50 p-3 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  TWAP Parameters
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Slice Duration (seconds)</Label>
                    <Input
                      type="number"
                      value={twapSliceDuration}
                      onChange={(e) => setTwapSliceDuration(e.target.value)}
                      min={1}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Order Type</Label>
                    <Select
                      value={twapOrderType}
                      onValueChange={setTwapOrderType}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="limit">Limit</SelectItem>
                        <SelectItem value="market">Market</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Time Limit (seconds)</Label>
                    <Input
                      type="number"
                      value={twapTimeLimit}
                      onChange={(e) => setTwapTimeLimit(e.target.value)}
                      min={60}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Max Participation Rate %</Label>
                    <Input
                      type="number"
                      value={twapMaxParticipation}
                      onChange={(e) => setTwapMaxParticipation(e.target.value)}
                      min={1}
                      max={100}
                    />
                  </div>
                </div>
              </div>
            )}

            {algo === "VWAP" && (
              <div className="rounded-lg border border-border/50 p-3 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  VWAP Parameters
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Time Limit (seconds)</Label>
                    <Input
                      type="number"
                      value={vwapTimeLimit}
                      onChange={(e) => setVwapTimeLimit(e.target.value)}
                      min={60}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Max Participation Rate %</Label>
                    <Input
                      type="number"
                      value={vwapMaxParticipation}
                      onChange={(e) => setVwapMaxParticipation(e.target.value)}
                      min={1}
                      max={100}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Switch
                    id="vwap-aggressive"
                    checked={vwapAggressive}
                    onCheckedChange={setVwapAggressive}
                  />
                  <Label htmlFor="vwap-aggressive" className="cursor-pointer text-xs">
                    Aggressive Limit
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Cross spread when behind schedule
                  </p>
                </div>
              </div>
            )}

            {algo === "Iceberg" && (
              <div className="rounded-lg border border-border/50 p-3 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Iceberg Parameters
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Show Size</Label>
                    <Input
                      type="number"
                      value={icebergShowSize}
                      onChange={(e) => setIcebergShowSize(e.target.value)}
                      min={1}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hidden Size</Label>
                    <Input
                      type="number"
                      value={icebergHiddenSize}
                      onChange={(e) => setIcebergHiddenSize(e.target.value)}
                      min={1}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Time Limit (seconds)</Label>
                    <Input
                      type="number"
                      value={icebergTimeLimit}
                      onChange={(e) => setIcebergTimeLimit(e.target.value)}
                      min={60}
                    />
                  </div>
                </div>
              </div>
            )}

            {algo === "POV Dynamic" && (
              <div className="rounded-lg border border-border/50 p-3 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  POV Dynamic Parameters
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Participation Rate %</Label>
                    <Input
                      type="number"
                      value={povParticipation}
                      onChange={(e) => setPovParticipation(e.target.value)}
                      min={1}
                      max={100}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Time Limit (seconds)</Label>
                    <Input
                      type="number"
                      value={povTimeLimit}
                      onChange={(e) => setPovTimeLimit(e.target.value)}
                      min={60}
                    />
                  </div>
                </div>
              </div>
            )}

            {algo === "Almgren-Chriss" && (
              <div className="rounded-lg border border-border/50 p-3 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Almgren-Chriss Parameters
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Risk Aversion (0.01 - 10.0)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={acRiskAversion}
                      onChange={(e) => setAcRiskAversion(e.target.value)}
                      min={0.01}
                      max={10}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Horizon (seconds)</Label>
                    <Input
                      type="number"
                      value={acHorizon}
                      onChange={(e) => setAcHorizon(e.target.value)}
                      min={60}
                    />
                  </div>
                </div>
              </div>
            )}

            {(algo === "Aggressive Limit" || algo === "Passive Limit") && (
              <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground italic">
                {algo} uses default limit order parameters. No additional
                configuration needed.
              </div>
            )}

            {algo === "Market Only" && (
              <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground italic">
                Market Only executes immediately at market price. No additional
                parameters.
              </div>
            )}
          </CollapsibleConfigSection>

          {/* Section C: Market Impact Config */}
          <CollapsibleConfigSection
            title="Market Impact Config"
            icon={<TrendingUp className="size-3.5 text-muted-foreground" />}
            defaultOpen={false}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Market Impact Model</Label>
                <Select
                  value={marketImpactModel}
                  onValueChange={setMarketImpactModel}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="square_root">Square Root</SelectItem>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="almgren_chriss">
                      Almgren-Chriss
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Theoretical model for permanent price impact
                </p>
              </div>
              <div className="space-y-2">
                <Label>Slippage Model</Label>
                <Select
                  value={slippageModel}
                  onValueChange={setSlippageModel}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orderbook_based">
                      Orderbook-based
                    </SelectItem>
                    <SelectItem value="fixed_bps">Fixed BPS</SelectItem>
                    <SelectItem value="empirical">Empirical</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  How slippage is estimated during simulation
                </p>
              </div>
            </div>

            {slippageModel === "fixed_bps" && (
              <div className="space-y-2">
                <Label>Fixed Slippage BPS</Label>
                <Input
                  type="number"
                  value={fixedSlippageBps}
                  onChange={(e) => setFixedSlippageBps(e.target.value)}
                  min={0}
                  max={100}
                />
                <p className="text-[11px] text-muted-foreground">
                  Constant slippage applied to every fill
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="allow-partial-fills"
                  checked={allowPartialFills}
                  onCheckedChange={setAllowPartialFills}
                />
                <div>
                  <Label
                    htmlFor="allow-partial-fills"
                    className="cursor-pointer"
                  >
                    Allow Partial Fills
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Simulate partial order fills
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Minimum Fill Rate %</Label>
                <Input
                  type="number"
                  value={minFillRate}
                  onChange={(e) => setMinFillRate(e.target.value)}
                  min={0}
                  max={100}
                />
                <p className="text-[11px] text-muted-foreground">
                  Cancel if fill rate drops below this
                </p>
              </div>
            </div>
          </CollapsibleConfigSection>

          {/* Section D: Smart Routing */}
          <CollapsibleConfigSection
            title="Smart Routing"
            icon={<GitBranch className="size-3.5 text-muted-foreground" />}
            defaultOpen={false}
          >
            <div className="flex items-center gap-3">
              <Switch
                id="smart-routing"
                checked={smartRouting}
                onCheckedChange={setSmartRouting}
              />
              <div>
                <Label htmlFor="smart-routing" className="cursor-pointer">
                  Smart Order Routing
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Automatically route orders across venues for best execution
                </p>
              </div>
            </div>

            {smartRouting && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Routing Strategy</Label>
                  <Select
                    value={routingStrategy}
                    onValueChange={setRoutingStrategy}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="best_price">Best Price</SelectItem>
                      <SelectItem value="lowest_fee">Lowest Fee</SelectItem>
                      <SelectItem value="fastest_fill">
                        Fastest Fill
                      </SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Optimization objective for routing
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Max Venue Concentration %</Label>
                  <Input
                    type="number"
                    value={maxVenueConcentration}
                    onChange={(e) =>
                      setMaxVenueConcentration(e.target.value)
                    }
                    min={10}
                    max={100}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Cap per-venue allocation
                  </p>
                </div>
              </div>
            )}
          </CollapsibleConfigSection>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose} disabled={!strategyBt} className="gap-2">
            <Play className="size-4" />
            Run Execution Backtest
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
