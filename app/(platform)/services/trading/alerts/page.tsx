"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { AlertsDataProvider } from "@/components/widgets/alerts/alerts-data-context";
import { WidgetScroll } from "@/components/shared/widget-scroll";

function AlertsPageContent() {
  return (
    <AlertsDataProvider>
      <WidgetScroll viewportClassName="p-2">
        <WidgetGrid tab="alerts" />
      </WidgetScroll>
    </AlertsDataProvider>
  );
}

export default function AlertsPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading alerts...</div>}>
      <AlertsPageContent />
    </Suspense>
  );
}
