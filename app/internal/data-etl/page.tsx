"use client"

// /internal/data-etl — Internal ETL Pipeline Management Dashboard
// Full visibility into all data pipelines, venues, instruments, and data gaps
// Sharded by: Asset Class → Venue → Folder → Data Type → Date
// This is the internal operations view for the data engineering team

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Database, ArrowLeft, Activity, AlertTriangle, CheckCircle2,
  XCircle, Clock, RefreshCw, Search, Filter, ChevronRight,
  Layers, Zap, Server, HardDrive, TrendingUp, BarChart3,
  Calendar, FileWarning, Play, Pause, Settings, Bell,
} from "lucide-react"
import {
  MOCK_ETL_PIPELINES,
  MOCK_VENUE_COVERAGE,
  MOCK_DATA_GAPS,
  ETL_SUMMARY,
} from "@/lib/data-service-mock-data"
import {
  DATA_CATEGORY_LABELS,
  VENUES_BY_CATEGORY,
  type DataCategory,
  type ETLStatus,
  type ETLStage,
} from "@/lib/data-service-types"

const ETL_STAGE_LABELS: Record<ETLStage, string> = {
  ingest: "Ingest",
  validate: "Validate",
  normalise: "Normalise",
  enrich: "Enrich",
  store_gcp: "Store (GCP)",
  store_aws: "Store (AWS)",
  index: "Index",
}

const STATUS_CONFIG: Record<ETLStatus, { color: string; bg: string; icon: React.ElementType }> = {
  healthy: { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  degraded: { color: "text-amber-400", bg: "bg-amber-500/10", icon: AlertTriangle },
  failed: { color: "text-red-400", bg: "bg-red-500/10", icon: XCircle },
  pending: { color: "text-blue-400", bg: "bg-blue-500/10", icon: Clock },
  disabled: { color: "text-muted-foreground", bg: "bg-muted", icon: Pause },
}

const CATEGORY_COLORS: Record<DataCategory, string> = {
  cefi: "text-sky-400 border-sky-500/30 bg-sky-500/10",
  tradfi: "text-violet-400 border-violet-500/30 bg-violet-500/10",
  defi: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  onchain_perps: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  prediction_market: "text-rose-400 border-rose-500/30 bg-rose-500/10",
}

export default function DataETLDashboard() {
  const [selectedCategory, setSelectedCategory] = React.useState<DataCategory | "all">("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showOnlyIssues, setShowOnlyIssues] = React.useState(false)

  const filteredPipelines = MOCK_ETL_PIPELINES.filter(p => {
    if (selectedCategory !== "all" && p.config.category !== selectedCategory) return false
    if (showOnlyIssues && p.overallStatus === "healthy") return false
    if (searchQuery && !p.config.venue.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const filteredVenues = MOCK_VENUE_COVERAGE.filter(v => {
    if (selectedCategory !== "all" && v.category !== selectedCategory) return false
    if (searchQuery && !v.venue.toLowerCase().includes(searchQuery.toLowerCase()) && !v.label.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/internal"><ArrowLeft className="size-4" /></Link>
            </Button>
            <div className="flex items-center gap-2">
              <Database className="size-5 text-sky-400" />
              <span className="font-semibold">Data ETL Management</span>
              <Badge variant="outline" className="text-xs">Internal</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 size-3" />
              Sync All
            </Button>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="size-4" />
              {ETL_SUMMARY.alertsUnacknowledged > 0 && (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                  {ETL_SUMMARY.alertsUnacknowledged}
                </span>
              )}
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <SummaryCard
            label="Pipelines"
            value={ETL_SUMMARY.totalPipelines}
            subValue={`${ETL_SUMMARY.healthyPipelines} healthy`}
            icon={Activity}
            color="text-sky-400"
          />
          <SummaryCard
            label="Venues"
            value={ETL_SUMMARY.totalVenues}
            icon={Server}
            color="text-violet-400"
          />
          <SummaryCard
            label="Instruments"
            value={ETL_SUMMARY.totalInstruments.toLocaleString()}
            icon={Layers}
            color="text-emerald-400"
          />
          <SummaryCard
            label="Records Today"
            value={`${(ETL_SUMMARY.totalDataPointsToday / 1000000).toFixed(0)}M`}
            icon={BarChart3}
            color="text-amber-400"
          />
          <SummaryCard
            label="Avg Latency"
            value={`${ETL_SUMMARY.avgLatencyMs}ms`}
            icon={Zap}
            color="text-cyan-400"
          />
          <SummaryCard
            label="Degraded"
            value={ETL_SUMMARY.degradedPipelines}
            icon={AlertTriangle}
            color="text-amber-400"
            alert={ETL_SUMMARY.degradedPipelines > 0}
          />
          <SummaryCard
            label="Open Gaps"
            value={ETL_SUMMARY.openGaps}
            icon={FileWarning}
            color="text-red-400"
            alert={ETL_SUMMARY.openGaps > 0}
          />
          <SummaryCard
            label="Backfilling"
            value={ETL_SUMMARY.backfillingGaps}
            icon={RefreshCw}
            color="text-blue-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search venues, pipelines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as DataCategory | "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {(Object.keys(DATA_CATEGORY_LABELS) as DataCategory[]).filter(c => c !== "prediction_market").map(cat => (
                <SelectItem key={cat} value={cat}>{DATA_CATEGORY_LABELS[cat]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showOnlyIssues ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyIssues(!showOnlyIssues)}
          >
            <AlertTriangle className="mr-2 size-3" />
            Issues Only
          </Button>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="pipelines" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pipelines">
              <Activity className="mr-2 size-4" />
              Pipelines ({filteredPipelines.length})
            </TabsTrigger>
            <TabsTrigger value="venues">
              <Server className="mr-2 size-4" />
              Venues ({filteredVenues.length})
            </TabsTrigger>
            <TabsTrigger value="gaps">
              <FileWarning className="mr-2 size-4" />
              Data Gaps ({MOCK_DATA_GAPS.length})
            </TabsTrigger>
            <TabsTrigger value="instruments">
              <Layers className="mr-2 size-4" />
              Instruments
            </TabsTrigger>
          </TabsList>

          {/* ─── Pipelines Tab ──────────────────────────────────────────────── */}
          <TabsContent value="pipelines" className="space-y-4">
            {filteredPipelines.map(pipeline => (
              <PipelineCard key={pipeline.config.id} pipeline={pipeline} />
            ))}
            {filteredPipelines.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No pipelines match your filters.
              </div>
            )}
          </TabsContent>

          {/* ─── Venues Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="venues" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVenues.map(venue => (
                <VenueCard key={venue.venue} venue={venue} />
              ))}
            </div>
            {filteredVenues.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No venues match your filters.
              </div>
            )}
          </TabsContent>

          {/* ─── Data Gaps Tab ──────────────────────────────────────────────── */}
          <TabsContent value="gaps" className="space-y-4">
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Gap</th>
                    <th className="text-left p-3 font-medium">Location</th>
                    <th className="text-left p-3 font-medium">Date Range</th>
                    <th className="text-left p-3 font-medium">Severity</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_DATA_GAPS.map(gap => (
                    <tr key={gap.id} className="border-b last:border-0">
                      <td className="p-3">
                        <div className="font-medium">{gap.dataType}</div>
                        <div className="text-xs text-muted-foreground">{gap.instrument || "All instruments"}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={CATEGORY_COLORS[gap.category]}>
                          {DATA_CATEGORY_LABELS[gap.category]}
                        </Badge>
                        <span className="ml-2 text-muted-foreground">{gap.venue} / {gap.folder}</span>
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {gap.gapStart === gap.gapEnd ? gap.gapStart : `${gap.gapStart} → ${gap.gapEnd}`}
                        <div className="text-muted-foreground">{gap.daysAffected} day(s)</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={cn(
                          gap.severity === "critical" && "border-red-500/30 text-red-400",
                          gap.severity === "high" && "border-orange-500/30 text-orange-400",
                          gap.severity === "medium" && "border-amber-500/30 text-amber-400",
                          gap.severity === "low" && "border-muted-foreground/30 text-muted-foreground"
                        )}>
                          {gap.severity}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={cn(
                          gap.status === "open" && "border-red-500/30 text-red-400",
                          gap.status === "backfilling" && "border-blue-500/30 text-blue-400",
                          gap.status === "resolved" && "border-emerald-500/30 text-emerald-400",
                          gap.status === "wont_fix" && "border-muted-foreground/30 text-muted-foreground"
                        )}>
                          {gap.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {gap.status === "open" && (
                          <Button size="sm" variant="outline">
                            <Play className="mr-1 size-3" />
                            Backfill
                          </Button>
                        )}
                        {gap.status === "backfilling" && (
                          <Button size="sm" variant="ghost" disabled>
                            <RefreshCw className="mr-1 size-3 animate-spin" />
                            Running...
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ─── Instruments Tab ────────────────────────────────────────────── */}
          <TabsContent value="instruments">
            <InstrumentBrowser selectedCategory={selectedCategory} searchQuery={searchQuery} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  subValue,
  icon: Icon,
  color,
  alert,
}: {
  label: string
  value: string | number
  subValue?: string
  icon: React.ElementType
  color: string
  alert?: boolean
}) {
  return (
    <Card className={cn(alert && "border-amber-500/30")}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <Icon className={cn("size-4", color)} />
          {alert && <span className="size-2 rounded-full bg-amber-500 animate-pulse" />}
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold font-mono">{value}</div>
          <div className="text-xs text-muted-foreground">{subValue || label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function PipelineCard({ pipeline }: { pipeline: typeof MOCK_ETL_PIPELINES[0] }) {
  const { config, stages, overallStatus, dataLagMinutes, alerts } = pipeline
  const StatusIcon = STATUS_CONFIG[overallStatus].icon

  return (
    <Card className={cn(
      overallStatus === "degraded" && "border-amber-500/30",
      overallStatus === "failed" && "border-red-500/30"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", STATUS_CONFIG[overallStatus].bg)}>
              <StatusIcon className={cn("size-4", STATUS_CONFIG[overallStatus].color)} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {config.venue}
                <Badge variant="outline" className={CATEGORY_COLORS[config.category]}>
                  {DATA_CATEGORY_LABELS[config.category]}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">{config.folder}</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                {config.dataTypes.join(", ")} · {config.schedule}
                {config.priority === "critical" && (
                  <Badge variant="destructive" className="ml-2 text-[9px]">Critical</Badge>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className={cn("text-sm font-mono", dataLagMinutes > 10 ? "text-amber-400" : "text-muted-foreground")}>
                {dataLagMinutes < 60 ? `${dataLagMinutes}m` : `${Math.floor(dataLagMinutes / 60)}h ${dataLagMinutes % 60}m`} lag
              </div>
              <div className="text-xs text-muted-foreground">Last sync: {new Date(pipeline.lastFullSync).toLocaleTimeString()}</div>
            </div>
            <Button variant="ghost" size="icon">
              <RefreshCw className="size-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stage pipeline visualization */}
        <div className="flex items-center gap-1 mb-3">
          {stages.map((stage, i) => (
            <React.Fragment key={stage.stage}>
              <div
                className={cn(
                  "flex-1 h-2 rounded-full",
                  stage.status === "healthy" && "bg-emerald-500",
                  stage.status === "degraded" && "bg-amber-500",
                  stage.status === "failed" && "bg-red-500",
                  stage.status === "pending" && "bg-blue-500 animate-pulse",
                  stage.status === "disabled" && "bg-muted"
                )}
                title={`${ETL_STAGE_LABELS[stage.stage]}: ${stage.status}`}
              />
              {i < stages.length - 1 && <ChevronRight className="size-3 text-muted-foreground shrink-0" />}
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex gap-4">
            {stages.slice(0, 4).map(stage => (
              <span key={stage.stage} className="flex items-center gap-1">
                <span className={cn(
                  "size-1.5 rounded-full",
                  stage.status === "healthy" && "bg-emerald-500",
                  stage.status === "degraded" && "bg-amber-500",
                  stage.status === "failed" && "bg-red-500"
                )} />
                {ETL_STAGE_LABELS[stage.stage]}
              </span>
            ))}
          </div>
          <div>
            {stages[0].recordsProcessed?.toLocaleString()} records · {stages[0].latencyMs}ms
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mt-3 space-y-2">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  alert.severity === "critical" && "bg-red-500/10 text-red-400",
                  alert.severity === "warning" && "bg-amber-500/10 text-amber-400",
                  alert.severity === "info" && "bg-blue-500/10 text-blue-400"
                )}
              >
                <AlertTriangle className="size-4 shrink-0" />
                <span className="flex-1">{alert.message}</span>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                  Acknowledge
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function VenueCard({ venue }: { venue: typeof MOCK_VENUE_COVERAGE[0] }) {
  const StatusIcon = STATUS_CONFIG[venue.healthStatus].icon

  return (
    <Card className={cn(
      venue.healthStatus === "degraded" && "border-amber-500/30",
      venue.healthStatus === "failed" && "border-red-500/30"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {venue.label}
            <StatusIcon className={cn("size-4", STATUS_CONFIG[venue.healthStatus].color)} />
          </CardTitle>
          <Badge variant="outline" className={CATEGORY_COLORS[venue.category]}>
            {DATA_CATEGORY_LABELS[venue.category]}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {venue.dataSource} · {venue.folders.join(", ")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Instruments</div>
            <div className="font-mono font-medium">{venue.instrumentCount.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Daily Volume</div>
            <div className="font-mono font-medium">{(venue.dailyVolume / 1000000).toFixed(1)}M</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Oldest Data</div>
            <div className="font-mono">{venue.oldestData}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Latest Data</div>
            <div className="font-mono">{venue.newestData}</div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full">
          <ChevronRight className="mr-2 size-3" />
          View Pipeline
        </Button>
      </CardContent>
    </Card>
  )
}

function InstrumentBrowser({ selectedCategory, searchQuery }: { selectedCategory: DataCategory | "all"; searchQuery: string }) {
  const [expandedVenue, setExpandedVenue] = React.useState<string | null>(null)

  const categories = selectedCategory === "all"
    ? (Object.keys(VENUES_BY_CATEGORY) as DataCategory[]).filter(c => c !== "prediction_market")
    : [selectedCategory]

  return (
    <div className="space-y-4">
      {categories.map(cat => (
        <Card key={cat}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge variant="outline" className={CATEGORY_COLORS[cat]}>
                {DATA_CATEGORY_LABELS[cat]}
              </Badge>
              <span className="text-muted-foreground font-normal">
                {VENUES_BY_CATEGORY[cat].length} venues
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
              {VENUES_BY_CATEGORY[cat]
                .filter(v => !searchQuery || v.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(venue => {
                  const coverage = MOCK_VENUE_COVERAGE.find(vc => vc.venue === venue)
                  return (
                    <button
                      key={venue}
                      onClick={() => setExpandedVenue(expandedVenue === venue ? null : venue)}
                      className={cn(
                        "flex items-center justify-between rounded-md border p-3 text-left text-sm transition-colors hover:bg-accent",
                        expandedVenue === venue && "bg-accent border-primary"
                      )}
                    >
                      <div>
                        <div className="font-medium capitalize">{venue.replace(/_/g, " ")}</div>
                        {coverage && (
                          <div className="text-xs text-muted-foreground">
                            {coverage.instrumentCount.toLocaleString()} instruments · Since {coverage.oldestData}
                          </div>
                        )}
                      </div>
                      <ChevronRight className={cn(
                        "size-4 text-muted-foreground transition-transform",
                        expandedVenue === venue && "rotate-90"
                      )} />
                    </button>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
