"use client"

import * as React from "react"
import {
  Filter,
  FlaskConical,
  Play,
  Plus,
  Search,
  Star,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"

import { useStrategyBacktests, useCreateBacktest, useStrategyTemplates } from "@/hooks/api/use-strategies"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/components/ui/api-error"
import { EmptyState } from "@/components/ui/empty-state"
import { StrategyWizard } from "@/components/research/strategy-wizard"
import type { BacktestRun, StrategyArchetype, StrategyTemplate } from "@/lib/strategy-platform-types"
import { ExportDropdown } from "@/components/ui/export-dropdown"
import type { ExportColumn } from "@/lib/utils/export"

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
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function backtestStatusColor(status: BacktestRun["status"]) {
  switch (status) {
    case "completed":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    case "running":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30"
    case "queued":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30"
    case "failed":
      return "bg-red-500/15 text-red-400 border-red-500/30"
    case "cancelled":
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
  }
}

function fmtPct(v: number) {
  return `${(v * 100).toFixed(1)}%`
}

function fmtNum(v: number, decimals = 2) {
  return v.toFixed(decimals)
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

interface FilterState {
  archetype: string
  assetClass: string
  venue: string
  stage: string
  search: string
}

const EMPTY_FILTERS: FilterState = {
  archetype: "",
  assetClass: "",
  venue: "",
  stage: "",
  search: "",
}

// ---------------------------------------------------------------------------
// New Backtest Form
// ---------------------------------------------------------------------------

interface BacktestFormState {
  templateId: string
  instrument: string
  venue: string
  dateStart: string
  dateEnd: string
  entryThreshold: string
  exitThreshold: string
  maxLeverage: string
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
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BacktestsPage() {
  const { data: backtestsData, isLoading: backtestsLoading, isError: backtestsIsError, error: backtestsError, refetch: backtestsRefetch } = useStrategyBacktests()
  const { data: templatesData, isLoading: templatesLoading } = useStrategyTemplates()
  const createBacktest = useCreateBacktest()

  const backtestsFromApi: BacktestRun[] = (backtestsData as any)?.data ?? (backtestsData as any)?.backtests ?? []
  const STRATEGY_TEMPLATES: StrategyTemplate[] = (templatesData as any)?.data ?? (templatesData as any)?.templates ?? []

  // Derive filter options from data
  const ARCHETYPE_OPTIONS = React.useMemo(() => {
    const counts: Record<string, number> = {}
    backtestsFromApi.forEach((bt) => { counts[bt.archetype] = (counts[bt.archetype] || 0) + 1 })
    return Object.entries(counts).map(([value, count]) => ({ value, label: value.replace(/_/g, " "), count }))
  }, [backtestsFromApi])

  const VENUE_OPTIONS = React.useMemo(() => {
    const counts: Record<string, number> = {}
    backtestsFromApi.forEach((bt) => { counts[bt.venue] = (counts[bt.venue] || 0) + 1 })
    return Object.entries(counts).map(([value, count]) => ({ value, label: value, count }))
  }, [backtestsFromApi])

  const TESTING_STAGE_OPTIONS = React.useMemo(() => {
    const counts: Record<string, number> = {}
    backtestsFromApi.forEach((bt) => { counts[bt.testingStage] = (counts[bt.testingStage] || 0) + 1 })
    return Object.entries(counts).map(([value, count]) => ({ value, label: value.replace(/_/g, " "), count }))
  }, [backtestsFromApi])

  const [localBacktests, setLocalBacktests] = React.useState<BacktestRun[]>([])
  const backtests = [...localBacktests, ...backtestsFromApi]
  const [filters, setFilters] = React.useState<FilterState>(EMPTY_FILTERS)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState<BacktestFormState>(INITIAL_FORM)
  const [candidateBasket, setCandidateBasket] = React.useState<Set<string>>(new Set())
  const [wizardOpen, setWizardOpen] = React.useState(false)

  // Filter logic
  const filtered = backtests.filter((bt) => {
    if (filters.archetype && bt.archetype !== filters.archetype) return false
    if (filters.venue && bt.venue !== filters.venue) return false
    if (filters.stage && bt.testingStage !== filters.stage) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (
        !bt.templateName.toLowerCase().includes(q) &&
        !bt.instrument.toLowerCase().includes(q)
      )
        return false
    }
    return true
  })

  function toggleCandidate(id: string) {
    setCandidateBasket((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const backtestColumns: ColumnDef<BacktestRun, unknown>[] = React.useMemo(
    () => [
      {
        id: "star",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const bt = row.original
          if (bt.status !== "completed") return null
          return (
            <button
              onClick={() => toggleCandidate(bt.id)}
              className="p-0.5 rounded hover:bg-muted"
              title={candidateBasket.has(bt.id) ? "Remove from basket" : "Add to candidate basket"}
            >
              <Star
                className={`size-3.5 ${candidateBasket.has(bt.id) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
              />
            </button>
          )
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
          <span className="text-muted-foreground text-xs font-mono">{row.original.instrument}</span>
        ),
      },
      {
        accessorKey: "venue",
        header: "Venue",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">{row.original.venue}</span>
        ),
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
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [candidateBasket],
  )

  function handleSubmitBacktest() {
    if (!form.templateId) return
    const tpl = STRATEGY_TEMPLATES.find((t) => t.id === form.templateId)
    if (!tpl) return

    const newBt: BacktestRun = {
      id: `bt-new-${Date.now()}`,
      configId: `cfg-new-${Date.now()}`,
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
      dataSnapshotId: `snap-${Date.now()}`,
      asOfDate: new Date().toISOString().slice(0, 10),
      metrics: null,
      startedAt: null,
      completedAt: null,
      durationMs: null,
      codeCommitHash: "head",
      configHash: `cfg-hash-${Date.now()}`,
      liveAnalogId: null,
      driftScore: null,
    }

    createBacktest.mutate({
      templateId: tpl.id,
      instrument: form.instrument || tpl.instruments[0],
      venue: form.venue || tpl.venues[0],
      dateStart: form.dateStart,
      dateEnd: form.dateEnd,
      entryThreshold: parseFloat(form.entryThreshold),
      exitThreshold: parseFloat(form.exitThreshold),
      maxLeverage: parseFloat(form.maxLeverage),
    })

    // Optimistically add to local list
    setLocalBacktests((prev) => [newBt, ...prev])
    setForm(INITIAL_FORM)
    setDialogOpen(false)
  }

  const isLoading = backtestsLoading || templatesLoading
  const selectedTemplate = STRATEGY_TEMPLATES.find((t) => t.id === form.templateId)
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (backtestsIsError) {
    return (
      <div className="p-6">
        <ApiError error={backtestsError} onRetry={() => backtestsRefetch()} />
      </div>
    )
  }

  if (backtests.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="No backtests"
          description="No backtests have been run yet. Create your first backtest to evaluate a strategy."
          action={{ label: "Run New Backtest", onClick: () => setDialogOpen(true) }}
          icon={FlaskConical}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
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
              data={filtered.map((bt) => ({
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
              } as Record<string, unknown>))}
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
                onValueChange={(v) => setFilters((f) => ({ ...f, archetype: v === "__all__" ? "" : v }))}
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

        {/* Candidate Basket */}
        {candidateBasket.size > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="size-4 text-amber-400" />
                Candidate Basket ({candidateBasket.size})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Array.from(candidateBasket).map((btId) => {
                  const bt = backtests.find((b) => b.id === btId)
                  if (!bt) return null
                  return (
                    <Badge
                      key={btId}
                      variant="outline"
                      className="gap-1.5 border-amber-500/30 text-amber-300 pr-1"
                    >
                      {bt.templateName} / {bt.venue}
                      <button
                        onClick={() => toggleCandidate(btId)}
                        className="rounded-full p-0.5 hover:bg-amber-500/20"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
              <div className="mt-3">
                <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-300">
                  <Plus className="size-3.5" />
                  Promote Selected to Candidates
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* New Strategy Wizard */}
        <StrategyWizard open={wizardOpen} onOpenChange={setWizardOpen} />

        {/* New Backtest Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Run New Backtest</DialogTitle>
              <DialogDescription>
                Configure strategy template, parameters, and test window.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Strategy Template</Label>
                <Select
                  value={form.templateId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, templateId: v, instrument: "", venue: "" }))
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
              </div>

              {selectedTemplate && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Instrument</Label>
                      <Select
                        value={form.instrument}
                        onValueChange={(v) => setForm((f) => ({ ...f, instrument: v }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedTemplate.instruments.map((inst) => (
                            <SelectItem key={inst} value={inst}>{inst}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Venue</Label>
                      <Select
                        value={form.venue}
                        onValueChange={(v) => setForm((f) => ({ ...f, venue: v }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedTemplate.venues.map((v) => (
                            <SelectItem key={v} value={v}>{v}</SelectItem>
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
                        onChange={(e) => setForm((f) => ({ ...f, dateStart: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={form.dateEnd}
                        onChange={(e) => setForm((f) => ({ ...f, dateEnd: e.target.value }))}
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
                          onChange={(e) => setForm((f) => ({ ...f, entryThreshold: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Exit Threshold</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={form.exitThreshold}
                          onChange={(e) => setForm((f) => ({ ...f, exitThreshold: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Max Leverage</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={form.maxLeverage}
                          onChange={(e) => setForm((f) => ({ ...f, maxLeverage: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitBacktest} disabled={!form.templateId}>
                <Play className="size-4" />
                Run Backtest
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
