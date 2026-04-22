"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { InstructionsDataProvider } from "@/components/widgets/instructions/instructions-data-context";
import { WidgetScroll } from "@/components/shared/widget-scroll";

function InstructionsPageContent() {
  return (
    <InstructionsDataProvider>
      <WidgetScroll viewportClassName="p-2">
        <WidgetGrid tab="instructions" />
      </WidgetScroll>
    </InstructionsDataProvider>
  );
}

export default function InstructionsPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading instructions...</div>}>
      <InstructionsPageContent />
    </Suspense>
  );
}
