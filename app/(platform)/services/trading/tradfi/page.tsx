"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { WidgetScroll } from "@/components/shared/widget-scroll";

/**
 * TradFi tab — P4 of the DART cross-asset-group market-data terminal plan.
 *
 * The first net-new asset_group surface added by the cross-asset-group
 * widening; mirrors the predictions / sports tab pattern (WidgetGrid +
 * WidgetScroll, no asset-group-specific data provider since the new
 * widgets each consume useAssetGroupData directly).
 */

function TradFiPageContent() {
  return (
    <WidgetScroll viewportClassName="p-2">
      <WidgetGrid tab="tradfi" />
    </WidgetScroll>
  );
}

export default function TradFiPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading TradFi…</div>}>
      <TradFiPageContent />
    </Suspense>
  );
}
