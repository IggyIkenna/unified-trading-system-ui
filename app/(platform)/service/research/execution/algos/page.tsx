"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { ExecutionNav } from "@/components/execution-platform/execution-nav"
import { MOCK_EXECUTION_ALGOS, MOCK_ALGO_BACKTESTS } from "@/lib/execution-platform-mock-data"
import { 
  Cpu, 
  GitCompare,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  CheckCircle2
} from "lucide-react"

export default function ExecutionAlgosPage() {
  const [selectedAlgos, setSelectedAlgos] = React.useState<string[]>([])
  const [compareMode, setCompareMode] = React.useState(false)
  
  const toggleAlgo = (id: string) => {
    setSelectedAlgos(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }
  
  const selectedAlgoData = MOCK_EXECUTION_ALGOS.filter(a => selectedAlgos.includes(a.id))

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-[1800px] mx-auto px-6 py-3">
          <ExecutionNav />
        </div>
      </div>
      
      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
              <Cpu className="size-6" />
              Algo Comparison
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Compare execution algorithms across performance metrics and market conditions
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedAlgos.length >= 2 && (
              <Button onClick={() => setCompareMode(!compareMode)}>
                <GitCompare className="size-4 mr-2" />
                {compareMode ? "Exit Compare" : `Compare (${selectedAlgos.length})`}
              </Button>
            )}
          </div>
        </div>

        {/* Comparison View */}
        {compareMode && selectedAlgoData.length >= 2 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Side-by-Side Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Metric</th>
                      {selectedAlgoData.map(algo => (
                        <th key={algo.id} className="text-center p-2 font-medium min-w-[140px]">
                          <div>{algo.name}</div>
                          <Badge variant="outline" className="text-xs mt-1">{algo.type}</Badge>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 text-muted-foreground">Avg Slippage (bps)</td>
                      {selectedAlgoData.map(algo => {
                        const best = Math.min(...selectedAlgoData.map(a => a.metrics.avgSlippage))
                        const isBest = algo.metrics.avgSlippage === best
                        return (
                          <td key={algo.id} className={cn("text-center p-2 font-mono", isBest && "text-emerald-500 font-bold")}>
                            {algo.metrics.avgSlippage.toFixed(2)}
                          </td>
                        )
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 text-muted-foreground">Fill Rate (%)</td>
                      {selectedAlgoData.map(algo => {
                        const best = Math.max(...selectedAlgoData.map(a => a.metrics.avgFillRate))
                        const isBest = algo.metrics.avgFillRate === best
                        return (
                          <td key={algo.id} className={cn("text-center p-2 font-mono", isBest && "text-emerald-500 font-bold")}>
                            {algo.metrics.avgFillRate.toFixed(1)}%
                          </td>
                        )
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 text-muted-foreground">Latency (ms)</td>
                      {selectedAlgoData.map(algo => {
                        const best = Math.min(...selectedAlgoData.map(a => a.metrics.avgLatency))
                        const isBest = algo.metrics.avgLatency === best
                        return (
                          <td key={algo.id} className={cn("text-center p-2 font-mono", isBest && "text-emerald-500 font-bold")}>
                            {algo.metrics.avgLatency}
                          </td>
                        )
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 text-muted-foreground">Cost vs Benchmark (bps)</td>
                      {selectedAlgoData.map(algo => {
                        const best = Math.min(...selectedAlgoData.map(a => a.metrics.costVsBenchmark))
                        const isBest = algo.metrics.costVsBenchmark === best
                        return (
                          <td key={algo.id} className={cn("text-center p-2 font-mono", isBest && "text-emerald-500 font-bold")}>
                            {algo.metrics.costVsBenchmark >= 0 ? "+" : ""}{algo.metrics.costVsBenchmark.toFixed(2)}
                          </td>
                        )
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 text-muted-foreground">Aggressiveness</td>
                      {selectedAlgoData.map(algo => (
                        <td key={algo.id} className="text-center p-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary rounded-full h-2" 
                              style={{ width: `${algo.params.aggressiveness * 100}%` }}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-2 text-muted-foreground">Supported Venues</td>
                      {selectedAlgoData.map(algo => (
                        <td key={algo.id} className="text-center p-2">
                          {algo.supportedVenues.length}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Algo Grid */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Execution Algorithms</CardTitle>
            <CardDescription>Select algorithms to compare their performance characteristics</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox 
                      checked={selectedAlgos.length === MOCK_EXECUTION_ALGOS.length}
                      onCheckedChange={(checked) => {
                        setSelectedAlgos(checked ? MOCK_EXECUTION_ALGOS.map(a => a.id) : [])
                      }}
                    />
                  </TableHead>
                  <TableHead>Algorithm</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead className="text-right">Slippage</TableHead>
                  <TableHead className="text-right">Fill Rate</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                  <TableHead className="text-right">Cost vs VWAP</TableHead>
                  <TableHead>Venues</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_EXECUTION_ALGOS.map(algo => (
                  <TableRow key={algo.id} className={cn(selectedAlgos.includes(algo.id) && "bg-muted/50")}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedAlgos.includes(algo.id)}
                        onCheckedChange={() => toggleAlgo(algo.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{algo.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{algo.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{algo.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">{algo.version}</TableCell>
                    <TableCell className="text-right font-mono">{algo.metrics.avgSlippage.toFixed(2)} bps</TableCell>
                    <TableCell className="text-right font-mono">{algo.metrics.avgFillRate.toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-mono">{algo.metrics.avgLatency}ms</TableCell>
                    <TableCell className={cn(
                      "text-right font-mono",
                      algo.metrics.costVsBenchmark < 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {algo.metrics.costVsBenchmark >= 0 ? "+" : ""}{algo.metrics.costVsBenchmark.toFixed(2)}
                    </TableCell>
                    <TableCell>{algo.supportedVenues.length}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={cn(
                          algo.status === "live" && "bg-emerald-500/10 text-emerald-500",
                          algo.status === "testing" && "bg-amber-500/10 text-amber-500"
                        )}
                      >
                        {algo.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Backtest Results */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Backtests</CardTitle>
            <CardDescription>Historical performance analysis across market conditions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {MOCK_ALGO_BACKTESTS.map(bt => {
                const algo = MOCK_EXECUTION_ALGOS.find(a => a.id === bt.algoId)
                return (
                  <div key={bt.id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-medium">{algo?.name || bt.algoId}</div>
                        <div className="text-xs text-muted-foreground">v{bt.algoVersion}</div>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500">
                        {bt.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-2 rounded bg-muted/50">
                        <div className="text-xs text-muted-foreground">Avg Slippage</div>
                        <div className="font-mono font-medium">{bt.metrics.avgSlippage.toFixed(2)} bps</div>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <div className="text-xs text-muted-foreground">Fill Rate</div>
                        <div className="font-mono font-medium">{bt.metrics.avgFillRate.toFixed(1)}%</div>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <div className="text-xs text-muted-foreground">vs VWAP</div>
                        <div className={cn(
                          "font-mono font-medium",
                          bt.metrics.costVsVWAP < 0 ? "text-emerald-500" : "text-red-500"
                        )}>
                          {bt.metrics.costVsVWAP >= 0 ? "+" : ""}{bt.metrics.costVsVWAP.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {bt.testPeriod.numOrders.toLocaleString()} orders • {bt.instruments.join(", ")}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
