"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Zap,
} from "lucide-react";

// Circuit breaker states
type CircuitState = "CLOSED" | "DEGRADED" | "OPEN" | "HALF_OPEN";

interface CircuitBreaker {
  venue: string;
  venueName: string;
  state: CircuitState;
  errorRate: number;
  errorWindow: number; // events in window
  consecutiveFailures: number;
  lastTrip?: string;
  cooldownRemaining?: number; // seconds
  queueDepth?: { current: number; max: number };
  throttlePercent?: number;
  nextProbe?: string;
  backoffSeconds?: number;
  baseBackoff?: number;
}

// Mock circuit breaker data
const CIRCUIT_BREAKERS: CircuitBreaker[] = [
  {
    venue: "binance",
    venueName: "Binance",
    state: "CLOSED",
    errorRate: 0.2,
    errorWindow: 20,
    consecutiveFailures: 0,
    lastTrip: "3 days ago",
  },
  {
    venue: "okx",
    venueName: "OKX",
    state: "DEGRADED",
    errorRate: 12,
    errorWindow: 20,
    consecutiveFailures: 3,
    throttlePercent: 50,
  },
  {
    venue: "deribit",
    venueName: "Deribit",
    state: "OPEN",
    errorRate: 45,
    errorWindow: 20,
    consecutiveFailures: 8,
    cooldownRemaining: 47,
    queueDepth: { current: 8, max: 100 },
    nextProbe: "HALF_OPEN in 47s",
    backoffSeconds: 120,
    baseBackoff: 30,
  },
  {
    venue: "hyperliquid",
    venueName: "Hyperliquid",
    state: "CLOSED",
    errorRate: 0.5,
    errorWindow: 20,
    consecutiveFailures: 0,
    lastTrip: "Never",
  },
  {
    venue: "bybit",
    venueName: "Bybit",
    state: "CLOSED",
    errorRate: 1.2,
    errorWindow: 20,
    consecutiveFailures: 1,
    lastTrip: "2 hours ago",
  },
  {
    venue: "coinbase",
    venueName: "Coinbase",
    state: "CLOSED",
    errorRate: 0.3,
    errorWindow: 20,
    consecutiveFailures: 0,
    lastTrip: "5 days ago",
  },
  {
    venue: "aave",
    venueName: "Aave V3",
    state: "HALF_OPEN",
    errorRate: 8,
    errorWindow: 20,
    consecutiveFailures: 2,
    queueDepth: { current: 3, max: 50 },
  },
  {
    venue: "uniswap",
    venueName: "Uniswap V3",
    state: "CLOSED",
    errorRate: 0.1,
    errorWindow: 20,
    consecutiveFailures: 0,
    lastTrip: "1 week ago",
  },
  {
    venue: "morpho",
    venueName: "Morpho",
    state: "CLOSED",
    errorRate: 0,
    errorWindow: 20,
    consecutiveFailures: 0,
    lastTrip: "Never",
  },
  {
    venue: "betfair",
    venueName: "Betfair",
    state: "CLOSED",
    errorRate: 2.1,
    errorWindow: 20,
    consecutiveFailures: 0,
    lastTrip: "12 hours ago",
  },
];

function getStateConfig(state: CircuitState) {
  switch (state) {
    case "CLOSED":
      return {
        color: "var(--status-live)",
        bgColor: "bg-[var(--status-live)]/10",
        borderColor: "border-[var(--status-live)]/30",
        label: "CLOSED",
        icon: CheckCircle2,
      };
    case "DEGRADED":
      return {
        color: "var(--status-warning)",
        bgColor: "bg-[var(--status-warning)]/10",
        borderColor: "border-[var(--status-warning)]/30",
        label: "DEGRADED",
        icon: AlertTriangle,
      };
    case "OPEN":
      return {
        color: "var(--status-error)",
        bgColor: "bg-[var(--status-error)]/10",
        borderColor: "border-[var(--status-error)]/30",
        label: "OPEN",
        icon: Zap,
      };
    case "HALF_OPEN":
      return {
        color: "#3b82f6", // blue
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
        label: "HALF_OPEN",
        icon: RefreshCw,
      };
  }
}

interface CircuitBreakerGridProps {
  className?: string;
}

export function CircuitBreakerGrid({ className }: CircuitBreakerGridProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="size-4" />
          Circuit Breakers
          <Badge variant="secondary" className="ml-auto text-xs">
            {CIRCUIT_BREAKERS.filter((cb) => cb.state === "CLOSED").length}/
            {CIRCUIT_BREAKERS.length} healthy
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {CIRCUIT_BREAKERS.map((cb) => {
            const config = getStateConfig(cb.state);
            const Icon = config.icon;

            return (
              <div
                key={cb.venue}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  config.bgColor,
                  config.borderColor,
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{cb.venueName}</span>
                  <div
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ color: config.color }}
                  >
                    <Icon className="size-3" />
                    {config.label}
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Error rate:</span>
                    <span
                      className={cn(
                        "font-mono",
                        cb.errorRate > 10 && "text-[var(--status-error)]",
                        cb.errorRate > 5 &&
                        cb.errorRate <= 10 &&
                        "text-[var(--status-warning)]",
                      )}
                    >
                      {cb.errorRate}% ({cb.errorWindow}-event window)
                    </span>
                  </div>

                  <div className="flex justify-between text-muted-foreground">
                    <span>Consecutive failures:</span>
                    <span className="font-mono">{cb.consecutiveFailures}</span>
                  </div>

                  {cb.state === "CLOSED" && cb.lastTrip && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Last trip:</span>
                      <span>{cb.lastTrip}</span>
                    </div>
                  )}

                  {cb.state === "DEGRADED" && cb.throttlePercent && (
                    <div
                      className="flex justify-between"
                      style={{ color: config.color }}
                    >
                      <span>Throttle:</span>
                      <span className="font-mono">
                        {cb.throttlePercent}% of orders pass
                      </span>
                    </div>
                  )}

                  {cb.state === "OPEN" && (
                    <>
                      {cb.cooldownRemaining && (
                        <div
                          className="flex justify-between"
                          style={{ color: config.color }}
                        >
                          <span>Cooldown:</span>
                          <span className="font-mono flex items-center gap-1">
                            <Clock className="size-3" />
                            {cb.cooldownRemaining}s remaining
                          </span>
                        </div>
                      )}
                      {cb.queueDepth && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Queue depth:</span>
                          <span className="font-mono">
                            {cb.queueDepth.current}/{cb.queueDepth.max} orders
                          </span>
                        </div>
                      )}
                      {cb.nextProbe && (
                        <div className="flex justify-between text-blue-500">
                          <span>Next probe:</span>
                          <span>{cb.nextProbe}</span>
                        </div>
                      )}
                      {cb.backoffSeconds && cb.baseBackoff && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Backoff:</span>
                          <span className="font-mono">
                            {cb.backoffSeconds}s (base {cb.baseBackoff}s x{" "}
                            {cb.backoffSeconds / cb.baseBackoff})
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {cb.state === "HALF_OPEN" && cb.queueDepth && (
                    <div
                      className="flex justify-between"
                      style={{ color: config.color }}
                    >
                      <span>Probe queue:</span>
                      <span className="font-mono">
                        {cb.queueDepth.current}/{cb.queueDepth.max}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-[var(--status-live)]" />
            <span>CLOSED (healthy)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-[var(--status-warning)]" />
            <span>DEGRADED (throttled)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-[var(--status-error)]" />
            <span>OPEN (blocked)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-blue-500" />
            <span>HALF_OPEN (probing)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
