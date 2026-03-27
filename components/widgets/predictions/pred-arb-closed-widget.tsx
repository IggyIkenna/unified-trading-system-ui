"use client";

import { CollapsibleSection } from "@/components/widgets/shared";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { PredClosedArbCard } from "./pred-arb-ui";
import { usePredictionsData } from "./predictions-data-context";

export function PredArbClosedWidget(_props: WidgetComponentProps) {
  const { closedArbs } = usePredictionsData();

  return (
    <CollapsibleSection title="Closed / Decayed Arbs" defaultOpen={false} count={closedArbs.length}>
      <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-1">
        {closedArbs.length === 0 ? (
          <p className="text-xs text-zinc-700 py-3 text-center">No closed arbs to show</p>
        ) : (
          closedArbs.map((arb) => <PredClosedArbCard key={arb.id} arb={arb} />)
        )}
      </div>
    </CollapsibleSection>
  );
}
