"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { useTerminalData } from "./terminal-data-context";
import dynamic from "next/dynamic";

const OptionsChain = dynamic(
  () => import("@/components/trading/options-chain").then((m) => ({ default: m.OptionsChain })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
        Loading options chain...
      </div>
    ),
  },
);

const VolSurfaceChart = dynamic(
  () => import("@/components/trading/vol-surface-chart").then((m) => ({ default: m.VolSurfaceChart })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        Loading vol surface...
      </div>
    ),
  },
);

export function TerminalOptionsWidget(_props: WidgetComponentProps) {
  const { selectedInstrument } = useTerminalData();

  return (
    <div className="absolute inset-0 flex flex-col gap-4 overflow-auto p-2">
      <OptionsChain underlying={selectedInstrument.symbol} venue={selectedInstrument.venue} />
      <VolSurfaceChart underlying={selectedInstrument.symbol} />
    </div>
  );
}
