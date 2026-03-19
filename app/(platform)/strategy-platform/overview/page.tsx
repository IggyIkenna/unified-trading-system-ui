"use client"

import * as React from "react"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  FlaskConical,
  Play,
  Target,
  TrendingUp,
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
  STRATEGY_CONFIGS,
  BACKTEST_RUNS,
  STRATEGY_CANDIDATES,
  STRATEGY_ALERTS,
  STRATEGY_TEMPLATES,
} from "@/lib/strategy-platform-mock-data"
import type { BacktestRun, StrategyConfig } from "@/lib/strategy-platform-types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusColor(status: StrategyConfig["status"]) {
  switch (status) {
    case "live":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    case "shadow":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30"
    case "paper":
      return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
    case "validated":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30"
    case "backtest":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30"
    case "draft":
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
    case "deprecated":
      return "bg-red-500/15 text-red-400 border-red-500/30"
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
  }
}

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

function alertSeverityColor(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-red-500/15 text-red-400 border-red-500/30"
    case "warning":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30"
    case "info":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30"
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
// New Backtest Form
// ---------------------------------------------------------------------------

interface BacktestFormState {
  templateId: string
  instrument: string
  venue: string
  dateStart: string
  dateEnd: string
}

const INITIAL_FORM: BacktestFormState = {
  templateId: "",
  instrument: "",
  venue: "",
  dateStart: "2024-01-01",
  dateEnd: "2024-12-31",
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StrategyOverviewPage() {
  const [backtests, setBacktests] = React.useState<BacktestRun[]>(BACKTEST_RUNS)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState<BacktestFormState>(INITIAL_FORM)
  const [sortField, setSortField] = React.useState<"sharpe" | "return" | "drawdown">("sharpe")
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc")

  // Derived KPIs
  const activeStrategies = STRATEGY_CONFIGS.filter(
    (c) => c.status === "live" || c.status === "shadow"
  ).length
  const runningBacktests = backtests.filter((b) => b.status === "running").length
  const candidatesPending = STRATEGY_CANDIDATES.filter(
    (c) => c.reviewState === "pending" || c.reviewState === "in_review"
  ).length
  const unresolvedAlerts = STRATEGY_ALERTS.filter((a) => !a.resolvedAt).length

  // Recent completed backtests sorted
  const completedBacktests = backtests
    .filter((b) => b.status === "completed" && b.metrics)
    .sort((a, b) => {
      const aM = a.metrics!
      const bM = b.metrics!
      let aV: number, bV: number
      switch (sortField) {
        case "sharpe":
          aV = aM.sharpe
          bV = bM.sharpe
          break
        case "return":
          aV = aM.totalReturn
          bV = bM.totalReturn
          break
        case "drawdown":
          aV = aM.maxDrawdown
          bV = bM.maxDrawdown
          break
      }
      return sortDir === "desc" ? bV - aV : aV - bV
    })

  function handleSort(field: "sharpe" | "return" | "drawdown") {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  function SortIcon({ field }: { field: string }) {
    if (sortField !== field) return <ChevronDown className="size-3 opacity-30" />
    return sortDir === "desc" ? (
      <ChevronDown className="size-3" />
    ) : (
      <ChevronUp className="size-3" />
    )
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Strategy Research Platform</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Backtest, validate, and promote trading strategies
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Play className="size-4" />
            New Backtest
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50">
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Active Strategies
                  </p>
                  <p className="text-3xl font-bold mt-1">{activeStrategies}</p>
                </div>
                <div className="rounded-lg bg-emerald-500/10 p-2.5">
                  <Activity className="size-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Running Backtests
                  </p>
                  <p className="text-3xl font-bold mt-1">{runningBacktests}</p>
                </div>
                <div className="rounded-lg bg-blue-500/10 p-2.5">
                  <FlaskConical className="size-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Candidates Pending
                  </p>
                  <p className="text-3xl font-bold mt-1">{candidatesPending}</p>
                </div>
                <div className="rounded-lg bg-amber-500/10 p-2.5">
                  <Target className="size-5 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Unresolved Alerts
                  </p>
                  <p className="text-3xl font-bold mt-1">{unresolvedAlerts}</p>
                </div>
                <div className="rounded-lg bg-red-500/10 p-2.5">
                  <AlertTriangle className="size-5 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strategy Configs List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4" />
              Strategy Configurations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">Name</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Archetype</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Asset Class</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Version</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STRATEGY_CONFIGS.map((cfg) => (
                  <TableRow key={cfg.id} className="border-border/30">
                    <TableCell className="font-medium">{cfg.name}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-xs">
                        {cfg.archetype.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-xs">
                        {cfg.assetClass.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColor(cfg.status)}
                      >
                        {cfg.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      v{cfg.version}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Backtest Results */}
          <div className="lg:col-span-2">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="size-4" />
                  Recent Backtest Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs text-muted-foreground">Strategy</TableHead>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedBacktests.map((bt) => (
                      <TableRow key={bt.id} className="border-border/30">
                        <TableCell className="font-medium text-sm">{bt.templateName}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{bt.venue}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={backtestStatusColor(bt.status)}
                          >
                            {bt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {fmtNum(bt.metrics!.sharpe)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {fmtPct(bt.metrics!.totalReturn)}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-red-400">
                          {fmtPct(bt.metrics!.maxDrawdown)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Show running backtests */}
                    {backtests
                      .filter((b) => b.status === "running" || b.status === "queued")
                      .map((bt) => (
                        <TableRow key={bt.id} className="border-border/30">
                          <TableCell className="font-medium text-sm">{bt.templateName}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{bt.venue}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={backtestStatusColor(bt.status)}
                            >
                              {bt.status === "running" ? `running ${bt.progress}%` : bt.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">--</TableCell>
                          <TableCell className="text-muted-foreground">--</TableCell>
                          <TableCell className="text-muted-foreground">--</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="size-4" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {STRATEGY_ALERTS.filter((a) => !a.resolvedAt).map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-lg border border-border/50 p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={alertSeverityColor(alert.severity)}
                    >
                      {alert.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      <Clock className="inline size-3 mr-1" />
                      {new Date(alert.triggeredAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{alert.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* New Backtest Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Run New Backtest</DialogTitle>
              <DialogDescription>
                Select a strategy template and configure backtest parameters.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
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
                        {tpl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <>
                  <div className="space-y-2">
                    <Label>Instrument</Label>
                    <Select
                      value={form.instrument}
                      onValueChange={(v) => setForm((f) => ({ ...f, instrument: v }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select instrument..." />
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
                      onValueChange={(v) => setForm((f) => ({ ...f, venue: v }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select venue..." />
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
                </>
              )}

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
