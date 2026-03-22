"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Wallet,
  RefreshCw,
  Loader2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/reference-data"
import { useBalances } from "@/hooks/api/use-positions"
import { MarginUtilization, type VenueMargin } from "@/components/trading/margin-utilization"

// Balance record from the API
interface BalanceRecord {
  venue: string
  free: number
  locked: number
  total: number
  margin_used?: number
  margin_available?: number
  margin_total?: number
}

export default function AccountsPage() {
  const { data: balancesRaw, isLoading, error, refetch } = useBalances()

  // Coerce API response to typed array
  const balances: BalanceRecord[] = React.useMemo(() => {
    if (!balancesRaw) return []
    const raw = balancesRaw as Record<string, unknown>
    const arr = Array.isArray(raw) ? raw : (raw as Record<string, unknown>).balances
    return Array.isArray(arr) ? (arr as BalanceRecord[]) : []
  }, [balancesRaw])

  // Compute NAV and aggregate stats
  const totalNAV = React.useMemo(() =>
    balances.reduce((sum, b) => sum + b.total, 0),
    [balances]
  )

  const totalFree = React.useMemo(() =>
    balances.reduce((sum, b) => sum + b.free, 0),
    [balances]
  )

  const totalLocked = React.useMemo(() =>
    balances.reduce((sum, b) => sum + b.locked, 0),
    [balances]
  )

  // Transform balances into VenueMargin for the MarginUtilization component
  const venueMargins: VenueMargin[] = React.useMemo(() =>
    balances.map(b => {
      const marginUsed = b.margin_used ?? b.locked
      const marginTotal = b.margin_total ?? b.total
      const marginAvailable = b.margin_available ?? b.free
      const utilization = marginTotal > 0 ? (marginUsed / marginTotal) * 100 : 0
      return {
        venue: b.venue.toLowerCase().replace(/\s+/g, "-"),
        venueLabel: b.venue,
        used: marginUsed,
        available: marginAvailable,
        total: marginTotal,
        utilization,
        trend: utilization > 75 ? "up" as const : utilization > 50 ? "stable" as const : "down" as const,
        marginCallDistance: utilization < 90 ? 90 - utilization : undefined,
        lastUpdate: new Date().toLocaleTimeString(),
      }
    }),
    [balances]
  )

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span>Loading accounts...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <AlertCircle className="size-8 text-destructive" />
        <p>Failed to load account data</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="size-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <main className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="size-5 text-violet-400" />
          <h1 className="text-xl font-semibold">Accounts</h1>
          <Badge variant="outline" className="text-xs font-mono">{balances.length} venues</Badge>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()}>
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      {/* NAV Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total NAV</span>
            </div>
            <div className="text-3xl font-semibold font-mono">${formatCurrency(totalNAV)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="size-4 text-[var(--pnl-positive)]" />
              <span className="text-xs text-muted-foreground">Available (Free)</span>
            </div>
            <div className="text-3xl font-semibold font-mono text-[var(--pnl-positive)]">
              ${formatCurrency(totalFree)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Locked (In Use)</span>
            </div>
            <div className="text-3xl font-semibold font-mono">${formatCurrency(totalLocked)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Margin Utilization Component */}
      {venueMargins.length > 0 && (
        <MarginUtilization venues={venueMargins} />
      )}

      {/* Per-Venue Balance Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Per-Venue Balances</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {balances.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No balance data available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Venue</TableHead>
                  <TableHead className="text-right">Free</TableHead>
                  <TableHead className="text-right">Locked</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Margin Used</TableHead>
                  <TableHead className="text-right">Margin Available</TableHead>
                  <TableHead className="text-right">Utilization</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.map((b) => {
                  const marginUsed = b.margin_used ?? b.locked
                  const marginTotal = b.margin_total ?? b.total
                  const utilization = marginTotal > 0 ? (marginUsed / marginTotal) * 100 : 0
                  return (
                    <TableRow key={b.venue}>
                      <TableCell className="font-medium">{b.venue}</TableCell>
                      <TableCell className="text-right font-mono">${formatCurrency(b.free)}</TableCell>
                      <TableCell className="text-right font-mono">${formatCurrency(b.locked)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">${formatCurrency(b.total)}</TableCell>
                      <TableCell className="text-right font-mono">${formatCurrency(marginUsed)}</TableCell>
                      <TableCell className="text-right font-mono">${formatCurrency(b.margin_available ?? b.free)}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-xs",
                            utilization >= 90
                              ? "border-[var(--status-error)] text-[var(--status-error)]"
                              : utilization >= 75
                              ? "border-[var(--status-warning)] text-[var(--status-warning)]"
                              : "border-[var(--status-live)] text-[var(--status-live)]"
                          )}
                        >
                          {utilization.toFixed(0)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
