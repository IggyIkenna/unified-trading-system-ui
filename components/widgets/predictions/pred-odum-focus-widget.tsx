"use client";

import { OdumFocusBody } from "@/components/trading/predictions/odum-focus-tab";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { usePredictionsData } from "./predictions-data-context";

export function PredOdumFocusWidget(_props: WidgetComponentProps) {
  const { odumTypeFilter, setOdumTypeFilter, odumTfFilter, setOdumTfFilter } = usePredictionsData();

  return (
    <div className="h-full min-h-0 overflow-auto pr-1">
      <OdumFocusBody
        typeFilter={odumTypeFilter}
        setTypeFilter={setOdumTypeFilter}
        tfFilter={odumTfFilter}
        setTfFilter={setOdumTfFilter}
      />
    </div>
  );
}
