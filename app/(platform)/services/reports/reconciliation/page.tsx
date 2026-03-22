"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { Skeleton } from "@/components/ui/skeleton"
import { DriftAnalysisPanel } from "@/components/trading/drift-analysis-panel"
import { useReconciliation } from "@/hooks/api/use-reports"
import { ExportDropdown } from "@/components/ui/export-dropdown"
import {
  AlertTriangle,
  Scale,
  DollarSign,
  Receipt,
  RefreshCw,
  TrendingDown,
  PackageX,
  CheckCircle2,
  XCircle,
  Search,
  ArrowRight,
  PenLine,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BreakType = "position" | "pnl" | "fee"
type ReconciliationStatus = "resolved" | "pending" | "investigating" | "rejected"

interface ReconciliationRecord {
  id: string
  date: string
  venue: string
  breakType: BreakType
  liveValue: number
  batchValue: number
  delta: number
  status: ReconciliationStatus
}

// ---------------------------------------------------------------------------
// Inline fallback data
// ---------------------------------------------------------------------------

const FALLBACK_HISTORY: ReconciliationRecord[] = [
  { id: "REC-001", date: "2026-03-22", venue: "Binance", breakType: "position", liveValue: 1.2045, batchValue: 1.2000, delta: 0.0045, status: "pending" },
  { id: "REC-002", date: "2026-03-22", venue: "Deribit", breakType: "pnl", liveValue: 34521.80, batchValue: 34200.00, delta: 321.80, status: "investigating" },
  { id: "REC-003", date: "2026-03-21", venue: "OKX", breakType: "fee", liveValue: 12.45, batchValue: 11.90, delta: 0.55, status: "resolved" },
  { id: "REC-004", date: "2026-03-21", venue: "Binance", breakType: "pnl", liveValue: -1520.30, batchValue: -1480.00, delta: -40.30, status: "resolved" },
  { id: "REC-005", date: "2026-03-21", venue: "Bybit", breakType: "position", liveValue: 0.5000, batchValue: 0.5120, delta: -0.0120, status: "pending" },
  { id: "REC-006", date: "2026-03-20", venue: "Hyperliquid", breakType: "fee", liveValue: 8.32, batchValue: 7.80, delta: 0.52, status: "resolved" },
  { id: "REC-007", date: "2026-03-20", venue: "Deribit", breakType: "position", liveValue: 2.0000, batchValue: 2.0500, delta: -0.0500, status: "investigating" },
  { id: "REC-008", date: "2026-03-19", venue: "OKX", breakType: "pnl", liveValue: 8730.12, batchValue: 8730.12, delta: 0.00, status: "resolved" },
  { id: "REC-009", date: "2026-03-19", venue: "Binance", breakType: "fee", liveValue: 45.60, batchValue: 43.20, delta: 2.40, status: "resolved" },
  { id: "REC-010", date: "2026-03-18", venue: "Bybit", breakType: "pnl", liveValue: -620.50, batchValue: -590.00, delta: -30.50, status: "resolved" },
  { id: "REC-011", date: "2026-03-18", venue: "Hyperliquid", breakType: "position", liveValue: 0.3200, batchValue: 0.3200, delta: 0.00, status: "resolved" },
  { id: "REC-012", date: "2026-03-17", venue: "Deribit", breakType: "fee", liveValue: 19.88, batchValue: 18.50, delta: 1.38, status: "resolved" },
]

const DRIFT_METRICS = [
  { label: "Net Position (BTC)", liveValue: 4.2045, batchValue: 4.1620, unit: "BTC", threshold: 2 },
  { label: "Unrealized PnL", liveValue: 41731.92, batchValue: 40930.12, threshold: 3 },
  { label: "Total Fees", liveValue: 86.25, batchValue: 81.40, threshold: 5 },
  { label: "Order Count", liveValue: 1247, batchValue: 1243, threshold: 1 },
  { label: "Fill Count", liveValue: 1189, batchValue: 1182, threshold: 1 },
]

const UNRECONCILED_ITEMS = [
  { id: "UNR-001", type: "position" as const, description: "BTC-PERP position mismatch on Binance", timestamp: "2026-03-22T14:32:00Z", amount: 0.0045, venue: "Binance" },
  { id: "UNR-002", type: "fill" as const, description: "Missing fill for ETH-USDT limit order", timestamp: "2026-03-22T13:18:00Z", amount: 321.80, venue: "Deribit" },
  { id: "UNR-003", type: "transfer" as const, description: "Funding rate credit not reflected in batch", timestamp: "2026-03-22T12:00:00Z", amount: 12.45, venue: "OKX" },
  { id: "UNR-004", type: "fill" as const, description: "Partial fill quantity discrepancy SOL-PERP", timestamp: "2026-03-22T11:45:00Z", amount: 40.30, venue: "Bybit" },
  { id: "UNR-005", type: "position" as const, description: "AVAX-USDT position stale in batch snapshot", timestamp: "2026-03-22T10:22:00Z", amount: 0.0120, venue: "Bybit" },
  { id: "UNR-006", type: "transfer" as const, description: "Withdrawal fee double-counted", timestamp: "2026-03-21T23:55:00Z", amount: 0.52, venue: "Hyperliquid" },
  { id: "UNR-007", type: "fill" as const, description: "Maker rebate missing for BTC-PERP batch", timestamp: "2026-03-21T22:10:00Z", amount: 2.40, venue: "Binance" },
]

const VENUES = ["All", "Binance", "Deribit", "OKX", "Bybit", "Hyperliquid"]
const BREAK_TYPES: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "position", label: "Position" },
  { value: "pnl", label: "PnL" },
  { value: "fee", label: "Fee" },
]
const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
]

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

function buildHistoryColumns(handlers: {
  onResolveAction: (record: ReconciliationRecord, action: "accept" | "reject" | "investigate") => void
  onBookCorrection: (record: ReconciliationRecord) => void
  onViewMarket: (record: ReconciliationRecord) => void
}): ColumnDef<ReconciliationRecord, unknown>[] {
  return [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground">{row.original.date}</span>
      ),
    },
    {
      accessorKey: "venue",
      header: "Venue",
    },
    {
      accessorKey: "breakType",
      header: "Break Type",
      cell: ({ row }) => breakTypeBadge(row.original.breakType),
    },
    {
      accessorKey: "liveValue",
      header: () => <span className="flex justify-end">Live Value</span>,
      cell: ({ row }) => (
        <span className="flex justify-end font-mono">{formatNumeric(row.original.liveValue)}</span>
      ),
    },
    {
      accessorKey: "batchValue",
      header: () => <span className="flex justify-end">Batch Value</span>,
      cell: ({ row }) => (
        <span className="flex justify-end font-mono">{formatNumeric(row.original.batchValue)}</span>
      ),
    },
    {
      accessorKey: "delta",
      header: () => <span className="flex justify-end">Delta</span>,
      cell: ({ row }) => {
        const delta = row.original.delta
        const colorClass =
          delta > 0
            ? "text-[var(--pnl-positive)]"
            : delta < 0
            ? "text-[var(--pnl-negative)]"
            : "text-muted-foreground"
        return (
          <span className={`flex justify-end font-mono ${colorClass}`}>
            {delta > 0 ? "+" : ""}
            {formatNumeric(delta)}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: () => <span className="flex justify-end">Status</span>,
      cell: ({ row }) => (
        <span className="flex justify-end">{statusBadge(row.original.status)}</span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="flex justify-end">Actions</span>,
      cell: ({ row }) => {
        const record = row.original
        return (
          <div className="flex justify-end items-center gap-1">
            {record.status !== "resolved" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  title="Accept"
                  onClick={() => handlers.onResolveAction(record, "accept")}
                >
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  title="Reject"
                  onClick={() => handlers.onResolveAction(record, "reject")}
                >
                  <XCircle className="size-3.5 text-rose-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  title="Investigate"
                  onClick={() => handlers.onResolveAction(record, "investigate")}
                >
                  <Search className="size-3.5 text-blue-500" />
                </Button>
              </>
            )}
            {record.status === "rejected" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title="Book Correction"
                onClick={() => handlers.onBookCorrection(record)}
              >
                <PenLine className="size-3.5 text-amber-500" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="View Market"
              onClick={() => handlers.onViewMarket(record)}
            >
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
        )
      },
    },
  ]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function breakTypeBadge(bt: BreakType) {
  const map: Record<BreakType, { className: string }> = {
    position: { className: "border-[var(--status-warning)] text-[var(--status-warning)]" },
    pnl: { className: "border-[var(--pnl-negative)] text-[var(--pnl-negative)]" },
    fee: { className: "border-primary text-primary" },
  }
  const style = map[bt]
  return (
    <Badge variant="outline" className={`text-[10px] uppercase ${style.className}`}>
      {bt}
    </Badge>
  )
}

function statusBadge(status: ReconciliationStatus) {
  const map: Record<ReconciliationStatus, string> = {
    resolved: "bg-[var(--status-live)]/10 text-[var(--status-live)]",
    pending: "bg-[var(--status-warning)]/10 text-[var(--status-warning)]",
    investigating: "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]",
    rejected: "bg-[var(--pnl-negative)]/10 text-[var(--pnl-negative)]",
  }
  return (
    <Badge variant="outline" className={`text-[10px] capitalize ${map[status]}`}>
      {status}
    </Badge>
  )
}

function formatNumeric(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(2)}k`
  if (Math.abs(v) < 1 && v !== 0) return v.toFixed(4)
  return v.toFixed(2)
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-[280px] w-full rounded-lg" />
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </main>
  )
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ReconciliationPage() {
  const router = useRouter()
  const { data: apiData, isLoading, isError, refetch } = useReconciliation()

  const [breakTypeFilter, setBreakTypeFilter] = React.useState("all")
  const [venueFilter, setVenueFilter] = React.useState("All")
  const [statusFilter, setStatusFilter] = React.useState("all")

  // Resolution dialog state
  const [resolvingBreak, setResolvingBreak] = React.useState<ReconciliationRecord | null>(null)
  const [resolveAction, setResolveAction] = React.useState<"accept" | "reject" | "investigate">("accept")
  const [resolveNote, setResolveNote] = React.useState("")
  const [localOverrides, setLocalOverrides] = React.useState<Record<string, ReconciliationStatus>>({})

  // Merge API data with fallback, apply local overrides
  const history: ReconciliationRecord[] = React.useMemo(() => {
    const raw = (apiData as Record<string, unknown>)?.history as ReconciliationRecord[] | undefined
    const base = raw ?? FALLBACK_HISTORY
    return base.map((r) => localOverrides[r.id] ? { ...r, status: localOverrides[r.id] } : r)
  }, [apiData, localOverrides])

  // Filtered history
  const filtered = React.useMemo(() => {
    return history.filter((r) => {
      if (breakTypeFilter !== "all" && r.breakType !== breakTypeFilter) return false
      if (venueFilter !== "All" && r.venue !== venueFilter) return false
      if (statusFilter !== "all" && r.status !== statusFilter) return false
      return true
    })
  }, [history, breakTypeFilter, venueFilter, statusFilter])

  // Resolution handlers
  const handleResolveAction = React.useCallback((record: ReconciliationRecord, action: "accept" | "reject" | "investigate") => {
    setResolvingBreak(record)
    setResolveAction(action)
    setResolveNote("")
  }, [])

  const handleBookCorrection = React.useCallback((record: ReconciliationRecord) => {
    const prefill = {
      venue: record.venue,
      instrument_id: record.id,
      quantity: Math.abs(record.delta),
      side: record.delta > 0 ? "BUY" : "SELL",
      execution_mode: "record_only",
      reason: `Correction for break ${record.id}`,
    }
    router.push(`/services/trading/book?prefill=${encodeURIComponent(JSON.stringify(prefill))}`)
  }, [router])

  const handleViewMarket = React.useCallback((record: ReconciliationRecord) => {
    router.push(`/services/trading/markets?instrument=${record.id}`)
  }, [router])

  const handleConfirmResolve = React.useCallback(() => {
    if (!resolvingBreak || resolveNote.length < 10) return
    const statusMap: Record<"accept" | "reject" | "investigate", ReconciliationStatus> = {
      accept: "resolved",
      reject: "rejected",
      investigate: "investigating",
    }
    setLocalOverrides((prev) => ({ ...prev, [resolvingBreak.id]: statusMap[resolveAction] }))
    setResolvingBreak(null)
    setResolveNote("")
  }, [resolvingBreak, resolveAction, resolveNote])

  // Build columns with handlers
  const historyColumns = React.useMemo(
    () => buildHistoryColumns({ onResolveAction: handleResolveAction, onBookCorrection: handleBookCorrection, onViewMarket: handleViewMarket }),
    [handleResolveAction, handleBookCorrection, handleViewMarket],
  )

  // Summary counts
  const totalBreaks = history.filter((r) => r.status !== "resolved").length
  const positionBreaks = history.filter((r) => r.breakType === "position" && r.status !== "resolved").length
  const pnlDiscrepancies = history.filter((r) => r.breakType === "pnl" && r.status !== "resolved").length
  const feeMismatches = history.filter((r) => r.breakType === "fee" && r.status !== "resolved").length

  // ---- Loading state ----
  if (isLoading) return <LoadingSkeleton />

  // ---- Error state ----
  if (isError) {
    return (
      <main className="flex-1 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="size-10 text-[var(--status-warning)] mx-auto" />
            <div>
              <p className="font-semibold">Failed to load reconciliation data</p>
              <p className="text-sm text-muted-foreground mt-1">
                Could not reach the reporting API. Check connectivity and try again.
              </p>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  // ---- Empty state ----
  if (history.length === 0) {
    return (
      <main className="flex-1 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <PackageX className="size-10 text-muted-foreground mx-auto" />
            <div>
              <p className="font-semibold">No reconciliation data</p>
              <p className="text-sm text-muted-foreground mt-1">
                There are no reconciliation records yet. Records will appear after the first batch/live comparison cycle.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  // ---- Main content ----
  return (
    <main className="flex-1 p-6 space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--status-warning)]/10">
                <Scale className="size-5" style={{ color: "var(--status-warning)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono">{totalBreaks}</p>
                <p className="text-xs text-muted-foreground">Total Breaks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--pnl-negative)]/10">
                <TrendingDown className="size-5" style={{ color: "var(--pnl-negative)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono">{positionBreaks}</p>
                <p className="text-xs text-muted-foreground">Position Breaks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent-blue)]/10">
                <DollarSign className="size-5" style={{ color: "var(--accent-blue)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono">{pnlDiscrepancies}</p>
                <p className="text-xs text-muted-foreground">PnL Discrepancies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Receipt className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono">{feeMismatches}</p>
                <p className="text-xs text-muted-foreground">Fee Mismatches</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drift Analysis Panel */}
      <DriftAnalysisPanel
        metrics={DRIFT_METRICS}
        unreconciledItems={UNRECONCILED_ITEMS}
        batchAsOf="2026-03-22 00:00 UTC"
        liveAsOf="2026-03-22 14:35 UTC"
      />

      {/* Reconciliation History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Reconciliation History</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={breakTypeFilter} onValueChange={setBreakTypeFilter}>
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BREAK_TYPES.map((bt) => (
                    <SelectItem key={bt.value} value={bt.value} className="text-xs">
                      {bt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={venueFilter} onValueChange={setVenueFilter}>
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VENUES.map((v) => (
                    <SelectItem key={v} value={v} className="text-xs">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ExportDropdown
                data={filtered.map(r => ({ ...r }))}
                columns={[
                  { key: "date", header: "Date" },
                  { key: "venue", header: "Venue" },
                  { key: "breakType", header: "Break Type" },
                  { key: "liveValue", header: "Live Value", format: "currency" },
                  { key: "batchValue", header: "Batch Value", format: "currency" },
                  { key: "delta", header: "Delta", format: "currency" },
                  { key: "status", header: "Status" },
                ]}
                filename="reconciliation-history"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={historyColumns}
            data={filtered}
            enableColumnVisibility={false}
            className="text-xs"
            emptyMessage="No reconciliation records match your filters."
          />
        </CardContent>
      </Card>

      {/* Resolution Dialog */}
      <Dialog open={resolvingBreak !== null} onOpenChange={(open) => { if (!open) { setResolvingBreak(null); setResolveNote("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Break {resolvingBreak?.id}</DialogTitle>
            <DialogDescription>
              Confirm resolution action for this reconciliation break.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Action:</span>
              <Badge
                variant="outline"
                className={
                  resolveAction === "accept"
                    ? "border-emerald-500 text-emerald-500"
                    : resolveAction === "reject"
                    ? "border-rose-500 text-rose-500"
                    : "border-blue-500 text-blue-500"
                }
              >
                {resolveAction.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Note (min 10 characters)</label>
              <Textarea
                placeholder="Describe the rationale for this resolution..."
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                className="min-h-[80px]"
              />
              {resolveNote.length > 0 && resolveNote.length < 10 && (
                <p className="text-[10px] text-rose-500">{10 - resolveNote.length} more characters required</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResolvingBreak(null); setResolveNote("") }}>
              Cancel
            </Button>
            <Button
              disabled={resolveNote.length < 10}
              onClick={handleConfirmResolve}
              className={
                resolveAction === "accept"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : resolveAction === "reject"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            >
              Confirm {resolveAction.charAt(0).toUpperCase() + resolveAction.slice(1)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
