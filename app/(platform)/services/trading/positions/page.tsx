"use client";

import Link from "next/link";
import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { PositionsDataProvider } from "@/components/widgets/positions/positions-data-context";

function PositionsPageContent() {
  return (
    <PositionsDataProvider>
      <div className="h-full flex flex-col overflow-auto p-2">
        <div className="px-2 pb-2 text-xs text-muted-foreground">
          <span>Position views:</span>{" "}
          <Link className="text-primary hover:underline" href="/services/trading/positions">
            Positions
          </Link>
          <span className="mx-1 opacity-50">·</span>
          <Link className="text-primary hover:underline" href="/services/trading/positions/trades">
            Trade history
          </Link>
        </div>
        <WidgetGrid tab="positions" />
      </div>
    </PositionsDataProvider>
  );
}

export default function PositionsPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading positions...</div>}>
      <PositionsPageContent />
    </Suspense>
  );
}
