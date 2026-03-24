"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  AlertOctagon,
  Info,
  RefreshCw,
  Filter,
  Clock,
} from "lucide-react";

type EventSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

interface StreamEvent {
  id: string;
  timestamp: string;
  eventType: string;
  service: string;
  severity: EventSeverity;
  details: string;
  strategyId?: string;
  venue?: string;
}

// Mock event data - 25 events
const MOCK_EVENTS: StreamEvent[] = [
  {
    id: "e001",
    timestamp: "14:32:01",
    eventType: "STRATEGY_SIGNAL_GENERATED",
    service: "strategy-service",
    severity: "INFO",
    details: "strategy=DEFI_ETH_BASIS_SCE_1H, signal=ENTRY, confidence=0.82",
    strategyId: "DEFI_ETH_BASIS_SCE_1H",
  },
  {
    id: "e002",
    timestamp: "14:31:45",
    eventType: "FEATURE_GROUP_COMPLETED",
    service: "features-delta-one",
    severity: "INFO",
    details: "group=funding_rates, instruments=12, latency=340ms",
  },
  {
    id: "e003",
    timestamp: "14:30:12",
    eventType: "DEPLOYMENT_COMPLETED",
    service: "deployment-api",
    severity: "INFO",
    details: "service=features-volatility-service, version=0.3.14",
  },
  {
    id: "e004",
    timestamp: "14:28:55",
    eventType: "DATA_STALE",
    service: "market-tick-data-service",
    severity: "WARNING",
    details: "venue=deribit, instrument=ETH-PERP, stale_for=47m",
    venue: "deribit",
  },
  {
    id: "e005",
    timestamp: "14:25:30",
    eventType: "CIRCUIT_BREAKER_DEGRADED",
    service: "execution-service",
    severity: "WARNING",
    details: "venue=okx, error_rate=12%, throttle=50%",
    venue: "okx",
  },
  {
    id: "e006",
    timestamp: "14:22:18",
    eventType: "KILL_SWITCH_ACTIVATED",
    service: "alerting-service",
    severity: "CRITICAL",
    details: "client=apex-capital, scope=all_strategies, exit=STOP_NEW_ONLY",
  },
  {
    id: "e007",
    timestamp: "14:20:01",
    eventType: "POSITION_LIMIT_CHECKED",
    service: "risk-and-exposure-service",
    severity: "INFO",
    details: "compliant=true, mifid_ref=TX-2026-03-17-0042",
  },
  {
    id: "e008",
    timestamp: "14:18:45",
    eventType: "DEFI_HEALTH_AGGREGATED",
    service: "elysium-defi-system",
    severity: "INFO",
    details: "protocol=aave_v3, avg_hf=1.42, positions=3",
  },
  {
    id: "e009",
    timestamp: "14:15:30",
    eventType: "QG_PASSED",
    service: "deployment-api",
    severity: "INFO",
    details: "repo=unified-trading-library, version=0.8.22",
  },
  {
    id: "e010",
    timestamp: "14:12:00",
    eventType: "RECONCILIATION_STARTED",
    service: "batch-live-recon-service",
    severity: "INFO",
    details: "scope=all_venues, period=T+1",
  },
  {
    id: "e011",
    timestamp: "14:08:22",
    eventType: "ML_MODEL_INFERENCE",
    service: "ml-inference-service",
    severity: "INFO",
    details: "model=momentum-btc-xgb, latency=45ms, prediction=0.72",
    strategyId: "CEFI_BTC_ML_DIR_HUF_4H",
  },
  {
    id: "e012",
    timestamp: "14:05:15",
    eventType: "ORDER_REJECTED",
    service: "execution-service",
    severity: "ERROR",
    details: "reason=INSUFFICIENT_MARGIN, venue=hyperliquid, size=50000",
    venue: "hyperliquid",
  },
  {
    id: "e013",
    timestamp: "14:02:30",
    eventType: "POSITION_OPENED",
    service: "position-service",
    severity: "INFO",
    details: "instrument=ETH-PERP, size=100, entry=2450.25",
    strategyId: "DEFI_ETH_BASIS_SCE_1H",
  },
  {
    id: "e014",
    timestamp: "13:58:12",
    eventType: "FUNDING_PAYMENT",
    service: "pnl-attribution-service",
    severity: "INFO",
    details: "venue=hyperliquid, amount=$1,245, direction=receive",
    venue: "hyperliquid",
  },
  {
    id: "e015",
    timestamp: "13:55:00",
    eventType: "CONFIG_DEPLOYED",
    service: "config-service",
    severity: "INFO",
    details: "strategy=CEFI_BTC_MM_EVT_TICK, version=v3.2",
    strategyId: "CEFI_BTC_MM_EVT_TICK",
  },
  {
    id: "e016",
    timestamp: "13:50:30",
    eventType: "LATENCY_SPIKE",
    service: "connectivity-monitor",
    severity: "WARNING",
    details: "venue=binance, p99=85ms (threshold=50ms)",
    venue: "binance",
  },
  {
    id: "e017",
    timestamp: "13:45:18",
    eventType: "HEALTH_CHECK_FAILED",
    service: "service-mesh",
    severity: "ERROR",
    details: "service=sports-odds-feed, consecutive_failures=3",
  },
  {
    id: "e018",
    timestamp: "13:42:00",
    eventType: "REBALANCE_TRIGGERED",
    service: "strategy-service",
    severity: "INFO",
    details: "strategy=DEFI_AAVE_LEND_EVT_1D, reason=health_factor_drift",
    strategyId: "DEFI_AAVE_LEND_EVT_1D",
  },
  {
    id: "e019",
    timestamp: "13:38:45",
    eventType: "MARGIN_WARNING",
    service: "risk-and-exposure-service",
    severity: "WARNING",
    details: "venue=hyperliquid, utilization=82%, threshold=85%",
    venue: "hyperliquid",
  },
  {
    id: "e020",
    timestamp: "13:35:12",
    eventType: "STRATEGY_PAUSED",
    service: "strategy-service",
    severity: "WARNING",
    details: "strategy=CEFI_ETH_OPT_MM_EVT_TICK, reason=delta_limit_breach",
    strategyId: "CEFI_ETH_OPT_MM_EVT_TICK",
  },
  {
    id: "e021",
    timestamp: "13:30:00",
    eventType: "BATCH_JOB_COMPLETED",
    service: "batch-scheduler",
    severity: "INFO",
    details: "job=daily_pnl_attribution, duration=45s, records=12450",
  },
  {
    id: "e022",
    timestamp: "13:25:30",
    eventType: "API_RATE_LIMITED",
    service: "connectivity-monitor",
    severity: "WARNING",
    details: "venue=okx, endpoint=/v5/market/tickers, retry_after=60s",
    venue: "okx",
  },
  {
    id: "e023",
    timestamp: "13:20:15",
    eventType: "COMPLIANCE_CHECK",
    service: "compliance-service",
    severity: "INFO",
    details: "check=position_limits, result=PASS, client=meridian-fund",
  },
  {
    id: "e024",
    timestamp: "13:15:00",
    eventType: "WEBSOCKET_RECONNECT",
    service: "market-data-service",
    severity: "INFO",
    details: "venue=deribit, reason=connection_timeout, reconnect_attempt=1",
    venue: "deribit",
  },
  {
    id: "e025",
    timestamp: "13:10:45",
    eventType: "STRATEGY_RESUMED",
    service: "strategy-service",
    severity: "INFO",
    details: "strategy=CEFI_ETH_OPT_MM_EVT_TICK, manual_action=true",
    strategyId: "CEFI_ETH_OPT_MM_EVT_TICK",
  },
];

const EVENT_TYPES = [
  "STRATEGY_SIGNAL_GENERATED",
  "FEATURE_GROUP_COMPLETED",
  "DEPLOYMENT_COMPLETED",
  "DATA_STALE",
  "CIRCUIT_BREAKER_DEGRADED",
  "KILL_SWITCH_ACTIVATED",
  "POSITION_LIMIT_CHECKED",
  "ML_MODEL_INFERENCE",
  "ORDER_REJECTED",
  "POSITION_OPENED",
  "CONFIG_DEPLOYED",
];

const SERVICES = [
  "strategy-service",
  "execution-service",
  "risk-and-exposure-service",
  "ml-inference-service",
  "deployment-api",
  "market-tick-data-service",
  "alerting-service",
];

const VENUES = ["binance", "okx", "deribit", "hyperliquid", "aave", "uniswap"];

function getSeverityConfig(severity: EventSeverity) {
  switch (severity) {
    case "INFO":
      return { color: "text-muted-foreground", bg: "", icon: Info };
    case "WARNING":
      return {
        color: "text-[var(--status-warning)]",
        bg: "bg-[var(--status-warning)]/10",
        icon: AlertTriangle,
      };
    case "ERROR":
      return {
        color: "text-orange-500",
        bg: "bg-orange-500/10",
        icon: AlertTriangle,
      };
    case "CRITICAL":
      return {
        color: "text-[var(--status-error)]",
        bg: "bg-[var(--status-error)]/10",
        icon: AlertOctagon,
      };
  }
}

interface EventStreamViewerProps {
  className?: string;
}

export function EventStreamViewer({ className }: EventStreamViewerProps) {
  const [eventTypeFilter, setEventTypeFilter] = React.useState<string>("all");
  const [serviceFilter, setServiceFilter] = React.useState<string>("all");
  const [severityFilter, setSeverityFilter] = React.useState<string>("all");
  const [venueFilter, setVenueFilter] = React.useState<string>("all");
  const [timeRange, setTimeRange] = React.useState<string>("1h");
  const [isLive, setIsLive] = React.useState(true);

  // Filter events
  const filteredEvents = React.useMemo(() => {
    return MOCK_EVENTS.filter((event) => {
      if (eventTypeFilter !== "all" && event.eventType !== eventTypeFilter)
        return false;
      if (serviceFilter !== "all" && event.service !== serviceFilter)
        return false;
      if (severityFilter !== "all" && event.severity !== severityFilter)
        return false;
      if (venueFilter !== "all" && event.venue !== venueFilter) return false;
      return true;
    });
  }, [eventTypeFilter, serviceFilter, severityFilter, venueFilter]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4" />
            Event Stream
            {isLive && (
              <Badge
                variant="outline"
                className="gap-1 text-[var(--status-live)] border-[var(--status-live)]"
              >
                <span className="size-1.5 rounded-full bg-[var(--status-live)] animate-pulse" />
                Live
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5"
              onClick={() => setIsLive(!isLive)}
            >
              {isLive ? (
                <>
                  <RefreshCw className="size-3 animate-spin" />
                  Pause
                </>
              ) : (
                <>
                  <Activity className="size-3" />
                  Resume
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-3">
          <Filter className="size-3.5 text-muted-foreground" />

          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="h-7 w-[160px] text-xs">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="h-7 w-[140px] text-xs">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {SERVICES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-7 w-[100px] text-xs">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="WARNING">WARNING</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
              <SelectItem value="CRITICAL">CRITICAL</SelectItem>
            </SelectContent>
          </Select>

          <Select value={venueFilter} onValueChange={setVenueFilter}>
            <SelectTrigger className="h-7 w-[100px] text-xs">
              <SelectValue placeholder="Venue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Venues</SelectItem>
              {VENUES.map((v) => (
                <SelectItem key={v} value={v} className="text-xs capitalize">
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 ml-auto border rounded px-1">
            {["1h", "4h", "24h", "7d"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-2 py-0.5 text-xs rounded transition-colors",
                  timeRange === range
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-medium text-muted-foreground w-20">
                  Time
                </th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground w-48">
                  Event Type
                </th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground w-40">
                  Service
                </th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground w-20">
                  Severity
                </th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => {
                const config = getSeverityConfig(event.severity);
                const Icon = config.icon;

                return (
                  <tr
                    key={event.id}
                    className={cn(
                      "border-b border-border/50 hover:bg-secondary/30 transition-colors",
                      config.bg,
                    )}
                  >
                    <td className="py-2 px-2 font-mono text-muted-foreground">
                      {event.timestamp}
                    </td>
                    <td className="py-2 px-2 font-mono">{event.eventType}</td>
                    <td className="py-2 px-2 text-muted-foreground truncate">
                      {event.service}
                    </td>
                    <td className="py-2 px-2">
                      <div
                        className={cn("flex items-center gap-1", config.color)}
                      >
                        <Icon className="size-3" />
                        {event.severity}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-muted-foreground truncate max-w-[300px]">
                      {event.details}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollArea>

        <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
          <span>
            Showing {filteredEvents.length} of {MOCK_EVENTS.length} events
          </span>
          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            Last updated: just now
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
