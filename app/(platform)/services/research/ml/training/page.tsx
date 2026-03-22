"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EntityLink } from "@/components/trading/entity-link"
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Terminal,
  HardDrive,
  Activity,
  Layers,
  Download,
  MoreHorizontal,
  AlertTriangle,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useTrainingRuns, useExperiments } from "@/hooks/api/use-ml-models"
import type { TrainingRun, Experiment } from "@/lib/ml-types"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/components/ui/api-error"
import { EmptyState } from "@/components/ui/empty-state"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

// Context badge
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

// Stage badge
function StageBadge({ stage }: { stage: string }) {
  const labels: Record<string, string> = {
    data_loading: "Data Loading",
    preprocessing: "Preprocessing",
    training: "Training",
    validation: "Validation",
    checkpointing: "Checkpointing",
    finalizing: "Finalizing",
  }
  return (
    <Badge variant="outline" className="font-mono text-xs">
      {labels[stage] || stage}
    </Badge>
  )
}

// Status badge
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    training: "bg-[var(--status-running)]/10 text-[var(--status-running)] border-[var(--status-running)]/30",
    validating: "bg-[var(--surface-ml)]/10 text-[var(--surface-ml)] border-[var(--surface-ml)]/30",
    completed: "bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/30",
    failed: "bg-[var(--status-critical)]/10 text-[var(--status-critical)] border-[var(--status-critical)]/30",
    queued: "bg-muted text-muted-foreground",
    initializing: "bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/30",
  }
  
  const icons: Record<string, React.ReactNode> = {
    training: <RefreshCw className="size-3 animate-spin" />,
    validating: <Activity className="size-3" />,
    completed: <CheckCircle2 className="size-3" />,
    failed: <XCircle className="size-3" />,
    queued: <Clock className="size-3" />,
    initializing: <Cpu className="size-3" />,
  }
  
  return (
    <Badge variant="outline" className={`gap-1 ${colors[status] || ""}`}>
      {icons[status]}
      {status}
    </Badge>
  )
}

// Generate mock resource usage data
function generateResourceData(points: number = 60): { time: number; gpu: number; memory: number }[] {
  const data = []
  for (let i = 0; i < points; i++) {
    data.push({
      time: i,
      gpu: 80 + Math.random() * 15,
      memory: 70 + Math.random() * 10,
    })
  }
  return data
}

// Generate mock loss data
function generateLossData(epochs: number = 100): { epoch: number; loss: number }[] {
  const data = []
  for (let i = 0; i <= epochs; i++) {
    const progress = i / epochs
    const loss = 0.8 * Math.exp(-3 * progress) + 0.3 + (Math.random() - 0.5) * 0.02
    data.push({ epoch: i, loss })
  }
  return data
}

// Mock queued jobs
const QUEUED_JOBS = [
  { id: "run-457-1", experimentId: "exp-457", name: "SOL Direction v2", position: 1, estimatedStart: "15m" },
  { id: "run-458-1", experimentId: "exp-458", name: "Multi-Asset Vol", position: 2, estimatedStart: "2h 30m" },
]

// Mock completed jobs (last 24h)
const COMPLETED_JOBS = [
  { id: "run-455-1", experimentId: "exp-455", name: "ETH Vol Surface", status: "completed", duration: "8h 30m", completedAt: "4h ago", metrics: { loss: 0.412, accuracy: 0.685 } },
  { id: "run-454-1", experimentId: "exp-454", name: "Multi-Momentum", status: "completed", duration: "8h", completedAt: "1d ago", metrics: { loss: 0.285, accuracy: 0.742 } },
]

// Mock failed jobs
const FAILED_JOBS = [
  { id: "run-452-1", experimentId: "exp-452", name: "Funding Rate LSTM", status: "failed", failedAt: "1d ago", error: "CUDA out of memory", stage: "training", epoch: 23 },
]

export default function TrainingRunsPage() {
  const { data: trainingRunsData, isLoading: runsLoading, isError: runsIsError, error: runsError, refetch: runsRefetch } = useTrainingRuns()
  const { data: experimentsData, isLoading: experimentsLoading } = useExperiments()

  const trainingRuns: TrainingRun[] = (trainingRunsData as any)?.data ?? (trainingRunsData as any)?.runs ?? []
  const experiments: Experiment[] = (experimentsData as any)?.data ?? (experimentsData as any)?.experiments ?? []

  const [selectedRun, setSelectedRun] = React.useState<string | null>(null)

  // Auto-select first run when data loads
  React.useEffect(() => {
    if (trainingRuns.length > 0 && selectedRun === null) {
      setSelectedRun(trainingRuns[0].id)
    }
  }, [trainingRuns, selectedRun])

  const activeRun = trainingRuns.find(r => r.id === selectedRun)
  const experiment = activeRun ? experiments.find(e => e.id === activeRun.experimentId) : null

  const resourceData = React.useMemo(() => generateResourceData(), [])
  const lossData = React.useMemo(() => generateLossData(activeRun?.currentEpoch || 50), [activeRun?.currentEpoch])

  const runningJobs = trainingRuns.filter(r => r.status === "training" || r.status === "validating")

  const isLoading = runsLoading || experimentsLoading

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (runsIsError) {
    return (
      <div className="p-6">
        <ApiError error={runsError} onRetry={() => runsRefetch()} />
      </div>
    )
  }

  if (trainingRuns.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="No training runs"
          description="No training jobs have been submitted yet. Start an experiment to begin training."
          icon={Cpu}
        />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Training Runs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              GPU cluster management, job queue, and training progress
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--status-running)]/10">
                <Activity className="size-5" style={{ color: "var(--status-running)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold">{runningJobs.length}</p>
                <p className="text-xs text-muted-foreground">Running Jobs</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Clock className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{QUEUED_JOBS.length}</p>
                <p className="text-xs text-muted-foreground">Queued</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--status-live)]/10">
                <CheckCircle2 className="size-5" style={{ color: "var(--status-live)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold">{COMPLETED_JOBS.length}</p>
                <p className="text-xs text-muted-foreground">Completed (24h)</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--status-critical)]/10">
                <XCircle className="size-5" style={{ color: "var(--status-critical)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold">{FAILED_JOBS.length}</p>
                <p className="text-xs text-muted-foreground">Failed (24h)</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--surface-ml)]/10">
                <Cpu className="size-5" style={{ color: "var(--surface-ml)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold">8/12</p>
                <p className="text-xs text-muted-foreground">GPUs Active</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Job List */}
          <Card className="col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Active & Queued Jobs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <Tabs defaultValue="running" className="w-full">
                <TabsList className="w-full justify-start px-4">
                  <TabsTrigger value="running">Running ({runningJobs.length})</TabsTrigger>
                  <TabsTrigger value="queued">Queued ({QUEUED_JOBS.length})</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="failed">Failed</TabsTrigger>
                </TabsList>
                
                <TabsContent value="running" className="px-4 pb-4">
                  <div className="space-y-2">
                    {runningJobs.map((run) => {
                      const exp = experiments.find(e => e.id === run.experimentId)
                      return (
                        <div
                          key={run.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedRun === run.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                          }`}
                          onClick={() => setSelectedRun(run.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{exp?.name || run.id}</span>
                            <StatusBadge status={run.status} />
                          </div>
                          <Progress value={run.stageProgress} className="h-1.5 mb-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Epoch {run.currentEpoch}/{run.totalEpochs}</span>
                            <span>ETA: {run.estimatedTimeRemaining}</span>
                          </div>
                        </div>
                      )
                    })}
                    {runningJobs.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No active training jobs
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="queued" className="px-4 pb-4">
                  <div className="space-y-2">
                    {QUEUED_JOBS.map((job) => (
                      <div
                        key={job.id}
                        className="p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{job.name}</span>
                          <Badge variant="outline" className="text-xs">#{job.position}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-mono">{job.experimentId}</span>
                          <span>Est. start: {job.estimatedStart}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="completed" className="px-4 pb-4">
                  <div className="space-y-2">
                    {COMPLETED_JOBS.map((job) => (
                      <div
                        key={job.id}
                        className="p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{job.name}</span>
                          <StatusBadge status={job.status} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Duration: {job.duration}</span>
                          <span>{job.completedAt}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span>Loss: <span className="font-mono">{job.metrics.loss.toFixed(3)}</span></span>
                          <span>Acc: <span className="font-mono">{(job.metrics.accuracy * 100).toFixed(1)}%</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="failed" className="px-4 pb-4">
                  <div className="space-y-2">
                    {FAILED_JOBS.map((job) => (
                      <div
                        key={job.id}
                        className="p-3 rounded-lg border border-[var(--status-critical)]/30 bg-[var(--status-critical)]/5"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{job.name}</span>
                          <StatusBadge status={job.status} />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <AlertTriangle className="size-3 text-[var(--status-critical)]" />
                          <span className="text-xs text-[var(--status-critical)]">{job.error}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                          <span>Failed at epoch {job.epoch}</span>
                          <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                            <RotateCcw className="size-3" />
                            Retry
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Job Details */}
          <Card className="col-span-2">
            {activeRun && experiment ? (
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base">{experiment.name}</CardTitle>
                        <StatusBadge status={activeRun.status} />
                        <StageBadge stage={activeRun.stage} />
                        <ContextBadge context="BATCH" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">{activeRun.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Pause className="size-4" />
                        Pause
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Download className="size-4 mr-2" />
                            Download Artifacts
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Terminal className="size-4 mr-2" />
                            View Full Logs
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="size-4 mr-2" />
                            Cancel Job
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progress Overview */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <div className="text-2xl font-semibold font-mono">{activeRun.currentEpoch}/{activeRun.totalEpochs}</div>
                      <div className="text-xs text-muted-foreground">Epochs</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <div className="text-2xl font-semibold font-mono">{activeRun.trainLoss.toFixed(3)}</div>
                      <div className="text-xs text-muted-foreground">Train Loss</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <div className="text-2xl font-semibold font-mono">{activeRun.valLoss.toFixed(3)}</div>
                      <div className="text-xs text-muted-foreground">Val Loss</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <div className="text-2xl font-semibold font-mono">{activeRun.estimatedTimeRemaining}</div>
                      <div className="text-xs text-muted-foreground">ETA</div>
                    </div>
                  </div>

                  {/* Stage Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Stage Progress</span>
                      <span className="text-sm text-muted-foreground">{activeRun.stageProgress}%</span>
                    </div>
                    <Progress value={activeRun.stageProgress} className="h-2" />
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Loss Curve */}
                    <div className="p-4 rounded-lg border border-border">
                      <h4 className="text-sm font-medium mb-3">Training Loss</h4>
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={lossData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                            <XAxis dataKey="epoch" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} domain={['auto', 'auto']} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--background)",
                                border: "1px solid var(--border)",
                                borderRadius: "8px",
                                fontSize: "11px",
                              }}
                            />
                            <Line type="monotone" dataKey="loss" stroke="var(--surface-ml)" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Resource Usage */}
                    <div className="p-4 rounded-lg border border-border">
                      <h4 className="text-sm font-medium mb-3">Resource Usage</h4>
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={resourceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                            <XAxis dataKey="time" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} domain={[0, 100]} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--background)",
                                border: "1px solid var(--border)",
                                borderRadius: "8px",
                                fontSize: "11px",
                              }}
                            />
                            <Area type="monotone" dataKey="gpu" stroke="var(--status-live)" fill="var(--status-live)" fillOpacity={0.2} strokeWidth={2} name="GPU %" />
                            <Area type="monotone" dataKey="memory" stroke="var(--status-warning)" fill="var(--status-warning)" fillOpacity={0.2} strokeWidth={2} name="Memory %" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Resource Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      <Cpu className="size-5 text-[var(--status-live)]" />
                      <div>
                        <div className="text-sm font-mono">{activeRun.gpuUtilization}%</div>
                        <div className="text-xs text-muted-foreground">GPU Utilization</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      <HardDrive className="size-5 text-[var(--status-warning)]" />
                      <div>
                        <div className="text-sm font-mono">{activeRun.memoryUsage}%</div>
                        <div className="text-xs text-muted-foreground">Memory Usage</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      <Layers className="size-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-mono">{activeRun.checkpoints.length}</div>
                        <div className="text-xs text-muted-foreground">Checkpoints</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      <Clock className="size-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-mono">
                          {Math.floor((Date.now() - new Date(activeRun.startedAt).getTime()) / 3600000)}h {Math.floor(((Date.now() - new Date(activeRun.startedAt).getTime()) % 3600000) / 60000)}m
                        </div>
                        <div className="text-xs text-muted-foreground">Duration</div>
                      </div>
                    </div>
                  </div>

                  {/* Logs */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Terminal className="size-4" />
                        Recent Logs
                      </h4>
                      <Button variant="ghost" size="sm" className="text-xs">
                        View All
                      </Button>
                    </div>
                    <ScrollArea className="h-[150px] rounded-lg border border-border bg-muted/20 p-3">
                      <div className="space-y-1 font-mono text-xs">
                        {activeRun.logs.map((log, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-muted-foreground shrink-0">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span className={
                              log.level === "error" ? "text-[var(--status-critical)]" :
                              log.level === "warning" ? "text-[var(--status-warning)]" :
                              "text-foreground"
                            }>
                              [{log.level.toUpperCase()}] {log.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Artifacts */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Artifacts</h4>
                    <div className="flex flex-wrap gap-2">
                      {activeRun.artifacts.map((artifact) => (
                        <Badge key={artifact.id} variant="outline" className="gap-1">
                          <Download className="size-3" />
                          {artifact.type}: {(artifact.size / 1000000).toFixed(0)}MB
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                Select a job to view details
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
