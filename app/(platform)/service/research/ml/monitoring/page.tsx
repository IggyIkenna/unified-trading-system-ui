"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Activity, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Cpu,
  Zap,
  Database,
  BarChart3,
  RefreshCw,
  Bell,
  Settings,
  Eye,
  Filter,
  ChevronRight,
  Target,
  Layers
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts"

// Live model metrics (simulated real-time data)
const generateLiveMetrics = () => {
  const now = new Date()
  return Array.from({ length: 60 }, (_, i) => {
    const time = new Date(now.getTime() - (59 - i) * 60000)
    return {
      time: time.toTimeString().slice(0, 5),
      latency: 25 + Math.random() * 15 + (Math.random() > 0.95 ? 50 : 0),
      throughput: 1800 + Math.random() * 400,
      errorRate: Math.random() * 0.02 + (Math.random() > 0.98 ? 0.05 : 0),
      predictionAccuracy: 0.84 + Math.random() * 0.04,
      featureDrift: Math.random() * 0.08,
      gpuUtil: 60 + Math.random() * 20,
    }
  })
}

// Active models
const activeModels = [
  {
    id: "funding-pred-v2.3.1",
    name: "Funding Rate Predictor",
    version: "2.3.1",
    stage: "CHAMPION",
    status: "healthy",
    uptime: "99.97%",
    predictions24h: 1247832,
    avgLatency: "28ms",
    errorRate: "0.02%",
    accuracy: "84.7%",
    drift: "low",
    alerts: 0,
  },
  {
    id: "vol-forecast-v1.8.2",
    name: "Volatility Forecaster",
    version: "1.8.2",
    stage: "CHAMPION",
    status: "healthy",
    uptime: "99.99%",
    predictions24h: 892341,
    avgLatency: "45ms",
    errorRate: "0.01%",
    accuracy: "81.2%",
    drift: "low",
    alerts: 0,
  },
  {
    id: "liq-detect-v3.0.1",
    name: "Liquidation Detector",
    version: "3.0.1",
    stage: "CHAMPION",
    status: "warning",
    uptime: "99.85%",
    predictions24h: 456123,
    avgLatency: "18ms",
    errorRate: "0.08%",
    accuracy: "92.1%",
    drift: "medium",
    alerts: 2,
  },
  {
    id: "spread-pred-v2.0.0",
    name: "Spread Predictor",
    version: "2.0.0",
    stage: "CHAMPION",
    status: "healthy",
    uptime: "99.92%",
    predictions24h: 2341567,
    avgLatency: "12ms",
    errorRate: "0.03%",
    accuracy: "78.4%",
    drift: "low",
    alerts: 0,
  },
  {
    id: "funding-pred-v2.4.0-rc1",
    name: "Funding Rate Predictor",
    version: "2.4.0-rc1",
    stage: "SHADOW",
    status: "healthy",
    uptime: "100%",
    predictions24h: 124783,
    avgLatency: "32ms",
    errorRate: "0.01%",
    accuracy: "86.2%",
    drift: "low",
    alerts: 0,
  },
]

// Recent alerts
const recentAlerts = [
  { id: 1, model: "liq-detect-v3.0.1", type: "drift", severity: "warning", message: "Feature drift detected on oi_change_1h (PSI: 0.12)", time: "5 min ago", acknowledged: false },
  { id: 2, model: "liq-detect-v3.0.1", type: "accuracy", severity: "warning", message: "Rolling accuracy dropped below 90% threshold", time: "12 min ago", acknowledged: false },
  { id: 3, model: "vol-forecast-v1.8.2", type: "latency", severity: "info", message: "P99 latency spike to 95ms (recovered)", time: "1 hour ago", acknowledged: true },
  { id: 4, model: "funding-pred-v2.3.1", type: "throughput", severity: "info", message: "Request rate exceeded 3000/s during funding window", time: "4 hours ago", acknowledged: true },
]

// Feature health
const featureHealth = [
  { feature: "funding_rate_8h", status: "healthy", freshness: "120ms", drift: 0.02, coverage: 100 },
  { feature: "oi_change_1h", status: "warning", freshness: "850ms", drift: 0.12, coverage: 99.8 },
  { feature: "volume_imbalance", status: "healthy", freshness: "95ms", drift: 0.03, coverage: 100 },
  { feature: "basis_spread", status: "healthy", freshness: "110ms", drift: 0.01, coverage: 100 },
  { feature: "liquidation_ratio", status: "healthy", freshness: "200ms", drift: 0.04, coverage: 99.9 },
  { feature: "spot_perp_spread", status: "healthy", freshness: "85ms", drift: 0.02, coverage: 100 },
]

export default function LiveMonitoringPage() {
  const [liveMetrics, setLiveMetrics] = useState(generateLiveMetrics())
  const [selectedModel, setSelectedModel] = useState("all")
  const [timeRange, setTimeRange] = useState("1h")

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMetrics(prev => {
        const newPoint = {
          time: new Date().toTimeString().slice(0, 5),
          latency: 25 + Math.random() * 15,
          throughput: 1800 + Math.random() * 400,
          errorRate: Math.random() * 0.02,
          predictionAccuracy: 0.84 + Math.random() * 0.04,
          featureDrift: Math.random() * 0.08,
          gpuUtil: 60 + Math.random() * 20,
        }
        return [...prev.slice(1), newPoint]
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const healthyModels = activeModels.filter(m => m.status === "healthy").length
  const warningModels = activeModels.filter(m => m.status === "warning").length
  const totalPredictions = activeModels.reduce((sum, m) => sum + m.predictions24h, 0)
  const unacknowledgedAlerts = recentAlerts.filter(a => !a.acknowledged).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/service/research/ml/overview">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="size-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <Activity className="size-5" />
                  Live Model Monitoring
                </h1>
                <p className="text-sm text-muted-foreground">Real-time performance, drift detection, and alerts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {activeModels.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name} v{m.version}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="6h">6 Hours</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Settings className="size-4 mr-2" />
                Alert Settings
              </Button>
              <Button variant="outline" size="sm" className="relative">
                <Bell className="size-4" />
                {unacknowledgedAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 size-4 bg-[var(--status-error)] rounded-full text-[10px] flex items-center justify-center text-white">
                    {unacknowledgedAlerts}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Health Summary */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-8 text-[var(--status-success)]" />
                <div>
                  <p className="text-sm text-muted-foreground">Healthy Models</p>
                  <p className="text-2xl font-bold">{healthyModels}/{activeModels.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="size-8 text-[var(--status-warning)]" />
                <div>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                  <p className="text-2xl font-bold">{warningModels}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Zap className="size-8 text-[#60a5fa]" />
                <div>
                  <p className="text-sm text-muted-foreground">Predictions (24h)</p>
                  <p className="text-2xl font-bold">{(totalPredictions / 1000000).toFixed(1)}M</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="size-8 text-[#a78bfa]" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Latency</p>
                  <p className="text-2xl font-bold">26ms</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="size-8 text-[#4ade80]" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                  <p className="text-2xl font-bold">84.5%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts Banner */}
        {unacknowledgedAlerts > 0 && (
          <Card className="border-[var(--status-warning)]/50 bg-[var(--status-warning)]/10">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="size-6 text-[var(--status-warning)]" />
                  <div>
                    <p className="font-semibold">{unacknowledgedAlerts} Active Alert{unacknowledgedAlerts > 1 ? "s" : ""}</p>
                    <p className="text-sm text-muted-foreground">
                      {recentAlerts.filter(a => !a.acknowledged)[0]?.message}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">View All</Button>
                  <Button size="sm">Acknowledge</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Real-time Charts */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="size-4" />
                Inference Latency (p50/p99)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={liveMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))" 
                      }}
                    />
                    <ReferenceLine y={50} stroke="var(--status-warning)" strokeDasharray="5 5" label="SLA" />
                    <Area 
                      type="monotone" 
                      dataKey="latency" 
                      stroke="#60a5fa" 
                      fill="#60a5fa"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="size-4" />
                Error Rate & Throughput
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={liveMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} domain={[0, 0.1]} tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[0, 3000]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))" 
                      }}
                    />
                    <Legend />
                    <ReferenceLine yAxisId="left" y={0.05} stroke="var(--status-error)" strokeDasharray="5 5" />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="errorRate" 
                      stroke="var(--status-error)" 
                      dot={false}
                      name="Error Rate"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="throughput" 
                      stroke="var(--status-success)" 
                      dot={false}
                      name="Throughput (req/s)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Model Status Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Models</CardTitle>
            <CardDescription>Real-time status of all deployed models</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Uptime</TableHead>
                  <TableHead className="text-right">Predictions (24h)</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                  <TableHead className="text-right">Error Rate</TableHead>
                  <TableHead className="text-right">Accuracy</TableHead>
                  <TableHead>Drift</TableHead>
                  <TableHead>Alerts</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeModels.map(model => (
                  <TableRow key={model.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{model.name}</p>
                        <p className="text-xs text-muted-foreground">v{model.version}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={model.stage === "CHAMPION" ? "default" : "outline"}>
                        {model.stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {model.status === "healthy" ? (
                          <CheckCircle2 className="size-4 text-[var(--status-success)]" />
                        ) : (
                          <AlertTriangle className="size-4 text-[var(--status-warning)]" />
                        )}
                        <span className="capitalize">{model.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{model.uptime}</TableCell>
                    <TableCell className="text-right font-mono">{model.predictions24h.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">{model.avgLatency}</TableCell>
                    <TableCell className="text-right font-mono">{model.errorRate}</TableCell>
                    <TableCell className="text-right font-mono">{model.accuracy}</TableCell>
                    <TableCell>
                      <Badge variant={model.drift === "low" ? "secondary" : "outline"} className={model.drift === "medium" ? "border-[var(--status-warning)] text-[var(--status-warning)]" : ""}>
                        {model.drift}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {model.alerts > 0 ? (
                        <Badge className="bg-[var(--status-warning)] text-black">{model.alerts}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Feature Health & Alerts */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="size-4" />
                Feature Health
              </CardTitle>
              <CardDescription>Real-time feature pipeline status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Freshness</TableHead>
                    <TableHead className="text-right">Drift (PSI)</TableHead>
                    <TableHead className="text-right">Coverage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featureHealth.map(f => (
                    <TableRow key={f.feature}>
                      <TableCell className="font-mono text-sm">{f.feature}</TableCell>
                      <TableCell>
                        {f.status === "healthy" ? (
                          <CheckCircle2 className="size-4 text-[var(--status-success)]" />
                        ) : (
                          <AlertTriangle className="size-4 text-[var(--status-warning)]" />
                        )}
                      </TableCell>
                      <TableCell className={`text-right font-mono ${f.freshness > "500ms" ? "text-[var(--status-warning)]" : ""}`}>
                        {f.freshness}
                      </TableCell>
                      <TableCell className={`text-right font-mono ${f.drift > 0.1 ? "text-[var(--status-warning)]" : ""}`}>
                        {f.drift.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">{f.coverage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="size-4" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAlerts.map(alert => (
                  <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg ${
                    alert.acknowledged ? "bg-muted/30" : alert.severity === "warning" ? "bg-[var(--status-warning)]/10" : "bg-muted/50"
                  }`}>
                    {alert.severity === "warning" ? (
                      <AlertTriangle className="size-4 text-[var(--status-warning)] mt-0.5" />
                    ) : (
                      <Activity className="size-4 text-muted-foreground mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{alert.model}</span>
                        <span className="text-xs text-muted-foreground">{alert.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                    {!alert.acknowledged && (
                      <Button variant="ghost" size="sm" className="text-xs">
                        Ack
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
