"use client"

import * as React from "react"
import { AppShell } from "@/components/trading/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { EntityLink } from "@/components/trading/entity-link"
import { DimensionalGrid } from "@/components/trading/dimensional-grid"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Beaker,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  Copy,
  ArrowUpRight,
  GitCompare,
  BarChart3,
  Plus,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { EXPERIMENTS, MODEL_FAMILIES, DATASET_SNAPSHOTS, FEATURE_SET_VERSIONS } from "@/lib/ml-mock-data"
import type { ModelArchetype } from "@/lib/ml-types"

// Context badge component
function ContextBadge({ context }: { context: "BATCH" | "LIVE" }) {
  return (
    <Badge
      variant="outline"
      className={
        context === "LIVE"
          ? "bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/30"
          : "bg-[var(--surface-ml)]/10 text-[var(--surface-ml)] border-[var(--surface-ml)]/30"
      }
    >
      {context}
    </Badge>
  )
}

// Status badge
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running: "bg-[var(--status-running)]/10 text-[var(--status-running)] border-[var(--status-running)]/30",
    completed: "bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/30",
    failed: "bg-[var(--status-critical)]/10 text-[var(--status-critical)] border-[var(--status-critical)]/30",
    queued: "bg-muted text-muted-foreground",
    draft: "bg-muted text-muted-foreground",
    cancelled: "bg-muted text-muted-foreground",
  }
  
  const icons: Record<string, React.ReactNode> = {
    running: <RefreshCw className="size-3 animate-spin" />,
    completed: <CheckCircle2 className="size-3" />,
    failed: <XCircle className="size-3" />,
    queued: <Clock className="size-3" />,
  }
  
  return (
    <Badge variant="outline" className={`gap-1 ${colors[status] || ""}`}>
      {icons[status]}
      {status}
    </Badge>
  )
}

export default function ExperimentsPage() {
  const router = useRouter()
  const [selectedExperiments, setSelectedExperiments] = React.useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [archetypeFilter, setArchetypeFilter] = React.useState<string>("all")
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list")
  
  // Filter experiments
  const filteredExperiments = React.useMemo(() => {
    return EXPERIMENTS.filter(exp => {
      const matchesSearch = exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || exp.status === statusFilter
      const family = MODEL_FAMILIES.find(f => f.id === exp.modelFamilyId)
      const matchesArchetype = archetypeFilter === "all" || family?.archetype === archetypeFilter
      return matchesSearch && matchesStatus && matchesArchetype
    })
  }, [searchQuery, statusFilter, archetypeFilter])
  
  // Grid data for hyperparameter comparison
  const gridData = React.useMemo(() => {
    return filteredExperiments.filter(exp => exp.metrics).map(exp => ({
      id: exp.id,
      name: exp.name,
      archetype: MODEL_FAMILIES.find(f => f.id === exp.modelFamilyId)?.archetype || "Unknown",
      status: exp.status,
      learning_rate: exp.hyperparameters.learning_rate || exp.hyperparameters.lr || 0,
      layers: exp.hyperparameters.layers || exp.hyperparameters.hidden_layers || 0,
      dropout: exp.hyperparameters.dropout || 0,
      sharpe: exp.metrics?.sharpe || 0,
      accuracy: (exp.metrics?.accuracy || 0) * 100,
      directional_accuracy: (exp.metrics?.directionalAccuracy || 0) * 100,
      max_drawdown: (exp.metrics?.maxDrawdown || 0) * 100,
      stability_score: (exp.metrics?.stabilityScore || 0) * 100,
    }))
  }, [filteredExperiments])
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExperiments(new Set(filteredExperiments.map(e => e.id)))
    } else {
      setSelectedExperiments(new Set())
    }
  }
  
  const handleSelectExperiment = (id: string) => {
    const newSelected = new Set(selectedExperiments)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedExperiments(newSelected)
  }

  return (
    <AppShell
      activeSurface="ml"
      showLifecycleRail={false}
      breadcrumbs={[
        { label: "ML Platform", href: "/ml" },
        { label: "Experiments" },
      ]}
      contextLevels={{ organization: true, client: false, strategy: false, underlying: false }}
    >
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Experiments</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Hyperparameter tuning, model comparison, and validation
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Link href="/ml/experiments/new">
              <Button size="sm" className="gap-2" style={{ backgroundColor: "var(--surface-ml)" }}>
                <Plus className="size-4" />
                New Experiment
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search experiments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={archetypeFilter} onValueChange={setArchetypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Archetype" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Archetypes</SelectItem>
                <SelectItem value="DIRECTIONAL">Directional</SelectItem>
                <SelectItem value="MARKET_MAKING">Market Making</SelectItem>
                <SelectItem value="ARBITRAGE">Arbitrage</SelectItem>
                <SelectItem value="YIELD">Yield</SelectItem>
                <SelectItem value="SPORTS_ML">Sports ML</SelectItem>
                <SelectItem value="PREDICTION_MARKET_ML">Prediction ML</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                List
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="gap-1"
              >
                <BarChart3 className="size-4" />
                Grid
              </Button>
            </div>
          </div>
        </Card>

        {/* Selection Toolbar */}
        {selectedExperiments.size > 0 && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{selectedExperiments.size} selected</span>
              <Button variant="outline" size="sm" className="gap-1">
                <GitCompare className="size-4" />
                Compare
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <ArrowUpRight className="size-4" />
                Promote to Validation
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 text-destructive">
                <Trash2 className="size-4" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setSelectedExperiments(new Set())}
              >
                Clear selection
              </Button>
            </div>
          </Card>
        )}

        {/* Main Content */}
        {viewMode === "list" ? (
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-4 w-10">
                      <Checkbox
                        checked={selectedExperiments.size === filteredExperiments.length && filteredExperiments.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Experiment</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Model Family</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Progress</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Sharpe</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Accuracy</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Dir. Acc.</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Max DD</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExperiments.map((exp) => {
                    const family = MODEL_FAMILIES.find(f => f.id === exp.modelFamilyId)
                    const isSelected = selectedExperiments.has(exp.id)
                    
                    return (
                      <tr
                        key={exp.id}
                        className={`border-b border-border hover:bg-muted/30 transition-colors cursor-pointer ${
                          isSelected ? "bg-primary/5" : ""
                        }`}
                        onClick={() => router.push(`/ml/experiments/${exp.id}`)}
                      >
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectExperiment(exp.id)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{exp.name}</span>
                              <ContextBadge context="BATCH" />
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">{exp.id}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {family?.archetype || "Unknown"}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={exp.status} />
                        </td>
                        <td className="py-3 px-4 w-32">
                          {exp.status === "running" ? (
                            <div>
                              <Progress value={exp.progress} className="h-1.5" />
                              <span className="text-xs text-muted-foreground">{exp.progress}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {exp.status === "completed" ? "Complete" : exp.status === "failed" ? "Failed" : "-"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {exp.metrics ? (
                            <span className={`font-mono font-semibold ${exp.metrics.sharpe >= 2.0 ? "text-[var(--status-live)]" : ""}`}>
                              {exp.metrics.sharpe.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {exp.metrics ? (
                            <span className="font-mono">{(exp.metrics.accuracy * 100).toFixed(1)}%</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {exp.metrics ? (
                            <span className="font-mono">{(exp.metrics.directionalAccuracy * 100).toFixed(1)}%</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {exp.metrics ? (
                            <span className="font-mono">{(exp.metrics.maxDrawdown * 100).toFixed(1)}%</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="size-8 p-0">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <ArrowUpRight className="size-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="size-4 mr-2" />
                                Clone Experiment
                              </DropdownMenuItem>
                              {exp.status === "running" && (
                                <DropdownMenuItem>
                                  <Pause className="size-4 mr-2" />
                                  Pause Training
                                </DropdownMenuItem>
                              )}
                              {exp.status === "completed" && (
                                <DropdownMenuItem>
                                  <Play className="size-4 mr-2" />
                                  Promote to Validation
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="size-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-6">
            <DimensionalGrid
              data={gridData}
              dimensions={[
                { key: "archetype", label: "Archetype", values: ["DIRECTIONAL", "MARKET_MAKING", "ARBITRAGE", "SPORTS_ML"] },
                { key: "status", label: "Status", values: ["completed", "running", "failed"] },
              ]}
              metrics={[
                { key: "sharpe", label: "Sharpe", format: "decimal", colorize: true },
                { key: "accuracy", label: "Accuracy %", format: "decimal" },
                { key: "directional_accuracy", label: "Dir. Acc %", format: "decimal" },
                { key: "max_drawdown", label: "Max DD %", format: "decimal", colorize: true },
                { key: "stability_score", label: "Stability %", format: "decimal" },
              ]}
              enableSelection={true}
              enableHeatmap={true}
              enableExport={true}
              onRowClick={(id) => router.push(`/ml/experiments/${id}`)}
              selectionToolbar={(selected) => (
                <>
                  <Button variant="outline" size="sm" className="gap-1">
                    <GitCompare className="size-4" />
                    Compare Selected
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <ArrowUpRight className="size-4" />
                    Promote Best
                  </Button>
                </>
              )}
            />
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Experiments</div>
            <div className="text-2xl font-semibold mt-1">{EXPERIMENTS.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Avg Sharpe (Completed)</div>
            <div className="text-2xl font-semibold mt-1 font-mono">
              {(EXPERIMENTS.filter(e => e.metrics).reduce((sum, e) => sum + (e.metrics?.sharpe || 0), 0) / 
                EXPERIMENTS.filter(e => e.metrics).length).toFixed(2)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Avg Accuracy</div>
            <div className="text-2xl font-semibold mt-1 font-mono">
              {((EXPERIMENTS.filter(e => e.metrics).reduce((sum, e) => sum + (e.metrics?.accuracy || 0), 0) / 
                EXPERIMENTS.filter(e => e.metrics).length) * 100).toFixed(1)}%
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">GPU Hours (Today)</div>
            <div className="text-2xl font-semibold mt-1">24.5h</div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
