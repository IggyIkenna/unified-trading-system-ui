"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCorrelationMatrix } from "@/hooks/api/use-risk"

function correlationColor(value: number): string {
  if (value < 0) {
    const intensity = Math.abs(value)
    const r = Math.round(255 * (1 - intensity))
    const g = Math.round(255 * (1 - intensity))
    return `rgb(${r}, ${g}, 255)`
  }
  const intensity = value
  const g = Math.round(255 * (1 - intensity))
  const b = Math.round(255 * (1 - intensity))
  return `rgb(255, ${g}, ${b})`
}

export function CorrelationHeatmap() {
  const { data: correlationData, isLoading } = useCorrelationMatrix()
  const [hoveredCell, setHoveredCell] = React.useState<{ row: number; col: number } | null>(null)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <LineChart className="size-4 text-blue-400" />
          Strategy Correlation Heatmap
        </CardTitle>
        <CardDescription>
          NxN correlation matrix across strategies. Blue = negative, White = zero, Red = positive.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : correlationData && correlationData.labels.length > 0 ? (
          <div className="overflow-x-auto">
            <div
              className="inline-grid gap-px bg-border"
              style={{
                gridTemplateColumns: `120px repeat(${correlationData.labels.length}, minmax(48px, 1fr))`,
              }}
            >
              {/* Header row */}
              <div className="bg-card p-2 text-xs font-medium text-muted-foreground" />
              {correlationData.labels.map((label) => (
                <div key={`header-${label}`} className="bg-card p-2 text-xs font-medium text-center truncate">
                  {label}
                </div>
              ))}

              {/* Data rows */}
              {correlationData.matrix.map((row, rowIdx) => (
                <React.Fragment key={`row-${correlationData.labels[rowIdx]}`}>
                  <div className="bg-card p-2 text-xs font-medium truncate">
                    {correlationData.labels[rowIdx]}
                  </div>
                  {row.map((value, colIdx) => {
                    const isHovered =
                      hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx
                    return (
                      <div
                        key={`cell-${rowIdx}-${colIdx}`}
                        className={cn(
                          "p-2 text-center text-xs font-mono cursor-default transition-opacity relative",
                          isHovered && "ring-2 ring-primary z-10",
                        )}
                        style={{ backgroundColor: correlationColor(value) }}
                        onMouseEnter={() => setHoveredCell({ row: rowIdx, col: colIdx })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {isHovered && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border rounded px-2 py-1 text-xs font-mono whitespace-nowrap z-20 shadow-lg">
                            {correlationData.labels[rowIdx]} / {correlationData.labels[colIdx]}: {value.toFixed(3)}
                          </div>
                        )}
                        <span className={cn(
                          "text-[10px]",
                          Math.abs(value) > 0.5 ? "text-white" : "text-foreground",
                        )}>
                          {value.toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: correlationColor(-1) }} />
                <span>-1.0</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: correlationColor(0) }} />
                <span>0.0</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: correlationColor(1) }} />
                <span>+1.0</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            No correlation data available
          </p>
        )}
      </CardContent>
    </Card>
  )
}
