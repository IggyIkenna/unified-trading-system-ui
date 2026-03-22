"use client"

import * as React from "react"
import { DimensionalGrid, type DimensionDef, type MetricDef } from "@/components/trading/dimensional-grid"
import { PromoteFlowModal } from "@/components/trading/promote-flow-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Rocket, Download, Grid3X3 } from "lucide-react"
import { useStrategyPerformance } from "@/hooks/api/use-strategies"

// Default backtest result data
const DEFAULT_BACKTEST_RESULTS = [
  {
    id: "exp-221",
    experiment: "exp-221",
    strategy: "BTC Basis v3",
    config: "3.3.0-rc1",
    venue: "Bin/Bybit",
    shard: "2025Q4",
    sharpe: 2.1,
    pnl: 1800000,
    maxDrawdown: 4.1,
    trades: 847,
    winRate: 58.2,
    alphaNet: 12.4,
  },
  {
    id: "exp-301",
    experiment: "exp-301",
    strategy: "ETH Staked",
    config: "2.5.0",
    venue: "Aave/HL",
    shard: "2026Q1",
    sharpe: 2.5,
    pnl: 2400000,
    maxDrawdown: 5.0,
    trades: 412,
    winRate: 62.1,
    alphaNet: 18.2,
  },
  {
    id: "exp-222",
    experiment: "exp-222",
    strategy: "BTC Basis v3",
    config: "3.3.0-rc2",
    venue: "Bin/OKX",
    shard: "2026Q1",
    sharpe: 1.7,
    pnl: 1100000,
    maxDrawdown: 3.3,
    trades: 923,
    winRate: 55.8,
    alphaNet: 8.9,
  },
  {
    id: "exp-305",
    experiment: "exp-305",
    strategy: "AAVE Lending",
    config: "1.2.0",
    venue: "Aave v3",
    shard: "2025Q4",
    sharpe: 1.8,
    pnl: 910000,
    maxDrawdown: 2.1,
    trades: 156,
    winRate: 71.2,
    alphaNet: 6.5,
  },
  {
    id: "exp-410",
    experiment: "exp-410",
    strategy: "ML Directional",
    config: "0.8.0-beta",
    venue: "Bin/OKX",
    shard: "2026Q1",
    sharpe: 0.9,
    pnl: -180000,
    maxDrawdown: 6.8,
    trades: 2341,
    winRate: 48.2,
    alphaNet: -2.1,
  },
  {
    id: "exp-412",
    experiment: "exp-412",
    strategy: "ML Directional",
    config: "0.9.0-beta",
    venue: "Bin/Bybit",
    shard: "2026Q1",
    sharpe: 1.2,
    pnl: 340000,
    maxDrawdown: 5.2,
    trades: 1892,
    winRate: 51.4,
    alphaNet: 3.8,
  },
  {
    id: "exp-500",
    experiment: "exp-500",
    strategy: "SPY Momentum",
    config: "2.0.0",
    venue: "IBKR",
    shard: "2025Q4",
    sharpe: 1.4,
    pnl: 670000,
    maxDrawdown: 3.9,
    trades: 324,
    winRate: 54.6,
    alphaNet: 5.2,
  },
  {
    id: "exp-601",
    experiment: "exp-601",
    strategy: "Sports Arb",
    config: "1.5.0",
    venue: "Pinnacle",
    shard: "2026Q1",
    sharpe: 1.6,
    pnl: 440000,
    maxDrawdown: 1.8,
    trades: 1245,
    winRate: 67.8,
    alphaNet: 4.1,
  },
]

const METRICS: MetricDef[] = [
  { key: "sharpe", label: "Sharpe", format: "decimal", colorize: true },
  { key: "pnl", label: "P&L", format: "currency", colorize: true },
  { key: "maxDrawdown", label: "Max DD %", format: "percent" },
  { key: "trades", label: "Trades", format: "number" },
  { key: "winRate", label: "Win Rate", format: "percent" },
  { key: "alphaNet", label: "Alpha (bps)", format: "decimal", colorize: true },
]

export default function StrategyGridPage() {
  const { data: perfData, isLoading } = useStrategyPerformance()
  const perfRaw: any[] = (perfData as any)?.data ?? (perfData as any)?.backtests ?? []
  const mockBacktestResults = perfRaw.length > 0 ? perfRaw : DEFAULT_BACKTEST_RESULTS

  const dimensions: DimensionDef[] = React.useMemo(() => [
    { key: "strategy", label: "Strategy", values: [...new Set(mockBacktestResults.map((r: any) => r.strategy))] },
    { key: "venue", label: "Venue", values: [...new Set(mockBacktestResults.map((r: any) => r.venue))] },
    { key: "shard", label: "Shard", values: [...new Set(mockBacktestResults.map((r: any) => r.shard))] },
    { key: "config", label: "Config", values: [...new Set(mockBacktestResults.map((r: any) => r.config))] },
  ], [mockBacktestResults])

  const metrics = METRICS

  const [pinnedDimensions, setPinnedDimensions] = React.useState<
    Record<string, string[]>
  >({})
  const [promoteModalOpen, setPromoteModalOpen] = React.useState(false)
  const [selectedForPromotion, setSelectedForPromotion] = React.useState<string[]>([])

  const handleDimensionPin = (dimension: string, values: string[]) => {
    setPinnedDimensions((prev) => ({
      ...prev,
      [dimension]: values,
    }))
  }

  const handlePromote = (selectedIds: string[]) => {
    setSelectedForPromotion(selectedIds)
    setPromoteModalOpen(true)
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  return (
    <div className="p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">DimensionalGrid</h1>
            <p className="text-sm text-muted-foreground">
              Compare backtest results across strategies, venues, and time periods
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Grid3X3 className="size-4" />
              Heatmap View
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="size-4" />
              Export All
            </Button>
          </div>
        </div>

        {/* Grid */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Backtest Results — {mockBacktestResults.length} configs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DimensionalGrid
              data={mockBacktestResults}
              dimensions={dimensions}
              metrics={metrics}
              pinnedDimensions={pinnedDimensions}
              onDimensionPin={handleDimensionPin}
              enableSelection
              enableHeatmap
              enableExport
              rowKey="id"
              selectionToolbar={(selectedIds) => (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => handlePromote(selectedIds)}
                  >
                    <Rocket className="size-4" />
                    Promote to Live
                  </Button>
                  <Button variant="outline" size="sm">
                    Promote to Batch
                  </Button>
                  <Button variant="outline" size="sm">
                    Compare Selected
                  </Button>
                </div>
              )}
              onRowClick={(id) => {
                console.log("View experiment:", id)
              }}
            />
          </CardContent>
        </Card>

        {/* Promotion Flow Info */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-4">
            <div className="flex items-start gap-4">
              <Rocket className="size-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Promotion Flow</p>
                <p className="text-xs text-muted-foreground">
                  Select the best-performing configs, then click "Promote to Live" to
                  generate a cross-link to Operations Hub. The deploy form will be
                  pre-filled with your selected configurations for review.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Promote Flow Modal */}
        {selectedForPromotion.length > 0 && (
          <PromoteFlowModal
            strategyId={selectedForPromotion[0]}
            strategyName={mockBacktestResults.find(r => r.id === selectedForPromotion[0])?.strategy || "Selected Strategies"}
            currentStage="STAGING"
            onPromote={async () => {
              // In real implementation: call API to promote
              console.log("Promoting:", selectedForPromotion)
              setPromoteModalOpen(false)
              setSelectedForPromotion([])
            }}
            trigger={<></>}
          />
        )}
      </div>
    </div>
  )
}
