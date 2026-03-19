"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { type PnLBreakdownData } from "@/lib/strategy-registry"
import { formatCurrency } from "@/lib/reference-data"

interface PnLWaterfallProps {
  data: PnLBreakdownData
  className?: string
  showLabels?: boolean
}

export function PnLWaterfall({ data, className, showLabels = true }: PnLWaterfallProps) {
  // Calculate bar positions for waterfall
  const maxAbsValue = Math.max(...data.components.map(c => Math.abs(c.value)), Math.abs(data.total))
  const scale = 100 / maxAbsValue
  
  let runningTotal = 0
  const bars = data.components.map(comp => {
    const startX = comp.value >= 0 ? runningTotal : runningTotal + comp.value
    const width = Math.abs(comp.value) * scale
    const bar = {
      ...comp,
      startX: startX * scale,
      width,
      runningTotal: runningTotal + comp.value,
    }
    runningTotal = bar.runningTotal
    return bar
  })
  
  return (
    <div className={cn("space-y-3", className)}>
      {bars.map((bar, idx) => (
        <div key={bar.componentId} className="flex items-center gap-3">
          {showLabels && (
            <div className="w-32 text-xs text-muted-foreground truncate">
              {bar.label}
            </div>
          )}
          <div className="flex-1 h-6 bg-muted/30 rounded relative overflow-hidden">
            {/* Zero line */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-border"
              style={{ left: "50%" }}
            />
            {/* Bar */}
            <div
              className={cn(
                "absolute top-1 bottom-1 rounded transition-all",
                bar.value >= 0 ? "bg-[var(--pnl-positive)]" : "bg-[var(--pnl-negative)]"
              )}
              style={{
                left: `${50 + (bar.value >= 0 ? 0 : bar.width / 2) - (bar.value < 0 ? bar.width : 0)}%`,
                width: `${bar.width / 2}%`,
              }}
            />
          </div>
          <div className={cn(
            "w-24 text-right text-sm font-mono tabular-nums",
            bar.value >= 0 ? "pnl-positive" : "pnl-negative"
          )}>
            {bar.value >= 0 ? "+" : ""}{formatCurrency(bar.value)}
          </div>
        </div>
      ))}
      
      {/* Realized/Unrealized/Residual Summary Row */}
      {'realized' in data && (
        <div className="flex items-center gap-3 pt-2 border-t border-border/50">
          {showLabels && <div className="w-32" />}
          <div className="flex-1 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--pnl-positive)]" />
              <span className="text-muted-foreground">Realized:</span>
              <span className={cn("font-mono tabular-nums", data.realized >= 0 ? "pnl-positive" : "pnl-negative")}>
                {data.realized >= 0 ? "+" : ""}{formatCurrency(data.realized)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Unrealized:</span>
              <span className={cn("font-mono tabular-nums", data.unrealized >= 0 ? "pnl-positive" : "pnl-negative")}>
                {data.unrealized >= 0 ? "+" : ""}{formatCurrency(data.unrealized)}
              </span>
            </div>
            {Math.abs(data.residual) > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
                <span className="text-muted-foreground">Residual:</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {data.residual >= 0 ? "+" : ""}{formatCurrency(data.residual)}
                </span>
              </div>
            )}
          </div>
          <div className="w-24" />
        </div>
      )}

      {/* Total row */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        {showLabels && (
          <div className="w-32 text-xs font-semibold">Total</div>
        )}
        <div className="flex-1 h-6 bg-muted/30 rounded relative overflow-hidden">
          <div 
            className="absolute top-0 bottom-0 w-px bg-border"
            style={{ left: "50%" }}
          />
          <div
            className={cn(
              "absolute top-1 bottom-1 rounded",
              data.total >= 0 ? "bg-[var(--pnl-positive)]" : "bg-[var(--pnl-negative)]"
            )}
            style={{
              left: data.total >= 0 ? "50%" : `${50 - (Math.abs(data.total) * scale / 2)}%`,
              width: `${Math.abs(data.total) * scale / 2}%`,
            }}
          />
        </div>
        <div className={cn(
          "w-24 text-right text-sm font-mono tabular-nums font-semibold",
          data.total >= 0 ? "pnl-positive" : "pnl-negative"
        )}>
          {data.total >= 0 ? "+" : ""}{formatCurrency(data.total)}
        </div>
      </div>
    </div>
  )
}

// Compact horizontal bar chart version
interface PnLBarChartProps {
  data: PnLBreakdownData
  className?: string
}

export function PnLBarChart({ data, className }: PnLBarChartProps) {
  const positiveTotal = data.components.filter(c => c.value > 0).reduce((sum, c) => sum + c.value, 0)
  const negativeTotal = Math.abs(data.components.filter(c => c.value < 0).reduce((sum, c) => sum + c.value, 0))
  const maxTotal = Math.max(positiveTotal, negativeTotal)
  
  return (
    <div className={cn("space-y-2", className)}>
      {data.components.map(comp => {
        const widthPct = (Math.abs(comp.value) / maxTotal) * 100
        return (
          <div key={comp.componentId} className="flex items-center gap-2">
            <div className="w-28 text-xs truncate" title={comp.label}>
              {comp.label}
            </div>
            <div className="flex-1 flex items-center gap-1">
              <div 
                className="h-4 rounded-sm transition-all"
                style={{ 
                  width: `${Math.min(widthPct, 100)}%`,
                  backgroundColor: comp.color,
                  opacity: 0.8,
                }}
              />
              <span className={cn(
                "text-xs font-mono tabular-nums",
                comp.value >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"
              )}>
                {comp.value >= 0 ? "+" : ""}{formatCurrency(comp.value)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Pie/Donut chart representation
interface PnLDonutProps {
  data: PnLBreakdownData
  size?: number
  className?: string
}

export function PnLDonut({ data, size = 120, className }: PnLDonutProps) {
  const positiveComponents = data.components.filter(c => c.value > 0)
  const negativeComponents = data.components.filter(c => c.value < 0)
  
  const positiveTotal = positiveComponents.reduce((sum, c) => sum + c.value, 0)
  const negativeTotal = Math.abs(negativeComponents.reduce((sum, c) => sum + c.value, 0))
  
  const radius = size / 2 - 10
  const circumference = 2 * Math.PI * radius
  const strokeWidth = 16
  
  let positiveOffset = 0
  let negativeOffset = 0
  
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        
        {/* Positive segments (top half) */}
        {positiveComponents.map(comp => {
          const pct = comp.value / positiveTotal
          const dashArray = `${pct * circumference * 0.5} ${circumference}`
          const rotation = -90 + (positiveOffset * 180)
          positiveOffset += pct
          
          return (
            <circle
              key={comp.componentId}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={comp.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeLinecap="round"
              transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
            />
          )
        })}
        
        {/* Negative segments (bottom half) */}
        {negativeComponents.map(comp => {
          const pct = Math.abs(comp.value) / negativeTotal
          const dashArray = `${pct * circumference * 0.5} ${circumference}`
          const rotation = 90 + (negativeOffset * 180)
          negativeOffset += pct
          
          return (
            <circle
              key={comp.componentId}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={comp.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeLinecap="round"
              transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
              opacity={0.7}
            />
          )
        })}
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn(
          "text-lg font-bold font-mono",
          data.total >= 0 ? "pnl-positive" : "pnl-negative"
        )}>
          {data.total >= 0 ? "+" : ""}{formatCurrency(data.total)}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase">Total</span>
      </div>
    </div>
  )
}
