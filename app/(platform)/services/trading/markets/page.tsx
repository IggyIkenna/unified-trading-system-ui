"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { MarketsDataProvider } from "@/components/widgets/markets/markets-data-context";
import { WidgetScroll } from "@/components/shared/widget-scroll";

function MarketsPageContent() {
  return (
    <MarketsDataProvider>
      <WidgetScroll viewportClassName="p-2">
        <WidgetGrid tab="markets" />
      </WidgetScroll>
    </MarketsDataProvider>
  );
}

export default function MarketsPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading markets...</div>}>
      <MarketsPageContent />
    </Suspense>
  );
}
