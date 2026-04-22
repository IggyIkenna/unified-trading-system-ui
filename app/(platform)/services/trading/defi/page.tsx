"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { DeFiDataProvider } from "@/components/widgets/defi/defi-data-context";
import { WidgetScroll } from "@/components/shared/widget-scroll";

function DeFiPageContent() {
  return (
    <DeFiDataProvider>
      <WidgetScroll viewportClassName="p-2">
        <WidgetGrid tab="defi" />
      </WidgetScroll>
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
