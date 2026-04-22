"use client";

/**
 * G1.1 intentional split — trading/strategies renders the live book of
 * running strategies (per-strategy positions, fills, P&L, kill switches).
 * Its research counterpart at /services/research/strategies is the catalogue
 * enumeration surface, NOT a phase fork. Per Stage 3E §1.1, the phase prop
 * pattern applies only to surfaces that SHARE a conceptual role across
 * research / paper / live — these do not.
 */
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { StrategiesDataProvider } from "@/components/widgets/strategies/strategies-data-context";
import { StrategiesPageHeader } from "@/components/widgets/strategies/strategies-page-header";
import { WidgetScroll } from "@/components/shared/widget-scroll";

function StrategiesPageContent() {
  return (
    <StrategiesDataProvider>
      <div className="h-full flex flex-col min-h-0">
        <StrategiesPageHeader />
        <WidgetScroll viewportClassName="p-2">
          <WidgetGrid tab="strategies" />
        </WidgetScroll>
      </div>
    </StrategiesDataProvider>
  );
}

export default function StrategiesPage() {
  return <StrategiesPageContent />;
}
