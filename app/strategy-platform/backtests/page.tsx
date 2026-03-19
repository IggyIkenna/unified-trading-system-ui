"use client"

import * as React from "react"
import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ContextBar } from "@/components/platform/context-bar"
import { BatchLiveRail } from "@/components/platform/batch-live-rail"
import { FilterBar, FilterDefinition, useFilterState } from "@/components/platform/filter-bar"
import { CandidateBasket, useCandidateBasket, CandidateItem } from "@/components/platform/candidate-basket"
import {
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ArrowUpDown,
  ChevronRight,
  Eye,
  Plus,
  Filter,
  Grid3X3,
  List,
  GitCompare,
} from "lucide-react"
import {
  BACKTEST_RUNS,
  ARCHETYPE_OPTIONS,
  ASSET_CLASS_OPTIONS,
  VENUE_OPTIONS,
  TESTING_STAGE_OPTIONS,
} from "@/lib/strategy-platform-mock-data"
import { cn } from "@/lib/utils"

// Filter definitions
const FILTERS: FilterDefinition[] = [
  {
    key: "archetype",
    label: "Archetype",
    type: "multi-select",
    options: ARCHETYPE_OPTIONS,
  },
  {
    key: "assetClass",
    label: "Asset Class",
    type: "select",
    options: ASSET_CLASS_OPTIONS,
  },
  {
    key: "venue",
    label: "Venue",
    type: "multi-select",
    options: VENUE_OPTIONS,
  },
  {
    key: "testingStage",
    label: "Stage",
    type: "select",
    options: TESTING_STAGE_OPTIONS,
  },
  {
    key: "dateRange",
    label: "Date Range",
    type: "date-range",
  },
  {
    key: "search",
    label: "Search",
    type: "search",
    placeholder: "Search strategies...",
  },
]

// Status badge
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ReactNode; className: string }> = {
    completed: {
      icon: <CheckCircle2 className="size-3" />,
      className: "text-[var(--status-live)] border-[var(--status-live)]/30 bg-[var(--status-live)]/10",
    },
    running: {
      icon: <RefreshCw className="size-3 animate-spin" />,
      className: "text-[var(--surface-strategy)] border-[var(--surface-strategy)]/30 bg-[var(--surface-strategy)]/10",
    },
    queued: {
      icon: <Clock className="size-3" />,
      className: "text-muted-foreground border-border bg-muted/50",
    },
    failed: {
      icon: <XCircle className="size-3" />,
      className: "text-[var(--status-critical)] border-[var(--status-critical)]/30 bg-[var(--status-critical)]/10",
    },
  }

  const cfg = config[status] || config.queued

  return (
    <Badge variant="outline" className={cn("gap-1 text-[10px]", cfg.className)}>
      {cfg.icon}
      {status}
    </Badge>
  )
}

// Metric cell with conditional coloring
function MetricCell({
  value,
  format = "number",
  goodThreshold,
  badThreshold,
  inverted = false,
}: {
  value: number | null | undefined
  format?: "number" | "percent" | "currency"
  goodThreshold?: number
  badThreshold?: number
  inverted?: boolean
}) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>
  }

  let displayValue: string
  switch (format) {
    case "percent":
      displayValue = `${(value * 100).toFixed(1)}%`
      break
    case "currency":
      displayValue = `$${value.toLocaleString()}`
      break
    default:
      displayValue = value.toFixed(2)
  }

  let colorClass = "text-foreground"
  if (goodThreshold !== undefined && badThreshold !== undefined) {
    if (inverted) {
      if (value <= goodThreshold) colorClass = "text-[var(--status-live)]"
      else if (value >= badThreshold) colorClass = "text-[var(--status-critical)]"
    } else {
      if (value >= goodThreshold) colorClass = "text-[var(--status-live)]"
      else if (value <= badThreshold) colorClass = "text-[var(--status-critical)]"
    }
  }

  return <span className={cn("font-mono", colorClass)}>{displayValue}</span>
}

// Detail panel for selected backtest
function DetailPanel({ runId, onClose }: { runId: string | null; onClose: () => void }) {
  const run = BACKTEST_RUNS.find((r) => r.id === runId)

  if (!run) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">Select a backtest to view details</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium">{run.templateName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {run.instrument} / {run.venue}
            </p>
          </div>
          <StatusBadge status={run.status} />
        </div>

        {/* Config info */}
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs">Config</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono">v{run.configVersion}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Config ID</span>
              <span className="font-mono text-[10px]">{run.configId}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Archetype</span>
              <Badge variant="outline" className="text-[10px]">
                {run.archetype.replace(/_/g, " ")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Provenance */}
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs">Provenance</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Date Window</span>
              <span className="font-mono">{run.dateWindow.start} - {run.dateWindow.end}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Data Source</span>
              <span>{run.dataSource}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Snapshot ID</span>
              <span className="font-mono text-[10px]">{run.dataSnapshotId}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Code Commit</span>
              <span className="font-mono text-[10px]">{run.codeCommitHash}</span>
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        {run.metrics && (
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground">Sharpe</div>
                  <div className="text-lg font-mono font-bold">{run.metrics.sharpe.toFixed(2)}</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground">Return</div>
                  <div className={cn("text-lg font-mono font-bold", run.metrics.totalReturn >= 0 ? "text-[var(--status-live)]" : "text-[var(--status-critical)]")}>
                    {(run.metrics.totalReturn * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground">Max DD</div>
                  <div className="text-lg font-mono font-bold text-[var(--status-critical)]">
                    {(run.metrics.maxDrawdown * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground">Hit Rate</div>
                  <div className="text-lg font-mono font-bold">
                    {(run.metrics.hitRate * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Sortino</span>
                  <span className="font-mono">{run.metrics.sortino.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Calmar</span>
                  <span className="font-mono">{run.metrics.calmar.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Turnover</span>
                  <span className="font-mono">{run.metrics.turnover.toFixed(1)}x</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Avg Slippage</span>
                  <span className="font-mono">{(run.metrics.avgSlippage * 10000).toFixed(1)} bps</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Drift */}
        {run.driftScore !== null && (
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs flex items-center gap-2">
                <GitCompare className="size-3" />
                Batch/Live Drift
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Drift Score</span>
                  <span
                    className={cn(
                      "text-lg font-mono font-bold",
                      run.driftScore < 0.1
                        ? "text-[var(--status-live)]"
                        : run.driftScore < 0.2
                        ? "text-[var(--status-warning)]"
                        : "text-[var(--status-critical)]"
                    )}
                  >
                    {(run.driftScore * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={100 - run.driftScore * 100} className="h-2" />
                <p className="text-[10px] text-muted-foreground">
                  Live analog: {run.liveAnalogId}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs">
            View Results
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs">
            Compare
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}

function StrategyBacktestsContent() {
  const [context, setContext] = React.useState<"BATCH" | "LIVE">("BATCH")
  const [viewMode, setViewMode] = React.useState<"table" | "grid">("table")
  const [selectedRunId, setSelectedRunId] = React.useState<string | null>(null)
  const [sortField, setSortField] = React.useState<string>("completedAt")
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc")
  
  const { filters, updateFilter, resetFilters } = useFilterState({
    archetype: [],
    assetClass: "",
    venue: [],
    testingStage: "",
    dateRange: undefined,
    search: "",
  })

  const candidateBasket = useCandidateBasket()

  // Sort and filter data
  const filteredRuns = React.useMemo(() => {
    let runs = [...BACKTEST_RUNS]

    // Apply filters
    if (filters.search) {
      const search = (filters.search as string).toLowerCase()
      runs = runs.filter(
        (r) =>
          r.templateName.toLowerCase().includes(search) ||
          r.configId.toLowerCase().includes(search)
      )
    }

    if ((filters.archetype as string[])?.length > 0) {
      runs = runs.filter((r) => (filters.archetype as string[]).includes(r.archetype))
    }

    if ((filters.venue as string[])?.length > 0) {
      runs = runs.filter((r) => (filters.venue as string[]).includes(r.venue))
    }

    // Sort
    runs.sort((a, b) => {
      let aVal: number | string | null = null
      let bVal: number | string | null = null

      switch (sortField) {
        case "sharpe":
          aVal = a.metrics?.sharpe ?? -Infinity
          bVal = b.metrics?.sharpe ?? -Infinity
          break
        case "return":
          aVal = a.metrics?.totalReturn ?? -Infinity
          bVal = b.metrics?.totalReturn ?? -Infinity
          break
        case "maxDrawdown":
          aVal = a.metrics?.maxDrawdown ?? Infinity
          bVal = b.metrics?.maxDrawdown ?? Infinity
          break
        case "completedAt":
          aVal = a.completedAt ?? ""
          bVal = b.completedAt ?? ""
          break
        default:
          return 0
      }

      if (sortDir === "asc") {
        return aVal > bVal ? 1 : -1
      }
      return aVal < bVal ? 1 : -1
    })

    return runs
  }, [filters, sortField, sortDir])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const addToBasket = (run: typeof BACKTEST_RUNS[0]) => {
    if (!run.metrics) return
    
    candidateBasket.addCandidate({
      id: run.id,
      type: "strategy_config",
      name: run.templateName,
      version: run.configVersion,
      metrics: {
        sharpe: run.metrics.sharpe,
        return: run.metrics.totalReturn,
        maxDrawdown: run.metrics.maxDrawdown,
      },
    })
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Context Bar */}
      <ContextBar
        platform="strategy"
        scope={{ fund: "ODUM", client: "Internal" }}
        context={context}
        badges={[{ label: "Runs", value: String(filteredRuns.length) }]}
        dataSource="HISTORICAL_TICK"
        asOfDate="2024-10-18"
        showFilters
        onFiltersToggle={() => {}}
        actions={
          <CandidateBasket
            platform="strategy"
            candidates={candidateBasket.candidates}
            onRemove={candidateBasket.removeCandidate}
            onClearAll={candidateBasket.clearAll}
            onUpdateNote={candidateBasket.updateNote}
            onSendToReview={() => alert("Send to review")}
            onPreparePackage={() => alert("Prepare package")}
          />
        }
      />

      {/* Batch/Live Rail */}
      <BatchLiveRail
        platform="strategy"
        currentStage="Backtest"
        context={context}
        onContextChange={setContext}
      />

      {/* Filter Bar */}
      <FilterBar
        filters={FILTERS}
        values={filters}
        onChange={updateFilter}
        onReset={resetFilters}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Table/Grid */}
        <div className="flex-1 overflow-auto">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredRuns.length} results
              </span>
              {candidateBasket.count > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {candidateBasket.count} selected
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                className="size-8"
                onClick={() => setViewMode("table")}
              >
                <List className="size-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="size-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="size-4" />
              </Button>
            </div>
          </div>

          {/* Table View */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Strategy / Config</TableHead>
                <TableHead>Instrument / Venue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("sharpe")}>
                  <div className="flex items-center justify-end gap-1">
                    Sharpe
                    <ArrowUpDown className="size-3" />
                  </div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("return")}>
                  <div className="flex items-center justify-end gap-1">
                    Return
                    <ArrowUpDown className="size-3" />
                  </div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("maxDrawdown")}>
                  <div className="flex items-center justify-end gap-1">
                    Max DD
                    <ArrowUpDown className="size-3" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Hit Rate</TableHead>
                <TableHead className="text-right">Drift</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRuns.map((run) => (
                <TableRow
                  key={run.id}
                  className={cn(
                    "cursor-pointer",
                    selectedRunId === run.id && "bg-muted/50"
                  )}
                  onClick={() => setSelectedRunId(run.id)}
                >
                  <TableCell>
                    <Checkbox
                      checked={candidateBasket.isSelected(run.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          addToBasket(run)
                        } else {
                          candidateBasket.removeCandidate(run.id)
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{run.templateName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="font-mono">v{run.configVersion}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {run.archetype.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{run.instrument}</div>
                    <div className="text-xs text-muted-foreground">{run.venue}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={run.status} />
                    {run.status === "running" && (
                      <Progress value={run.progress} className="h-1 mt-1 w-16" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <MetricCell
                      value={run.metrics?.sharpe}
                      goodThreshold={1.5}
                      badThreshold={0.5}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <MetricCell
                      value={run.metrics?.totalReturn}
                      format="percent"
                      goodThreshold={0.15}
                      badThreshold={0}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <MetricCell
                      value={run.metrics?.maxDrawdown}
                      format="percent"
                      goodThreshold={0.05}
                      badThreshold={0.15}
                      inverted
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <MetricCell
                      value={run.metrics?.hitRate}
                      format="percent"
                      goodThreshold={0.55}
                      badThreshold={0.45}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {run.driftScore !== null ? (
                      <span
                        className={cn(
                          "font-mono text-sm",
                          run.driftScore < 0.1
                            ? "text-[var(--status-live)]"
                            : run.driftScore < 0.2
                            ? "text-[var(--status-warning)]"
                            : "text-[var(--status-critical)]"
                        )}
                      >
                        {(run.driftScore * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedRunId(run.id)
                        }}
                      >
                        <Eye className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToBasket(run)
                        }}
                        disabled={!run.metrics || candidateBasket.isSelected(run.id)}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Detail Panel */}
        <div className="w-[360px] border-l bg-card/50">
          <DetailPanel
            runId={selectedRunId}
            onClose={() => setSelectedRunId(null)}
          />
        </div>
      </div>
    </div>
  )
}

// Wrapper with Suspense boundary for useSearchParams
export default function StrategyBacktestsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="animate-pulse">Loading backtests...</div></div>}>
      <StrategyBacktestsContent />
    </Suspense>
  )
}
