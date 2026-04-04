"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { MarketsDataProvider } from "@/components/widgets/markets/markets-data-context";

function MarketsPageContent() {
  return (
    <MarketsDataProvider>
      <div className="h-full flex flex-col overflow-auto p-2">
        <WidgetGrid tab="markets" />
      </div>
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
