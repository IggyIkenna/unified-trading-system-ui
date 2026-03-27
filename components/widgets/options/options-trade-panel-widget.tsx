"use client";

import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { TradePanel } from "@/components/trading/options-futures-panel";
import { useOptionsData } from "./options-data-context";

export function OptionsTradePanelWidget(_props: WidgetComponentProps) {
  const { selectedInstrument } = useOptionsData();
  return <TradePanel instrument={selectedInstrument} />;
}
