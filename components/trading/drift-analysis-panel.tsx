"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Radio,
  Database,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Check,
  Clock,
  RefreshCw,
  FileText,
  ArrowUpRight,
} from "lucide-react"

interface DriftMetric {
  label: string
  liveValue: number
  batchValue: number
  unit?: string
  threshold?: number // Percentage threshold for alert
}

interface UnreconciledItem {
  id: string
  type: "fill" | "position" | "transfer"
  description: string
  timestamp: string
  amount: number
  venue: string
}

interface DriftAnalysisPanelProps {
  metrics: DriftMetric[]
  unreconciledItems?: UnreconciledItem[]
  batchAsOf: string
  liveAsOf: string
  onPromoteToBatch?: () => void
  onExportDelta?: () => void
  onViewUnreconciled?: () => void
  className?: string
}

export function DriftAnalysisPanel({
  metrics,
  unreconciledItems = [],
  batchAsOf,
  liveAsOf,
  onPromoteToBatch,
  onExportDelta,
  onViewUnreconciled,
  className,
}: DriftAnalysisPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isPromoting, setIsPromoting] = React.useState(false)

  const formatValue = (value: number, unit?: string) => {
    if (unit === "%") return `${value.toFixed(2)}%`
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}k`
    return `$${value.toFixed(0)}`
  }

  const getDelta = (live: number, batch: number) => live - batch
  const getDeltaPercent = (live: number, batch: number) =>
    batch !== 0 ? ((live - batch) / Math.abs(batch)) * 100 : 0

  const isSignificantDrift = (live: number, batch: number, threshold = 5) => {
    const percent = Math.abs(getDeltaPercent(live, batch))
    return percent > threshold
  }

  const handlePromote = async () => {
    setIsPromoting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsPromoting(false)
    onPromoteToBatch?.()
  }

  const significantDrifts = metrics.filter((m) =>
    isSignificantDrift(m.liveValue, m.batchValue, m.threshold || 5)
  )

  return (
    <Card className={cn("border-dashed", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
                <CardTitle className="text-sm flex items-center gap-2">
                  <ArrowLeftRight className="size-4" />
                  Live vs Simulated
                </CardTitle>
                {significantDrifts.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-[var(--status-warning)] text-[var(--status-warning)]"
                  >
                    {significantDrifts.length} significant
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Radio className="size-3 text-[var(--status-live)]" />
                  <span>{liveAsOf}</span>
                </div>
                <span>vs</span>
                <div className="flex items-center gap-1">
                  <Database className="size-3" />
                  <span>{batchAsOf}</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Drift Metrics */}
            <div className="space-y-3">
              {metrics.map((metric) => {
                const delta = getDelta(metric.liveValue, metric.batchValue)
                const deltaPercent = getDeltaPercent(metric.liveValue, metric.batchValue)
                const isSignificant = isSignificantDrift(
                  metric.liveValue,
                  metric.batchValue,
                  metric.threshold
                )

                return (
                  <div key={metric.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{metric.label}</span>
                        {isSignificant && (
                          <AlertTriangle className="size-3 text-[var(--status-warning)]" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-muted-foreground">
                          {formatValue(metric.batchValue, metric.unit)}
                        </span>
                        <ArrowUpRight
                          className={cn(
                            "size-3",
                            delta >= 0
                              ? "text-[var(--pnl-positive)]"
                              : "text-[var(--pnl-negative)] rotate-90"
                          )}
                        />
                        <span>{formatValue(metric.liveValue, metric.unit)}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            delta >= 0
                              ? "border-[var(--pnl-positive)] text-[var(--pnl-positive)]"
                              : "border-[var(--pnl-negative)] text-[var(--pnl-negative)]"
                          )}
                        >
                          {delta >= 0 ? "+" : ""}
                          {deltaPercent.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>

                    {/* Visual drift indicator */}
                    <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                      {/* Batch position (baseline) */}
                      <div
                        className="absolute h-full bg-primary/50"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.abs(metric.batchValue) /
                              Math.max(
                                Math.abs(metric.batchValue),
                                Math.abs(metric.liveValue)
                              ) *
                              100
                          )}%`,
                        }}
                      />
                      {/* Live position */}
                      <div
                        className={cn(
                          "absolute h-full",
                          delta >= 0 ? "bg-[var(--status-live)]" : "bg-[var(--status-warning)]"
                        )}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.abs(metric.liveValue) /
                              Math.max(
                                Math.abs(metric.batchValue),
                                Math.abs(metric.liveValue)
                              ) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Unreconciled Items */}
            {unreconciledItems.length > 0 && (
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">
                    Unreconciled Items ({unreconciledItems.length})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={onViewUnreconciled}
                  >
                    View All
                  </Button>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {unreconciledItems.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {item.type}
                        </Badge>
                        <span className="truncate max-w-[200px]">{item.description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{formatValue(item.amount)}</span>
                        <span className="text-muted-foreground">{item.venue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={onExportDelta}
              >
                <FileText className="size-3.5" />
                Export Delta
              </Button>
              {unreconciledItems.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={onViewUnreconciled}
                >
                  View {unreconciledItems.length} Unreconciled
                </Button>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

// Compact inline drift indicator
export function DriftIndicator({
  label,
  liveValue,
  batchValue,
  unit,
  className,
}: {
  label: string
  liveValue: number
  batchValue: number
  unit?: string
  className?: string
}) {
  const delta = liveValue - batchValue
  const deltaPercent = batchValue !== 0 ? ((delta / Math.abs(batchValue)) * 100) : 0

  const formatValue = (value: number) => {
    if (unit === "%") return `${value.toFixed(2)}%`
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}k`
    return `$${value.toFixed(0)}`
  }

  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      <span className="text-muted-foreground">{label}:</span>
      <div className="flex items-center gap-1">
        {delta >= 0 ? (
          <TrendingUp className="size-3 text-[var(--pnl-positive)]" />
        ) : (
          <TrendingDown className="size-3 text-[var(--pnl-negative)]" />
        )}
        <span
          className={cn(
            "font-mono",
            delta >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"
          )}
        >
          {delta >= 0 ? "+" : ""}
          {formatValue(delta)}
        </span>
        <span className="text-muted-foreground">
          ({deltaPercent >= 0 ? "+" : ""}
          {deltaPercent.toFixed(1)}%)
        </span>
      </div>
    </div>
  )
}
