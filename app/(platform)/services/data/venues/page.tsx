"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VenueStatus {
  name: string;
  category: "CeFi" | "DeFi" | "TradFi" | "Sports" | "Prediction";
  status: "connected" | "degraded" | "disconnected";
  latencyP50: number;
  latencyP99: number;
  uptime: number;
  rateLimitUsed: number;
  rateLimitMax: number;
  wsConnections: number;
  errorRate: number;
  lastReconnect: string;
  instruments: number;
  dataTypes: string[];
}

const VENUES: VenueStatus[] = [
  {
    name: "Binance",
    category: "CeFi",
    status: "connected",
    latencyP50: 12,
    latencyP99: 45,
    uptime: 99.97,
    rateLimitUsed: 420,
    rateLimitMax: 1200,
    wsConnections: 8,
    errorRate: 0.02,
    lastReconnect: "2d ago",
    instruments: 42,
    dataTypes: ["ticks", "trades", "book", "candles", "funding"],
  },
  {
    name: "OKX",
    category: "CeFi",
    status: "connected",
    latencyP50: 18,
    latencyP99: 65,
    uptime: 99.94,
    rateLimitUsed: 280,
    rateLimitMax: 600,
    wsConnections: 6,
    errorRate: 0.05,
    lastReconnect: "5h ago",
    instruments: 38,
    dataTypes: ["ticks", "trades", "book", "candles", "funding"],
  },
  {
    name: "Hyperliquid",
    category: "CeFi",
    status: "connected",
    latencyP50: 35,
    latencyP99: 120,
    uptime: 99.82,
    rateLimitUsed: 150,
    rateLimitMax: 300,
    wsConnections: 4,
    errorRate: 0.12,
    lastReconnect: "1h ago",
    instruments: 25,
    dataTypes: ["ticks", "trades", "book", "funding"],
  },
  {
    name: "Deribit",
    category: "CeFi",
    status: "connected",
    latencyP50: 22,
    latencyP99: 78,
    uptime: 99.96,
    rateLimitUsed: 180,
    rateLimitMax: 500,
    wsConnections: 5,
    errorRate: 0.03,
    lastReconnect: "3d ago",
    instruments: 30,
    dataTypes: ["ticks", "trades", "book", "candles", "funding"],
  },
  {
    name: "Bybit",
    category: "CeFi",
    status: "degraded",
    latencyP50: 45,
    latencyP99: 200,
    uptime: 99.71,
    rateLimitUsed: 380,
    rateLimitMax: 400,
    wsConnections: 4,
    errorRate: 0.28,
    lastReconnect: "15m ago",
    instruments: 22,
    dataTypes: ["ticks", "trades", "book", "candles"],
  },
  {
    name: "Aave V3",
    category: "DeFi",
    status: "connected",
    latencyP50: 800,
    latencyP99: 2500,
    uptime: 99.99,
    rateLimitUsed: 50,
    rateLimitMax: 200,
    wsConnections: 2,
    errorRate: 0.01,
    lastReconnect: "7d ago",
    instruments: 8,
    dataTypes: ["lending_rates", "positions", "health_factor"],
  },
  {
    name: "Uniswap V3",
    category: "DeFi",
    status: "connected",
    latencyP50: 600,
    latencyP99: 1800,
    uptime: 99.98,
    rateLimitUsed: 40,
    rateLimitMax: 200,
    wsConnections: 2,
    errorRate: 0.02,
    lastReconnect: "5d ago",
    instruments: 6,
    dataTypes: ["swaps", "liquidity", "pool_ticks"],
  },
  {
    name: "Betfair",
    category: "Sports",
    status: "connected",
    latencyP50: 50,
    latencyP99: 150,
    uptime: 99.88,
    rateLimitUsed: 200,
    rateLimitMax: 500,
    wsConnections: 3,
    errorRate: 0.08,
    lastReconnect: "2h ago",
    instruments: 15,
    dataTypes: ["odds", "markets", "settlements"],
  },
  {
    name: "Polymarket",
    category: "Prediction",
    status: "disconnected",
    latencyP50: 0,
    latencyP99: 0,
    uptime: 95.2,
    rateLimitUsed: 0,
    rateLimitMax: 100,
    wsConnections: 0,
    errorRate: 100,
    lastReconnect: "3h ago",
    instruments: 12,
    dataTypes: ["prices", "markets", "trades"],
  },
  {
    name: "Interactive Brokers",
    category: "TradFi",
    status: "connected",
    latencyP50: 25,
    latencyP99: 90,
    uptime: 99.95,
    rateLimitUsed: 100,
    rateLimitMax: 300,
    wsConnections: 3,
    errorRate: 0.04,
    lastReconnect: "1d ago",
    instruments: 20,
    dataTypes: ["ticks", "trades", "book", "candles"],
  },
];

export default function VenueHealthPage() {
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    let result = VENUES;
    if (categoryFilter !== "all")
      result = result.filter((v) => v.category === categoryFilter);
    if (searchQuery)
      result = result.filter((v) =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    return result;
  }, [categoryFilter, searchQuery]);

  const connected = VENUES.filter((v) => v.status === "connected").length;
  const degraded = VENUES.filter((v) => v.status === "degraded").length;
  const disconnected = VENUES.filter((v) => v.status === "disconnected").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Venue Health</h2>
          <p className="text-sm text-muted-foreground">
            {VENUES.length} venues monitored across{" "}
            {[...new Set(VENUES.map((v) => v.category))].length} asset classes
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="size-3.5" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-emerald-400">
              {connected}
            </p>
            <p className="text-xs text-muted-foreground">Connected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-amber-400">{degraded}</p>
            <p className="text-xs text-muted-foreground">Degraded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-rose-400">
              {disconnected}
            </p>
            <p className="text-xs text-muted-foreground">Disconnected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold">
              {VENUES.reduce((s, v) => s + v.instruments, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Instruments</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-8 px-2 text-xs rounded-md border border-border bg-background"
        >
          <option value="all">All Categories</option>
          <option value="CeFi">CeFi</option>
          <option value="DeFi">DeFi</option>
          <option value="TradFi">TradFi</option>
          <option value="Sports">Sports</option>
          <option value="Prediction">Prediction</option>
        </select>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-40 pl-8 pr-3 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((v) => (
          <Card
            key={v.name}
            className={cn(
              "border",
              v.status === "disconnected" && "border-rose-500/30",
              v.status === "degraded" && "border-amber-500/30",
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {v.status === "connected" ? (
                    <Wifi className="size-4 text-emerald-400" />
                  ) : v.status === "degraded" ? (
                    <AlertTriangle className="size-4 text-amber-400" />
                  ) : (
                    <WifiOff className="size-4 text-rose-400" />
                  )}
                  <CardTitle className="text-sm">{v.name}</CardTitle>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[9px]">
                    {v.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px]",
                      v.status === "connected"
                        ? "text-emerald-400 border-emerald-400/30"
                        : v.status === "degraded"
                          ? "text-amber-400 border-amber-400/30"
                          : "text-rose-400 border-rose-400/30",
                    )}
                  >
                    {v.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground text-[10px]">P50</span>
                  <div className="font-mono">{v.latencyP50}ms</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px]">P99</span>
                  <div className="font-mono">{v.latencyP99}ms</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px]">
                    Uptime
                  </span>
                  <div className="font-mono">{v.uptime}%</div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">Rate Limit</span>
                  <span className="font-mono">
                    {v.rateLimitUsed}/{v.rateLimitMax}
                  </span>
                </div>
                <Progress
                  value={(v.rateLimitUsed / v.rateLimitMax) * 100}
                  className="h-1.5"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground text-[10px]">WS</span>
                  <div className="font-mono">{v.wsConnections}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px]">
                    Err %
                  </span>
                  <div
                    className={cn(
                      "font-mono",
                      v.errorRate > 1
                        ? "text-rose-400"
                        : v.errorRate > 0.1
                          ? "text-amber-400"
                          : "text-emerald-400",
                    )}
                  >
                    {v.errorRate}%
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px]">
                    Reconnect
                  </span>
                  <div className="font-mono">{v.lastReconnect}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {v.dataTypes.map((dt) => (
                  <Badge
                    key={dt}
                    variant="outline"
                    className="text-[8px] h-4 px-1"
                  >
                    {dt}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
