"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { InstructionsDataProvider } from "@/components/widgets/instructions/instructions-data-context";

function InstructionsPageContent() {
  return (
    <InstructionsDataProvider>
      <div className="h-full flex flex-col overflow-auto p-2">
        <WidgetGrid tab="instructions" />
      </div>
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
