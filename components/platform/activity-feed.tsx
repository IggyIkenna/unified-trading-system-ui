"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MOCK_ACTIVITY } from "@/lib/mocks/fixtures/activity-feed";

export function ActivityFeed({
  maxItems = 6,
  visibleStages,
}: {
  maxItems?: number;
  /** If provided, only show events matching these stage labels */
  visibleStages?: string[];
}) {
  const filtered = visibleStages ? MOCK_ACTIVITY.filter((e) => visibleStages.includes(e.stage)) : MOCK_ACTIVITY;
  const events = filtered.slice(0, maxItems);

  return (
    <div className="space-y-1">
      {events.map((event) => {
        const Icon = event.icon;
        const content = (
          <div
            className={cn(
              "flex items-start gap-3 rounded-lg p-3 transition-colors",
              event.href && "hover:bg-accent/50 cursor-pointer",
            )}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/50">
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{event.title}</span>
                <Badge variant="outline" className={cn("text-[9px] shrink-0", event.stageColor)}>
                  {event.stage}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{event.description}</p>
            </div>
            <span className="text-[10px] text-muted-foreground/60 shrink-0 mt-1">{event.timestamp}</span>
          </div>
        );

        if (event.href) {
          return (
            <Link key={event.id} href={event.href} className="block">
              {content}
            </Link>
          );
        }
        return <React.Fragment key={event.id}>{content}</React.Fragment>;
      })}
    </div>
  );
}
