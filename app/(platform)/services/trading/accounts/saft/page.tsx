"use client";

import { WidgetGrid } from "@/components/widgets/widget-grid";
import { WidgetScroll } from "@/components/shared/widget-scroll";

export default function SAFTPage() {
  return (
    <WidgetScroll viewportClassName="p-2">
      <WidgetGrid tab="accounts" />
    </WidgetScroll>
  );
}
