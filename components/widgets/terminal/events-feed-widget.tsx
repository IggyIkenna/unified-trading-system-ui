"use client";

import { Badge } from "@/components/ui/badge";
import type { TerminalEventDomain, TerminalEventSeverity } from "@/components/widgets/terminal/terminal-data-context";
import { useTerminalData } from "@/components/widgets/terminal/terminal-data-context";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

function severityBadgeVariant(s: TerminalEventSeverity): "secondary" | "warning" | "error" {
  if (s === "CRITICAL") return "error";
  if (s === "WARNING") return "warning";
  return "secondary";
}

function domainColor(d: TerminalEventDomain): string {
  switch (d) {
    case "EXECUTION":
      return "text-blue-400";
    case "RISK":
      return "text-amber-400";
    case "DATA":
      return "text-cyan-400";
    case "SYSTEM":
      return "text-red-400";
    case "STRATEGY":
      return "text-emerald-400";
  }
}

export function EventsFeedWidget(_props: WidgetComponentProps) {
  const { events, isLoadingEvents, errorEvents } = useTerminalData();

  if (isLoadingEvents) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground animate-pulse">
        Loading events…
      </div>
    );
  }

  if (errorEvents) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-rose-400">
        Failed to load events: {errorEvents}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No events to display</div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end px-3 pt-2 pb-1">
        <Badge variant="secondary" className="text-micro">
          {events.length} events
        </Badge>
      </div>
      <div className="flex-1 space-y-1 overflow-auto px-3 pb-3">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="flex items-start gap-2 rounded-sm border border-border/40 bg-muted/10 px-2 py-1.5"
          >
            <div className="text-micro font-mono text-muted-foreground whitespace-nowrap pt-0.5">{evt.timestamp}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-micro font-medium uppercase ${domainColor(evt.domain)}`}>{evt.domain}</span>
                <Badge variant={severityBadgeVariant(evt.severity)} className="text-nano px-1 py-0">
                  {evt.severity}
                </Badge>
                <span className="text-xs font-medium truncate">{evt.title}</span>
              </div>
              <div className="text-micro text-muted-foreground truncate">{evt.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
