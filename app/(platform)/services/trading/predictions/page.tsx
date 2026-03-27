"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { PredictionsDataProvider } from "@/components/widgets/predictions/predictions-data-context";

import "@/components/widgets/predictions/register";

function PredictionsPageContent() {
  return (
    <PredictionsDataProvider>
      <div className="h-full flex flex-col overflow-auto p-2">
        <WidgetGrid tab="predictions" />
      </div>
    </PredictionsDataProvider>
  );
}

export default function PredictionMarketsPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading prediction markets...</div>}>
      <PredictionsPageContent />
    </Suspense>
  );
}
