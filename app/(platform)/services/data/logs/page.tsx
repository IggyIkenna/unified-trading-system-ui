"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { FileText, Search, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface PipelineRun {
  id: string
  pipeline: string
  service: string
  venue: string
  operation: string
  status: "success" | "failed" | "running" | "warning"
  startTime: string
  duration: string
  rowsProcessed: number
  errors: number
  dataType: string
}

const MOCK_RUNS: PipelineRun[] = [
  { id: "r1", pipeline: "market-tick-ingest", service: "market-tick-data-service", venue: "Binance", operation: "ingest", status: "success", startTime: "2026-03-22 12:00:00", duration: "2m 14s", rowsProcessed: 1240000, errors: 0, dataType: "ticks" },
  { id: "r2", pipeline: "candle-aggregation", service: "market-tick-data-service", venue: "Binance", operation: "aggregate", status: "success", startTime: "2026-03-22 12:02:15", duration: "45s", rowsProcessed: 42000, errors: 0, dataType: "candles" },
  { id: "r3", pipeline: "feature-computation", service: "features-onchain-service", venue: "ALL", operation: "compute", status: "running", startTime: "2026-03-22 12:03:00", duration: "—", rowsProcessed: 18500, errors: 0, dataType: "features" },
  { id: "r4", pipeline: "ml-signal-generation", service: "ml-inference-service", venue: "ALL", operation: "predict", status: "success", startTime: "2026-03-22 11:55:00", duration: "3m 22s", rowsProcessed: 50, errors: 0, dataType: "ml_signals" },
  { id: "r5", pipeline: "orderbook-snapshot", service: "market-tick-data-service", venue: "OKX", operation: "ingest", status: "failed", startTime: "2026-03-22 11:58:00", duration: "12s", rowsProcessed: 0, errors: 3, dataType: "orderbook" },
  { id: "r6", pipeline: "funding-rate-fetch", service: "market-tick-data-service", venue: "Hyperliquid", operation: "ingest", status: "success", startTime: "2026-03-22 12:00:00", duration: "8s", rowsProcessed: 25, errors: 0, dataType: "funding" },
  { id: "r7", pipeline: "strategy-signal-calc", service: "strategy-service", venue: "ALL", operation: "compute", status: "warning", startTime: "2026-03-22 11:50:00", duration: "5m 10s", rowsProcessed: 200, errors: 2, dataType: "strategy_signals" },
  { id: "r8", pipeline: "risk-metric-calc", service: "risk-monitoring-service", venue: "ALL", operation: "compute", status: "success", startTime: "2026-03-22 12:01:00", duration: "1m 5s", rowsProcessed: 500, errors: 0, dataType: "risk" },
  { id: "r9", pipeline: "pnl-attribution", service: "position-balance-monitor", venue: "ALL", operation: "compute", status: "success", startTime: "2026-03-22 12:00:30", duration: "30s", rowsProcessed: 50, errors: 0, dataType: "pnl" },
  { id: "r10", pipeline: "execution-fill-ingest", service: "execution-service", venue: "Deribit", operation: "ingest", status: "success", startTime: "2026-03-22 11:59:00", duration: "5s", rowsProcessed: 85, errors: 0, dataType: "execution" },
  { id: "r11", pipeline: "trade-ingest", service: "market-tick-data-service", venue: "Bybit", operation: "ingest", status: "failed", startTime: "2026-03-22 11:57:00", duration: "3s", rowsProcessed: 0, errors: 1, dataType: "trades" },
  { id: "r12", pipeline: "defi-lending-rates", service: "features-onchain-service", venue: "Aave V3", operation: "ingest", status: "success", startTime: "2026-03-22 12:00:00", duration: "15s", rowsProcessed: 12, errors: 0, dataType: "lending_rates" },
  { id: "r13", pipeline: "sports-odds-fetch", service: "instruments-service", venue: "Betfair", operation: "ingest", status: "success", startTime: "2026-03-22 11:55:00", duration: "4s", rowsProcessed: 350, errors: 0, dataType: "odds" },
  { id: "r14", pipeline: "candle-aggregation-1d", service: "market-tick-data-service", venue: "ALL", operation: "aggregate", status: "success", startTime: "2026-03-22 00:05:00", duration: "8m 30s", rowsProcessed: 2400, errors: 0, dataType: "candles_1d" },
]

export default function ETLLogsPage() {
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [dataTypeFilter, setDataTypeFilter] = React.useState("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  const filtered = React.useMemo(() => {
    let result = MOCK_RUNS
    if (statusFilter !== "all") result = result.filter(r => r.status === statusFilter)
    if (dataTypeFilter !== "all") result = result.filter(r => r.dataType === dataTypeFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(r => r.pipeline.includes(q) || r.venue.toLowerCase().includes(q) || r.service.includes(q))
    }
    return result
  }, [statusFilter, dataTypeFilter, searchQuery])

  const successCount = MOCK_RUNS.filter(r => r.status === "success").length
  const failedCount = MOCK_RUNS.filter(r => r.status === "failed").length
  const runningCount = MOCK_RUNS.filter(r => r.status === "running").length
  const totalRows = MOCK_RUNS.reduce((s, r) => s + r.rowsProcessed, 0)

  const dataTypes = [...new Set(MOCK_RUNS.map(r => r.dataType))].sort()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">ETL Pipeline Logs</h2>
          <p className="text-sm text-muted-foreground">All data pipeline runs across ingestion, processing, and derived computation</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5"><RefreshCw className="size-3.5" /> Refresh</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-semibold text-emerald-400">{successCount}</p><p className="text-xs text-muted-foreground">Succeeded</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-semibold text-rose-400">{failedCount}</p><p className="text-xs text-muted-foreground">Failed</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-semibold text-sky-400">{runningCount}</p><p className="text-xs text-muted-foreground">Running</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-semibold font-mono">{(totalRows / 1000000).toFixed(1)}M</p><p className="text-xs text-muted-foreground">Rows Processed</p></CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 px-2 text-xs rounded-md border border-border bg-background">
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="running">Running</option>
          <option value="warning">Warning</option>
        </select>
        <select value={dataTypeFilter} onChange={(e) => setDataTypeFilter(e.target.value)} className="h-8 px-2 text-xs rounded-md border border-border bg-background">
          <option value="all">All Data Types</option>
          {dataTypes.map(dt => <option key={dt} value={dt}>{dt}</option>)}
        </select>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input type="text" placeholder="Search pipelines..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 w-48 pl-8 pr-3 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Status</TableHead>
                <TableHead>Pipeline</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Data Type</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="text-right">Rows</TableHead>
                <TableHead className="text-right">Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id} className={cn("text-xs", r.status === "failed" && "bg-rose-500/5")}>
                  <TableCell>
                    {r.status === "success" ? <CheckCircle2 className="size-4 text-emerald-400" /> :
                     r.status === "failed" ? <XCircle className="size-4 text-rose-400" /> :
                     r.status === "running" ? <Clock className="size-4 text-sky-400 animate-pulse" /> :
                     <AlertTriangle className="size-4 text-amber-400" />}
                  </TableCell>
                  <TableCell className="font-mono font-medium">{r.pipeline}</TableCell>
                  <TableCell className="text-muted-foreground">{r.service}</TableCell>
                  <TableCell>{r.venue}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px]">{r.dataType}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{r.startTime.split(" ")[1]}</TableCell>
                  <TableCell className="text-right font-mono">{r.duration}</TableCell>
                  <TableCell className="text-right font-mono">{r.rowsProcessed.toLocaleString()}</TableCell>
                  <TableCell className={cn("text-right font-mono", r.errors > 0 && "text-rose-400")}>{r.errors}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
