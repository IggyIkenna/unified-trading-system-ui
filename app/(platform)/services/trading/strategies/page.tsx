"use client";

import { WidgetGrid } from "@/components/widgets/widget-grid";
import { StrategiesDataProvider } from "@/components/widgets/strategies/strategies-data-context";
import { StrategiesPageHeader } from "@/components/widgets/strategies/strategies-page-header";

import "@/components/widgets/strategies/register";

function StrategiesPageContent() {
  return (
    <StrategiesDataProvider>
      <div className="h-full flex flex-col min-h-0">
        <StrategiesPageHeader />
        <div className="flex-1 overflow-auto p-2 min-h-0">
          <WidgetGrid tab="strategies" />
        </div>
      </div>
    </StrategiesDataProvider>
  );
}

export default function StrategiesPage() {
  return <StrategiesPageContent />;
}
