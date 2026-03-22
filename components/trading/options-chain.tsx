"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useOptionsChain } from "@/hooks/api/use-market-data"

// ---------- Types ----------

interface OptionGreeks {
  delta: number
  gamma: number
  theta: number
}

interface OptionLeg {
  bid: number
  ask: number
  last: number
  iv: number
  greeks: OptionGreeks
  volume: number
  openInterest: number
}

interface OptionsRow {
  strike: number
  call: OptionLeg
  put: OptionLeg
}

interface ExpiryGroup {
  expiry: string
  daysToExpiry: number
  rows: OptionsRow[]
  spotPrice: number
}

interface OptionsChainResponse {
  underlying: string
  venue: string
  spotPrice: number
  expiries: ExpiryGroup[]
}

interface OptionsChainProps {
  underlying: string
  venue: string
  onSelectStrike?: (strike: number, expiry: string, side: "call" | "put") => void
  className?: string
}

// ---------- Mock data generator ----------

const UNDERLYINGS = ["BTC", "ETH", "SPY"] as const

function generateMockExpiry(
  expiry: string,
  daysToExpiry: number,
  spotPrice: number,
  tickSize: number,
): ExpiryGroup {
  const numStrikes = 11
  const halfRange = Math.floor(numStrikes / 2)
  const roundedSpot = Math.round(spotPrice / tickSize) * tickSize
  const rows: OptionsRow[] = []

  for (let i = -halfRange; i <= halfRange; i++) {
    const strike = roundedSpot + i * tickSize
    const moneyness = spotPrice / strike
    const baseIv = 0.4 + 0.15 * Math.pow(moneyness - 1, 2) * 100 + (daysToExpiry / 365) * 0.05

    const callItm = spotPrice > strike
    const putItm = spotPrice < strike

    const callIntrinsic = Math.max(spotPrice - strike, 0)
    const putIntrinsic = Math.max(strike - spotPrice, 0)

    const timeValue = spotPrice * baseIv * Math.sqrt(daysToExpiry / 365) * 0.05
    const callMid = callIntrinsic + timeValue * (1 + (callItm ? 0.1 : 0.3))
    const putMid = putIntrinsic + timeValue * (1 + (putItm ? 0.1 : 0.3))

    const spread = spotPrice * 0.0005

    const callDelta = callItm ? 0.5 + 0.5 * (1 - Math.exp(-Math.abs(i) * 0.3)) : 0.5 - 0.5 * (1 - Math.exp(-Math.abs(i) * 0.3))
    const putDelta = callDelta - 1

    const gamma = 0.001 * Math.exp(-0.5 * i * i / 4)
    const theta = -(spotPrice * baseIv) / (2 * Math.sqrt(daysToExpiry / 365) * 365) * gamma * 10000

    rows.push({
      strike,
      call: {
        bid: Math.max(callMid - spread / 2, 0.01),
        ask: callMid + spread / 2,
        last: callMid + (Math.random() - 0.5) * spread * 0.5,
        iv: baseIv + (Math.random() - 0.5) * 0.02,
        greeks: { delta: callDelta, gamma, theta },
        volume: Math.floor(Math.random() * 500 + 10),
        openInterest: Math.floor(Math.random() * 5000 + 100),
      },
      put: {
        bid: Math.max(putMid - spread / 2, 0.01),
        ask: putMid + spread / 2,
        last: putMid + (Math.random() - 0.5) * spread * 0.5,
        iv: baseIv + 0.01 + (Math.random() - 0.5) * 0.02,
        greeks: { delta: putDelta, gamma, theta: theta * 0.9 },
        volume: Math.floor(Math.random() * 400 + 10),
        openInterest: Math.floor(Math.random() * 4000 + 100),
      },
    })
  }

  return { expiry, daysToExpiry, rows, spotPrice }
}

function generateMockOptionsChain(underlying: string, venue: string): OptionsChainResponse {
  const spots: Record<string, number> = { BTC: 67234.5, ETH: 3456.78, SPY: 542.3 }
  const ticks: Record<string, number> = { BTC: 1000, ETH: 50, SPY: 5 }

  const spotPrice = spots[underlying] ?? 100
  const tickSize = ticks[underlying] ?? 1

  const now = new Date()
  const expiries: ExpiryGroup[] = [
    { label: "Weekly", days: 7 },
    { label: "Bi-weekly", days: 14 },
    { label: "Monthly", days: 30 },
    { label: "Quarterly", days: 90 },
  ].map(({ days }) => {
    const d = new Date(now.getTime() + days * 86400000)
    const label = d.toISOString().slice(0, 10)
    return generateMockExpiry(label, days, spotPrice, tickSize)
  })

  return { underlying, venue, spotPrice, expiries }
}

// ---------- Formatting helpers ----------

function fmtNum(n: number, decimals: number): string {
  return n.toFixed(decimals)
}

function fmtIv(iv: number): string {
  return `${(iv * 100).toFixed(1)}%`
}

function fmtInt(n: number): string {
  return n.toLocaleString()
}

// ---------- Sub-components ----------

const CALL_HEADS = ["Bid", "Ask", "Last", "IV", "Delta", "Gamma", "Theta", "Vol", "OI"] as const
const PUT_HEADS = ["OI", "Vol", "Theta", "Gamma", "Delta", "IV", "Last", "Ask", "Bid"] as const

function OptionCells({
  leg,
  side,
  itm,
  decimals,
  strike,
  expiry,
  onSelect,
}: {
  leg: OptionLeg
  side: "call" | "put"
  itm: boolean
  decimals: number
  strike: number
  expiry: string
  onSelect?: (strike: number, expiry: string, side: "call" | "put") => void
}) {
  const bg = itm ? (side === "call" ? "bg-emerald-500/5" : "bg-rose-500/5") : ""
  const cls = cn("font-mono text-xs cursor-pointer", bg)

  const cells = [
    fmtNum(leg.bid, decimals),
    fmtNum(leg.ask, decimals),
    fmtNum(leg.last, decimals),
    fmtIv(leg.iv),
    fmtNum(leg.greeks.delta, 3),
    fmtNum(leg.greeks.gamma, 4),
    fmtNum(leg.greeks.theta, 2),
    fmtInt(leg.volume),
    fmtInt(leg.openInterest),
  ]

  const ordered = side === "put" ? [...cells].reverse() : cells

  return (
    <>
      {ordered.map((val, i) => (
        <TableCell
          key={i}
          className={cn(cls, "text-right px-1.5 py-1")}
          onClick={() => onSelect?.(strike, expiry, side)}
        >
          {val}
        </TableCell>
      ))}
    </>
  )
}

function ExpirySection({
  group,
  decimals,
  onSelectStrike,
}: {
  group: ExpiryGroup
  decimals: number
  onSelectStrike?: (strike: number, expiry: string, side: "call" | "put") => void
}) {
  const [open, setOpen] = React.useState(true)

  // Find ATM strike (closest to spot)
  const atmStrike = group.rows.reduce((closest, row) =>
    Math.abs(row.strike - group.spotPrice) < Math.abs(closest.strike - group.spotPrice) ? row : closest,
  ).strike

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 bg-muted/40 hover:bg-muted/60 transition-colors border-b border-border cursor-pointer">
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        <span className="text-sm font-medium">{group.expiry}</span>
        <Badge variant="outline" className="text-[10px] font-mono">
          {group.daysToExpiry}d
        </Badge>
        <span className="text-xs text-muted-foreground ml-auto">
          {group.rows.length} strikes
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Table>
          <TableHeader>
            <TableRow className="text-[10px]">
              {CALL_HEADS.map((h) => (
                <TableHead key={`c-${h}`} className="text-right px-1.5 py-1 text-emerald-400/80 text-[10px]">
                  {h}
                </TableHead>
              ))}
              <TableHead className="text-center px-2 py-1 bg-muted/30 font-bold text-[10px]">
                Strike
              </TableHead>
              {PUT_HEADS.map((h) => (
                <TableHead key={`p-${h}`} className="text-right px-1.5 py-1 text-rose-400/80 text-[10px]">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.rows.map((row) => {
              const isAtm = row.strike === atmStrike
              const callItm = group.spotPrice > row.strike
              const putItm = group.spotPrice < row.strike

              return (
                <TableRow
                  key={row.strike}
                  className={cn(isAtm && "bg-yellow-500/10 border-y border-yellow-500/30")}
                >
                  <OptionCells
                    leg={row.call}
                    side="call"
                    itm={callItm}
                    decimals={decimals}
                    strike={row.strike}
                    expiry={group.expiry}
                    onSelect={onSelectStrike}
                  />
                  <TableCell
                    className={cn(
                      "text-center font-mono font-bold text-xs px-2 py-1 bg-muted/20",
                      isAtm && "text-yellow-400",
                    )}
                  >
                    {fmtNum(row.strike, decimals)}
                    {isAtm && (
                      <span className="ml-1 text-[9px] text-yellow-500/80">ATM</span>
                    )}
                  </TableCell>
                  <OptionCells
                    leg={row.put}
                    side="put"
                    itm={putItm}
                    decimals={decimals}
                    strike={row.strike}
                    expiry={group.expiry}
                    onSelect={onSelectStrike}
                  />
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ---------- Main component ----------

export function OptionsChain({
  underlying: initialUnderlying,
  venue,
  onSelectStrike,
  className,
}: OptionsChainProps) {
  const [underlying, setUnderlying] = React.useState(initialUnderlying)
  const { data, isLoading, isError } = useOptionsChain(underlying, venue)

  // Determine decimal precision by underlying
  const decimals = underlying === "BTC" ? 2 : underlying === "ETH" ? 2 : 2

  // Use API data if available, otherwise fall back to mock
  const chain: OptionsChainResponse = React.useMemo(() => {
    if (data && typeof data === "object" && "expiries" in (data as Record<string, unknown>)) {
      return data as OptionsChainResponse
    }
    return generateMockOptionsChain(underlying, venue)
  }, [data, underlying, venue])

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            Options Chain
            <Badge variant="secondary" className="text-[10px]">
              {venue}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={underlying} onValueChange={setUnderlying}>
              <SelectTrigger className="h-7 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNDERLYINGS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-[10px] font-mono">
              Spot: {chain.spotPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </Badge>
          </div>
        </div>

        {isLoading && (
          <div className="text-xs text-muted-foreground mt-1">Loading options chain...</div>
        )}
        {isError && (
          <div className="text-xs text-muted-foreground mt-1">
            API unavailable -- showing mock data
          </div>
        )}
        {!data && !isLoading && !isError && (
          <div className="text-xs text-muted-foreground mt-1">
            No live data -- displaying sample options chain
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0 px-0">
        {/* Legend */}
        <div className="flex items-center gap-4 px-3 py-1.5 border-b border-border text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="text-emerald-400">CALLS</span>
            <span className="inline-block w-3 h-2 bg-emerald-500/10 border border-emerald-500/30 rounded-sm" />
            <span>ITM</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-rose-400">PUTS</span>
            <span className="inline-block w-3 h-2 bg-rose-500/10 border border-rose-500/30 rounded-sm" />
            <span>ITM</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 bg-yellow-500/10 border border-yellow-500/30 rounded-sm" />
            <span>ATM</span>
          </div>
        </div>

        <div className="max-h-[700px] overflow-y-auto">
          {chain.expiries.map((group) => (
            <ExpirySection
              key={group.expiry}
              group={group}
              decimals={decimals}
              onSelectStrike={onSelectStrike}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export { generateMockOptionsChain }
export type { OptionsChainResponse, ExpiryGroup, OptionsRow, OptionLeg }
