"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Zap,
  Plus,
  CheckCircle2,
  Clock,
  Play,
  XCircle,
  TrendingUp,
  BarChart3,
  GitCompare,
  Star,
  Award,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EXECUTION_BACKTESTS,
  EXECUTION_EQUITY_CURVE,
  EXECUTION_COMPARE_CURVES,
} from "@/lib/build-mock-data";
import type {
  ExecutionBacktest,
  ExecutionBacktestResults,
  ExecutionTrade,
  EquityPoint,
} from "@/lib/build-mock-data";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  complete: {
    label: "Complete",
    badgeClass: "border-emerald-400/30 text-emerald-400",
    icon: CheckCircle2,
  },
  running: {
    label: "Running",
    badgeClass: "border-blue-400/30 text-blue-400",
    icon: Play,
  },
  failed: {
    label: "Failed",
    badgeClass: "border-red-400/30 text-red-400",
    icon: XCircle,
  },
} as const;

function StatusBadge({ status }: { status: ExecutionBacktest["status"] }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("text-xs gap-1", cfg.badgeClass)}>
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}

function MetricCard({
  label,
  value,
  isGood,
  sub,
}: {
  label: string;
  value: string;
  isGood?: boolean;
  sub?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/40 p-3 space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-lg font-bold tabular-nums",
          isGood === true
            ? "text-emerald-400"
            : isGood === false
              ? "text-red-400"
              : "",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

const TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  fontSize: 12,
  color: "var(--foreground)",
};

const TICK_STYLE = { fontSize: 10, fill: "var(--foreground)" };

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Client-side CSV download for the visible trade log (mock-friendly). */
function downloadExecutionTradesCsv(
  trades: ExecutionTrade[],
  filenameBase: string,
) {
  const headers: (keyof ExecutionTrade)[] = [
    "id",
    "timestamp",
    "signal",
    "instrument",
    "signal_price",
    "fill_price",
    "slippage_bps",
    "fill_time_ms",
    "venue",
    "algo",
    "quantity",
    "side",
    "commission",
    "market_impact_bps",
    "partial_fill_pct",
    "pnl",
    "cumulative_pnl",
    "model_confidence",
  ];
  const lines = [
    headers.join(","),
    ...trades.map((t) => headers.map((h) => escapeCsvCell(t[h])).join(",")),
  ];
  const csv = lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}.csv`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── New Backtest Dialog ──────────────────────────────────────────────────────

type AlgoType =
  | "TWAP"
  | "VWAP"
  | "Iceberg"
  | "Aggressive Limit"
  | "Passive Limit"
  | "Market Only";

function NewExecutionBacktestDialog({
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

// ─── Strategy Candidate Dialog ────────────────────────────────────────────────

function CandidateDialog({
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

// ─── Results View ─────────────────────────────────────────────────────────────

function ResultsView({
  bt,
  onPromote,
  isCandidate,
}: {
  bt: ExecutionBacktest;
  onPromote: () => void;
  isCandidate: boolean;
}) {
  const { toast } = useToast();
  const r = bt.results!;
  const equityCurve = EXECUTION_EQUITY_CURVE;

  const handleExportTradesCsv = () => {
    downloadExecutionTradesCsv(
      r.trades,
      `execution-trades-${bt.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    );
    toast({
      title: "CSV export",
      description: `Downloaded ${r.trades.length} trade row(s) for ${bt.name}.`,
    });
  };

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="execution">Execution Quality</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>
        {isCandidate ? (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-400/30 gap-1">
            <Award className="size-3" /> Candidate
          </Badge>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-amber-400/30 text-amber-400 hover:bg-amber-400/10"
            onClick={onPromote}
          >
            <Award className="size-3.5" />
            Mark as Candidate
          </Button>
        )}
      </div>

      {/* ── Overview ────────────────────────────────────────────────────────── */}
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Net Profit"
            value={`$${r.net_profit.toLocaleString()}`}
            isGood={r.net_profit > 0}
            sub={`${r.net_profit_pct.toFixed(1)}%`}
          />
          <MetricCard
            label="Sharpe Ratio"
            value={r.sharpe_ratio.toFixed(2)}
            isGood={r.sharpe_ratio > 1.5}
          />
          <MetricCard
            label="Max Drawdown"
            value={`${r.max_drawdown_pct.toFixed(1)}%`}
            isGood={r.max_drawdown_pct < 15}
          />
          <MetricCard
            label="Win Rate"
            value={`${r.win_rate.toFixed(1)}%`}
            isGood={r.win_rate > 50}
          />
        </div>

        {/* Equity curve */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Equity Curve</CardTitle>
              <span className="text-xs text-muted-foreground">
                vs Buy &amp; Hold +{r.buy_hold_return_pct.toFixed(1)}%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={equityCurve}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="date"
                  tick={TICK_STYLE}
                  tickFormatter={(v) => v.slice(5)}
                  interval={14}
                />
                <YAxis
                  tick={TICK_STYLE}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={55}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v) => [
                    `$${Number(v).toLocaleString()}`,
                    "Equity",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#equityGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Execution summary inline */}
        <div className="rounded-lg border border-border/50 p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            {
              label: "Avg Slippage",
              value: `${r.avg_slippage_bps.toFixed(1)} bps`,
              good: r.avg_slippage_bps < 3,
            },
            {
              label: "Fill Rate",
              value: `${r.fill_rate_pct.toFixed(1)}%`,
              good: r.fill_rate_pct > 97,
            },
            {
              label: "Total Fees",
              value: `$${r.total_commission.toLocaleString()}`,
            },
            {
              label: "Avg Fill Time",
              value: `${r.avg_fill_time_seconds.toFixed(1)}s`,
            },
          ].map((m) => (
            <div key={m.label}>
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p
                className={cn(
                  "font-bold tabular-nums",
                  m.good === true
                    ? "text-emerald-400"
                    : m.good === false
                      ? "text-red-400"
                      : "",
                )}
              >
                {m.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Sortino Ratio"
            value={r.sortino_ratio.toFixed(2)}
            isGood={r.sortino_ratio > 2}
          />
          <MetricCard
            label="Profit Factor"
            value={r.profit_factor.toFixed(2)}
            isGood={r.profit_factor > 1.5}
          />
          <MetricCard label="Total Trades" value={r.total_trades.toString()} />
          <MetricCard
            label="Avg Duration"
            value={`${r.avg_trade_duration_hours.toFixed(1)}h`}
          />
        </div>
      </TabsContent>

      {/* ── Performance ─────────────────────────────────────────────────────── */}
      <TabsContent value="performance" className="space-y-4">
        {/* Long / Short split table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-xs text-muted-foreground font-medium p-3 w-44">
                    Metric
                  </th>
                  {(["all", "long", "short"] as const).map((d) => (
                    <th
                      key={d}
                      className="text-right text-xs font-semibold p-3 capitalize"
                    >
                      {d === "all"
                        ? "All Trades"
                        : `${d.charAt(0).toUpperCase() + d.slice(1)} Only`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    section: "RETURNS",
                    rows: [
                      {
                        label: "Net Profit",
                        key: "net_profit",
                        fmt: (v: number) => `$${v.toLocaleString()}`,
                      },
                      {
                        label: "Net Profit %",
                        key: "net_profit_pct",
                        fmt: (v: number) => `${v.toFixed(2)}%`,
                      },
                      {
                        label: "Gross Profit",
                        key: "gross_profit",
                        fmt: (v: number) => `$${v.toLocaleString()}`,
                      },
                      {
                        label: "Gross Loss",
                        key: "gross_loss",
                        fmt: (v: number) => `$${v.toLocaleString()}`,
                      },
                      {
                        label: "Max Drawdown",
                        key: "max_drawdown_pct",
                        fmt: (v: number) => `${v.toFixed(1)}%`,
                      },
                    ],
                  },
                  {
                    section: "RATIOS",
                    rows: [
                      {
                        label: "Sharpe Ratio",
                        key: "sharpe_ratio",
                        fmt: (v: number) => v.toFixed(2),
                      },
                      {
                        label: "Sortino Ratio",
                        key: "sortino_ratio",
                        fmt: (v: number) => v.toFixed(2),
                      },
                      {
                        label: "Profit Factor",
                        key: "profit_factor",
                        fmt: (v: number) => v.toFixed(2),
                      },
                      {
                        label: "Calmar Ratio",
                        key: "calmar_ratio",
                        fmt: (v: number) => v.toFixed(2),
                      },
                    ],
                  },
                  {
                    section: "TRADES",
                    rows: [
                      {
                        label: "Total Trades",
                        key: "total_trades",
                        fmt: (v: number) => v.toString(),
                      },
                      {
                        label: "Win Rate",
                        key: "win_rate",
                        fmt: (v: number) => `${v.toFixed(1)}%`,
                      },
                      {
                        label: "Avg Win",
                        key: "avg_winning_trade",
                        fmt: (v: number) => `$${v.toLocaleString()}`,
                      },
                      {
                        label: "Avg Loss",
                        key: "avg_losing_trade",
                        fmt: (v: number) => `$${v.toLocaleString()}`,
                      },
                      {
                        label: "Largest Winner",
                        key: "largest_winner",
                        fmt: (v: number) => `$${v.toLocaleString()}`,
                      },
                      {
                        label: "Largest Loser",
                        key: "largest_loser",
                        fmt: (v: number) => `$${v.toLocaleString()}`,
                      },
                      {
                        label: "Avg Duration",
                        key: "avg_trade_duration_hours",
                        fmt: (v: number) => `${v.toFixed(1)}h`,
                      },
                      {
                        label: "Max Consec. Wins",
                        key: "max_consec_wins",
                        fmt: (v: number) => v.toString(),
                      },
                      {
                        label: "Max Consec. Losses",
                        key: "max_consec_losses",
                        fmt: (v: number) => v.toString(),
                      },
                      {
                        label: "Expectancy ($)",
                        key: "expectancy",
                        fmt: (v: number) => `$${v.toFixed(2)}`,
                      },
                    ],
                  },
                ].map(({ section, rows }) => (
                  <React.Fragment key={section}>
                    <tr>
                      <td
                        colSpan={4}
                        className="text-xs font-semibold text-muted-foreground px-3 py-2 bg-muted/20 uppercase tracking-wide"
                      >
                        {section}
                      </td>
                    </tr>
                    {rows.map(({ label, key, fmt }) => (
                      <tr
                        key={key}
                        className="border-t border-border/30 hover:bg-muted/20"
                      >
                        <td className="text-xs text-muted-foreground p-3">
                          {label}
                        </td>
                        {(["all", "long", "short"] as const).map((d) => {
                          const dirStats = r.by_direction[
                            d
                          ] as unknown as Record<string, number>;
                          const val =
                            dirStats[key] ??
                            (r as unknown as Record<string, number>)[key] ??
                            0;
                          return (
                            <td
                              key={d}
                              className="text-right font-mono text-xs p-3 tabular-nums"
                            >
                              {fmt(val)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Drawdown chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={equityCurve}>
                <defs>
                  <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="date"
                  tick={TICK_STYLE}
                  tickFormatter={(v) => v.slice(5)}
                  interval={14}
                />
                <YAxis
                  tick={TICK_STYLE}
                  tickFormatter={(v) => `${v.toFixed(1)}%`}
                  width={45}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v) => [`${Number(v).toFixed(2)}%`, "Drawdown"]}
                />
                <Area
                  type="monotone"
                  dataKey="drawdown"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  fill="url(#ddGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Trades ──────────────────────────────────────────────────────────── */}
      <TabsContent value="trades" className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {r.trades.length} trades · {r.total_trades} total
          </p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1"
            type="button"
            onClick={handleExportTradesCsv}
          >
            <BarChart3 className="size-3" /> Export CSV
          </Button>
        </div>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead>Instrument</TableHead>
                  <TableHead className="text-right">Signal Price</TableHead>
                  <TableHead className="text-right">Fill Price</TableHead>
                  <TableHead className="text-right">Slippage</TableHead>
                  <TableHead className="text-right">Fill Time</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">P&amp;L</TableHead>
                  <TableHead className="text-right">Cum. P&amp;L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.trades.map((t, idx) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {new Date(t.timestamp).toLocaleString("en-GB", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          t.signal === "LONG"
                            ? "border-emerald-400/30 text-emerald-400"
                            : t.signal === "SHORT"
                              ? "border-red-400/30 text-red-400"
                              : "border-border/50 text-muted-foreground",
                        )}
                      >
                        {t.signal}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{t.instrument}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums font-mono">
                      {t.signal_price.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums font-mono">
                      {t.fill_price.toLocaleString()}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right text-xs tabular-nums",
                        t.slippage_bps > 5
                          ? "text-red-400"
                          : t.slippage_bps < 2
                            ? "text-emerald-400"
                            : "",
                      )}
                    >
                      {t.slippage_bps.toFixed(1)} bps
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {(t.fill_time_ms / 1000).toFixed(1)}s
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {t.venue}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                      ${t.commission}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right text-xs tabular-nums font-medium",
                        t.pnl === null
                          ? "text-muted-foreground"
                          : t.pnl > 0
                            ? "text-emerald-400"
                            : "text-red-400",
                      )}
                    >
                      {t.pnl === null
                        ? "—"
                        : `${t.pnl > 0 ? "+" : ""}$${Math.abs(t.pnl).toFixed(0)}`}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right text-xs tabular-nums font-mono",
                        t.cumulative_pnl >= 0
                          ? "text-emerald-400"
                          : "text-red-400",
                      )}
                    >
                      ${t.cumulative_pnl.toFixed(0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Execution Quality ────────────────────────────────────────────────── */}
      <TabsContent value="execution" className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Avg Slippage"
            value={`${r.avg_slippage_bps.toFixed(1)} bps`}
            isGood={r.avg_slippage_bps < 3}
          />
          <MetricCard
            label="Avg Fill Time"
            value={`${r.avg_fill_time_seconds.toFixed(1)}s`}
            isGood={r.avg_fill_time_seconds < 10}
          />
          <MetricCard
            label="Fill Rate"
            value={`${r.fill_rate_pct.toFixed(1)}%`}
            isGood={r.fill_rate_pct > 97}
          />
          <MetricCard
            label="Maker %"
            value={`${r.maker_pct.toFixed(1)}%`}
            isGood={r.maker_pct > 50}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Total Slippage Cost"
            value={`$${r.total_slippage_cost.toLocaleString()}`}
            isGood={false}
          />
          <MetricCard
            label="Impl. Shortfall"
            value={`${r.implementation_shortfall_bps.toFixed(1)} bps`}
            isGood={r.implementation_shortfall_bps < 3}
          />
          <MetricCard
            label="Commission"
            value={`$${r.total_commission.toLocaleString()}`}
          />
          <MetricCard
            label="Partial Fill %"
            value={`${r.partial_fill_pct.toFixed(1)}%`}
            isGood={r.partial_fill_pct < 15}
          />
        </div>

        {/* Slippage distribution */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Slippage Distribution</CardTitle>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>
                  Mean{" "}
                  <span className="text-foreground font-medium">
                    {r.slippage_mean_bps.toFixed(1)} bps
                  </span>
                </span>
                <span>
                  Median{" "}
                  <span className="text-foreground font-medium">
                    {r.slippage_median_bps.toFixed(1)} bps
                  </span>
                </span>
                <span>
                  P95{" "}
                  <span className="text-foreground font-medium">
                    {r.slippage_p95_bps.toFixed(1)} bps
                  </span>
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={r.slippage_distribution} barCategoryGap="20%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                  vertical={false}
                />
                <XAxis dataKey="label" tick={TICK_STYLE} />
                <YAxis
                  tick={TICK_STYLE}
                  tickFormatter={(v) => `${v}`}
                  label={{
                    value: "Trades",
                    angle: -90,
                    position: "insideLeft",
                    style: TICK_STYLE,
                    offset: 10,
                  }}
                  width={50}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v, _n, p) => [
                    `${v} trades (${(p.payload as { pct: number }).pct}%)`,
                    "Count",
                  ]}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {r.slippage_distribution.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.label === "0–1 bps"
                          ? "#10b981"
                          : entry.label === "1–3 bps"
                            ? "#22d3ee"
                            : entry.label === "3–5 bps"
                              ? "#f59e0b"
                              : "#ef4444"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Implementation Shortfall decomposition */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Implementation Shortfall Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Total shortfall</span>
              <span className="font-mono text-red-400">
                {r.is_breakdown.total_bps.toFixed(1)} bps ($
                {r.is_breakdown.total_usd.toLocaleString()})
              </span>
            </div>
            {[
              {
                label: "Delay cost",
                bps: r.is_breakdown.delay_cost_bps,
                usd: r.is_breakdown.delay_cost_usd,
                color: "bg-amber-400",
              },
              {
                label: "Market impact",
                bps: r.is_breakdown.market_impact_bps,
                usd: r.is_breakdown.market_impact_usd,
                color: "bg-orange-500",
              },
              {
                label: "Fees",
                bps: r.is_breakdown.fees_bps,
                usd: r.is_breakdown.fees_usd,
                color: "bg-slate-400",
              },
            ].map((item) => {
              const widthPct = (item.bps / r.is_breakdown.total_bps) * 100;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-mono text-muted-foreground">
                      {item.bps.toFixed(1)} bps · ${item.usd.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", item.color)}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Venue Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Venue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venue</TableHead>
                  <TableHead className="text-right">Fills</TableHead>
                  <TableHead className="text-right">Avg Slippage</TableHead>
                  <TableHead className="text-right">Maker %</TableHead>
                  <TableHead className="text-right">Avg Fill Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(r.venue_breakdown).map(([venue, data]) => (
                  <TableRow key={venue}>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {venue}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {data.fills}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums text-sm",
                        data.avg_slippage_bps < 2 ? "text-emerald-400" : "",
                      )}
                    >
                      {data.avg_slippage_bps.toFixed(1)} bps
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {data.maker_pct.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {data.avg_fill_time_s.toFixed(1)}s
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Config ──────────────────────────────────────────────────────────── */}
      <TabsContent value="config">
        <Card>
          <CardContent className="p-4 space-y-3">
            {[
              { label: "Algorithm", value: bt.algo },
              { label: "Order Type", value: bt.order_type },
              { label: "Venues", value: bt.venues.join(", ") },
              { label: "Routing", value: bt.routing },
              { label: "Slippage Model", value: bt.slippage_model },
              { label: "Execution Delay", value: `${bt.execution_delay_ms}ms` },
              { label: "Market Impact", value: bt.market_impact },
              { label: "Instrument", value: bt.instrument },
              {
                label: "Date Range",
                value: `${bt.date_range.start} → ${bt.date_range.end}`,
              },
              { label: "Strategy", value: bt.strategy_name },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium">{row.value}</span>
              </div>
            ))}
            {Object.entries(bt.algo_params).length > 0 && (
              <>
                <p className="text-xs font-medium text-muted-foreground pt-1">
                  Algorithm Parameters
                </p>
                {Object.entries(bt.algo_params).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between text-sm py-1 border-b border-border/30 last:border-0"
                  >
                    <span className="text-muted-foreground font-mono text-xs">
                      {k}
                    </span>
                    <span className="font-mono text-xs">{String(v)}</span>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// ─── Compare Panel ────────────────────────────────────────────────────────────

const ALGO_COLORS: Record<string, string> = {
  VWAP: "#10b981",
  TWAP: "#22d3ee",
  "Aggressive Limit": "#f59e0b",
  Iceberg: "#a78bfa",
  "Passive Limit": "#64748b",
  "Market Only": "#ef4444",
};

function ExecutionComparePanel({
  selected,
  onClose,
}: {
  selected: string[];
  onClose: () => void;
}) {
  const items = EXECUTION_BACKTESTS.filter(
    (b) => selected.includes(b.id) && b.results,
  ).slice(0, 3);

  if (items.length < 2) return null;

  const METRICS = [
    { key: "sharpe_ratio", label: "Sharpe" },
    { key: "net_profit_pct", label: "Return %", pct: true },
    { key: "max_drawdown_pct", label: "Max DD %", pct: true, low: true },
    { key: "avg_slippage_bps", label: "Avg Slippage (bps)", low: true },
    { key: "avg_fill_time_seconds", label: "Fill Time (s)", low: true },
    { key: "fill_rate_pct", label: "Fill Rate %" },
    { key: "maker_pct", label: "Maker %" },
    {
      key: "implementation_shortfall_bps",
      label: "Impl. Shortfall (bps)",
      low: true,
    },
    { key: "total_commission", label: "Total Fees ($)", low: true },
  ];

  // Build combined equity curve for overlay
  const allDates = (
    EXECUTION_COMPARE_CURVES[items[0].id] ?? EXECUTION_EQUITY_CURVE
  ).map((p) => p.date);
  const combinedCurve = allDates.map((date, i) => {
    const point: Record<string, string | number> = { date };
    items.forEach((bt) => {
      const curve = EXECUTION_COMPARE_CURVES[bt.id] ?? EXECUTION_EQUITY_CURVE;
      point[bt.id] = curve[i]?.equity ?? 100000;
    });
    return point;
  });

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitCompare className="size-4 text-primary" />
            Comparing {items.length} Execution Backtests
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Clear Compare
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Equity curves overlay */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            Equity Curves (same signals, different execution)
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={combinedCurve}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.08)"
              />
              <XAxis
                dataKey="date"
                tick={TICK_STYLE}
                tickFormatter={(v) => v.slice(5)}
                interval={14}
              />
              <YAxis
                tick={TICK_STYLE}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                width={50}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v, name) => {
                  const bt = items.find((b) => b.id === name);
                  return [
                    `$${Number(v).toLocaleString()}`,
                    bt ? `${bt.algo}` : String(name),
                  ];
                }}
              />
              <Legend
                formatter={(value) => {
                  const bt = items.find((b) => b.id === value);
                  return bt ? bt.algo : value;
                }}
              />
              {items.map((bt) => (
                <Line
                  key={bt.id}
                  type="monotone"
                  dataKey={bt.id}
                  stroke={ALGO_COLORS[bt.algo] ?? "#64748b"}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics comparison table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-xs text-muted-foreground font-medium pb-2 w-44">
                  Metric
                </th>
                {items.map((b) => (
                  <th
                    key={b.id}
                    className="text-right text-xs font-medium pb-2 px-3"
                  >
                    <div>
                      <div style={{ color: ALGO_COLORS[b.algo] ?? "inherit" }}>
                        {b.algo}
                      </div>
                      <div className="text-muted-foreground font-normal">
                        {b.order_type}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m) => {
                const values = items.map(
                  (b) =>
                    (b.results as unknown as Record<string, number>)?.[m.key] ??
                    0,
                );
                const best = m.low ? Math.min(...values) : Math.max(...values);
                return (
                  <tr key={m.key} className="border-t border-border/40">
                    <td className="text-xs text-muted-foreground py-2">
                      {m.label}
                    </td>
                    {items.map((b, i) => {
                      const val = values[i];
                      const isBest = val === best;
                      const display = m.pct
                        ? `${val.toFixed(1)}%`
                        : val.toFixed(2);
                      return (
                        <td key={b.id} className="text-right py-2 px-3">
                          <span
                            className={cn(
                              "font-mono text-sm font-medium tabular-nums",
                              isBest ? "text-emerald-400" : "",
                            )}
                          >
                            {display}
                            {isBest && (
                              <Star className="inline ml-1 size-2.5 fill-emerald-400 text-emerald-400" />
                            )}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Net profit insight */}
        <div className="rounded-lg bg-muted/30 p-3 text-xs space-y-1">
          <p className="font-medium text-muted-foreground">
            Net Profit Comparison
          </p>
          {items.map((b) => (
            <div key={b.id} className="flex items-center justify-between">
              <span style={{ color: ALGO_COLORS[b.algo] ?? "inherit" }}>
                {b.algo}
              </span>
              <span className="font-mono font-medium">
                ${b.results!.net_profit.toLocaleString()} (+
                {b.results!.net_profit_pct.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExecutionResearchPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [newBtOpen, setNewBtOpen] = React.useState(false);
  const [selectedBt, setSelectedBt] = React.useState<ExecutionBacktest | null>(
    EXECUTION_BACKTESTS.find((b) => b.status === "complete") ?? null,
  );
  const [compareSelected, setCompareSelected] = React.useState<string[]>([]);
  const [showCompare, setShowCompare] = React.useState(false);
  const [candidateDialogBt, setCandidateDialogBt] =
    React.useState<ExecutionBacktest | null>(null);
  const [candidates, setCandidates] = React.useState<Set<string>>(new Set());

  const complete = EXECUTION_BACKTESTS.filter((b) => b.status === "complete");
  const running = EXECUTION_BACKTESTS.filter((b) => b.status === "running");

  const toggleCompare = (id: string) => {
    setCompareSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev,
    );
  };

  const handlePromote = (confirmed: boolean) => {
    if (confirmed && candidateDialogBt) {
      setCandidates((prev) => new Set([...prev, candidateDialogBt.id]));
      toast({
        title: "Strategy candidate created",
        description: `${candidateDialogBt.name} is now available in the Promote tab.`,
      });
    }
    setCandidateDialogBt(null);
  };

  const bestSharpe = complete.reduce(
    (max, b) => Math.max(max, b.results?.sharpe_ratio ?? 0),
    0,
  );

  const fromStrategies = searchParams.get("from") === "strategies";
  const handoffSingle = searchParams.get("strategyBacktestId");
  const handoffMulti = searchParams.get("strategyBacktestIds");
  const showStrategiesHandoffBanner =
    fromStrategies && Boolean(handoffSingle || handoffMulti);

  return (
    <div className="space-y-6 p-6">
      {showStrategiesHandoffBanner && (
        <Alert className="border-primary/35 bg-primary/5">
          <Info className="size-4" />
          <AlertTitle>Handoff from Strategies</AlertTitle>
          <AlertDescription className="space-y-2">
            {handoffMulti ? (
              <p>
                Compare mode: {handoffMulti.split(",").filter(Boolean).length}{" "}
                strategy backtest(s). Primary selection:{" "}
                <span className="font-mono text-foreground">
                  {handoffSingle ?? "—"}
                </span>
                . Connect to execution API when available.
              </p>
            ) : (
              <p>
                Single strategy backtest:{" "}
                <span className="font-mono text-foreground">
                  {handoffSingle ?? "—"}
                </span>
                . Signals will attach here when the pipeline is wired.
              </p>
            )}
            <Link
              href="/services/research/strategies"
              className="inline-block text-primary underline underline-offset-2 text-sm font-medium hover:text-primary/90"
            >
              ← Strategy Backtests
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Execution Backtests
          </h1>
          <p className="text-muted-foreground mt-1">
            Simulate order execution using strategy signals — compare TWAP,
            VWAP, and other algos. Analyse slippage, fill rates, and P&amp;L.
          </p>
        </div>
        <div className="flex gap-2">
          {compareSelected.length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setShowCompare(!showCompare)}
            >
              <GitCompare className="size-4" />
              Compare ({compareSelected.length})
            </Button>
          )}
          <Button size="sm" onClick={() => setNewBtOpen(true)}>
            <Plus className="size-4 mr-2" />
            New Backtest
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Backtests",
            value: String(EXECUTION_BACKTESTS.length),
            color: "text-foreground",
          },
          {
            label: "Complete",
            value: String(complete.length),
            color: "text-emerald-400",
          },
          {
            label: "Running",
            value: String(running.length),
            color:
              running.length > 0 ? "text-blue-400" : "text-muted-foreground",
          },
          {
            label: "Best Sharpe",
            value: bestSharpe.toFixed(2),
            color: "text-primary",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={cn("text-2xl font-bold tabular-nums", s.color)}>
                {s.value}
              </p>
              <p className="text-sm font-medium mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compare panel */}
      {showCompare && compareSelected.length >= 2 && (
        <ExecutionComparePanel
          selected={compareSelected}
          onClose={() => {
            setCompareSelected([]);
            setShowCompare(false);
          }}
        />
      )}

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Left: Backtest list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">All Backtests</p>
            <Badge variant="secondary" className="text-xs">
              {EXECUTION_BACKTESTS.length}
            </Badge>
          </div>
          {EXECUTION_BACKTESTS.map((bt) => {
            const isSelected = selectedBt?.id === bt.id;
            const isCompare = compareSelected.includes(bt.id);
            const isCandidate = candidates.has(bt.id);
            return (
              <div
                key={bt.id}
                className={cn(
                  "rounded-lg border p-3 cursor-pointer transition-colors space-y-2",
                  isSelected
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/50 hover:border-border",
                )}
                onClick={() => setSelectedBt(bt)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{bt.name}</p>
                      {isCandidate && (
                        <Badge className="text-[10px] px-1 py-0 h-4 bg-amber-500/20 text-amber-400 border-amber-400/30">
                          Candidate
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {bt.strategy_name}
                    </p>
                  </div>
                  <StatusBadge status={bt.status} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: `${ALGO_COLORS[bt.algo]}40`,
                      color: ALGO_COLORS[bt.algo],
                    }}
                  >
                    {bt.algo}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {bt.instrument}
                  </Badge>
                </div>
                {bt.results && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "font-medium",
                        bt.results.sharpe_ratio > 1.5 ? "text-emerald-400" : "",
                      )}
                    >
                      Sharpe {bt.results.sharpe_ratio.toFixed(2)}
                    </span>
                    <span
                      className={cn(
                        "font-medium",
                        bt.results.net_profit > 0
                          ? "text-emerald-400"
                          : "text-red-400",
                      )}
                    >
                      {bt.results.net_profit_pct.toFixed(1)}%
                    </span>
                    <span>DD {bt.results.max_drawdown_pct.toFixed(1)}%</span>
                  </div>
                )}
                {bt.status === "running" && (
                  <div className="space-y-1">
                    <Progress value={92} className="h-1" />
                    <p className="text-xs text-muted-foreground">
                      92% complete
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompare(bt.id);
                    }}
                    className={cn(
                      "text-xs border rounded px-2 py-0.5 transition-colors",
                      isCompare
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-border",
                    )}
                  >
                    {isCompare ? "✓ Compare" : "Compare"}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(bt.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Results */}
        <div>
          {selectedBt ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selectedBt.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedBt.strategy_name} · {selectedBt.instrument}
                  </p>
                </div>
                <StatusBadge status={selectedBt.status} />
              </div>

              {selectedBt.status === "running" ? (
                <Card>
                  <CardContent className="py-12 text-center space-y-3">
                    <Play className="size-8 text-blue-400 mx-auto animate-pulse" />
                    <p className="text-sm font-medium">Backtest running…</p>
                    <Progress value={92} className="max-w-xs mx-auto" />
                    <p className="text-xs text-muted-foreground">
                      92% complete
                    </p>
                  </CardContent>
                </Card>
              ) : selectedBt.status === "failed" ? (
                <Card className="border-red-400/30">
                  <CardContent className="py-8 text-center">
                    <XCircle className="size-8 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-400">Backtest failed</p>
                  </CardContent>
                </Card>
              ) : selectedBt.results ? (
                <ResultsView
                  bt={selectedBt}
                  onPromote={() => setCandidateDialogBt(selectedBt)}
                  isCandidate={candidates.has(selectedBt.id)}
                />
              ) : null}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="size-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select a backtest to view results
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <NewExecutionBacktestDialog
        open={newBtOpen}
        onClose={() => setNewBtOpen(false)}
      />
      {candidateDialogBt && (
        <CandidateDialog
          bt={candidateDialogBt}
          open={true}
          onClose={handlePromote}
        />
      )}
    </div>
  );
}
