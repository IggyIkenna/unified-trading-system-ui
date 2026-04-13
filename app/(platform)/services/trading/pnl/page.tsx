"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { PnLDataProvider } from "@/components/widgets/pnl/pnl-data-context";

function PnlPageContent() {
  return (
    <PnLDataProvider>
      <div className="h-full flex flex-col overflow-auto p-2">
        <WidgetGrid tab="pnl" />
      </div>
    </PnLDataProvider>
  );
}

export default function PnlPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading P&amp;L…</div>}>
      <PnlPageContent />
    </Suspense>
  );
}
