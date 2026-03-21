"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ContextBar } from "@/components/platform/context-bar"
import { BatchLiveRail } from "@/components/platform/batch-live-rail"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  GitCompare,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ShoppingBasket,
} from "lucide-react"
import {
  STRATEGY_CONFIGS,
  BACKTEST_RUNS,
} from "@/lib/strategy-platform-mock-data"
import { cn } from "@/lib/utils"

// Get backtest metrics for a config
function getConfigMetrics(configId: string) {
  const runs = BACKTEST_RUNS.filter(
    (r) => r.configId === configId && r.status === "completed" && r.metrics
  )
  if (runs.length === 0) return null
  
  // Average metrics across all completed runs
  const metrics = runs.reduce(
    (acc, r) => {
      if (!r.metrics) return acc
      return {
        sharpe: acc.sharpe + r.metrics.sharpe,
        return: acc.return + r.metrics.totalReturn,
        maxDrawdown: acc.maxDrawdown + r.metrics.maxDrawdown,
        hitRate: acc.hitRate + r.metrics.hitRate,
        sortino: acc.sortino + r.metrics.sortino,
        calmar: acc.calmar + r.metrics.calmar,
        turnover: acc.turnover + r.metrics.turnover,
        slippage: acc.slippage + r.metrics.avgSlippage,
        profitFactor: acc.profitFactor + r.metrics.profitFactor,
        alpha: acc.alpha + r.metrics.alpha,
      }
    },
    {
      sharpe: 0,
      return: 0,
      maxDrawdown: 0,
      hitRate: 0,
      sortino: 0,
      calmar: 0,
      turnover: 0,
      slippage: 0,
      profitFactor: 0,
      alpha: 0,
    }
  )

  const count = runs.length
  return {
    sharpe: metrics.sharpe / count,
    return: metrics.return / count,
    maxDrawdown: metrics.maxDrawdown / count,
    hitRate: metrics.hitRate / count,
    sortino: metrics.sortino / count,
    calmar: metrics.calmar / count,
    turnover: metrics.turnover / count,
    slippage: metrics.slippage / count,
    profitFactor: metrics.profitFactor / count,
    alpha: metrics.alpha / count,
    runCount: count,
  }
}

// Compare value with delta indicator
function CompareValue({
  value,
  baseValue,
  format = "number",
  higherIsBetter = true,
  isBase = false,
}: {
  value: number
  baseValue?: number
  format?: "number" | "percent" | "bps"
  higherIsBetter?: boolean
  isBase?: boolean
}) {
  let displayValue: string
  switch (format) {
    case "percent":
      displayValue = `${(value * 100).toFixed(1)}%`
      break
    case "bps":
      displayValue = `${(value * 10000).toFixed(1)} bps`
      break
    default:
      displayValue = value.toFixed(2)
  }

  if (isBase || baseValue === undefined) {
    return (
      <div className="text-right">
        <span className={cn("font-mono", isBase && "font-bold")}>
          {displayValue}
        </span>
        {isBase && (
          <Badge variant="outline" className="ml-2 text-[10px]">
            BASE
          </Badge>
        )}
      </div>
    )
  }

  const diff = value - baseValue
  const pctDiff = baseValue !== 0 ? (diff / Math.abs(baseValue)) * 100 : 0
  const isPositive = higherIsBetter ? diff > 0 : diff < 0
  const isNeutral = Math.abs(pctDiff) < 1

  return (
    <div className="text-right">
      <span className="font-mono">{displayValue}</span>
      <div className="flex items-center justify-end gap-1 mt-0.5">
        {isNeutral ? (
          <Minus className="size-3 text-muted-foreground" />
        ) : isPositive ? (
          <TrendingUp className="size-3 text-[var(--status-live)]" />
        ) : (
          <TrendingDown className="size-3 text-[var(--status-critical)]" />
        )}
        <span
          className={cn(
            "text-[10px] font-mono",
            isNeutral
              ? "text-muted-foreground"
              : isPositive
              ? "text-[var(--status-live)]"
              : "text-[var(--status-critical)]"
          )}
        >
          {pctDiff >= 0 ? "+" : ""}
          {pctDiff.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

// Parameter diff row
function ParamDiffRow({
  param,
  values,
  baseIndex,
}: {
  param: string
  values: (string | number | boolean)[]
  baseIndex: number
}) {
  const baseVal = values[baseIndex]
  const allSame = values.every((v) => v === baseVal)

  return (
    <div
      className={cn(
        "grid gap-4 py-2 border-b border-border/50 text-xs",
        !allSame && "bg-[var(--surface-strategy)]/5"
      )}
      style={{ gridTemplateColumns: `180px repeat(${values.length}, 1fr)` }}
    >
      <div className="font-medium text-muted-foreground capitalize">
        {param.replace(/_/g, " ")}
      </div>
      {values.map((val, i) => (
        <div
          key={i}
          className={cn(
            "text-right font-mono",
            i === baseIndex && "font-bold",
            !allSame && val !== baseVal && "text-[var(--surface-strategy)]"
          )}
        >
          {typeof val === "boolean" ? (val ? "true" : "false") : String(val)}
          {!allSame && val !== baseVal && (
            <Badge variant="outline" className="ml-1 text-[10px]">
              DIFF
            </Badge>
          )}
        </div>
      ))}
    </div>
  )
}

// Config selector card
function ConfigSelector({
  configId,
  onSelect,
  onRemove,
  isBase,
}: {
  configId: string | null
  onSelect: (id: string) => void
  onRemove?: () => void
  isBase?: boolean
}) {
  const config = configId ? STRATEGY_CONFIGS.find((c) => c.id === configId) : null
  const metrics = configId ? getConfigMetrics(configId) : null

  if (!config) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 flex flex-col items-center justify-center min-h-[120px]">
          <Select onValueChange={onSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select config to compare" />
            </SelectTrigger>
            <SelectContent>
              {STRATEGY_CONFIGS.map((cfg) => (
                <SelectItem key={cfg.id} value={cfg.id}>
                  <div className="flex items-center gap-2">
                    <span>{cfg.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      v{cfg.version}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(isBase && "border-[var(--surface-strategy)]")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {config.name}
              {isBase && (
                <Badge className="bg-[var(--surface-strategy)] text-white text-[10px]">
                  BASE
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px]">
                v{config.version}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {config.archetype.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={onRemove}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {metrics ? (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-muted-foreground">Sharpe</div>
              <div className="font-mono font-bold text-lg">{metrics.sharpe.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Return</div>
              <div
                className={cn(
                  "font-mono font-bold text-lg",
                  metrics.return >= 0 ? "text-[var(--status-live)]" : "text-[var(--status-critical)]"
                )}
              >
                {(metrics.return * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Max DD</div>
              <div className="font-mono">{(metrics.maxDrawdown * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Runs</div>
              <div className="font-mono">{metrics.runCount}</div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No backtest data</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function StrategyComparePage() {
  const [context, setContext] = React.useState<"BATCH" | "LIVE">("BATCH")
  const [selectedConfigs, setSelectedConfigs] = React.useState<(string | null)[]>([
    "cfg-eth-basis-v1",
    "cfg-eth-basis-v2",
    null,
  ])
  const [baseIndex, setBaseIndex] = React.useState(0)

  const addSlot = () => {
    if (selectedConfigs.length < 5) {
      setSelectedConfigs([...selectedConfigs, null])
    }
  }

  const removeSlot = (index: number) => {
    if (selectedConfigs.length > 2) {
      const newConfigs = selectedConfigs.filter((_, i) => i !== index)
      setSelectedConfigs(newConfigs)
      if (baseIndex >= newConfigs.length) {
        setBaseIndex(0)
      } else if (baseIndex > index) {
        setBaseIndex(baseIndex - 1)
      }
    }
  }

  const setConfig = (index: number, configId: string) => {
    const newConfigs = [...selectedConfigs]
    newConfigs[index] = configId
    setSelectedConfigs(newConfigs)
  }

  // Get configs and metrics
  const configs = selectedConfigs.map((id) =>
    id ? STRATEGY_CONFIGS.find((c) => c.id === id) : null
  )
  const metricsData = selectedConfigs.map((id) =>
    id ? getConfigMetrics(id) : null
  )
  const baseMetrics = metricsData[baseIndex]

  // Get all parameter keys
  const allParams = new Set<string>()
  configs.forEach((cfg) => {
    if (cfg?.parameters) {
      Object.keys(cfg.parameters).forEach((k) => allParams.add(k))
    }
  })

  return (
    <div className="flex flex-col flex-1">
      {/* Context Bar */}
      <ContextBar
        platform="strategy"
        scope={{ fund: "ODUM", client: "Internal" }}
        context={context}
        badges={[{ label: "Comparing", value: String(selectedConfigs.filter(Boolean).length) }]}
      />

      {/* Batch/Live Rail */}
      <BatchLiveRail
        platform="strategy"
        currentStage="Backtest"
        context={context}
        onContextChange={setContext}
      />

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 min-w-[800px]">
          {/* Config Selectors */}
          <div className="flex items-start gap-4">
            {selectedConfigs.map((configId, i) => (
              <div key={i} className="flex-1 max-w-[280px]">
                <div className="mb-2 flex items-center justify-between">
                  <Button
                    variant={baseIndex === i ? "default" : "ghost"}
                    size="sm"
                    className="text-xs h-6"
                    onClick={() => setBaseIndex(i)}
                    disabled={!configId}
                  >
                    {baseIndex === i ? "Base" : "Set as Base"}
                  </Button>
                </div>
                <ConfigSelector
                  configId={configId}
                  onSelect={(id) => setConfig(i, id)}
                  onRemove={selectedConfigs.length > 2 ? () => removeSlot(i) : undefined}
                  isBase={baseIndex === i}
                />
              </div>
            ))}
            {selectedConfigs.length < 5 && (
              <Button
                variant="outline"
                className="h-[180px] w-[180px] border-dashed"
                onClick={addSlot}
              >
                <Plus className="size-5" />
              </Button>
            )}
          </div>

          {/* Metrics Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `180px repeat(${selectedConfigs.length}, 1fr)`,
                }}
              >
                {/* Header */}
                <div className="font-medium text-xs text-muted-foreground">Metric</div>
                {configs.map((cfg, i) => (
                  <div key={i} className="text-right text-xs font-medium">
                    {cfg?.name || "—"}
                  </div>
                ))}

                {/* Sharpe */}
                <div className="text-xs text-muted-foreground border-t pt-3">Sharpe</div>
                {metricsData.map((m, i) => (
                  <div key={i} className="border-t pt-3">
                    {m ? (
                      <CompareValue
                        value={m.sharpe}
                        baseValue={baseMetrics?.sharpe}
                        isBase={i === baseIndex}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                ))}

                {/* Return */}
                <div className="text-xs text-muted-foreground">Return</div>
                {metricsData.map((m, i) => (
                  <div key={i}>
                    {m ? (
                      <CompareValue
                        value={m.return}
                        baseValue={baseMetrics?.return}
                        format="percent"
                        isBase={i === baseIndex}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                ))}

                {/* Max Drawdown */}
                <div className="text-xs text-muted-foreground">Max Drawdown</div>
                {metricsData.map((m, i) => (
                  <div key={i}>
                    {m ? (
                      <CompareValue
                        value={m.maxDrawdown}
                        baseValue={baseMetrics?.maxDrawdown}
                        format="percent"
                        higherIsBetter={false}
                        isBase={i === baseIndex}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                ))}

                {/* Sortino */}
                <div className="text-xs text-muted-foreground">Sortino</div>
                {metricsData.map((m, i) => (
                  <div key={i}>
                    {m ? (
                      <CompareValue
                        value={m.sortino}
                        baseValue={baseMetrics?.sortino}
                        isBase={i === baseIndex}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                ))}

                {/* Hit Rate */}
                <div className="text-xs text-muted-foreground">Hit Rate</div>
                {metricsData.map((m, i) => (
                  <div key={i}>
                    {m ? (
                      <CompareValue
                        value={m.hitRate}
                        baseValue={baseMetrics?.hitRate}
                        format="percent"
                        isBase={i === baseIndex}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                ))}

                {/* Turnover */}
                <div className="text-xs text-muted-foreground">Turnover</div>
                {metricsData.map((m, i) => (
                  <div key={i}>
                    {m ? (
                      <CompareValue
                        value={m.turnover}
                        baseValue={baseMetrics?.turnover}
                        higherIsBetter={false}
                        isBase={i === baseIndex}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                ))}

                {/* Slippage */}
                <div className="text-xs text-muted-foreground">Avg Slippage</div>
                {metricsData.map((m, i) => (
                  <div key={i}>
                    {m ? (
                      <CompareValue
                        value={m.slippage}
                        baseValue={baseMetrics?.slippage}
                        format="bps"
                        higherIsBetter={false}
                        isBase={i === baseIndex}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Parameter Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Parameter Diff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {/* Header */}
                <div
                  className="grid gap-4 py-2 border-b font-medium text-xs text-muted-foreground"
                  style={{
                    gridTemplateColumns: `180px repeat(${selectedConfigs.length}, 1fr)`,
                  }}
                >
                  <div>Parameter</div>
                  {configs.map((cfg, i) => (
                    <div key={i} className="text-right">
                      {cfg?.name || "—"}
                    </div>
                  ))}
                </div>

                {/* Params */}
                {Array.from(allParams).map((param) => (
                  <ParamDiffRow
                    key={param}
                    param={param}
                    values={configs.map((cfg) => cfg?.parameters?.[param] ?? "—")}
                    baseIndex={baseIndex}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Select configs to add to your candidate basket for promotion review.
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ShoppingBasket className="size-4" />
                    Add Selected to Basket
                  </Button>
                  <Button size="sm" className="gap-2">
                    Open Detailed Comparison
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
