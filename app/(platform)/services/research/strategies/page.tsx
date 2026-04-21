"use client";

/**
 * G1.1 intentional split — research/strategies renders the strategy
 * catalogue (templates, backtests, candidate enumeration). Its trading-phase
 * counterpart at /services/trading/strategies renders a live book of running
 * strategies (per-strategy positions, P&L, kill switches). These are distinct
 * conceptual surfaces — not phase forks of the same page. Per Stage 3E §1.1,
 * the phase prop pattern applies only to surfaces that SHARE a conceptual
 * role across research / paper / live.
 */
import { ApiError } from "@/components/shared/api-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useStrategyBacktests, useStrategyTemplates } from "@/hooks/api/use-strategies";
import {
  BACKTEST_ANALYTICS,
  BACKTEST_SIGNALS,
  BACKTEST_SIGNAL_QUALITY,
  BACKTEST_RUNS as MOCK_BACKTEST_RUNS,
  STRATEGY_TEMPLATES,
} from "@/lib/mocks/fixtures/strategy-platform";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import type { BacktestAnalytics } from "@/lib/types/backtest-analytics";
import type {
  BacktestRun,
  SignalQualityMetrics,
  StrategySignal,
  StrategyTemplate,
} from "@/lib/types/strategy-platform";
import { cn } from "@/lib/utils";
import { FlaskConical, GitCompare, Grid3X3, Plus, Search } from "lucide-react";
import * as React from "react";

import {
  GridSearchDialog,
  useCompareMode
} from "@/components/research/shared";
import { NewBacktestDialog } from "@/components/research/strategies/new-backtest-dialog";
import { ComparePanel, DetailPanel } from "@/components/research/strategies/strategy-detail-panel";
import { BacktestListItem } from "@/components/research/strategies/strategy-list-panel";
import { FamilyArchetypePicker } from "@/components/architecture-v2";
import type { StrategyArchetype, StrategyFamily } from "@/lib/architecture-v2";

// ─── Page ─────────────────────────────────────────────────────────────────────

type SortKey = "recent" | "sharpe" | "return" | "name";

export default function StrategiesPage() {
  const mockDataMode = isMockDataMode();
  const [search, setSearch] = React.useState("");
  const [archetypeFilter, setArchetypeFilter] = React.useState("all");
  const [v2Family, setV2Family] = React.useState<StrategyFamily | undefined>(
    undefined,
  );
  const [v2Archetype, setV2Archetype] = React.useState<
    StrategyArchetype | undefined
  >(undefined);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [shardFilter, setShardFilter] = React.useState("all");
  const [strategyKindFilter, setStrategyKindFilter] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("recent");
  const [newBacktestOpen, setNewBacktestOpen] = React.useState(false);
  const [gridSearchOpen, setGridSearchOpen] = React.useState(false);
  const { compareSelected, toggleCompare, clearCompare, compareCount } = useCompareMode(3);
  const [selectedBt, setSelectedBt] = React.useState<string | null>(null);

  const {
    data: backtestsData,
    isLoading: btLoading,
    isError: btIsError,
    error: btError,
    refetch: refetchBt,
  } = useStrategyBacktests();
  const {
    data: templatesData,
    isLoading: tplLoading,
    isError: tplIsError,
    error: tplError,
    refetch: refetchTpl,
  } = useStrategyTemplates();

  const backtests: BacktestRun[] = React.useMemo(() => {
    const raw =
      (backtestsData as Record<string, unknown>)?.data ?? (backtestsData as Record<string, unknown>)?.backtests ?? [];
    const arr = raw as BacktestRun[];
    if (arr.length > 0) return arr;
    return mockDataMode ? MOCK_BACKTEST_RUNS : [];
  }, [backtestsData, mockDataMode]);

  const templates: StrategyTemplate[] = React.useMemo(() => {
    const raw =
      (templatesData as Record<string, unknown>)?.data ?? (templatesData as Record<string, unknown>)?.templates ?? [];
    const arr = raw as StrategyTemplate[];
    if (arr.length > 0) return arr;
    return mockDataMode ? STRATEGY_TEMPLATES : [];
  }, [templatesData, mockDataMode]);

  const archetypes = [...new Set(backtests.map((b) => b.archetype).filter(Boolean))];
  const shards = [...new Set(backtests.map((b) => b.shard).filter(Boolean))];

  const filtered = React.useMemo(() => {
    let items = backtests;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (b) =>
          (b.configName ?? "").toLowerCase().includes(q) ||
          (b.archetype ?? "").toLowerCase().includes(q) ||
          (b.instrument ?? "").toLowerCase().includes(q) ||
          (b.shard ?? "").toLowerCase().includes(q),
      );
    }
    if (archetypeFilter !== "all") items = items.filter((b) => b.archetype === archetypeFilter);
    if (v2Archetype)
      items = items.filter(
        (b) => ((b.archetype as string | undefined) ?? "") === (v2Archetype as string),
      );
    if (statusFilter !== "all") items = items.filter((b) => b.status === statusFilter);
    if (shardFilter !== "all") items = items.filter((b) => b.shard === shardFilter);
    if (strategyKindFilter !== "all") {
      items = items.filter((b) => (b.strategyKind ?? "ml") === strategyKindFilter);
    }

    const sorted = [...items];
    switch (sortKey) {
      case "sharpe":
        sorted.sort((a, b) => (b.metrics?.sharpe ?? -999) - (a.metrics?.sharpe ?? -999));
        break;
      case "return":
        sorted.sort((a, b) => (b.metrics?.totalReturn ?? -999) - (a.metrics?.totalReturn ?? -999));
        break;
      case "name":
        sorted.sort((a, b) =>
          (a.configName ?? a.templateName ?? "").localeCompare(b.configName ?? b.templateName ?? ""),
        );
        break;
      case "recent":
      default:
        sorted.sort((a, b) => {
          const ta = new Date(a.startedAt ?? 0).getTime();
          const tb = new Date(b.startedAt ?? 0).getTime();
          return tb - ta;
        });
    }
    return sorted;
  }, [backtests, search, archetypeFilter, v2Archetype, statusFilter, shardFilter, strategyKindFilter, sortKey]);

  // toggleCompare and compareSelected from useCompareMode hook

  const selectedBacktest = selectedBt ? (backtests.find((b) => b.id === selectedBt) ?? null) : null;

  const showCompare = compareCount >= 2 && !selectedBt;
  const showDetail = selectedBacktest && !showCompare;

  const detailAnalytics: BacktestAnalytics | null =
    showDetail && selectedBt ? (BACKTEST_ANALYTICS[selectedBt] ?? null) : null;
  const detailSignals: StrategySignal[] = showDetail && selectedBt ? (BACKTEST_SIGNALS[selectedBt] ?? []) : [];
  const detailQuality: SignalQualityMetrics | null =
    showDetail && selectedBt ? (BACKTEST_SIGNAL_QUALITY[selectedBt] ?? null) : null;

  if (!btLoading && !tplLoading && (btIsError || tplIsError)) {
    return (
      <div className="p-6">
        <ApiError
          error={(btError ?? tplError) as Error}
          onRetry={() => {
            void refetchBt();
            void refetchTpl();
          }}
          title="Failed to load strategies"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar: search + new backtest button on first row, filters below */}
      <div className="flex flex-col gap-3 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative min-w-[200px] max-w-md flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search backtests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {compareCount >= 2 && (
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setSelectedBt(null)}>
                <GitCompare className="size-4" />
                Compare ({compareCount})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setGridSearchOpen(true)}>
              <Grid3X3 className="size-4 mr-1" />
              Grid Search
            </Button>
            <Button size="sm" onClick={() => setNewBacktestOpen(true)}>
              <Plus className="size-4 mr-1" />
              New Backtest
            </Button>
          </div>
        </div>
        <div
          className="flex flex-wrap items-center gap-3"
          data-testid="research-strategies-family-picker"
        >
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            v2 scope
          </span>
          <FamilyArchetypePicker
            idPrefix="research-strategies"
            availabilityFilter="allowed"
            value={{ family: v2Family, archetype: v2Archetype }}
            onChange={(next) => {
              setV2Family(next.family);
              setV2Archetype(next.archetype);
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
          <Select value={shardFilter} onValueChange={setShardFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Shard" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shards</SelectItem>
              {shards.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={strategyKindFilter} onValueChange={setStrategyKindFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Strategy kind" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ML & Rule</SelectItem>
              <SelectItem value="ml">ML only</SelectItem>
              <SelectItem value="rule">Rule only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent first</SelectItem>
              <SelectItem value="sharpe">Sharpe (high)</SelectItem>
              <SelectItem value="return">Total return</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
          {compareCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {compareCount} selected for compare
            </Badge>
          )}
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="flex-1 flex min-h-0 px-6 pb-6 gap-4">
        {/* Left Panel: Backtest List */}
        <div
          className={cn(
            "flex flex-col gap-2 overflow-y-auto pr-1",
            showDetail || showCompare ? "w-[340px] shrink-0" : "flex-1",
          )}
        >
          {btLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FlaskConical className="size-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  {backtests.length === 0
                    ? "No strategy backtests yet. Launch your first one."
                    : "No backtests match your filters."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((bt) => (
              <BacktestListItem
                key={bt.id}
                bt={bt}
                isSelected={selectedBt === bt.id}
                isCompareSelected={compareSelected.includes(bt.id)}
                onSelect={() => setSelectedBt(bt.id)}
                onToggleCompare={() => toggleCompare(bt.id)}
              />
            ))
          )}
        </div>

        {/* Right Panel: Detail or Compare */}
        {(showDetail || showCompare) && (
          <div className="flex-1 border rounded-lg overflow-hidden bg-card min-w-0">
            {showDetail && selectedBacktest && detailAnalytics && detailQuality ? (
              <DetailPanel
                bt={selectedBacktest}
                analytics={detailAnalytics}
                signals={detailSignals}
                quality={detailQuality}
                onClose={() => setSelectedBt(null)}
              />
            ) : showCompare ? (
              <ComparePanel selected={compareSelected} backtests={backtests} onClose={clearCompare} />
            ) : null}
          </div>
        )}
      </div>

      <NewBacktestDialog templates={templates} open={newBacktestOpen} onClose={() => setNewBacktestOpen(false)} />

      <GridSearchDialog open={gridSearchOpen} onClose={() => setGridSearchOpen(false)} domain="strategy" />
    </div>
  );
}
