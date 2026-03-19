"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Activity,
  Wifi,
  WifiOff,
  Clock,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Database,
  Radio,
} from "lucide-react"

type ConnectionType = "websocket" | "rest" | "batch" | "graphql" | "rpc"
type CircuitState = "CLOSED" | "DEGRADED" | "OPEN"
type VenueCategory = "CeFi" | "TradFi" | "DeFi" | "Sports"

interface VenueConnection {
  id: string
  name: string
  category: VenueCategory
  connectionType: ConnectionType
  status: "connected" | "disconnected" | "degraded"
  latency: { p50: number; p99: number }
  rateLimitUsed: number // percentage
  circuitState: CircuitState
  lastMessage: string
  // DeFi-specific
  blockHeight?: number
  gasPrice?: number
}

// Mock venue connection data
const VENUE_CONNECTIONS: VenueConnection[] = [
  // CeFi
  {
    id: "binance",
    name: "Binance",
    category: "CeFi",
    connectionType: "websocket",
    status: "connected",
    latency: { p50: 2, p99: 12 },
    rateLimitUsed: 42,
    circuitState: "CLOSED",
    lastMessage: "0.3s ago",
  },
  {
    id: "okx",
    name: "OKX",
    category: "CeFi",
    connectionType: "websocket",
    status: "degraded",
    latency: { p50: 8, p99: 45 },
    rateLimitUsed: 85,
    circuitState: "DEGRADED",
    lastMessage: "1.2s ago",
  },
  {
    id: "bybit",
    name: "Bybit",
    category: "CeFi",
    connectionType: "websocket",
    status: "connected",
    latency: { p50: 3, p99: 18 },
    rateLimitUsed: 28,
    circuitState: "CLOSED",
    lastMessage: "0.5s ago",
  },
  {
    id: "deribit",
    name: "Deribit",
    category: "CeFi",
    connectionType: "websocket",
    status: "connected",
    latency: { p50: 5, p99: 25 },
    rateLimitUsed: 35,
    circuitState: "CLOSED",
    lastMessage: "0.8s ago",
  },
  {
    id: "hyperliquid",
    name: "Hyperliquid",
    category: "CeFi",
    connectionType: "websocket",
    status: "connected",
    latency: { p50: 1, p99: 8 },
    rateLimitUsed: 22,
    circuitState: "CLOSED",
    lastMessage: "0.1s ago",
  },
  {
    id: "coinbase",
    name: "Coinbase",
    category: "CeFi",
    connectionType: "websocket",
    status: "connected",
    latency: { p50: 4, p99: 22 },
    rateLimitUsed: 15,
    circuitState: "CLOSED",
    lastMessage: "0.4s ago",
  },
  // TradFi
  {
    id: "ibkr",
    name: "IBKR",
    category: "TradFi",
    connectionType: "rest",
    status: "connected",
    latency: { p50: 45, p99: 120 },
    rateLimitUsed: 12,
    circuitState: "CLOSED",
    lastMessage: "2.1s ago",
  },
  {
    id: "databento",
    name: "Databento",
    category: "TradFi",
    connectionType: "batch",
    status: "connected",
    latency: { p50: 0, p99: 0 },
    rateLimitUsed: 0,
    circuitState: "CLOSED",
    lastMessage: "5m ago",
  },
  {
    id: "tardis",
    name: "Tardis",
    category: "TradFi",
    connectionType: "batch",
    status: "connected",
    latency: { p50: 0, p99: 0 },
    rateLimitUsed: 0,
    circuitState: "CLOSED",
    lastMessage: "15m ago",
  },
  // DeFi
  {
    id: "aave",
    name: "Aave V3",
    category: "DeFi",
    connectionType: "rpc",
    status: "connected",
    latency: { p50: 150, p99: 450 },
    rateLimitUsed: 25,
    circuitState: "CLOSED",
    lastMessage: "1.5s ago",
    blockHeight: 19482156,
    gasPrice: 28,
  },
  {
    id: "uniswap",
    name: "Uniswap V3",
    category: "DeFi",
    connectionType: "rpc",
    status: "connected",
    latency: { p50: 120, p99: 380 },
    rateLimitUsed: 18,
    circuitState: "CLOSED",
    lastMessage: "0.9s ago",
    blockHeight: 19482156,
    gasPrice: 28,
  },
  {
    id: "morpho",
    name: "Morpho",
    category: "DeFi",
    connectionType: "rpc",
    status: "connected",
    latency: { p50: 140, p99: 420 },
    rateLimitUsed: 8,
    circuitState: "CLOSED",
    lastMessage: "2.0s ago",
    blockHeight: 19482156,
    gasPrice: 28,
  },
  // Sports
  {
    id: "betfair",
    name: "Betfair",
    category: "Sports",
    connectionType: "rest",
    status: "connected",
    latency: { p50: 85, p99: 250 },
    rateLimitUsed: 45,
    circuitState: "CLOSED",
    lastMessage: "1.8s ago",
  },
  {
    id: "pinnacle",
    name: "Pinnacle",
    category: "Sports",
    connectionType: "rest",
    status: "degraded",
    latency: { p50: 120, p99: 450 },
    rateLimitUsed: 72,
    circuitState: "DEGRADED",
    lastMessage: "3.5s ago",
  },
  {
    id: "oddsapi",
    name: "Odds API",
    category: "Sports",
    connectionType: "rest",
    status: "connected",
    latency: { p50: 200, p99: 600 },
    rateLimitUsed: 55,
    circuitState: "CLOSED",
    lastMessage: "5.2s ago",
  },
]

function getConnectionTypeConfig(type: ConnectionType) {
  switch (type) {
    case "websocket":
      return { color: "var(--status-live)", label: "WebSocket", icon: Radio }
    case "rest":
      return { color: "#3b82f6", label: "REST polling", icon: Activity }
    case "batch":
      return { color: "#6b7280", label: "Batch file", icon: Database }
    case "graphql":
      return { color: "#a855f7", label: "GraphQL", icon: Zap }
    case "rpc":
      return { color: "#f59e0b", label: "RPC", icon: Zap }
  }
}

function getCircuitStateColor(state: CircuitState) {
  switch (state) {
    case "CLOSED":
      return "var(--status-live)"
    case "DEGRADED":
      return "var(--status-warning)"
    case "OPEN":
      return "var(--status-error)"
  }
}

interface VenueConnectivityProps {
  className?: string
}

export function VenueConnectivity({ className }: VenueConnectivityProps) {
  // Group venues by category
  const groupedVenues = React.useMemo(() => {
    const groups: Record<VenueCategory, VenueConnection[]> = {
      CeFi: [],
      TradFi: [],
      DeFi: [],
      Sports: [],
    }
    VENUE_CONNECTIONS.forEach((v) => {
      groups[v.category].push(v)
    })
    return groups
  }, [])

  const healthyCount = VENUE_CONNECTIONS.filter(v => v.status === "connected" && v.circuitState === "CLOSED").length

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wifi className="size-4" />
          Venue Connectivity
          <Badge variant="secondary" className="ml-auto text-xs">
            {healthyCount}/{VENUE_CONNECTIONS.length} healthy
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {(Object.entries(groupedVenues) as [VenueCategory, VenueConnection[]][]).map(([category, venues]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {venues.map((venue) => {
                const connConfig = getConnectionTypeConfig(venue.connectionType)
                const ConnIcon = connConfig.icon
                const circuitColor = getCircuitStateColor(venue.circuitState)
                const isHealthy = venue.status === "connected" && venue.circuitState === "CLOSED"
                
                return (
                  <div
                    key={venue.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      isHealthy
                        ? "border-border bg-background"
                        : venue.status === "degraded"
                        ? "border-[var(--status-warning)]/30 bg-[var(--status-warning)]/5"
                        : "border-[var(--status-error)]/30 bg-[var(--status-error)]/5"
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{venue.name}</span>
                      <div className="flex items-center gap-1">
                        {venue.status === "connected" ? (
                          <CheckCircle2 className="size-3.5 text-[var(--status-live)]" />
                        ) : venue.status === "degraded" ? (
                          <AlertTriangle className="size-3.5 text-[var(--status-warning)]" />
                        ) : (
                          <WifiOff className="size-3.5 text-[var(--status-error)]" />
                        )}
                      </div>
                    </div>

                    {/* Connection Type */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <ConnIcon className="size-3" style={{ color: connConfig.color }} />
                      <span className="text-xs" style={{ color: connConfig.color }}>
                        {connConfig.label}
                      </span>
                    </div>

                    {/* Metrics */}
                    <div className="space-y-1 text-xs">
                      {venue.connectionType !== "batch" && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Latency:</span>
                          <span className="font-mono">
                            p50={venue.latency.p50}ms p99={venue.latency.p99}ms
                          </span>
                        </div>
                      )}
                      
                      {venue.rateLimitUsed > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rate limit:</span>
                          <span className={cn(
                            "font-mono",
                            venue.rateLimitUsed > 80 && "text-[var(--status-error)]",
                            venue.rateLimitUsed > 60 && venue.rateLimitUsed <= 80 && "text-[var(--status-warning)]"
                          )}>
                            {venue.rateLimitUsed}% used
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Circuit:</span>
                        <span className="font-mono" style={{ color: circuitColor }}>
                          {venue.circuitState}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-muted-foreground">
                        <span>Last msg:</span>
                        <span>{venue.lastMessage}</span>
                      </div>

                      {/* DeFi-specific fields */}
                      {venue.blockHeight && (
                        <div className="flex justify-between text-muted-foreground pt-1 border-t border-border/50 mt-1">
                          <span>Block:</span>
                          <span className="font-mono">{venue.blockHeight.toLocaleString()}</span>
                        </div>
                      )}
                      {venue.gasPrice && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Gas:</span>
                          <span className="font-mono">{venue.gasPrice} gwei</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-4 pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Radio className="size-3 text-[var(--status-live)]" />
            <span>WebSocket</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="size-3 text-blue-500" />
            <span>REST</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Database className="size-3 text-gray-500" />
            <span>Batch</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="size-3 text-amber-500" />
            <span>RPC</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
