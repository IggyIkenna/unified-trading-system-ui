"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Database, 
  GitBranch,
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Box,
  ArrowRight,
  Eye,
  Code,
  FileText,
  BarChart3
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

// Feature catalog
const featureCatalog = [
  {
    id: "funding_rate_8h",
    name: "Funding Rate (8h)",
    description: "8-hour funding rate from perpetual exchanges",
    dataType: "float64",
    source: "features-cefi",
    updateFrequency: "8h",
    latency: "120ms",
    status: "healthy",
    usedByModels: 4,
    createdAt: "2025-06-15",
    version: "v2.1",
    owner: "data-eng",
    tags: ["funding", "perp", "cefi"],
    lineage: {
      rawSources: ["binance-ws", "okx-ws", "bybit-ws"],
      transformations: ["weighted_average", "normalization"],
      dependencies: ["exchange_weights", "funding_schedule"],
    },
    statistics: {
      mean: 0.00015,
      std: 0.00042,
      min: -0.0075,
      max: 0.0125,
      nullRate: 0.001,
      coverage: 99.9,
    },
  },
  {
    id: "oi_change_1h",
    name: "OI Change (1h)",
    description: "Open interest change over 1 hour window",
    dataType: "float64",
    source: "features-cefi",
    updateFrequency: "1m",
    latency: "850ms",
    status: "warning",
    usedByModels: 3,
    createdAt: "2025-08-20",
    version: "v1.3",
    owner: "data-eng",
    tags: ["oi", "derivatives", "flow"],
    lineage: {
      rawSources: ["binance-futures-api", "okx-futures-api"],
      transformations: ["rolling_diff", "pct_change"],
      dependencies: ["oi_raw", "timestamp_sync"],
    },
    statistics: {
      mean: 0.0023,
      std: 0.0156,
      min: -0.15,
      max: 0.18,
      nullRate: 0.002,
      coverage: 99.8,
    },
  },
  {
    id: "volume_imbalance",
    name: "Volume Imbalance",
    description: "Buy/sell volume imbalance ratio",
    dataType: "float64",
    source: "features-cefi",
    updateFrequency: "1m",
    latency: "95ms",
    status: "healthy",
    usedByModels: 5,
    createdAt: "2025-05-10",
    version: "v2.0",
    owner: "quant-team",
    tags: ["volume", "orderflow", "microstructure"],
    lineage: {
      rawSources: ["binance-trades-ws", "okx-trades-ws"],
      transformations: ["trade_classification", "rolling_sum", "ratio"],
      dependencies: ["trade_classifier_model"],
    },
    statistics: {
      mean: 0.02,
      std: 0.18,
      min: -0.85,
      max: 0.92,
      nullRate: 0.0,
      coverage: 100,
    },
  },
  {
    id: "basis_spread",
    name: "Basis Spread",
    description: "Spot to futures basis (annualized)",
    dataType: "float64",
    source: "features-cefi",
    updateFrequency: "1m",
    latency: "110ms",
    status: "healthy",
    usedByModels: 4,
    createdAt: "2025-04-01",
    version: "v2.2",
    owner: "quant-team",
    tags: ["basis", "arbitrage", "derivatives"],
    lineage: {
      rawSources: ["spot_mid_price", "perp_mid_price"],
      transformations: ["spread_calc", "annualization"],
      dependencies: ["days_to_funding"],
    },
    statistics: {
      mean: 0.082,
      std: 0.045,
      min: -0.05,
      max: 0.35,
      nullRate: 0.001,
      coverage: 99.9,
    },
  },
  {
    id: "liquidation_ratio",
    name: "Liquidation Ratio",
    description: "Long/short liquidation ratio (24h)",
    dataType: "float64",
    source: "features-cefi",
    updateFrequency: "5m",
    latency: "200ms",
    status: "healthy",
    usedByModels: 2,
    createdAt: "2025-09-01",
    version: "v1.1",
    owner: "data-eng",
    tags: ["liquidation", "sentiment", "risk"],
    lineage: {
      rawSources: ["coinglass-api", "binance-liquidations"],
      transformations: ["aggregation", "ratio_calc"],
      dependencies: [],
    },
    statistics: {
      mean: 1.05,
      std: 0.42,
      min: 0.15,
      max: 8.5,
      nullRate: 0.005,
      coverage: 99.5,
    },
  },
  {
    id: "whale_flow",
    name: "Whale Flow Score",
    description: "Net whale transfer direction indicator",
    dataType: "float64",
    source: "features-onchain",
    updateFrequency: "10m",
    latency: "5s",
    status: "healthy",
    usedByModels: 2,
    createdAt: "2025-10-15",
    version: "v1.0",
    owner: "onchain-team",
    tags: ["whale", "onchain", "flow"],
    lineage: {
      rawSources: ["ethereum-node", "bitcoin-node"],
      transformations: ["whale_classification", "flow_aggregation", "scoring"],
      dependencies: ["whale_address_list", "exchange_wallets"],
    },
    statistics: {
      mean: 0.0,
      std: 0.35,
      min: -1.0,
      max: 1.0,
      nullRate: 0.01,
      coverage: 99.0,
    },
  },
]

// Feature history data
const featureHistory = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2026, 2, i + 1).toISOString().split("T")[0],
  funding_rate_8h: 0.0001 + Math.random() * 0.0003,
  oi_change_1h: (Math.random() - 0.5) * 0.04,
  volume_imbalance: (Math.random() - 0.5) * 0.3,
  basis_spread: 0.06 + Math.random() * 0.04,
}))

// Model-feature usage matrix
const featureUsageMatrix = [
  { model: "Funding Rate Predictor", funding_rate_8h: true, oi_change_1h: true, volume_imbalance: true, basis_spread: true, liquidation_ratio: true, whale_flow: true },
  { model: "Volatility Forecaster", funding_rate_8h: true, oi_change_1h: true, volume_imbalance: true, basis_spread: false, liquidation_ratio: false, whale_flow: false },
  { model: "Liquidation Detector", funding_rate_8h: false, oi_change_1h: true, volume_imbalance: true, basis_spread: false, liquidation_ratio: true, whale_flow: true },
  { model: "Spread Predictor", funding_rate_8h: true, oi_change_1h: false, volume_imbalance: true, basis_spread: true, liquidation_ratio: false, whale_flow: false },
]

export default function FeatureProvenancePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)

  const filteredFeatures = featureCatalog.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesSource = sourceFilter === "all" || f.source === sourceFilter
    const matchesStatus = statusFilter === "all" || f.status === statusFilter
    return matchesSearch && matchesSource && matchesStatus
  })

  const selectedFeatureData = selectedFeature ? featureCatalog.find(f => f.id === selectedFeature) : null

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
                  <Database className="size-5" />
                  Feature Catalog & Provenance
                </h1>
                <p className="text-sm text-muted-foreground">Feature definitions, lineage, and usage tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Download className="size-4 mr-2" />
                Export Catalog
              </Button>
              <Button size="sm">
                <Zap className="size-4 mr-2" />
                Register Feature
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Box className="size-8 text-[#60a5fa]" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Features</p>
                  <p className="text-2xl font-bold">{featureCatalog.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-8 text-[var(--status-success)]" />
                <div>
                  <p className="text-sm text-muted-foreground">Healthy</p>
                  <p className="text-2xl font-bold">{featureCatalog.filter(f => f.status === "healthy").length}</p>
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
                  <p className="text-2xl font-bold">{featureCatalog.filter(f => f.status === "warning").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Layers className="size-8 text-[#a78bfa]" />
                <div>
                  <p className="text-sm text-muted-foreground">Data Sources</p>
                  <p className="text-2xl font-bold">{new Set(featureCatalog.map(f => f.source)).size}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Search features by name, id, or tag..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="features-cefi">CeFi Features</SelectItem>
                  <SelectItem value="features-onchain">On-Chain Features</SelectItem>
                  <SelectItem value="features-defi">DeFi Features</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-6">
          {/* Feature List */}
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Feature Catalog</CardTitle>
                <CardDescription>{filteredFeatures.length} features</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Update Freq</TableHead>
                      <TableHead>Latency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Used By</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFeatures.map(feature => (
                      <TableRow 
                        key={feature.id} 
                        className={`cursor-pointer ${selectedFeature === feature.id ? "bg-muted/50" : ""}`}
                        onClick={() => setSelectedFeature(feature.id)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{feature.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{feature.id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{feature.source}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{feature.updateFrequency}</TableCell>
                        <TableCell className={`font-mono text-sm ${parseInt(feature.latency) > 500 ? "text-[var(--status-warning)]" : ""}`}>
                          {feature.latency}
                        </TableCell>
                        <TableCell>
                          {feature.status === "healthy" ? (
                            <CheckCircle2 className="size-4 text-[var(--status-success)]" />
                          ) : (
                            <AlertTriangle className="size-4 text-[var(--status-warning)]" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">{feature.usedByModels} models</TableCell>
                        <TableCell>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Feature Detail Panel */}
          <div>
            {selectedFeatureData ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{selectedFeatureData.name}</CardTitle>
                    <Badge>{selectedFeatureData.version}</Badge>
                  </div>
                  <CardDescription>{selectedFeatureData.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Metadata */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Metadata</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Type</div>
                      <div className="font-mono">{selectedFeatureData.dataType}</div>
                      <div className="text-muted-foreground">Owner</div>
                      <div>{selectedFeatureData.owner}</div>
                      <div className="text-muted-foreground">Created</div>
                      <div>{selectedFeatureData.createdAt}</div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedFeatureData.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Lineage */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <GitBranch className="size-4" />
                      Data Lineage
                    </h4>
                    <div className="p-3 bg-muted/30 rounded-lg space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Raw Sources:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedFeatureData.lineage.rawSources.map(src => (
                            <Badge key={src} variant="outline" className="text-xs font-mono">{src}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Transformations:</span>
                        <div className="flex items-center gap-1 mt-1">
                          {selectedFeatureData.lineage.transformations.map((t, i) => (
                            <span key={t} className="flex items-center">
                              <Badge variant="secondary" className="text-xs">{t}</Badge>
                              {i < selectedFeatureData.lineage.transformations.length - 1 && (
                                <ArrowRight className="size-3 mx-1 text-muted-foreground" />
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="size-4" />
                      Statistics (30d)
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Mean</div>
                      <div className="font-mono">{selectedFeatureData.statistics.mean.toFixed(4)}</div>
                      <div className="text-muted-foreground">Std Dev</div>
                      <div className="font-mono">{selectedFeatureData.statistics.std.toFixed(4)}</div>
                      <div className="text-muted-foreground">Min / Max</div>
                      <div className="font-mono">{selectedFeatureData.statistics.min} / {selectedFeatureData.statistics.max}</div>
                      <div className="text-muted-foreground">Null Rate</div>
                      <div className="font-mono">{(selectedFeatureData.statistics.nullRate * 100).toFixed(2)}%</div>
                      <div className="text-muted-foreground">Coverage</div>
                      <div className="font-mono">{selectedFeatureData.statistics.coverage}%</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Code className="size-4 mr-2" />
                      View Code
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <FileText className="size-4 mr-2" />
                      Docs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Database className="size-12 mx-auto mb-4 opacity-30" />
                  <p>Select a feature to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Feature-Model Usage Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature-Model Usage Matrix</CardTitle>
            <CardDescription>Which models use which features</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  {featureCatalog.slice(0, 6).map(f => (
                    <TableHead key={f.id} className="text-center">
                      <span className="text-xs">{f.name.split(" ")[0]}</span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureUsageMatrix.map(row => (
                  <TableRow key={row.model}>
                    <TableCell className="font-medium">{row.model}</TableCell>
                    <TableCell className="text-center">{row.funding_rate_8h ? <CheckCircle2 className="size-4 text-[var(--status-success)] mx-auto" /> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-center">{row.oi_change_1h ? <CheckCircle2 className="size-4 text-[var(--status-success)] mx-auto" /> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-center">{row.volume_imbalance ? <CheckCircle2 className="size-4 text-[var(--status-success)] mx-auto" /> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-center">{row.basis_spread ? <CheckCircle2 className="size-4 text-[var(--status-success)] mx-auto" /> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-center">{row.liquidation_ratio ? <CheckCircle2 className="size-4 text-[var(--status-success)] mx-auto" /> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-center">{row.whale_flow ? <CheckCircle2 className="size-4 text-[var(--status-success)] mx-auto" /> : <span className="text-muted-foreground">—</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
