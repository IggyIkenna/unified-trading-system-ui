"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { DeFiDataProvider } from "@/components/widgets/defi/defi-data-context";

function DeFiPageContent() {
  return (
    <DeFiDataProvider>
      <div className="h-full flex flex-col overflow-auto p-2">
        <WidgetGrid tab="defi" />
      </div>
    </DeFiDataProvider>
  );
}

export default function DeFiOpsPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading DeFi…</div>}>
      <DeFiPageContent />
    </Suspense>
  );
}
