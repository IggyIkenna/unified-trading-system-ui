"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { AlertTriangle, Clock, TrendingUp, TrendingDown } from "lucide-react"

export interface VenueMargin {
  venue: string
  venueLabel: string
  used: number
  available: number
  total: number
  utilization: number
  trend: "up" | "down" | "stable"
  marginCallDistance?: number // Percentage away from margin call
  lastUpdate: string
}

interface MarginUtilizationProps {
  venues: VenueMargin[]
  className?: string
}

export function MarginUtilization({ venues, className }: MarginUtilizationProps) {
  const formatCurrency = (v: number) => {
    if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(1)}M`
    if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`
    return `$${v.toFixed(0)}`
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return "var(--status-error)"
    if (utilization >= 75) return "var(--status-warning)"
    if (utilization >= 50) return "var(--chart-1)"
    return "var(--status-live)"
  }

  const getUtilizationBg = (utilization: number) => {
    if (utilization >= 90) return "bg-[var(--status-error)]"
    if (utilization >= 75) return "bg-[var(--status-warning)]"
    if (utilization >= 50) return "bg-[var(--chart-1)]"
    return "bg-[var(--status-live)]"
  }

  // Aggregate by venue name
  const aggregatedVenues = React.useMemo(() => {
    const grouped: Record<string, { venue: string; venueLabel: string; used: number; available: number; total: number; positions: number }> = {}
    venues.forEach(v => {
      const key = v.venue || v.venueLabel || "Unknown"
      if (!grouped[key]) {
        grouped[key] = { venue: key, venueLabel: v.venueLabel || key, used: 0, available: 0, total: 0, positions: 0 }
      }
      grouped[key].used += v.used || 0
      grouped[key].available += v.available || 0
      grouped[key].total += v.total || 0
      grouped[key].positions += 1
    })
    return Object.values(grouped).map(g => ({
      ...g,
      utilization: g.total > 0 ? Math.round((g.used / g.total) * 100) : 0,
      trend: "stable" as "up" | "down" | "stable",
      marginCallDistance: g.total > 0 ? Math.max(5, 30 - Math.round((g.used / g.total) * 30)) : 30,
      lastUpdate: new Date().toISOString(),
    }))
  }, [venues])

  // Sort by utilization descending
  const sortedVenues = [...aggregatedVenues].sort((a, b) => b.utilization - a.utilization)

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Margin Utilization by Venue</CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {sortedVenues.length} venues
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedVenues.map((venue) => (
          <TooltipProvider key={venue.venue}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1.5 cursor-pointer hover:bg-muted/30 rounded px-1 py-0.5 -mx-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{venue.venueLabel}</span>
                      {venue.utilization >= 90 && (
                        <AlertTriangle className="size-3 text-[var(--status-error)] animate-pulse" />
                      )}
                      {venue.trend === "up" && (
                        <TrendingUp className="size-3 text-[var(--status-warning)]" />
                      )}
                      {venue.trend === "down" && (
                        <TrendingDown className="size-3 text-[var(--status-live)]" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-mono font-medium"
                        style={{ color: getUtilizationColor(venue.utilization) }}
                      >
                        {venue.utilization.toFixed(0)}%
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatCurrency(venue.used)} / {formatCurrency(venue.total)}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all", getUtilizationBg(venue.utilization))}
                      style={{ width: `${venue.utilization}%` }}
                    />
                    {/* Warning threshold line at 75% */}
                    <div 
                      className="absolute top-0 bottom-0 w-px bg-[var(--status-warning)]"
                      style={{ left: "75%" }}
                    />
                    {/* Critical threshold line at 90% */}
                    <div 
                      className="absolute top-0 bottom-0 w-px bg-[var(--status-error)]"
                      style={{ left: "90%" }}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="w-64">
                <div className="space-y-2">
                  <div className="font-medium">{venue.venueLabel}</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <span className="text-muted-foreground">Margin Used:</span>
                    <span className="font-mono">{formatCurrency(venue.used)}</span>
                    <span className="text-muted-foreground">Available:</span>
                    <span className="font-mono">{formatCurrency(venue.available)}</span>
                    <span className="text-muted-foreground">Total Limit:</span>
                    <span className="font-mono">{formatCurrency(venue.total)}</span>
                    {venue.marginCallDistance !== undefined && (
                      <>
                        <span className="text-muted-foreground">Margin Call:</span>
                        <span className={cn(
                          "font-mono",
                          venue.marginCallDistance < 10 ? "text-[var(--status-error)]" : "text-muted-foreground"
                        )}>
                          {venue.marginCallDistance.toFixed(1)}% away
                        </span>
                      </>
                    )}
                    <span className="text-muted-foreground">Last Update:</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-2.5" />
                      {venue.lastUpdate}
                    </span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}

        {/* Summary row — uses aggregated data to avoid double-counting */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total Across Venues</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">
                {formatCurrency(sortedVenues.reduce((sum, v) => sum + v.used, 0))}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="font-mono text-muted-foreground">
                {formatCurrency(sortedVenues.reduce((sum, v) => sum + v.total, 0))}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact inline version for the command center header
export function MarginUtilizationCompact({ venues }: { venues: VenueMargin[] }) {
  // Aggregate by venue to avoid counting per-position rows
  const aggregated = React.useMemo(() => {
    const grouped: Record<string, { used: number; total: number }> = {}
    venues.forEach(v => {
      const key = v.venue || v.venueLabel || "Unknown"
      if (!grouped[key]) grouped[key] = { used: 0, total: 0 }
      grouped[key].used += v.used || 0
      grouped[key].total += v.total || 0
    })
    return Object.values(grouped).map(g => ({
      utilization: g.total > 0 ? Math.round((g.used / g.total) * 100) : 0,
    }))
  }, [venues])

  const maxUtilization = Math.max(...aggregated.map((v) => v.utilization), 0)
  const criticalCount = aggregated.filter((v) => v.utilization >= 90).length
  const warningCount = aggregated.filter((v) => v.utilization >= 75 && v.utilization < 90).length

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Margin:</span>
      <div className="flex items-center gap-1">
        {criticalCount > 0 && (
          <Badge variant="outline" className="text-[10px] border-[var(--status-error)] text-[var(--status-error)]">
            {criticalCount} critical
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge variant="outline" className="text-[10px] border-[var(--status-warning)] text-[var(--status-warning)]">
            {warningCount} warning
          </Badge>
        )}
        {criticalCount === 0 && warningCount === 0 && (
          <Badge variant="outline" className="text-[10px] border-[var(--status-live)] text-[var(--status-live)]">
            All healthy
          </Badge>
        )}
      </div>
      <span className="text-[10px] font-mono text-muted-foreground">
        (max {maxUtilization.toFixed(0)}%)
      </span>
    </div>
  )
}
