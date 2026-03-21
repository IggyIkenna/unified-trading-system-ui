"use client"

import * as React from "react"
import { StatusBadge } from "@/components/trading/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  AlertTriangle,
  AlertCircle,
  Bell,
  Check,
  Clock,
  Search,
  Filter,
  ChevronRight,
  XCircle,
  Pause,
  Square,
  Power,
} from "lucide-react"
import { cn } from "@/lib/utils"

type AlertSeverity = "critical" | "high" | "medium" | "low" | "info"
type AlertStatus = "active" | "acknowledged" | "resolved" | "muted"

interface Alert {
  id: string
  severity: AlertSeverity
  status: AlertStatus
  title: string
  description: string
  source: string
  entity: string
  entityType: "strategy" | "venue" | "service" | "position"
  timestamp: string
  value?: string
  threshold?: string
  recommendedAction?: string
}

const mockAlerts: Alert[] = [
  {
    id: "alert-001",
    severity: "critical",
    status: "active",
    title: "Kill Switch Armed",
    description: "BTC Basis v3 inventory skew exceeded threshold",
    source: "risk-and-exposure-service",
    entity: "BTC Basis v3",
    entityType: "strategy",
    timestamp: "2m ago",
    value: "15.2%",
    threshold: "10%",
    recommendedAction: "Review position skew and consider rebalancing",
  },
  {
    id: "alert-002",
    severity: "high",
    status: "active",
    title: "Feature Freshness SLA Breach",
    description: "features-delta-1 lagging 92s in EU region",
    source: "alerting-service",
    entity: "features-delta-1",
    entityType: "service",
    timestamp: "5m ago",
    value: "92s",
    threshold: "30s",
    recommendedAction: "Check EU feature pipeline health",
  },
  {
    id: "alert-003",
    severity: "high",
    status: "active",
    title: "Margin Utilization Warning",
    description: "Binance margin approaching limit",
    source: "risk-and-exposure-service",
    entity: "Binance",
    entityType: "venue",
    timestamp: "8m ago",
    value: "78%",
    threshold: "80%",
    recommendedAction: "Reduce position size or add margin",
  },
  {
    id: "alert-004",
    severity: "medium",
    status: "active",
    title: "Reconciliation Break",
    description: "Elysium SMA position mismatch detected",
    source: "recon-service",
    entity: "Elysium SMA",
    entityType: "position",
    timestamp: "12m ago",
    value: "0.5 BTC",
    threshold: "0.1 BTC",
    recommendedAction: "Review and resolve position discrepancy",
  },
  {
    id: "alert-005",
    severity: "medium",
    status: "acknowledged",
    title: "LTV Near Threshold",
    description: "Aave v3 ETH position LTV elevated",
    source: "risk-and-exposure-service",
    entity: "Aave v3 ETH",
    entityType: "venue",
    timestamp: "18m ago",
    value: "0.72",
    threshold: "0.75",
    recommendedAction: "Add collateral or reduce borrow",
  },
  {
    id: "alert-006",
    severity: "low",
    status: "resolved",
    title: "Order Latency Spike",
    description: "Deribit order ack latency p99 elevated",
    source: "execution-service",
    entity: "Deribit",
    entityType: "venue",
    timestamp: "45m ago",
    value: "850ms",
    threshold: "500ms",
    recommendedAction: "Monitor venue connectivity",
  },
  {
    id: "alert-007",
    severity: "info",
    status: "resolved",
    title: "Strategy Resumed",
    description: "ML Directional BTC resumed after feature recovery",
    source: "strategy-service",
    entity: "ML Directional BTC",
    entityType: "strategy",
    timestamp: "1h ago",
  },
]

function getSeverityIcon(severity: AlertSeverity) {
  switch (severity) {
    case "critical":
      return <XCircle className="size-4" />
    case "high":
      return <AlertCircle className="size-4" />
    case "medium":
      return <AlertTriangle className="size-4" />
    default:
      return <Bell className="size-4" />
  }
}

function getSeverityColor(severity: AlertSeverity) {
  switch (severity) {
    case "critical":
      return "text-[var(--status-error)] bg-[var(--status-error)]/10 border-[var(--status-error)]"
    case "high":
      return "text-[var(--status-error)] bg-[var(--status-error)]/10 border-[var(--status-error)]"
    case "medium":
      return "text-[var(--status-warning)] bg-[var(--status-warning)]/10 border-[var(--status-warning)]"
    case "low":
      return "text-[var(--status-live)] bg-[var(--status-live)]/10 border-[var(--status-live)]"
    default:
      return "text-muted-foreground bg-muted/10 border-muted-foreground"
  }
}

function getStatusColor(status: AlertStatus) {
  switch (status) {
    case "active":
      return "text-[var(--status-error)]"
    case "acknowledged":
      return "text-[var(--status-warning)]"
    case "resolved":
      return "text-[var(--status-live)]"
    case "muted":
      return "text-muted-foreground"
    default:
      return "text-muted-foreground"
  }
}

export default function AlertsPage() {
  const [filter, setFilter] = React.useState<string>("all")
  const [severityFilter, setSeverityFilter] = React.useState<string>("all")

  const filteredAlerts = React.useMemo(() => {
    return mockAlerts.filter((alert) => {
      if (filter !== "all" && alert.status !== filter) return false
      if (severityFilter !== "all" && alert.severity !== severityFilter) return false
      return true
    })
  }, [filter, severityFilter])

  const criticalCount = mockAlerts.filter((a) => a.severity === "critical" && a.status === "active").length
  const highCount = mockAlerts.filter((a) => a.severity === "high" && a.status === "active").length
  const activeCount = mockAlerts.filter((a) => a.status === "active").length

  return (
    <div className="p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Bell className="size-6 text-primary" />
              Alerts & Incidents
            </h1>
            <p className="text-sm text-muted-foreground">
              Real-time alert feed with incident management
            </p>
          </div>
          <div className="flex items-center gap-3">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="size-3" />
                {criticalCount} Critical
              </Badge>
            )}
            {highCount > 0 && (
              <Badge variant="outline" className="gap-1 text-[var(--status-error)] border-[var(--status-error)]">
                <AlertCircle className="size-3" />
                {highCount} High
              </Badge>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <Power className="size-4" />
                  Kill Switch
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-[var(--status-error)]">
                    <Power className="size-5" />
                    Kill Switch Panel
                  </SheetTitle>
                  <SheetDescription>
                    Emergency intervention controls. All actions require confirmation.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Scope Selector */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Scope</label>
                    <Select defaultValue="strategy">
                      <SelectTrigger>
                        <SelectValue placeholder="Select scope" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="firm">Firm (All)</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="strategy">Strategy</SelectItem>
                        <SelectItem value="venue">Venue</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="btc-basis">
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="btc-basis">BTC Basis v3</SelectItem>
                        <SelectItem value="eth-staked">ETH Staked Basis</SelectItem>
                        <SelectItem value="ml-directional">ML Directional BTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Actions</label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="gap-2 justify-start h-auto py-3">
                        <Pause className="size-4 text-[var(--status-warning)]" />
                        <div className="text-left">
                          <div className="font-medium">Pause Strategy</div>
                          <div className="text-xs text-muted-foreground">Stop new orders</div>
                        </div>
                      </Button>
                      <Button variant="outline" className="gap-2 justify-start h-auto py-3">
                        <XCircle className="size-4 text-[var(--status-error)]" />
                        <div className="text-left">
                          <div className="font-medium">Cancel Orders</div>
                          <div className="text-xs text-muted-foreground">Cancel all open</div>
                        </div>
                      </Button>
                      <Button variant="outline" className="gap-2 justify-start h-auto py-3">
                        <Square className="size-4 text-[var(--status-error)]" />
                        <div className="text-left">
                          <div className="font-medium">Flatten</div>
                          <div className="text-xs text-muted-foreground">Close all positions</div>
                        </div>
                      </Button>
                      <Button variant="outline" className="gap-2 justify-start h-auto py-3">
                        <Power className="size-4 text-[var(--status-error)]" />
                        <div className="text-left">
                          <div className="font-medium">Disable Venue</div>
                          <div className="text-xs text-muted-foreground">Block venue access</div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  {/* Rationale */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Rationale (required)</label>
                    <Input placeholder="Describe reason for intervention..." />
                  </div>

                  {/* Impact Preview */}
                  <Card className="bg-[var(--status-error)]/5 border-[var(--status-error)]/20">
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-[var(--status-error)] mb-2">Impact Preview</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Affected positions: 2</div>
                        <div>Open orders: 5</div>
                        <div>Estimated market impact: ~$2,400</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button variant="destructive" className="w-full gap-2">
                    <Power className="size-4" />
                    Confirm Action
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Active Alerts</div>
              <div className="text-3xl font-semibold font-mono">{activeCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Critical</div>
              <div className="text-3xl font-semibold font-mono text-[var(--status-error)]">{criticalCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Avg Resolution</div>
              <div className="text-3xl font-semibold font-mono">12m</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Last 24h</div>
              <div className="text-3xl font-semibold font-mono">23</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search alerts..." className="pl-9" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="muted">Muted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Alerts Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px]">Severity</TableHead>
                  <TableHead>Alert</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Value / Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id} className="cursor-pointer hover:bg-muted/30">
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("gap-1", getSeverityColor(alert.severity))}
                      >
                        {getSeverityIcon(alert.severity)}
                        {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{alert.title}</span>
                        <span className="text-xs text-muted-foreground">{alert.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-primary hover:underline cursor-pointer">{alert.entity}</span>
                        <span className="text-xs text-muted-foreground capitalize">{alert.entityType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {alert.value && alert.threshold ? (
                        <div className="flex flex-col">
                          <span className="font-mono font-medium">{alert.value}</span>
                          <span className="text-xs text-muted-foreground font-mono">/ {alert.threshold}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("capitalize", getStatusColor(alert.status))}
                      >
                        {alert.status === "active" && <Clock className="size-3 mr-1" />}
                        {alert.status === "resolved" && <Check className="size-3 mr-1" />}
                        {alert.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {alert.timestamp}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="gap-1">
                        View
                        <ChevronRight className="size-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
