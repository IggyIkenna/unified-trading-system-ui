"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { BundlesDataProvider } from "@/components/widgets/bundles/bundles-data-context";

import "@/components/widgets/bundles/register";

function BundlesPageContent() {
  return (
    <BundlesDataProvider>
      <div className="h-full flex flex-col overflow-auto p-2">
        <WidgetGrid tab="bundles" />
      </div>
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
