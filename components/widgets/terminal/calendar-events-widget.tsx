"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { CalendarEventFeed } from "@/components/trading/calendar-event-feed";

export function CalendarEventsWidget(_props: WidgetComponentProps) {
  return (
    <div className="h-full">
      <CalendarEventFeed hideTitle />
    </div>
  );
}
