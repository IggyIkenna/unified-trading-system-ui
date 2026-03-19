"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react"

// Time range presets
export const TIME_RANGES = [
  { id: "1d", label: "1D", days: 1 },
  { id: "1w", label: "1W", days: 7 },
  { id: "1m", label: "1M", days: 30 },
  { id: "3m", label: "3M", days: 90 },
  { id: "ytd", label: "YTD", days: -1 }, // Special handling
  { id: "1y", label: "1Y", days: 365 },
] as const

export type TimeRange = (typeof TIME_RANGES)[number]["id"]

// Granularity options
export const GRANULARITIES = [
  { id: "1m", label: "1 min" },
  { id: "5m", label: "5 min" },
  { id: "15m", label: "15 min" },
  { id: "1h", label: "1 hour" },
  { id: "4h", label: "4 hour" },
  { id: "1d", label: "1 day" },
] as const

export type Granularity = (typeof GRANULARITIES)[number]["id"]

export interface TimeSeriesDataPoint {
  timestamp: string
  value: number
  label?: string
}

export interface TimeSeriesSeries {
  id: string
  name: string
  data: TimeSeriesDataPoint[]
  color: string
  type?: "line" | "area"
}

interface TimeSeriesPanelProps {
  title: string
  series: TimeSeriesSeries[]
  selectedRange: TimeRange
  onRangeChange: (range: TimeRange) => void
  granularity?: Granularity
  onGranularityChange?: (granularity: Granularity) => void
  showGranularity?: boolean
  valueFormatter?: (value: number) => string
  showLegend?: boolean
  height?: number
  className?: string
  // For navigation between dates
  currentDate?: string
  onDateChange?: (date: string) => void
  showDateNavigation?: boolean
}

export function TimeSeriesPanel({
  title,
  series,
  selectedRange,
  onRangeChange,
  granularity = "1h",
  onGranularityChange,
  showGranularity = false,
  valueFormatter = (v) => v.toLocaleString(),
  showLegend = true,
  height = 300,
  className,
  currentDate,
  onDateChange,
  showDateNavigation = false,
}: TimeSeriesPanelProps) {
  // Calculate change from first to last point
  const primarySeries = series[0]
  const firstValue = primarySeries?.data[0]?.value ?? 0
  const lastValue = primarySeries?.data[primarySeries.data.length - 1]?.value ?? 0
  const change = lastValue - firstValue
  const changePercent = firstValue !== 0 ? (change / firstValue) * 100 : 0

  // Combine all series data for the chart
  const chartData = primarySeries?.data.map((point, idx) => {
    const combined: Record<string, string | number> = { timestamp: point.timestamp }
    series.forEach((s) => {
      combined[s.id] = s.data[idx]?.value ?? 0
    })
    return combined
  }) ?? []

  const navigateDate = (direction: "prev" | "next") => {
    if (!currentDate || !onDateChange) return
    const date = new Date(currentDate)
    date.setDate(date.getDate() + (direction === "next" ? 1 : -1))
    onDateChange(date.toISOString().split("T")[0])
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-base">{title}</CardTitle>
            {showLegend && series.length > 1 && (
              <div className="flex items-center gap-3">
                {series.map((s) => (
                  <div key={s.id} className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-xs text-muted-foreground">{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Date Navigation */}
            {showDateNavigation && currentDate && (
              <div className="flex items-center gap-1 mr-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => navigateDate("prev")}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="flex items-center gap-1.5 px-2 py-1 border border-border rounded-md">
                  <Calendar className="size-3 text-muted-foreground" />
                  <span className="text-xs font-mono">{currentDate}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => navigateDate("next")}
                  disabled={currentDate === new Date().toISOString().split("T")[0]}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}

            {/* Granularity Selector */}
            {showGranularity && onGranularityChange && (
              <Select value={granularity} onValueChange={onGranularityChange}>
                <SelectTrigger className="w-20 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRANULARITIES.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Time Range Selector */}
            <div className="flex items-center border border-border rounded-md overflow-hidden">
              {TIME_RANGES.map((range) => (
                <button
                  key={range.id}
                  onClick={() => onRangeChange(range.id)}
                  className={cn(
                    "px-2 py-1 text-xs transition-colors",
                    selectedRange === range.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <Button variant="ghost" size="icon" className="size-7">
              <Maximize2 className="size-4" />
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-4 mt-2">
          <div>
            <span className="text-2xl font-semibold">{valueFormatter(lastValue)}</span>
          </div>
          <div className="flex items-center gap-1">
            {change >= 0 ? (
              <TrendingUp className="size-4" style={{ color: "var(--pnl-positive)" }} />
            ) : (
              <TrendingDown className="size-4" style={{ color: "var(--pnl-negative)" }} />
            )}
            <span
              className={cn(
                "text-sm font-medium",
                change >= 0 ? "pnl-positive" : "pnl-negative"
              )}
            >
              {change >= 0 ? "+" : ""}
              {valueFormatter(change)} ({changePercent >= 0 ? "+" : ""}
              {changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.id} id={`gradient-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={valueFormatter}
              width={70}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => [valueFormatter(value), name]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
            {series.map((s) =>
              s.type === "line" ? (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={s.id}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                />
              ) : (
                <Area
                  key={s.id}
                  type="monotone"
                  dataKey={s.id}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#gradient-${s.id})`}
                />
              )
            )}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Helper to generate mock time series data with realistic movement
export function generateTimeSeriesData(
  range: TimeRange,
  granularity: Granularity,
  baseValue: number,
  volatility: number = 0.02
): TimeSeriesDataPoint[] {
  const now = new Date()
  const points: TimeSeriesDataPoint[] = []
  
  // Determine number of points based on range and granularity
  let numPoints: number
  switch (range) {
    case "1d": numPoints = granularity === "1m" ? 480 : granularity === "5m" ? 96 : 24; break
    case "1w": numPoints = 168; break
    case "1m": numPoints = 30; break
    case "3m": numPoints = 90; break
    case "ytd": numPoints = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (24 * 60 * 60 * 1000)); break
    case "1y": numPoints = 365; break
    default: numPoints = 24
  }

  // Use higher volatility for more visible movement
  const effectiveVol = volatility * 2.5
  const pointVol = effectiveVol / Math.sqrt(numPoints)
  const drift = baseValue * 0.0003 // Small positive drift per point
  
  let value = baseValue * (0.95 + Math.random() * 0.1) // Start near but not exactly at base
  
  for (let i = 0; i < numPoints; i++) {
    // Add realistic intraday patterns for 1d view
    const hourOfDay = (i * 24 / numPoints) % 24
    const volatilityMultiplier = (hourOfDay >= 9 && hourOfDay <= 16) ? 1.5 : 0.8
    
    // Mean reversion component
    const meanReversionForce = (baseValue - value) * 0.05
    
    // Random walk with drift and mean reversion
    const change = drift + meanReversionForce + (Math.random() - 0.48) * baseValue * pointVol * volatilityMultiplier
    value = Math.max(baseValue * 0.7, value + change) // Floor at 70% of base
    
    const timestamp = new Date(now.getTime() - (numPoints - i) * getGranularityMs(granularity, range))
    points.push({
      timestamp: formatTimestamp(timestamp, range),
      value,
    })
  }

  return points
}

function getGranularityMs(granularity: Granularity, range: TimeRange): number {
  if (range === "1d") {
    switch (granularity) {
      case "1m": return 60 * 1000
      case "5m": return 5 * 60 * 1000
      case "15m": return 15 * 60 * 1000
      case "1h": return 60 * 60 * 1000
      default: return 60 * 60 * 1000
    }
  }
  // For longer ranges, use daily
  return 24 * 60 * 60 * 1000
}

function formatTimestamp(date: Date, range: TimeRange): string {
  if (range === "1d") {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
