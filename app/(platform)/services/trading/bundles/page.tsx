"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { BundlesDataProvider } from "@/components/widgets/bundles/bundles-data-context";
import { WidgetScroll } from "@/components/shared/widget-scroll";

function BundlesPageContent() {
  return (
    <BundlesDataProvider>
      <WidgetScroll viewportClassName="p-2">
        <WidgetGrid tab="bundles" />
      </WidgetScroll>
    </BundlesDataProvider>
  );
}

export default function BundleBuilderPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading bundles…</div>}>
      <BundlesPageContent />
    </Suspense>
  );
}
