"use client";

import { WidgetGrid } from "@/components/widgets/widget-grid";

export default function SAFTPage() {
  return (
    <div className="h-full flex flex-col overflow-auto p-2">
      <WidgetGrid tab="accounts" />
    </div>
  );
}
