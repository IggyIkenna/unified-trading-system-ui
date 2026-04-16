"use client";

import { TerminalDataProvider } from "@/components/widgets/terminal/terminal-data-context";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { useTerminalPageData } from "@/components/widgets/terminal/use-terminal-page-data";
import { AlertTriangle } from "lucide-react";

export default function TradingPage() {
  const { terminalData, errors } = useTerminalPageData();

  return (
    <div className="h-full bg-background flex flex-col">
      {(errors.tickers || errors.positions || errors.alerts) && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive mx-4 mt-4">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            Some data failed to load
            {errors.tickers ? " (tickers)" : ""}
            {errors.positions ? " (positions)" : ""}
            {errors.alerts ? " (alerts)" : ""}. Parts of the terminal may show stale or missing data.
          </span>
        </div>
      )}
      <div className="flex-1 overflow-auto p-2">
        <TerminalDataProvider value={terminalData}>
          <WidgetGrid tab="terminal" />
        </TerminalDataProvider>
      </div>
    </div>
  );
}
