"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { generateSpreadMatrix, SPREAD_EXPIRIES } from "@/lib/mocks/fixtures/options-futures-mock";
import type { ComboType, SelectedInstrument, SpreadAsset, SpreadCell } from "@/lib/types/options";
import { cn } from "@/lib/utils";
import * as React from "react";
import { formatNumber } from "@/lib/utils/formatters";

export function FuturesSpreadsTab({ onSelectInstrument }: { onSelectInstrument: (inst: SelectedInstrument) => void }) {
  const [spreadAsset, setSpreadAsset] = React.useState<SpreadAsset>("BTC");

  const matrix = React.useMemo(() => generateSpreadMatrix(spreadAsset), [spreadAsset]);

  const handleCellClick = (cell: SpreadCell) => {
    const longContract = `${spreadAsset}-${cell.longLabel.replace(/ /g, "")}`;
    const shortContract = `${spreadAsset}-${cell.shortLabel.replace(/ /g, "")}`;
    onSelectInstrument({
      name: `Long: ${longContract} / Short: ${shortContract}`,
      type: "spread",
      price: (cell.bid + cell.ask) / 2,
      longLeg: longContract,
      shortLeg: shortContract,
      spreadBid: cell.bid,
      spreadAsk: cell.ask,
    });
  };

  return (
    <div className="space-y-3">
      {/* Asset selector pills */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Asset:</span>
        <div className="flex items-center gap-0.5 rounded-lg border p-0.5 bg-muted/30">
          {(["BTC", "ETH"] as const).map((a) => (
            <Button
              key={a}
              variant={spreadAsset === a ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs font-mono"
              onClick={() => setSpreadAsset(a)}
            >
              {a}
            </Button>
          ))}
        </div>
      </div>

      {/* Calendar spread matrix */}
      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="w-full">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  Long Leg &darr; / Short Leg &rarr;
                </th>
                {SPREAD_EXPIRIES.map((exp) => (
                  <th key={exp} className="py-2 px-2 text-center font-mono font-medium text-xs whitespace-nowrap">
                    {exp === "Perpetual" ? "PERP" : exp}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SPREAD_EXPIRIES.map((longExp, longIdx) => (
                <tr key={longExp} className="border-b">
                  <td className="py-2 px-2 font-mono font-medium text-xs whitespace-nowrap bg-muted/20">
                    {longExp === "Perpetual" ? "PERP" : longExp}
                  </td>
                  {SPREAD_EXPIRIES.map((_, shortIdx) => {
                    const cell = matrix[longIdx][shortIdx];
                    if (!cell) {
                      return (
                        <td
                          key={shortIdx}
                          className={cn("py-2 px-2 text-center", shortIdx === longIdx ? "bg-muted/40" : "bg-muted/15")}
                        >
                          {shortIdx === longIdx ? <span className="text-muted-foreground/40">&mdash;</span> : null}
                        </td>
                      );
                    }
                    return (
                      <td
                        key={shortIdx}
                        className="py-1 px-1.5 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => handleCellClick(cell)}
                      >
                        <div className="rounded border bg-card/80 p-1.5 min-w-[90px] space-y-0.5">
                          <p className="text-[9px] text-muted-foreground font-medium truncate">{cell.spreadLabel}</p>
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono text-emerald-400 font-medium">
                              {cell.bid >= 0 ? "+" : ""}
                              {formatNumber(cell.bid, 1)}
                            </span>
                            <span className="font-mono text-muted-foreground">
                              {cell.ask >= 0 ? "+" : ""}
                              {formatNumber(cell.ask, 1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-2 text-[8px] text-muted-foreground/60">
                            <span>{cell.bidDepth} bid</span>
                            <span>{cell.askDepth} ask</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <p className="text-[10px] text-muted-foreground px-1">
        Click a cell to pre-fill a two-legged spread order in the Trade Panel. Values show net spread (far mark - near
        mark). Green = bid, grey = ask.
      </p>
    </div>
  );
}

// ---------- Options Combos ----------

const COMBO_TYPES: { value: ComboType; label: string }[] = [
  { value: "vertical-spread", label: "Vertical Spread" },
  { value: "straddle", label: "Straddle" },
  { value: "strangle", label: "Strangle" },
  { value: "calendar", label: "Calendar" },
  { value: "butterfly", label: "Butterfly" },
  { value: "risk-reversal", label: "Risk Reversal" },
];

const CALENDAR_EXPIRIES = ["26 JUN 26", "25 SEP 26", "25 DEC 26", "26 MAR 27", "26 JUN 27", "25 SEP 27"] as const;
