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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  CandidateBasket,
  useCandidateBasket,
} from "@/components/platform/candidate-basket";
import { ApiError } from "@/components/ui/api-error";
import { EmptyState } from "@/components/ui/empty-state";
import { ExportDropdown } from "@/components/ui/export-dropdown";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateBacktest,
  useStrategyBacktests,
  useStrategyTemplates,
} from "@/hooks/api/use-strategies";
import { newOptimisticBacktestIds } from "@/lib/demo-ids";
import type {
  BacktestRun,
  StrategyTemplate,
} from "@/lib/strategy-platform-types";
import type { ExportColumn } from "@/lib/utils/export";

// ---------------------------------------------------------------------------
// Export columns
// ---------------------------------------------------------------------------

const backtestExportColumns: ExportColumn[] = [
  { key: "name", header: "Name" },
  { key: "archetype", header: "Archetype" },
  { key: "assetClass", header: "Asset Class" },
  { key: "status", header: "Status" },
  { key: "sharpe", header: "Sharpe", format: "number" },
  { key: "totalReturn", header: "Total Return", format: "percent" },
  { key: "maxDrawdown", header: "Max Drawdown", format: "percent" },
  { key: "tradesCount", header: "Trades Count", format: "number" },
  { key: "sortino", header: "Sortino", format: "number" },
  { key: "hitRate", header: "Hit Rate", format: "percent" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function backtestStatusColor(status: BacktestRun["status"]) {
  switch (status) {
    case "completed":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "running":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "queued":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "failed":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case "cancelled":
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
  }
}

function fmtPct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function fmtNum(v: number, decimals = 2) {
  return v.toFixed(decimals);
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

interface FilterState {
  archetype: string;
  assetClass: string;
  venue: string;
  stage: string;
  search: string;
}

const EMPTY_FILTERS: FilterState = {
  archetype: "",
  assetClass: "",
  venue: "",
  stage: "",
  search: "",
};

// ---------------------------------------------------------------------------
// Collapsible Config Section (matches ML Training ConfigSection pattern)
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
      {open && <CardContent className="pt-0 pb-4 space-y-4">{children}</CardContent>}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// New Backtest Form
// ---------------------------------------------------------------------------

interface BacktestFormState {
  templateId: string;
  instrument: string;
  venue: string;
  dateStart: string;
  dateEnd: string;
  entryThreshold: string;
  exitThreshold: string;
  maxLeverage: string;
  // Risk Config
  maxPositionSize: string;
  stopLossPct: string;
  takeProfitPct: string;
  maxDrawdownPct: string;
  positionSizing: string;
  // Signal Config
  signalSource: string;
  confidenceThreshold: number;
  directionMapping: string;
  featureSets: string[];
  lookbackWindow: string;
  rebalanceFrequency: string;
  // DeFi Config
  protocol: string;
  chain: string;
  minSpreadBps: string;
  healthFactorThreshold: string;
  smartOrderRouting: boolean;
  gasBudgetUsd: string;
}

const INITIAL_FORM: BacktestFormState = {
  templateId: "",
  instrument: "",
  venue: "",
  dateStart: "2024-01-01",
  dateEnd: "2024-12-31",
  entryThreshold: "0.05",
  exitThreshold: "0.02",
  maxLeverage: "3.0",
  // Risk Config
  maxPositionSize: "100000",
  stopLossPct: "0.05",
  takeProfitPct: "0.10",
  maxDrawdownPct: "0.15",
  positionSizing: "fixed",
  // Signal Config
  signalSource: "rule-based",
  confidenceThreshold: 65,
  directionMapping: "binary",
  featureSets: ["momentum", "volatility"],
  lookbackWindow: "1d",
  rebalanceFrequency: "1h",
  // DeFi Config
  protocol: "Aave",
  chain: "Ethereum",
  minSpreadBps: "10",
  healthFactorThreshold: "1.3",
  smartOrderRouting: true,
  gasBudgetUsd: "50",
};

const FEATURE_SET_OPTIONS = [
  "momentum",
  "volatility",
  "on-chain",
  "macro",
  "calendar",
] as const;

const DEFI_ARCHETYPES = [
  "DEFI_YIELD",
  "DEFI_BASIS",
  "DEFI_LENDING",
  "RECURSIVE_BASIS",
  "STAKED_BASIS",
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BacktestsPage() {
  const {
    data: backtestsData,
    isLoading: backtestsLoading,
    isError: backtestsIsError,
    error: backtestsError,
    refetch: backtestsRefetch,
  } = useStrategyBacktests();
  const { data: templatesData, isLoading: templatesLoading } =
    useStrategyTemplates();
  const createBacktest = useCreateBacktest();

  const backtestsFromApi: BacktestRun[] =
    (backtestsData as any)?.data ?? (backtestsData as any)?.backtests ?? [];
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
      if (
        !bt.templateName.toLowerCase().includes(q) &&
        !bt.instrument.toLowerCase().includes(q)
      )
        return false;
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
            title={
              basket.isSelected(bt.id)
                ? "Remove from basket"
                : "Add to candidate basket"
            }
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
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.original.templateName}</span>
      ),
    },
    {
      accessorKey: "instrument",
      header: "Instrument",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs font-mono">
          {row.original.instrument}
        </span>
      ),
    },
    {
      accessorKey: "venue",
      header: "Venue",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {row.original.venue}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={backtestStatusColor(row.original.status)}
        >
          {row.original.status === "running"
            ? `${row.original.progress}%`
            : row.original.status}
        </Badge>
      ),
    },
    {
      id: "sharpe",
      header: "Sharpe",
      accessorFn: (row) => row.metrics?.sharpe ?? -Infinity,
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.metrics ? fmtNum(row.original.metrics.sharpe) : "--"}
        </span>
      ),
    },
    {
      id: "return",
      header: "Return",
      accessorFn: (row) => row.metrics?.totalReturn ?? -Infinity,
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.metrics
            ? fmtPct(row.original.metrics.totalReturn)
            : "--"}
        </span>
      ),
    },
    {
      id: "drawdown",
      header: "Max DD",
      accessorFn: (row) => row.metrics?.maxDrawdown ?? Infinity,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-red-400">
          {row.original.metrics
            ? fmtPct(row.original.metrics.maxDrawdown)
            : "--"}
        </span>
      ),
    },
    {
      id: "sortino",
      header: "Sortino",
      accessorFn: (row) => row.metrics?.sortino ?? -Infinity,
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.metrics ? fmtNum(row.original.metrics.sortino) : "--"}
        </span>
      ),
    },
    {
      id: "hitRate",
      header: "Hit Rate",
      accessorFn: (row) => row.metrics?.hitRate ?? -Infinity,
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.metrics ? fmtPct(row.original.metrics.hitRate) : "--"}
        </span>
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
  const selectedTemplate = STRATEGY_TEMPLATES.find(
    (t) => t.id === form.templateId,
  );
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
            <h1 className="text-2xl font-bold tracking-tight">
              Backtest Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} backtests &middot;{" "}
              {backtests.filter((b) => b.status === "running").length} running
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
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
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
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, venue: v === "__all__" ? "" : v }))
                }
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
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, stage: v === "__all__" ? "" : v }))
                }
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
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, search: e.target.value }))
                  }
                  className="pl-8 h-8 text-sm"
                />
              </div>

              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                >
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
            <DataTable
              columns={backtestColumns}
              data={filtered}
              emptyMessage="No backtests found"
            />
          </CardContent>
        </Card>

        {/* Shared Candidate Basket — same component across Strategy/ML/Execution */}
        <CandidateBasket
          platform="strategy"
          candidates={basket.candidates}
          onRemove={basket.removeCandidate}
          onClearAll={basket.clearAll}
          onUpdateNote={basket.updateNote}
          onSendToReview={() => {/* navigate to promote pipeline */}}
          onPreparePackage={() => {/* generate promotion package */}}
        />

        {/* New Strategy Wizard */}
        <StrategyWizard open={wizardOpen} onOpenChange={setWizardOpen} />

        {/* New Backtest Dialog — expanded config matching ML Training style */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FlaskConical className="size-5 text-primary" />
                Run New Backtest
              </DialogTitle>
              <DialogDescription>
                Configure strategy template, risk parameters, signal config, and test window.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Section A: Core Config */}
              <CollapsibleConfigSection
                title="Core Config"
                icon={<FlaskConical className="size-3.5 text-muted-foreground" />}
                defaultOpen={true}
              >
                <div className="space-y-2">
                  <Label>Strategy Template</Label>
                  <Select
                    value={form.templateId}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        templateId: v,
                        instrument: "",
                        venue: "",
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {STRATEGY_TEMPLATES.map((tpl) => (
                        <SelectItem key={tpl.id} value={tpl.id}>
                          <span className="flex items-center gap-2">
                            {tpl.name}
                            <span className="text-muted-foreground text-xs">
                              {tpl.archetype.replace(/_/g, " ")}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Select the strategy archetype to backtest
                  </p>
                </div>

                {selectedTemplate && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Instrument</Label>
                        <Select
                          value={form.instrument}
                          onValueChange={(v) =>
                            setForm((f) => ({ ...f, instrument: v }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedTemplate.instruments.map((inst) => (
                              <SelectItem key={inst} value={inst}>
                                {inst}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Venue</Label>
                        <Select
                          value={form.venue}
                          onValueChange={(v) =>
                            setForm((f) => ({ ...f, venue: v }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedTemplate.venues.map((v) => (
                              <SelectItem key={v} value={v}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={form.dateStart}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, dateStart: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={form.dateEnd}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, dateEnd: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/50 p-3 space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Parameters
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Entry Threshold</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={form.entryThreshold}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                entryThreshold: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Exit Threshold</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={form.exitThreshold}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                exitThreshold: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Max Leverage</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={form.maxLeverage}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                maxLeverage: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CollapsibleConfigSection>

              {/* Section B: Risk Config */}
              <CollapsibleConfigSection
                title="Risk Parameters"
                icon={<Shield className="size-3.5 text-muted-foreground" />}
                defaultOpen={false}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max Position Size ($)</Label>
                    <Input
                      type="number"
                      value={form.maxPositionSize}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, maxPositionSize: e.target.value }))
                      }
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Maximum notional per position
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Position Sizing</Label>
                    <Select
                      value={form.positionSizing}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, positionSizing: v }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="kelly">Kelly Criterion</SelectItem>
                        <SelectItem value="risk-parity">Risk Parity</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Method for determining trade size
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Stop Loss %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="0.50"
                      value={form.stopLossPct}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, stopLossPct: e.target.value }))
                      }
                    />
                    <p className="text-[11px] text-muted-foreground">0.01 - 0.50</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Take Profit %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="1.00"
                      value={form.takeProfitPct}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, takeProfitPct: e.target.value }))
                      }
                    />
                    <p className="text-[11px] text-muted-foreground">0.01 - 1.00</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Drawdown %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.maxDrawdownPct}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, maxDrawdownPct: e.target.value }))
                      }
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Circuit breaker threshold
                    </p>
                  </div>
                </div>
              </CollapsibleConfigSection>

              {/* Section C: Signal Config */}
              <CollapsibleConfigSection
                title="Signal & ML Config"
                icon={<Signal className="size-3.5 text-muted-foreground" />}
                defaultOpen={false}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Signal Source</Label>
                    <Select
                      value={form.signalSource}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, signalSource: v }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rule-based">Rule-Based</SelectItem>
                        <SelectItem value="ml-model">ML Model</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      How trading signals are generated
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Direction Mapping</Label>
                    <Select
                      value={form.directionMapping}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, directionMapping: v }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="binary">Binary (Long/Short)</SelectItem>
                        <SelectItem value="ternary">Ternary (Long/Short/Flat)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Signal output classification
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Confidence Threshold:{" "}
                    <span className="font-mono text-primary">
                      {form.confidenceThreshold}%
                    </span>
                  </Label>
                  <Slider
                    value={[form.confidenceThreshold]}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, confidenceThreshold: v[0] }))
                    }
                    min={0}
                    max={100}
                    step={1}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Minimum prediction confidence to trigger a trade
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Feature Sets</Label>
                  <div className="flex flex-wrap gap-2">
                    {FEATURE_SET_OPTIONS.map((feat) => (
                      <Badge
                        key={feat}
                        variant="outline"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            featureSets: f.featureSets.includes(feat)
                              ? f.featureSets.filter((x) => x !== feat)
                              : [...f.featureSets, feat],
                          }))
                        }
                        className={`cursor-pointer text-xs transition-colors capitalize ${
                          form.featureSets.includes(feat)
                            ? "border-primary bg-primary/10 text-primary"
                            : "hover:border-border"
                        }`}
                      >
                        {feat}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Select which feature groups to include
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lookback Window</Label>
                    <Select
                      value={form.lookbackWindow}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, lookbackWindow: v }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1h">1 Hour</SelectItem>
                        <SelectItem value="4h">4 Hours</SelectItem>
                        <SelectItem value="1d">1 Day</SelectItem>
                        <SelectItem value="1w">1 Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Rebalance Frequency</Label>
                    <Select
                      value={form.rebalanceFrequency}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, rebalanceFrequency: v }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1min">1 Minute</SelectItem>
                        <SelectItem value="5min">5 Minutes</SelectItem>
                        <SelectItem value="1h">1 Hour</SelectItem>
                        <SelectItem value="4h">4 Hours</SelectItem>
                        <SelectItem value="1d">1 Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleConfigSection>

              {/* Section D: DeFi Config — only visible for DeFi archetypes */}
              {selectedTemplate &&
                (DEFI_ARCHETYPES as readonly string[]).includes(
                  selectedTemplate.archetype,
                ) && (
                  <CollapsibleConfigSection
                    title="DeFi Config"
                    icon={<Wallet className="size-3.5 text-muted-foreground" />}
                    defaultOpen={false}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Protocol</Label>
                        <Select
                          value={form.protocol}
                          onValueChange={(v) =>
                            setForm((f) => ({ ...f, protocol: v }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Aave">Aave</SelectItem>
                            <SelectItem value="Uniswap">Uniswap</SelectItem>
                            <SelectItem value="Compound">Compound</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">
                          Target DeFi protocol
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Chain</Label>
                        <Select
                          value={form.chain}
                          onValueChange={(v) =>
                            setForm((f) => ({ ...f, chain: v }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ethereum">Ethereum</SelectItem>
                            <SelectItem value="Arbitrum">Arbitrum</SelectItem>
                            <SelectItem value="Optimism">Optimism</SelectItem>
                            <SelectItem value="Polygon">Polygon</SelectItem>
                            <SelectItem value="Base">Base</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">
                          Deployment chain for execution
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Min Spread (BPS)</Label>
                        <Input
                          type="number"
                          value={form.minSpreadBps}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, minSpreadBps: e.target.value }))
                          }
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Minimum spread to enter
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Health Factor</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={form.healthFactorThreshold}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              healthFactorThreshold: e.target.value,
                            }))
                          }
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Min health factor threshold
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Gas Budget (USD)</Label>
                        <Input
                          type="number"
                          value={form.gasBudgetUsd}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, gasBudgetUsd: e.target.value }))
                          }
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Max gas spend per cycle
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Leverage</Label>
                        <Input
                          type="number"
                          step="0.1"
                          defaultValue="3.0"
                          min={1}
                          max={20}
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Maximum leverage ratio (DeFiStrategyConfigDict.max_leverage)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Rebalance Trigger</Label>
                        <Select defaultValue="threshold">
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="threshold">Threshold-based</SelectItem>
                            <SelectItem value="periodic">Periodic</SelectItem>
                            <SelectItem value="health_factor">Health Factor</SelectItem>
                            <SelectItem value="manual">Manual Only</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">
                          When to trigger rebalancing (rebalancing_config.trigger_type)
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>LTV Max (%)</Label>
                        <Input type="number" step="1" defaultValue="75" min={0} max={100} />
                        <p className="text-[11px] text-muted-foreground">
                          Maximum loan-to-value ratio (risk_limits.ltv_max)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Margin Usage Max (%)</Label>
                        <Input type="number" step="1" defaultValue="80" min={0} max={100} />
                        <p className="text-[11px] text-muted-foreground">
                          Maximum margin utilisation (risk_limits.margin_usage_max)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="smart-order-routing"
                        checked={form.smartOrderRouting}
                        onCheckedChange={(v) =>
                          setForm((f) => ({ ...f, smartOrderRouting: v }))
                        }
                      />
                      <Label htmlFor="smart-order-routing" className="cursor-pointer">
                        Smart Order Routing
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Route across DEX aggregators for best execution (DeFiSORConfigDict)
                      </p>
                    </div>
                  </CollapsibleConfigSection>
                )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitBacktest}
                disabled={!form.templateId}
              >
                <Play className="size-4" />
                Run Backtest
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
