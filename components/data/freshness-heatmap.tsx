"use client"

// FreshnessHeatmap — GitHub-contribution-style calendar for data availability
// Shows per-date completeness for a given shard/instrument
// Used in /services/data/overview (catalogue tab) and /admin/data (pipeline freshness tab)

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { DateFreshnessMap, FreshnessStatus, CloudProvider } from "@/lib/data-service-types"

// Colour mapping per status
const STATUS_COLORS: Record<FreshnessStatus, string> = {
  complete:     "bg-emerald-500/80 hover:bg-emerald-500",
  partial:      "bg-yellow-500/70 hover:bg-yellow-500",
  missing:      "bg-red-500/30 hover:bg-red-500/50",
  stale:        "bg-amber-500/60 hover:bg-amber-500",
  not_expected: "bg-muted/30",
}

const STATUS_LABELS: Record<FreshnessStatus, string> = {
  complete:     "Complete",
  partial:      "Partial",
  missing:      "Missing",
  stale:        "Stale (>24h)",
  not_expected: "Not expected",
}

interface FreshnessHeatmapProps {
  dateMap: DateFreshnessMap
  label: string
  cloud?: CloudProvider
  weeksToShow?: number // default 13 (3 months)
  className?: string
}

export function FreshnessHeatmap({
  dateMap,
  label,
  cloud = "gcp",
  weeksToShow = 13,
  className,
}: FreshnessHeatmapProps) {
  const [tooltip, setTooltip] = React.useState<{
    date: string
    status: FreshnessStatus
    x: number
    y: number
  } | null>(null)

  // Build grid: last N weeks, Mon–Sun
  const today = new Date()
  const gridDays: (string | null)[] = []

  // Start from Monday N weeks ago
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (weeksToShow * 7) + 1)
  // Align to Monday
  const dayOfWeek = startDate.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  startDate.setDate(startDate.getDate() + mondayOffset)

  for (let i = 0; i < weeksToShow * 7; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    if (d > today) {
      gridDays.push(null)
    } else {
      gridDays.push(d.toISOString().split("T")[0])
    }
  }

  // Group by weeks
  const weeks: (string | null)[][] = []
  for (let w = 0; w < weeksToShow; w++) {
    weeks.push(gridDays.slice(w * 7, w * 7 + 7))
  }

  // Summary stats
  const allDates = Object.keys(dateMap)
  const complete = allDates.filter(d => dateMap[d] === "complete").length
  const partial = allDates.filter(d => dateMap[d] === "partial").length
  const missing = allDates.filter(d => dateMap[d] === "missing").length
  const total = complete + partial + missing
  const completePct = total > 0 ? Math.round((complete / total) * 100) : 0

  const cloudLabel = cloud === "gcp" ? "GCP" : cloud === "aws" ? "AWS" : "Both"
  const cloudColor = cloud === "gcp" ? "text-blue-400" : cloud === "aws" ? "text-orange-400" : "text-sky-400"

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <Badge variant="outline" className={cn("text-[10px]", cloudColor)}>
            {cloudLabel}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="font-mono text-emerald-400">{completePct}%</span> complete
          </span>
          <span>{missing} missing</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="relative overflow-x-auto">
        <div className="flex gap-[3px]">
          {/* Day labels (Mon–Sun) */}
          <div className="flex flex-col gap-[3px] mr-1 mt-5">
            {["M", "", "W", "", "F", "", "S"].map((d, i) => (
              <div key={i} className="size-3 text-[8px] text-muted-foreground flex items-center justify-center">
                {d}
              </div>
            ))}
          </div>

          {/* Month labels + week columns */}
          <div className="flex flex-col gap-1">
            {/* Month labels row */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => {
                const firstDay = week.find(d => d !== null)
                const showMonth = firstDay && (wi === 0 || new Date(firstDay).getDate() <= 7)
                return (
                  <div key={wi} className="w-3 text-[8px] text-muted-foreground truncate">
                    {showMonth && firstDay
                      ? new Date(firstDay).toLocaleString("en", { month: "short" })
                      : ""}
                  </div>
                )
              })}
            </div>

            {/* Day cells */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((date, di) => {
                    if (!date) {
                      return <div key={di} className="size-3 rounded-sm bg-transparent" />
                    }
                    const status: FreshnessStatus = dateMap[date] ?? "not_expected"
                    return (
                      <div
                        key={di}
                        className={cn(
                          "size-3 rounded-sm cursor-pointer transition-colors",
                          STATUS_COLORS[status]
                        )}
                        onMouseEnter={e => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setTooltip({ date, status, x: rect.left, y: rect.top })
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        {(["complete", "partial", "missing", "stale"] as FreshnessStatus[]).map(s => (
          <span key={s} className="flex items-center gap-1">
            <span className={cn("size-2.5 rounded-sm", STATUS_COLORS[s])} />
            {STATUS_LABELS[s]}
          </span>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 rounded-md border bg-popover px-2 py-1.5 text-xs shadow-md pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          <div className="font-mono">{tooltip.date}</div>
          <div className={cn("mt-0.5", STATUS_COLORS[tooltip.status].includes("emerald") ? "text-emerald-400" : "text-muted-foreground")}>
            {STATUS_LABELS[tooltip.status]}
          </div>
        </div>
      )}
    </div>
  )
}
