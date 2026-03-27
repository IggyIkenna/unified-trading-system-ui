"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { AlertsDataProvider } from "@/components/widgets/alerts/alerts-data-context";

import "@/components/widgets/alerts/register";

function AlertsPageContent() {
  return (
    <AlertsDataProvider>
      <div className="h-full flex flex-col overflow-auto p-2">
        <WidgetGrid tab="alerts" />
      </div>
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
