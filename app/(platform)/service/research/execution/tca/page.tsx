"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { ExecutionNav } from "@/components/execution-platform/execution-nav"
import { MOCK_RECENT_ORDERS } from "@/lib/execution-platform-mock-data"
import { 
  LineChart as LineChartIcon, 
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Target,
  DollarSign
} from "lucide-react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from "recharts"

// Mock TCA breakdown data
const TCA_BREAKDOWN = [
  { name: "Spread Cost", value: 2.4, color: "#3b82f6" },
  { name: "Market Impact", value: 1.8, color: "#8b5cf6" },
  { name: "Timing Cost", value: 0.9, color: "#f59e0b" },
  { name: "Fees", value: 1.2, color: "#6b7280" },
]

// Mock execution timeline
const EXECUTION_TIMELINE = Array.from({ length: 20 }, (_, i) => ({
  time: i * 3,
  price: 3244 + Math.random() * 4 - 2,
  vwap: 3245.8 - i * 0.02,
  twap: 3245.4 - i * 0.015,
  fill: i < 15 ? (i + 1) * 6.67 : 100
}))

// Mock slippage distribution
const SLIPPAGE_DISTRIBUTION = [
  { range: "< -2", count: 12, color: "#22c55e" },
  { range: "-2 to -1", count: 28, color: "#4ade80" },
  { range: "-1 to 0", count: 45, color: "#86efac" },
  { range: "0 to 1", count: 52, color: "#fcd34d" },
  { range: "1 to 2", count: 35, color: "#fb923c" },
  { range: "> 2", count: 18, color: "#ef4444" },
]

export default function ExecutionTCAPage() {
  const [selectedOrder, setSelectedOrder] = React.useState(MOCK_RECENT_ORDERS[0])
  const [timeRange, setTimeRange] = React.useState("1d")

  const totalCost = TCA_BREAKDOWN.reduce((sum, item) => sum + item.value, 0)

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
              <LineChartIcon className="size-6" />
              TCA Explorer
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Transaction Cost Analysis - understand and optimize execution costs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1 Day</SelectItem>
                <SelectItem value="1w">1 Week</SelectItem>
                <SelectItem value="1m">1 Month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">Export Report</Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono">{totalCost.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Total Cost (bps)</div>
                </div>
                <DollarSign className="size-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono text-red-500">+{selectedOrder.tca.slippage.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Slippage (bps)</div>
                </div>
                <TrendingDown className="size-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono">{selectedOrder.tca.marketImpact.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Market Impact (bps)</div>
                </div>
                <BarChart3 className="size-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono">{selectedOrder.tca.timingCost.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Timing Cost (bps)</div>
                </div>
                <Clock className="size-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono">${selectedOrder.tca.arrivalPrice.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Arrival Price</div>
                </div>
                <Target className="size-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Execution Timeline */}
          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Execution Timeline</CardTitle>
              <CardDescription>Price evolution vs benchmarks during execution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={EXECUTION_TIMELINE}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${v}s`}
                    />
                    <YAxis 
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                      name="Exec Price"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="vwap" 
                      stroke="#8b5cf6" 
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      dot={false}
                      name="VWAP"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="twap" 
                      stroke="#f59e0b" 
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      dot={false}
                      name="TWAP"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cost Breakdown</CardTitle>
              <CardDescription>Transaction cost components</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {TCA_BREAKDOWN.map(item => (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.name}</span>
                      <span className="font-mono">{item.value.toFixed(1)} bps</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${(item.value / totalCost) * 100}%`,
                          backgroundColor: item.color
                        }} 
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t flex justify-between font-medium">
                  <span>Total</span>
                  <span className="font-mono">{totalCost.toFixed(1)} bps</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benchmark Comparison */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Benchmark Comparison</CardTitle>
            <CardDescription>Performance vs standard execution benchmarks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border">
                <div className="text-sm text-muted-foreground mb-1">vs Arrival Price</div>
                <div className={cn(
                  "text-2xl font-bold font-mono",
                  selectedOrder.avgPrice > selectedOrder.tca.arrivalPrice ? "text-red-500" : "text-emerald-500"
                )}>
                  {selectedOrder.avgPrice > selectedOrder.tca.arrivalPrice ? "+" : ""}
                  {((selectedOrder.avgPrice - selectedOrder.tca.arrivalPrice) / selectedOrder.tca.arrivalPrice * 10000).toFixed(1)} bps
                </div>
              </div>
              <div className="p-4 rounded-lg border">
                <div className="text-sm text-muted-foreground mb-1">vs VWAP</div>
                <div className={cn(
                  "text-2xl font-bold font-mono",
                  selectedOrder.avgPrice > selectedOrder.tca.vwap ? "text-red-500" : "text-emerald-500"
                )}>
                  {selectedOrder.avgPrice > selectedOrder.tca.vwap ? "+" : ""}
                  {((selectedOrder.avgPrice - selectedOrder.tca.vwap) / selectedOrder.tca.vwap * 10000).toFixed(1)} bps
                </div>
              </div>
              <div className="p-4 rounded-lg border">
                <div className="text-sm text-muted-foreground mb-1">vs TWAP</div>
                <div className={cn(
                  "text-2xl font-bold font-mono",
                  selectedOrder.avgPrice > selectedOrder.tca.twap ? "text-red-500" : "text-emerald-500"
                )}>
                  {selectedOrder.avgPrice > selectedOrder.tca.twap ? "+" : ""}
                  {((selectedOrder.avgPrice - selectedOrder.tca.twap) / selectedOrder.tca.twap * 10000).toFixed(1)} bps
                </div>
              </div>
              <div className="p-4 rounded-lg border">
                <div className="text-sm text-muted-foreground mb-1">Implementation Shortfall</div>
                <div className="text-2xl font-bold font-mono text-red-500">
                  +{selectedOrder.tca.totalCost.toFixed(1)} bps
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Slippage Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Slippage Distribution</CardTitle>
            <CardDescription>Historical slippage across all executions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SLIPPAGE_DISTRIBUTION}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {SLIPPAGE_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <CardDescription>Select an order to view detailed TCA</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Algo</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="text-right">Avg Price</TableHead>
                  <TableHead className="text-right">Slippage</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_RECENT_ORDERS.map(order => (
                  <TableRow 
                    key={order.id} 
                    className={cn(
                      "cursor-pointer",
                      selectedOrder.id === order.id && "bg-muted/50"
                    )}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {order.side === "BUY" ? (
                          <ArrowUpRight className="size-4 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="size-4 text-red-500" />
                        )}
                        <span className="font-medium">{order.instrument}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{order.algo}</Badge></TableCell>
                    <TableCell className="capitalize">{order.venue}</TableCell>
                    <TableCell className="text-right font-mono">${order.filledQty.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">${order.avgPrice.toLocaleString()}</TableCell>
                    <TableCell className={cn(
                      "text-right font-mono",
                      order.tca.slippage < 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {order.tca.slippage >= 0 ? "+" : ""}{order.tca.slippage.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right font-mono">{order.tca.totalCost.toFixed(1)} bps</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">Analyze</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
