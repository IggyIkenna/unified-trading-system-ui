"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MOCK_INSTRUMENTS, MOCK_VENUE_COVERAGE } from "@/lib/data-service-mock-data"

type DataType = "tick" | "candle_1m" | "candle_5m" | "candle_1h" | "candle_1d" | "orderbook" | "trades" | "funding" | "features" | "ml_signals" | "strategy_signals" | "execution" | "risk" | "pnl"

const DATA_TYPES: { key: DataType; label: string; category: "raw" | "processed" | "derived" }[] = [
  { key: "tick", label: "Ticks", category: "raw" },
  { key: "trades", label: "Trades", category: "raw" },
  { key: "orderbook", label: "Book", category: "raw" },
  { key: "funding", label: "Funding", category: "raw" },
  { key: "candle_1m", label: "1m", category: "processed" },
  { key: "candle_5m", label: "5m", category: "processed" },
  { key: "candle_1h", label: "1h", category: "processed" },
  { key: "candle_1d", label: "1d", category: "processed" },
  { key: "features", label: "Features", category: "derived" },
  { key: "ml_signals", label: "ML Signals", category: "derived" },
  { key: "strategy_signals", label: "Strategy", category: "derived" },
  { key: "execution", label: "Execution", category: "derived" },
  { key: "risk", label: "Risk", category: "derived" },
  { key: "pnl", label: "P&L", category: "derived" },
]

function getCoverage(seed: string): { pct: number; status: "complete" | "partial" | "missing" } {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  const r = ((h >>> 0) / 4294967296)
  const pct = Math.min(100, Math.round(r * 40 + 60))
  return { pct, status: pct >= 95 ? "complete" : pct >= 70 ? "partial" : "missing" }
}

export default function CoverageMatrixPage() {
  const [dataCategory, setDataCategory] = React.useState<"all" | "raw" | "processed" | "derived">("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [venueFilter, setVenueFilter] = React.useState("all")

  const venues = [...new Set(MOCK_INSTRUMENTS.map(i => i.venue))].sort()
  const types = DATA_TYPES.filter(dt => dataCategory === "all" || dt.category === dataCategory)

  const instruments = React.useMemo(() => {
    let result = MOCK_INSTRUMENTS
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(i => i.instrumentKey.toLowerCase().includes(q) || i.symbol.toLowerCase().includes(q) || i.venue.toLowerCase().includes(q))
    }
    if (venueFilter !== "all") result = result.filter(i => i.venue === venueFilter)
    return result
  }, [searchQuery, venueFilter])

  const totalCells = instruments.length * types.length
  const stats = React.useMemo(() => {
    let complete = 0, partial = 0
    instruments.forEach(inst => types.forEach(dt => {
      const s = getCoverage(`${inst.instrumentKey}-${dt.key}`).status
      if (s === "complete") complete++; else if (s === "partial") partial++
    }))
    return { complete, partial, missing: totalCells - complete - partial }
  }, [instruments, types, totalCells])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Coverage Matrix</h2>
          <p className="text-sm text-muted-foreground">{instruments.length} instruments × {types.length} data types</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5"><RefreshCw className="size-3.5" /> Refresh</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-semibold text-emerald-400">{stats.complete}</p><p className="text-xs text-muted-foreground">Complete ({Math.round(stats.complete / Math.max(totalCells, 1) * 100)}%)</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-semibold text-amber-400">{stats.partial}</p><p className="text-xs text-muted-foreground">Partial</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-semibold text-rose-400">{stats.missing}</p><p className="text-xs text-muted-foreground">Missing</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-semibold">{instruments.length}</p><p className="text-xs text-muted-foreground">Instruments</p></CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Tabs value={dataCategory} onValueChange={(v) => setDataCategory(v as typeof dataCategory)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="raw">Raw (Ticks, Trades, Book)</TabsTrigger>
            <TabsTrigger value="processed">Processed (Candles)</TabsTrigger>
            <TabsTrigger value="derived">Derived (Features, Signals, Risk, P&L)</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 w-40 pl-8 pr-3 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <select value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)} className="h-8 px-2 text-xs rounded-md border border-border bg-background">
            <option value="all">All Venues</option>
            {venues.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="sticky left-0 bg-card z-10 min-w-[180px]">Instrument</TableHead>
                <TableHead className="sticky left-[180px] bg-card z-10">Venue</TableHead>
                {types.map(dt => (
                  <TableHead key={dt.key} className="text-center min-w-[60px]">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px]">{dt.label}</span>
                      <span className={cn("text-[8px]", dt.category === "raw" ? "text-sky-400" : dt.category === "processed" ? "text-violet-400" : "text-amber-400")}>{dt.category}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {instruments.slice(0, 30).map((inst) => (
                <TableRow key={inst.instrumentKey} className="text-xs">
                  <TableCell className="sticky left-0 bg-card z-10 font-mono font-medium text-[11px]">{inst.symbol}</TableCell>
                  <TableCell className="sticky left-[180px] bg-card z-10 text-muted-foreground text-[11px]">{inst.venue}</TableCell>
                  {types.map(dt => {
                    const cov = getCoverage(`${inst.instrumentKey}-${dt.key}`)
                    return (
                      <TableCell key={dt.key} className="text-center p-1">
                        <div className={cn("size-6 rounded flex items-center justify-center mx-auto text-[9px] font-mono",
                          cov.status === "complete" ? "bg-emerald-500/20 text-emerald-400" :
                          cov.status === "partial" ? "bg-amber-500/20 text-amber-400" :
                          "bg-rose-500/20 text-rose-400"
                        )}>
                          {cov.pct}
                        </div>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {instruments.length > 30 && <div className="p-3 text-center text-xs text-muted-foreground border-t">Showing 30 of {instruments.length}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Coverage by Venue</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_VENUE_COVERAGE.map(vc => (
              <div key={vc.venue} className="flex items-center gap-4">
                <span className="text-sm font-medium w-28">{vc.venue}</span>
                <Progress value={85} className="flex-1 h-2" />
                <span className="text-xs font-mono w-12 text-right">{85}%</span>
                <Badge variant="outline" className="text-[10px]">{vc.instrumentCount} inst</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
