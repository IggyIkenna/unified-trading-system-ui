"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { SportsDataProvider } from "@/components/widgets/sports/sports-data-context";
import { WidgetScroll } from "@/components/shared/widget-scroll";

function SportsPageContent() {
  return (
    <SportsDataProvider>
      <WidgetScroll viewportClassName="p-2">
        <WidgetGrid tab="sports" />
      </WidgetScroll>
    </SportsDataProvider>
  );
}

export default function SportsBettingPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading sports…</div>}>
      <SportsPageContent />
    </Suspense>
  );
}
