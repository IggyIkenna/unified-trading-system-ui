"use client";

import * as React from "react";
import Link from "next/link";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";
import {
  FlaskConical,
  Plus,
  Search,
  GitCompare,
  CheckCircle2,
  Clock,
  XCircle,
  Play,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStrategyBacktests,
  useStrategyTemplates,
} from "@/hooks/api/use-strategies";
import type {
  BacktestRun,
  StrategyTemplate,
} from "@/lib/strategy-platform-types";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  complete: {
    label: "Complete",
    color: "text-emerald-400",
    badgeClass: "border-emerald-400/30 text-emerald-400",
    icon: CheckCircle2,
  },
  running: {
    label: "Running",
    color: "text-blue-400",
    badgeClass: "border-blue-400/30 text-blue-400",
    icon: Play,
  },
  queued: {
    label: "Queued",
    color: "text-muted-foreground",
    badgeClass: "text-muted-foreground",
    icon: Clock,
  },
  failed: {
    label: "Failed",
    color: "text-red-400",
    badgeClass: "border-red-400/30 text-red-400",
    icon: XCircle,
  },
} as const;

function StatusBadge({ status }: { status: string }) {
  const cfg =
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.queued;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("text-xs gap-1", cfg.badgeClass)}>
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}

function MetricValue({ value, isGood }: { value: string; isGood?: boolean }) {
  return (
    <span
      className={cn(
        "font-mono text-sm font-medium tabular-nums",
        isGood === true
          ? "text-emerald-400"
          : isGood === false
            ? "text-red-400"
            : "",
      )}
    >
      {value}
    </span>
  );
}

// ─── New Backtest Dialog ──────────────────────────────────────────────────────

function NewBacktestDialog({
  templates,
  open,
  onClose,
}: {
  templates: StrategyTemplate[];
  open: boolean;
  onClose: () => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = React.useState("");
  const [instrument, setInstrument] = React.useState("BTC-USDT");
  const [dateStart, setDateStart] = React.useState("2024-01-01");
  const [dateEnd, setDateEnd] = React.useState("2026-01-01");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="size-5 text-amber-400" />
            New Strategy Backtest
          </DialogTitle>
          <DialogDescription>
            Configure a strategy backtest. Generated signals can then be used in
            the Execution tab for algo backtesting.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Strategy Template</Label>
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a strategy template…" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div>
                      <span className="font-medium">{t.name}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {t.archetype}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Instrument</Label>
            <Select value={instrument} onValueChange={setInstrument}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "BTC-USDT",
                  "ETH-USDT",
                  "SOL-USDT",
                  "ETH-PERP",
                  "BTC-PERP",
                ].map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onClose}
            disabled={!selectedTemplate}
            className="gap-2"
          >
            <Play className="size-4" />
            Launch Backtest
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Compare Panel ────────────────────────────────────────────────────────────

function ComparePanel({
  selected,
  backtests,
  onClose,
}: {
  selected: string[];
  backtests: BacktestRun[];
  onClose: () => void;
}) {
  const items = backtests.filter((b) => selected.includes(b.id)).slice(0, 3);
  if (items.length < 2) return null;

  const METRICS = [
    { key: "sharpe", label: "Sharpe Ratio", good: "high" },
    { key: "sortino", label: "Sortino Ratio", good: "high" },
    { key: "totalReturn", label: "Total Return", good: "high", pct: true },
    { key: "maxDrawdown", label: "Max Drawdown", good: "low", pct: true },
    { key: "hitRate", label: "Win Rate", good: "high", pct: true },
    { key: "profitFactor", label: "Profit Factor", good: "high" },
    { key: "alpha", label: "Alpha", good: "high", pct: true },
    { key: "avgSlippage", label: "Avg Slippage", good: "low", pct: true },
  ];

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitCompare className="size-4 text-primary" />
            Comparing {items.length} Backtests
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs text-muted-foreground font-medium pb-2 w-32">
                Metric
              </th>
              {items.map((b) => (
                <th
                  key={b.id}
                  className="text-right text-xs font-medium pb-2 px-3 max-w-[140px]"
                >
                  <div className="truncate">{b.configName ?? b.id}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric) => {
              const values = items.map(
                (b) => (b.metrics as unknown as Record<string, number>)?.[metric.key] ?? 0,
              );
              const best =
                metric.good === "high"
                  ? Math.max(...values)
                  : Math.min(...values);
              return (
                <tr key={metric.key} className="border-t border-border/40">
                  <td className="text-xs text-muted-foreground py-2">
                    {metric.label}
                  </td>
                  {items.map((b, i) => {
                    const val = values[i];
                    const isBest = val === best;
                    const display = metric.pct
                      ? `${(val * 100).toFixed(1)}%`
                      : val.toFixed(2);
                    return (
                      <td key={b.id} className="text-right py-2 px-3">
                        <MetricValue value={display} isGood={isBest} />
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

export default function StrategiesPage() {
  const [search, setSearch] = React.useState("");
  const [archetypeFilter, setArchetypeFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [newBacktestOpen, setNewBacktestOpen] = React.useState(false);
  const [compareSelected, setCompareSelected] = React.useState<string[]>([]);

  const { data: backtestsData, isLoading: btLoading } = useStrategyBacktests();
  const { data: templatesData } = useStrategyTemplates();

  const backtests: BacktestRun[] = React.useMemo(() => {
    const raw =
      (backtestsData as any)?.data ?? (backtestsData as any)?.backtests ?? [];
    return raw;
  }, [backtestsData]);

  const templates: StrategyTemplate[] = React.useMemo(() => {
    const raw =
      (templatesData as any)?.data ?? (templatesData as any)?.templates ?? [];
    return raw;
  }, [templatesData]);

  const archetypes = [
    ...new Set(backtests.map((b) => b.archetype).filter(Boolean)),
  ];

  const filtered = React.useMemo(() => {
    let items = backtests;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (b) =>
          (b.configName ?? "").toLowerCase().includes(q) ||
          (b.archetype ?? "").toLowerCase().includes(q),
      );
    }
    if (archetypeFilter !== "all")
      items = items.filter((b) => b.archetype === archetypeFilter);
    if (statusFilter !== "all")
      items = items.filter((b) => b.status === statusFilter);
    return items;
  }, [backtests, search, archetypeFilter, statusFilter]);

  const toggleCompare = (id: string) => {
    setCompareSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev,
    );
  };

  // Summary
  const complete = backtests.filter((b) => b.status === "completed").length;
  const candidates = backtests.filter((b) => (b as any).isCandidate).length;
  const bestSharpe = backtests
    .filter((b) => b.status === "completed" && b.metrics)
    .reduce((max, b) => Math.max(max, b.metrics?.sharpe ?? 0), 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Strategy Backtests
          </h1>
          <p className="text-muted-foreground mt-1">
            Signal generation backtests. Use results in the Execution tab for
            algo simulation.
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
          <Button size="sm" onClick={() => setNewBacktestOpen(true)}>
            <Plus className="size-4 mr-1" />
            New Backtest
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Backtests",
            value: String(backtests.length),
            color: "text-foreground",
          },
          {
            label: "Complete",
            value: String(complete),
            color: "text-emerald-400",
          },
          {
            label: "Candidates",
            value: String(candidates),
            color: "text-amber-400",
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
        <ComparePanel
          selected={compareSelected}
          backtests={backtests}
          onClose={() => setCompareSelected([])}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search backtests…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={archetypeFilter} onValueChange={setArchetypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Archetype" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Archetypes</SelectItem>
            {archetypes.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Complete</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        {compareSelected.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {compareSelected.length} selected for compare
          </Badge>
        )}
      </div>

      {/* Table */}
      {btLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FlaskConical className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {backtests.length === 0
                ? "No strategy backtests yet. Launch your first one."
                : "No backtests match your filters."}
            </p>
            {backtests.length === 0 && (
              <Button
                size="sm"
                className="mt-4"
                onClick={() => setNewBacktestOpen(true)}
              >
                <Plus className="size-4 mr-1" />
                New Backtest
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Name</TableHead>
                  <TableHead>Archetype</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Sharpe</TableHead>
                  <TableHead className="text-right">Return</TableHead>
                  <TableHead className="text-right">Max DD</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                  <TableHead className="text-right">Signals</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((bt) => {
                  const isSelected = compareSelected.includes(bt.id);
                  return (
                    <TableRow
                      key={bt.id}
                      className={cn(isSelected && "bg-primary/5")}
                    >
                      <TableCell>
                        <button
                          onClick={() => toggleCompare(bt.id)}
                          title="Add to compare"
                          className={cn(
                            "flex items-center justify-center size-5 rounded border transition-colors",
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border hover:border-primary",
                          )}
                        >
                          {isSelected && <CheckCircle2 className="size-3" />}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {bt.configName ?? bt.id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {bt.instrument ?? "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {bt.archetype}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={bt.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {bt.metrics ? (
                          <MetricValue
                            value={bt.metrics.sharpe.toFixed(2)}
                            isGood={bt.metrics.sharpe > 1.5}
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {bt.metrics ? (
                          <MetricValue
                            value={`${(bt.metrics.totalReturn * 100).toFixed(1)}%`}
                            isGood={bt.metrics.totalReturn > 0}
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {bt.metrics ? (
                          <MetricValue
                            value={`${(bt.metrics.maxDrawdown * 100).toFixed(1)}%`}
                            isGood={bt.metrics.maxDrawdown < 0.1}
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {bt.metrics ? (
                          <MetricValue
                            value={`${(bt.metrics.hitRate * 100).toFixed(1)}%`}
                            isGood={bt.metrics.hitRate > 0.5}
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {(bt as any).signalCount ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {bt.status === "completed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 gap-1"
                              asChild
                            >
                              <Link href="/services/research/execution">
                                <Zap className="size-3" />
                                Run Exec BT
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* New Backtest Dialog */}
      <NewBacktestDialog
        templates={templates}
        open={newBacktestOpen}
        onClose={() => setNewBacktestOpen(false)}
      />
    </div>
  );
}
