"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { PositionsDataProvider } from "@/components/widgets/positions/positions-data-context";

function PositionsPageContent() {
  return (
    <PositionsDataProvider>
      <div className="h-full flex flex-col overflow-auto p-2">
        <WidgetGrid tab="positions" />
      </div>
    </PositionsDataProvider>
  );
}

export default function PositionsPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading positions...</div>}>
      <PositionsPageContent />
    </Suspense>
  );
}
