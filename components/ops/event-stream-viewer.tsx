"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { Activity, AlertTriangle, AlertOctagon, Info, RefreshCw, Filter, Clock } from "lucide-react";
import { MOCK_EVENTS, type EventSeverity } from "@/lib/mocks/fixtures/ops-event-stream";

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
      if (eventTypeFilter !== "all" && event.eventType !== eventTypeFilter) return false;
      if (serviceFilter !== "all" && event.service !== serviceFilter) return false;
      if (severityFilter !== "all" && event.severity !== severityFilter) return false;
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
              <StatusBadge
                status="live"
                label="Live"
                className="h-6 gap-1 border-[var(--status-live)] text-[var(--status-live)]"
              />
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 gap-1.5" onClick={() => setIsLive(!isLive)}>
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
                  timeRange === range ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
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
                <th className="text-left py-2 px-2 font-medium text-muted-foreground w-20">Time</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground w-48">Event Type</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground w-40">Service</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground w-20">Severity</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => {
                const config = getSeverityConfig(event.severity);
                const Icon = config.icon;

                return (
                  <tr
                    key={event.id}
                    className={cn("border-b border-border/50 hover:bg-secondary/30 transition-colors", config.bg)}
                  >
                    <td className="py-2 px-2 font-mono text-muted-foreground">{event.timestamp}</td>
                    <td className="py-2 px-2 font-mono">{event.eventType}</td>
                    <td className="py-2 px-2 text-muted-foreground truncate">{event.service}</td>
                    <td className="py-2 px-2">
                      <div className={cn("flex items-center gap-1", config.color)}>
                        <Icon className="size-3" />
                        {event.severity}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-muted-foreground truncate max-w-[300px]">{event.details}</td>
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
