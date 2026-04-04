"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { SportsDataProvider } from "@/components/widgets/sports/sports-data-context";

function SportsPageContent() {
  return (
    <SportsDataProvider>
      <div className="h-full flex flex-col overflow-auto p-2">
        <WidgetGrid tab="sports" />
      </div>
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
