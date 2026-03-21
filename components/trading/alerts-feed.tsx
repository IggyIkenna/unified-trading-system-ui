"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  XCircle, 
  AlertCircle, 
  ChevronRight, 
  X, 
  Check, 
  Clock,
  Eye,
  TrendingDown,
  ExternalLink,
  Timer,
} from "lucide-react"
import Link from "next/link"

type AlertSeverity = "critical" | "high" | "medium" | "low"

export interface Alert {
  id: string
  severity: AlertSeverity
  title?: string
  message?: string // Support both title and message
  description?: string
  timestamp: Date | string
  source?: string
  acknowledged?: boolean
  acknowledgedAt?: Date
  acknowledgedBy?: string
  escalatedAt?: Date
  strategyId?: string
  clientId?: string
  assetClass?: string
  // Actions available for this alert
  actions?: {
    canAcknowledge?: boolean
    canReduce?: boolean
    canInvestigate?: boolean
    linkedEntity?: { type: string; id: string }
  }
}

interface AlertsFeedProps {
  alerts: Alert[]
  onAcknowledge?: (alertId: string) => void
  onReduce?: (alertId: string, percent: number) => void
  onInvestigate?: (alertId: string) => void
  onViewAll?: () => void
  maxItems?: number
  showEscalationTimers?: boolean
  className?: string
}

const severityConfig: Record<
  AlertSeverity,
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  critical: {
    icon: XCircle,
    color: "var(--status-critical)",
    bgColor: "rgba(248, 113, 113, 0.1)",
    label: "CRIT",
  },
  high: {
    icon: AlertTriangle,
    color: "var(--status-warning)",
    bgColor: "rgba(251, 191, 36, 0.1)",
    label: "HIGH",
  },
  medium: {
    icon: AlertCircle,
    color: "var(--chart-1)",
    bgColor: "rgba(34, 211, 238, 0.1)",
    label: "MED",
  },
  low: {
    icon: AlertCircle,
    color: "var(--muted-foreground)",
    bgColor: "rgba(161, 161, 170, 0.1)",
    label: "LOW",
  },
}

// Escalation timing based on severity
const escalationConfig: Record<AlertSeverity, { minutes: number | null }> = {
  critical: { minutes: 5 },
  high: { minutes: 15 },
  medium: { minutes: null },
  low: { minutes: null },
}

export function AlertsFeed({
  alerts,
  onAcknowledge,
  onReduce,
  onInvestigate,
  onViewAll,
  maxItems = 5,
  showEscalationTimers = true,
  className,
}: AlertsFeedProps) {
  const [now, setNow] = React.useState(new Date())

  // Update time every 30 seconds for escalation timers
  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    const diff = now.getTime() - dateObj.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return dateObj.toLocaleDateString()
  }

  const getEscalationStatus = (alert: Alert) => {
    if (alert.acknowledged) return null
    const escalationMinutes = escalationConfig[alert.severity].minutes
    if (!escalationMinutes) return null
    
    const alertDate = typeof alert.timestamp === "string" ? new Date(alert.timestamp) : alert.timestamp
    const elapsedMinutes = (now.getTime() - alertDate.getTime()) / 60000
    const remaining = escalationMinutes - elapsedMinutes
    
    if (remaining <= 0) {
      return { escalated: true, remaining: 0 }
    }
    return { escalated: false, remaining: Math.ceil(remaining) }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {alerts.slice(0, maxItems).map((alert) => {
        const config = severityConfig[alert.severity]
        const Icon = config.icon
        const escalation = showEscalationTimers ? getEscalationStatus(alert) : null
        const displayTitle = alert.title || alert.message || "Alert"

        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-all",
              alert.acknowledged ? "opacity-50 border-border/30" : "border-border/50",
              escalation?.escalated && "border-[var(--status-error)] animate-pulse"
            )}
            style={{ backgroundColor: config.bgColor }}
          >
            <Icon
              className={cn("size-4 mt-0.5 shrink-0", escalation?.escalated && "animate-pulse")}
              style={{ color: config.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    color: config.color,
                    backgroundColor: `color-mix(in srgb, ${config.color} 20%, transparent)`,
                  }}
                >
                  {config.label}
                </span>
                <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {formatTime(alert.timestamp)}
                </span>
                
                {/* Escalation timer */}
                {escalation && !escalation.escalated && (
                  <Badge variant="outline" className="text-[10px] gap-1 border-[var(--status-warning)] text-[var(--status-warning)]">
                    <Timer className="size-2.5" />
                    Escalates in {escalation.remaining}m
                  </Badge>
                )}
                {escalation?.escalated && (
                  <Badge className="text-[10px] gap-1 bg-[var(--status-error)]">
                    ESCALATED
                  </Badge>
                )}
                
                {/* Acknowledged badge */}
                {alert.acknowledged && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Check className="size-2.5" />
                    Ack{alert.acknowledgedBy ? ` by ${alert.acknowledgedBy}` : ""}
                  </Badge>
                )}
              </div>
              
              <p className="text-sm font-medium">{displayTitle}</p>
              {alert.description && (
                <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
              )}
              
              {/* Source and linked entity */}
              <div className="flex items-center gap-2 mt-1">
                {alert.source && (
                  <span className="text-[10px] text-muted-foreground/60">
                    {alert.source}
                  </span>
                )}
                {alert.strategyId && (
                  <Link 
                    href={`/services/trading/strategies/${alert.strategyId}`}
                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                  >
                    View Strategy
                    <ExternalLink className="size-2.5" />
                  </Link>
                )}
              </div>
              
              {/* Action buttons for unacknowledged alerts */}
              {!alert.acknowledged && (onAcknowledge || onReduce || onInvestigate) && (
                <div className="flex items-center gap-1 mt-2">
                  {onAcknowledge && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] gap-1"
                      onClick={() => onAcknowledge(alert.id)}
                    >
                      <Check className="size-3" />
                      Acknowledge
                    </Button>
                  )}
                  {onReduce && (alert.severity === "critical" || alert.severity === "high") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] gap-1 border-[var(--status-warning)] text-[var(--status-warning)]"
                      onClick={() => onReduce(alert.id, 50)}
                    >
                      <TrendingDown className="size-3" />
                      Reduce 50%
                    </Button>
                  )}
                  {onInvestigate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] gap-1"
                      onClick={() => onInvestigate(alert.id)}
                    >
                      <Eye className="size-3" />
                      Investigate
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {alerts.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No alerts in current scope
        </div>
      )}

      {onViewAll && alerts.length > maxItems && (
        <Button
          variant="ghost"
          className="w-full justify-between text-muted-foreground hover:text-foreground"
          onClick={onViewAll}
        >
          View All Alerts ({alerts.length})
          <ChevronRight className="size-4" />
        </Button>
      )}
    </div>
  )
}
