"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  TrendingUp,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useEconomicResults,
  useCorporateActions,
} from "@/hooks/api/use-calendar";
import type {
  EconomicResultItem,
  CorporateActionItem,
} from "@/hooks/api/use-calendar";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatValue(value: number | null, unit: string): string {
  if (value === null) return "—";
  if (unit.includes("thousands")) return `${value.toLocaleString()}K`;
  if (unit.includes("billions")) return `$${value.toLocaleString()}B`;
  if (unit.includes("percent")) return `${value.toFixed(2)}%`;
  if (unit.includes("index")) return value.toFixed(1);
  return String(value);
}

function formatDelta(
  actual: number | null,
  previous: number | null,
): React.ReactNode {
  if (actual === null || previous === null) return null;
  const delta = actual - previous;
  const isPositive = delta > 0;
  return (
    <span
      className={cn(
        "text-xs ml-1",
        isPositive ? "text-green-500" : "text-red-500",
      )}
    >
      {isPositive ? "+" : ""}
      {delta.toFixed(2)}
    </span>
  );
}

function formatCountdown(releaseDate: string, releaseTime: string): string {
  try {
    const dt = new Date(`${releaseDate}T${releaseTime}:00Z`);
    const now = new Date();
    const diffMs = dt.getTime() - now.getTime();
    if (diffMs <= 0) return "now";
    const diffH = Math.floor(diffMs / 3_600_000);
    const diffD = Math.floor(diffH / 24);
    if (diffD > 0) return `in ${diffD}d ${diffH % 24}h`;
    return `in ${diffH}h`;
  } catch {
    return releaseDate;
  }
}

function surprisePct(
  actual: number | null,
  estimated: number | null,
): string | null {
  if (actual === null || estimated === null || estimated === 0) return null;
  const pct = ((actual - estimated) / Math.abs(estimated)) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Macro events tab
// ---------------------------------------------------------------------------

function MacroEventsTab() {
  const { data: events = [], isLoading } = useEconomicResults({
    days_back: 60,
  });

  const released = events.filter((e) => e.status === "released");
  const upcoming = events.filter((e) => e.status === "upcoming");

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        Loading macro events…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {upcoming.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase font-medium mb-1.5">
            Upcoming
          </p>
          <div className="space-y-1.5">
            {upcoming.map((evt) => (
              <MacroEventRow key={evt.id} event={evt} />
            ))}
          </div>
        </div>
      )}
      {released.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase font-medium mb-1.5 mt-3">
            Recent
          </p>
          <div className="space-y-1.5">
            {released.map((evt) => (
              <MacroEventRow key={evt.id} event={evt} />
            ))}
          </div>
        </div>
      )}
      {events.length === 0 && (
        <p className="text-sm text-muted-foreground">No events in range.</p>
      )}
    </div>
  );
}

function MacroEventRow({ event }: { event: EconomicResultItem }) {
  const isReleased = event.status === "released";
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <Badge
          variant={isReleased ? "secondary" : "outline"}
          className="text-[10px] font-semibold"
        >
          {event.event_type}
        </Badge>
        <span className="text-muted-foreground text-xs">
          {event.release_date}
        </span>
      </div>
      <div className="text-right">
        {isReleased ? (
          <span className="font-mono text-xs">
            {formatValue(event.actual_value, event.unit)}
            {formatDelta(event.actual_value, event.previous_value)}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatCountdown(event.release_date, event.release_time_utc)}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Corporate actions tab
// ---------------------------------------------------------------------------

function CorporateActionsTab() {
  const { data: actions = [], isLoading } = useCorporateActions({
    days_forward: 60,
  });

  const dividends = actions.filter((a) => a.event_type === "dividend");
  const earnings = actions.filter((a) => a.event_type === "earnings");
  const splits = actions.filter((a) => a.event_type === "split");

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        Loading corporate actions…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {earnings.length > 0 && (
        <CorporateActionSection title="Earnings" items={earnings} />
      )}
      {dividends.length > 0 && (
        <CorporateActionSection title="Dividends" items={dividends} />
      )}
      {splits.length > 0 && (
        <CorporateActionSection title="Splits" items={splits} />
      )}
      {actions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No corporate actions in range.
        </p>
      )}
    </div>
  );
}

function CorporateActionSection({
  title,
  items,
}: {
  title: string;
  items: CorporateActionItem[];
}) {
  const [open, setOpen] = React.useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase hover:text-foreground w-full">
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {title} ({items.length})
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1.5 mt-1.5">
          {items.map((item) => (
            <CorporateActionRow key={item.id} item={item} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CorporateActionRow({ item }: { item: CorporateActionItem }) {
  const isConfirmed = item.status === "confirmed";
  const surprise = surprisePct(item.actual_eps, item.estimated_eps);

  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-xs">{item.ticker}</span>
        <span className="text-muted-foreground text-xs">{item.event_date}</span>
        {isConfirmed ? (
          <Badge variant="secondary" className="text-[10px]">
            confirmed
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px]">
            upcoming
          </Badge>
        )}
      </div>
      <div className="text-right font-mono text-xs">
        {item.event_type === "dividend" && item.amount !== null && (
          <span>${item.amount.toFixed(2)}</span>
        )}
        {item.event_type === "earnings" && (
          <>
            {item.actual_eps !== null ? (
              <span>
                EPS {item.actual_eps.toFixed(2)}
                {surprise && (
                  <span
                    className={cn(
                      "ml-1",
                      surprise.startsWith("+")
                        ? "text-green-500"
                        : "text-red-500",
                    )}
                  >
                    ({surprise})
                  </span>
                )}
              </span>
            ) : item.estimated_eps !== null ? (
              <span className="text-muted-foreground">
                est. {item.estimated_eps.toFixed(2)}
              </span>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CalendarEventFeed({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(true);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn("w-full", className)}
    >
      <Card className="rounded-lg border">
        <CardHeader className="py-3 px-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Calendar Events
            </CardTitle>
            {open ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0">
            <Tabs defaultValue="macro">
              <TabsList className="h-7 mb-3">
                <TabsTrigger value="macro" className="text-xs h-6">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Macro
                </TabsTrigger>
                <TabsTrigger value="corporate" className="text-xs h-6">
                  <Calendar className="h-3 w-3 mr-1" />
                  Corporate
                </TabsTrigger>
              </TabsList>
              <TabsContent value="macro" className="mt-0">
                <MacroEventsTab />
              </TabsContent>
              <TabsContent value="corporate" className="mt-0">
                <CorporateActionsTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
