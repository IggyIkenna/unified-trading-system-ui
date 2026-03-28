"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  FlaskConical,
  Play,
  Plus,
  Search,
  Shield,
  Signal,
  Star,
  Wallet,
  X,
} from "lucide-react";
import * as React from "react";

import { StrategyWizard } from "@/components/research/strategy-wizard";
import { CandidateBasket, useCandidateBasket } from "@/components/platform/candidate-basket";
import { ApiError } from "@/components/ui/api-error";
import { EmptyState } from "@/components/ui/empty-state";
import { ExportDropdown } from "@/components/ui/export-dropdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateBacktest, useStrategyBacktests, useStrategyTemplates } from "@/hooks/api/use-strategies";
import { newOptimisticBacktestIds } from "@/lib/demo-ids";
import type { BacktestRun, StrategyTemplate } from "@/lib/strategy-platform-types";
import type { ExportColumn } from "@/lib/utils/export";

import {
  backtestExportColumns,
  backtestStatusColor,
  DEFI_ARCHETYPES,
  EMPTY_FILTERS,
  FEATURE_SET_OPTIONS,
  fmtNum,
  fmtPct,
  INITIAL_FORM,
  type BacktestFormState,
  type FilterState,
} from "./components/backtests-page-support";
import { BacktestsRunDialog } from "./components/backtests-run-dialog";

export default function BacktestsPage() {
  const {
    data: backtestsData,
    isLoading: backtestsLoading,
    isError: backtestsIsError,
    error: backtestsError,
    refetch: backtestsRefetch,
  } = useStrategyBacktests();
  const { data: templatesData, isLoading: templatesLoading } = useStrategyTemplates();
  const createBacktest = useCreateBacktest();

  const backtestsFromApi: BacktestRun[] = (backtestsData as any)?.data ?? (backtestsData as any)?.backtests ?? [];
  const STRATEGY_TEMPLATES: StrategyTemplate[] =
    (templatesData as any)?.data ?? (templatesData as any)?.templates ?? [];

  // Derive filter options from data
  const ARCHETYPE_OPTIONS = React.useMemo(() => {
    const counts: Record<string, number> = {};
    backtestsFromApi.forEach((bt) => {
      counts[bt.archetype] = (counts[bt.archetype] || 0) + 1;
    });
    return Object.entries(counts).map(([value, count]) => ({
      value,
      label: value.replace(/_/g, " "),
      count,
    }));
  }, [backtestsFromApi]);

  const VENUE_OPTIONS = React.useMemo(() => {
    const counts: Record<string, number> = {};
    backtestsFromApi.forEach((bt) => {
      counts[bt.venue] = (counts[bt.venue] || 0) + 1;
    });
    return Object.entries(counts).map(([value, count]) => ({
      value,
      label: value,
      count,
    }));
  }, [backtestsFromApi]);

  const TESTING_STAGE_OPTIONS = React.useMemo(() => {
    const counts: Record<string, number> = {};
    backtestsFromApi.forEach((bt) => {
      counts[bt.testingStage] = (counts[bt.testingStage] || 0) + 1;
    });
    return Object.entries(counts).map(([value, count]) => ({
      value,
      label: value.replace(/_/g, " "),
      count,
    }));
  }, [backtestsFromApi]);

  const [localBacktests, setLocalBacktests] = React.useState<BacktestRun[]>([]);
  const backtests = [...localBacktests, ...backtestsFromApi];
  const [filters, setFilters] = React.useState<FilterState>(EMPTY_FILTERS);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<BacktestFormState>(INITIAL_FORM);
  const basket = useCandidateBasket();
  const [wizardOpen, setWizardOpen] = React.useState(false);

  // Filter logic
  const filtered = backtests.filter((bt) => {
    if (filters.archetype && bt.archetype !== filters.archetype) return false;
    if (filters.venue && bt.venue !== filters.venue) return false;
    if (filters.stage && bt.testingStage !== filters.stage) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!bt.templateName.toLowerCase().includes(q) && !bt.instrument.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  function toggleCandidate(id: string) {
    if (basket.isSelected(id)) {
      basket.removeCandidate(id);
    } else {
      const bt = backtests.find((b) => b.id === id);
      if (bt) {
        basket.addCandidate({
          id: bt.id,
          type: "strategy_config",
          name: bt.templateName,
          version: bt.instrument,
          metrics: {
            sharpe: bt.metrics?.sharpe ?? 0,
            totalReturn: bt.metrics?.totalReturn ?? 0,
            maxDrawdown: bt.metrics?.maxDrawdown ?? 0,
          },
        });
      }
    }
  }

  const backtestColumns: ColumnDef<BacktestRun, unknown>[] = [
    {
      id: "star",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const bt = row.original;
        if (bt.status !== "completed") return null;
        return (
          <button
            onClick={() => toggleCandidate(bt.id)}
            className="p-0.5 rounded hover:bg-muted"
            title={basket.isSelected(bt.id) ? "Remove from basket" : "Add to candidate basket"}
          >
            <Star
              className={`size-3.5 ${basket.isSelected(bt.id) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
            />
          </button>
        );
      },
    },
    {
      accessorKey: "templateName",
      header: "Strategy",
      enableSorting: false,
      cell: ({ row }) => <span className="font-medium text-sm">{row.original.templateName}</span>,
    },
    {
      accessorKey: "instrument",
      header: "Instrument",
      enableSorting: false,
      cell: ({ row }) => <span className="text-muted-foreground text-xs font-mono">{row.original.instrument}</span>,
    },
    {
      accessorKey: "venue",
      header: "Venue",
      enableSorting: false,
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.venue}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant="outline" className={backtestStatusColor(row.original.status)}>
          {row.original.status === "running" ? `${row.original.progress}%` : row.original.status}
        </Badge>
      ),
    },
    {
      id: "sharpe",
      header: "Sharpe",
      accessorFn: (row) => row.metrics?.sharpe ?? -Infinity,
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.metrics ? fmtNum(row.original.metrics.sharpe) : "--"}</span>
      ),
    },
    {
      id: "return",
      header: "Return",
      accessorFn: (row) => row.metrics?.totalReturn ?? -Infinity,
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.metrics ? fmtPct(row.original.metrics.totalReturn) : "--"}
        </span>
      ),
    },
    {
      id: "drawdown",
      header: "Max DD",
      accessorFn: (row) => row.metrics?.maxDrawdown ?? Infinity,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-red-400">
          {row.original.metrics ? fmtPct(row.original.metrics.maxDrawdown) : "--"}
        </span>
      ),
    },
    {
      id: "sortino",
      header: "Sortino",
      accessorFn: (row) => row.metrics?.sortino ?? -Infinity,
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.metrics ? fmtNum(row.original.metrics.sortino) : "--"}</span>
      ),
    },
    {
      id: "hitRate",
      header: "Hit Rate",
      accessorFn: (row) => row.metrics?.hitRate ?? -Infinity,
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.metrics ? fmtPct(row.original.metrics.hitRate) : "--"}</span>
      ),
    },
    {
      id: "window",
      header: "Window",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {row.original.dateWindow.start} - {row.original.dateWindow.end}
        </span>
      ),
    },
  ];

  function handleSubmitBacktest() {
    if (!form.templateId) return;
    const tpl = STRATEGY_TEMPLATES.find((t) => t.id === form.templateId);
    if (!tpl) return;

    const ids = newOptimisticBacktestIds();
    const newBt: BacktestRun = {
      id: ids.id,
      configId: ids.configId,
      configVersion: "1.0.0",
      templateId: tpl.id,
      templateName: tpl.name,
      archetype: tpl.archetype,
      status: "queued",
      progress: 0,
      instrument: form.instrument || tpl.instruments[0],
      venue: form.venue || tpl.venues[0],
      dateWindow: { start: form.dateStart, end: form.dateEnd },
      shard: "SHARD_1",
      testingStage: "HISTORICAL",
      dataSource: "HISTORICAL_TICK",
      dataSnapshotId: ids.dataSnapshotId,
      asOfDate: ids.asOfDate,
      metrics: null,
      startedAt: null,
      completedAt: null,
      durationMs: null,
      codeCommitHash: "head",
      configHash: ids.configHash,
      liveAnalogId: null,
      driftScore: null,
    };

    createBacktest.mutate({
      templateId: tpl.id,
      instrument: form.instrument || tpl.instruments[0],
      venue: form.venue || tpl.venues[0],
      dateStart: form.dateStart,
      dateEnd: form.dateEnd,
      entryThreshold: parseFloat(form.entryThreshold),
      exitThreshold: parseFloat(form.exitThreshold),
      maxLeverage: parseFloat(form.maxLeverage),
    });

    // Optimistically add to local list
    setLocalBacktests((prev) => [newBt, ...prev]);
    setForm(INITIAL_FORM);
    setDialogOpen(false);
  }

  const isLoading = backtestsLoading || templatesLoading;
  const selectedTemplate = STRATEGY_TEMPLATES.find((t) => t.id === form.templateId);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (backtestsIsError) {
    return (
      <div className="p-6">
        <ApiError error={backtestsError} onRetry={() => backtestsRefetch()} />
      </div>
    );
  }

  if (backtests.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="No backtests"
          description="No backtests have been run yet. Create your first backtest to evaluate a strategy."
          action={{
            label: "Run New Backtest",
            onClick: () => setDialogOpen(true),
          }}
          icon={FlaskConical}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Backtest Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} backtests &middot; {backtests.filter((b) => b.status === "running").length} running
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportDropdown
              data={filtered.map(
                (bt) =>
                  ({
                    name: bt.templateName,
                    archetype: bt.archetype,
                    assetClass: bt.instrument,
                    status: bt.status,
                    sharpe: bt.metrics?.sharpe ?? null,
                    totalReturn: bt.metrics?.totalReturn ?? null,
                    maxDrawdown: bt.metrics?.maxDrawdown ?? null,
                    tradesCount: bt.metrics?.turnover ?? null,
                    sortino: bt.metrics?.sortino ?? null,
                    hitRate: bt.metrics?.hitRate ?? null,
                  }) as Record<string, unknown>,
              )}
              columns={backtestExportColumns}
              filename="strategy-backtests"
            />
            <Button variant="outline" onClick={() => setWizardOpen(true)}>
              <Plus className="size-4" />
              New Strategy
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Play className="size-4" />
              Run New Backtest
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-border/50">
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                <Filter className="size-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>

              <Select
                value={filters.archetype}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    archetype: v === "__all__" ? "" : v,
                  }))
                }
              >
                <SelectTrigger size="sm" className="w-40">
                  <SelectValue placeholder="Archetype" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Archetypes</SelectItem>
                  {ARCHETYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} ({opt.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.venue}
                onValueChange={(v) => setFilters((f) => ({ ...f, venue: v === "__all__" ? "" : v }))}
              >
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue placeholder="Venue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Venues</SelectItem>
                  {VENUE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} ({opt.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.stage}
                onValueChange={(v) => setFilters((f) => ({ ...f, stage: v === "__all__" ? "" : v }))}
              >
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Stages</SelectItem>
                  {TESTING_STAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} ({opt.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by name or instrument..."
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  className="pl-8 h-8 text-sm"
                />
              </div>

              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
                  <X className="size-3" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="size-4" />
              Backtest Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={backtestColumns} data={filtered} emptyMessage="No backtests found" />
          </CardContent>
        </Card>

        {/* Shared Candidate Basket — same component across Strategy/ML/Execution */}
        <CandidateBasket
          platform="strategy"
          candidates={basket.candidates}
          onRemove={basket.removeCandidate}
          onClearAll={basket.clearAll}
          onUpdateNote={basket.updateNote}
          onSendToReview={() => {
            /* navigate to promote pipeline */
          }}
          onPreparePackage={() => {
            /* generate promotion package */
          }}
        />

        {/* New Strategy Wizard */}
        <StrategyWizard open={wizardOpen} onOpenChange={setWizardOpen} />

        <BacktestsRunDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          form={form}
          setForm={setForm}
          strategyTemplates={STRATEGY_TEMPLATES}
          onSubmit={handleSubmitBacktest}
        />
      </div>
    </div>
  );
}
