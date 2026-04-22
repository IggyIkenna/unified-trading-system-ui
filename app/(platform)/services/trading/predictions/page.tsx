"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { PredictionsDataProvider } from "@/components/widgets/predictions/predictions-data-context";
import { WidgetScroll } from "@/components/shared/widget-scroll";

function PredictionsPageContent() {
  return (
    <PredictionsDataProvider>
      <WidgetScroll viewportClassName="p-2">
        <WidgetGrid tab="predictions" />
      </WidgetScroll>
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
