"use client";

import { OdumFocusBody } from "@/components/trading/predictions/odum-focus-tab";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { usePredictionsData } from "./predictions-data-context";

export function PredOdumFocusWidget(_props: WidgetComponentProps) {
  const { odumInstruments, odumTypeFilter, setOdumTypeFilter, odumTfFilter, setOdumTfFilter } = usePredictionsData();

  // PredictionsDataContext is synchronous (mock) — isLoading is always false.
  // When the context adds isLoading + error fields, wire them here.
  const isLoading = false;
  const error: string | null = null;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-muted-foreground">Loading ODUM instruments…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 pr-1">
      <OdumFocusBody
        instruments={odumInstruments}
        typeFilter={odumTypeFilter}
        setTypeFilter={setOdumTypeFilter}
        tfFilter={odumTfFilter}
        setTfFilter={setOdumTfFilter}
      />
    </div>
  );
}
