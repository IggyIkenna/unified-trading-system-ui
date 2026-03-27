"use client";

import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { ArbTab } from "@/components/trading/sports/arb-tab";
import { useSportsData } from "./sports-data-context";

export function SportsArbWidget(_props: WidgetComponentProps) {
  const { filteredFixtures, arbThreshold, setArbThreshold } = useSportsData();

  return (
    <div className="h-full min-h-0 flex flex-col">
      <ArbTab fixtures={filteredFixtures} arbThreshold={arbThreshold} onArbThresholdChange={setArbThreshold} />
    </div>
  );
}
