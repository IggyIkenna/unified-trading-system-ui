"use client";

import { FixtureDetailPanel } from "@/components/trading/sports/fixtures-detail-panel";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useSportsData } from "./sports-data-context";

export function SportsFixtureDetailWidget(_props: WidgetComponentProps) {
  const { selectedFixture, setSelectedFixtureId } = useSportsData();

  if (!selectedFixture) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center h-full min-h-[160px] border border-dashed border-border rounded-md bg-muted/10">
        <p className="text-sm font-semibold text-muted-foreground">No fixture selected</p>
        <p className="text-xs text-muted-foreground/80 mt-2 max-w-[240px]">
          Choose a match in the Fixtures widget for stats, timeline, odds, and trade panel.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-hidden flex flex-col border border-border rounded-md bg-card/30">
      <FixtureDetailPanel
        key={selectedFixture.id}
        fixture={selectedFixture}
        initialTab="stats"
        onClose={() => setSelectedFixtureId(null)}
        className="border-0 flex-1 min-h-0"
      />
    </div>
  );
}
