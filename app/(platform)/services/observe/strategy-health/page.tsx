"use client";

import { ApiError } from "@/components/shared/api-error";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useStrategyHealth,
  type ExecutionQuality,
  type PnlDrift,
  type SignalFreshness,
  type StrategyHealth,
} from "@/hooks/api/use-strategies";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import {
  AlertTriangle,
  ArrowUpDown,
  Clock,
  HeartPulse,
  Minus,
  Radio,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import * as React from "react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function healthColor(score: number): string {
  if (score > 80) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function healthBg(score: number): string {
  if (score > 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function pnlDriftLabel(drift: PnlDrift) {
  switch (drift) {
    case "on_track":
      return (
        <span className="flex items-center gap-1 text-emerald-400 text-xs">
          <TrendingUp className="size-3" /> On Track
        </span>
      );
    case "drifting":
      return (
        <span className="flex items-center gap-1 text-amber-400 text-xs">
          <Minus className="size-3" /> Drifting
        </span>
      );
    case "off_track":
      return (
        <span className="flex items-center gap-1 text-red-400 text-xs">
          <TrendingDown className="size-3" /> Off Track
        </span>
      );
  }
}

function signalFreshnessLabel(freshness: SignalFreshness) {
  switch (freshness) {
    case "fresh":
      return (
        <span className="flex items-center gap-1 text-emerald-400 text-xs">
          <Radio className="size-3" /> Fresh
        </span>
      );
    case "stale":
      return (
        <span className="flex items-center gap-1 text-amber-400 text-xs">
          <Clock className="size-3" /> Stale
        </span>
      );
    case "expired":
      return (
        <span className="flex items-center gap-1 text-red-400 text-xs">
          <AlertTriangle className="size-3" /> Expired
        </span>
      );
  }
}

function executionQualityLabel(quality: ExecutionQuality) {
  switch (quality) {
    case "normal":
      return (
        <span className="flex items-center gap-1 text-emerald-400 text-xs">
          <Zap className="size-3" /> Normal
        </span>
      );
    case "degraded":
      return (
        <span className="flex items-center gap-1 text-amber-400 text-xs">
          <Zap className="size-3" /> Degraded
        </span>
      );
    case "poor":
      return (
        <span className="flex items-center gap-1 text-red-400 text-xs">
          <Zap className="size-3" /> Poor
        </span>
      );
  }
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "live":
      return "success" as const;
    case "paper":
      return "running" as const;
    case "paused":
      return "warning" as const;
    default:
      return "outline" as const;
  }
}

function formatPnl(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${Math.abs(value).toLocaleString()}`;
}

// ── Constants ────────────────────────────────────────────────────────────────

const ASSET_GROUPS = ["All", "Crypto", "DeFi", "Equities", "FX", "Fixed Income", "Commodities", "Sports"] as const;
const HEALTH_STATUSES = ["All", "Healthy", "Warning", "Critical"] as const;
const SORT_OPTIONS = [
  { value: "health-desc", label: "Health (High to Low)" },
  { value: "health-asc", label: "Health (Low to High)" },
  { value: "pnl-desc", label: "PnL (High to Low)" },
  { value: "pnl-asc", label: "PnL (Low to High)" },
  { value: "drawdown-desc", label: "Drawdown (High to Low)" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["value"];

function getHealthBucket(score: number): string {
  if (score > 80) return "Healthy";
  if (score >= 50) return "Warning";
  return "Critical";
}

// ── Component ────────────────────────────────────────────────────────────────

export default function StrategyHealthPage() {
  const { data: strategies, isLoading, isError, error, refetch } = useStrategyHealth();
  const [assetClassFilter, setAssetClassFilter] = React.useState<string>("All");
  const [healthFilter, setHealthFilter] = React.useState<string>("All");
  const [sortBy, setSortBy] = React.useState<SortKey>("health-desc");

  const filtered = React.useMemo(() => {
    if (!strategies) return [];
    let result = strategies.filter((s) => {
      if (assetClassFilter !== "All" && s.assetClass !== assetClassFilter) return false;
      if (healthFilter !== "All" && getHealthBucket(s.healthScore) !== healthFilter) return false;
      return true;
    });

    const [key, dir] = sortBy.split("-") as [string, string];
    result = [...result].sort((a, b) => {
      let aVal: number;
      let bVal: number;
      switch (key) {
        case "health":
          aVal = a.healthScore;
          bVal = b.healthScore;
          break;
        case "pnl":
          aVal = a.pnlToday;
          bVal = b.pnlToday;
          break;
        case "drawdown":
          aVal = a.drawdownPct;
          bVal = b.drawdownPct;
          break;
        default:
          aVal = a.healthScore;
          bVal = b.healthScore;
      }
      return dir === "desc" ? bVal - aVal : aVal - bVal;
    });

    return result;
  }, [strategies, assetClassFilter, healthFilter, sortBy]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <ApiError error={error as Error} onRetry={() => void refetch()} title="Failed to load strategy health" />
      </div>
    );
  }

  if (!strategies || strategies.length === 0) {
    return (
      <div className="p-6">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <HeartPulse className="size-6 text-emerald-400" />
              Strategy Health
            </span>
          }
          description="Live health monitoring across all active strategies"
        />
        <EmptyState title="No strategies" description="No strategy health records are available." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <HeartPulse className="size-6 text-emerald-400" />
              Strategy Health
            </span>
          }
          description="Live health monitoring across all active strategies"
        />

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Total</div>
              <div className="text-2xl font-semibold font-mono">{strategies?.length ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Healthy</div>
              <div className="text-2xl font-semibold font-mono text-emerald-400">
                {strategies?.filter((s) => s.healthScore > 80).length ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Warning</div>
              <div className="text-2xl font-semibold font-mono text-amber-400">
                {strategies?.filter((s) => s.healthScore >= 50 && s.healthScore <= 80).length ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Critical</div>
              <div className="text-2xl font-semibold font-mono text-red-400">
                {strategies?.filter((s) => s.healthScore < 50).length ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters + Sort */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={assetClassFilter} onValueChange={setAssetClassFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Asset Class" />
            </SelectTrigger>
            <SelectContent>
              {ASSET_GROUPS.map((ac) => (
                <SelectItem key={ac} value={ac}>
                  {ac === "All" ? "All Classes" : ac}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Health" />
            </SelectTrigger>
            <SelectContent>
              {HEALTH_STATUSES.map((h) => (
                <SelectItem key={h} value={h}>
                  {h === "All" ? "All Health" : h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-[200px]">
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="size-3" />
                <SelectValue placeholder="Sort" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} {filtered.length === 1 ? "strategy" : "strategies"}
          </span>
        </div>

        {/* Strategy Cards Grid */}
        {filtered.length === 0 ? (
          <EmptyState title="No matching strategies" description="No strategies match the current filters." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((strategy) => (
              <StrategyCard key={strategy.id} strategy={strategy} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StrategyCard({ strategy }: { strategy: StrategyHealth }) {
  const drawdownRatio = strategy.maxDrawdownPct > 0 ? (strategy.drawdownPct / strategy.maxDrawdownPct) * 100 : 0;

  return (
    <Card className="bg-card/50 hover:bg-card/80 transition-colors">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-medium truncate">{strategy.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px]">
                {strategy.assetClass}
              </Badge>
              <Badge variant={statusBadgeVariant(strategy.status)} className="text-[10px] capitalize">
                {strategy.status}
              </Badge>
            </div>
          </div>
          {/* Health score circle */}
          <div className="flex flex-col items-center shrink-0">
            <div
              className={cn(
                "flex items-center justify-center size-12 rounded-full border-2 font-mono text-lg font-semibold",
                strategy.healthScore > 80 && "border-emerald-500/50",
                strategy.healthScore >= 50 && strategy.healthScore <= 80 && "border-amber-500/50",
                strategy.healthScore < 50 && "border-red-500/50",
                healthColor(strategy.healthScore),
              )}
            >
              {strategy.healthScore}
            </div>
            <span className="text-[9px] text-muted-foreground mt-0.5">Health</span>
          </div>
        </div>

        {/* Indicators grid */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">PnL Drift</div>
            {pnlDriftLabel(strategy.pnlDrift)}
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">Signal</div>
            {signalFreshnessLabel(strategy.signalFreshness)}
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">Execution</div>
            {executionQualityLabel(strategy.executionQuality)}
          </div>
        </div>

        {/* Drawdown bar */}
        <div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>Drawdown</span>
            <span className="font-mono">
              {formatPercent(strategy.drawdownPct, 1)} / {strategy.maxDrawdownPct}%
            </span>
          </div>
          <Progress
            value={Math.min(drawdownRatio, 100)}
            className={cn(
              "h-1.5",
              drawdownRatio <= 50 && "[&>div]:bg-emerald-500",
              drawdownRatio > 50 && drawdownRatio <= 80 && "[&>div]:bg-amber-500",
              drawdownRatio > 80 && "[&>div]:bg-red-500",
            )}
          />
        </div>

        {/* Bottom metrics */}
        <div className="flex items-center justify-between text-xs border-t border-border pt-3">
          <div>
            <span className="text-muted-foreground">Sharpe: </span>
            <span className="font-mono font-medium">{formatNumber(strategy.sharpeRatio, 1)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Today: </span>
            <span className={cn("font-mono font-medium", strategy.pnlToday >= 0 ? "text-emerald-400" : "text-red-400")}>
              {formatPnl(strategy.pnlToday)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
