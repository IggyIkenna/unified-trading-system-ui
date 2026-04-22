"use client";

import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { PredClosedArbCard } from "./pred-arb-ui";
import { usePredictionsData } from "./predictions-data-context";

export function PredArbClosedWidget(_props: WidgetComponentProps) {
  const { closedArbs } = usePredictionsData();

  // PredictionsDataContext is synchronous (mock) — isLoading is always false.
  // When the context adds isLoading + error fields, wire them here.
  const isLoading = false;
  const error: string | null = null;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-muted-foreground">Loading closed arbs…</p>
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
    <CollapsibleSection title="Closed / Decayed Arbs" defaultOpen={false} count={closedArbs.length}>
      <WidgetScroll axes="vertical" className="max-h-[280px]" viewportClassName="flex flex-col gap-1.5 pr-1">
        {closedArbs.length === 0 ? (
          <p className="text-xs text-zinc-700 py-3 text-center">No closed arbs to show</p>
        ) : (
          closedArbs.map((arb) => <PredClosedArbCard key={arb.id} arb={arb} />)
        )}
      </WidgetScroll>
    </CollapsibleSection>
  );
}
