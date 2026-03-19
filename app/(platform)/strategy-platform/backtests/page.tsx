"use client"

import * as React from "react"
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  BACKTEST_RUNS,
  STRATEGY_TEMPLATES,
  ARCHETYPE_OPTIONS,
  ASSET_CLASS_OPTIONS,
  VENUE_OPTIONS,
  TESTING_STAGE_OPTIONS,
} from "@/lib/strategy-platform-mock-data"
import type { BacktestRun, StrategyArchetype } from "@/lib/strategy-platform-types"

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

type SortField = "sharpe" | "return" | "drawdown" | "sortino" | "hitRate"

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
  const [backtests, setBacktests] = React.useState<BacktestRun[]>(BACKTEST_RUNS)
  const [filters, setFilters] = React.useState<FilterState>(EMPTY_FILTERS)
  const [sortField, setSortField] = React.useState<SortField>("sharpe")
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState<BacktestFormState>(INITIAL_FORM)
  const [candidateBasket, setCandidateBasket] = React.useState<Set<string>>(new Set())

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

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    if (!a.metrics && !b.metrics) return 0
    if (!a.metrics) return 1
    if (!b.metrics) return -1
    const aM = a.metrics
    const bM = b.metrics
    let aV: number, bV: number
    switch (sortField) {
      case "sharpe":
        aV = aM.sharpe; bV = bM.sharpe; break
      case "return":
        aV = aM.totalReturn; bV = bM.totalReturn; break
      case "drawdown":
        aV = aM.maxDrawdown; bV = bM.maxDrawdown; break
      case "sortino":
        aV = aM.sortino; bV = bM.sortino; break
      case "hitRate":
        aV = aM.hitRate; bV = bM.hitRate; break
    }
    return sortDir === "desc" ? bV - aV : aV - bV
  })

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="size-3 opacity-30" />
    return sortDir === "desc" ? (
      <ChevronDown className="size-3" />
    ) : (
      <ChevronUp className="size-3" />
    )
  }

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
      testingStage: "BACKTEST",
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

    setBacktests((prev) => [newBt, ...prev])
    setForm(INITIAL_FORM)
    setDialogOpen(false)
  }

  const selectedTemplate = STRATEGY_TEMPLATES.find((t) => t.id === form.templateId)
  const activeFilterCount = Object.values(filters).filter(Boolean).length

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
          <Button onClick={() => setDialogOpen(true)}>
            <Play className="size-4" />
            Run New Backtest
          </Button>
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
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground w-8"></TableHead>
                  <TableHead className="text-xs text-muted-foreground">Strategy</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Instrument</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Venue</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                    onClick={() => handleSort("sharpe")}
                  >
                    <span className="flex items-center gap-1">
                      Sharpe <SortIcon field="sharpe" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                    onClick={() => handleSort("return")}
                  >
                    <span className="flex items-center gap-1">
                      Return <SortIcon field="return" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                    onClick={() => handleSort("drawdown")}
                  >
                    <span className="flex items-center gap-1">
                      Max DD <SortIcon field="drawdown" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                    onClick={() => handleSort("sortino")}
                  >
                    <span className="flex items-center gap-1">
                      Sortino <SortIcon field="sortino" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                    onClick={() => handleSort("hitRate")}
                  >
                    <span className="flex items-center gap-1">
                      Hit Rate <SortIcon field="hitRate" />
                    </span>
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">Window</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((bt) => {
                  const m = bt.metrics
                  return (
                    <TableRow
                      key={bt.id}
                      className={`border-border/30 ${candidateBasket.has(bt.id) ? "bg-amber-500/5" : ""}`}
                    >
                      <TableCell>
                        {bt.status === "completed" && (
                          <button
                            onClick={() => toggleCandidate(bt.id)}
                            className="p-0.5 rounded hover:bg-muted"
                            title={candidateBasket.has(bt.id) ? "Remove from basket" : "Add to candidate basket"}
                          >
                            <Star
                              className={`size-3.5 ${candidateBasket.has(bt.id) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                            />
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{bt.templateName}</TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">
                        {bt.instrument}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{bt.venue}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={backtestStatusColor(bt.status)}>
                          {bt.status === "running" ? `${bt.progress}%` : bt.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {m ? fmtNum(m.sharpe) : "--"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {m ? fmtPct(m.totalReturn) : "--"}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-red-400">
                        {m ? fmtPct(m.maxDrawdown) : "--"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {m ? fmtNum(m.sortino) : "--"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {m ? fmtPct(m.hitRate) : "--"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {bt.dateWindow.start} - {bt.dateWindow.end}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
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
