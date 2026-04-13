"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { OptionsDataProvider } from "@/components/widgets/options/options-data-context";

function OptionsPageContent() {
  return (
    <OptionsDataProvider>
      <div className="h-full flex flex-col overflow-hidden p-2 min-h-0">
        <WidgetGrid tab="options" />
      </div>
    </OptionsDataProvider>
  );
}

export default function OptionsFuturesPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading options…</div>}>
      <OptionsPageContent />
    </Suspense>
  );
}
