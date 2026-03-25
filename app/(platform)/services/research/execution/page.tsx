"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EXECUTION_BACKTESTS,
  EXECUTION_EQUITY_CURVE,
} from "@/lib/build-mock-data";
import type {
  ExecutionBacktest,
  ExecutionBacktestResults,
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
} from "recharts";

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

// ─── New Backtest Dialog ──────────────────────────────────────────────────────

function NewExecutionBacktestDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [algo, setAlgo] = React.useState<string>("VWAP");
  const [orderType, setOrderType] = React.useState("Limit-then-Market");
  const [strategyBt, setStrategyBt] = React.useState("");

  const completedStrategyBts = EXECUTION_BACKTESTS.filter((_, i) => i < 3).map(
    (b) => ({
      id: b.strategy_backtest_id,
      name: b.strategy_name,
    }),
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[540px]">
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
          <div className="space-y-2">
            <Label>Execution Algorithm</Label>
            <Select value={algo} onValueChange={setAlgo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "TWAP",
                  "VWAP",
                  "Iceberg",
                  "Aggressive Limit",
                  "Passive Limit",
                  "Market Only",
                ].map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(algo === "TWAP" || algo === "VWAP") && (
            <div className="space-y-2">
              <Label>Window (minutes)</Label>
              <Input type="number" defaultValue={120} min={5} max={480} />
            </div>
          )}
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
          <div className="space-y-2">
            <Label>Venues</Label>
            <div className="flex flex-wrap gap-2">
              {["BINANCE", "OKX", "BYBIT", "COINBASE"].map((v) => (
                <Badge
                  key={v}
                  variant="outline"
                  className="cursor-pointer text-xs"
                >
                  {v}
                </Badge>
              ))}
            </div>
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

// ─── Results View (TradingView-style) ────────────────────────────────────────

function ResultsView({ bt }: { bt: ExecutionBacktest }) {
  const r = bt.results!;
  const equityCurve = EXECUTION_EQUITY_CURVE;

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="performance">Performance</TabsTrigger>
        <TabsTrigger value="execution">Execution Quality</TabsTrigger>
        <TabsTrigger value="config">Config</TabsTrigger>
      </TabsList>

      {/* Overview */}
      <TabsContent value="overview" className="space-y-4">
        {/* Key metrics */}
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
            <CardTitle className="text-sm">Equity Curve</CardTitle>
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
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => v.slice(5)}
                  interval={14}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={55}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: 12,
                  }}
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

        {/* Additional metrics */}
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

      {/* Performance */}
      <TabsContent value="performance" className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            {
              label: "Net Profit",
              value: `$${r.net_profit.toLocaleString()}`,
              good: r.net_profit > 0,
            },
            {
              label: "Net Profit %",
              value: `${r.net_profit_pct.toFixed(2)}%`,
              good: r.net_profit_pct > 0,
            },
            {
              label: "Sharpe Ratio",
              value: r.sharpe_ratio.toFixed(2),
              good: r.sharpe_ratio > 1.5,
            },
            {
              label: "Sortino Ratio",
              value: r.sortino_ratio.toFixed(2),
              good: r.sortino_ratio > 2,
            },
            {
              label: "Max Drawdown",
              value: `${r.max_drawdown_pct.toFixed(2)}%`,
              good: r.max_drawdown_pct < 15,
            },
            {
              label: "Profit Factor",
              value: r.profit_factor.toFixed(2),
              good: r.profit_factor > 1.5,
            },
            {
              label: "Win Rate",
              value: `${r.win_rate.toFixed(1)}%`,
              good: r.win_rate > 50,
            },
            { label: "Total Trades", value: r.total_trades.toString() },
            {
              label: "Avg Duration",
              value: `${r.avg_trade_duration_hours.toFixed(1)}h`,
            },
          ].map((m) => (
            <MetricCard
              key={m.label}
              label={m.label}
              value={m.value}
              isGood={m.good}
            />
          ))}
        </div>

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
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => v.slice(5)}
                  interval={14}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `${v.toFixed(1)}%`}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: 12,
                  }}
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

      {/* Execution Quality */}
      <TabsContent value="execution" className="space-y-4">
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
                    <TableCell className="text-right tabular-nums text-sm">
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

      {/* Config */}
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
  ];

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
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs text-muted-foreground font-medium pb-2 w-40">
                Metric
              </th>
              {items.map((b) => (
                <th
                  key={b.id}
                  className="text-right text-xs font-medium pb-2 px-3"
                >
                  <div>
                    <div>{b.algo}</div>
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
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExecutionResearchPage() {
  const [newBtOpen, setNewBtOpen] = React.useState(false);
  const [selectedBt, setSelectedBt] = React.useState<ExecutionBacktest | null>(
    EXECUTION_BACKTESTS.find((b) => b.status === "complete") ?? null,
  );
  const [compareSelected, setCompareSelected] = React.useState<string[]>([]);

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

  const bestSharpe = complete.reduce(
    (max, b) => Math.max(max, b.results?.sharpe_ratio ?? 0),
    0,
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Execution Backtests
          </h1>
          <p className="text-muted-foreground mt-1">
            Simulate order execution using strategy signals — compare TWAP,
            VWAP, and other algos. Analyse slippage, fill rates, and P&L.
          </p>
        </div>
        <div className="flex gap-2">
          {compareSelected.length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => {}}
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
      {compareSelected.length >= 2 && (
        <ExecutionComparePanel
          selected={compareSelected}
          onClose={() => setCompareSelected([])}
        />
      )}

      {/* Two-panel: list left, results right */}
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
                    <p className="text-sm font-medium truncate">{bt.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {bt.strategy_name}
                    </p>
                  </div>
                  <StatusBadge status={bt.status} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
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
                <ResultsView bt={selectedBt} />
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

      {/* New Backtest Dialog */}
      <NewExecutionBacktestDialog
        open={newBtOpen}
        onClose={() => setNewBtOpen(false)}
      />
    </div>
  );
}
